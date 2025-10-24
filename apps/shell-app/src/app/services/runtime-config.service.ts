import { Injectable } from '@angular/core';
import {
  RuntimeConfig,
  DEFAULT_RUNTIME_CONFIG,
} from '../models/runtime-config.model';
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private config: RuntimeConfig = DEFAULT_RUNTIME_CONFIG;
  private initialized = false;
  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      // Try to load from window object
      const globalConfig = (window as any).RUNTIME_CONFIG;
      if (globalConfig) {
        this.validateConfig(globalConfig);
        this.config = { ...DEFAULT_RUNTIME_CONFIG, ...globalConfig };
      } else {
        console.warn('Runtime config not found, using defaults');
      }
      this.initialized = true;
      console.log('Runtime config initialized:', this.config);
    } catch (error) {
      console.error('Failed to initialize config:', error);
      throw error;
    }
  }
  private validateConfig(config: any): void {
    const required: (keyof RuntimeConfig)[] = [
      'baseUrl',
      'defaultBusinessUnit',
    ];
    const missing = required.filter((key) => !config[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
    // Validate types
    if (typeof config.baseUrl !== 'string') {
      throw new Error('baseUrl must be a string');
    }
    if (
      typeof config.sessionTimeout !== 'number' ||
      config.sessionTimeout <= 0
    ) {
      throw new Error('sessionTimeout must be a positive number');
    }
  }
  get<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
    if (!this.initialized) {
      console.warn('Config accessed before initialization');
    }
    return this.config[key];
  }
  getAll(): Readonly<RuntimeConfig> {
    return { ...this.config };
  }
  // Convenience getters
  get baseUrl(): string {
    return this.config.baseUrl;
  }
  get defaultBusinessUnit(): string {
    return this.config.defaultBusinessUnit;
  }
  get production(): boolean {
    return this.config.production;
  }
  get sessionTimeout(): number {
    return this.config.sessionTimeout;
  }
  get maxTabs(): number {
    return this.config.maxTabs;
  }
}
