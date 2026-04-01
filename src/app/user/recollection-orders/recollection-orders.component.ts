import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderEvidence, OrderResponse, OrdersService } from '../services/orders.service';
import { CommonModule } from '@angular/common';
import { UtilService } from '../../shared/util';
import { AuthService } from '../../services/auth.service';

interface EvidenceStage {
  status: number;
  pendingLabel: string;
  completedLabel: string;
  icon: string;
}

@Component({
  selector: 'app-recollection-orders',
  imports: [RouterLink,CommonModule],
  templateUrl: './recollection-orders.component.html',
  styleUrl: './recollection-orders.component.css'
})
export class RecollectionOrdersComponent {
  expandedOrderId?: string | null = null;
  isMobileMenuOpen = false;
  orders:OrderResponse[] = [];
  user_session: any;
  evidenceMap: Record<string, OrderEvidence[]> = {};
  evidenceLoadingMap: Record<string, boolean> = {};
  selectedEvidence: OrderEvidence | null = null;
  readonly evidenceStages: EvidenceStage[] = [
    { status: 3, pendingLabel: 'Recolectando', completedLabel: 'Recolectado', icon: 'local_shipping' },
    { status: 4, pendingLabel: 'En proceso', completedLabel: 'Procesado', icon: 'local_laundry_service' },
    { status: 5, pendingLabel: 'En entrega', completedLabel: 'Entregado', icon: 'near_me' }
  ];

  constructor(private ordersService: OrdersService, private authService: AuthService, public util: UtilService) {}

  ngOnInit() {
    this.loadUserData();
    this.getRecollectionOrders();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

    getRecollectionOrders() {
        this.ordersService.getByUserId(this.user_session.id).subscribe({
      next: (response) => {
        this.orders = response.data;
        console.log('Recollection orders:', this.orders);
      },
      error: (err:any) => {
        console.error('Error retrieving recollection orders:', err);
      }
    });
    }

    

  toggleDetail(orderId?: string) {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;

    if (this.expandedOrderId && !this.evidenceMap[this.expandedOrderId] && !this.evidenceLoadingMap[this.expandedOrderId]) {
      this.loadOrderEvidences(this.expandedOrderId);
    }
  }

     
  loadUserData() {
    const data = this.authService.getStoredUserSession();
    
    if (data) {
      try {
        this.user_session = data;
        console.log('User session cargada:', this.user_session);
       
      } catch (error) {
        console.error('Error al recuperar la sesión del usuario', error);
      }
    }
  }

  getStatus(status: number): string {
    switch(status) {
      case 1:
        return 'Creado';
      case 2:
        return 'Pagado';
      case 3:
        return 'Recolectando';
      case 4:
        return 'Procesando';
      case 5:
        return 'Entregando';
      case 6:
        return 'Completado';
      case 7:
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  }

  fillStatusBar(status: number): string {
        switch(status) {
      case 1:
        return 'w-1/5';
      case 2:
        return 'w-1/5';
      case 3:
        return 'w-2/5';
      case 4:
        return 'w-3/5';
      case 5:
        return 'w-4/5';
      case 6:
        return 'w-5/5';
      case 7:
        return 'w-0.1/5';
      default:
        return 'w-0';

    }
  }

  ShowIcon(status: number): string{
        switch(status) {
      case 1:
        return 'order_approve';
      case 2:
        return 'paid';
      case 3:
        return 'local_shipping';
      case 4:
        return 'local_laundry_service';
      case 5:
        return 'local_shipping';
      case 6:
        return 'task_alt';
      case 7:
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  }

  themeStatusClass(status: number): string{
      switch(status) {
      case 1:
        return 'bg-blue-100 text-blue-600';
      case 2:
        return 'bg-green-100 text-green-600';
      case 3:
        return 'bg-pink-100 text-pink-600';
      case 4:
        return 'bg-purple-100 text-purple-600';
      case 5:
        return 'bg-pink-100 text-pink-600';
      case 6:
        return 'bg-teal-100 text-teal-600';
      case 7:
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  formatCreateAt(dateString: string): string {
    const date = this.parseDateString(dateString);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  formatPickupSchedule(pickupDate?: string | null, pickupTime?: string | null): string {
    if (!pickupDate && !pickupTime) {
      return 'Sin horario de recoleccion';
    }

    const formattedDate = pickupDate ? this.formatCreateAt(pickupDate) : '';
    const formattedTime = this.formatPickupTime(pickupTime);

    if (formattedDate && formattedTime) {
      return `${formattedDate} • ${formattedTime}`;
    }

    return formattedDate || formattedTime || 'Sin horario de recoleccion';
  }

  private formatPickupTime(timeString?: string | null): string {
    if (!timeString) {
      return '';
    }

    const normalizedTime = timeString.length === 5 ? `${timeString}:00` : timeString;
    const date = new Date(`1970-01-01T${normalizedTime}`);

    if (Number.isNaN(date.getTime())) {
      return timeString;
    }

    return date.toLocaleTimeString('es-MX', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  private parseDateString(dateString: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    return new Date(dateString);
  }

  getOrderDetailLabel(detail: OrderResponse['orderDetails'][number]): string {
    const pricingOptionName = detail.pricingOptionName?.trim();

    if (pricingOptionName) {
      return `${detail.quantity} ${pricingOptionName.replace(/bulto/gi, 'Carga')} x ${detail.serviceName}`;
    }

    const unitLabel = detail.uoM === 'BULTO' ? 'Carga' : detail.uoM;
    return `${detail.quantity} ${unitLabel} x ${detail.serviceName}`;
  }

  loadOrderEvidences(orderId: string) {
    this.evidenceLoadingMap[orderId] = true;

    this.ordersService.getEvidences(orderId).subscribe({
      next: (response) => {
        this.evidenceMap[orderId] = [...response].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.evidenceLoadingMap[orderId] = false;
      },
      error: (err: any) => {
        console.error(`Error retrieving evidences for order ${orderId}:`, err);
        this.evidenceMap[orderId] = [];
        this.evidenceLoadingMap[orderId] = false;
      }
    });
  }

  isExpanded(orderId?: string): boolean {
    return this.expandedOrderId === orderId;
  }

  getOrderEvidences(orderId?: string): OrderEvidence[] {
    if (!orderId) {
      return [];
    }

    return this.evidenceMap[orderId] || [];
  }

  getEvidenceTimeline(orderId?: string) {
    const evidences = this.getOrderEvidences(orderId);

    return this.evidenceStages.map((stage) => {
      const stageEvidences = evidences.filter((evidence) => evidence.orderStatusEvidence === stage.status);

      return {
        ...stage,
        label: stageEvidences.length ? stage.completedLabel : stage.pendingLabel,
        evidences: stageEvidences,
        latestEvidenceAt: stageEvidences[0]?.createdAt || null
      };
    });
  }

  formatEvidenceDate(dateString?: string | null): string {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };

    return date.toLocaleDateString('es-MX', options);
  }

  getEvidenceImageUrl(evidenceId: string): string {
    return this.ordersService.getEvidenceImageUrl(evidenceId);
  }

  openEvidenceModal(evidence: OrderEvidence) {
    this.selectedEvidence = evidence;
  }

  closeEvidenceModal() {
    this.selectedEvidence = null;
  }

}
