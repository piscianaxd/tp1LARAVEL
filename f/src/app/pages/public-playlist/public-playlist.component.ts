import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-public-playlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-playlist.component.html',
  styleUrls: ['./public-playlist.component.css']
})
export class PublicPlaylistComponent implements OnInit {

  private http = inject(HttpClient);

  loading = signal(true);
  error   = signal<string | null>(null);
  playlists = signal<any[]>([]);

  ngOnInit(): void {
    this.loadPublicPlaylists();
  }

  loadPublicPlaylists(): void {
    this.loading.set(true);
    this.error.set(null);

    const userRaw = localStorage.getItem('user');
    const userId = userRaw ? JSON.parse(userRaw).id : null;

this.http.get<any[]>(`http://localhost:8000/api/song/get-playlist`, {
      params: { exclude_user_id: userId }
    }).subscribe({
      next: (res) => {
        this.playlists.set(res || []);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar playlists:', err);
        let msg = 'No se pudieron cargar las playlists públicas.';
        if (err.status === 0) msg = 'Error de conexión con el servidor.';
        else if (err.status >= 500) msg = 'Error interno del servidor.';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  openPlaylist(pl: any): void {
    // Podés abrir un modal o navegar a la ruta /playlist/:id
    console.log('Abrir playlist', pl);
  }
}
