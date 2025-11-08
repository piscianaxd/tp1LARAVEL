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

  scrollToPlaylists(): void {
    this.close();
    
    if (this.router.url !== '/dashboard' && this.router.url !== '/') {
      this.router.navigate(['/dashboard']).then(() => {
        setTimeout(() => {
          this.scrollToPlaylistsSection();
        }, 100);
      });
    } else {
      setTimeout(() => {
        this.scrollToPlaylistsSection();
      }, 50);
    }
  }

  private scrollToPlaylistsSection(): void {
    const selectors = [
      'app-playlists',
      '.playlists-section',
      '.playlists-container',
      '[data-section="playlists"]'
    ];

    let playlistsElement: HTMLElement | null = null;

    for (const selector of selectors) {
      playlistsElement = document.querySelector(selector);
      if (playlistsElement) break;
    }

    if (!playlistsElement) {
      playlistsElement = document.querySelector('app-playlists');
    }

    if (playlistsElement) {
      playlistsElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
      
      playlistsElement.classList.add('highlight-section');
      setTimeout(() => {
        playlistsElement?.classList.remove('highlight-section');
      }, 2000);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}