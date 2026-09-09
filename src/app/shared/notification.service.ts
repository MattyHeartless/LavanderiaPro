import { Injectable } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';
import { NotificationKind, NotificationToastComponent, NotificationToastData } from './notification-toast.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly toast: HotToastService) {}

  success(message: string): void { this.present('success', message); }
  warning(message: string): void { this.present('warning', message); }
  info(message: string): void { this.present('info', message); }
  error(error: unknown, fallback = 'No fue posible completar la operación. Inténtalo de nuevo.'): void {
    this.present('error', this.messageFrom(error, fallback));
  }

  private present(kind: NotificationKind, message: string): void {
    const data: NotificationToastData = {
      kind,
      message,
      eyebrow: { success: 'Todo listo', error: 'Necesita atención', warning: 'Revisa este dato', info: 'Un momento' }[kind]
    };
    const options = { data, id: `laundry-${kind}-${this.slug(message)}` };
    if (kind === 'success') this.toast.success(NotificationToastComponent, options);
    else if (kind === 'error') this.toast.error(NotificationToastComponent, options);
    else if (kind === 'warning') this.toast.warning(NotificationToastComponent, options);
    else this.toast.info(NotificationToastComponent, options);
  }

  private messageFrom(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }

  private slug(message: string): string {
    return message.toLowerCase().trim().replace(/[^a-z0-9áéíóúüñ]+/gi, '-').slice(0, 72);
  }
}
