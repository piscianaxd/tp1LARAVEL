// shared/pipes/media-url.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'mediaUrl', standalone: true })
export class MediaUrlPipe implements PipeTransform {
  private readonly BASE = 'http://localhost:8000';

  transform(input?: string | null, fallback = 'https://via.placeholder.com/150/1e40af/ffffff?text=No+Image'): string {
    if (!input) return fallback;

    // Detectar si es texto descriptivo en lugar de ruta de archivo
    if (input.startsWith('Portada de') || 
        input.includes('Portada de') ||
        !input.includes('.') || 
        (input.includes(' ') && !input.includes('/'))) {
      return fallback;
    }

    // Si ya es una URL completa o el fallback, devolverla
    if (input.startsWith('http') || input === fallback) {
      return input;
    }

    // normalizar: trim, reemplazar espacios por %20, colapsar dobles barras
    let url = input.trim();
    url = url.replace(/\s/g, '%20').replace(/([^:])\/{2,}/g, '$1/');

    // si es relativo (empieza con /), prefijar BASE
    if (url.startsWith('/')) {
      return `${this.BASE}${url}`;
    }
    // si ya es absoluta, devolverla
    if (/^https?:\/\//i.test(url)) return url;

    // cualquier otro caso raro -> fallback
    return fallback;
  }
}
