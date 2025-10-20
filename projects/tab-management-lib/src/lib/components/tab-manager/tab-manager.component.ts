import { Component, Input, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabManagerService } from '../../services/tab-manager.service';
import { Tab, TabState } from '../../models/tab.model';
import { TabContentComponent } from '../tab-content/tab-content.component';
import { TabHeaderComponent } from '../tab-header/tab-header.component';
import { TabToolsComponent } from '../tab-tools/tab-tools.component';

/**
 * Tab Manager Component
 * Orchestrates tab layout, header, tools, and content
 * Legacy: Main tab bed in Main.aspx
 */
@Component({
  selector: 'lib-tab-manager',
  standalone: true,
  imports: [
    CommonModule,
    TabHeaderComponent,
    TabContentComponent,
    TabToolsComponent,
  ],
  templateUrl: './tab-manager.component.html',
  styleUrl: './tab-manager.component.scss',
})
export class TabManagerComponent implements OnInit {
  @Input() maxTabs = 15;

  readonly tabs = computed(() => this.tabManagerService.tabs());
  readonly activeTabId = computed(() => this.tabManagerService.activeTabId());
  readonly minimizedTabs = computed(() =>
    this.tabManagerService.minimizedTabs()
  );
  readonly maximizedTabId = computed(() =>
    this.tabManagerService.maximizedTabId()
  );
  readonly hasUnsavedTabs = computed(() =>
    this.tabs().some((tab) => !!tab.metadata?.hasUnsavedChanges)
  );

  constructor(public tabManagerService: TabManagerService) {}

  ngOnInit(): void {}

  // Implement tab tools actions as needed
  toggleFullscreen(): void {}
  openNewTabDialog(): void {}
  saveAllUnsavedTabs(): void {}
  trackByTab(index: number, tab: Tab): string {
    return tab.id;
  }

  onTabStateChanged(event: any): void {}
  onTabTitleChanged(event: any): void {}
  onTabMetadataChanged(event: any): void {}
}
