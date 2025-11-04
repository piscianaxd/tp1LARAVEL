import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage  } from '@angular/common';
import { MixesService, Song } from '../../services/mixes.service';
import { HttpErrorResponse } from '@angular/common/http';
import { PlayerService } from '../../services/player.service';
import { Track } from '../../models/track/track.model';
import { songToTrack } from '../../helpers/adapters';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';

@Component({
  selector: 'app-mixes-capsule',
  standalone: true,
  imports: [CommonModule, MediaUrlPipe, NgOptimizedImage],
  templateUrl: './mixes-capsule.component.html',
  styleUrls: ['./mixes-capsule.component.css']
})
export class MixesCapsuleComponent implements OnInit {
  filters = ['Rock', 'Pop', 'Punk', 'Hip-Hop', 'Electronic','Alternative', 'Metal'];
  activeFilter = signal('Pop');

  songs   = signal<Song[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);
  trackById = (_: number, s: Song) => s.id;

  noImg = new Set<number>();

  /** Cache por género para evitar pedir de nuevo */
  private cache = new Map<string, Song[]>();
  private inFlight = false;

  constructor(
    private mixesService: MixesService,
    private player: PlayerService
  ) {}

  ngOnInit(): void {
    this.loadSongsByGenre(this.activeFilter());
  }

  selectFilter(filter: string) {
    if (filter === this.activeFilter() || this.inFlight) return;
    this.activeFilter.set(filter);
    this.loadSongsByGenre(filter);
  }

  loadSongsByGenre(genre: string) {
    if (this.inFlight) return;

    // Cache hit
    const cached = this.cache.get(genre);
    if (cached) {
      this.songs.set(cached);
      this.error.set(null);
      return;
    }

    // Fetch
    this.inFlight = true;
    this.loading.set(true);
    this.error.set(null);

    this.mixesService.getSongsByGenre(genre).subscribe({
      next: (res) => {
        const list = (res.songs ?? []);
        this.cache.set(genre, list);
        this.songs.set(list);
        this.loading.set(false);
        this.inFlight = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar canciones:', err);
        this.error.set('No se pudieron obtener las canciones del servidor.');
        this.songs.set([]);
        this.loading.set(false);
        this.inFlight = false;
      }
    });
  }

  /** Reproduce una canción del grid con la cola = grid actual */
  play(song: Song) {
    const t: Track = songToTrack(song);
    const queue: Track[] = this.songs().map(songToTrack);
    this.player.playNow(t, queue);
  }

  /** Reproduce el grid completo desde la primera */
  playAll() {
    const queue: Track[] = this.songs().map(songToTrack);
    if (queue.length) this.player.playNow(queue[0], queue);
  }

  onImgError(_ev: Event, song: Song) {
    this.noImg.add(song.id);
  }

  /** cache-busting opcional para imágenes/portadas */
  bust(id: number) { return `?v=${id}`; }
}
