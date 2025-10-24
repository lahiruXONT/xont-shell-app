import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';
import { AuthTokenService } from './auth-token.service';
export interface User {
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  currentRole: string;
  currentBusinessUnit: string;
  roles: UserRole[];
  businessUnits: BusinessUnit[];
  permissions: string[];
  mustChangePassword: boolean;
  lastLoginDate?: Date;
  theme?: string;
  language?: string;
}
export interface UserRole {
  roleCode: string;
  description: string;
  icon?: string;
  isPriorityRole?: boolean;
}
export interface BusinessUnit {
  code: string;
  name: string;
  description?: string;
}
export interface LoginRequest {
  userName: string;
  password: string;
}
export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: Date;
  user: User;
  message?: string;
}
@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private config = inject(RuntimeConfigService);
  private tokenService = inject(AuthTokenService);
  // State signals
  private userDataSignal = signal<User | null>(this.getStoredUser());
  private isAuthenticatedSignal = signal<boolean>(
    !!this.tokenService.getToken()
  );
  // Public readonly signals
  readonly currentUser = computed(() => this.userDataSignal());
  readonly isAuthenticated = computed(() => this.isAuthenticatedSignal());
  // Session timeout
  private sessionTimeoutId: any = null;
  constructor() {
    this.initializeSession();
  }
  /**
   * Initialize session from storage
   */
  private initializeSession(): void {
    const token = this.tokenService.getToken();
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
      const request: LoginRequest = {
        userName,
        password,
      };
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(
          `${this.config.baseUrl}/api/auth/login`,
          request
        )
      );
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }
      // Store tokens
      this.tokenService.setToken(response.token, response.expiresIn);
      this.tokenService.setRefreshToken(response.refreshToken);
      // Update state
      this.userDataSignal.set(response.user);
      this.isAuthenticatedSignal.set(true);
      // Store user data
      this.storeUser(response.user);
      // Setup session timeout
      this.setupSessionTimeout();
      // Navigate
      if (response.user.mustChangePassword) {
        await this.router.navigate(['/app/change-password']);
      } else {
        await this.router.navigate(['/app']);
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
   * Refresh authentication token
   */
  async refreshAuthToken(): Promise<boolean> {
    try {
      const refreshToken = this.tokenService.getRefreshToken();
      if (!refreshToken) return false;
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(
          `${this.config.baseUrl}/api/auth/refresh`,
          { refreshToken }
        )
      );
      if (response.success) {
        this.tokenService.setToken(response.token, response.expiresIn);
        this.tokenService.setRefreshToken(response.refreshToken);
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
    return this.tokenService.getToken();
  }
  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; message?: string }>(
        `${this.config.baseUrl}/api/auth/change-password`,
        { currentPassword, newPassword }
      )
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
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
    this.tokenService.clearTokens();
    sessionStorage.removeItem('user_data');
    this.userDataSignal.set(null);
    this.isAuthenticatedSignal.set(false);
  }
  /**
   * Storage helpers
   */
  private storeUser(user: User): void {
    sessionStorage.setItem('user_data', JSON.stringify(user));
  }
  private getStoredUser(): User | null {
    const userData = sessionStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
}
