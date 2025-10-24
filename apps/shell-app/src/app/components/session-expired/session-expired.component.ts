import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="session-expired-container">
      <div class="session-expired-card">
        <i class="fa fa-clock-o" style="font-size: 4rem; color: #ff9800;"></i>
        <h2>Session Expired</h2>
        <p>Your session has expired due to inactivity.</p>
        <p>Please log in again to continue.</p>
        <button (click)="goToLogin()">
          <i class="fa fa-sign-in"></i> Go to Login
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .session-expired-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .session-expired-card {
        background: white;
        border-radius: 12px;
        padding: 40px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      }

      button {
        margin-top: 20px;
        padding: 12px 24px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
      }

      button:hover {
        background: #5568d3;
      }
    `,
  ],
})
export class SessionExpiredComponent {
  constructor(private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
