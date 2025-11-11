import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerEventsService {
  private openCoverPlayerSource = new Subject<void>();
  
  openCoverPlayer$ = this.openCoverPlayerSource.asObservable();
  
  openCoverPlayer() {
    this.openCoverPlayerSource.next();
  }
}