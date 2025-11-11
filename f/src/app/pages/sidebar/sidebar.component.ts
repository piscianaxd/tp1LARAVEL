import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
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
  @Input() isOpen = false;
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  constructor(private router: Router) {}

  open() {
    if (!this.isOpen) {
      this.isOpen = true;
      this.opened.emit();
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>('.sidebar-drawer');
        el?.focus();
      }, 0);
    }
  }

  close() {
    if (this.isOpen) {
      this.isOpen = false;
      this.closed.emit();
    }
  }

  @HostListener('document:keydown.escape') esc() { this.close(); }

  /** Navega al dashboard (si hace falta) y hace scroll a la sección */
  goTo(target: 'top' | 'playlists' | 'recommended' | 'mixes') {
    const run = () => {
      let selectors: string[] = [];
      if (target === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });

      if (target === 'playlists')
        selectors = ['app-playlists', '.playlists-section', '[data-section="playlists"]'];

      if (target === 'recommended')
        selectors = ['app-recommendations', '.recommended-section', '[data-section="recommended"]'];

      if (target === 'mixes')
        selectors = ['app-mixes-capsule', '.mixes-section', '[data-section="mixes"]'];

      if (selectors.length) {
        let el: HTMLElement | null = null;
        for (const s of selectors) { el = document.querySelector(s); if (el) break; }
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    this.close();
    if (this.router.url !== '/dashboard' && this.router.url !== '/') {
      this.router.navigate(['/dashboard']).then(() => setTimeout(run, 300));
    } else {
      setTimeout(run, 80);
    }
  }
}
