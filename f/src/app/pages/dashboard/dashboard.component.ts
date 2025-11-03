import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentTracksComponent } from '../recent-track/recent-track.component';
import { RecommendationsComponent } from '../recommended-songs/recommended-songs.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RecentTracksComponent, RecommendationsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {}
