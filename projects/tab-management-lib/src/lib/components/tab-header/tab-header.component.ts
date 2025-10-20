import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabManagerService } from '../../services/tab-manager.service';
import { Tab } from '../../models/tab.model';
import {
  CdkDragDrop,
  moveItemInArray,
  DragDropModule,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'lib-tab-header',
  imports: [CommonModule, DragDropModule],
  templateUrl: './tab-header.component.html',
  styleUrl: './tab-header.component.scss',
})
export class TabHeaderComponent {
  tabManager = inject(TabManagerService);
  showTabMenu = signal<string | null>(null);

  onTabClick(tab: Tab): void {
    this.tabManager.activateTab(tab.id);
  }

  async onCloseTab(event: Event, tabId: string): Promise<void> {
    event.stopPropagation();
    await this.tabManager.closeTab(tabId);
  }

  onTabContextMenu(event: MouseEvent, tabId: string): void {
    event.preventDefault();
    this.showTabMenu.set(tabId);
  }

  onPinTab(tabId: string): void {
    this.tabManager.togglePinTab(tabId);
    this.showTabMenu.set(null);
  }

  async onCloseOtherTabs(tabId: string): Promise<void> {
    await this.tabManager.closeOtherTabs(tabId);
    this.showTabMenu.set(null);
  }

  async onCloseAllTabs(): Promise<void> {
    await this.tabManager.closeAllTabs();
    this.showTabMenu.set(null);
  }

  onRefreshTab(tabId: string): void {
    this.tabManager.refreshTab(tabId);
    this.showTabMenu.set(null);
  }

  onDrop(event: CdkDragDrop<Tab[]>): void {
    if (this.tabManager.config().enableDragDrop) {
      this.tabManager.reorderTabs(event.previousIndex, event.currentIndex);
    }
  }

  closeMenu(): void {
    this.showTabMenu.set(null);
  }
  trackByTab(index: number, tab: Tab): string {
    return tab.id;
  }
}
