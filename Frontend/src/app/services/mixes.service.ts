import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators'; // 👈 para usar el operador tap y loguear sin modificar el flujo

export interface Song {
  id: number;
  name_song: string;
  artist_song: string;
  album_song: string;
  art_work_song: string;
  genre_song: string;
  url_song: string;
}

@Injectable({
  providedIn: 'root'
})
export class MixesService {
  private apiUrl = 'http://localhost:8000/api/songs/filter-genre'; // ⚙️ ajustar si tu API está en otro puerto

  constructor(private http: HttpClient) {}

  getSongsByGenre(genre: string): Observable<{ success: boolean; songs: Song[] }> {
    return this.http
      .get<{ success: boolean; songs: Song[] }>(`${this.apiUrl}/${genre}`)
      .pipe(
        tap(response => {
          console.log('🎧 Respuesta del backend (getSongsByGenre):', response);
          if (response && response.songs) {
            console.log('🎵 Lista de canciones recibidas:', response.songs);
          }
        })
      );
  }
}
