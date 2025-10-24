import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tab } from 'shared-lib';

/**
 * Tab Tools Component
 * Toolbar with tab actions
 * Legacy: Tab tools menu
 */
@Component({
  selector: 'lib-tab-tools',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-tools.component.html',
  styleUrl: './tab-tools.component.scss',
})
export class TabToolsComponent {
  @Input() tab!: Tab;

  @Output() refresh = new EventEmitter<void>();
  @Output() closeAll = new EventEmitter<void>();
  @Output() closeOthers = new EventEmitter<void>();
  @Output() toolsClosed = new EventEmitter<void>();

  onRefresh(): void {
    this.refresh.emit();
    this.toolsClosed.emit();
  }

  onCloseAll(): void {
    const confirmed = confirm('Close all tabs?');
    if (confirmed) {
      this.closeAll.emit();
      this.toolsClosed.emit();
    }
  }

  onCloseOthers(): void {
    const confirmed = confirm('Close all other tabs?');
    if (confirmed) {
      this.closeOthers.emit();
      this.toolsClosed.emit();
    }
  }

  onClose(): void {
    this.toolsClosed.emit();
  }
}
