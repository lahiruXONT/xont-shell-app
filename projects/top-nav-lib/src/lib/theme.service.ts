import { Injectable, signal, computed } from '@angular/core';
import {
  Theme,
  ThemeSettings,
  ThemeColor,
  ColorPalette,
} from './models/theme.model';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentThemeSignal = signal<ThemeColor>('blue');
  private availableThemesSignal = signal<Theme[]>(this.getDefaultThemes());
  private themeSettingsSignal = signal<ThemeSettings>({
    currentTheme: 'blue',
    availableThemes: this.getDefaultThemes(),
    autoDetectSystemTheme: true,
  });

  readonly currentTheme = this.currentThemeSignal.asReadonly();
  readonly availableThemes = this.availableThemesSignal.asReadonly();
  readonly themeSettings = this.themeSettingsSignal.asReadonly();

  readonly currentThemeConfig = computed(() =>
    this.availableThemes().find((t) => t.name === this.currentTheme())
  );

  constructor() {
    this.loadThemeFromStorage();
    this.applyCurrentTheme();
  }

  setTheme(themeName: ThemeColor): void {
    this.currentThemeSignal.set(themeName);
    this.updateThemeSettings();
    this.applyCurrentTheme();
    this.saveThemeToStorage();
  }

  private applyCurrentTheme(): void {
    const theme = this.currentTheme();
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme}`);
  }

  private updateThemeSettings(): void {
    const settings: ThemeSettings = {
      ...this.themeSettings(),
      currentTheme: this.currentTheme(),
      availableThemes: this.availableThemes(),
    };
    this.themeSettingsSignal.set(settings);
  }

  private getDefaultThemes(): Theme[] {
    return [
      {
        name: 'blue',
        displayName: 'Blue Theme',
        primaryColor: '#3498db',
        secondaryColor: '#2980b9',
        accentColor: '#e74c3c',
        backgroundColor: '#f8f9fa',
        textColor: '#2c3e50',
        surfaceColor: '#ffffff',
        isActive: true,
        isDefault: true,
      },
      {
        name: 'green',
        displayName: 'Green Theme',
        primaryColor: '#27ae60',
        secondaryColor: '#2ecc71',
        accentColor: '#f39c12',
        backgroundColor: '#f8f9fa',
        textColor: '#2c3e50',
        surfaceColor: '#ffffff',
        isActive: false,
      },
      {
        name: 'purple',
        displayName: 'Purple Theme',
        primaryColor: '#8e44ad',
        secondaryColor: '#9b59b6',
        accentColor: '#e67e22',
        backgroundColor: '#f8f9fa',
        textColor: '#2c3e50',
        surfaceColor: '#ffffff',
        isActive: false,
      },
      {
        name: 'gray',
        displayName: 'Gray Theme',
        primaryColor: '#34495e',
        secondaryColor: '#7f8c8d',
        accentColor: '#3498db',
        backgroundColor: '#f8f9fa',
        textColor: '#2c3e50',
        surfaceColor: '#ffffff',
        isActive: false,
      },
    ];
  }

  private loadThemeFromStorage(): void {
    try {
      const savedTheme = localStorage.getItem('selectedTheme');
      if (savedTheme) {
        const theme = savedTheme as ThemeColor;
        if (this.isValidTheme(theme)) {
          this.currentThemeSignal.set(theme);
        }
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error);
    }
  }

  private saveThemeToStorage(): void {
    try {
      localStorage.setItem('selectedTheme', this.currentTheme());
    } catch (error) {
      console.warn('Failed to save theme to storage:', error);
    }
  }

  private isValidTheme(theme: string): theme is ThemeColor {
    return ['blue', 'green', 'purple', 'gray'].includes(theme);
  }

  // Get color palette for current theme
  getColorPalette(): ColorPalette {
    const theme = this.currentThemeConfig();
    if (theme) {
      return {
        primary: theme.primaryColor,
        primaryLight: this.shadeColor(theme.primaryColor, 20),
        primaryDark: this.shadeColor(theme.primaryColor, -20),
        secondary: theme.secondaryColor,
        accent: theme.accentColor,
        success: '#27ae60',
        warning: '#f39c12',
        error: '#e74c3c',
        info: '#3498db',
      };
    }

    return {
      primary: '#3498db',
      primaryLight: '#5dade2',
      primaryDark: '#2980b9',
      secondary: '#2980b9',
      accent: '#e74c3c',
      success: '#27ae60',
      warning: '#f39c12',
      error: '#e74c3c',
      info: '#3498db',
    };
  }

  private shadeColor(color: string, percent: number): string {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.min(255, Math.max(0, R + (R * percent) / 100));
    G = Math.min(255, Math.max(0, G + (G * percent) / 100));
    B = Math.min(255, Math.max(0, B + (B * percent) / 100));

    const RR = Math.round(R).toString(16).padStart(2, '0');
    const GG = Math.round(G).toString(16).padStart(2, '0');
    const BB = Math.round(B).toString(16).padStart(2, '0');

    return `#${RR}${GG}${BB}`;
  }

  // Toggle between light and dark mode
  toggleDarkMode(): void {
    const currentTheme = this.currentTheme();
    const newTheme = currentTheme.includes('dark')
      ? (currentTheme.replace('-dark', '') as ThemeColor)
      : (`${currentTheme}-dark` as ThemeColor);
    this.setTheme(newTheme);
  }
}
