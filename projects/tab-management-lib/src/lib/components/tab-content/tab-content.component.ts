import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tab, CompareMode } from '../../models/tab.model';

@Component({
  selector: 'lib-tab-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-content.component.html',
  styleUrls: ['./tab-content.component.scss'],
})
export class TabContentComponent {
  @Input() tabs: Tab[] = [];
  @Input() activeTab: Tab | null = null;
  @Input() compareMode: CompareMode = 'none';
  @Input() compareTabs: Tab[] = [];

  // Computed properties
  readonly isComparing = computed(
    () => this.compareMode !== 'none' && this.compareTabs.length > 1
  );

  getCompareLayoutClass(): string {
    const mode = this.compareMode;
    const tabCount = this.compareTabs.length;

    switch (mode) {
      case 'horizontal':
        return `compare-layout compare-horizontal compare-${tabCount}`;
      case 'vertical':
        return `compare-layout compare-vertical compare-${tabCount}`;
      case 'grid':
        return `compare-layout compare-grid compare-${tabCount}`;
      default:
        return '';
    }
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
}
