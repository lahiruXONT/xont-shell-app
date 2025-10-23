import { Injectable } from '@angular/core';

export interface RuntimeConfig {
  baseUrl: string;
  defaultBusinessUnit: string;
  production: boolean;
  appVersion: string;
  enableLogging: boolean;
  sessionTimeout: number;
  maxTabs: number;
  cacheMenus: boolean;
  cacheDuration: number;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private config: RuntimeConfig = {
    baseUrl: '',
    defaultBusinessUnit: '',
    production: false,
    appVersion: '',
    enableLogging: true,
    sessionTimeout: 30, // minutes
    maxTabs: 5,
    cacheMenus: true,
    cacheDuration: 30, // minutes
  };

  constructor() {
    const globalConfig = (window as any).__RUNTIME_CONFIG__ || {};
    this.config.baseUrl = globalConfig.baseUrl || '';
    this.config.defaultBusinessUnit = globalConfig.defaultBusinessUnit || '';
    this.config.production = globalConfig.production ?? false;
    this.config.appVersion = globalConfig.appVersion || '';
    this.config.enableLogging = globalConfig.enableLogging ?? true;
    this.config.sessionTimeout = globalConfig.sessionTimeout ?? 30;
    this.config.maxTabs = globalConfig.maxTabs ?? 5;
    this.config.cacheMenus = globalConfig.cacheMenus ?? true;
    this.config.cacheDuration = globalConfig.cacheDuration ?? 30;
  }

  get baseUrl(): string {
    return this.config.baseUrl;
  }
  get defaultBusinessUnit(): string {
    return this.config.defaultBusinessUnit;
  }
  get production(): boolean {
    return this.config.production;
  }

  get appVersion(): string {
    return this.config.appVersion;
  }

  get enableLogging(): boolean {
    return this.config.enableLogging;
  }

  get sessionTimeout(): number {
    return this.config.sessionTimeout;
  }

  get maxTabs(): number {
    return this.config.maxTabs;
  }
  get cacheMenus(): boolean {
    return this.config.cacheMenus;
  }

  get cacheDuration(): number {
    return this.config.cacheDuration;
  }
}
