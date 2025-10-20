import { Injectable, signal, computed, effect } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  Tab,
  TabType,
  TabState,
  TabConfig,
  TabEvent,
  TabDOMRef,
} from '../models/tab.model';

/**
 * Tab Manager Service - Complete implementation
 * Mirrors legacy LoadTask() and tab management from Main.aspx
 */
@Injectable({
  providedIn: 'root',
})
export class TabManagerService {
  // Default configuration (from legacy system)
  private readonly DEFAULT_CONFIG: TabConfig = {
    maxTabs: 15, // Legacy system limit
    allowDuplicates: false,
    persistTabs: true,
    enableMinimize: true, // Legacy feature
    enableMaximize: true, // Legacy feature
    enableFullscreen: true,
    defaultTabType: TabType.IFRAME,
    enableSorting: true, // Legacy: tabsort class
    autoCloseOnError: false,
  };

  // Angular 19 signals for reactive state
  private tabsSignal = signal<Tab[]>([]);
  private activeTabIdSignal = signal<string | null>(null);
  private minimizedTabsSignal = signal<string[]>([]);
  private maximizedTabIdSignal = signal<string | null>(null);
  private configSignal = signal<TabConfig>(this.DEFAULT_CONFIG);
  private tabDOMRefsSignal = signal<Map<string, TabDOMRef>>(new Map());

  // Legacy observables for compatibility
  private tabsSubject = new BehaviorSubject<Tab[]>([]);
  private activeTabSubject = new BehaviorSubject<string | null>(null);
  private tabEventsSubject = new Subject<TabEvent>();

  // Public readonly signals
  readonly tabs = this.tabsSignal.asReadonly();
  readonly activeTabId = this.activeTabIdSignal.asReadonly();
  readonly minimizedTabs = this.minimizedTabsSignal.asReadonly();
  readonly maximizedTabId = this.maximizedTabIdSignal.asReadonly();
  readonly config = this.configSignal.asReadonly();

  // Computed values
  readonly activeTab = computed(() => {
    const tabs = this.tabsSignal();
    const activeId = this.activeTabIdSignal();
    return tabs.find((tab) => tab.id === activeId) || null;
  });

  readonly tabCount = computed(() => this.tabsSignal().length);

  readonly visibleTabs = computed(() => {
    const tabs = this.tabsSignal();
    const minimized = this.minimizedTabsSignal();
    return tabs.filter((tab) => !minimized.includes(tab.id));
  });

  readonly canAddTab = computed(() => {
    return this.tabsSignal().length < this.configSignal().maxTabs;
  });

  readonly hasUnsavedTabs = computed(() => {
    return this.tabsSignal().some((tab) => tab.metadata?.hasUnsavedChanges);
  });

  readonly isAnyMaximized = computed(() => {
    return this.maximizedTabIdSignal() !== null;
  });

  // Public observables (legacy support)
  readonly tabs$ = this.tabsSubject.asObservable();
  readonly activeTab$ = this.activeTabSubject.asObservable();
  readonly tabEvents$ = this.tabEventsSubject.asObservable();

  constructor() {
    this.setupEffects();
    this.loadPersistedTabs();
  }

  /**
   * Setup reactive effects
   */
  private setupEffects(): void {
    // Auto-save tabs on changes
    effect(() => {
      const tabs = this.tabsSignal();
      if (this.configSignal().persistTabs && tabs.length > 0) {
        this.persistTabs();
      }
    });
  }

  /**
   * Open a new tab (Legacy: LoadTask() equivalent)
   * @param taskCode Task code from menu (e.g., 'TASK001')
   * @param title Tab title/caption
   * @param url ExecutionScript path or URL
   * @param options Additional tab options
   */
  openTab(
    taskCode: string,
    title: string,
    url: string,
    options?: Partial<Tab>
  ): Tab | null {
    // Check if tab already exists (unless duplicates allowed)
    if (!this.configSignal().allowDuplicates) {
      const existingTab = this.findTabByTaskCode(taskCode);
      if (existingTab) {
        this.activateTab(existingTab.id);
        return existingTab;
      }
    }

    // Check max tabs limit
    if (!this.canAddTab()) {
      console.warn(
        `Cannot open tab: Maximum tabs (${this.configSignal().maxTabs}) reached`
      );
      return null;
    }

    // Generate unique tab ID (like tabcontent1, tabcontent2)
    const tabId = this.generateTabId();

    // Create new tab
    const newTab: Tab = {
      id: tabId,
      taskCode,
      title,
      icon: options?.icon || 'fa-file',
      url,
      type: options?.type || this.configSignal().defaultTabType,
      state: TabState.LOADING,
      isActive: true,
      isPinned: options?.isPinned || false,
      isMinimized: false,
      isMaximized: false,
      order: this.tabsSignal().length,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      metadata: {
        ...options?.metadata,
        sessionId: this.getSessionId(),
        executionType: 0, // Legacy: 0 = opening
      },
    };

    // Update tabs array - deactivate all others
    const currentTabs = this.tabsSignal();
    const updatedTabs = [
      ...currentTabs.map((t) => ({ ...t, isActive: false })),
      newTab,
    ];

    this.tabsSignal.set(updatedTabs);
    this.activeTabIdSignal.set(newTab.id);

    this.syncSubjects();
    this.emitTabEvent('opened', newTab);

    // Call server to log task (Legacy: AddTaskDetails)
    this.logActiveTask(newTab);

    return newTab;
  }

  /**
   * Close a tab (Legacy: ClearSessionTask equivalent)
   * @param tabId Tab identifier to close
   */
  closeTab(tabId: string): void {
    const tabs = this.tabsSignal();
    const tabIndex = tabs.findIndex((t) => t.id === tabId);

    if (tabIndex === -1) {
      return;
    }

    const closedTab = tabs[tabIndex];

    // Check for unsaved changes
    if (closedTab.metadata?.hasUnsavedChanges) {
      // Emit event for confirmation dialog
      this.tabEventsSubject.next({
        type: 'closed',
        tab: closedTab,
        timestamp: new Date(),
      });
      // Actual close should happen after user confirmation
      return;
    }

    // Log task closing (Legacy: ExecutionType = 1)
    this.logTaskClosing(closedTab);

    // Remove tab
    const updatedTabs = tabs.filter((t) => t.id !== tabId);

    // Remove from minimized list if present
    const minimized = this.minimizedTabsSignal();
    if (minimized.includes(tabId)) {
      this.minimizedTabsSignal.set(minimized.filter((id) => id !== tabId));
    }

    // Clear maximize if this tab was maximized
    if (this.maximizedTabIdSignal() === tabId) {
      this.maximizedTabIdSignal.set(null);
    }

    // If closing active tab, activate another
    if (closedTab.isActive && updatedTabs.length > 0) {
      const newActiveTab = updatedTabs[Math.max(0, tabIndex - 1)];
      newActiveTab.isActive = true;
      this.activeTabIdSignal.set(newActiveTab.id);
    } else if (updatedTabs.length === 0) {
      this.activeTabIdSignal.set(null);
    }

    this.tabsSignal.set(updatedTabs);
    this.syncSubjects();
    this.persistTabs();
    this.emitTabEvent('closed', closedTab);

    // Clear session variables (Legacy: ClearSessionTask)
    this.clearTabSession(tabId);
  }

  /**
   * Close all tabs
   */
  closeAllTabs(): void {
    const tabs = [...this.tabsSignal()];

    // Close unpinned tabs
    tabs.forEach((tab) => {
      if (!tab.isPinned) {
        this.closeTab(tab.id);
      }
    });
  }

  /**
   * Close all except specified tab
   */
  closeOtherTabs(exceptTabId: string): void {
    const tabs = this.tabsSignal();
    const keepTab = tabs.find((t) => t.id === exceptTabId);

    if (!keepTab) {
      return;
    }

    const closedTabs = tabs.filter((t) => t.id !== exceptTabId && !t.isPinned);
    const updatedTabs = [
      keepTab,
      ...tabs.filter((t) => t.isPinned && t.id !== exceptTabId),
    ];

    this.tabsSignal.set(updatedTabs);
    this.activateTab(exceptTabId);
    this.syncSubjects();
    this.persistTabs();

    closedTabs.forEach((tab) => {
      this.logTaskClosing(tab);
      this.emitTabEvent('closed', tab);
    });
  }

  /**
   * Activate a tab
   */
  activateTab(tabId: string): void {
    const tabs = this.tabsSignal();
    const updatedTabs = tabs.map((tab) => ({
      ...tab,
      isActive: tab.id === tabId,
      lastAccessedAt: tab.id === tabId ? new Date() : tab.lastAccessedAt,
    }));

    this.tabsSignal.set(updatedTabs);
    this.activeTabIdSignal.set(tabId);

    // Remove from minimized if it was minimized
    const minimized = this.minimizedTabsSignal();
    if (minimized.includes(tabId)) {
      this.minimizedTabsSignal.set(minimized.filter((id) => id !== tabId));
    }

    this.syncSubjects();
    this.persistTabs();

    const activatedTab = updatedTabs.find((t) => t.id === tabId);
    if (activatedTab) {
      this.emitTabEvent('activated', activatedTab);
    }
  }

  /**
   * Minimize tab (Legacy feature)
   */
  minimizeTab(tabId: string): void {
    const tabs = this.tabsSignal();
    const tab = tabs.find((t) => t.id === tabId);

    if (!tab || !this.configSignal().enableMinimize) {
      return;
    }

    const minimized = this.minimizedTabsSignal();
    if (!minimized.includes(tabId)) {
      this.minimizedTabsSignal.set([...minimized, tabId]);
    }

    const updatedTabs = tabs.map((t) =>
      t.id === tabId
        ? { ...t, isMinimized: true, state: TabState.MINIMIZED }
        : t
    );

    this.tabsSignal.set(updatedTabs);
    this.syncSubjects();

    const minimizedTab = updatedTabs.find((t) => t.id === tabId);
    if (minimizedTab) {
      this.emitTabEvent('minimized', minimizedTab);
    }
  }

  /**
   * Restore minimized tab
   */
  restoreTab(tabId: string): void {
    const minimized = this.minimizedTabsSignal();
    this.minimizedTabsSignal.set(minimized.filter((id) => id !== tabId));

    const tabs = this.tabsSignal();
    const updatedTabs = tabs.map((t) =>
      t.id === tabId ? { ...t, isMinimized: false, state: TabState.LOADED } : t
    );

    this.tabsSignal.set(updatedTabs);
    this.activateTab(tabId);
  }

  /**
   * Maximize tab (Legacy feature)
   */
  maximizeTab(tabId: string): void {
    if (!this.configSignal().enableMaximize) {
      return;
    }

    this.maximizedTabIdSignal.set(tabId);

    const tabs = this.tabsSignal();
    const updatedTabs = tabs.map((t) => ({
      ...t,
      isMaximized: t.id === tabId,
    }));

    this.tabsSignal.set(updatedTabs);
    this.syncSubjects();

    const maximizedTab = updatedTabs.find((t) => t.id === tabId);
    if (maximizedTab) {
      this.emitTabEvent('maximized', maximizedTab);
    }
  }

  /**
   * Restore maximized tab
   */
  restoreMaximized(): void {
    this.maximizedTabIdSignal.set(null);

    const tabs = this.tabsSignal();
    const updatedTabs = tabs.map((t) => ({
      ...t,
      isMaximized: false,
    }));

    this.tabsSignal.set(updatedTabs);
    this.syncSubjects();
  }

  /**
   * Update tab state
   */
  updateTabState(tabId: string, state: TabState, error?: string): void {
    const tabs = this.tabsSignal();
    const updatedTabs = tabs.map((tab) =>
      tab.id === tabId ? { ...tab, state, error } : tab
    );

    this.tabsSignal.set(updatedTabs);
    this.syncSubjects();

    const updatedTab = updatedTabs.find((t) => t.id === tabId);
    if (updatedTab) {
      this.emitTabEvent('updated', updatedTab);
    }
  }

  /**
   * Update tab metadata
   */
  updateTabMetadata(tabId: string, metadata: Record<string, any>): void {
    const tabs = this.tabsSignal();
    const updatedTabs = tabs.map((tab) =>
      tab.id === tabId
        ? { ...tab, metadata: { ...tab.metadata, ...metadata } }
        : tab
    );

    this.tabsSignal.set(updatedTabs);
    this.syncSubjects();
    this.persistTabs();
  }

  /**
   * Toggle tab pin status
   */
  toggleTabPin(tabId: string): void {
    const tabs = this.tabsSignal();
    const updatedTabs = tabs.map((tab) =>
      tab.id === tabId ? { ...tab, isPinned: !tab.isPinned } : tab
    );

    this.tabsSignal.set(updatedTabs);
    this.syncSubjects();
    this.persistTabs();
  }

  /**
   * Reorder tabs (Legacy: tabsort class for drag-drop)
   * @param fromIndex Source index
   * @param toIndex Destination index
   */
  reorderTabs(fromIndex: number, toIndex: number): void {
    if (!this.configSignal().enableSorting) {
      return;
    }

    const tabs = [...this.tabsSignal()];
    const [movedTab] = tabs.splice(fromIndex, 1);
    tabs.splice(toIndex, 0, movedTab);

    const reorderedTabs = tabs.map((tab, index) => ({
      ...tab,
      order: index,
    }));

    this.tabsSignal.set(reorderedTabs);
    this.syncSubjects();
    this.persistTabs();

    this.emitTabEvent('sorted', movedTab);
  }

  /**
   * Refresh tab (reload iframe)
   */
  refreshTab(tabId: string): void {
    this.updateTabState(tabId, TabState.LOADING);
    this.emitTabEvent('updated', this.findTabById(tabId)!);
  }

  /**
   * Find tab by ID
   */
  findTabById(tabId: string): Tab | undefined {
    return this.tabsSignal().find((t) => t.id === tabId);
  }

  /**
   * Find tab by task code
   */
  findTabByTaskCode(taskCode: string): Tab | undefined {
    return this.tabsSignal().find((t) => t.taskCode === taskCode);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TabConfig>): void {
    this.configSignal.update((current) => ({ ...current, ...config }));
  }

  /**
   * Register DOM reference for tab
   */
  registerTabDOM(tabId: string, domRef: TabDOMRef): void {
    const refs = this.tabDOMRefsSignal();
    refs.set(tabId, domRef);
    this.tabDOMRefsSignal.set(new Map(refs));
  }

  /**
   * Get DOM reference for tab
   */
  getTabDOM(tabId: string): TabDOMRef | undefined {
    return this.tabDOMRefsSignal().get(tabId);
  }

  /**
   * Generate unique tab ID (like tabcontent1, tabcontent2)
   */
  private generateTabId(): string {
    const count = this.tabsSignal().length + 1;
    return `tabcontent${count}_${Date.now()}`;
  }

  /**
   * Get current session ID
   */
  private getSessionId(): string {
    // This should come from authentication service
    return sessionStorage.getItem('sessionId') || 'session_' + Date.now();
  }

  /**
   * Sync signals to subjects (for legacy observable support)
   */
  private syncSubjects(): void {
    this.tabsSubject.next(this.tabsSignal());
    this.activeTabSubject.next(this.activeTabIdSignal());
  }

  /**
   * Emit tab event
   */
  private emitTabEvent(type: TabEvent['type'], tab: Tab): void {
    this.tabEventsSubject.next({
      type,
      tab,
      timestamp: new Date(),
    });
  }

  /**
   * Persist tabs to storage
   */
  private persistTabs(): void {
    if (!this.configSignal().persistTabs) {
      return;
    }

    try {
      const tabs = this.tabsSignal();
      const activeTabId = this.activeTabIdSignal();
      const minimizedTabs = this.minimizedTabsSignal();

      sessionStorage.setItem(
        'xont_tabs',
        JSON.stringify({
          tabs: tabs.map((t) => ({ ...t, state: TabState.IDLE })),
          activeTabId,
          minimizedTabs,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to persist tabs:', error);
    }
  }

  /**
   * Load persisted tabs from storage
   */
  private loadPersistedTabs(): void {
    if (!this.configSignal().persistTabs) {
      return;
    }

    try {
      const stored = sessionStorage.getItem('xont_tabs');
      if (!stored) {
        return;
      }

      const { tabs, activeTabId, minimizedTabs } = JSON.parse(stored);

      // Restore tabs (max 24 hours old)
      if (tabs && tabs.length > 0) {
        const storedDate = new Date(tabs[0]?.createdAt);
        const now = new Date();
        const hoursDiff =
          (now.getTime() - storedDate.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          this.tabsSignal.set(tabs);
          this.activeTabIdSignal.set(activeTabId);
          this.minimizedTabsSignal.set(minimizedTabs || []);
          this.syncSubjects();
        }
      }
    } catch (error) {
      console.error('Failed to load persisted tabs:', error);
    }
  }

  /**
   * Clear persisted tabs
   */
  clearPersistedTabs(): void {
    try {
      sessionStorage.removeItem('xont_tabs');
    } catch (error) {
      console.error('Failed to clear persisted tabs:', error);
    }
  }

  /**
   * Log active task to server (Legacy: AddTaskDetails WebMethod)
   */
  private logActiveTask(tab: Tab): void {
    // This should call the API service
    console.log('Logging active task:', tab.taskCode);
    // API call would go here
  }

  /**
   * Log task closing (Legacy: ExecutionType = 1)
   */
  private logTaskClosing(tab: Tab): void {
    // This should call the API service
    console.log('Logging task closing:', tab.taskCode);
    // API call would go here
  }

  /**
   * Clear tab session (Legacy: ClearSessionTask)
   */
  private clearTabSession(tabId: string): void {
    // Clear any tab-specific session data
    console.log('Clearing session for tab:', tabId);
  }
}
