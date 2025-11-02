import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../services/playlist.service';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { HttpErrorResponse } from '@angular/common/http';

interface Playlist {
  id: number;
  name_playlist: string;
  is_public: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
  songs: any[];
}

@Component({
  selector: 'app-playlists',
  standalone: true,
  imports: [CommonModule, MediaUrlPipe],
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.css']
})
export class PlaylistsComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  playlists = signal<Playlist[]>([]);
  
  // Estado para el modal
  selectedPlaylist = signal<Playlist | null>(null);
  showPlaylistModal = signal(false);

  constructor(private playlistService: PlaylistService) {}

  ngOnInit(): void {
    this.loadPlaylists();
  }

  loadPlaylists() {
    this.loading.set(true);
    this.error.set(null);

    this.playlistService.getPlaylists().subscribe({
      next: (response: any) => {
        console.log('Playlists cargadas:', response);
        this.playlists.set(response);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading playlists:', err);
        this.error.set('No se pudieron cargar las playlists.');
        this.loading.set(false);
      }
    });
  }

  // Abrir modal con las canciones de la playlist
  openPlaylistModal(playlist: Playlist) {
    this.selectedPlaylist.set(playlist);
    this.showPlaylistModal.set(true);
  }

  // Cerrar modal
  closePlaylistModal() {
    this.showPlaylistModal.set(false);
    this.selectedPlaylist.set(null);
  }

  // Eliminar playlist
  deletePlaylist(playlist: Playlist, event: Event) {
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${playlist.name_playlist}"?`)) {
      this.playlistService.deletePlaylist(playlist.id).subscribe({
        next: () => {
          console.log('Playlist eliminada:', playlist.name_playlist);
          this.loadPlaylists(); // Recargar la lista
        },
        error: (err) => {
          console.error('Error eliminando playlist:', err);
          this.error.set('Error al eliminar la playlist');
        }
      });
    }
  }

  // Obtener imagen de portada de la playlist (primera canción)
  getPlaylistCover(playlist: Playlist): string {
    if (playlist.songs && playlist.songs.length > 0 && playlist.songs[0].song?.art_work_song) {
      return playlist.songs[0].song.art_work_song;
    }
    return '';
  }

  // Contar canciones
  getSongCount(playlist: Playlist): string {
    const count = playlist.songs ? playlist.songs.length : 0;
    return count === 1 ? '1 canción' : `${count} canciones`;
  }

  // Cache busting para imágenes
  noImg = new Set<number>();
  
  bust(id: number) {
    return `?v=${id}`;
  }

  onImgError(ev: Event, song: any) {
    if (song && song.id) {
      this.noImg.add(song.id);
    }
    console.warn('IMG ERROR:', (ev.target as HTMLImageElement).currentSrc);
  }

  // Formatear duración
  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}