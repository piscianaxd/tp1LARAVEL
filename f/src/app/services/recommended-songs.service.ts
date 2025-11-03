import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecommendedSongsService {
  
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // Obtener historial del usuario actual
  getUserHistory(): Observable<any> {
    return this.http.get(`${this.baseUrl}/history`);
  }

  // Obtener todas las canciones disponibles (para generar recomendaciones)
  getAllSongs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/songs`);
  }

  // Incrementar género (cuando el usuario escucha una canción)
  incrementGenre(userId: number, genre: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/recommended-songs/${userId}`, { genre });
  }

  // AGREGAR ESTE NUEVO MÉTODO para añadir canciones al historial
  addSongToHistory(songId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/history`, { song_id: songId });
  }
}