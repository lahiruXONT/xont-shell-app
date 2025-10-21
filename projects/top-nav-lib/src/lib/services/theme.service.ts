import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Theme,
  ThemeName,
  CustomTheme,
  ThemeState,
  FontOptions,
  FontFamily,
  FontSize,
} from '../models/theme.model';
import { Inject, Optional } from '@angular/core';
import { TOP_NAV_API_URL as API_URL } from '../tokens/api-url.token';

/**
 * Theme Service
 * Legacy: Theme selection and custom CSS from settings modal
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Available themes (from legacy system)
  private readonly AVAILABLE_THEMES: Theme[] = [
    {
      name: ThemeName.BLUE,
      displayName: 'Blue',
      cssFile: 'assets/css/blue.css',
      primaryColor: '#1a237e',
      secondaryColor: '#3949ab',
      accentColor: '#5c6bc0',
      isDefault: false,
    },
    {
      name: ThemeName.GREEN,
      displayName: 'Green',
      cssFile: 'assets/css/green.css',
      primaryColor: '#1b5e20',
      secondaryColor: '#388e3c',
      accentColor: '#4caf50',
      isDefault: true,
    },
    {
      name: ThemeName.RED,
      displayName: 'Red',
      cssFile: 'assets/css/red.css',
      primaryColor: '#b71c1c',
      secondaryColor: '#d32f2f',
      accentColor: '#f44336',
      isDefault: false,
    },
    {
      name: ThemeName.GRAY,
      displayName: 'Gray',
      cssFile: 'assets/css/gray.css',
      primaryColor: '#263238',
      secondaryColor: '#37474f',
      accentColor: '#546e7a',
      isDefault: false,
    },
    {
      name: ThemeName.PURPLE,
      displayName: 'Purple',
      cssFile: 'assets/css/purple.css',
      primaryColor: '#4a148c',
      secondaryColor: '#6a1b9a',
      accentColor: '#8e24aa',
      isDefault: false,
    },
  ];

  // Font options
  private readonly FONT_FAMILIES: FontFamily[] = [
    { name: 'arial', displayName: 'Arial', cssValue: 'Arial, sans-serif' },
    {
      name: 'helvetica',
      displayName: 'Helvetica',
      cssValue: 'Helvetica, sans-serif',
    },
    {
      name: 'times',
      displayName: 'Times New Roman',
      cssValue: 'Times New Roman, serif',
    },
    {
      name: 'courier',
      displayName: 'Courier New',
      cssValue: 'Courier New, monospace',
    },
    {
      name: 'verdana',
      displayName: 'Verdana',
      cssValue: 'Verdana, sans-serif',
    },
    { name: 'georgia', displayName: 'Georgia', cssValue: 'Georgia, serif' },
  ];

  private readonly FONT_SIZES: FontSize[] = [
    { label: 'Small', value: '12px' },
    { label: 'Medium', value: '14px' },
    { label: 'Large', value: '16px' },
    { label: 'Extra Large', value: '18px' },
  ];

  // Theme state using signals
  private themeStateSignal = signal<ThemeState>({
    currentTheme: this.AVAILABLE_THEMES.find((t) => t.isDefault)!,
    customTheme: null,
    availableThemes: this.AVAILABLE_THEMES,
    isCustomThemeActive: false,
  });

  private currentLinkElement: HTMLLinkElement | null = null;

  // Public readonly signals
  readonly themeState = this.themeStateSignal.asReadonly();
  readonly currentTheme = computed(() => this.themeStateSignal().currentTheme);
  readonly customTheme = computed(() => this.themeStateSignal().customTheme);
  readonly isCustomThemeActive = computed(
    () => this.themeStateSignal().isCustomThemeActive
  );

  // Font options
  readonly fontOptions = signal<FontOptions>({
    availableFonts: this.FONT_FAMILIES,
    availableSizes: this.FONT_SIZES,
  });

  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiBaseUrl: string
  ) {
    this.loadUserTheme();
  }

  /**
   * Load user's theme preference
   * Legacy: LoadThemes() method + user.Theme
   */
  private async loadUserTheme(): Promise<void> {
    try {
      // Load from API or localStorage
      const savedTheme = localStorage.getItem('userTheme');
      if (savedTheme) {
        const theme = this.AVAILABLE_THEMES.find((t) => t.name === savedTheme);
        if (theme) {
          this.applyTheme(theme);
        }
      }

      // Check for custom theme
      const customTheme = await this.loadCustomTheme();
      if (customTheme) {
        this.applyCustomTheme(customTheme);
      }
    } catch (error) {
      console.error('Failed to load user theme:', error);
    }
  }

  /**
   * Apply a theme
   * Legacy: changeCSS() function
   */
  applyTheme(theme: Theme): void {
    // Remove existing theme link
    if (this.currentLinkElement) {
      this.currentLinkElement.remove();
    }

    // Create new theme link element
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.type = 'text/css';
    linkElement.href = theme.cssFile;
    linkElement.id = 'theme-stylesheet';

    document.head.appendChild(linkElement);
    this.currentLinkElement = linkElement;

    // Update state
    this.themeStateSignal.update((state) => ({
      ...state,
      currentTheme: theme,
      isCustomThemeActive: false,
    }));

    // Save to localStorage and server
    localStorage.setItem('userTheme', theme.name);
    this.saveThemeToServer(theme.name);
  }

  /**
   * Apply custom theme
   * Legacy: Custom theme with font settings
   */
  applyCustomTheme(customTheme: CustomTheme): void {
    // Apply base theme first
    this.applyTheme(customTheme);

    // Apply custom CSS
    this.applyCustomCSS(customTheme);

    // Update state
    this.themeStateSignal.update((state) => ({
      ...state,
      customTheme,
      isCustomThemeActive: true,
    }));
  }

  /**
   * Apply custom CSS (font family, size, color)
   * Legacy: Font settings from settings modal
   */
  private applyCustomCSS(customTheme: CustomTheme): void {
    // Remove existing custom style
    const existingStyle = document.getElementById('custom-theme-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element
    const styleElement = document.createElement('style');
    styleElement.id = 'custom-theme-style';
    styleElement.innerHTML = `
      body {
        font-family: ${customTheme.fontFamily} !important;
        font-size: ${customTheme.fontSize} !important;
        color: ${customTheme.fontColor} !important;
      }
      ${customTheme.customCSS || ''}
    `;

    document.head.appendChild(styleElement);
  }

  /**
   * Save theme to server
   * Legacy: PageMethods.saveTheme(theme)
   */
  private async saveThemeToServer(themeName: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/api/user/theme`, {
          theme: themeName,
        })
      );
    } catch (error) {
      console.error('Failed to save theme to server:', error);
    }
  }

  /**
   * Load custom theme from server
   */
  private async loadCustomTheme(): Promise<CustomTheme | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<CustomTheme>(`${this.apiBaseUrl}/api/user/custom-theme`)
      );
      return response;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save custom theme
   */
  async saveCustomTheme(customTheme: Partial<CustomTheme>): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<CustomTheme>(
          `${this.apiBaseUrl}/api/user/custom-theme`,
          customTheme
        )
      );

      this.applyCustomTheme(response);
    } catch (error) {
      console.error('Failed to save custom theme:', error);
      throw error;
    }
  }

  /**
   * Reset to default theme
   */
  resetToDefault(): void {
    const defaultTheme = this.AVAILABLE_THEMES.find((t) => t.isDefault)!;
    this.applyTheme(defaultTheme);

    // Clear custom theme
    const existingStyle = document.getElementById('custom-theme-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    this.themeStateSignal.update((state) => ({
      ...state,
      customTheme: null,
      isCustomThemeActive: false,
    }));
  }

  /**
   * Get theme by name
   */
  getThemeByName(name: ThemeName): Theme | undefined {
    return this.AVAILABLE_THEMES.find((t) => t.name === name);
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): Theme[] {
    return this.AVAILABLE_THEMES;
  }

  /**
   * Get font options
   */
  getFontOptions(): FontOptions {
    return this.fontOptions();
  }
}
