import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Track } from '../models/track/track.model'; // ← modelo base reproducible

export interface HistoryTrack extends Track {
  historyId: number;
  playedAt: Date;
  genre: string;
}

/** DTOs que vienen del backend */
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

@Injectable({ providedIn: 'root' })
export class HistoryService {
  // Sugerencia: mover a environment y/o usar proxy /api
  private API = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /** Mapea un item del back a HistoryTrack (extiende de Track base) */
  private toHistoryTrack(it: HistoryItemDto): HistoryTrack {
    // Fecha robusta: reemplazamos espacio por 'T' para Date ISO-like
    const playedAt = new Date((it.fecha || '').replace(' ', 'T'));
    return {
      historyId: it.historial_id,
      playedAt: isNaN(playedAt.getTime()) ? new Date() : playedAt,
      id: it.cancion.id,
      title: it.cancion.nombre,
      artist: it.cancion.artista,
      album: it.cancion.album,
      art_work_songs: it.cancion.artwork, // e.g. /media/artworks/...
      url: it.cancion.url,         // e.g. /media/audio/...
      genre: it.cancion.genero,
    };
  }

  /** Lista completa (ordenada desc por el back) */
  getHistory(): Observable<HistoryTrack[]> {
    return this.http.get<HistoryResponse>(`${this.API}/history`).pipe(
      map(res => (res.data ?? []).map(this.toHistoryTrack.bind(this)))
    );
  }

  /** Agrega una canción reproducida al historial */
  addToHistory(songId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/history`, { song_id: songId });
  }

  /** Elimina una entrada específica del historial */
  deleteFromHistory(historyId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/history/${historyId}`);
  }
}
