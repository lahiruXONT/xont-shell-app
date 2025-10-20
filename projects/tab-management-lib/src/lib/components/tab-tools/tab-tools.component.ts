import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tab Tools Component
 * Toolbar with tab actions (refresh, fullscreen, close all, etc.)
 * Legacy: Tab toolbar functionality from Main.aspx
 */
@Component({
  selector: 'lib-tab-tools',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-tools.component.html',
  styleUrl: './tab-tools.component.scss',
})
export class TabToolsComponent {
  @Input() activeTabId: string | null = null;
  @Input() tabCount = 0;
  @Input() canAddTab = true;
  @Input() hasUnsavedTabs = false;
  @Input() isMaximized = false;

  @Output() refreshClicked = new EventEmitter<void>();
  @Output() fullscreenToggled = new EventEmitter<void>();
  @Output() maximizeToggled = new EventEmitter<void>();
  @Output() minimizeClicked = new EventEmitter<void>();
  @Output() closeActiveClicked = new EventEmitter<void>();
  @Output() closeAllClicked = new EventEmitter<void>();
  @Output() closeOthersClicked = new EventEmitter<void>();
  @Output() newTabClicked = new EventEmitter<void>();
  @Output() saveAllClicked = new EventEmitter<void>();

  onRefresh(): void {
    if (this.activeTabId) {
      this.refreshClicked.emit();
    }
  }

  onFullscreen(): void {
    this.fullscreenToggled.emit();
  }

  onMaximize(): void {
    this.maximizeToggled.emit();
  }

  onMinimize(): void {
    if (this.activeTabId) {
      this.minimizeClicked.emit();
    }
  }

  onCloseActive(): void {
    if (this.activeTabId) {
      this.closeActiveClicked.emit();
    }
  }

  onCloseAll(): void {
    if (this.tabCount > 0) {
      if (this.hasUnsavedTabs) {
        if (confirm('Some tabs have unsaved changes. Close all tabs anyway?')) {
          this.closeAllClicked.emit();
        }
      } else {
        this.closeAllClicked.emit();
      }
    }
  }

  onCloseOthers(): void {
    if (this.activeTabId && this.tabCount > 1) {
      this.closeOthersClicked.emit();
    }
  }

  onNewTab(): void {
    if (this.canAddTab) {
      this.newTabClicked.emit();
    }
  }

  onSaveAll(): void {
    if (this.hasUnsavedTabs) {
      this.saveAllClicked.emit();
    }
  }
}
