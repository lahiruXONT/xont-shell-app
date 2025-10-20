import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment.dev';

export interface LoginRequest {
  userName: string;
  password: string;
  businessUnit: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: UserData;
  expiresIn: number;
  message?: string;
}

export interface UserData {
  userName: string;
  fullName: string;
  email: string;
  profileImage?: string;
  currentBusinessUnit: string;
  currentRole: string;
  roles: UserRole[];
  businessUnits: BusinessUnit[];
  passwordExpiry?: Date;
  lastLoginDate?: Date;
  isPasswordExpired: boolean;
  mustChangePassword: boolean;
}

export interface UserRole {
  roleCode: string;
  description: string;
  isPriorityRole: boolean;
  isDefaultRole: boolean;
}

export interface BusinessUnit {
  code: string;
  description: string;
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
  private userDataSignal = signal<UserData | null>(this.getStoredUser());
  private isAuthenticatedSignal = signal<boolean>(!!this.getStoredToken());

  // Public readonly signals
  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.userDataSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  // Session timeout
  private sessionTimeoutId: any = null;

  constructor() {
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
  async login(
    userName: string,
    password: string,
    businessUnit: string = 'HEMA'
  ): Promise<void> {
    try {
      const request: LoginRequest = { userName, password, businessUnit };

      const response = await firstValueFrom(
        this.http.post<LoginResponse>(
          `${environment.apiUrl}/auth/login`,
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
        this.http.post(`${environment.apiUrl}/auth/logout`, {})
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

      if (!refreshToken) {
        return false;
      }

      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, {
          refreshToken,
        })
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
   * Switch user role
   */
  async switchRole(roleCode: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ user: UserData }>(
          `${environment.apiUrl}/auth/switch-role`,
          {
            roleCode,
          }
        )
      );

      this.userDataSignal.set(response.user);
      this.storeUser(response.user);
    } catch (error) {
      console.error('Switch role error:', error);
      throw error;
    }
  }

  /**
   * Switch business unit
   */
  async switchBusinessUnit(businessUnit: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ user: UserData }>(
          `${environment.apiUrl}/auth/switch-business-unit`,
          {
            businessUnit,
          }
        )
      );

      this.userDataSignal.set(response.user);
      this.storeUser(response.user);
    } catch (error) {
      console.error('Switch business unit error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/change-password`, {
          currentPassword,
          newPassword,
        })
      );

      // Update user data
      const userData = this.userDataSignal();
      if (userData) {
        userData.mustChangePassword = false;
        userData.isPasswordExpired = false;
        this.userDataSignal.set({ ...userData });
        this.storeUser(userData);
      }
    } catch (error: any) {
      throw new Error(error.error?.message || 'Failed to change password');
    }
  }

  /**
   * Setup session timeout
   */
  private setupSessionTimeout(): void {
    this.clearSessionTimeout();

    const timeoutMs = environment.sessionTimeout * 60 * 1000;
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.userDataSignal.set(null);
    this.isAuthenticatedSignal.set(false);
  }

  // Storage helpers
  private storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private storeRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private storeUser(user: UserData): void {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  private getStoredUser(): UserData | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
}
