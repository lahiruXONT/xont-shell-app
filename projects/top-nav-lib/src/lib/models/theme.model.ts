export interface Theme {
  name: string;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  surfaceColor: string;
  isActive: boolean;
  isDefault?: boolean;
}

export interface ThemeSettings {
  currentTheme: string;
  availableThemes: Theme[];
  customThemes?: CustomTheme[];
  autoDetectSystemTheme: boolean;
}

export interface CustomTheme extends Theme {
  createdBy: string;
  createdAt: Date;
  isShared: boolean;
}

export type ThemeColor = 'blue' | 'green' | 'purple' | 'gray';

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}
