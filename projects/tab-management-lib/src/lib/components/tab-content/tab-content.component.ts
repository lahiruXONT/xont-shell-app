import { Component, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TabManagerService } from '../../services/tab-manager.service';
import { TabType, TabState } from '../../models/tab.model';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'lib-tab-content',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './tab-content.component.html',
  styleUrl: './tab-content.component.scss',
})
export class TabContentComponent {
  tabManager = inject(TabManagerService);
  private sanitizer = inject(DomSanitizer);

  readonly TabType = TabType;
  readonly TabState = TabState;

  readonly activeTab = computed(() => this.tabManager.activeTab());

  readonly safeUrl = computed(() => {
    const tab = this.activeTab();
    if (tab && tab.type === TabType.IFRAME) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(tab.url);
    }
    return null;
  });

  constructor() {
    // Update tab state when iframe loads
    effect(() => {
      const tab = this.activeTab();
      if (tab && tab.state === TabState.LOADING) {
        // Iframe will trigger load event
      }
    });
  }

  onIframeLoad(tabId: string): void {
    this.tabManager.updateTabState(tabId, TabState.LOADED);
  }

  onIframeError(tabId: string): void {
    this.tabManager.updateTabState(tabId, TabState.ERROR);
  }
}
