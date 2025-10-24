import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="change-password-container">
      <div class="change-password-card">
        <h2>Change Password</h2>

        @if (errorMessage()) {
        <div class="error-message">{{ errorMessage() }}</div>
        } @if (successMessage()) {
        <div class="success-message">{{ successMessage() }}</div>
        }

        <form (submit)="onSubmit($event)">
          <div class="form-group">
            <label>Current Password</label>
            <input
              type="password"
              [value]="currentPassword()"
              (input)="currentPassword.set($any($event.target).value)"
              required
            />
          </div>

          <div class="form-group">
            <label>New Password</label>
            <input
              type="password"
              [value]="newPassword()"
              (input)="newPassword.set($any($event.target).value)"
              required
            />
          </div>

          <div class="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              [value]="confirmPassword()"
              (input)="confirmPassword.set($any($event.target).value)"
              required
            />
          </div>

          <button type="submit" [disabled]="isLoading()">
            {{ isLoading() ? 'Changing...' : 'Change Password' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .change-password-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        padding: 20px;
      }

      .change-password-card {
        background: white;
        border-radius: 8px;
        padding: 30px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .error-message {
        background: #ffebee;
        color: #c62828;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 20px;
      }

      .success-message {
        background: #e8f5e9;
        color: #2e7d32;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 20px;
      }
    `,
  ],
})
export class ChangePasswordComponent {
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validation
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    if (this.newPassword().length < 8) {
      this.errorMessage.set('Password must be at least 8 characters');
      return;
    }

    this.isLoading.set(true);

    try {
      // TODO: Implement changePassword in AuthenticationService
      // await this.authService.changePassword(
      //   this.currentPassword(),
      //   this.newPassword()
      // );

      this.successMessage.set('Password changed successfully');

      setTimeout(() => {
        this.router.navigate(['/app/dashboard']);
      }, 2000);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to change password');
    } finally {
      this.isLoading.set(false);
    }
  }
}
