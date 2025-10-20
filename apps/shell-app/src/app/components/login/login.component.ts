import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  username = signal<string>('');
  password = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(private authService: AuthenticationService) {}

  async onLogin(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.login(this.username(), this.password());
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Login failed');
    } finally {
      this.isLoading.set(false);
    }
  }
}
