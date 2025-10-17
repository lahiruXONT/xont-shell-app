import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Tab, CompareMode } from '../../models/tab.model';

@Component({
  selector: 'lib-tab-header',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './tab-header.component.html',
  styleUrls: ['./tab-header.component.scss'],
})
export class TabHeaderComponent {
  @Input() tabs: Tab[] = [];
  @Input() activeTabId: string | null = null;
  @Input() compareMode: CompareMode = 'none';
  @Input() canCreateNewTab: boolean = true;

  @Output() tabActivated = new EventEmitter<string>();
  @Output() tabClosed = new EventEmitter<string>();
  @Output() tabDrop = new EventEmitter<CdkDragDrop<Tab[]>>();
  @Output() compareToggle = new EventEmitter<string>();

  // Computed properties
  readonly hasTabs = computed(() => this.tabs.length > 0);

  // Event handlers
  onTabClick(tabId: string): void {
    this.tabActivated.emit(tabId);
  }

  onCloseTab(tabId: string, event: Event): void {
    event.stopPropagation();
    this.tabClosed.emit(tabId);
  }

  onCompareToggle(tabId: string, event: Event): void {
    event.stopPropagation();
    this.compareToggle.emit(tabId);
  }

  onDrop(event: CdkDragDrop<Tab[]>): void {
    this.tabDrop.emit(event);
  }

  // Utility methods
  isActive(tabId: string): boolean {
    return this.activeTabId === tabId;
  }

  isTabInCompare(tabId: string): boolean {
    return this.compareMode !== 'none' && this.tabs.some((t) => t.id === tabId);
  }

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
  onNewTab(): void {
    // This should be handled by the parent component
    // For now, emit an event or do nothing
    console.log('New tab button clicked');
  }
}
