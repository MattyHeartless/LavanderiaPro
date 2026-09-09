import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HotToastRef } from '@ngxpert/hot-toast';

export type NotificationKind = 'success' | 'error' | 'warning' | 'info';

export interface NotificationToastData {
  eyebrow: string;
  message: string;
  kind: NotificationKind;
}

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="laundry-toast__content">
      <span class="material-symbols-outlined laundry-toast__status-icon" aria-hidden="true">{{ icon }}</span>
      <span class="laundry-toast__copy">
        <span class="laundry-toast__eyebrow">{{ data.eyebrow }}</span>
        <span class="laundry-toast__message">{{ data.message }}</span>
      </span>
    </div>
  `
})
export class NotificationToastComponent {
  private readonly toastRef = inject(HotToastRef<NotificationToastData>);

  get data(): NotificationToastData { return this.toastRef.data; }

  get icon(): string {
    return { success: 'task_alt', error: 'error', warning: 'priority_high', info: 'local_laundry_service' }[this.data.kind];
  }
}
