import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

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

  @Output() play = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() move = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

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
    // NO cerramos el menú aquí - lo maneja el componente padre
  }

  private closeMenu() {
    this.close.emit();
  }
}