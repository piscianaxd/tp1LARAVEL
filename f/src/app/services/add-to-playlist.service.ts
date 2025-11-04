import { Injectable, signal } from '@angular/core';
import { PlaylistService } from './playlist.service';
import { BehaviorSubject } from 'rxjs';

export interface SongToAdd {
  id: number;
  name_song: string;
  artist_song: string;
  album_song?: string;
  art_work_song?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AddToPlaylistService {
  private showModalSource = new BehaviorSubject<boolean>(false);
  private songToAddSource = new BehaviorSubject<SongToAdd | null>(null);
  
  showModal$ = this.showModalSource.asObservable();
  songToAdd$ = this.songToAddSource.asObservable();
  
  // Señales para el estado
  loading = signal(false);
  userPlaylists = signal<any[]>([]);
  selectedPlaylistId = signal<number | null>(null);
  error = signal<string | null>(null);

  constructor(private playlistService: PlaylistService) {}

  openModal(song: SongToAdd) {
    this.songToAddSource.next(song);
    this.showModalSource.next(true);
    this.error.set(null);
    this.loadUserPlaylists(); // ✅ Ahora es público
  }

  closeModal() {
    this.showModalSource.next(false);
    this.songToAddSource.next(null);
    this.selectedPlaylistId.set(null);
    this.error.set(null);
  }

  // ✅ CAMBIADO: Ahora es público para que el componente pueda llamarlo
  loadUserPlaylists() {
    this.loading.set(true);
    this.error.set(null);
    
    this.playlistService.getPlaylists().subscribe({
      next: (response: any) => {
        let playlistsData: any[] = [];
        
        if (Array.isArray(response)) {
          playlistsData = response;
        } else if (response && Array.isArray(response.data)) {
          playlistsData = response.data;
        } else if (response && Array.isArray(response.playlists)) {
          playlistsData = response.playlists;
        } else {
          console.warn('Formato de respuesta inesperado:', response);
          playlistsData = [];
        }

        this.userPlaylists.set(playlistsData);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading playlists:', error);
        this.error.set('No se pudieron cargar las playlists');
        this.loading.set(false);
        
        // Cargar playlists mock para desarrollo
        this.loadMockPlaylists();
      }
    });
  }

  private loadMockPlaylists() {
    const mockPlaylists = [
      {
        id: 1,
        name_playlist: 'Mis Favoritas',
        is_public: true,
        songs: [
          { song: { id: 101, name_song: 'Canción Ejemplo' } }
        ]
      },
      {
        id: 2,
        name_playlist: 'Para Estudiar', 
        is_public: false,
        songs: []
      },
      {
        id: 3,
        name_playlist: 'Party Time',
        is_public: true,
        songs: []
      }
    ];
    
    this.userPlaylists.set(mockPlaylists);
  }

  getCurrentSong(): SongToAdd | null {
    return this.songToAddSource.value;
  }

  isModalOpen(): boolean {
    return this.showModalSource.value;
  }
}