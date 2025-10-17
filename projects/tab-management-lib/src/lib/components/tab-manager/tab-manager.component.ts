import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
  ComponentFactoryResolver,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TabManagerService } from '../../tab-manager.service';
import { TabHeaderComponent } from '../tab-header/tab-header.component';
import { TabContentComponent } from '../tab-content/tab-content.component';
import { TabToolsComponent } from '../tab-tools/tab-tools.component';
import { Tab, TabConfig, TabTools, CompareMode } from '../../models/tab.model';

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
  styleUrls: ['./tab-manager.component.scss'],
})
export class TabManagerComponent implements OnInit, OnDestroy {
  @ViewChild('dynamicContent', { read: ViewContainerRef, static: true })
  dynamicContentContainer!: ViewContainerRef;

  private destroy$ = new Subject<void>();

  // Input properties
  @Input() config: Partial<TabConfig> = {};
  @Input() toolsConfig: TabTools = {
    showHomeButton: true,
    showFullscreenButton: true,
    showCompareButton: true,
    showToolsDropdown: true,
    showPrintButton: true,
    showMailButton: true,
    showFavoritesButton: true,
    showNotesButton: true,
    showHelpButton: true,
  };
  @Input() userName = '';
  @Input() businessUnit = '';

  // Output events
  @Output() tabCreated = new EventEmitter<Tab>();
  @Output() tabClosed = new EventEmitter<Tab>();
  @Output() tabActivated = new EventEmitter<Tab>();
  @Output() tabReordered = new EventEmitter<{
    fromIndex: number;
    toIndex: number;
  }>();
  @Output() fullscreenToggled = new EventEmitter<boolean>();
  @Output() compareModeChanged = new EventEmitter<CompareMode>();

  // Component signals
  private selectedTabsForCompareSignal = signal<string[]>([]);

  // Computed properties from service
  readonly tabs = computed(() => this.tabService.tabs());
  readonly activeTab = computed(() => this.tabService.activeTab());
  readonly isFullscreen = computed(() => this.tabService.isFullscreen());
  readonly compareMode = computed(() => this.tabService.compareMode());
  readonly compareTabs = computed(() => this.tabService.compareTabs());
  readonly canCreateNewTab = computed(() => this.tabService.canCreateNewTab());

  // Local computed properties
  readonly visibleTabs = computed(() => {
    const tabs = this.tabs();
    const compareMode = this.compareMode();

    if (compareMode !== 'none') {
      return this.compareTabs();
    }

    return tabs;
  });

  readonly showCompareTools = computed(() => {
    return this.compareMode() !== 'none' && this.compareTabs().length > 1;
  });

  constructor(
    private tabService: TabManagerService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    // Apply configuration changes
    effect(() => {
      if (Object.keys(this.config).length > 0) {
        this.tabService.updateConfiguration(this.config);
      }
    });
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.initializeDefaultTab();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Subscribe to service events
    this.tabService.tabCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tab) => {
        if (tab) {
          this.tabCreated.emit(tab);
          this.loadTabContent(tab);
        }
      });

    this.tabService.tabClosed$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tab) => {
        if (tab) {
          this.tabClosed.emit(tab);
        }
      });

    this.tabService.tabActivated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tab) => {
        if (tab) {
          this.tabActivated.emit(tab);
          this.loadTabContent(tab);
        }
      });

    this.tabService.fullscreenMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isFullscreen) => {
        this.fullscreenToggled.emit(isFullscreen);
      });
  }

  private initializeDefaultTab(): void {
    // Create a home tab if no tabs exist
    if (this.tabs().length === 0) {
      this.createHomeTab();
    }
  }

  // Tab operations
  createTab(
    taskCode: string,
    title: string,
    url: string,
    description?: string,
    taskType?: 'FORM' | 'REPORT' | 'DASHBOARD' | 'EXTERNAL'
  ): void {
    this.tabService
      .createTab(
        taskCode,
        title,
        url,
        description,
        taskType,
        this.userName,
        'MAIN',
        'NONE'
      )
      .subscribe({
        next: (tab) => {
          console.log('Tab created:', tab);
        },
        error: (error) => {
          console.error('Failed to create tab:', error);
        },
      });
  }

  private createHomeTab(): void {
    this.createTab(
      'HOME',
      'Home',
      '/dashboard',
      'Dashboard Overview',
      'DASHBOARD'
    );
  }

  closeTab(tabId: string, force: boolean = false): void {
    this.tabService.closeTab(tabId, force).subscribe({
      next: (closed) => {
        if (closed) {
          console.log('Tab closed successfully');
        }
      },
      error: (error) => {
        console.error('Failed to close tab:', error);
      },
    });
  }

  activateTab(tabId: string): void {
    this.tabService.activateTab(tabId);
  }

  // Drag and drop for tab reordering
  onTabDrop(event: CdkDragDrop<Tab[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.tabService.reorderTabs(event.previousIndex, event.currentIndex);
      this.tabReordered.emit({
        fromIndex: event.previousIndex,
        toIndex: event.currentIndex,
      });
    }
  }

  // Compare mode operations
  toggleCompareMode(mode: CompareMode): void {
    if (this.compareMode() === mode) {
      this.exitCompareMode();
    } else {
      this.enterCompareMode(mode);
    }
  }

  enterCompareMode(mode: CompareMode): void {
    this.tabService.enableCompareMode(mode);
    this.compareModeChanged.emit(mode);
  }

  exitCompareMode(): void {
    this.tabService.clearCompareMode();
    this.compareModeChanged.emit('none');
  }

  toggleTabInCompare(tabId: string): void {
    const compareIds = this.tabService.compareTabIds();
    if (compareIds.includes(tabId)) {
      this.tabService.removeFromCompare(tabId);
    } else {
      this.tabService.addToCompare(tabId);
    }
  }

  isTabInCompare(tabId: string): boolean {
    return this.tabService.compareTabIds().includes(tabId);
  }

  // Fullscreen operations
  toggleFullscreen(): void {
    this.tabService.toggleFullscreen();
  }

  exitFullscreen(): void {
    this.tabService.exitFullscreen();
  }

  // Tab content loading
  private async loadTabContent(tab: Tab): Promise<void> {
    try {
      this.tabService.updateTabState(tab.id, 'loading' as any);

      // Clear existing content
      this.dynamicContentContainer.clear();

      // Load component based on task type
      await this.loadComponentForTab(tab);

      this.tabService.updateTabState(tab.id, 'loaded' as any);
    } catch (error) {
      console.error('Failed to load tab content:', error);
      this.tabService.updateTabState(tab.id, 'error' as any);
    }
  }

  private async loadComponentForTab(tab: Tab): Promise<void> {
    // This would dynamically load components based on task code
    // For now, we'll use a placeholder
    console.log('Loading content for tab:', tab.taskCode);

    // Example dynamic component loading:
    // const componentModule = await import(`./task-modules/${tab.taskCode}/${tab.taskCode}.component`);
    // const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentModule.Component);
    // const componentRef = this.dynamicContentContainer.createComponent(componentFactory);
    // componentRef.instance.tabData = tab;
  }

  // Tools operations
  onHomeClick(): void {
    const homeTab = this.tabs().find((tab) => tab.taskCode === 'HOME');
    if (homeTab) {
      this.activateTab(homeTab.id);
    } else {
      this.createHomeTab();
    }
  }

  onPrintClick(): void {
    const activeTab = this.activeTab();
    if (activeTab) {
      window.print();
    }
  }

  onMailClick(): void {
    const activeTab = this.activeTab();
    if (activeTab) {
      const subject = encodeURIComponent(`Ventura CRM - ${activeTab.title}`);
      const body = encodeURIComponent(
        `${activeTab.description}\n\nURL: ${activeTab.url}`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  }

  onHelpClick(): void {
    const activeTab = this.activeTab();
    if (activeTab && activeTab.metadata && activeTab.metadata['helpUrl']) {
      window.open(activeTab.metadata['helpUrl'], '_blank');
    }
  }

  // Utility methods
  trackByTab(index: number, tab: Tab): string {
    return tab.id;
  }

  getTabIcon(tab: Tab): string {
    if (tab.icon) return tab.icon;

    switch (tab.taskType) {
      case 'DASHBOARD':
        return 'fa fa-dashboard';
      case 'REPORT':
        return 'fa fa-file-text';
      case 'FORM':
        return 'fa fa-edit';
      case 'EXTERNAL':
        return 'fa fa-external-link';
      default:
        return 'fa fa-file';
    }
  }

  getCompareLayoutClass(): string {
    const mode = this.compareMode();
    const tabCount = this.compareTabs().length;

    switch (mode) {
      case 'horizontal':
        return `compare-horizontal compare-${tabCount}`;
      case 'vertical':
        return `compare-vertical compare-${tabCount}`;
      case 'grid':
        return `compare-grid compare-${tabCount}`;
      default:
        return '';
    }
  }
}
