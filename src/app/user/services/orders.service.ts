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
}

export interface Order {
    id?: string;
    userId: string;
    userAddressId: number;
    shippingAddress: ShippingAddress;
    userPaymentMethodId: number;
    pickupDate: string;
    pickupTime: string;
    isPostPayment: boolean;
    postPaymentMethod: string;
    status: number;
    totalAmount: number;
    deliveryFee: number;
    courierGuid: number;
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
}

export interface OrderResponse {
  message: string;
  order: Order;
  orderDetails: OrderDetail[];
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

    add(data: any) {
        return this.http.post<{ orderId: string, message: string }>(`${this.ordersUrl}`, data);
    }

    update(data: Order) {
        return this.http.put<Order>(`${this.ordersUrl}/orders/${data.id}`, data);
    }

}