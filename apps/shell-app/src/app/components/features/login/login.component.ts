import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <img
            src="assets/img/ventura-logo.png"
            alt="Ventura CRM"
            class="login-logo"
          />
          <h1>Login to Ventura CRM</h1>
        </div>

        <form class="login-form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              [(ngModel)]="username"
              name="username"
              placeholder="Enter your username"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            class="login-btn"
            [disabled]="!username || !password || loading()"
          >
            {{ loading() ? 'Logging in...' : 'Sign In' }}
          </button>

          <div class="demo-section">
            <p>Or try with demo credentials:</p>
            <button
              type="button"
              class="demo-btn"
              (click)="useDemoCredentials()"
            >
              Demo User
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      }

      .login-card {
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
        text-align: center;
      }

      .login-header {
        margin-bottom: 30px;

        .login-logo {
          width: 80px;
          height: 80px;
          margin-bottom: 15px;
        }

        h1 {
          color: #1a237e;
          margin: 0 0 10px 0;
          font-size: 1.5rem;
        }
      }

      .login-form {
        .form-group {
          margin-bottom: 20px;
          text-align: left;

          label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #333;
          }

          input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 1rem;
            box-sizing: border-box;

            &:focus {
              outline: none;
              border-color: #1a237e;
              box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.2);
            }
          }
        }

        .login-btn {
          background: #1a237e;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          width: 100%;
          margin-bottom: 20px;

          &:hover:not(:disabled) {
            background: #283593;
          }

          &:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
        }

        .demo-section {
          border-top: 1px solid #eee;
          padding-top: 20px;

          p {
            margin-bottom: 10px;
            color: #666;
          }

          .demo-btn {
            background: #4caf50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;

            &:hover {
              background: #45a049;
            }
          }
        }
      }
    `,
  ],
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);

  onSubmit(): void {
    if (this.username && this.password) {
      this.loading.set(true);
      // Simulate login
      setTimeout(() => {
        this.loading.set(false);
        // In a real app, you would call the authentication service
        console.log('Login attempt with:', this.username, this.password);
      }, 1500);
    }
  }

  useDemoCredentials(): void {
    this.username = 'demo';
    this.password = 'demo123';
  }
}
