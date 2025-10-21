import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

// Child components
import { TabHeaderComponent } from '../tab-header/tab-header.component';
import { TabContentComponent } from '../tab-content/tab-content.component';
import { TabToolsComponent } from '../tab-tools/tab-tools.component';

// Services
import { TabManagerService } from '../../services/tab-manager.service';
import { ActiveTaskService } from '../../services/active-task.service';
import { SessionService } from '../../services/session.service';

// Models
import { Tab, TabType } from '../../models/tab.model';

/**
 * Tab Manager Component
 * Main container managing all tabs
 * Legacy: Tab container from Main.aspx
 */
@Component({
  selector: 'lib-tab-manager',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    TabHeaderComponent,
    TabContentComponent,
    TabToolsComponent,
  ],
  templateUrl: './tab-manager.component.html',
  styleUrl: './tab-manager.component.scss',
})
export class TabManagerComponent implements OnInit, OnDestroy {
  // Services
  public tabManagerService = inject(TabManagerService);
  private activeTaskService = inject(ActiveTaskService);
  private sessionService = inject(SessionService);

  // Inputs
  @Input() maxTabs = 5;
  @Input() userName!: string;
  @Input() businessUnit!: string;
  @Input() sessionId!: string;

  // Outputs
  @Output() tabOpened = new EventEmitter<Tab>();
  @Output() tabClosed = new EventEmitter<Tab>();
  @Output() tabActivated = new EventEmitter<Tab>();

  // Service state
  readonly tabs = this.tabManagerService.tabs;
  readonly activeTab = this.tabManagerService.activeTab;
  readonly config = this.tabManagerService.config;

  // Local state
  showTools = signal<boolean>(false);

  ngOnInit(): void {
    // Update max tabs config
    this.tabManagerService['configSignal'].update((config) => ({
      ...config,
      maxTabs: this.maxTabs,
    }));

    // Auto-restore session if available
    this.restoreSession();
  }

  ngOnDestroy(): void {
    // Save session on destroy
    this.saveSession();
  }

  /**
   * Open new tab (public API)
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
  ): void {
    const tab = this.tabManagerService.openTab(taskCode, title, url, options);
    if (tab) {
      this.tabOpened.emit(tab);

      // Log active task
      this.activeTaskService.logOpen({
        userName: this.userName,
        businessUnit: this.businessUnit,
        sessionId: this.sessionId,
        taskCode: tab.taskCode,
        applicationCode: tab.metadata?.applicationCode,
        executionType: 0,
        statusFlag: 1,
      });
    }
  }

  /**
   * Handle tab close
   */
  async onTabClose(tab: Tab): Promise<void> {
    const closed = await this.tabManagerService.closeTab(tab.id);
    if (closed) {
      this.tabClosed.emit(tab);

      // Log task close
      this.activeTaskService.logClose({
        userName: this.userName,
        businessUnit: this.businessUnit,
        sessionId: this.sessionId,
        taskCode: tab.taskCode,
        statusFlag: 2,
      } as any);
    }
  }

  /**
   * Handle tab activation
   */
  onTabActivate(tab: Tab): void {
    this.tabManagerService.activateTab(tab.id);
    this.tabActivated.emit(tab);
  }

  /**
   * Handle tab reorder (drag & drop)
   */
  onTabDrop(event: CdkDragDrop<Tab[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.tabManagerService.reorderTabs(
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  /**
   * Handle tab refresh
   */
  onTabRefresh(tab: Tab): void {
    this.tabManagerService.refreshTab(tab.id);
  }

  /**
   * Handle tab pin/unpin
   */
  onTabPin(tab: Tab): void {
    this.tabManagerService.togglePinTab(tab.id);
  }

  /**
   * Close all tabs
   */
  async closeAllTabs(): Promise<void> {
    await this.tabManagerService.closeAllTabs();
  }

  /**
   * Close other tabs
   */
  async closeOtherTabs(tab: Tab): Promise<void> {
    await this.tabManagerService.closeOtherTabs(tab.id);
  }

  /**
   * Toggle tools menu
   */
  toggleTools(): void {
    this.showTools.update((show) => !show);
  }

  /**
   * Save current session
   */
  private saveSession(): void {
    const session = {
      sessionId: this.sessionId,
      userId: this.userName,
      businessUnit: this.businessUnit,
      roleCode: '', // Should be passed from parent
      tabs: this.tabs(),
      activeTabId: this.activeTab()?.id || null,
      minimizedTabs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    this.sessionService.saveSession(session);
  }

  /**
   * Restore previous session
   */
  private restoreSession(): void {
    const state = this.sessionService.state();
    if (state.currentSession && state.currentSession.tabs.length > 0) {
      const confirm = window.confirm('Restore previous session?');
      if (confirm) {
        // Tabs are already loaded from localStorage by TabManagerService
        console.log('Session restored');
      } else {
        this.tabManagerService.clearPersistedTabs();
      }
    }
  }

  /**
   * Track tabs by ID
   */
  trackByTabId(index: number, tab: Tab): string {
    return tab.id;
  }
}
