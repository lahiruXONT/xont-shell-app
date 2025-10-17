import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="spinner-container"
      [class.small]="size === 'small'"
      [class.large]="size === 'large'"
    >
      <div class="spinner"></div>
      <span class="spinner-text" *ngIf="showText">{{ text }}</span>
    </div>
  `,
  styles: [
    `
      .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-top: 4px solid #1a237e;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      .spinner.small {
        .spinner {
          width: 20px;
          height: 20px;
          border-width: 2px;
        }
      }

      .spinner.large {
        .spinner {
          width: 60px;
          height: 60px;
          border-width: 6px;
        }
      }

      .spinner-text {
        margin-top: 10px;
        font-size: 0.9rem;
        color: #666;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() showText = true;
  @Input() text = 'Loading...';
}
