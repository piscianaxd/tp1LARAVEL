import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Output() closeSidebar = new EventEmitter<void>();
  @Input() isOpen: boolean = false;

  constructor(public router: Router) {}

  close(): void {
    this.closeSidebar.emit();
  }

  // 🔹 Función general para hacer scroll
  private scrollToSection(selectorList: string[]): void {
    let targetElement: HTMLElement | null = null;

    for (const selector of selectorList) {
      targetElement = document.querySelector(selector);
      if (targetElement) break;
    }

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetElement.classList.add('highlight-section');
      setTimeout(() => targetElement?.classList.remove('highlight-section'), 2000);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ✅ Ir a Playlists
  scrollToPlaylists(): void {
    this.close();

    const selectors = [
      'app-playlists',
      '.playlists-section',
      '.playlists-container',
      '[data-section="playlists"]'
    ];

    if (this.router.url !== '/dashboard' && this.router.url !== '/') {
      this.router.navigate(['/dashboard']).then(() => {
        setTimeout(() => this.scrollToSection(selectors), 300);
      });
    } else {
      setTimeout(() => this.scrollToSection(selectors), 100);
    }
  }

  // ✅ Ir a Recomendaciones — corregido selector principal
  goToRecommended(): void {
    this.close();

    const selectors = [
      'app-recommendations', // ✅ este es el correcto según tu HTML
      '.recommended-section',
      '[data-section="recommended"]'
    ];

    if (this.router.url !== '/dashboard' && this.router.url !== '/') {
      this.router.navigate(['/dashboard']).then(() => {
        setTimeout(() => this.scrollToSection(selectors), 300);
      });
    } else {
      setTimeout(() => this.scrollToSection(selectors), 100);
    }
  }

  // ✅ Ir a Mixes Populares
  goToMixes(): void {
    this.close();

    const selectors = [
      'app-mixes-capsule',
      '.mixes-section',
      '[data-section="mixes"]'
    ];

    if (this.router.url !== '/dashboard' && this.router.url !== '/') {
      this.router.navigate(['/dashboard']).then(() => {
        setTimeout(() => this.scrollToSection(selectors), 300);
      });
    } else {
      setTimeout(() => this.scrollToSection(selectors), 100);
    }
  }
}
