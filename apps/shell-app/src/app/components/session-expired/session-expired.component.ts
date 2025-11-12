import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <mat-card
        class="col-10 col-sm-8 col-md-6 col-lg-4 p-4 text-center shadow-lg"
      >
        <mat-icon
          style="font-size: 4rem; color: #ff9800; width: 4rem; height: 4rem;"
          >access_time</mat-icon
        >
        <h2 class="mt-3 mb-2">Session Expired</h2>
        <p class="mb-2">Your session has expired due to inactivity.</p>
        <p class="mb-4">Please log in again to continue.</p>
        <button mat-raised-button color="primary" (click)="goToLogin()">
          <mat-icon class="me-2">login</mat-icon> Go to Login
        </button>
      </mat-card>
    </div>
  `,
  styles: [
    `
      /* No custom styles needed for session-expired component as Angular Material and Bootstrap handle styling. */
    `,
  ],
})
export class SessionExpiredComponent {
  constructor(private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
