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
} from 'shared-lib';
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
      isDefault: true,
    },
    {
      name: ThemeName.GREEN,
      displayName: 'Green',
      cssFile: 'assets/css/green.css',
      primaryColor: '#1b5e20',
      secondaryColor: '#388e3c',
      accentColor: '#4caf50',
      isDefault: false,
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
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  }

  /**
   * Apply theme
   * Legacy: changeCSS() function
   */
  async applyTheme(theme: Theme): Promise<void> {
    try {
      // Remove current theme link
      if (this.currentLinkElement) {
        this.currentLinkElement.remove();
        this.currentLinkElement = null;
      }

      // Create new link element
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = theme.cssFile;
      linkElement.id = 'theme-css';

      // Append to head
      document.head.appendChild(linkElement);
      this.currentLinkElement = linkElement;

      // Update state
      this.themeStateSignal.update((state) => ({
        ...state,
        currentTheme: theme,
        isCustomThemeActive: false,
      }));

      // Save to localStorage
      localStorage.setItem('userTheme', theme.name);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }

  /**
   * Apply custom theme with font settings
   * Legacy: User-specific theme customization
   */
  async applyCustomTheme(customTheme: CustomTheme): Promise<void> {
    // Apply base theme
    await this.applyTheme(customTheme);

    // Apply font settings
    this.applyFontSettings(
      customTheme.fontFamily,
      customTheme.fontSize,
      customTheme.fontColor
    );

    // Apply custom CSS if provided
    if (customTheme.customCSS) {
      this.injectCustomCSS(customTheme.customCSS);
    }

    // Update state
    this.themeStateSignal.update((state) => ({
      ...state,
      customTheme,
      isCustomThemeActive: true,
    }));
  }

  /**
   * Apply font settings
   */
  private applyFontSettings(
    fontFamily: string,
    fontSize: string,
    fontColor?: string
  ): void {
    const body = document.body;

    // Apply font family
    const font = this.FONT_FAMILIES.find((f) => f.name === fontFamily);
    if (font) {
      body.style.fontFamily = font.cssValue;
    }

    // Apply font size
    body.style.fontSize = fontSize;

    // Apply font color if provided
    if (fontColor) {
      body.style.color = fontColor;
    }
  }

  /**
   * Inject custom CSS
   */
  private injectCustomCSS(css: string): void {
    // Remove existing custom CSS
    const existing = document.getElementById('custom-theme-css');
    if (existing) {
      existing.remove();
    }

    // Create new style element
    const styleElement = document.createElement('style');
    styleElement.id = 'custom-theme-css';
    styleElement.textContent = css;

    document.head.appendChild(styleElement);
  }

  /**
   * Get theme by name
   */
  getThemeByName(themeName: string): Theme {
    const theme = this.AVAILABLE_THEMES.find((t) => t.name === themeName);
    return theme || this.AVAILABLE_THEMES.find((t) => t.isDefault)!;
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): Theme[] {
    return this.AVAILABLE_THEMES;
  }

  /**
   * Get font family by name
   */
  getFontFamilyByName(name: string): FontFamily | undefined {
    return this.FONT_FAMILIES.find((f) => f.name === name);
  }

  /**
   * Save custom theme to server
   */
  async saveCustomTheme(customTheme: CustomTheme): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/api/themes/custom`, customTheme)
      );
    } catch (error) {
      console.error('Failed to save custom theme:', error);
      throw error;
    }
  }

  /**
   * Load custom theme from server
   */
  async loadCustomTheme(): Promise<CustomTheme | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<CustomTheme>(`${this.apiBaseUrl}/api/themes/custom`)
      );

      if (response) {
        await this.applyCustomTheme(response);
        return response;
      }

      return null;
    } catch (error) {
      console.error('Failed to load custom theme:', error);
      return null;
    }
  }
}
