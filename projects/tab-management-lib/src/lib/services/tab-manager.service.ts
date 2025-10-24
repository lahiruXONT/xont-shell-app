import { Injectable, signal, computed } from '@angular/core';
import { Tab, TabType, TabState, TabConfig } from 'shared-lib';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tab Manager Service
 * Manages all tab operations, state, and persistence
 * Legacy: Tab management from Main.aspx
 */
@Injectable({
  providedIn: 'root',
})
export class TabManagerService {
  // Default configuration (Legacy: max 5 tabs)
  private readonly DEFAULT_CONFIG: TabConfig = {
    maxTabs: 5,
    enablePersistence: true,
    confirmBeforeClose: true,
    showToolsMenu: true,
    enableDragDrop: true,
  };

  // State signals
  private tabsSignal = signal<Tab[]>(this.loadTabsFromStorage());
  private activeTabIdSignal = signal<string | null>(null);
  private configSignal = signal<TabConfig>(this.DEFAULT_CONFIG);

  // Public readonly signals
  readonly tabs = this.tabsSignal.asReadonly();
  readonly activeTabId = this.activeTabIdSignal.asReadonly();
  readonly config = this.configSignal.asReadonly();

  // Computed signals
  readonly activeTab = computed(() => {
    const activeId = this.activeTabIdSignal();
    return this.tabsSignal().find((tab) => tab.id === activeId) || null;
  });

  readonly tabCount = computed(() => this.tabsSignal().length);
  readonly canOpenNewTab = computed(
    () => this.tabCount() < this.configSignal().maxTabs
  );
  readonly dirtyTabs = computed(() =>
    this.tabsSignal().filter((tab) => tab.isDirty)
  );

  constructor() {
    // Restore active tab on init
    const savedActiveId = localStorage.getItem('activeTabId');
    if (savedActiveId) {
      this.activeTabIdSignal.set(savedActiveId);
    } else if (this.tabsSignal().length > 0) {
      this.activeTabIdSignal.set(this.tabsSignal()[0].id);
    }
  }

  /**
   * Open a new tab
   * Legacy: LoadTask function
   */
  openTab(
    taskCode: string,
    title: string,
    url: string,
    options?: {
      type?: TabType;
      icon?: string;
      metadata?: any;
    }
  ): Tab | null {
    // Check if tab already exists
    const existingTab = this.tabsSignal().find((t) => t.taskCode === taskCode);
    if (existingTab) {
      this.activateTab(existingTab.id);
      return existingTab;
    }

    // Check max tabs limit
    if (!this.canOpenNewTab()) {
      alert(`Maximum ${this.configSignal().maxTabs} tabs allowed`);
      return null;
    }

    const newTab: Tab = {
      id: uuidv4(),
      taskCode,
      title,
      url,
      type: options?.type || TabType.IFRAME,
      state: TabState.LOADING,
      isActive: true,
      isPinned: false,
      isDirty: false,
      icon: options?.icon || 'fa-file',
      metadata: options?.metadata,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    // Add tab and activate
    this.tabsSignal.update((tabs) => {
      const updatedTabs = tabs.map((t) => ({ ...t, isActive: false }));
      return [...updatedTabs, newTab];
    });

    this.activeTabIdSignal.set(newTab.id);
    this.persistTabs();
    return newTab;
  }

  /**
   * Close tab
   * Legacy: Close tab with dirty check
   */
  async closeTab(tabId: string): Promise<boolean> {
    const tab = this.tabsSignal().find((t) => t.id === tabId);
    if (!tab) return false;

    // Check if dirty and confirm
    if (tab.isDirty && this.configSignal().confirmBeforeClose) {
      const confirmed = confirm(
        'You have unsaved changes. Are you sure you want to close this tab?'
      );
      if (!confirmed) return false;
    }

    // Remove tab
    this.tabsSignal.update((tabs) => tabs.filter((t) => t.id !== tabId));

    // Activate another tab if this was active
    if (this.activeTabIdSignal() === tabId) {
      const remainingTabs = this.tabsSignal();
      if (remainingTabs.length > 0) {
        this.activateTab(remainingTabs[0].id);
      } else {
        this.activeTabIdSignal.set(null);
      }
    }

    this.persistTabs();
    return true;
  }

  /**
   * Close all tabs
   */
  async closeAllTabs(): Promise<void> {
    const dirtyTabs = this.dirtyTabs();
    if (dirtyTabs.length > 0 && this.configSignal().confirmBeforeClose) {
      const confirmed = confirm(
        `${dirtyTabs.length} tabs have unsaved changes. Close all anyway?`
      );
      if (!confirmed) return;
    }

    this.tabsSignal.set([]);
    this.activeTabIdSignal.set(null);
    this.persistTabs();
  }

  /**
   * Close all except specified tab
   */
  async closeOtherTabs(tabId: string): Promise<void> {
    const dirtyTabs = this.dirtyTabs().filter((t) => t.id !== tabId);
    if (dirtyTabs.length > 0 && this.configSignal().confirmBeforeClose) {
      const confirmed = confirm(
        `${dirtyTabs.length} tabs have unsaved changes. Close anyway?`
      );
      if (!confirmed) return;
    }

    const tab = this.tabsSignal().find((t) => t.id === tabId);
    if (tab) {
      this.tabsSignal.set([tab]);
      this.activateTab(tabId);
      this.persistTabs();
    }
  }

  /**
   * Activate tab
   */
  activateTab(tabId: string): void {
    this.tabsSignal.update((tabs) =>
      tabs.map((tab) => ({
        ...tab,
        isActive: tab.id === tabId,
        lastAccessedAt: tab.id === tabId ? new Date() : tab.lastAccessedAt,
      }))
    );
    this.activeTabIdSignal.set(tabId);
    localStorage.setItem('activeTabId', tabId);
  }

  /**
   * Update tab state
   */
  updateTabState(tabId: string, state: TabState): void {
    this.tabsSignal.update((tabs) =>
      tabs.map((tab) => (tab.id === tabId ? { ...tab, state } : tab))
    );
    this.persistTabs();
  }

  /**
   * Mark tab as dirty
   */
  markTabAsDirty(tabId: string, isDirty: boolean): void {
    this.tabsSignal.update((tabs) =>
      tabs.map((tab) => (tab.id === tabId ? { ...tab, isDirty } : tab))
    );
    this.persistTabs();
  }

  /**
   * Pin/Unpin tab
   */
  togglePinTab(tabId: string): void {
    this.tabsSignal.update((tabs) =>
      tabs.map((tab) =>
        tab.id === tabId ? { ...tab, isPinned: !tab.isPinned } : tab
      )
    );
    this.persistTabs();
  }

  /**
   * Reorder tabs (drag & drop)
   */
  reorderTabs(fromIndex: number, toIndex: number): void {
    this.tabsSignal.update((tabs) => {
      const newTabs = [...tabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return newTabs;
    });
    this.persistTabs();
  }

  /**
   * Update tab title
   */
  updateTabTitle(tabId: string, title: string): void {
    this.tabsSignal.update((tabs) =>
      tabs.map((tab) => (tab.id === tabId ? { ...tab, title } : tab))
    );
    this.persistTabs();
  }

  /**
   * Refresh tab
   */
  refreshTab(tabId: string): void {
    this.updateTabState(tabId, TabState.LOADING);
    // The iframe or component will handle the actual refresh
  }

  /**
   * Persist tabs to storage
   */
  private persistTabs(): void {
    if (this.configSignal().enablePersistence) {
      localStorage.setItem('openTabs', JSON.stringify(this.tabsSignal()));
    }
  }

  /**
   * Load tabs from storage
   */
  private loadTabsFromStorage(): Tab[] {
    try {
      const saved = localStorage.getItem('openTabs');
      if (saved) {
        const tabs = JSON.parse(saved);
        return tabs.map((tab: any) => ({
          ...tab,
          createdAt: new Date(tab.createdAt),
          lastAccessedAt: new Date(tab.lastAccessedAt),
        }));
      }
    } catch (error) {
      console.error('Failed to load tabs from storage:', error);
    }
    return [];
  }

  /**
   * Clear all persisted tabs
   */
  clearPersistedTabs(): void {
    localStorage.removeItem('openTabs');
    localStorage.removeItem('activeTabId');
  }

  /**
   * Get tab by ID
   */
  getTab(tabId: string): Tab | null {
    return this.tabsSignal().find((t) => t.id === tabId) || null;
  }

  /**
   * Get tab by task code
   */
  getTabByTaskCode(taskCode: string): Tab | null {
    return this.tabsSignal().find((t) => t.taskCode === taskCode) || null;
  }
}
