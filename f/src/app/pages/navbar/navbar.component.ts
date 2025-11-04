import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { SearchResultsComponent } from '../search-results/search-results.component';
import { ProfileModalComponent } from '../profile/profile.component';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    SearchResultsComponent, 
    ProfileModalComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavBar implements OnInit {
  username: string = 'Usuario';
  searchQuery: string = '';
  currentComponent: string = '';
  placeholder: string = 'Buscar canciones, playlists, artistas...';
  searchTerm: string = '';
  usuarioActual: string = 'Usuario';
  isSearchFocused: boolean = false;
  
  // Solo para modal de perfil
  showProfileModal: boolean = false;

  constructor(public searchService: SearchService, public router: Router) {}

  ngOnInit() {
    this.setPlaceholderByRoute();

    const usuarioGuardado = localStorage.getItem('user');
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        this.usuarioActual = usuario.name || 'Usuario';
      } catch {
        this.usuarioActual = 'Usuario';
      }
    }

    this.searchService.globalSearchTerm$.subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
      }
    });

    this.searchService.currentComponent$.subscribe(component => {
      setTimeout(() => {
        this.placeholder = this.getPlaceholder(component);
      });
    });
  }

  private setPlaceholderByRoute() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('songs') || currentPath.includes('canciones')) {
      this.placeholder = 'Buscar canciones...';
    } else if (currentPath.includes('playlists')) {
      this.placeholder = 'Buscar playlists...';
    } else if (currentPath.includes('artists') || currentPath.includes('artistas')) {
      this.placeholder = 'Buscar artistas...';
    } else if (currentPath.includes('albums') || currentPath.includes('albumes')) {
      this.placeholder = 'Buscar álbumes...';
    } else if (currentPath === '/dashboard' || currentPath === '/') {
      this.placeholder = 'Buscar canciones, playlists, artistas...';
    } else {
      this.placeholder = 'Buscar canciones, playlists, artistas...';
    }
  }

  private getPlaceholder(component: string): string {
    switch (component) {
      case 'songs':
      case 'canciones':
        return 'Buscar canciones...';
      case 'playlists':
        return 'Buscar playlists...';
      case 'artists':
      case 'artistas':
        return 'Buscar artistas...';
      case 'albums':
      case 'albumes':
        return 'Buscar álbumes...';
      case 'dashboard':
        return 'Buscar canciones, playlists, artistas...';
      default:
        return 'Buscar canciones, playlists, artistas...';
    }
  }

  onSearch() {
    this.searchService.setGlobalSearchTerm(this.searchTerm);
    
    if (this.esDashboard()) {
      this.searchService.setDashboardSearchTerm(this.searchTerm);
    } else {
      this.searchService.setSearchTerm(this.searchTerm);
    }
  }

  onSearchFocus() {
    this.isSearchFocused = true;
    if (this.searchTerm) {
      this.onSearch();
    }
  }

  onSearchBlur() {
    setTimeout(() => {
      this.isSearchFocused = false;
    }, 200);
  }

  clearSearch() {
    this.searchTerm = '';
    this.isSearchFocused = false;
    this.searchService.clearGlobalSearch();
    this.searchService.clearSearch();
    this.searchService.clearDashboardSearch();
  }

  // === SOLO PARA MODAL DE PERFIL ===
  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.updateUserName();
  }

  private updateUserName(): void {
    const usuarioGuardado = localStorage.getItem('user');
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        this.usuarioActual = usuario.name || 'Usuario';
      } catch {
        this.usuarioActual = 'Usuario';
      }
    }
  }

  esDashboard(): boolean {
    return this.router.url === '/dashboard' || this.router.url === '/';
  }
}