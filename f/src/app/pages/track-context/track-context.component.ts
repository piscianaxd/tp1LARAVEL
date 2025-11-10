import { Component, Input, Output, EventEmitter, input, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export type ContextMenuType = 'playlist' | 'recent' | 'default';

@Component({
  selector: 'app-track-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-context.component.html',
  styleUrls: ['./track-context.component.css']
})
export class TrackContextComponent {
  @Input() isVisible: boolean = false;
  @Input() position: ContextMenuPosition = { x: 0, y: 0 };
  @Input() track: any = null;
  @Input() menuType: ContextMenuType = 'default';

  @Output() play = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() move = new EventEmitter<void>();
  @Output() addToPlaylist = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  constructor(private ngZone: NgZone) {}
  
    // Escuchar el evento de scroll
    @HostListener('window:scroll', ['$event'])
    onWindowScroll(event: Event) {
      if (this.isVisible) {
        // Usar requestAnimationFrame para respuesta inmediata
        this.ngZone.runOutsideAngular(() => {
          requestAnimationFrame(() => {
            this.ngZone.run(() => {
              this.closeMenu();
            });
          });
        });
      }
    }

    // Scroll en elementos internos con debounce
    private scrollTimeout: any;
    @HostListener('scroll', ['$event.target'])
    onElementScroll(target: EventTarget | null) {
      if (this.isVisible && target instanceof HTMLElement) {
        // Debounce muy corto para respuesta casi inmediata
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
          this.closeMenu();
        }, 10); // Solo 10ms de delay
      }
    }

  onPlayClick(event: MouseEvent) {
    event.stopPropagation();
    console.log('🎵 ContextMenu: Play clickeado');
    this.play.emit();
    this.closeMenu();
  }

  onDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    console.log('🗑️ ContextMenu: Delete clickeado');
    this.delete.emit();
    this.closeMenu();
  }

  onMoveClick(event: MouseEvent) {
    event.stopPropagation();
    console.log('📁 ContextMenu: Move clickeado');
    this.move.emit();
  }

  onAddToPlaylistClick(event: MouseEvent) {
    event.stopPropagation();
    console.log('➕ ContextMenu: Agregar a playlist clickeado');
    this.addToPlaylist.emit();
    this.closeMenu();
  }

  private closeMenu() {
    this.close.emit();
  }
}