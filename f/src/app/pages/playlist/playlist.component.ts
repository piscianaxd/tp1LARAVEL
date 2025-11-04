import { Component, OnInit, OnDestroy, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PlaylistService } from '../../services/playlist.service';
import { PlaylistEventService, SongForPlaylist } from '../../services/playlist-event.service';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { HttpErrorResponse } from '@angular/common/http';
import { TrackContextComponent } from '../track-context/track-context.component';

interface Playlist {
  id: number;
  name_playlist: string;
  is_public: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
  songs: any[];
}

@Component({
  selector: 'app-playlists',
  standalone: true,
  imports: [CommonModule, MediaUrlPipe, RouterModule, FormsModule, TrackContextComponent],
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.css']
})
export class PlaylistsComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  loading = signal(true);
  error = signal<string | null>(null);
  playlists = signal<Playlist[]>([]);
  
  selectedPlaylist = signal<Playlist | null>(null);
  showPlaylistDetail = signal(false);

  showCreatePlaylistModal = signal(false);
  creatingNewPlaylist = signal(false);
  newPlaylistName: string = '';
  newPlaylistIsPublic: boolean = true;

  // CORREGIDO: Propiedad para guardar la canción
  private songForNewPlaylist: SongForPlaylist | null = null;

  // Señales para paginación
  playlistPage = signal(0);
  playlistMaxPages = signal(3);

  // NUEVO: Señales para el menú contextual y mover canciones
  showContextMenu = signal(false);
  contextMenuPosition = signal({ x: 0, y: 0 });
  selectedTrackForContextMenu = signal<any>(null);
  selectedTrackIndex = signal<number>(-1);

  showMoveToPlaylistModal = signal(false);
  selectedPlaylistForMove = signal<number | null>(null);
  availablePlaylistsForMove = signal<Playlist[]>([]);
  loadingMoveModal = signal(false);
  movingTrack = signal(false);

  // NUEVA: Propiedad para guardar la canción específicamente para el modal de mover
  private trackForMoveModal: any = null;

  private playlistEventSubscription!: Subscription;
  private createPlaylistWithSongSubscription!: Subscription;

  private playlistService = inject(PlaylistService);
  private playlistEventService = inject(PlaylistEventService);

  constructor() {
    console.log('🎵 PlaylistsComponent inicializado');
  }

  ngOnInit(): void {
    console.log('🎵 PlaylistsComponent ngOnInit ejecutado');
    this.loadPlaylists();

    this.playlistEventSubscription = this.playlistEventService.playlistSaved$.subscribe(() => {
      console.log('🔄 Evento recibido: recargando playlists...');
      this.refreshPlaylists();
    });

    // CORREGIDO: Suscribirse al evento de crear playlist con canción
    this.createPlaylistWithSongSubscription = this.playlistEventService.createPlaylistWithSong$.subscribe((song) => {
      console.log('🎵 Evento recibido: crear playlist con canción:', song);
      this.songForNewPlaylist = song;
      this.openCreatePlaylistModal();
    });
  }

  ngOnDestroy() {
    if (this.playlistEventSubscription) {
      this.playlistEventSubscription.unsubscribe();
    }
    if (this.createPlaylistWithSongSubscription) {
      this.createPlaylistWithSongSubscription.unsubscribe();
    }
  }

  // NUEVO: Métodos para el menú contextual

  onTrackContextMenu(event: MouseEvent, playlistSong: any, index: number) {
    console.log('🖱️ Click derecho detectado en canción:', playlistSong.song?.name_song);
    event.preventDefault();
    event.stopPropagation();
    
    this.selectedTrackForContextMenu.set(playlistSong);
    this.selectedTrackIndex.set(index);
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    this.showContextMenu.set(true);
    console.log('📋 Menú contextual mostrado');
    
    // Agregar listener para cerrar el menú al hacer click fuera
    setTimeout(() => {
      document.addEventListener('click', this.closeContextMenuOnClickOutside.bind(this));
      document.addEventListener('contextmenu', this.closeContextMenuOnRightClick.bind(this));
    });
  }

  private closeContextMenuOnClickOutside(event: MouseEvent) {
    const contextMenu = document.querySelector('.context-menu');
    if (contextMenu && !contextMenu.contains(event.target as Node)) {
      console.log('👆 Click fuera del menú detectado, cerrando menú');
      this.closeContextMenu();
      this.removeEventListeners();
    }
  }

  private closeContextMenuOnRightClick(event: MouseEvent) {
    console.log('🖱️ Click derecho detectado, cerrando menú');
    this.closeContextMenu();
    this.removeEventListeners();
  }

  private removeEventListeners() {
    document.removeEventListener('click', this.closeContextMenuOnClickOutside.bind(this));
    document.removeEventListener('contextmenu', this.closeContextMenuOnRightClick.bind(this));
  }

  closeContextMenu() {
    console.log('❌ Cerrando menú contextual');
    this.showContextMenu.set(false);
    this.selectedTrackForContextMenu.set(null);
    this.selectedTrackIndex.set(-1);
    this.removeEventListeners();
  }

  onContextMenuPlay() {
    console.log('🎵 Reproducir desde menú contextual');
    if (this.selectedTrackForContextMenu()) {
      this.playSong(this.selectedTrackForContextMenu().song, new Event('click'));
    }
    this.closeContextMenu();
  }

  onContextMenuDelete() {
    console.log('🗑️ Eliminar desde menú contextual');
    if (this.selectedTrackForContextMenu() && this.selectedPlaylist()) {
      this.removeTrackFromPlaylist();
    }
    this.closeContextMenu();
  }

  onContextMenuMove() {
    console.log('📁 6. Evento MOVE recibido del menú contextual');
    console.log('📁 Track seleccionado:', this.selectedTrackForContextMenu());
    
    // NO cerrar el menú aquí todavía - mantener la referencia
    this.openMoveToPlaylistModal();
  }
  private removeTrackFromPlaylist() {
    const track = this.selectedTrackForContextMenu();
    const playlist = this.selectedPlaylist();
    
    if (!track || !playlist) return;

    if (confirm(`¿Eliminar "${track.song.name_song}" de la playlist?`)) {
      this.playlistService.removeSongFromPlaylist(playlist.id, track.song.id).subscribe({
        next: () => {
          console.log('🗑️ Canción eliminada de la playlist');
          this.refreshPlaylists();
          // Actualizar la playlist actual
          if (this.selectedPlaylist()) {
            const updatedPlaylist = { ...this.selectedPlaylist()! };
            updatedPlaylist.songs = updatedPlaylist.songs.filter(s => s.song.id !== track.song.id);
            this.selectedPlaylist.set(updatedPlaylist);
          }
        },
        error: (err) => {
          console.error('❌ Error eliminando canción:', err);
          this.error.set('Error al eliminar la canción');
        }
      });
    }
  }

  // NUEVO: Métodos para mover canciones entre playlists
 openMoveToPlaylistModal() {
  console.log('📋 Abriendo modal para mover canción');
  console.log('📋 Track disponible:', this.selectedTrackForContextMenu());
  
  // Solo establecer el estado del modal, NO cerrar el menú todavía
  this.loadingMoveModal.set(true);
  this.showMoveToPlaylistModal.set(true);
  document.body.classList.add('modal-active');
  
  // El menú se cerrará automáticamente cuando se haga click fuera
  
  // Cargar todas las playlists excepto la actual
  this.playlistService.getPlaylists().subscribe({
    next: (response: any) => {
      console.log('✅ Playlists cargadas para mover:', response);
      
      let allPlaylists: any[] = [];
      
      if (Array.isArray(response)) {
        allPlaylists = response;
      } else if (response && Array.isArray(response.data)) {
        allPlaylists = response.data;
      } else if (response && Array.isArray(response.playlists)) {
        allPlaylists = response.playlists;
      }

      // Filtrar la playlist actual
      const currentPlaylistId = this.selectedPlaylist()?.id;
      const availablePlaylists = allPlaylists.filter(p => p.id !== currentPlaylistId);
      
      console.log(`📊 Playlists disponibles para mover: ${availablePlaylists.length}`);
      this.availablePlaylistsForMove.set(availablePlaylists);
      this.loadingMoveModal.set(false);
    },
    error: (err) => {
      console.error('❌ Error cargando playlists:', err);
      this.loadingMoveModal.set(false);
      this.error.set('Error al cargar las playlists');
    }
  });
}

  closeMoveToPlaylistModal() {
    console.log('❌ Cerrando modal de mover');
    this.showMoveToPlaylistModal.set(false);
    this.selectedPlaylistForMove.set(null);
    this.availablePlaylistsForMove.set([]);
    this.loadingMoveModal.set(false);
    this.movingTrack.set(false);
    // Limpiar la canción guardada para el modal
    this.trackForMoveModal = null;
    document.body.classList.remove('modal-active');
  }

  selectPlaylistForMove(playlistId: number) {
    this.selectedPlaylistForMove.set(playlistId);
  }

  createNewPlaylistForMove() {
    // Guardar la referencia ANTES de cerrar el modal
    const track = this.selectedTrackForContextMenu();
    
    if (!track) {
      console.error('❌ Error: No hay canción seleccionada para mover');
      return;
    }

    console.log('🎵 Creando nueva playlist para canción:', track.song?.name_song);

    // Cerrar modal actual
    this.closeMoveToPlaylistModal();
    
    // Usar el mismo sistema que en add-to-playlist
    this.playlistEventService.openCreatePlaylistWithSong({
      id: track.song.id,
      name_song: track.song.name_song,
      artist_song: track.song.artist_song,
      album_song: track.song.album_song,
      art_work_song: track.song.art_work_song,
      duration: track.song.duration
    });
  }

  moveTrackToPlaylist() {
    const targetPlaylistId = this.selectedPlaylistForMove();
    
    console.log('🔍 Estado actual para mover:', {
      targetPlaylistId,
      trackForMoveModal: this.trackForMoveModal ? this.trackForMoveModal.song?.name_song : 'null'
    });

    if (!targetPlaylistId) {
      console.error('❌ No se seleccionó playlist destino');
      this.error.set('Selecciona una playlist destino');
      return;
    }
    
    if (!this.trackForMoveModal) {
      console.error('❌ No hay canción guardada para mover');
      this.error.set('Error: No se encontró la canción seleccionada');
      return;
    }

    const track = this.trackForMoveModal;
    console.log('🚚 Moviendo canción a playlist:', {
      targetPlaylistId,
      song: track.song?.name_song,
      songId: track.song?.id,
      currentPlaylist: this.selectedPlaylist()?.name_playlist
    });

    this.movingTrack.set(true);

    // Primero agregar a la nueva playlist
    this.playlistService.addSongToPlaylist(targetPlaylistId, track.song.id).subscribe({
      next: (addResponse) => {
        console.log('✅ Canción agregada a nueva playlist:', addResponse);
        
        // Luego eliminar de la playlist actual
        const currentPlaylistId = this.selectedPlaylist()?.id;
        if (currentPlaylistId) {
          this.playlistService.removeSongFromPlaylist(currentPlaylistId, track.song.id).subscribe({
            next: (removeResponse) => {
              console.log('✅ Canción eliminada de playlist original');
              this.movingTrack.set(false);
              this.closeMoveToPlaylistModal();
              this.refreshPlaylists();
              
              // Actualizar la vista actual
              if (this.selectedPlaylist()) {
                const updatedPlaylist = { ...this.selectedPlaylist()! };
                updatedPlaylist.songs = updatedPlaylist.songs.filter(s => s.song.id !== track.song.id);
                this.selectedPlaylist.set(updatedPlaylist);
              }
              
              this.error.set(null);
            },
            error: (removeErr) => {
              console.error('❌ Error eliminando de playlist original:', removeErr);
              this.movingTrack.set(false);
              this.error.set('Canción movida pero no se pudo eliminar de la playlist original');
              this.closeMoveToPlaylistModal();
              this.refreshPlaylists();
            }
          });
        } else {
          console.error('❌ No se encontró la playlist actual');
          this.movingTrack.set(false);
          this.closeMoveToPlaylistModal();
          this.refreshPlaylists();
        }
      },
      error: (addErr) => {
        console.error('❌ Error agregando a nueva playlist:', addErr);
        this.movingTrack.set(false);
        this.error.set('Error al mover la canción: ' + (addErr.error?.message || 'Error desconocido'));
      }
    });
  }

  // Resto de los métodos permanecen igual...
  nextPage() {
    const nextPage = this.playlistPage() + 1;
    if (nextPage < this.playlistMaxPages()) {
      this.playlistPage.set(nextPage);
    }
  }

  prevPage() {
    const prevPage = this.playlistPage() - 1;
    if (prevPage >= 0) {
      this.playlistPage.set(prevPage);
    }
  }

  getCurrentPlaylists(): Playlist[] {
    const allPlaylists = this.playlists();
    const startIndex = this.playlistPage() * 6;
    return allPlaylists.slice(startIndex, startIndex + 6);
  }

  canGoNext(): boolean {
    return this.playlistPage() < this.playlistMaxPages() - 1;
  }

  canGoPrev(): boolean {
    return this.playlistPage() > 0;
  }

  refreshPlaylists() {
    console.log('🔄 Refrescando lista de playlists...');
    this.loading.set(true);
    this.error.set(null);

    this.playlistService.getPlaylists().subscribe({
      next: (response: any) => {
        console.log('✅ Playlists actualizadas:', response);
        
        let playlistsData: any[] = [];
        
        if (Array.isArray(response)) {
          playlistsData = response;
        } else if (response && Array.isArray(response.data)) {
          playlistsData = response.data;
        } else if (response && Array.isArray(response.playlists)) {
          playlistsData = response.playlists;
        } else {
          console.warn('⚠️ Formato de respuesta inesperado:', response);
          playlistsData = [];
        }

        console.log(`📊 Se encontraron ${playlistsData.length} playlists después de actualizar`);
        this.playlists.set(playlistsData);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error actualizando playlists:', err);
        this.error.set('Error al actualizar las playlists');
        this.loading.set(false);
      }
    });
  }

  loadPlaylists() {
    console.log('🔄 Cargando playlists del usuario...');
    this.loading.set(true);
    this.error.set(null);
    this.playlistPage.set(0);

    this.playlistService.getPlaylists().subscribe({
      next: (response: any) => {
        console.log('✅ Playlists cargadas exitosamente:', response);
        
        let playlistsData: any[] = [];
        
        if (Array.isArray(response)) {
          playlistsData = response;
        } else if (response && Array.isArray(response.data)) {
          playlistsData = response.data;
        } else if (response && Array.isArray(response.playlists)) {
          playlistsData = response.playlists;
        } else {
          console.warn('⚠️ Formato de respuesta inesperado:', response);
          playlistsData = [];
        }

        console.log(`📊 Se encontraron ${playlistsData.length} playlists`);
        this.playlists.set(playlistsData);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error cargando playlists:', err);
        
        let errorMessage = 'No se pudieron cargar las playlists.';
        if (err.status === 401) {
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (err.status === 404) {
          errorMessage = 'No se encontraron playlists.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
        
        this.loadMockPlaylists();
      }
    });
  }

  private loadMockPlaylists() {
    console.log('🔄 Cargando playlists de prueba...');
    const mockPlaylists: Playlist[] = [
      {
        id: 1,
        name_playlist: 'Mis Favoritas',
        is_public: true,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        songs: [
          {
            song: {
              id: 101,
              name_song: 'Canción Ejemplo 1',
              artist_song: 'Artista 1',
              album_song: 'Álbum 1',
              art_work_song: 'cover1.jpg',
              duration: 180
            }
          }
        ]
      },
      {
        id: 2,
        name_playlist: 'Para Estudiar',
        is_public: false,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        songs: [
          {
            song: {
              id: 102,
              name_song: 'Música Relajante',
              artist_song: 'Artista 2', 
              album_song: 'Álbum 2',
              art_work_song: 'cover2.jpg',
              duration: 240
            }
          }
        ]
      },
      {
        id: 3,
        name_playlist: 'Party Time',
        is_public: true,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        songs: []
      }
    ];
    
    this.playlists.set(mockPlaylists);
    console.log('✅ Playlists de prueba cargadas:', mockPlaylists.length);
  }

  openCreatePlaylistModal() {
    if (this.songForNewPlaylist) {
      this.newPlaylistName = `${this.songForNewPlaylist.name_song} - Favoritas`;
    } else {
      this.newPlaylistName = '';
    }
    this.newPlaylistIsPublic = true;
    this.showCreatePlaylistModal.set(true);
    document.body.classList.add('modal-active');
  }

  closeCreatePlaylistModal() {
    this.showCreatePlaylistModal.set(false);
    this.newPlaylistName = '';
    this.newPlaylistIsPublic = true;
    this.songForNewPlaylist = null;
    document.body.classList.remove('modal-active');
  }

  createNewPlaylist() {
    const name = this.newPlaylistName.trim();
    
    if (!name) {
      this.error.set('El nombre de la playlist es requerido');
      return;
    }

    this.creatingNewPlaylist.set(true);
    
    console.log('📤 Creando nueva playlist...');
    this.playlistService.createPlaylist({
      name_playlist: name,
      is_public: this.newPlaylistIsPublic
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Nueva playlist creada:', response);
        
        const newPlaylistId = response.playlist?.id || response.id;
        console.log('🎵 ID de nueva playlist:', newPlaylistId);
        console.log('🎵 Canción para agregar:', this.songForNewPlaylist);
        
        if (this.songForNewPlaylist && newPlaylistId) {
          console.log('📤 Agregando canción a nueva playlist...');
          this.addSongToNewPlaylist(newPlaylistId);
        } else {
          console.log('ℹ️ No hay canción para agregar o no se obtuvo ID de playlist');
          this.creatingNewPlaylist.set(false);
          this.closeCreatePlaylistModal();
          this.loadPlaylists();
          this.error.set(null);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error creando playlist:', err);
        this.creatingNewPlaylist.set(false);
        this.error.set('Error al crear la playlist');
      }
    });
  }

  private addSongToNewPlaylist(playlistId: number) {
    if (!this.songForNewPlaylist) {
      console.error('❌ No hay canción para agregar');
      this.creatingNewPlaylist.set(false);
      return;
    }

    console.log('🎵 Agregando canción a playlist:', {
      playlistId: playlistId,
      songId: this.songForNewPlaylist.id,
      songName: this.songForNewPlaylist.name_song
    });

    this.playlistService.addSongToPlaylist(playlistId, this.songForNewPlaylist.id).subscribe({
      next: (response) => {
        console.log('✅ Canción agregada a nueva playlist:', response);
        
        this.playlistEventService.notifyPlaylistCreated(playlistId);
        
        this.creatingNewPlaylist.set(false);
        this.closeCreatePlaylistModal();
        this.loadPlaylists();
        this.error.set(null);
        this.songForNewPlaylist = null;
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error agregando canción a nueva playlist:', err);
        this.creatingNewPlaylist.set(false);
        this.error.set('Playlist creada pero error al agregar la canción');
        this.songForNewPlaylist = null;
        
        this.closeCreatePlaylistModal();
        this.loadPlaylists();
      }
    });
  }

  openPlaylist(playlist: Playlist) {
    this.selectedPlaylist.set(playlist);
    this.showPlaylistDetail.set(true);
  }

  closePlaylist() {
    this.showPlaylistDetail.set(false);
    this.selectedPlaylist.set(null);
  }

  deletePlaylist(playlist: Playlist, event: Event) {
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${playlist.name_playlist}"?`)) {
      this.playlistService.deletePlaylist(playlist.id).subscribe({
        next: () => {
          console.log('🗑️ Playlist eliminada:', playlist.name_playlist);
          this.loadPlaylists();
          if (this.selectedPlaylist()?.id === playlist.id) {
            this.closePlaylist();
          }
        },
        error: (err) => {
          console.error('❌ Error eliminando playlist:', err);
          this.error.set('Error al eliminar la playlist');
        }
      });
    }
  }

  getPlaylistCover(playlist: Playlist): string {
    if (playlist.songs && playlist.songs.length > 0 && playlist.songs[0].song?.art_work_song) {
      return playlist.songs[0].song.art_work_song;
    }
    return '';
  }

  getSongCount(playlist: Playlist): string {
    const count = playlist.songs ? playlist.songs.length : 0;
    return count === 1 ? '1 canción' : `${count} canciones`;
  }

  noImg = new Set<number>();
  
  bust(id: number) {
    return `?v=${id}`;
  }

  onImgError(ev: Event, song: any) {
    if (song && song.id) {
      this.noImg.add(song.id);
    }
    console.warn('🖼️ IMG ERROR:', (ev.target as HTMLImageElement).currentSrc);
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  playPlaylist(playlist: Playlist, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    console.log('▶️ Reproducir playlist:', playlist.name_playlist, playlist.songs);
  }

  playSong(song: any, event: Event) {
    event.stopPropagation();
    console.log('▶️ Reproducir canción:', song);
  }
}