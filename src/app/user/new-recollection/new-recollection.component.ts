import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Addresses, PaymentMethod, ProfileService } from '../services/profile.service';
import { CatalogsService, PickupSchedule, Service, ServiceItem, UserAddress } from '../services/catalogs.service';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../utils/calendar';

@Component({
  selector: 'app-new-recollection',
  imports: [RouterLink, CommonModule],
  templateUrl: './new-recollection.component.html',
  styleUrl: './new-recollection.component.css'
})
export class NewRecollectionComponent  {
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
selectedPickup: PickupSchedule = { date: '', timeSlot: '' };
selectedAddress: UserAddress = {title: '',fullAddress: ''};
selectedPayment = {label: 'No seleccionado', icon: 'payments', details: ''};

    constructor(
  private profileService: ProfileService,
  private catalogService: CatalogsService,
    ) {}

    ngOnInit() {
    this.loadUserData();
    this.getAddresses();
    this.getPaymentMethods();
    this.getServices();
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

    getAddresses(): void {
    const userId = this.user_session.id; // Get userId from auth service or route params
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
    
      this.profileService.getPaymentMethods(this.user_session.id).subscribe({
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
    const index = newCart.findIndex(item => item.name === service.name);

    if (newValue > 0) {
      if (index > -1) {
        // Actualizamos el objeto existente en la copia
        newCart[index] = { ...newCart[index], quantity: newValue };
      } else {
        // Agregamos el nuevo objeto a la copia
        newCart.push({
          id: service.id || Date.now(),
          name: service.name,
          price: service.price,
          unit: service.uoM,
          quantity: newValue
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

    // 3. Recalculamos el envío (si baja a 0 servicios, el envío también debe ajustarse)
    
  }
}



// Getter para calcular el total dinámicamente
get totalEstimated(): number {
  const subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
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
    date: this.calendar.selectedDayLabel,
    timeSlot: formattedTime
  };
}

    onPaymentChange(type: 'card' | 'cash', data?: any) {
      if (type === 'card') {
        this.selectedPayment = {
          label: this.isItVisaOrMasterCard(data),
          icon: 'credit_card',
          details: `•••• ${data.cardNumber.slice(-4)}`
        };
      } else {
        this.selectedPayment = {
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
}
