import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentTracksComponent } from '../recent-track/recent-track.component';
import { RandomTracksComponent } from '../random-track/random-track.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RecentTracksComponent, RandomTracksComponent ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {}
