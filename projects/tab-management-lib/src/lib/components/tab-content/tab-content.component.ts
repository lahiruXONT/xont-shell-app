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
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Tab, TabState, TabType } from '../../models/tab.model';
import { RouterOutlet } from '@angular/router';

/**
 * Tab Content Component
 * Displays tab content with iframe support
 * Legacy: tabcontent1, tabcontent2, etc. from Main.aspx
 */
@Component({
  selector: 'lib-tab-content',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './tab-content.component.html',
  styleUrl: './tab-content.component.scss',
})
export class TabContentComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() tab!: Tab;
  @Input() isFullscreen = false;

  @Output() stateChanged = new EventEmitter<{
    tabId: string;
    state: TabState;
    error?: string;
  }>();
  @Output() titleChanged = new EventEmitter<{ tabId: string; title: string }>();
  @Output() metadataChanged = new EventEmitter<{
    tabId: string;
    metadata: any;
  }>();

  @ViewChild('iframe', { static: false })
  iframeElement?: ElementRef<HTMLIFrameElement>;

  // Component state
  safeUrl = signal<SafeResourceUrl | null>(null);
  loadProgress = signal<number>(0);

  readonly TabType = TabType;
  readonly TabState = TabState;

  // Message listener
  private messageListener?: (event: MessageEvent) => void;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadContent();
    this.setupMessageListener();
  }

  ngAfterViewInit(): void {
    // Additional setup after view init
  }

  ngOnDestroy(): void {
    this.removeMessageListener();
  }

  /**
   * Load tab content based on type
   * Legacy: LoadTask() equivalent
   */
  private loadContent(): void {
    if (!this.tab) {
      return;
    }

    this.stateChanged.emit({ tabId: this.tab.id, state: TabState.LOADING });

    try {
      switch (this.tab.type) {
        case TabType.IFRAME:
          this.loadIframeContent();
          break;
        case TabType.ROUTE:
          // Handle Angular routes
          this.stateChanged.emit({
            tabId: this.tab.id,
            state: TabState.LOADED,
          });
          break;
        case TabType.EXTERNAL:
          // Handle external links
          this.loadExternalContent();
          break;
        default:
          this.stateChanged.emit({
            tabId: this.tab.id,
            state: TabState.ERROR,
            error: 'Unknown tab type',
          });
      }
    } catch (error) {
      this.stateChanged.emit({
        tabId: this.tab.id,
        state: TabState.ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Load iframe content
   * Legacy: Load ExecutionScript in iframe
   */
  private loadIframeContent(): void {
    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.tab.url);
    this.safeUrl.set(safeUrl);
  }

  /**
   * Load external content
   */
  private loadExternalContent(): void {
    // Open in new window/tab
    window.open(this.tab.url, '_blank');
    this.stateChanged.emit({ tabId: this.tab.id, state: TabState.LOADED });
  }

  /**
   * Handle iframe load event
   */
  onIframeLoad(): void {
    this.loadProgress.set(100);
    this.stateChanged.emit({ tabId: this.tab.id, state: TabState.LOADED });

    // Try to communicate with iframe
    this.sendMessageToIframe({
      type: 'shell:ready',
      tabId: this.tab.id,
      taskCode: this.tab.taskCode,
      data: {
        theme: this.getTheme(),
        user: this.getUserContext(),
      },
    });
  }

  /**
   * Handle iframe error event
   */
  onIframeError(event: Event): void {
    console.error('Iframe load error:', event);
    this.stateChanged.emit({
      tabId: this.tab.id,
      state: TabState.ERROR,
      error: 'Failed to load content',
    });
  }

  /**
   * Refresh iframe content
   * Legacy: Refresh button functionality
   */
  reload(): void {
    if (this.iframeElement) {
      this.stateChanged.emit({ tabId: this.tab.id, state: TabState.LOADING });
      this.loadProgress.set(0);

      // Reload iframe
      const iframe = this.iframeElement.nativeElement;
      const currentSrc = iframe.src;
      iframe.src = '';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 10);
    }
  }

  /**
   * Setup message listener for iframe communication
   * Legacy: Communication between shell and tasks
   */
  private setupMessageListener(): void {
    this.messageListener = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageListener);
  }

  /**
   * Remove message listener
   */
  private removeMessageListener(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
  }

  /**
   * Handle messages from iframe
   * Legacy: Task to shell communication
   */
  private handleMessage(event: MessageEvent): void {
    // Verify origin for security
    // In production, verify against allowed origins

    if (!event.data || typeof event.data !== 'object') {
      return;
    }

    const { type, tabId, data } = event.data;

    // Verify this message is for this tab
    if (tabId && tabId !== this.tab.id) {
      return;
    }

    switch (type) {
      case 'task:loaded':
        this.stateChanged.emit({ tabId: this.tab.id, state: TabState.LOADED });
        break;

      case 'task:error':
        this.stateChanged.emit({
          tabId: this.tab.id,
          state: TabState.ERROR,
          error: data?.message || 'Task error',
        });
        break;

      case 'task:title-changed':
        if (data?.title) {
          this.titleChanged.emit({ tabId: this.tab.id, title: data.title });
        }
        break;

      case 'task:metadata-changed':
        if (data) {
          this.metadataChanged.emit({ tabId: this.tab.id, metadata: data });
        }
        break;

      case 'task:progress':
        if (typeof data?.progress === 'number') {
          this.loadProgress.set(data.progress);
        }
        break;

      case 'task:close':
        // Request tab close - parent should handle
        console.log('Task requested close');
        break;

      case 'task:unsaved-changes':
        this.metadataChanged.emit({
          tabId: this.tab.id,
          metadata: { hasUnsavedChanges: data?.hasChanges || false },
        });
        break;

      default:
        console.log('Unhandled message type:', type, data);
    }
  }

  /**
   * Send message to iframe
   * Legacy: Shell to task communication
   */
  private sendMessageToIframe(message: any): void {
    if (this.iframeElement) {
      const iframe = this.iframeElement.nativeElement;
      try {
        iframe.contentWindow?.postMessage(message, '*'); // In production, specify targetOrigin
      } catch (error) {
        console.error('Failed to send message to iframe:', error);
      }
    }
  }

  /**
   * Get current theme
   */
  private getTheme(): string {
    // Get from theme service or localStorage
    return localStorage.getItem('userTheme') || 'blue';
  }

  /**
   * Get user context for iframe
   */
  private getUserContext(): any {
    // Get from auth service or session
    return {
      userName: sessionStorage.getItem('userName'),
      businessUnit: sessionStorage.getItem('businessUnit'),
      roleCode: sessionStorage.getItem('roleCode'),
    };
  }

  /**
   * Get current content URL
   */
  getContentUrl(): SafeResourceUrl | null {
    return this.safeUrl();
  }

  /**
   * Check if tab is visible
   */
  isVisible(): boolean {
    return this.tab.isActive && !this.tab.isMinimized;
  }
}
