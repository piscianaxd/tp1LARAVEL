import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';          // 👈 necesario para *ngIf, ngClass, else
import { PlayerService } from '../../services/player.service';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe'; // 👈 tu pipe standalone

@Component({
  selector: 'app-player-bar',
  standalone: true,
  templateUrl: './player-bar.component.html',
  styleUrls: ['./player-bar.component.css'],
  imports: [CommonModule, MediaUrlPipe]                   // 👈 IMPORTANTE
})
export class PlayerBarComponent {
  useFallback = false;

  constructor(public player: PlayerService) {}

  onCoverError() { this.useFallback = true; }
  onCoverLoad()  { this.useFallback = false; }

  fmt(n: number) {
    const t = Math.floor(n || 0);
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  remaining(): number {
    const d = this.player.duration() || 0;
    const c = this.player.currentTime() || 0;
    return Math.max(0, d - c);
  }
}
