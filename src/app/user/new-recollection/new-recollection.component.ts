import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Addresses, PaymentMethod, ProfileService } from '../services/profile.service';
import { CatalogsService, PickupSchedule, Service, ServiceItem, ServicePricingOption, UserAddress } from '../services/catalogs.service';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../utils/calendar';
import { CreateOrderRequest, DeliveryMode, Order, OrdersService } from '../services/orders.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-new-recollection',
  imports: [RouterLink, CommonModule],
  templateUrl: './new-recollection.component.html',
  styleUrl: './new-recollection.component.css'
})
export class NewRecollectionComponent  {
readonly baseDeliveryFee = 25;
isConfirming = false;
public user_session: any = null;
UserAddresses : Addresses[] = [];
UserPaymentMethods: PaymentMethod[] = [];
Services: Service[] = [];
selectedPricingOptions: Record<string, string> = {};
expandedBulkOptions: Record<string, boolean> = {};
deliveryModes: DeliveryMode[] = [];
selectedDeliveryMode: DeliveryMode | null = null;
calendar: CalendarComponent = new CalendarComponent();
selectedTime: string | null = null;
availableHours: string[] = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
  '20:00', '21:00'
];
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
    this.getDeliveryModes();
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
        next: (response) => {
          const servicesWithActiveOptions = response.services
            .map(service => ({
              ...service,
              pricingOptions: (service.pricingOptions ?? []).filter(option => option.isActive)
            }))
            .filter(service => (service.pricingOptions?.length ?? 0) > 0);

          this.Services = servicesWithActiveOptions;
          this.selectedPricingOptions = {};
          this.Services.forEach(service => {
            if (service.id && service.pricingOptions.length > 0) {
              const defaultOption = service.pricingOptions[0];
              this.selectedPricingOptions[service.id] = defaultOption.id;
            }
          });
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

    getDeliveryModes() {
      return this.ordersService.getDeliveryModes().subscribe({
        next: (response) => {
          this.deliveryModes = response.data
            .filter(mode => mode.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);

          this.selectedDeliveryMode =
            this.deliveryModes.find(mode => mode.code === 'TWENTY_FOUR_HOURS') ??
            this.deliveryModes[0] ??
            null;
        },
        error: (err) => {
          console.error('Error loading delivery modes:', err);
        }
      });
    }

  selectDeliveryMode(mode: DeliveryMode) {
    this.selectedDeliveryMode = mode;
  }

  getSelectedPricingOption(service: Service): ServicePricingOption | undefined {
    if (!service.id) {
      return service.pricingOptions?.[0];
    }

    const selectedOptionId = this.selectedPricingOptions[service.id];
    return service.pricingOptions.find(option => option.id === selectedOptionId) ?? service.pricingOptions?.[0];
  }

  onPricingOptionChange(serviceId: string | undefined, optionId: string) {
    if (!serviceId) {
      return;
    }

    this.selectedPricingOptions = {
      ...this.selectedPricingOptions,
      [serviceId]: optionId
    };
  }

  getCartItemQuantity(service: Service): number {
    const selectedOption = this.getSelectedPricingOption(service);

    if (!selectedOption) {
      return 0;
    }

    return this.cart.find(item => item.servicePricingOptionId === selectedOption.id)?.quantity ?? 0;
  }

  getServiceDisplayPrice(service: Service): number {
    return this.getSelectedPricingOption(service)?.price ?? 0;
  }

  getServiceDisplayUnit(service: Service): string {
    return this.getSelectedPricingOption(service)?.uoM ?? '';
  }

  hasBulkOptions(service: Service): boolean {
    return service.pricingOptions.some(option => this.isBulkOption(option));
  }

  getSortedBulkOptions(service: Service): ServicePricingOption[] {
    const bulkOrder: Record<string, number> = {
      'bulto pequeño': 1,
      'bulto mediano': 2,
      'bulto grande': 3,
      'bulto jumbo': 4
    };

    return service.pricingOptions
      .filter(option => this.isBulkOption(option))
      .sort((a, b) => {
        const aOrder = bulkOrder[a.optionName.toLowerCase()] ?? Number.MAX_SAFE_INTEGER;
        const bOrder = bulkOrder[b.optionName.toLowerCase()] ?? Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.optionName.localeCompare(b.optionName);
      });
  }

  getBulkWeightRange(optionName: string): string {
    const normalizedName = optionName.toLowerCase();

    if (normalizedName === 'bulto pequeño') {
      return '8 a 11 kg';
    }

    if (normalizedName === 'bulto mediano') {
      return '10 a 15 kg';
    }

    if (normalizedName === 'bulto grande') {
      return '15 a 22 kg';
    }

    if (normalizedName === 'bulto jumbo') {
      return '23 kg o más';
    }

    return '';
  }

  isBulkOption(option: ServicePricingOption | undefined): boolean {
    if (!option) {
      return false;
    }

    return option.uoM === 'BULTO' || option.optionName.toLowerCase().includes('bulto');
  }

  getCartItem(service: Service): ServiceItem | undefined {
    const selectedOption = this.getSelectedPricingOption(service);

    if (!selectedOption) {
      return undefined;
    }

    return this.cart.find(item => item.servicePricingOptionId === selectedOption.id);
  }

  getBulkQuantity(service: Service, clothType: 'colored' | 'black'): number {
    const cartItem = this.getCartItem(service);

    if (!cartItem) {
      return 0;
    }

    return clothType === 'colored'
      ? (cartItem.coloredClothQuantity ?? 0)
      : (cartItem.blackClothQuantity ?? 0);
  }

  updateBulkQuantity(service: Service, clothType: 'colored' | 'black', value: string) {
    const selectedOption = this.getSelectedPricingOption(service);

    if (!service.id || !selectedOption) {
      return;
    }

    const parsedValue = Number(value);
    const sanitizedValue = Number.isFinite(parsedValue) ? Math.max(0, Math.floor(parsedValue)) : 0;
    const currentItem = this.getCartItem(service);
    const coloredClothQuantity = clothType === 'colored'
      ? sanitizedValue
      : (currentItem?.coloredClothQuantity ?? 0);
    const blackClothQuantity = clothType === 'black'
      ? sanitizedValue
      : (currentItem?.blackClothQuantity ?? 0);
    const totalQuantity = coloredClothQuantity + blackClothQuantity;
    const newCart = [...this.cart];
    const index = newCart.findIndex(item => item.servicePricingOptionId === selectedOption.id);

    if (totalQuantity > 0) {
      const bulkItem: ServiceItem = {
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: selectedOption.price,
        unit: selectedOption.uoM,
        quantity: totalQuantity,
        uoM: selectedOption.uoM,
        servicePricingOptionId: selectedOption.id,
        pricingOptionName: selectedOption.optionName,
        coloredClothQuantity,
        blackClothQuantity
      };

      if (index > -1) {
        newCart[index] = bulkItem;
      } else {
        newCart.push(bulkItem);
      }
    } else if (index > -1) {
      newCart.splice(index, 1);
    }

    this.cart = newCart;
  }

  adjustBulkQuantity(service: Service, clothType: 'colored' | 'black', change: number) {
    const currentValue = this.getBulkQuantity(service, clothType);
    const nextValue = Math.max(0, currentValue + change);

    this.updateBulkQuantity(service, clothType, String(nextValue));
  }

  updateQuantity(service: Service, change: number) {
  const selectedOption = this.getSelectedPricingOption(service);

  if (!service.id || !selectedOption || this.isBulkOption(selectedOption)) {
    return;
  }

  const currentQuantity = this.getCartItemQuantity(service);
  const newValue = currentQuantity + change;

  if (newValue >= 0) {
    let newCart = [...this.cart];
    const index = newCart.findIndex(item => item.servicePricingOptionId === selectedOption.id);

    if (newValue > 0) {
      if (index > -1) {
        newCart[index] = { ...newCart[index], quantity: newValue };
      } else {
        newCart.push({
          uoM: selectedOption.uoM,
          serviceName: service.name,
          servicePrice: selectedOption.price,
          unit: selectedOption.uoM,
          quantity: newValue,
          serviceId: service.id,
          servicePricingOptionId: selectedOption.id,
          pricingOptionName: selectedOption.optionName,
          coloredClothQuantity: null,
          blackClothQuantity: null
        });
      }
    } else {
      if (index > -1) {
        newCart.splice(index, 1);
      }
    }

    this.cart = newCart;
    console.log('Carrito actualizado:', this.cart);
  }
}

  getBulkItemsForService(service: Service): ServiceItem[] {
    return this.cart.filter(item => item.serviceId === service.id && item.uoM === 'BULTO');
  }

  getBulkItemByOptionId(optionId: string): ServiceItem | undefined {
    return this.cart.find(item => item.servicePricingOptionId === optionId);
  }

  getBulkOptionQuantity(optionId: string): number {
    return this.getBulkItemByOptionId(optionId)?.quantity ?? 0;
  }

  getBulkOptionColoredQuantity(optionId: string): number {
    return this.getBulkItemByOptionId(optionId)?.coloredClothQuantity ?? 0;
  }

  getBulkOptionBlackQuantity(optionId: string): number {
    return this.getBulkItemByOptionId(optionId)?.blackClothQuantity ?? 0;
  }

  isBulkOptionExpanded(optionId: string): boolean {
    return this.expandedBulkOptions[optionId] ?? false;
  }

  toggleBulkOption(serviceId: string | undefined, optionId: string) {
    if (serviceId) {
      this.onPricingOptionChange(serviceId, optionId);
    }

    this.expandedBulkOptions = {
      ...this.expandedBulkOptions,
      [optionId]: !this.isBulkOptionExpanded(optionId)
    };
  }



// Getter para calcular el total dinámicamente
get totalEstimated(): number {
  return this.getServicesSubtotal() + this.deliveryFee;
}

get deliveryFee(): number {
  return this.baseDeliveryFee + this.getDeliveryModeSurcharge();
}

getDeliveryModeSurcharge(): number {
  return this.selectedDeliveryMode?.surchargeAmount ?? 0;
}

getServicesSubtotal(): number {
  return this.cart.reduce((total, item) => total + (item.servicePrice * item.quantity), 0);
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
      const hasInvalidBulkItem = this.cart.some(item =>
        (item.uoM === 'BULTO' || item.pricingOptionName?.toLowerCase().includes('bulto')) &&
        ((item.coloredClothQuantity ?? 0) + (item.blackClothQuantity ?? 0) <= 0)
      );

      return (
        this.totalEstimated > 0 && 
        !hasInvalidBulkItem &&
        !!this.selectedAddress.fullAddress && 
        !!this.selectedPickup.date && 
        !!this.selectedPickup.timeSlot && 
        !!this.selectedDeliveryMode &&
        this.selectedPayment.label !== 'No seleccionado'
      );
    }

    confirmOrder() {
      const selectedAddressData = this.UserAddresses.find(addr => addr.title === this.selectedAddress.title);
      
      if (!selectedAddressData) {
        console.error('Selected address not found');
        return;
      }
      if (this.cart.length === 0) {
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
    deliveryModeId: this.selectedDeliveryMode?.id,
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
      deliveryModeId: order.deliveryModeId,
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

  const pricingOptionChecks = this.cart
    .filter(item => !!item.servicePricingOptionId)
    .map(item => this.catalogService.validatePricingOptionIsActive(item.servicePricingOptionId!));

  const createOrder = () => {
    if(order.isPostPayment){
      this.ordersService.add(orderPayload).subscribe({
          next: (response) => {
            console.log('Order created successfully:', response);
            this.router.navigate(['/recollection-received/'], { queryParams: { id: response.orderId } });
          },
          error: (err) => {
            this.isConfirming = false;
            console.error('Error creating order:', err);
          }
        });
    }else{
      setTimeout(() => {
        order.status = 2;
        this.ordersService.add(orderPayload).subscribe({
          next: (response) => {
            console.log('Order created successfully after payment:', response);
            this.router.navigate(['/recollection-received/'], { queryParams: { id: response.orderId } });
          },
          error: (err) => {
            this.isConfirming = false;
            console.error('Error creating order after payment:', err);
          }
        });
      }, 2000);
    }
  };

  if (pricingOptionChecks.length === 0) {
    createOrder();
    return;
  }

  forkJoin(pricingOptionChecks).subscribe({
    next: (results) => {
      const allActive = results.every(result => result.isActive);

      if (!allActive) {
        this.isConfirming = false;
        alert('Una o más opciones de precio ya no están disponibles. Revisa tu carrito y vuelve a intentarlo.');
        return;
      }

      createOrder();
    },
    error: (err) => {
      this.isConfirming = false;
      console.error('Error validating pricing options:', err);
      alert('No fue posible validar las opciones de precio seleccionadas. Intenta nuevamente.');
    }
  });
    }

}
