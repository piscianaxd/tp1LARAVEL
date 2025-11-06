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
import { PlayerService } from '../../services/player.service';
import { Track } from '../../models/track/track.model';
import { dtoToTrack } from '../../helpers/adapters';

interface Playlist {
  id: number;
  name_playlist: string;
  is_public: number; // ← Siempre number del backend (0 o 1)
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

  // Señales de estado
  loading = signal(true);
  error = signal<string | null>(null);
  playlists = signal<Playlist[]>([]);
  selectedPlaylist = signal<Playlist | null>(null);
  showPlaylistDetail = signal(false);

  // Modal crear playlist
  showCreatePlaylistModal = signal(false);
  creatingNewPlaylist = signal(false);
  newPlaylistName: string = '';
  newPlaylistIsPublic: boolean = true;
  
  // Modal editar playlist
  showEditPlaylistModal = signal(false);
  editingPlaylist = signal(false);
  editPlaylistName: string = '';
  editPlaylistIsPublic: boolean = true;
  selectedTrackForDeletion = signal<any>(null);

  // Menú contextual y mover canciones
  showContextMenu = signal(false);
  contextMenuPosition = signal({ x: 0, y: 0 });
  selectedTrackForContextMenu = signal<any>(null);
  selectedTrackIndex = signal<number>(-1);

  // Modal mover canciones
  showMoveToPlaylistModal = signal(false);
  selectedPlaylistForMove = signal<number | null>(null);
  availablePlaylistsForMove = signal<Playlist[]>([]);
  loadingMoveModal = signal(false);
  movingTrack = signal(false);

  // Paginación
  playlistPage = signal(0);
  playlistMaxPages = signal(3);

  // Propiedades privadas
  private songForNewPlaylist: SongForPlaylist | null = null;
  private playlistEventSubscription!: Subscription;
  private createPlaylistWithSongSubscription!: Subscription;

  // Servicios
  private playlistService = inject(PlaylistService);
  private playlistEventService = inject(PlaylistEventService);
  private player: PlayerService = inject(PlayerService);

  ngOnInit(): void {
    this.loadPlaylists();

    // Suscripción para recargar playlists cuando se guardan cambios
    this.playlistEventSubscription = this.playlistEventService.playlistSaved$.subscribe(() => {
      this.refreshPlaylists();
    });

    // Suscripción para crear playlists con canciones
    this.createPlaylistWithSongSubscription = this.playlistEventService.createPlaylistWithSong$.subscribe({
      next: (song) => {
        if (song) {
          this.songForNewPlaylist = song;
          this.openCreatePlaylistModal();
        }
      }
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

  // ========== GESTIÓN DE PLAYLISTS ==========

  openEditPlaylistModal(playlist: Playlist, event: Event) {
    event.stopPropagation();
    
    this.editPlaylistName = playlist.name_playlist || '';
    
    // Conversión CORRECTA: 0 = false, 1 = true
    this.editPlaylistIsPublic = playlist.is_public === 1;
    
    console.log('🎯 DEBUG Conversión:', {
      valorOriginal: playlist.is_public,
      tipoOriginal: typeof playlist.is_public,
      valorConvertido: this.editPlaylistIsPublic,
      tipoConvertido: typeof this.editPlaylistIsPublic
    });
    
    this.showEditPlaylistModal.set(true);
    document.body.classList.add('modal-active');
  }

  updatePlaylist() {
    const playlist = this.selectedPlaylist();
    if (!playlist) {
      this.error.set('No hay playlist seleccionada');
      return;
    }

    const name = this.editPlaylistName.trim();
    
    if (!name) {
      this.error.set('El nombre de la playlist es requerido');
      return;
    }

    // Si no hay cambios, simplemente cierra el modal
    const currentIsPublicBoolean = playlist.is_public === 1;
    if (name === playlist.name_playlist && this.editPlaylistIsPublic === currentIsPublicBoolean) {
      this.closeEditPlaylistModal();
      return;
    }

    this.editingPlaylist.set(true);
    this.error.set(null);

    // Convertir a número para el backend (1 = true, 0 = false)
    const isPublicNumber = this.editPlaylistIsPublic ? 1 : 0;

    const updateData = {
      name_playlist: name,
      is_public: isPublicNumber
    };

    console.log('Enviando datos de actualización:', {
      playlistId: playlist.id,
      data: updateData,
      url: `/api/playlists/${playlist.id}`
    });

    this.playlistService.updatePlaylist(playlist.id, updateData).subscribe({
      next: (response: any) => {
        console.log('Respuesta exitosa:', response);
        this.editingPlaylist.set(false);
        this.closeEditPlaylistModal();
        
        // Actualizar la playlist seleccionada
        const updatedPlaylist = { 
          ...playlist, 
          name_playlist: name,
          is_public: isPublicNumber,
          updated_at: new Date().toISOString()
        };
        this.selectedPlaylist.set(updatedPlaylist);
        
        // Actualizar la lista de playlists
        this.refreshPlaylists();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error completo:', err);
        console.error('Status:', err.status);
        console.error('Mensaje:', err.message);
        console.error('Error body:', err.error);
        
        this.editingPlaylist.set(false);
        
        let errorMessage = 'Error al actualizar la playlist';
        
        if (err.status === 500) {
          errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
        } else if (err.status === 400) {
          errorMessage = 'Datos inválidos para actualizar la playlist';
        } else if (err.status === 401) {
          errorMessage = 'No autorizado para editar esta playlist';
        } else if (err.status === 404) {
          errorMessage = 'Playlist no encontrada';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        
        this.error.set(errorMessage);
      }
    });
  }

  closeEditPlaylistModal() {
    this.showEditPlaylistModal.set(false);
    this.editingPlaylist.set(false);
    document.body.classList.remove('modal-active');
  }

  removeTrackFromPlaylistModal(track: any) {
    this.selectedTrackForDeletion.set(track);
    
    const songName = track.song?.name_song || 'esta canción';
    const playlistName = this.selectedPlaylist()?.name_playlist || 'la playlist';
    
    if (confirm(`¿Eliminar "${songName}" de la playlist "${playlistName}"?`)) {
      const playlist = this.selectedPlaylist();
      if (!playlist) return;

      this.playlistService.removeSongFromPlaylist(playlist.id, track.song.id).subscribe({
        next: () => {
          // Actualizar la playlist localmente
          const updatedSongs = playlist.songs.filter(s => s.song.id !== track.song.id);
          const updatedPlaylist = { ...playlist, songs: updatedSongs };
          this.selectedPlaylist.set(updatedPlaylist);
          
          // También actualizar la lista general de playlists
          this.updatePlaylistInList(updatedPlaylist);
          
          this.selectedTrackForDeletion.set(null);
          this.error.set(null);
        },
        error: (err) => {
          console.error('Error al eliminar canción:', err);
          this.error.set('Error al eliminar la canción de la playlist');
          this.selectedTrackForDeletion.set(null);
        }
      });
    } else {
      this.selectedTrackForDeletion.set(null);
    }
  }

  // Método auxiliar para actualizar una playlist en la lista
  private updatePlaylistInList(updatedPlaylist: Playlist) {
    const currentPlaylists = this.playlists();
    const updatedPlaylists = currentPlaylists.map(p => 
      p.id === updatedPlaylist.id ? updatedPlaylist : p
    );
    this.playlists.set(updatedPlaylists);
  }

  loadPlaylists() {
    this.loading.set(true);
    this.error.set(null);
    this.playlistPage.set(0);

    this.playlistService.getPlaylists().subscribe({
      next: (response: any) => {
        let playlistsData: any[] = [];
        
        if (Array.isArray(response)) {
          playlistsData = response;
        } else if (response && Array.isArray(response.data)) {
          playlistsData = response.data;
        } else if (response && Array.isArray(response.playlists)) {
          playlistsData = response.playlists;
        }

        this.playlists.set(playlistsData);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
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
      }
    });
  }

  refreshPlaylists() {
    this.loading.set(true);
    this.playlistService.getPlaylists().subscribe({
      next: (response: any) => {
        let playlistsData: any[] = [];
        
        if (Array.isArray(response)) {
          playlistsData = response;
        } else if (response && Array.isArray(response.data)) {
          playlistsData = response.data;
        } else if (response && Array.isArray(response.playlists)) {
          playlistsData = response.playlists;
        }

        this.playlists.set(playlistsData);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set('Error al actualizar las playlists');
        this.loading.set(false);
      }
    });
  }

  // ========== PAGINACIÓN ==========

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

  // ========== MODAL CREAR PLAYLIST ==========

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
    
    this.playlistService.createPlaylist({
      name_playlist: name,
      is_public: this.newPlaylistIsPublic
    }).subscribe({
      next: (response: any) => {
        const newPlaylistId = response.playlist?.id || response.id;
        
        if (this.songForNewPlaylist && newPlaylistId) {
          this.addSongToNewPlaylist(newPlaylistId);
        } else {
          this.creatingNewPlaylist.set(false);
          this.closeCreatePlaylistModal();
          this.loadPlaylists();
          this.error.set(null);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.creatingNewPlaylist.set(false);
        this.error.set('Error al crear la playlist');
      }
    });
  }

  private addSongToNewPlaylist(playlistId: number) {
    if (!this.songForNewPlaylist) {
      this.creatingNewPlaylist.set(false);
      return;
    }

    this.playlistService.addSongToPlaylist(playlistId, this.songForNewPlaylist.id).subscribe({
      next: () => {
        this.playlistEventService.notifyPlaylistCreated(playlistId);
        this.creatingNewPlaylist.set(false);
        this.closeCreatePlaylistModal();
        this.loadPlaylists();
        this.error.set(null);
        this.songForNewPlaylist = null;
      },
      error: (err: HttpErrorResponse) => {
        this.creatingNewPlaylist.set(false);
        this.error.set('Playlist creada pero error al agregar la canción');
        this.songForNewPlaylist = null;
        this.closeCreatePlaylistModal();
        this.loadPlaylists();
      }
    });
  }

  // ========== MENÚ CONTEXTUAL ==========

  onTrackContextMenu(event: MouseEvent, playlistSong: any, index: number) {
    event.preventDefault();
    event.stopPropagation();
    
    this.selectedTrackForContextMenu.set(playlistSong);
    this.selectedTrackIndex.set(index);
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    this.showContextMenu.set(true);
    
    setTimeout(() => {
      document.addEventListener('click', this.closeContextMenuOnClickOutside.bind(this));
      document.addEventListener('contextmenu', this.closeContextMenuOnRightClick.bind(this));
    });
  }

  private closeContextMenuOnClickOutside(event: MouseEvent) {
    const contextMenu = document.querySelector('.context-menu');
    if (contextMenu && !contextMenu.contains(event.target as Node)) {
      this.closeContextMenu();
      this.removeEventListeners();
    }
  }

  private closeContextMenuOnRightClick() {
    this.closeContextMenu();
    this.removeEventListeners();
  }

  private removeEventListeners() {
    document.removeEventListener('click', this.closeContextMenuOnClickOutside.bind(this));
    document.removeEventListener('contextmenu', this.closeContextMenuOnRightClick.bind(this));
  }

  closeContextMenu() {
    this.showContextMenu.set(false);
    this.selectedTrackForContextMenu.set(null);
    this.selectedTrackIndex.set(-1);
    this.removeEventListeners();
  }

  onContextMenuPlay() {
    if (this.selectedTrackForContextMenu()) {
      this.playSong(this.selectedTrackForContextMenu().song, new Event('click'));
    }
    this.closeContextMenu();
  }

  onContextMenuDelete() {
    if (this.selectedTrackForContextMenu() && this.selectedPlaylist()) {
      this.removeTrackFromPlaylist();
    }
    this.closeContextMenu();
  }

  onContextMenuMove() {
    this.openMoveToPlaylistModal();
  }

  private removeTrackFromPlaylist() {
    const track = this.selectedTrackForContextMenu();
    const playlist = this.selectedPlaylist();
    
    if (!track || !playlist) return;

    if (confirm(`¿Eliminar "${track.song.name_song}" de la playlist?`)) {
      this.playlistService.removeSongFromPlaylist(playlist.id, track.song.id).subscribe({
        next: () => {
          this.refreshPlaylists();
          if (this.selectedPlaylist()) {
            const updatedPlaylist = { ...this.selectedPlaylist()! };
            updatedPlaylist.songs = updatedPlaylist.songs.filter(s => s.song.id !== track.song.id);
            this.selectedPlaylist.set(updatedPlaylist);
          }
        },
        error: (err) => {
          this.error.set('Error al eliminar la canción');
        }
      });
    }
  }

  // ========== MOVER CANCIONES ENTRE PLAYLISTS ==========

  openMoveToPlaylistModal() {
    this.loadingMoveModal.set(true);
    this.showMoveToPlaylistModal.set(true);
    document.body.classList.add('modal-active');
    
    this.playlistService.getPlaylists().subscribe({
      next: (response: any) => {
        let allPlaylists: any[] = [];
        
        if (Array.isArray(response)) {
          allPlaylists = response;
        } else if (response && Array.isArray(response.data)) {
          allPlaylists = response.data;
        } else if (response && Array.isArray(response.playlists)) {
          allPlaylists = response.playlists;
        }

        const currentPlaylistId = this.selectedPlaylist()?.id;
        const availablePlaylists = allPlaylists.filter(p => p.id !== currentPlaylistId);
        
        this.availablePlaylistsForMove.set(availablePlaylists);
        this.loadingMoveModal.set(false);
      },
      error: (err) => {
        this.loadingMoveModal.set(false);
        this.error.set('Error al cargar las playlists');
      }
    });
  }

  closeMoveToPlaylistModal() {
    this.showMoveToPlaylistModal.set(false);
    this.selectedPlaylistForMove.set(null);
    this.availablePlaylistsForMove.set([]);
    this.loadingMoveModal.set(false);
    this.movingTrack.set(false);
    document.body.classList.remove('modal-active');
  }

  selectPlaylistForMove(playlistId: number) {
    this.selectedPlaylistForMove.set(playlistId);
  }

  createNewPlaylistForMove() {
    const track = this.selectedTrackForContextMenu();
    
    if (!track) return;

    this.closeMoveToPlaylistModal();
    
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
    
    if (!targetPlaylistId) {
      this.error.set('Selecciona una playlist destino');
      return;
    }
    
    const track = this.selectedTrackForContextMenu();
    if (!track) {
      this.error.set('Error: No se encontró la canción seleccionada');
      return;
    }

    this.movingTrack.set(true);

    this.playlistService.addSongToPlaylist(targetPlaylistId, track.song.id).subscribe({
      next: () => {
        const currentPlaylistId = this.selectedPlaylist()?.id;
        if (currentPlaylistId) {
          this.playlistService.removeSongFromPlaylist(currentPlaylistId, track.song.id).subscribe({
            next: () => {
              this.movingTrack.set(false);
              this.closeMoveToPlaylistModal();
              this.refreshPlaylists();
              
              if (this.selectedPlaylist()) {
                const updatedPlaylist = { ...this.selectedPlaylist()! };
                updatedPlaylist.songs = updatedPlaylist.songs.filter(s => s.song.id !== track.song.id);
                this.selectedPlaylist.set(updatedPlaylist);
              }
              
              this.error.set(null);
            },
            error: () => {
              this.movingTrack.set(false);
              this.error.set('Canción movida pero no se pudo eliminar de la playlist original');
              this.closeMoveToPlaylistModal();
              this.refreshPlaylists();
            }
          });
        } else {
          this.movingTrack.set(false);
          this.closeMoveToPlaylistModal();
          this.refreshPlaylists();
        }
      },
      error: (addErr) => {
        this.movingTrack.set(false);
        this.error.set('Error al mover la canción: ' + (addErr.error?.message || 'Error desconocido'));
      }
    });
  }

  // ========== MÉTODOS AUXILIARES ==========

  getSafeSongInfo(playlistSong: any): { name: string, artist: string, album: string, duration: string } {
    // Manejar diferentes estructuras de datos
    const song = playlistSong?.song || playlistSong || {};
    
    return {
      name: song.name_song || song.name || song.title || 'Canción desconocida',
      artist: song.artist_song || song.artist || song.artist_name || 'Artista desconocido',
      album: song.album_song || song.album || song.album_name || 'Álbum desconocido',
      duration: this.formatDuration(song.duration || song.duration_seconds || song.length)
    };
  }

  // Método para obtener información de playlist segura
  getSafePlaylistInfo(playlist: Playlist | null): { name: string, songCount: number, isPublic: boolean } {
    if (!playlist) {
      return { name: 'Playlist no disponible', songCount: 0, isPublic: true };
    }
    
    return {
      name: playlist.name_playlist || 'Playlist sin nombre',
      songCount: playlist.songs ? playlist.songs.length : 0,
      isPublic: playlist.is_public === 1 // ← Convertir number a boolean
    };
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
          this.loadPlaylists();
          if (this.selectedPlaylist()?.id === playlist.id) {
            this.closePlaylist();
          }
        },
        error: (err) => {
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

  // Método para formatear la duración de forma más robusta
  formatDuration(seconds: number | string | undefined): string {
    if (!seconds) return '0:00';
    
    const secs = typeof seconds === 'string' ? parseInt(seconds) : seconds;
    if (isNaN(secs)) return '0:00';
    
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  }

  // Manejo de errores de imágenes
  noImg = new Set<number>();
  
  onImgError(ev: Event, song: any) {
    if (song && song.id) {
      this.noImg.add(song.id);
    }
  }

  // Reproducir playlist
  playPlaylist(playlist: {
    songs: Array<{ song: any }>;
  }, ev?: Event) {
    if (ev) ev.stopPropagation();

    const queue: Track[] = (playlist.songs ?? [])
      .map(ps => ps?.song)
      .filter(Boolean)
      .map(dtoToTrack);

    if (!queue.length) return;
    this.player.playNow(queue[0], queue);
  }

  playSong(songDto: any, ev?: Event) {
    if (ev) ev.stopPropagation();

    // armamos la cola con TODAS las canciones visibles de esa playlist
    const current = this.selectedPlaylist?.() ?? null;
    const list = current?.songs ?? [];

    const queue: Track[] = list
      .map((ps: any) => ps?.song)
      .filter(Boolean)
      .map(dtoToTrack);

    const currentTrack = dtoToTrack(songDto);
    this.player.playNow(currentTrack, queue);
  }
}