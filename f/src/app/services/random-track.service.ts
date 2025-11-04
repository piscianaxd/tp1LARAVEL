import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Song {
  id: number;
  url_song: string;
  name_song: string;
  genre_song: string;
  artist_song: string;
  album_song: string;
  art_work_song: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface RandomSongsResponse {
  status: string;
  count: number;
  min_id?: number;
  max_id?: number;
  songs: Song[];
}

@Injectable({
  providedIn: 'root'
})
export class RandomTrackService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getRandomSongs(limit: number = 6): Observable<RandomSongsResponse> {
    return this.http.get<RandomSongsResponse>(
      `${this.apiUrl}/songs/random/${limit}`,
      { headers: this.getHeaders() }
    );
  }
}