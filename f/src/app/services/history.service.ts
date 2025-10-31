import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface HistoryItemDto {
  historial_id: number;
  fecha: string; // "YYYY-MM-DD HH:mm:ss"
  cancion: {
    id: number;
    nombre: string;
    artista: string;
    genero: string;
    album: string;
    url: string;
    artwork: string;
  };
}

export interface HistoryResponse {
  message: string;
  data: HistoryItemDto[];
}

export interface Track {
  historyId: number;
  playedAt: Date;
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  url: string;
  artwork: string;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private API = 'http://localhost:8000/api'; 

  constructor(private http: HttpClient) {}

  getHistory(): Observable<Track[]> {
    return this.http.get<HistoryResponse>(`${this.API}/history`).pipe(
      map(res => (res.data ?? []).map(it => ({
        historyId: it.historial_id,
        playedAt: new Date(it.fecha.replace(' ', 'T')),
        id: it.cancion.id,
        title: it.cancion.nombre,
        artist: it.cancion.artista,
        album: it.cancion.album,
        genre: it.cancion.genero,
        url: it.cancion.url,
        artwork: it.cancion.artwork
      })))
    );
  }

  addToHistory(songId: number) {
    return this.http.post(`${this.API}/history`, { song_id: songId });
  }

  deleteFromHistory(historyId: number) {
    return this.http.delete(`${this.API}/history/${historyId}`);
  }
}
