import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '..//environments/environment.dev';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: Date;
  user: User;
}

export interface User {
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  profileImage: string;
  roles: any[];
  businessUnits: any[];
  currentRole: string;
  currentBusinessUnit: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredAuth();
  }

  async login(username: string, password: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
          username,
          password,
        })
      );

      this.setAuthData(response);
      this.router.navigate(['/app']);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.logout();
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, {
          refreshToken,
        })
      );

      this.setAuthData(response);
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
    }
  }

  private setAuthData(response: LoginResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    sessionStorage.setItem('user', JSON.stringify(response.user));

    this.tokenSignal.set(response.token);
    this.currentUserSignal.set(response.user);
    this.isAuthenticated.set(true);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');

    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.isAuthenticated.set(false);
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.tokenSignal.set(token);
        this.currentUserSignal.set(user);
        this.isAuthenticated.set(true);
      } catch (error) {
        this.clearAuthData();
      }
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }
}
