import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  // App state
  private isLoadingSignal = signal<boolean>(false);
  private currentThemeSignal = signal<string>('blue');
  private isSidebarCollapsedSignal = signal<boolean>(false);

  // Public readonly
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly currentTheme = this.currentThemeSignal.asReadonly();
  readonly isSidebarCollapsed = this.isSidebarCollapsedSignal.asReadonly();

  setLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
  }

  setTheme(theme: string): void {
    this.currentThemeSignal.set(theme);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsedSignal.update((collapsed) => !collapsed);
  }
}
