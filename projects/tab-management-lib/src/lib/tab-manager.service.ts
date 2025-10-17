import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tab, TabConfig, TabState, CompareMode } from './models/tab.model';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class TabManagerService {
  // Signals for reactive state management
  private tabsSignal = signal<Tab[]>([]);
  private activeTabIdSignal = signal<string | null>(null);
  private isFullscreenSignal = signal<boolean>(false);
  private compareModeSignal = signal<CompareMode>('none');
  private compareTabIdsSignal = signal<string[]>([]);
  private isLoadingSignal = signal<boolean>(false);

  // Configuration
  private configSignal = signal<TabConfig>({
    maxTabs: 10,
    defaultTabTitle: 'New Tab',
    enableTabReordering: true,
    enableTabPersistence: false,
    tabCloseConfirmation: true,
    homeTabClosable: false,
    enableCompareMode: true,
    enableFullscreen: true,
  });

  // Legacy observable support
  private tabsSubject = new BehaviorSubject<Tab[]>([]);
  private activeTabSubject = new BehaviorSubject<string | null>(null);

  // Public signal accessors
  readonly tabs = this.tabsSignal.asReadonly();
  readonly activeTabId = this.activeTabIdSignal.asReadonly();
  readonly isFullscreen = this.isFullscreenSignal.asReadonly();
  readonly compareMode = this.compareModeSignal.asReadonly();
  readonly compareTabIds = this.compareTabIdsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly config = this.configSignal.asReadonly();

  // Computed properties
  readonly activeTab = computed(() => {
    const activeId = this.activeTabId();
    return this.tabs().find((tab) => tab.id === activeId) || null;
  });

  readonly tabCount = computed(() => this.tabs().length);

  readonly canCreateNewTab = computed(() => {
    return this.tabCount() < this.config().maxTabs;
  });

  readonly hasComparableTabs = computed(() => {
    return this.tabs().filter((tab) => tab.isComparable).length >= 2;
  });

  readonly compareTabs = computed(() => {
    const compareIds = this.compareTabIds();
    return this.tabs().filter((tab) => compareIds.includes(tab.id));
  });

  // Public observable accessors
  readonly tabs$ = this.tabsSubject.asObservable();
  readonly activeTab$ = this.activeTabSubject.asObservable();

  // Event emitters
  readonly tabCreated$ = new BehaviorSubject<Tab | null>(null);
  readonly tabClosed$ = new BehaviorSubject<Tab | null>(null);
  readonly tabActivated$ = new BehaviorSubject<Tab | null>(null);
  readonly fullscreenMode$ = new BehaviorSubject<boolean>(false);

  constructor(private sessionService: SessionService) {
    this.initializeService();
  }

  private initializeService(): void {
    // Load configuration from storage
    this.loadConfiguration();

    // Set up fullscreen change listener
    this.fullscreenMode$.subscribe((isFullscreen) => {
      this.isFullscreenSignal.set(isFullscreen);
    });
  }

  // Tab creation and management
  createTab(
    taskCode: string,
    title: string,
    url: string,
    description?: string,
    taskType?: 'FORM' | 'REPORT' | 'DASHBOARD' | 'EXTERNAL',
    userName?: string,
    applicationCode?: string,
    exclusivityMode?: 'NONE' | 'USER' | 'SYSTEM'
  ): Observable<Tab> {
    return new Observable((observer) => {
      try {
        // Check if maximum tabs reached
        if (!this.canCreateNewTab()) {
          throw new Error(
            `Maximum number of tabs (${this.config().maxTabs}) reached`
          );
        }

        // Check for exclusivity
        if (exclusivityMode && exclusivityMode !== 'NONE') {
          const existingTab = this.tabs().find(
            (tab) =>
              tab.taskCode === taskCode &&
              tab.exclusivityMode === exclusivityMode
          );

          if (existingTab) {
            // Activate existing tab instead of creating new one
            this.activateTab(existingTab.id);
            observer.next(existingTab);
            observer.complete();
            return;
          }
        }

        // Create new tab
        const newTab: Tab = {
          id: this.generateTabId(),
          taskCode,
          title: title || this.config().defaultTabTitle,
          url,
          description: description || '',
          taskType: taskType || 'FORM',
          userName: userName || '',
          applicationCode: applicationCode || '',
          exclusivityMode: exclusivityMode || 'NONE',
          state: TabState.LOADING,
          isActive: false,
          isClosable: taskCode !== 'HOME' || this.config().homeTabClosable,
          isComparable: taskType === 'FORM' || taskType === 'REPORT',
          hasUnsavedChanges: false,
          createdAt: new Date(),
          lastAccessedAt: new Date(),
          metadata: {},
        };

        // Add tab to collection
        this.tabsSignal.update((tabs) => [...tabs, newTab]);
        this.tabsSubject.next(this.tabsSignal());

        // Activate the new tab
        this.activateTab(newTab.id);

        // Emit events
        this.tabCreated$.next(newTab);

        // Save session if persistence is enabled
        if (this.config().enableTabPersistence) {
          this.sessionService.saveTabSession(newTab);
        }

        observer.next(newTab);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  closeTab(tabId: string, force: boolean = false): Observable<boolean> {
    return new Observable((observer) => {
      try {
        const tab = this.tabs().find((t) => t.id === tabId);
        if (!tab) {
          observer.next(false);
          observer.complete();
          return;
        }

        // Check if tab is closable
        if (!tab.isClosable) {
          observer.error(new Error('This tab cannot be closed'));
          return;
        }

        // Check for unsaved changes
        if (
          !force &&
          tab.hasUnsavedChanges &&
          this.config().tabCloseConfirmation
        ) {
          const confirmed = confirm(
            `Tab "${tab.title}" has unsaved changes. Do you want to close it?`
          );
          if (!confirmed) {
            observer.next(false);
            observer.complete();
            return;
          }
        }

        // Remove from compare mode if active
        if (this.compareTabIds().includes(tabId)) {
          this.removeFromCompare(tabId);
        }

        // Remove tab from collection
        this.tabsSignal.update((tabs) => tabs.filter((t) => t.id !== tabId));
        this.tabsSubject.next(this.tabsSignal());

        // If this was the active tab, activate another one
        if (this.activeTabId() === tabId) {
          const remainingTabs = this.tabs();
          if (remainingTabs.length > 0) {
            // Activate the next tab or the last one
            const nextTab = remainingTabs[remainingTabs.length - 1];
            this.activateTab(nextTab.id);
          } else {
            this.activeTabIdSignal.set(null);
            this.activeTabSubject.next(null);
          }
        }

        // Emit events
        this.tabClosed$.next(tab);

        // Remove from session storage
        if (this.config().enableTabPersistence) {
          this.sessionService.removeTabSession(tabId);
        }

        observer.next(true);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  activateTab(tabId: string): void {
    const tab = this.tabs().find((t) => t.id === tabId);
    if (!tab) return;

    // Update active tab
    this.activeTabIdSignal.set(tabId);
    this.activeTabSubject.next(tabId);

    // Update tab states
    this.tabsSignal.update((tabs) =>
      tabs.map((t) => ({
        ...t,
        isActive: t.id === tabId,
        lastAccessedAt: t.id === tabId ? new Date() : t.lastAccessedAt,
      }))
    );
    this.tabsSubject.next(this.tabsSignal());

    // Emit event
    this.tabActivated$.next(tab);

    // Update session
    if (this.config().enableTabPersistence) {
      this.sessionService.updateActiveTab(tabId);
    }
  }

  // Tab reordering
  reorderTabs(fromIndex: number, toIndex: number): void {
    if (!this.config().enableTabReordering) return;

    this.tabsSignal.update((tabs) => {
      const updatedTabs = [...tabs];
      const [movedTab] = updatedTabs.splice(fromIndex, 1);
      updatedTabs.splice(toIndex, 0, movedTab);
      return updatedTabs;
    });
    this.tabsSubject.next(this.tabsSignal());
  }

  // Compare mode management
  enableCompareMode(mode: CompareMode): void {
    if (!this.config().enableCompareMode) return;

    this.compareModeSignal.set(mode);

    // Clear existing compare selections
    this.compareTabIdsSignal.set([]);
  }

  addToCompare(tabId: string): void {
    const tab = this.tabs().find((t) => t.id === tabId);
    if (!tab || !tab.isComparable) return;

    this.compareTabIdsSignal.update((ids) => {
      if (ids.includes(tabId)) return ids;

      // Limit to 4 tabs for comparison
      if (ids.length >= 4) {
        return [...ids.slice(1), tabId];
      }

      return [...ids, tabId];
    });
  }

  removeFromCompare(tabId: string): void {
    this.compareTabIdsSignal.update((ids) => ids.filter((id) => id !== tabId));
  }

  clearCompareMode(): void {
    this.compareModeSignal.set('none');
    this.compareTabIdsSignal.set([]);
  }

  // Fullscreen mode
  toggleFullscreen(): void {
    if (!this.config().enableFullscreen) return;

    const newFullscreenState = !this.isFullscreen();
    this.isFullscreenSignal.set(newFullscreenState);
    this.fullscreenMode$.next(newFullscreenState);
  }

  exitFullscreen(): void {
    this.isFullscreenSignal.set(false);
    this.fullscreenMode$.next(false);
  }

  // Tab state management
  updateTabState(tabId: string, state: TabState): void {
    this.tabsSignal.update((tabs) =>
      tabs.map((tab) => (tab.id === tabId ? { ...tab, state } : tab))
    );
    this.tabsSubject.next(this.tabsSignal());
  }

  updateTabTitle(tabId: string, title: string): void {
    this.tabsSignal.update((tabs) =>
      tabs.map((tab) => (tab.id === tabId ? { ...tab, title } : tab))
    );
    this.tabsSubject.next(this.tabsSignal());
  }

  markTabAsUnsaved(tabId: string, hasUnsavedChanges: boolean): void {
    this.tabsSignal.update((tabs) =>
      tabs.map((tab) =>
        tab.id === tabId ? { ...tab, hasUnsavedChanges } : tab
      )
    );
    this.tabsSubject.next(this.tabsSignal());
  }

  // Utility methods
  private generateTabId(): string {
    return (
      'tab_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).substr(2, 5)
    );
  }

  private loadConfiguration(): void {
    try {
      const savedConfig = localStorage.getItem('tabManagerConfig');
      if (savedConfig) {
        const config: Partial<TabConfig> = JSON.parse(savedConfig);
        this.configSignal.update((current) => ({ ...current, ...config }));
      }
    } catch (error) {
      console.warn('Failed to load tab manager configuration:', error);
    }
  }

  updateConfiguration(config: Partial<TabConfig>): void {
    this.configSignal.update((current) => ({ ...current, ...config }));

    // Save to storage
    try {
      localStorage.setItem('tabManagerConfig', JSON.stringify(this.config()));
    } catch (error) {
      console.warn('Failed to save tab manager configuration:', error);
    }
  }

  // Cleanup
  closeAllTabs(excludeHome: boolean = true): void {
    const tabsToClose = this.tabs().filter(
      (tab) => !excludeHome || tab.taskCode !== 'HOME'
    );

    tabsToClose.forEach((tab) => {
      this.closeTab(tab.id, true);
    });
  }

  getTabById(tabId: string): Tab | null {
    return this.tabs().find((tab) => tab.id === tabId) || null;
  }

  getTabByTaskCode(taskCode: string): Tab | null {
    return this.tabs().find((tab) => tab.taskCode === taskCode) || null;
  }
}
