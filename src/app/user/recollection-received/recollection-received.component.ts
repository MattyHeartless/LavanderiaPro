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
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const today = new Date();
  const tYear = today.getFullYear();
  const tMonth = today.getMonth();
  const tDay = today.getDate();

  // Parseamos la fecha recibida (YYYY-MM-DD)
  const [year, month, day] = pickupDate.split('-').map(Number);
  const orderDate = new Date(year, month - 1, day);

  // Comparamos solo año, mes y día
  const isToday = year === tYear && (month - 1) === tMonth && day === tDay;
  
  // Mañana
  const tomorrow = new Date(tYear, tMonth, tDay + 1);
  const isTomorrow = orderDate.getTime() === tomorrow.getTime();

  // Formatear la hora (quitar segundos)
  const timeFormatted = pickupTime.substring(0, 5);

  if (isToday) {
    return `Hoy a las ${timeFormatted} hrs`;
  } else if (isTomorrow) {
    return `Mañana a las ${timeFormatted} hrs`;
  } else {
    // Resultado: "10 de Febrero"
    return `${day} de ${months[month - 1]} a las ${timeFormatted} hrs`;
  }
}
}
