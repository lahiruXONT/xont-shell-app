import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Tab } from '../../models/tab.model';

/**
 * Tab Header Component
 * Displays tab navigation bar with sorting (Legacy: tabsort class)
 */
@Component({
  selector: 'lib-tab-header',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './tab-header.component.html',
  styleUrl: './tab-header.component.scss',
})
export class TabHeaderComponent {
  @Input() tabs: Tab[] = [];
  @Input() activeTabId: string | null = null;
  @Input() minimizedTabs: string[] = [];
  @Input() maximizedTabId: string | null = null;
  @Input() enableSorting = true;

  @Output() tabSelected = new EventEmitter<string>();
  @Output() tabClosed = new EventEmitter<string>();
  @Output() tabMinimized = new EventEmitter<string>();
  @Output() tabRestored = new EventEmitter<string>();
  @Output() tabsReordered = new EventEmitter<{
    fromIndex: number;
    toIndex: number;
  }>();

  readonly visibleTabs = computed(() =>
    this.tabs.filter((tab) => !this.minimizedTabs.includes(tab.id))
  );

  readonly minimizedTabsList = computed(() =>
    this.tabs.filter((tab) => this.minimizedTabs.includes(tab.id))
  );

  onTabClick(tabId: string): void {
    this.tabSelected.emit(tabId);
  }

  onTabClose(event: Event, tabId: string): void {
    event.stopPropagation();
    this.tabClosed.emit(tabId);
  }

  onTabMinimize(event: Event, tabId: string): void {
    event.stopPropagation();
    this.tabMinimized.emit(tabId);
  }

  onTabRestore(event: Event, tabId: string): void {
    event.stopPropagation();
    this.tabRestored.emit(tabId);
  }

  /**
   * Handle drag-drop tab reordering (Legacy: tabsort)
   */
  onTabDrop(event: CdkDragDrop<Tab[]>): void {
    if (!this.enableSorting) {
      return;
    }

    if (event.previousIndex !== event.currentIndex) {
      this.tabsReordered.emit({
        fromIndex: event.previousIndex,
        toIndex: event.currentIndex,
      });
    }
  }

  isTabActive(tabId: string): boolean {
    return this.activeTabId === tabId;
  }

  isTabMinimized(tabId: string): boolean {
    return this.minimizedTabs.includes(tabId);
  }

  trackByTab(index: number, tab: Tab): string {
    return tab.id;
  }
}
