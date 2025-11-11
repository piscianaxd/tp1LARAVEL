import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { AlertService } from '../../services/alert.service';
import { SearchResultsComponent } from '../search-results/search-results.component';
import { ProfileModalComponent } from '../profile/profile.component';
import { SidebarComponent } from '../sidebar/sidebar.component'; 

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    SearchResultsComponent, 
    ProfileModalComponent,
    SidebarComponent
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
  
  // Para modal de perfil
  showProfileModal: boolean = false;
  
  // Para sidebar
  showSidebar: boolean = false;

  // Para controlar la visibilidad de los resultados de búsqueda
  showSearchResults: boolean = false;

  constructor(public searchService: SearchService, public router: Router, private alertService: AlertService) {}

  ngOnInit() {
    this.setPlaceholderByRoute();

    const usuarioGuardado = localStorage.getItem('auth_user');
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

  // Listener global para clicks fuera del área de búsqueda
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const searchContainer = document.querySelector('.search-container');
    const searchResults = document.querySelector('app-search-results');
    
    // Verificar si el click fue fuera del área de búsqueda y resultados
    if (searchContainer && searchResults) {
      const clickedInsideSearch = searchContainer.contains(target);
      const clickedInsideResults = searchResults.contains(target);
      
      if (!clickedInsideSearch && !clickedInsideResults) {
        this.hideSearchResults();
      }
    }
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

    // Mostrar resultados si hay término de búsqueda
    if (this.searchTerm.trim()) {
      this.showSearchResults = true;
    } else {
      this.showSearchResults = false;
    }
  }

  onSearchFocus() {
    this.isSearchFocused = true;
    // Mostrar resultados cuando se enfoca el input, si hay término de búsqueda
    if (this.searchTerm.trim()) {
      this.showSearchResults = true;
    }
    
    if (this.searchTerm) {
      this.onSearch();
    }
  }

  onSearchBlur() {
    // Usar timeout para permitir clicks en los resultados
    setTimeout(() => {
      this.isSearchFocused = false;
    }, 200);
  }

  // Método para ocultar resultados
  hideSearchResults() {
    this.showSearchResults = false;
  }

  // Método para mostrar resultados
  showResults() {
    if (this.searchTerm.trim()) {
      this.showSearchResults = true;
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.isSearchFocused = false;
    this.showSearchResults = false;
    this.searchService.clearGlobalSearch();
    this.searchService.clearSearch();
    this.searchService.clearDashboardSearch();
  }

  // === MODAL DE PERFIL ===
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

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  // MÉTODOS PARA SIDEBAR
  openSidebar(): void {
    if (!this.showSidebar) {
      this.showSidebar = true;
    }
    else {
      this.showSidebar = false;
    }
  }

  closeSidebar(): void {
    this.showSidebar = false;
  }
}