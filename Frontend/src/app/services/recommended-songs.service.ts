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

  // ✅ ACTUALIZADO: Incrementar género usando la nueva ruta
  incrementGenre(userId: number, genre: string): Observable<any> {

  console.log('🌐 Haciendo PATCH a:', `${this.baseUrl}/recommended-songs/user/${userId}/increment-genre`);
  console.log('📤 Datos enviados:', { genre });

    return this.http.patch(`${this.baseUrl}/recommended-songs/user/${userId}/increment-genre`, { genre });
  }

  // ✅ NUEVO: Obtener géneros top desde la nueva ruta
  getTopGenres(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/recommended-songs/user/${userId}/top-genres`);
  }
}