import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentTracksComponent } from '../recent-track/recent-track.component';
import { RandomTracksComponent } from '../random-track/random-track.component';
import { MixesCapsuleComponent } from '../../features/mixes-capsule/mixes-capsule.component';

import { AutoPlaylistsComponent } from '../auto-playlist/auto-playlist.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RecentTracksComponent, RandomTracksComponent,MixesCapsuleComponent ,AutoPlaylistsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {}
