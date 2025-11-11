import { Component, Input, Output, EventEmitter, input, HostListener, NgZone, OnInit, OnDestroy } from '@angular/core';
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
export class TrackContextComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Input() position: ContextMenuPosition = { x: 0, y: 0 };
  @Input() track: any = null;
  @Input() menuType: ContextMenuType = 'default';

  @Output() play = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() move = new EventEmitter<void>();
  @Output() addToPlaylist = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private globalClickListener?: (event: MouseEvent) => void;

  constructor(private ngZone: NgZone) {}
    // Configurar el listener global para clicks
  ngOnInit() {
    this.setupGlobalClickListener();
  }
  // Limpiar el listener global al destruir el componente
  ngOnDestroy() {
    this.removeGlobalClickListener();
  }

  private setupGlobalClickListener() {
    this.ngZone.runOutsideAngular(() => {
      this.globalClickListener = (event: MouseEvent) => {
        // Si el menú está visible y el click fue fuera del menú, cerrarlo
        if (this.isVisible && !this.isClickInsideMenu(event)) {
          this.ngZone.run(() => {
            this.closeMenu();
          });
        }
      };

      // Usar capture: true para asegurar que se ejecute antes que otros listeners
      document.addEventListener('click', this.globalClickListener, { capture: true });
    });
  }

  private removeGlobalClickListener() {
    if (this.globalClickListener) {
      document.removeEventListener('click', this.globalClickListener, { capture: true });
      this.globalClickListener = undefined;
    }
  }

  private isClickInsideMenu(event: MouseEvent): boolean {
    // Verificar si el click fue dentro del menú contextual
    const menuElement = document.querySelector('.context-menu') as HTMLElement;
    if (!menuElement) return false;

    const rect = menuElement.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }

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
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.closeMenu();
      }, 10); 
    }
  }

  onPlayClick(event: MouseEvent) {
    event.stopPropagation();
    this.play.emit();
    this.closeMenu();
  }

  onDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    this.delete.emit();
    this.closeMenu();
  }

  onMoveClick(event: MouseEvent) {
    event.stopPropagation();
    this.move.emit();
  }

  onAddToPlaylistClick(event: MouseEvent) {
    event.stopPropagation();
    this.addToPlaylist.emit();
    this.closeMenu();
  }

  private closeMenu() {
    this.close.emit();
  }
}