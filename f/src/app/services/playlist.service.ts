import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {
  private apiUrl = 'http://localhost:8000/api/playlists';
  
  // Signal para playlists guardadas localmente (simulación instantánea)
  private localPlaylists = signal<Map<string, any>>(new Map());
  
  // Signal para cache de playlists del usuario
  private userPlaylists = signal<any[]>([]);

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
    console.log('🔍 Solicitando playlists del usuario...');
    return this.http.get(this.apiUrl, this.getHeaders())
      .pipe(
        tap((response: any) => {
          console.log('✅ Playlists recibidas del servidor:', response);
          // Guardar en cache
          if (Array.isArray(response)) {
            this.userPlaylists.set(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Obtener playlists desde el cache
  getCachedPlaylists(): any[] {
    return this.userPlaylists();
  }

  // Método modificado para guardado instantáneo
  createPlaylist(data: { name_playlist: string; is_public: boolean }): Observable<any> {
    // Crear ID temporal para la playlist
    const tempId = 'temp_' + Date.now();
    const tempPlaylist = {
      id: tempId,
      name_playlist: data.name_playlist,
      is_public: data.is_public,  
      user_id: 1, // Temporal
      is_temp: true, // Marcar como temporal
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      songs: []
    };

    // Guardar instantáneamente en local
    this.addToLocalPlaylists(tempId, tempPlaylist);

    // Hacer la petición real al servidor
    return this.http.post(this.apiUrl, data, this.getHeaders())
      .pipe(
        tap((response: any) => {
          console.log('✅ Playlist creada en servidor:', response);
          // Cuando el servidor responde, reemplazar la temporal con la real
          if (response.playlist) {
            this.replaceTempPlaylist(tempId, response.playlist);
            // Actualizar cache
            this.refreshPlaylistsCache();
          }
        }),
        catchError((error) => {
          console.error('❌ Error creando playlist:', error);
          // Si hay error, mantener la temporal pero marcarla como error
          this.markPlaylistAsError(tempId);
          return throwError(() => error);
        })
      );
  }

  deletePlaylist(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders())
      .pipe(
        tap(() => {
          console.log('🗑️ Playlist eliminada, actualizando cache...');
          // Actualizar cache después de eliminar
          this.refreshPlaylistsCache();
        }),
        catchError(this.handleError)
      );
  }

  // Métodos para el guardado instantáneo
  private addToLocalPlaylists(id: string, playlist: any) {
    const current = new Map(this.localPlaylists());
    current.set(id, { ...playlist, status: 'saving' });
    this.localPlaylists.set(current);
  }

  private replaceTempPlaylist(tempId: string, realPlaylist: any) {
    const current = new Map(this.localPlaylists());
    current.delete(tempId);
    current.set(realPlaylist.id.toString(), { ...realPlaylist, status: 'saved' });
    this.localPlaylists.set(current);
  }

  private markPlaylistAsError(tempId: string) {
    const current = new Map(this.localPlaylists());
    const playlist = current.get(tempId);
    if (playlist) {
      current.set(tempId, { ...playlist, status: 'error' });
      this.localPlaylists.set(current);
    }
  }

  // Actualizar cache de playlists
  private refreshPlaylistsCache() {
    this.getPlaylists().subscribe({
      next: () => console.log('🔄 Cache de playlists actualizado'),
      error: (err) => console.error('❌ Error actualizando cache:', err)
    });
  }

  // Obtener todas las playlists (reales + locales)
  getAllPlaylists(): any[] {
    const local = Array.from(this.localPlaylists().values());
    const server = this.userPlaylists();
    
    // Filtrar playlists locales que no están en error
    const validLocalPlaylists = local.filter(playlist => playlist.status !== 'error');
    
    // Combinar y eliminar duplicados
    const allPlaylists = [...server, ...validLocalPlaylists];
    const uniquePlaylists = this.removeDuplicates(allPlaylists);
    
    return uniquePlaylists;
  }

  private removeDuplicates(playlists: any[]): any[] {
    const seen = new Set();
    return playlists.filter(playlist => {
      const identifier = playlist.is_temp ? playlist.id : playlist.id.toString();
      if (seen.has(identifier)) {
        return false;
      }
      seen.add(identifier);
      return true;
    });
  }

  // Verificar si una playlist está guardada localmente
  isPlaylistSaved(playlistName: string): boolean {
    const local = this.localPlaylists();
    return Array.from(local.values()).some(playlist => 
      playlist.name_playlist === playlistName && playlist.status !== 'error'
    );
  }

  private handleError(error: any) {
    console.error('❌ Error en PlaylistService:', error);
    
    // Mensajes de error más específicos
    let errorMsg = 'Error del servidor';
    if (error.status === 401) {
      errorMsg = "No autorizado - Sesión expirada";
    } else if (error.status === 404) {
      errorMsg = "Recurso no encontrado";
    } else if (error.error?.message) {
      errorMsg = error.error.message;
    }
    
    return throwError(() => new Error(errorMsg));
  }
}