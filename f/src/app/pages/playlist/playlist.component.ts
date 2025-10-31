import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.css'],
})
export class PlaylistComponent implements OnInit {
  playlists: any[] = [];
  name_playlist: string = '';
  is_public: boolean = false;
  loading = false;
  errorMsg = '';

  constructor(private playlistService: PlaylistService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']); // ← Si no, al login
      return;
    }
    //si está logueado, cargar playlist normalmente
    this.loadPlaylists();
  }

  loadPlaylists() {
    this.loading = true;
    this.playlistService.getPlaylists().subscribe({
      next: (data) => {
        this.playlists = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se pudieron cargar las playlists';
        this.loading = false;

        // Si es error de autenticación, redirigir al login
        if (err.status === 401) {
          this.authService.clearSession();
          this.router.navigate(['/login']);
        }
      },
    });
  }

  createPlaylist() {
    if (!this.name_playlist.trim()) {
      this.errorMsg = 'El nombre es obligatorio';
      return;
    }

    const data = {
      name_playlist: this.name_playlist,
      is_public: this.is_public,
    };

    this.playlistService.createPlaylist(data).subscribe({
      next: (res) => {
        this.playlists.push(res.playlist);
        this.name_playlist = '';
        this.is_public = false;
        this.errorMsg = '';
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Error al crear playlist';
      },
    });
  }

  deletePlaylist(id: number) {
    if (!confirm('¿Seguro que deseas eliminar esta playlist?')) return;

    this.playlistService.deletePlaylist(id).subscribe({
      next: () => {
        this.playlists = this.playlists.filter((p) => p.id !== id);
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se pudo eliminar la playlist';
      },
    });
  }
}
