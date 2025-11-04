import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { RandomTrackService, Song } from '../../services/random-track.service';
import { PlayerService } from '../../services/player.service';
import { Track } from '../../models/track/track.model';
import { songToTrack } from '../../helpers/adapters'; 
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { AddToPlaylistService } from '../../services/add-to-playlist.service';

@Component({
  selector: 'app-random-tracks',
  standalone: true,
  imports: [CommonModule, MediaUrlPipe],
  templateUrl: './random-track.component.html',
  styleUrls: ['./random-track.component.css']
})
export class RandomTracksComponent implements OnInit {
  // estado
  loading = signal(true);
  error   = signal<string | null>(null);

  // canciones visibles en la página actual
  tracks = signal<Song[]>([]);

  // paginado simple: 3 páginas x 6 = 18
  currentPage = signal(0);
  maxPages    = signal(3);

  // cache por página
  private generatedSongs = new Map<number, Song[]>();

  // helpers de UI
  canGoNext = computed(() => this.currentPage() < this.maxPages() - 1);
  canGoPrev = computed(() => this.currentPage() > 0);
  hasReachedLimit = computed(() => !this.canGoNext());

  // control de fallback de imagen
  noImg = new Set<number>();

  // ✅ CORREGIDO: Usar inject() para el servicio
  private addToPlaylistService = inject(AddToPlaylistService);

  constructor(
    private randomTrackService: RandomTrackService,
    private player: PlayerService
  ) {}

  ngOnInit(): void {
    this.loadRandomTracks();
  }

  loadRandomTracks(): void {
    const page = this.currentPage();

    // usar cache si ya existe
    const cached = this.generatedSongs.get(page);
    if (cached) {
      this.tracks.set(cached);
      this.loading.set(false);
      this.error.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.randomTrackService.getRandomSongs(6).subscribe({
      next: (res) => {
        const songs = res.songs ?? [];
        this.generatedSongs.set(page, songs);
        this.tracks.set(songs);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error random tracks:', err);
        let msg = 'No se pudieron cargar las canciones aleatorias.';
        if (err.status === 0)       msg = 'Error de conexión: no se pudo conectar al servidor.';
        else if (err.status === 401) msg = 'No autorizado: token inválido o expirado.';
        else if (err.status === 404) msg = 'Endpoint no encontrado. Verificá la URL.';
        else if (err.status >= 500)  msg = 'Error del servidor. Probá más tarde.';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  nextPage(): void {
    if (!this.canGoNext()) return;
    this.currentPage.set(this.currentPage() + 1);
    this.loadRandomTracks();
  }

  prevPage(): void {
    if (!this.canGoPrev()) return;
    this.currentPage.set(this.currentPage() - 1);
    this.loadRandomTracks();
  }

  // ✅ NUEVO: Método para agregar a playlist
  addToPlaylist(song: Song, event: Event): void {
    event.stopPropagation(); // Importante para evitar que se propague el click
    
    this.addToPlaylistService.openModal({
      id: song.id,
      name_song: song.name_song,
      artist_song: song.artist_song,
      album_song: song.album_song,
      art_work_song: song.art_work_song,
      duration: song.duration
    });
  }

  // reproducir una
  play(song: Song): void {
    const t: Track = songToTrack(song);
    const queue: Track[] = this.tracks().map(songToTrack);
    this.player.playNow(t, queue);
  }

  // reproducir todas las visibles (o todas generadas hasta ahora si preferís)
  playAll(): void {
    const q: Track[] = this.tracks().map(songToTrack);
    if (q.length) this.player.playNow(q[0], q);
  }

  // si preferís "todas las generadas hasta el momento"
  getAllSongs(): Song[] {
    const all: Song[] = [];
    for (let i = 0; i <= this.currentPage(); i++) {
      const pg = this.generatedSongs.get(i);
      if (pg) all.push(...pg);
    }
    return all;
  }

  // cache-busting opcional para carátulas
  bust(id: number) { return `?v=${id}`; }

  onImgError(ev: Event, song: Song) {
    this.noImg.add(song.id);
    console.warn('IMG ERROR:', song.art_work_song, (ev.target as HTMLImageElement).currentSrc);
  }

  resetAndReload(): void {
    this.generatedSongs.clear();
    this.currentPage.set(0);
    this.loadRandomTracks();
  }
}