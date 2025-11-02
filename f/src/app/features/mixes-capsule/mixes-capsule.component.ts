import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MixesService, Song } from '../../services/mixes.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-mixes-capsule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mixes-capsule.component.html',
  styleUrls: ['./mixes-capsule.component.css']
})
export class MixesCapsuleComponent implements OnInit {
  filters = ['Rock', 'Pop', 'Punk', 'Hip-Hop', 'Electronic','Alternative', 'Metal'];
  activeFilter = signal('Punk');
  songs = signal<Song[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  noImg = new Set<number>();

  private isLoading = false;
  private hasLoadedOnce = false;
  private readonly baseUrl = 'http://localhost:8000'; // ⚙️ Base del backend

  constructor(private mixesService: MixesService) {}

  ngOnInit(): void {
    if (this.hasLoadedOnce) return;
    this.hasLoadedOnce = true;
    this.loadSongsByGenre(this.activeFilter());
  }

  selectFilter(filter: string) {
    if (filter === this.activeFilter() || this.isLoading) return;
    this.activeFilter.set(filter);
    this.loadSongsByGenre(filter);
  }

  loadSongsByGenre(genre: string) {
    if (this.isLoading) return;
    this.isLoading = true;
    this.loading.set(true);
    this.error.set(null);

    this.mixesService.getSongsByGenre(genre).subscribe({
      next: (res) => {
        // 🔹 Normalizamos las URLs de las imágenes
        const normalizedSongs = (res.songs || []).map(song => ({
          ...song,
          art_work_song: song.art_work_song?.startsWith('http')
            ? song.art_work_song
            : `${this.baseUrl}${song.art_work_song}`
        }));

        this.songs.set(normalizedSongs);
        this.loading.set(false);
        this.isLoading = false;
        console.log('🎧 Canciones cargadas:', normalizedSongs);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar canciones:', err);
        this.error.set('No se pudieron obtener las canciones del servidor.');
        this.songs.set([]);
        this.loading.set(false);
        this.isLoading = false;
      }
    });
  }

  onImgError(ev: Event, song: Song) {
    this.noImg.add(song.id);
  }

  bust(id: number) {
    return `?v=${id}`;
  }
}
