import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerEventsService {
  // Evento existente para abrir cover player
  private openCoverPlayerSource = new Subject<void>();
  openCoverPlayer$ = this.openCoverPlayerSource.asObservable();

  // ✅ NUEVO: Evento para abrir cover player con playlist específica
  private openCoverPlayerWithPlaylistSource = new Subject<any>();
  openCoverPlayerWithPlaylist$ = this.openCoverPlayerWithPlaylistSource.asObservable();

  openCoverPlayer() {
    this.openCoverPlayerSource.next();
  }

  // ✅ NUEVO: Método para abrir con playlist
  openCoverPlayerWithPlaylist(playlist: any) {
    this.openCoverPlayerWithPlaylistSource.next(playlist);
  }
}