import { Injectable, signal, effect } from '@angular/core';
import { Track } from '../models/track/track.model';
import { HistoryService } from './history.service';

type RepeatMode = 'off' | 'all' | 'one';

interface PersistedState {
  current: Track | null;
  queue: Track[];
  index: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  position: number;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly LS_KEY = 'player.state.v1';
  private readonly BASE = 'http://localhost:8000'; // si usás proxy /media, podés removerlo

  private audio = new Audio();

  // ---- State (signals) ----
  private _current = signal<Track | null>(null);
  private _queue   = signal<Track[]>([]);
  private _index   = signal<number>(-1);

  private _isPlaying   = signal<boolean>(false);
  private _shuffle     = signal<boolean>(false);
  private _repeat      = signal<RepeatMode>('off');

  private _muted   = signal<boolean>(false);
  private _volume  = signal<number>(1);     // 0..1
  private _time    = signal<number>(0);     // seconds
  private _dur     = signal<number>(0);     // seconds

  constructor(private history: HistoryService) {
    this.restore();

    // Listeners del <audio>
    this.audio.preload = 'metadata';
    this.audio.volume  = this._volume();
    this.audio.muted   = this._muted();

    this.audio.addEventListener('loadedmetadata', () => {
      this._dur.set(Number.isFinite(this.audio.duration) ? this.audio.duration : 0);
    });
    this.audio.addEventListener('timeupdate', () => {
      this._time.set(this.audio.currentTime || 0);
    });
    this.audio.addEventListener('play',  () => this._isPlaying.set(true));
    this.audio.addEventListener('pause', () => this._isPlaying.set(false));
    this.audio.addEventListener('ended', () => this.handleEnded());

    // Persistencia automática cuando cambian señales clave
    effect(() => {
      this.persist();
    });
  }

  // ---------- API pública usada por la barra / componentes ----------

  current() { return this._current(); }
  queue()   { return this._queue(); }
  index()   { return this._index(); }

  isPlaying() { return this._isPlaying(); }

  shuffle() { return this._shuffle(); }
  toggleShuffle() { this._shuffle.set(!this._shuffle()); }

  repeat() { return this._repeat(); }
  cycleRepeat() {
    const order: RepeatMode[] = ['off','all','one'];
    const next = order[(order.indexOf(this._repeat()) + 1) % order.length];
    this._repeat.set(next);
  }

  muted() { return this._muted(); }
  volume() { return this._volume(); }
  setVolume(v: number) {
    const clamped = Math.min(1, Math.max(0, v ?? 0));
    this._volume.set(clamped);
    this.audio.volume = clamped;
    if (clamped > 0) this._muted.set(false);
  }
  toggleMute() {
    const newMuted = !this._muted();
    this._muted.set(newMuted);
    this.audio.muted = newMuted;
  }

  currentTime() { return this._time(); }
  duration()    { return this._dur(); }
  seek(sec: number) {
    const t = Math.min(this._dur(), Math.max(0, sec ?? 0));
    this.audio.currentTime = t;
    this._time.set(t);
  }

  playNow(track: Track, queue?: Track[]) {
    // Si se pasa una lista, la usamos como cola visible
    if (queue && queue.length) {
      this._queue.set(queue);
      const idx = queue.findIndex(x => x.id === track.id);
      this._index.set(idx >= 0 ? idx : 0);
    } else {
      // Sin lista: si ya hay cola, intentamos ubicarlo; si no, cola 1 ítem
      const q = this._queue();
      if (q.length) {
        const idx = q.findIndex(x => x.id === track.id);
        if (idx >= 0) this._index.set(idx);
        else {
          this._queue.set([track]);
          this._index.set(0);
        }
      } else {
        this._queue.set([track]);
        this._index.set(0);
      }
    }

    this._current.set(track);
    this.loadAndPlay(track);

    // Registrar historial (ignorar errores)
    if (track.id) {
      this.history.addToHistory(track.id).subscribe({ next: () => {}, error: () => {} });
    }
  }

  enqueue(t: Track) {
    this._queue.set([...this._queue(), t]);
  }

  enqueueNext(t: Track) {
    const q = this._queue();
    const i = this._index();
    if (i < 0) {
      this._queue.set([t]);
      this._index.set(0);
    } else {
      const newQ = q.slice();
      newQ.splice(i + 1, 0, t);
      this._queue.set(newQ);
    }
  }

  togglePlayPause() {
    if (!this._current()) return;
    if (this._isPlaying()) this.audio.pause();
    else this.audio.play().catch(() => {});
  }

  next() {
    const q = this._queue();
    if (!q.length) return;

    // Shuffle
    if (this._shuffle()) {
      const candidates = q.map((_, i) => i).filter(i => i !== this._index());
      if (!candidates.length) {
        // solo uno en cola
        return this.replayOrStop();
      }
      const randomIndex = candidates[Math.floor(Math.random() * candidates.length)];
      this._index.set(randomIndex);
      return this.playNow(q[randomIndex], q);
    }

    // Secuencial
    const i = this._index();
    if (i < q.length - 1) {
      this._index.set(i + 1);
      return this.playNow(q[i + 1], q);
    }

    // Fin de cola
    if (this._repeat() === 'all') {
      this._index.set(0);
      return this.playNow(q[0], q);
    }

    // No repetir
    this.audio.pause();
    this.seek(0);
  }

  prev() {
    const q = this._queue();
    if (!q.length) return;

    // si ya corrimos > 3s, reiniciamos
    if (this._time() > 3) return this.seek(0);

    // shuffle: simplemente tomamos uno aleatorio distinto
    if (this._shuffle()) {
      const candidates = q.map((_, i) => i).filter(i => i !== this._index());
      if (!candidates.length) return this.seek(0);
      const randomIndex = candidates[Math.floor(Math.random() * candidates.length)];
      this._index.set(randomIndex);
      return this.playNow(q[randomIndex], q);
    }

    // Secuencial hacia atrás
    const i = this._index();
    if (i > 0) {
      this._index.set(i - 1);
      return this.playNow(q[i - 1], q);
    }

    // Inicio de cola
    if (this._repeat() === 'all') {
      const last = q.length - 1;
      this._index.set(last);
      return this.playNow(q[last], q);
    }

    // Nada más atrás
    this.seek(0);
  }

  // ---------- Internas ----------

  private loadAndPlay(t: Track) {
    this._dur.set(0);
    this._time.set(0);
    this.audio.src = this.resolve(t.url);
    this.audio.play().catch(() => {
      // si el play falla (autoplay policy), igual dejamos cargado
    });
  }

  private replayOrStop() {
    if (this._repeat() === 'one') {
      this.seek(0);
      this.audio.play().catch(() => {});
    } else {
      this.audio.pause();
      this.seek(0);
    }
  }

  private handleEnded() {
    if (this._repeat() === 'one') {
      this.seek(0);
      this.audio.play().catch(() => {});
      return;
    }
    this.next();
  }

  private resolve(url: string): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    // si en dev usás proxy, podrías devolver url tal cual:
    // return url;
    return `${this.BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private persist() {
    const state: PersistedState = {
      current: this._current(),
      queue: this._queue(),
      index: this._index(),
      volume: this._volume(),
      muted: this._muted(),
      shuffle: this._shuffle(),
      repeat: this._repeat(),
      position: this._time(),
    };
    try {
      localStorage.setItem(this.LS_KEY, JSON.stringify(state));
    } catch {}
  }

  private restore() {
    try {
      const raw = localStorage.getItem(this.LS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as PersistedState;
      this._current.set(s.current ?? null);
      this._queue.set(Array.isArray(s.queue) ? s.queue : []);
      this._index.set(typeof s.index === 'number' ? s.index : -1);
      this._volume.set(typeof s.volume === 'number' ? s.volume : 1);
      this._muted.set(!!s.muted);
      this._shuffle.set(!!s.shuffle);
      this._repeat.set((['off','all','one'] as RepeatMode[]).includes(s.repeat) ? s.repeat : 'off');

      this.audio.volume = this._volume();
      this.audio.muted  = this._muted();

      if (this._current()) {
        // Cargamos el tema pero sin auto-reproducir
        this.audio.src = this.resolve(this._current()!.url);
        this.audio.currentTime = Math.max(0, s.position || 0);
        this._time.set(this.audio.currentTime);
      }
    } catch {}
  }
}
