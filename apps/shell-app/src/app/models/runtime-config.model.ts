export interface RuntimeConfig {
  // API Configuration
  baseUrl: string;
  apiTimeout: number;
  // Authentication
  defaultBusinessUnit: string;
  sessionTimeout: number;
  tokenRefreshThreshold: number;
  // Application Settings
  production: boolean;
  appVersion: string;
  enableLogging: boolean;
  // Feature Flags
  maxTabs: number;
  cacheMenus: boolean;
  cacheDuration: number;
  enableNotifications: boolean;
  // SignalR
  signalrReconnectDelay?: number;
}
export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  baseUrl: 'http://localhost:5258',
  apiTimeout: 30000,
  defaultBusinessUnit: 'DEFAULT',
  sessionTimeout: 30,
  tokenRefreshThreshold: 5,
  production: false,
  appVersion: '3.0.0',
  enableLogging: true,
  maxTabs: 5,
  cacheMenus: true,
  cacheDuration: 30,
  enableNotifications: true,
  signalrReconnectDelay: 5000,
};
