// services/playlist-event.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlaylistEventService {
  private playlistSavedSource = new Subject<void>();
  
  playlistSaved$ = this.playlistSavedSource.asObservable();

  notifyPlaylistSaved() {
    this.playlistSavedSource.next();
  }
}