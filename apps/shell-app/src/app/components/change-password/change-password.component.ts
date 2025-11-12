import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <mat-card class="col-10 col-sm-8 col-md-6 col-lg-4 p-4 shadow-lg">
        <h2 class="text-center mb-4">Change Password</h2>

        @if (errorMessage()) {
        <div class="alert alert-danger text-center mb-3" role="alert">
          {{ errorMessage() }}
        </div>
        } @if (successMessage()) {
        <div class="alert alert-success text-center mb-3" role="alert">
          {{ successMessage() }}
        </div>
        }

        <form (submit)="onSubmit($event)">
          <mat-form-field appearance="outline" class="w-100 mb-3">
            <mat-label>Current Password</mat-label>
            <input
              matInput
              type="password"
              [value]="currentPassword()"
              (input)="currentPassword.set($any($event.target).value)"
              required
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-100 mb-3">
            <mat-label>New Password</mat-label>
            <input
              matInput
              type="password"
              [value]="newPassword()"
              (input)="newPassword.set($any($event.target).value)"
              required
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-100 mb-4">
            <mat-label>Confirm New Password</mat-label>
            <input
              matInput
              type="password"
              [value]="confirmPassword()"
              (input)="confirmPassword.set($any($event.target).value)"
              required
            />
          </mat-form-field>

          <button
            mat-raised-button
            color="primary"
            type="submit"
            class="w-100"
            [disabled]="isLoading()"
          >
            @if (isLoading()) {
            <mat-spinner [diameter]="20" class="me-2"></mat-spinner>
            }
            {{ isLoading() ? 'Changing...' : 'Change Password' }}
          </button>
        </form>
      </mat-card>
    </div>
  `,
  styles: [
    `
      /* No custom styles needed for change-password component as Angular Material and Bootstrap handle styling. */
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
