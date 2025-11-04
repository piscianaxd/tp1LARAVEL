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

  notifyPlaylistSaved() {
    this.playlistSavedSource.next();
  }

  // Método para abrir modal de crear playlist con canción
  openCreatePlaylistWithSong(song: SongForPlaylist) {
    console.log('🎵 Enviando canción para nueva playlist:', song);
    this.createPlaylistWithSongSource.next(song);
  }

  // Método para notificar cuando se crea una playlist
  notifyPlaylistCreated(playlistId: number) {
    this.playlistCreatedSource.next(playlistId);
  }
}