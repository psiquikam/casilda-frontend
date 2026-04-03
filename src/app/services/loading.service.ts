import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private pendingRequests = 0;

  readonly loading$ = this.loadingSubject.asObservable();

  show(): void {
    this.pendingRequests += 1;
    if (this.pendingRequests === 1) {
      this.loadingSubject.next(true);
    }
  }

  hide(): void {
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);
    if (this.pendingRequests === 0) {
      this.loadingSubject.next(false);
    }
  }
}
