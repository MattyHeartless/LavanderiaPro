import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';
import { ServiceItem } from './catalogs.service';

// filepath: c:\Users\Jair\Documents\My Web Sites\LaundrApp\LaundrApp\src\app\user\services\orders.service.ts

export interface ShippingAddress {
    title: string;
    street: string;
    neighbourhood: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number | null;
    longitude?: number | null;
}

export interface DeliveryMode {
  id: number;
  code: string;
  name: string;
  etaHours: number;
  surchargeAmount: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Order {
    id?: string;
    userId: string;
    userName: string;
    userPhone: string;
    userAddressId: number;
    shippingAddress: ShippingAddress;
    userPaymentMethodId: number;
    pickupDate: string;
    pickupTime: string;
    deliveryModeId?: number;
    isPostPayment: boolean;
    postPaymentMethod: string;
    status: number;
    totalAmount: number;
    deliveryFee: number;
    courierGuid: string | null;
    courierName: string;
    courierPhone: string;
    createdAt?: string;
    recollectedAt?: string;
    deliveredAt?: string;
    orderDetails: ServiceItem[];
}

export interface OrderDetail {
  id: string;
  orderId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  servicePrice: number;
  subTotal: number;
  uoM: string;
  servicePricingOptionId?: string | null;
  pricingOptionName?: string | null;
  coloredClothQuantity?: number | null;
  blackClothQuantity?: number | null;
}

export interface OrderEvidence {
  id: string;
  orderId: string;
  orderStatusEvidence: number;
  courierId: string;
  fileUrl: string;
  relativePath: string;
  mimeType: string;
  sizeBytes: number;
  note: string;
  createdAt: string;
}

export interface OrderResponse {
  message: string;
  order: Order;
  orderDetails: OrderDetail[];
}

export interface CreateOrderRequest {
    order: Omit<Order, 'id' | 'createdAt' | 'recollectedAt' | 'deliveredAt' | 'orderDetails'>;
    orderDetails: ServiceItem[];
}

@Injectable({
    providedIn: 'root'
})
export class OrdersService {

    private readonly ordersUrl = environment.ordersApiUrl;
    private ordersSubject = new BehaviorSubject<Order[]>([]);

    public orders$ = this.ordersSubject.asObservable();

    constructor(private http: HttpClient) {}

    getById(orderId: string) {
        return this.http.get<OrderResponse>(`${this.ordersUrl}/${orderId}`);
    }

    getByUserId(userId: string) {
        return this.http.get<{ message: string; data: OrderResponse[] }>(`${this.ordersUrl}/user/${userId}`).pipe(
            tap((response) => {
                const orders = response.data.map(item => item.order);
                this.ordersSubject.next(orders);
            })
        );
    }

    getEvidences(orderId: string) {
        return this.http.get<OrderEvidence[]>(`${this.ordersUrl}/${orderId}/evidences`);
    }

    getEvidenceImageUrl(evidenceId: string) {
        return `${this.ordersUrl}/evidences/${evidenceId}/image`;
    }

    getDeliveryModes() {
        return this.http.get<{ message: string; data: DeliveryMode[] }>(`${this.ordersUrl}/delivery-modes`);
    }

    add(data: CreateOrderRequest) {
        return this.http.post<{ orderId: string, message: string }>(`${this.ordersUrl}`, data);
    }

    update(data: Order) {
        return this.http.put<Order>(`${this.ordersUrl}/orders/${data.id}`, data);
    }

}
