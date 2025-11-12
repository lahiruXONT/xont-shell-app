import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Tab, TabType, TabState } from 'shared-lib';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/**
 * Tab Content Component
 * Loads iframe or Angular component content
 * Legacy: iframe loading from Main.aspx
 */
@Component({
  selector: 'lib-tab-content',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule, MatIconModule],
  templateUrl: './tab-content.component.html',
  styleUrl: './tab-content.component.scss',
})
export class TabContentComponent implements OnInit, OnDestroy {
  @Input() tab!: Tab;

  @Output() stateChanged = new EventEmitter<TabState>();
  @Output() dirtyChanged = new EventEmitter<boolean>();
  @Output() titleChanged = new EventEmitter<string>();

  @ViewChild('iframe') iframeRef!: ElementRef<HTMLIFrameElement>;

  // Local state
  safeUrl = signal<SafeResourceUrl | null>(null);
  isLoading = signal<boolean>(true);
  loadError = signal<string | null>(null);

  // Enum for template
  readonly TabType = TabType;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadContent();
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  /**
   * Load tab content based on type
   */
  private loadContent(): void {
    if (this.tab.type === TabType.IFRAME) {
      this.loadIframeContent();
    } else if (this.tab.type === TabType.ANGULAR) {
      this.loadAngularContent();
    } else if (this.tab.type === TabType.EXTERNAL) {
      this.loadExternalContent();
    }
  }

  /**
   * Load iframe content
   * Legacy: iframe loading
   */
  private loadIframeContent(): void {
    try {
      this.isLoading.set(true);
      this.stateChanged.emit(TabState.LOADING);

      // Sanitize URL
      const url = this.sanitizer.bypassSecurityTrustResourceUrl(this.tab.url);
      this.safeUrl.set(url);
    } catch (error) {
      console.error('Failed to load iframe:', error);
      this.loadError.set('Failed to load content');
      this.stateChanged.emit(TabState.ERROR);
    }
  }

  /**
   * Load Angular component
   */
  private loadAngularContent(): void {
    // TODO: Implement dynamic component loading
    console.log('Loading Angular component:', this.tab.url);
    this.stateChanged.emit(TabState.LOADED);
  }

  /**
   * Load external content
   */
  private loadExternalContent(): void {
    window.open(this.tab.url, '_blank');
    this.stateChanged.emit(TabState.LOADED);
  }

  /**
   * Handle iframe load
   */
  onIframeLoad(): void {
    this.isLoading.set(false);
    this.loadError.set(null);
    this.stateChanged.emit(TabState.LOADED);

    // Try to detect dirty state from iframe
    try {
      const iframe = this.iframeRef?.nativeElement;
      if (iframe && iframe.contentWindow) {
        // Listen for changes in iframe
        // Legacy: Check for form changes
        this.setupIframeListeners(iframe.contentWindow);
      }
    } catch (error) {
      console.warn('Cannot access iframe content:', error);
    }
  }

  /**
   * Handle iframe error
   */
  onIframeError(event: Event): void {
    console.error('Iframe load error:', event);
    this.isLoading.set(false);
    this.loadError.set('Failed to load content');
    this.stateChanged.emit(TabState.ERROR);
  }

  /**
   * Setup iframe event listeners
   */
  private setupIframeListeners(contentWindow: Window): void {
    try {
      // Listen for form changes
      contentWindow.addEventListener('change', () => {
        this.dirtyChanged.emit(true);
      });

      // Listen for title changes
      const observer = new MutationObserver(() => {
        const title = contentWindow.document.title;
        if (title && title !== this.tab.title) {
          this.titleChanged.emit(title);
        }
      });

      observer.observe(contentWindow.document.head, {
        subtree: true,
        characterData: true,
      });
    } catch (error) {
      console.warn('Cannot setup iframe listeners:', error);
    }
  }

  /**
   * Refresh content
   */
  refresh(): void {
    if (this.tab.type === TabType.IFRAME && this.iframeRef) {
      this.iframeRef.nativeElement.src = this.tab.url;
      this.isLoading.set(true);
      this.stateChanged.emit(TabState.LOADING);
    } else {
      this.loadContent();
    }
  }
}
