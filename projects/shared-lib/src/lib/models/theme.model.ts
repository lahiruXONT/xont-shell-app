/**
 * Available system themes (from legacy)
 */
export enum ThemeName {
  GREEN = 'green',
  BLUE = 'blue',
  RED = 'red',
  GRAY = 'gray',
  PURPLE = 'purple',
}

/**
 * Theme configuration
 * Legacy: style dropdown in settings modal
 */
export interface Theme {
  name: ThemeName;
  displayName: string;
  cssFile: string; // CSS file path (e.g., 'assets/css/green.css')
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  isDefault: boolean;
}

/**
 * Custom theme settings
 * Legacy: User-specific theme customization
 */
export interface CustomTheme extends Theme {
  userId: string;
  fontFamily: string; // Font name
  fontSize: string; // Font size (px)
  fontColor: string; // Custom font color (hex)
  customCSS?: string; // Additional custom CSS
}

/**
 * Font configuration options
 */
export interface FontOptions {
  availableFonts: FontFamily[];
  availableSizes: FontSize[];
}

export interface FontFamily {
  name: string;
  displayName: string;
  cssValue: string;
}

export interface FontSize {
  label: string;
  value: string; // px value
}

/**
 * Theme service state
 */
export interface ThemeState {
  currentTheme: Theme;
  customTheme: CustomTheme | null;
  availableThemes: Theme[];
  isCustomThemeActive: boolean;
}
