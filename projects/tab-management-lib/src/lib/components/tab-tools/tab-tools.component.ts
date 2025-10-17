import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabTools, CompareMode } from '../../models/tab.model';

@Component({
  selector: 'lib-tab-tools',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-tools.component.html',
  styleUrls: ['./tab-tools.component.scss'],
})
export class TabToolsComponent {
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

  @Input() showCompareTools: boolean = false;
  @Input() compareMode: CompareMode = 'none';
  @Input() userName: string = '';
  @Input() businessUnit: string = '';

  @Output() homeClick = new EventEmitter<void>();
  @Output() fullscreenClick = new EventEmitter<void>();
  @Output() compareClick = new EventEmitter<void>();
  @Output() printClick = new EventEmitter<void>();
  @Output() mailClick = new EventEmitter<void>();
  @Output() helpClick = new EventEmitter<void>();

  // Event handlers
  onHomeClick(): void {
    this.homeClick.emit();
  }

  onFullscreenClick(): void {
    this.fullscreenClick.emit();
  }

  onCompareClick(): void {
    this.compareClick.emit();
  }

  onPrintClick(): void {
    this.printClick.emit();
  }

  onMailClick(): void {
    this.mailClick.emit();
  }

  onHelpClick(): void {
    this.helpClick.emit();
  }

  // Utility methods
  getCompareModeLabel(): string {
    switch (this.compareMode) {
      case 'horizontal':
        return 'Horizontal Compare';
      case 'vertical':
        return 'Vertical Compare';
      case 'grid':
        return 'Grid Compare';
      default:
        return 'Compare';
    }
  }

  getCompareIcon(): string {
    switch (this.compareMode) {
      case 'horizontal':
        return 'fa fa-columns';
      case 'vertical':
        return 'fa fa-table';
      case 'grid':
        return 'fa fa-th';
      default:
        return 'fa fa-columns';
    }
  }
}
