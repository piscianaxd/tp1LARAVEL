import { Pipe, PipeTransform } from '@angular/core';
// para usar: {{ someLongText | ellipsis:30 }} sirve para 
@Pipe({ name: 'ellipsis', standalone: true })
export class EllipsisPipe implements PipeTransform {
  transform(value: string, max = 40) {
    if (!value) return '';
    return value.length > max ? value.slice(0, max - 1) + '…' : value;
  }
}
