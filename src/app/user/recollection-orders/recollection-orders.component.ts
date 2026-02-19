import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderResponse, OrdersService } from '../services/orders.service';
import { CommonModule } from '@angular/common';
import { UtilService } from '../../shared/util';
@Component({
  selector: 'app-recollection-orders',
  imports: [RouterLink,CommonModule],
  templateUrl: './recollection-orders.component.html',
  styleUrl: './recollection-orders.component.css'
})
export class RecollectionOrdersComponent {
    expandedOrderId?: string | null = null;
  orders:OrderResponse[] = [];
  user_session: any;
    constructor(private ordersService: OrdersService, public util: UtilService) {}

  ngOnInit() {
    this.loadUserData();
    this.getRecollectionOrders();
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
}

     
  loadUserData() {
    const data = localStorage.getItem('user_session');
    
    if (data) {
      try {
        // Convertimos el string de nuevo a un objeto JS
        this.user_session = JSON.parse(data);
        console.log('User session cargada:', this.user_session);
       
      } catch (error) {
        console.error('Error al parsear datos del localStorage', error);
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
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

}
