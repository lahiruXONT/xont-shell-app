import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  // Store token in sessionStorage (more secure than localStorage)
  setToken(token: string, expiresIn: number): void {
    const expiryTime = Date.now() + expiresIn * 1000;
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
  getToken(): string | null {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!token || !expiry) return null;
    // Check if token is expired
    if (Date.now() > parseInt(expiry)) {
      this.clearTokens();
      return null;
    }
    return token;
  }
  setRefreshToken(refreshToken: string): void {
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }
  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
  isTokenExpiringSoon(thresholdMinutes: number = 5): boolean {
    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    const timeUntilExpiry = parseInt(expiry) - Date.now();
    const thresholdMs = thresholdMinutes * 60 * 1000;
    return timeUntilExpiry < thresholdMs;
  }
  getTokenExpiryTime(): Date | null {
    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? new Date(parseInt(expiry)) : null;
  }
  clearTokens(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }
}
