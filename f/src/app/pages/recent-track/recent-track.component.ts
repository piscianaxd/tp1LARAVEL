import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HistoryService, HistoryTrack } from '../../services/history.service';
import { Track } from '../../models/track/track.model';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-recent-tracks',
  standalone: true,
  imports: [CommonModule, RouterModule, MediaUrlPipe],
  templateUrl: './recent-track.component.html',
  styleUrls: ['./recent-track.component.css']
})
export class RecentTracksComponent implements OnInit {
  loading = signal(true);
  error   = signal<string | null>(null);

  // 🔹 Lista "cruda" (todo el historial, con posibles duplicados por canción)
  private all = signal<HistoryTrack[]>([]);

  // 🔹 Vista deduplicada por canción (conserva la MÁS RECIENTE)
  visible = computed<HistoryTrack[]>(() => this.dedupeBySong(this.all()));

  // Paginación 3×3
  readonly pageSize = 9;
  readonly COLS = 3;
  page = signal(0);

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.visible().length / this.pageSize))
  );

  pageItems = computed<HistoryTrack[]>(() => {
    const v = this.visible();
    const start = this.page() * this.pageSize;
    return v.slice(start, start + this.pageSize);
  });

  columns = computed<HistoryTrack[][]>(() => {
    const list = this.pageItems();
    const colSize = Math.ceil((list.length || 1) / this.COLS);
    return Array.from({ length: this.COLS }, (_, i) => list.slice(i * colSize, (i + 1) * colSize));
  });

  // control de imagen fallida por id
  noImg = new Set<number>();

  constructor(
    private history: HistoryService,
    private player: PlayerService
  ) {}

  ngOnInit(): void {
    this.history.getHistory().subscribe({
      next: (data) => {
        // El backend ya viene ordenado desc por fecha → la primera ocurrencia de cada canción es la más reciente
        this.all.set(data);
        this.clampPage();
        this.loading.set(false);
      },
      error: () => { this.error.set('No se pudo cargar el historial.'); this.loading.set(false); }
    });
  }

  // ✅ Deduplicar por id de canción (quedarse con la PRIMERA ocurrencia del array ya ordenado desc)
  private dedupeBySong(list: HistoryTrack[]): HistoryTrack[] {
    const seen = new Set<number>(); // ids de canción
    const out: HistoryTrack[] = [];
    for (const t of list) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
    return out;
  }

  // navegación
  canPrev() { return this.page() > 0; }
  canNext() { return this.page() < this.totalPages() - 1; }
  prev()    { if (this.canPrev()) this.page.set(this.page() - 1); }
  next()    { if (this.canNext()) this.page.set(this.page() + 1); }
  private clampPage() {
    this.page.set(Math.min(this.page(), this.totalPages() - 1));
  }

  // acciones
  playAll() {
    const q: Track[] = this.pageItems().map(x => x); // HistoryTrack extiende Track
    if (q.length) this.player.playNow(q[0], q);
  }

  play(t: HistoryTrack) {
    const q: Track[] = this.pageItems().map(x => x);
    this.player.playNow(t, q);
  }

  // 🔁 Importante: borrar del origen "all" y se recalcula la vista deduplicada
  remove(historyId: number) {
    this.history.deleteFromHistory(historyId).subscribe({
      next: () => {
        const nextAll = this.all().filter(it => it.historyId !== historyId);
        this.all.set(nextAll);
        this.clampPage();
      }
    });
  }

  bust(id: number) { return `?v=${id}`; }
  onImgError(ev: Event, t: HistoryTrack) {
    this.noImg.add(t.id);
    // console.warn('IMG ERROR:', t.artwork, (ev.target as HTMLImageElement).currentSrc);
  }

  rel(d: Date) {
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'justo ahora';
    if (diff < 3600) return `${Math.floor(diff/60)} min`;
    if (diff < 86400) return `${Math.floor(diff/3600)} h`;
    return `${Math.floor(diff/86400)} d`;
  }
}
