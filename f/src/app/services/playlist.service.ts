import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {
  private apiUrl = 'http://localhost:8000/api/playlists';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers };
  }

  getPlaylists(): Observable<any> {
    return this.http.get(this.apiUrl, this.getHeaders())
      .pipe(
        catchError(this.handleError)
      );
  }

  createPlaylist(data: { name_playlist: string; is_public: boolean }): Observable<any> {
    return this.http.post(this.apiUrl, data, this.getHeaders())
      .pipe(
        catchError(this.handleError)
      );
  }

  deletePlaylist(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders())
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('Error en PlaylistService:', error);
    return throwError(() => new Error(error.message || 'Error del servidor'));
  }
}