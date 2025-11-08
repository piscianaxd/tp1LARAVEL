import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'compactNumber', standalone: true })
export class CompactNumberPipe implements PipeTransform {
  private nf = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 });
  transform(value?: number | null) {
    if (value == null) return '';
    return this.nf.format(value);
  }
}
