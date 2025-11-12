import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tab } from 'shared-lib';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';

/**
 * Tab Header Component
 * Individual tab header with drag support, context menu
 * Legacy: Tab li elements in Main.aspx
 */
@Component({
  selector: 'lib-tab-header',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatButtonModule,
  ],
  templateUrl: './tab-header.component.html',
  styleUrl: './tab-header.component.scss',
})
export class TabHeaderComponent {
  @Input() tab!: Tab;
  @Input() isActive = false;
  @Input() enableDrag = true;

  @Output() tabClick = new EventEmitter<void>();
  @Output() tabClose = new EventEmitter<void>();
  @Output() tabPin = new EventEmitter<void>();
  @Output() tabRefresh = new EventEmitter<void>();
  @Output() tabCloseOthers = new EventEmitter<void>();

  showContextMenu = signal<boolean>(false);
  contextMenuPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  /**
   * Handle tab click
   */
  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.tabClick.emit();
  }

  /**
   * Handle close button click
   */
  onClose(event: MouseEvent): void {
    event.stopPropagation();
    this.tabClose.emit();
  }

  /**
   * Handle right-click context menu
   */
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.contextMenuPosition.set({
      x: event.clientX,
      y: event.clientY,
    });

    this.showContextMenu.set(true);

    // Close menu when clicking outside
    const closeMenu = () => {
      this.showContextMenu.set(false);
      document.removeEventListener('click', closeMenu);
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);
  }

  /**
   * Handle context menu actions
   */
  onContextAction(action: string, event: MouseEvent): void {
    event.stopPropagation();
    this.showContextMenu.set(false);

    switch (action) {
      case 'refresh':
        this.tabRefresh.emit();
        break;
      case 'pin':
        this.tabPin.emit();
        break;
      case 'close':
        this.tabClose.emit();
        break;
      case 'closeOthers':
        this.tabCloseOthers.emit();
        break;
    }
  }

  /**
   * Get tab state icon
   */
  getStateIcon(): string {
    switch (this.tab.state) {
      case 'LOADING':
        return 'fa-spinner fa-spin';
      case 'ERROR':
        return 'fa-exclamation-triangle';
      default:
        return this.tab.icon || 'fa-file';
    }
  }

  /**
   * Get tab state color
   */
  getStateColor(): string {
    switch (this.tab.state) {
      case 'LOADING':
        return '#3498db';
      case 'ERROR':
        return '#e74c3c';
      default:
        return '#ecf0f1';
    }
  }
}
