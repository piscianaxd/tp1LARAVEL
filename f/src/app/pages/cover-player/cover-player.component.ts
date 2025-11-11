import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { PlayerService } from '../../services/player.service';
import { PlayerEventsService } from '../../services/player-events.service';
import { PlaylistService } from '../../services/playlist.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { dtoToTrack } from '../../helpers/adapters';
import { Track } from '../../models/track/track.model';

interface Song {
  id: number;
  name_song: string;
  artist_song: string;
  album_song: string;
  art_work_song: string;
  duration: number;
}

@Component({
  selector: 'app-cover-player',
  standalone: true,
  imports: [CommonModule, MediaUrlPipe],
  templateUrl: './cover-player.component.html',
  styleUrls: ['./cover-player.component.css']
})
export class CoverplayerComponent implements OnInit, OnDestroy {
  selectedPlaylist = signal<any>(null);
  showPlaylistDetail = signal(false);
  noImg = new Set<number>();
  
  private destroy$ = new Subject<void>();
  private playerEvents = inject(PlayerEventsService);
  private player: PlayerService = inject(PlayerService);
  private playlistService = inject(PlaylistService);

  ngOnInit(): void {
    // ✅ EVENTO ORIGINAL: Cuando se hace click en el título (player-bar)
    this.playerEvents.openCoverPlayer$.pipe(
        takeUntil(this.destroy$)
    ).subscribe(() => {
        console.log('📢 Evento recibido DESDE PLAYER-BAR - abriendo cover player');
        this.openWithPlaylist(); // ← Esto busca la playlist de la canción actual
    });

    // ✅ EVENTO NUEVO: Cuando se abre desde playlists automáticas
    this.playerEvents.openCoverPlayerWithPlaylist$.pipe(
        takeUntil(this.destroy$)
    ).subscribe((playlist) => {
        console.log('📢 Evento recibido DESDE PLAYLIST AUTOMÁTICA - abriendo cover player');
        this.loadAutomaticPlaylist(playlist); // ← Esto carga la playlist específica
    });

    this.setupSongChangeListener();
}
  openWithPlaylist() {
    console.log('🎵 Cargando TODAS las playlists para buscar canción actual...');
    
    const currentSong = this.player.current();
    
    if (!currentSong) {
        console.log('❌ No hay canción reproduciéndose');
        this.openWithCurrentSong();
        return;
    }

    console.log('🎵 Buscando playlist que contenga la canción:', currentSong.id);
    
    this.playlistService.getPlaylists().subscribe({
        next: (response: any) => {
            console.log('📀 RESPUESTA COMPLETA:', response);
            
            let playlistsData: any[] = [];
            
            if (Array.isArray(response)) {
                playlistsData = response;
            } else if (response && Array.isArray(response.data)) {
                playlistsData = response.data;
            } else if (response && Array.isArray(response.playlists)) {
                playlistsData = response.playlists;
            }

            console.log('📀 Playlists encontradas:', playlistsData.length);
            
            // ✅ BUSCAR LA PLAYLIST QUE CONTIENE LA CANCIÓN ACTUAL
            const playlistWithCurrentSong = this.findPlaylistWithSong(playlistsData, currentSong.id);
            
            if (playlistWithCurrentSong) {
                console.log('✅ Playlist encontrada:', playlistWithCurrentSong.name_playlist);
                this.loadPlaylistIntoCoverPlayer(playlistWithCurrentSong);
            } else {
                console.log('❌ No se encontró playlist con la canción actual - mostrando playlists automáticas');
                // ✅ EN LUGAR DE SOLO LA CANCIÓN ACTUAL, MOSTRAR PLAYLISTS AUTOMÁTICAS
                this.showAutomaticPlaylistsFallback();
            }
        },
        error: (err) => {
            console.error('❌ Error cargando playlists:', err);
            // ✅ TAMBIÉN MOSTRAR PLAYLISTS AUTOMÁTICAS EN CASO DE ERROR
            this.showAutomaticPlaylistsFallback();
        }
    });
}

// ✅ AGREGAR ESTE MÉTODO NUEVO
private showAutomaticPlaylistsFallback() {
    console.log('🔄 Cargando playlists automáticas como fallback...');
    
    // Aquí necesitas obtener las playlists automáticas
    // Si tienes un servicio para playlists automáticas, úsalo:
    // this.autoPlaylistService.getAutomaticPlaylists().subscribe(...)
    
    // Por ahora, como solución temporal, puedes usar openWithCurrentSong()
    // pero sería mejor cargar alguna playlist automática por defecto
    console.log('📋 Mostrando canción actual (se necesita implementar playlists automáticas aquí)');
    this.openWithCurrentSong();
}
// ✅ AGREGAR ESTE MÉTODO NUEVO:
private loadAutomaticPlaylist(playlist: any) {
    console.log('🎵 Cargando playlist automática en cover player:', playlist);
    
    if (playlist && playlist.songs) {
        const songsList = playlist.songs.map((playlistSong: any) => {
            const song = playlistSong.song || playlistSong;
            return {
                id: song.id,
                name_song: song.name_song || song.title,
                artist_song: song.artist_song || song.artist,
                album_song: song.album_song || song.album || '',
                art_work_song: song.art_work_song || song.art_work_songs || '',
                duration: song.duration || 0,
                genre_song: song.genre_song || 'unknown',
                url_song: song.url_song || song.url || ''
            };
        });

        const currentPlaylist = {
            id: playlist.id,
            name: playlist.name_playlist || 'Playlist Automática',
            description: `Playlist automática - ${songsList.length} canciones`,
            songs: songsList,
            isGenerated: true,
            isAutomatic: true
        };

        this.selectedPlaylist.set(currentPlaylist);
        this.showPlaylistDetail.set(true);
        console.log('🎉 Cover player abierto con playlist automática:', songsList.length, 'canciones');
    } else {
        console.error('❌ Playlist automática inválida');
    }
}

  // ✅ MÉTODO PARA BUSCAR PLAYLIST QUE CONTIENE UNA CANCIÓN
  private findPlaylistWithSong(playlists: any[], songId: number): any {
    for (let playlist of playlists) {
      if (playlist.songs && Array.isArray(playlist.songs)) {
        // Buscar en las canciones de la playlist
        const hasSong = playlist.songs.some((playlistSong: any) => {
          const song = playlistSong.song || playlistSong;
          return song.id === songId;
        });
        
        if (hasSong) {
          return playlist;
        }
      }
    }
    return null;
  }

  // ✅ MÉTODO PARA CARGAR PLAYLIST EN EL COVER PLAYER
  private loadPlaylistIntoCoverPlayer(playlist: any) {
    if (playlist && playlist.songs) {
      console.log('🎵 Canciones de la playlist:', playlist.songs.length);
      
      const songsList = playlist.songs.map((playlistSong: any) => {
        const song = playlistSong.song || playlistSong;
        return {
          id: song.id,
          name_song: song.name_song || song.title,
          artist_song: song.artist_song || song.artist,
          album_song: song.album_song || song.album || '',
          art_work_song: song.art_work_song || song.art_work_songs || '',
          duration: song.duration || 0,
          genre_song: song.genre_song || 'unknown',
          url_song: song.url_song || song.url || ''
        };
      });

      const currentPlaylist = {
        id: playlist.id,
        name: playlist.name_playlist || 'Playlist',
        description: `Playlist - ${songsList.length} canciones`,
        songs: songsList,
        isGenerated: false
      };

      this.selectedPlaylist.set(currentPlaylist);
      this.showPlaylistDetail.set(true);
      console.log('🎉 Cover player abierto con playlist:', playlist.name_playlist);
    }
  }

  private setupSongChangeListener() {
    let previousSongId: number | null = null;
    
    setInterval(() => {
      if (this.showPlaylistDetail()) {
        const currentSong = this.player.current();
        
        if (currentSong && currentSong.id !== previousSongId) {
          console.log('🔄 Canción cambiada - actualizando cover player');
          previousSongId = currentSong.id;
          this.updateCurrentSong(currentSong);
        }
      }
    }, 1000);
  }
private updateCurrentSong(currentSong: any) {
    const currentPlaylist = this.selectedPlaylist();
    
    if (currentPlaylist && currentPlaylist.songs.length > 0) {
        // ✅ COPIAR todas las canciones
        const updatedSongs = [...currentPlaylist.songs];
        
        // ✅ BUSCAR la canción actual en la lista para mantener sus datos originales
        const originalSong = currentPlaylist.songs.find((song: { id: any; }) => song.id === currentSong.id);
        
        // ✅ ACTUALIZAR solo la PRIMERA posición con los datos COMBINADOS
        updatedSongs[0] = {
            // ✅ MANTENER todos los datos ORIGINALES si la canción existe en la lista
            ...(originalSong || {}),
            // ✅ ACTUALIZAR con los datos de la canción actual (para la carátula)
            id: currentSong.id,
            name_song: currentSong.title,
            artist_song: currentSong.artist,
            album_song: currentSong.album || (originalSong?.album_song || ''),
            art_work_song: currentSong.art_work_songs || (originalSong?.art_work_song || ''),
            duration: this.player.duration() || (originalSong?.duration || 0),
            // ✅ MANTENER SIEMPRE la URL original
            url_song: originalSong?.url_song || '',
            genre_song: originalSong?.genre_song || 'unknown'
        };
        
        this.selectedPlaylist.update(playlist => ({
            ...playlist,
            songs: updatedSongs
        }));
        
        console.log('🎨 Carátula actualizada para:', currentSong.title);
    }
}

  openWithCurrentSong() {
    const currentSong = this.player.current();
    console.log('🎵 Canción actual COMPLETA:', currentSong);

    if (!currentSong) {
      console.log('❌ No hay canción reproduciéndose');
      return;
    }

    const songDuration = this.player.duration() || 0;
    const songsList = [{
      id: currentSong.id,
      name_song: currentSong.title,
      artist_song: currentSong.artist,
      album_song: currentSong.album || '',
      art_work_song: currentSong.art_work_songs || '',
      duration: songDuration,
    }];

    const currentPlaylist = {
      name: 'Reproduciendo ahora',
      description: `Canción actual`,
      songs: songsList,
      isGenerated: true
    };

    this.selectedPlaylist.set(currentPlaylist);
    this.showPlaylistDetail.set(true);
    console.log('🎉 Cover player abierto con canción actual');
  }

  closePlaylist() {
    this.showPlaylistDetail.set(false);
    this.selectedPlaylist.set(null);
  }

  playSong(song: any, ev?: Event) {
    if (ev) ev.stopPropagation();
    
    console.log('🔍 CANCIÓN ORIGINAL:', song);
    
    if (!song.url_song) {
      console.warn('⚠️ Canción sin URL, buscando canción completa...');
      
      const fullSong = this.findCompleteSong(song.id);
      if (fullSong && fullSong.url_song) {
        console.log('✅ Canción completa encontrada:', fullSong);
        song = fullSong;
      } else {
        console.error('❌ No se pudo encontrar la URL de la canción');
        alert('No se puede reproducir esta canción: URL no disponible');
        return;
      }
    }
    
    const currentTrack = dtoToTrack(song);
    console.log('🎵 Track con URL:', currentTrack.url);
    
    this.player.playNow(currentTrack);
  }

  private findCompleteSong(songId: number): any {
    const currentPlaylist = this.selectedPlaylist();
    
    if (!currentPlaylist || !currentPlaylist.songs || !currentPlaylist.songs.length) {
      console.log('❌ No hay playlist seleccionada o no tiene canciones');
      return null;
    }
    
    console.log('🔍 Buscando canción ID:', songId, 'en playlist:', currentPlaylist.songs);
    
    const completeSong = currentPlaylist.songs.find((s: any) => s.id === songId);
    if (completeSong && completeSong.url_song) {
      console.log('✅ Canción encontrada en playlist:', completeSong);
      return completeSong;
    }
    
    for (let song of currentPlaylist.songs) {
      if (song.song && song.song.id === songId && song.song.url_song) {
        console.log('✅ Canción encontrada en estructura anidada:', song.song);
        return song.song;
      }
    }
    
    console.log('❌ Canción no encontrada en la playlist');
    return null;
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  bust(id: number) {
    return `?v=${id}`;
  }

  onImgError(ev: Event, song: any) {
    this.noImg.add(song.id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePlayPause() {
    this.player.togglePlayPause();
    console.log('⏯️ Play/Pause desde carátula del cover player');
  }
  
}