import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Addresses, PaymentMethod, ProfileService } from '../services/profile.service';
import { CatalogsService, PickupSchedule, Service, ServiceItem, UserAddress } from '../services/catalogs.service';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../utils/calendar';
import { CreateOrderRequest, Order, OrdersService } from '../services/orders.service';

@Component({
  selector: 'app-new-recollection',
  imports: [RouterLink, CommonModule],
  templateUrl: './new-recollection.component.html',
  styleUrl: './new-recollection.component.css'
})
export class NewRecollectionComponent  {
isConfirming = false;
public user_session: any = null;
UserAddresses : Addresses[] = [];
UserPaymentMethods: PaymentMethod[] = [];
Services: Service[] = [];
calendar: CalendarComponent = new CalendarComponent();
selectedTime: string | null = null;
availableHours: string[] = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
  '20:00', '21:00'
];
deliveryFee = 25;
cart: ServiceItem[] = [];
selectedPickup: PickupSchedule = { date: '', datelabel: '', timeSlot: '' };
selectedAddress: UserAddress = {title: '',fullAddress: ''};
selectedPayment = {id: 0,label: 'No seleccionado', icon: 'payments', details: ''};
 
  

    constructor(
  private profileService: ProfileService,
  private catalogService: CatalogsService,
  private ordersService: OrdersService,
   private router: Router
    ) {}

    ngOnInit() {
    this.loadUserData();
    this.getAddresses();
    this.getPaymentMethods();
    this.getServices();
    this.calendar.setDayLabel();  }

testRedirect(){
  this.router.navigate(['/recollection-received/'], { queryParams: { id: '2' } });
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

  private get sessionUserId(): string {
    return this.user_session?.id ?? this.user_session?.userId ?? '';
  }

  private get sessionUserName(): string {
    return this.user_session?.fullName ?? '';
  }

  private get sessionUserPhone(): string {
    return this.user_session?.phoneNumber ?? '';
  }

    getAddresses(): void {
    const userId = this.sessionUserId; // Get userId from auth service or route params
    console.log('Loading addresses for userId:', userId);
    this.profileService.getAddress(userId).subscribe({
      next: (data:any) => {
        this.UserAddresses = data.addresses;
        console.log('Addresses loaded:', this.UserAddresses);
      },
      error: err => {
        console.error('Error loading addresses:', err);
      }
    });
  }

      onAddressChange(address: any) {
  // Mapeamos los campos del objeto de tu lista al objeto del resumen
  this.selectedAddress = {
    title: address.title,
    fullAddress: `${address.street} ${address.neighbourhood}` 
    // Puedes concatenar más campos si lo prefieres:
    // fullAddress: `${address.street}, ${address.neighbourhood}, ${address.zipCode}`
  };

  console.log('Dirección seleccionada:', this.selectedAddress);
}

      getPaymentMethods(): void {
    
      this.profileService.getPaymentMethods(this.sessionUserId).subscribe({
        next: (paymentMethods: any) => {
          this.UserPaymentMethods = paymentMethods.data;
          console.log('Payment methods loaded:', this.UserPaymentMethods);
        },
        error: (err: any) => {
          console.error('Error loading payment methods:', err);
        }
      });
    
  }

    getServices() {
      return this.catalogService.getServices().subscribe({
        next: (response:any) => {
          this.Services = response.services;
          console.log('Services loaded:', this.Services);
        },
        error: (err) => {
          console.error('Error loading services:', err);
        }
      });
    }

    isItVisaOrMasterCard(paymentMethod: PaymentMethod) {
      if(paymentMethod.cardNumber.startsWith('4')){
        return 'Visa';
      } else if(paymentMethod.cardNumber.startsWith('5')){
        return 'MasterCard';
      } else {
        return 'American';
      }
    }

  updateQuantity(service: any, change: number) {
  if (!service.quantity) {
    service.quantity = 0;
  }

  const newValue = service.quantity + change;

  if (newValue >= 0) {
    service.quantity = newValue;

    // 1. Creamos una copia del carrito actual para asegurar reactividad
    let newCart = [...this.cart];
    const index = newCart.findIndex(item => item.serviceName === service.name);

    if (newValue > 0) {
      if (index > -1) {
        // Actualizamos el objeto existente en la copia
        newCart[index] = { ...newCart[index], quantity: newValue };
      } else {
        // Agregamos el nuevo objeto a la copia
        newCart.push({
          uoM: service.uoM,
          serviceName: service.name,
          servicePrice: service.price,
          unit: service.uoM,
          quantity: newValue,
          serviceId: service.id || Date.now()
        });
      }
    } else {
      // Si es 0, lo eliminamos de la copia
      if (index > -1) {
        newCart.splice(index, 1);
      }
    }

    // 2. Reasignamos el carrito (esto dispara la detección de cambios de Angular)
    this.cart = newCart;
    console.log('Carrito actualizado:', this.cart);
    // 3. Recalculamos el envío (si baja a 0 servicios, el envío también debe ajustarse)
    
  }
}



// Getter para calcular el total dinámicamente
get totalEstimated(): number {
  const subtotal = this.cart.reduce((total, item) => total + (item.servicePrice * item.quantity), 0);
  return subtotal + this.deliveryFee;
}

  selectTime(hour: string) {
  // 1. Actualizamos el estado visual del botón
  this.selectedTime = hour;

  // 2. Calculamos si es AM o PM para el formato del resumen
  const hourNum = parseInt(hour.split(':')[0]);
  const suffix = hourNum >= 12 ? 'PM' : 'AM';
  
  // 3. Formateamos el bloque de tiempo (ej: "09:00 - 11:00 AM")
  // Aquí puedes decidir si mostrar solo la hora o un rango
  const formattedTime = `${hour} ${suffix}`;

  // 4. Actualizamos el objeto que el resumen está observando
  
  this.selectedPickup = {
    date: this.calendar.selectedDate.toISOString().split('T')[0],
    datelabel:this.calendar.selectedDayLabel,
    timeSlot: formattedTime
  };
}

    onPaymentChange(type: 'card' | 'cash', data?: any, id?: number | string) {
      if (type === 'card') {
        this.selectedPayment = {
          id: typeof id === 'string' ? parseInt(id, 10) : (id || 0),
          label: this.isItVisaOrMasterCard(data),
          icon: 'credit_card',
          details: `•••• ${data.cardNumber.slice(-4)}`
        };
      } else {
        this.selectedPayment = {
          id: 0,
          label: 'Pago a domicilio',
          icon: 'payments',
          details: 'Efectivo o Terminal'
        };
      }
    }

    get isOrderValid(): boolean {
      return (
        // 1. Que haya al menos un servicio seleccionado
        this.totalEstimated > 0 && 
        
        // 2. Que la dirección esté completa (usando tu objeto selectedAddress)
        !!this.selectedAddress.fullAddress && 
        
        // 3. Que la recolección tenga día y hora
        !!this.selectedPickup.date && 
        !!this.selectedPickup.timeSlot && 
        
        // 4. Que el método de pago no sea el valor por defecto
        this.selectedPayment.label !== 'No seleccionado'
      );
    }

    confirmOrder() {
      const selectedAddressData = this.UserAddresses.find(addr => addr.title === this.selectedAddress.title);
      
      if (!selectedAddressData) {
        console.error('Selected address not found');
        return;
      }
      this.isConfirming = true;
      console.log('Selected address data for order:', selectedAddressData);
  const order: Order = {
    userId: this.sessionUserId,
    userName: this.sessionUserName,
    userPhone: this.sessionUserPhone,
    userAddressId: selectedAddressData.id ? Number(selectedAddressData.id) : 0,
    shippingAddress: {
      title: selectedAddressData.title,
      street: selectedAddressData.street,
      neighbourhood: selectedAddressData.neighbourhood,
      city: selectedAddressData.city,
      state: selectedAddressData.state,
      zipCode: selectedAddressData.zipCode,
      latitude: selectedAddressData.latitude ?? null,
      longitude: selectedAddressData.longitude ?? null
    },
    userPaymentMethodId: this.selectedPayment.id ? Number(this.selectedPayment.id) : 0,
    pickupDate: this.selectedPickup.date,
    pickupTime: this.selectedPickup.timeSlot.split(' ')[0] + ':00',
    isPostPayment: this.selectedPayment.label === 'Pago a domicilio',
    postPaymentMethod: this.selectedPayment.label === 'Pago a domicilio' ? 'Efectivo o Terminal' : '',
    status: this.selectedPayment.id !== 0 ? 2 : 1,
    totalAmount: this.totalEstimated,
    deliveryFee: this.deliveryFee,
    courierGuid: null,
      courierName: '',
      courierPhone: '',
    orderDetails: this.cart
  };
  const orderPayload: CreateOrderRequest = {
    order: {
      userId: order.userId,
      userName: order.userName,
      userPhone: order.userPhone,
      userAddressId: order.userAddressId,
      shippingAddress: order.shippingAddress,
      userPaymentMethodId: order.userPaymentMethodId,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      isPostPayment: order.isPostPayment,
      postPaymentMethod: order.postPaymentMethod,
      status: order.status,
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      courierGuid: order.courierGuid,
      courierName: order.courierName,
      courierPhone: order.courierPhone
    },
    orderDetails: order.orderDetails
  };

  console.log('Order to be sent:', orderPayload);

  //aqui si el pago es con tarjeta mandar a la pasarela de pagos y esperar confirmacion para crear la orden, si es pago a domicilio crear la orden directamente
  if(order.isPostPayment){
    //Se agrega directo
    this.ordersService.add(orderPayload).subscribe({
        next: (response) => {
          
          console.log('Order created successfully:', response);
          // Navigate or show success message
this.router.navigate(['/recollection-received/'], { queryParams: { id: response.orderId } });
      
        },
        error: (err) => {
          console.error('Error creating order:', err);
        }
      });
  }else{
    //alert('Redirigiendo a pasarela de pagos (simulado)');
    // Simulamos la confirmación del pago después de 2 segundos
    setTimeout(() => {
      // Aquí podrías actualizar el estado del pedido a "pagado" o algo similar
      order.status = 2; // Ejemplo: 2 podría significar "pagado"
      this.ordersService.add(orderPayload).subscribe({
        next: (response) => {
          console.log('Order created successfully after payment:', response);
          // Navigate or show success message
         this.router.navigate(['/recollection-received/'], { queryParams: { id: response.orderId } });
        },
        error: (err) => {
          console.error('Error creating order after payment:', err);
        }
      });
    }, 2000);

  }

      
    }

}
