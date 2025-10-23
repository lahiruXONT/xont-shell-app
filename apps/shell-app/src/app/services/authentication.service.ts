import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';
import { User } from 'top-nav-lib';

export interface LoginRequest {
  userName: string;
  password: string;
  businessUnit: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // State signals
  private tokenSignal = signal<string | null>(this.getStoredToken());
  private refreshTokenSignal = signal<string | null>(
    this.getStoredRefreshToken()
  );
  private userDataSignal = signal<User | null>(this.getStoredUser());
  private isAuthenticatedSignal = signal<boolean>(!!this.getStoredToken());

  // Public readonly signals
  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.userDataSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  // Session timeout
  private sessionTimeoutId: any = null;
  constructor(private config: RuntimeConfigService) {
    this.initializeSession();
  }

  /**
   * Initialize session from storage
   */
  private initializeSession(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    if (token && user) {
      this.setupSessionTimeout();
    }
  }

  /**
   * Login user
   */
  async login(userName: string, password: string): Promise<void> {
    try {
      const businessUnit = this.config.defaultBusinessUnit;
      const request: LoginRequest = {
        userName,
        password,
        businessUnit,
      };

      const response = await firstValueFrom(
        this.http.post<LoginResponse>(
          `${this.config.baseUrl}/api/auth/login`,
          request
        )
      );

      if (response.success) {
        // Store tokens
        this.storeToken(response.token);
        this.storeRefreshToken(response.refreshToken);

        // Update signals
        this.tokenSignal.set(response.token);
        this.refreshTokenSignal.set(response.refreshToken);
        this.userDataSignal.set(response.user);
        this.isAuthenticatedSignal.set(true);

        // Store user data
        this.storeUser(response.user);

        // Setup session timeout
        this.setupSessionTimeout();

        // Navigate to app
        if (response.user.mustChangePassword) {
          await this.router.navigate(['/app/change-password']);
        } else {
          await this.router.navigate(['/app']);
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.error?.message || error.message || 'Login failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout API
      await firstValueFrom(
        this.http.post(`${this.config.baseUrl}/api/auth/logout`, {})
      );
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      this.clearSession();
      await this.router.navigate(['/login']);
    }
  }

  /**
   * Refresh token
   */
  async refreshAuthToken(): Promise<boolean> {
    try {
      const refreshToken = this.refreshTokenSignal();
      if (!refreshToken) return false;

      const response = await firstValueFrom(
        this.http.post<LoginResponse>(
          `${this.config.baseUrl}/api/auth/refresh`,
          { refreshToken }
        )
      );

      if (response.success) {
        this.storeToken(response.token);
        this.storeRefreshToken(response.refreshToken);
        this.tokenSignal.set(response.token);
        this.refreshTokenSignal.set(response.refreshToken);
        this.setupSessionTimeout();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return false;
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Setup session timeout
   */
  private setupSessionTimeout(): void {
    this.clearSessionTimeout();

    const timeoutMs = this.config.sessionTimeout * 60 * 1000;
    this.sessionTimeoutId = setTimeout(() => {
      alert('Your session has expired. Please login again.');
      this.logout();
    }, timeoutMs);
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(): void {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  /**
   * Clear session
   */
  private clearSession(): void {
    this.clearSessionTimeout();
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.userDataSignal.set(null);
    this.isAuthenticatedSignal.set(false);
  }

  // Storage helpers
  private storeToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private storeRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private storeUser(user: User): void {
    localStorage.setItem('userData', JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
}
