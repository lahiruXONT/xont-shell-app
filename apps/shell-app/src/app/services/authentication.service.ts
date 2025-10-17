import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface AuthState {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  redirectToLogin: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    redirectToLogin: false,
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor() {}

  login(username: string, password: string): Observable<any> {
    // Simulate API call
    return new Observable((observer) => {
      setTimeout(() => {
        if (username && password) {
          const user = {
            userName: username,
            fullName: username,
            userId: '123',
            businessUnit: 'MAIN',
            token: 'fake-jwt-token',
          };

          const authState: AuthState = {
            isAuthenticated: true,
            user: user,
            token: user.token,
            redirectToLogin: false,
          };

          this.authStateSubject.next(authState);
          localStorage.setItem('ventura-auth', JSON.stringify(authState));
          observer.next(user);
          observer.complete();
        } else {
          observer.error('Invalid credentials');
        }
      }, 1000);
    });
  }

  logout(): Observable<void> {
    return new Observable((observer) => {
      const authState: AuthState = {
        isAuthenticated: false,
        user: null,
        token: null,
        redirectToLogin: true,
      };

      this.authStateSubject.next(authState);
      localStorage.removeItem('ventura-auth');
      observer.next();
      observer.complete();
    });
  }

  initializeFromStorage(): Promise<void> {
    return new Promise((resolve) => {
      const storedAuth = localStorage.getItem('ventura-auth');
      if (storedAuth) {
        try {
          const authState: AuthState = JSON.parse(storedAuth);
          this.authStateSubject.next(authState);
        } catch (error) {
          console.warn('Failed to parse stored auth state:', error);
        }
      }
      resolve();
    });
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  currentUser(): any {
    return this.authStateSubject.value.user;
  }

  getToken(): string | null {
    return this.authStateSubject.value.token;
  }
}
