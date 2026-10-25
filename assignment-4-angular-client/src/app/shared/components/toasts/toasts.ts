import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast-' + toast.kind" role="status">
          <span>{{ toast.message }}</span>
          <button type="button" class="close" aria-label="Dismiss" (click)="toastService.dismiss(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: min(380px, calc(100vw - 32px));
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 8px;
      background: var(--text);
      color: #fff;
      font-size: 14px;
      box-shadow: var(--shadow-lg);
      animation: slide-in 0.2s ease-out;
    }
    .toast-success { background: #166534; }
    .toast-error { background: #b91c1c; }
    .toast span { flex: 1; }
    .close {
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      opacity: 0.8;
    }
    @keyframes slide-in {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: none; opacity: 1; }
    }
  `,
})
export class Toasts {
  protected readonly toastService = inject(ToastService);
}
