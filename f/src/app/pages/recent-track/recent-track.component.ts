  import { Component, OnInit, signal } from '@angular/core';
  import { CommonModule, NgOptimizedImage } from '@angular/common';
  import { RouterModule } from '@angular/router';
  import { HistoryService, Track } from '../../services/history.service';
  import { EllipsisPipe } from '../../shared/pipes/ellipsis.pipe';
  import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';

  @Component({
    selector: 'app-recent-tracks',
    standalone: true,
    imports: [CommonModule, RouterModule, MediaUrlPipe],
    templateUrl: './recent-track.component.html',
    styleUrls: ['./recent-track.component.css']
  })
  export class RecentTracksComponent implements OnInit {
    loading = signal(true);
    error = signal<string | null>(null);
    tracks = signal<Track[]>([]);
    columns = signal<Track[][]>([]);   // 👈 columnas ya precalculadas

    private readonly COLS = 3;

    constructor(private history: HistoryService) {}

    ngOnInit(): void {
      this.history.getHistory().subscribe({
        next: (data) => {
          this.tracks.set(data);
          this.columns.set(this.toColumns(data, this.COLS));
          this.loading.set(false);
        },
        error: () => { this.error.set('No se pudo cargar el historial.'); this.loading.set(false); }
      });
    }

    noImg = new Set<number>();                 // tracks con imagen fallida

      bust(id: number) {                         // cache-buster para evitar 404 cacheadas
        return `?v=${id}`;
      }

      onImgError(ev: Event, t: Track) {          // marcar el track y mostrar ícono
        this.noImg.add(t.id);
        // opcional: log de depuración
         console.warn('IMG ERROR:', t.artwork, (ev.target as HTMLImageElement).currentSrc);
      }



    private toColumns(list: Track[], cols: number): Track[][] {
      const size = Math.ceil((list.length || 1) / cols);
      return Array.from({ length: cols }, (_, i) => list.slice(i * size, (i + 1) * size));
    }


    playAll() {
      // TODO: integrar con tu reproductor
      console.log('Reproducir todo', this.tracks());
    }

    play(track: Track) {
      // TODO: iniciar reproducción track.url
      console.log('Play', track);
    }

    remove(historyId: number) {
      this.history.deleteFromHistory(historyId).subscribe({
        next: () => this.tracks.set(this.tracks().filter(t => t.historyId !== historyId))
      });
    }

    // util: fecha relativa simple
    rel(d: Date) {
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return 'justo ahora';
      if (diff < 3600) return `${Math.floor(diff/60)} min`;
      if (diff < 86400) return `${Math.floor(diff/3600)} h`;
      return `${Math.floor(diff/86400)} d`;
    }
  }

  