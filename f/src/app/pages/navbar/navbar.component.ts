import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { SearchResultsComponent } from '../search-results/search-results.component';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SearchResultsComponent],
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

  constructor(public searchService: SearchService, public router: Router) {}

  ngOnInit() {
    this.setPlaceholderByRoute();

    // Obtener nombre del usuario guardado
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        this.usuarioActual = usuario.nombre || 'Usuario';
      } catch {
        this.usuarioActual = 'Usuario';
      }
    }

    // Sincronizar con búsqueda global cuando cambia
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
    // Usar búsqueda global
    this.searchService.setGlobalSearchTerm(this.searchTerm);
    
    // Si estamos en dashboard, también actualizar la búsqueda del dashboard
    if (this.esDashboard()) {
      this.searchService.setDashboardSearchTerm(this.searchTerm);
    } else {
      // Para otras páginas, usar la búsqueda normal
      this.searchService.setSearchTerm(this.searchTerm);
    }
  }

  onSearchFocus() {
    this.isSearchFocused = true;
    // Si ya hay término de búsqueda, disparar la búsqueda al enfocar
    if (this.searchTerm) {
      this.onSearch();
    }
  }

  onSearchBlur() {
    // Pequeño delay para permitir clicks en los resultados
    setTimeout(() => {
      this.isSearchFocused = false;
    }, 200);
  }

  clearSearch() {
    this.searchTerm = '';
    this.isSearchFocused = false;
    // Limpiar todas las búsquedas
    this.searchService.clearGlobalSearch();
    this.searchService.clearSearch();
    this.searchService.clearDashboardSearch();
  }

  // Detectar si está en dashboard
  esDashboard(): boolean {
    return this.router.url === '/dashboard' || this.router.url === '/';
  }
}