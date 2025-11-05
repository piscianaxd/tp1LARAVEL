// services/playlist-event.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// NUEVO: Hacer que esta interfaz sea compatible con SongToAdd
export interface SongForPlaylist {
  id: number;
  name_song: string;
  artist_song: string;
  album_song?: string;
  art_work_song?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlaylistEventService {
  private playlistSavedSource = new Subject<void>();
  private createPlaylistWithSongSource = new Subject<SongForPlaylist>();
  private playlistCreatedSource = new Subject<number>();
  
  playlistSaved$ = this.playlistSavedSource.asObservable();
  createPlaylistWithSong$ = this.createPlaylistWithSongSource.asObservable();
  playlistCreated$ = this.playlistCreatedSource.asObservable();

  constructor() {
    console.log('🎵 PlaylistEventService inicializado');
    
    // DIAGNÓSTICO: Verificar el estado de los observables
    console.log('🔍 Estado inicial de los observables:', {
      playlistSaved: this.playlistSavedSource,
      createPlaylistWithSong: this.createPlaylistWithSongSource,
      playlistCreated: this.playlistCreatedSource
    });
  }

  notifyPlaylistSaved() {
    console.log('🔄 [SERVICE] Notificando playlist guardada');
    this.playlistSavedSource.next();
  }

  // En playlist-event.service.ts
  openCreatePlaylistWithSong(song: SongForPlaylist) {
    console.log('🚀 [SERVICE] EMITIENDO evento createPlaylistWithSong');
    console.log('📝 [SERVICE] Detalles de la canción:', {
      id: song?.id,
      name: song?.name_song,
      artist: song?.artist_song,
      album: song?.album_song,
      hasArtwork: !!song?.art_work_song
    });
    
    // DIAGNÓSTICO: Verificar el estado del Subject antes de emitir
    console.log('📡 [SERVICE] Estado del Subject createPlaylistWithSongSource:', {
      observersCount: this.createPlaylistWithSongSource.observers.length,
      closed: this.createPlaylistWithSongSource.closed,
      hasError: this.createPlaylistWithSongSource.hasError,
      thrownError: this.createPlaylistWithSongSource.thrownError
    });
    
    if (this.createPlaylistWithSongSource.closed) {
      console.error('❌ [SERVICE] ERROR: Subject createPlaylistWithSongSource está CERRADO');
      return;
    }
    
    if (this.createPlaylistWithSongSource.observers.length === 0) {
      console.warn('⚠️ [SERVICE] ADVERTENCIA: No hay suscriptores para createPlaylistWithSong');
    }
    
    try {
      this.createPlaylistWithSongSource.next(song);
      console.log('✅ [SERVICE] Evento createPlaylistWithSong emitido EXITOSAMENTE');
    } catch (error) {
      console.error('❌ [SERVICE] ERROR al emitir evento:', error);
    }
  }

  // Método para notificar cuando se crea una playlist
  notifyPlaylistCreated(playlistId: number) {
    console.log('🎉 [SERVICE] Notificando playlist creada con ID:', playlistId);
    this.playlistCreatedSource.next(playlistId);
  }

  // DIAGNÓSTICO: Método para verificar el estado del servicio
  getServiceStatus() {
    return {
      playlistSaved: {
        observers: this.playlistSavedSource.observers.length,
        closed: this.playlistSavedSource.closed
      },
      createPlaylistWithSong: {
        observers: this.createPlaylistWithSongSource.observers.length,
        closed: this.createPlaylistWithSongSource.closed
      },
      playlistCreated: {
        observers: this.playlistCreatedSource.observers.length,
        closed: this.playlistCreatedSource.closed
      }
    };
  }
}