import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderResponse, OrdersService } from '../services/orders.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recollection-received',
  imports: [RouterLink,CommonModule],
  templateUrl: './recollection-received.component.html',
  styleUrl: './recollection-received.component.css'
})
export class RecollectionReceivedComponent {
orderId : string = '';
orderResp?:OrderResponse;
    constructor(private route: ActivatedRoute, private orderservice: OrdersService) {
     this.orderId = this.route.snapshot.queryParamMap.get('id') || '';
    //alert(`Recollection order received with ID: ${orderId}`);
     this.loadOrder();
  }



  loadOrder() {
    this.orderservice.getById(this.orderId).subscribe({
        next: (response) => {
          
          this.orderResp = response;
          console.log('Order details:', this.orderResp);
        },
        error: (err) => {
          console.error('Error fetching order details:', err);
        }
      });
  }

  formatPickup(pickupDate: string, pickupTime: string): string {
    const today = new Date();
    const tYear = today.getFullYear();
    const tMonth = today.getMonth();
    const tDay = today.getDate();
    const orderDate = this.parseDateString(pickupDate);
    const year = orderDate.getFullYear();
    const month = orderDate.getMonth();
    const day = orderDate.getDate();
    const isToday = year === tYear && month === tMonth && day === tDay;
    const tomorrow = new Date(tYear, tMonth, tDay + 1);
    const isTomorrow = orderDate.getTime() === tomorrow.getTime();
    const formattedTime = this.formatTime(pickupTime);
    const formattedDate = orderDate.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long'
    });

    if (isToday) {
      return `Hoy a las ${formattedTime}`;
    }

    if (isTomorrow) {
      return `Mañana a las ${formattedTime}`;
    }

    return `${formattedDate} a las ${formattedTime}`;
  }

  formatFullDate(dateString?: string): string {
    if (!dateString) {
      return 'Sin fecha';
    }

    return this.parseDateString(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatTime(timeString?: string): string {
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

  getEstimatedDeliveryText(): string {
    if (!this.orderResp?.order.pickupDate) {
      return 'Pendiente de confirmar';
    }

    const pickupDate = this.parseDateString(this.orderResp.order.pickupDate);
    const etaHours = this.orderResp.order.deliveryEtaHours ?? 0;
    const estimatedDate = new Date(pickupDate);

    estimatedDate.setHours(estimatedDate.getHours() + etaHours);

    return estimatedDate.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getServiceSummaryLabel(): string {
    if (!this.orderResp?.orderDetails.length) {
      return 'Sin servicios';
    }

    return this.orderResp.orderDetails
      .map(detail => `${detail.quantity} x ${detail.serviceName}`)
      .join(', ');
  }

  getServicesAmount(): number {
    if (!this.orderResp?.order) {
      return 0;
    }

    return this.orderResp.order.totalAmount - (this.orderResp.order.deliveryFee || 0);
  }

  getDetailLabel(uoM: string): string {
    return uoM === 'BULTO' ? 'Carga' : uoM;
  }

  getDetailDescription(detail: OrderResponse['orderDetails'][number]): string {
    const parts: string[] = [];

    if (detail.pricingOptionName) {
      parts.push(detail.pricingOptionName.replace(/bulto/gi, 'Carga'));
    }

    if ((detail.coloredClothQuantity ?? 0) > 0) {
      parts.push(`${detail.coloredClothQuantity} color`);
    }

    if ((detail.blackClothQuantity ?? 0) > 0) {
      parts.push(`${detail.blackClothQuantity} blanca`);
    }

    return parts.join(' • ');
  }

  private parseDateString(dateString: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    return new Date(dateString);
  }
}
