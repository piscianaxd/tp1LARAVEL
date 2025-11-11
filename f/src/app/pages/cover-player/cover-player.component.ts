import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { PlayerService } from '../../services/player.service';
import { PlayerEventsService } from '../../services/player-events.service';
import { PlaylistService } from '../../services/playlist.service'; // ← AÑADIR
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
  private playlistService = inject(PlaylistService); // ← INYECTAR SERVICIO

  ngOnInit(): void {
    this.playerEvents.openCoverPlayer$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('📢 Evento recibido - abriendo cover player');
      this.openWithPlaylist(); // ← Usar el nuevo método
    });

    this.setupSongChangeListener();
  }

  // NUEVO MÉTODO: Cargar playlist específica
    openWithPlaylist() {
      console.log('🎵 Cargando TODAS las playlists para buscar ID=1...');
      
      this.playlistService.getPlaylists().subscribe({
        next: (response: any) => {
          console.log('📀 RESPUESTA COMPLETA:', response);
        
        // Ver la estructura de la respuesta (igual que en tu playlist component)
        let playlistsData: any[] = [];
        
        if (Array.isArray(response)) {
          playlistsData = response;
        } else if (response && Array.isArray(response.data)) {
          playlistsData = response.data;
        } else if (response && Array.isArray(response.playlists)) {
          playlistsData = response.playlists;
        }

        console.log('📀 Playlists encontradas:', playlistsData.length);
        
        // Buscar la playlist con ID = 1
        const playlist1 = playlistsData.find(p => p.id === 1);
        console.log('🎯 Playlist ID=1:', playlist1);

        if (playlist1 && playlist1.songs) {
          console.log('🎵 Canciones de playlist 1:', playlist1.songs);
          
          // Transformar las canciones al formato que espera tu template
          const songsList = playlist1.songs.map((playlistSong: any) => {
    const song = playlistSong.song || playlistSong;
    return {
        id: song.id,
        name_song: song.name_song || song.title,
        artist_song: song.artist_song || song.artist,
        album_song: song.album_song || song.album || '',
        art_work_song: song.art_work_song || song.art_work_songs || '',
        duration: song.duration || 0,
        genre_song: song.genre_song || 'unknown',
        url_song: song.url_song || song.url || '' // ← ¡ESTO ES LO MÁS IMPORTANTE!
    };
});

          const currentPlaylist = {
            id: playlist1.id,
            name: playlist1.name_playlist || 'Mi Playlist',
            description: `Playlist personalizada - ${songsList.length} canciones`,
            songs: songsList,
            isGenerated: false
          };

          this.selectedPlaylist.set(currentPlaylist);
          this.showPlaylistDetail.set(true);
          console.log('🎉 Cover player abierto con playlist:', songsList.length, 'canciones');
        } else {
          console.log('❌ No se encontró playlist ID=1 o no tiene canciones');
          this.openWithCurrentSong(); // Fallback
        }
      },
      error: (err) => {
        console.error('❌ Error cargando playlists:', err);
        this.openWithCurrentSong(); // Fallback a canción actual
      }
    });
  }

  // Resto de tus métodos igual...
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
      const updatedSongs = [...currentPlaylist.songs];
      updatedSongs[0] = {
        id: currentSong.id,
        name_song: currentSong.title,
        artist_song: currentSong.artist,
        album_song: currentSong.album || '',
        art_work_song: currentSong.art_work_songs || '',
        duration: this.player.duration() || 0
      };
      
      this.selectedPlaylist.update(playlist => ({
        ...playlist,
        songs: updatedSongs
      }));
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
 // ← AÑADIDO
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
    
    // ✅ VERIFICAR SI TENEMOS LA URL
    if (!song.url_song) {
        console.warn('⚠️ Canción sin URL, buscando canción completa...');
        
        // Buscar la canción completa en la playlist actual
        const fullSong = this.findCompleteSong(song.id);
        if (fullSong && fullSong.url_song) {
            console.log('✅ Canción completa encontrada:', fullSong);
            song = fullSong;
        } else {
            console.error('❌ No se pudo encontrar la URL de la canción');
            // Mostrar alerta al usuario
            alert('No se puede reproducir esta canción: URL no disponible');
            return;
        }
    }
    
    const currentTrack = dtoToTrack(song);
    console.log('🎵 Track con URL:', currentTrack.url);
    
    this.player.playNow(currentTrack);
}

// ✅ MÉTODO CORREGIDO PARA BUSCAR CANCIÓN COMPLETA
private findCompleteSong(songId: number): any {
    const currentPlaylist = this.selectedPlaylist();
    
    if (!currentPlaylist || !currentPlaylist.songs || !currentPlaylist.songs.length) {
        console.log('❌ No hay playlist seleccionada o no tiene canciones');
        return null;
    }
    
    console.log('🔍 Buscando canción ID:', songId, 'en playlist:', currentPlaylist.songs);
    
    // Buscar en las canciones actuales de la playlist
    const completeSong = currentPlaylist.songs.find((s: any) => s.id === songId);
    if (completeSong && completeSong.url_song) {
        console.log('✅ Canción encontrada en playlist:', completeSong);
        return completeSong;
    }
    
    // Si no se encuentra con url_song, buscar en estructura anidada
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
  // Agrega este método en tu cover-player.component.ts
  togglePlayPause() {
    this.player.togglePlayPause();
    console.log('⏯️ Play/Pause desde carátula del cover player');
  }
}