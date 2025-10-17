import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GlobalStateService } from './services/global-state.service';
import { AuthenticationService } from './services/authentication.service';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MainLayoutComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Component signals
  private isInitializedSignal = signal<boolean>(false);
  private showSplashScreenSignal = signal<boolean>(true);

  // Computed properties
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly currentUser = computed(() => this.authService.currentUser());
  readonly isLoading = computed(() => this.globalState.isLoading());
  readonly currentTheme = computed(() => this.globalState.currentTheme());

  readonly isInitialized = this.isInitializedSignal.asReadonly();
  readonly showSplashScreen = this.showSplashScreenSignal.asReadonly();

  // App metadata
  readonly title = 'Ventura CRM';
  readonly version = '2.0.0';

  constructor(
    private globalState: GlobalStateService,
    private authService: AuthenticationService
  ) {
    // Apply theme on startup
    this.applyTheme(this.currentTheme());
  }

  ngOnInit(): void {
    this.initializeApplication();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeApplication(): Promise<void> {
    try {
      // Initialize global state
      await this.globalState.initialize();

      // Check for existing session
      await this.authService.initializeFromStorage();

      // Load application configuration
      await this.loadApplicationConfig();

      // Initialize complete
      this.isInitializedSignal.set(true);

      // Hide splash screen after a brief delay
      setTimeout(() => {
        this.showSplashScreenSignal.set(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showSplashScreenSignal.set(false);
    }
  }

  private setupSubscriptions(): void {
    // Theme changes
    this.globalState.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme) => {
        this.applyTheme(theme);
      });

    // Authentication state changes
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        if (!state.isAuthenticated && state.redirectToLogin) {
          this.redirectToLogin();
        }
      });
  }

  private async loadApplicationConfig(): Promise<void> {
    try {
      // Load configuration from server or local storage
      const config = await this.globalState.loadConfiguration();
      console.log('Application configuration loaded:', config);
    } catch (error) {
      console.warn('Failed to load application configuration:', error);
    }
  }

  private applyTheme(theme: string): void {
    // Remove existing theme classes
    document.body.className = document.body.className.replace(/theme-\w+/g, '');

    // Apply new theme
    document.body.classList.add(`theme-${theme}`);
    document.documentElement.setAttribute('data-theme', theme);
  }

  private redirectToLogin(): void {
    // Redirect to login page
    console.log('Redirecting to login...');
    // In a real app, you would navigate to the login route
    // this.router.navigate(['/login']);
  }

  // Event handlers from child components
  onUserAuthenticated(user: any): void {
    console.log('User authenticated:', user);
    this.globalState.setCurrentUser(user);
  }

  onUserLogout(): void {
    console.log('User logging out...');
    this.authService.logout().subscribe(() => {
      this.globalState.reset();
    });
  }

  onThemeChanged(theme: string): void {
    this.globalState.setCurrentTheme(theme);
  }

  onBusinessUnitChanged(businessUnit: string): void {
    this.globalState.setCurrentBusinessUnit(businessUnit);
  }
}
