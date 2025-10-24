import { Injectable, signal, inject } from '@angular/core';
import { fromEvent, interval, merge } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { RuntimeConfigService } from './runtime-config.service';
@Injectable({ providedIn: 'root' })
export class SessionActivityService {
  private authService = inject(AuthenticationService);
  private config = inject(RuntimeConfigService);
  private lastActivity = signal(Date.now());
  private warningShown = signal(false);
  private readonly INACTIVITY_TIMEOUT: number;
  private readonly WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before timeout
  constructor() {
    this.INACTIVITY_TIMEOUT = this.config.sessionTimeout * 60 * 1000;
    this.setupActivityListeners();
    this.startInactivityCheck();
  }
  private setupActivityListeners(): void {
    // Track user activity
    const activity$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'click'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart')
    ).pipe(throttleTime(1000));
    activity$.subscribe(() => {
      this.updateActivity();
    });
  }
  private updateActivity(): void {
    this.lastActivity.set(Date.now());
    this.warningShown.set(false);
  }
  private startInactivityCheck(): void {
    interval(30000).subscribe(() => {
      // Check every 30 seconds
      const timeSinceActivity = Date.now() - this.lastActivity();

      // Show warning before timeout
      if (
        timeSinceActivity > this.INACTIVITY_TIMEOUT - this.WARNING_THRESHOLD &&
        !this.warningShown() &&
        this.authService.isAuthenticated()
      ) {
        this.showSessionWarning();
      }
      // Logout if inactive too long
      if (
        timeSinceActivity > this.INACTIVITY_TIMEOUT &&
        this.authService.isAuthenticated()
      ) {
        this.handleSessionTimeout();
      }
    });
  }
  private showSessionWarning(): void {
    this.warningShown.set(true);

    // You can show a modal here
    console.warn('Session will expire soon due to inactivity');

    // Emit event for UI components to show warning
    window.dispatchEvent(
      new CustomEvent('session-warning', {
        detail: {
          timeRemaining: this.WARNING_THRESHOLD / 1000, // seconds
        },
      })
    );
  }
  private handleSessionTimeout(): void {
    console.log('Session timed out due to inactivity');
    this.authService.logout();
  }
  // Public methods
  extendSession(): void {
    this.updateActivity();
  }
  getRemainingTime(): number {
    const timeSinceActivity = Date.now() - this.lastActivity();
    return Math.max(0, this.INACTIVITY_TIMEOUT - timeSinceActivity);
  }
}
