import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RandomTrackService, Song } from '../../services/random-track.service';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-random-tracks',
  standalone: true,
  imports: [CommonModule, MediaUrlPipe],
  templateUrl: './random-track.component.html',
  styleUrls: ['./random-track.component.css']
})
export class RandomTracksComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  tracks = signal<Song[]>([]);
  currentPage = signal(0);
  maxPages = signal(3); // 3 páginas × 6 canciones = 18 canciones máximo

  // Almacenar todas las canciones generadas por página
  generatedSongs = new Map<number, Song[]>();

  constructor(private randomTrackService: RandomTrackService) {}

  ngOnInit(): void {
    this.loadRandomTracks();
  }

  loadRandomTracks() {
    // Si ya tenemos canciones generadas para esta página, usarlas
    if (this.generatedSongs.has(this.currentPage())) {
      const cachedSongs = this.generatedSongs.get(this.currentPage());
      if (cachedSongs) {
        this.tracks.set(cachedSongs);
        this.loading.set(false);
        return;
      }
    }

    this.loading.set(true);
    this.error.set(null);
    
    this.randomTrackService.getRandomSongs(6).subscribe({
      next: (response) => {
        // Guardar las canciones en el cache
        this.generatedSongs.set(this.currentPage(), response.songs);
        this.tracks.set(response.songs);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error completo:', err);
        
        let errorMessage = 'No se pudieron cargar las canciones aleatorias.';
        
        if (err.status === 0) {
          errorMessage = 'Error de conexión: No se pudo conectar al servidor.';
        } else if (err.status === 401) {
          errorMessage = 'No autorizado: Token inválido o expirado.';
        } else if (err.status === 404) {
          errorMessage = 'Endpoint no encontrado. Verifica la URL.';
        } else if (err.status >= 500) {
          errorMessage = 'Error del servidor. Intenta más tarde.';
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
      }
    });
  }

  nextPage() {
    const nextPage = this.currentPage() + 1;
    if (nextPage < this.maxPages()) {
      this.currentPage.set(nextPage);
      this.loadRandomTracks();
    }
  }

  prevPage() {
    const prevPage = this.currentPage() - 1;
    if (prevPage >= 0) {
      this.currentPage.set(prevPage);
      this.loadRandomTracks();
    }
  }

  play(song: Song) {
    // TODO: integrar con tu reproductor
    console.log('Reproducir:', song);
  }

  playAll() {
    // TODO: reproducir todas las canciones
    console.log('Reproducir todo:', this.getAllSongs());
  }

  // Obtener todas las canciones generadas hasta el momento
  getAllSongs(): Song[] {
    const allSongs: Song[] = [];
    for (let i = 0; i <= this.currentPage(); i++) {
      const pageSongs = this.generatedSongs.get(i);
      if (pageSongs) {
        allSongs.push(...pageSongs);
      }
    }
    return allSongs;
  }

  // Verificar si podemos ir a la siguiente página
  canGoNext(): boolean {
    return this.currentPage() < this.maxPages() - 1;
  }

  // Verificar si podemos ir a la página anterior
  canGoPrev(): boolean {
    return this.currentPage() > 0;
  }

  // Verificar si hemos alcanzado el límite máximo
  hasReachedLimit(): boolean {
    return !this.canGoNext();
  }

  // Cache busting para imágenes
  noImg = new Set<number>();
  
  bust(id: number) {
    return `?v=${id}`;
  }

  onImgError(ev: Event, song: Song) {
    this.noImg.add(song.id);
    console.warn('IMG ERROR:', song.art_work_song, (ev.target as HTMLImageElement).currentSrc);
  }

  // Método para resetear y comenzar de nuevo
  resetAndReload() {
    this.generatedSongs.clear();
    this.currentPage.set(0);
    this.loadRandomTracks();
  }
}