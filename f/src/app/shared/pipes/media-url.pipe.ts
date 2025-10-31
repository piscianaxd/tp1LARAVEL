// shared/pipes/media-url.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'mediaUrl', standalone: true })
export class MediaUrlPipe implements PipeTransform {
  private readonly BASE = 'http://localhost:8000'; // o quitá esto si usás proxy para /media

  transform(input?: string | null, fallback = 'assets/placeholder-cover.png'): string {
    if (!input) return fallback;

    // normalizar: trim, reemplazar espacios por %20, colapsar dobles barras
    let url = input.trim();
    url = url.replace(/\s/g, '%20').replace(/([^:])\/{2,}/g, '$1/'); // evita // salvo tras http:

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
