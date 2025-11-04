// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SearchService, DashboardComponent as DashboardComponentInterface } from '../../services/search.service';

import { RecentTracksComponent } from '../recent-track/recent-track.component';
import { RandomTracksComponent } from '../random-track/random-track.component';
import { MixesCapsuleComponent } from '../../features/mixes-capsule/mixes-capsule.component';
import { AutoPlaylistsComponent } from '../auto-playlist/auto-playlist.component';
import { PlayerBarComponent } from '../player-bar/player-bar.component';
import { NavBar } from "../navbar/navbar.component";
import { RecommendationsComponent } from '../recommended-songs/recommended-songs.component';
import { PlaylistsComponent } from '../playlist/playlist.component';
import { AddToPlaylistComponent } from '../add-to-playlist/add-to-playlist.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,AddToPlaylistComponent, PlaylistsComponent, RecentTracksComponent, RandomTracksComponent, MixesCapsuleComponent, AutoPlaylistsComponent, NavBar, PlayerBarComponent, RecommendationsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  filteredCards: DashboardCard[] = [];
  private searchSubscription!: Subscription;

  cards: DashboardCard[] = [
    // ... tus cards existentes ...
  ];

  constructor(private searchService: SearchService) {
    this.filteredCards = this.cards;
  }

  ngOnInit() {
    // 🔥 MODIFICADO: Solo escuchar búsqueda del dashboard, NO global
    this.searchSubscription = this.searchService.dashboardSearchTerm$.subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
        this.performSearch();
      }
    });

    // 🔥 NUEVO: Configurar el componente actual para el servicio de búsqueda
    this.searchService.setCurrentComponent('dashboard');
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    // 🔥 NUEVO: Limpiar el componente actual
    this.searchService.setCurrentComponent('');
  }

  onSearchChange() {
    // 🔥 MODIFICADO: Solo usar búsqueda del dashboard
    this.searchService.setDashboardSearchTerm(this.searchTerm);
    this.performSearch();
  }

  clearSearch() {
    this.searchTerm = '';
    // 🔥 MODIFICADO: Solo limpiar búsqueda del dashboard
    this.searchService.clearDashboardSearch();
    this.filteredCards = this.cards;
  }

  private performSearch() {
    if (this.searchTerm.trim()) {
      this.filteredCards = this.searchService.searchDashboardComponents(
        this.cards as DashboardComponentInterface[], 
        this.searchTerm
      );
    } else {
      this.filteredCards = this.cards;
    }
  }

  getSearchResultsCount(): number {
    return this.filteredCards.length;
  }

  getTotalCardsCount(): number {
    return this.cards.length;
  }
}

interface DashboardCard {
  title: string;
  icon: string;
  description: string;
  route?: string;
  disabled?: boolean;
  type: string;
}