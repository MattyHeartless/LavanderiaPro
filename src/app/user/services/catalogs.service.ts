import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';

export interface Service {
    id?: string;
    name: string;
    description: string;
    price: number;
    uoM: string;
    icon: string;
    themeIcon: string;
    isActive?: boolean;
    quantity?: number;
}

export interface ServiceItem {
 
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  unit: string;
  quantity: number;
  uoM:string;
}

export interface PickupSchedule {
    date:string;
  datelabel: string;
  timeSlot: string;
}

export interface UserAddress {
  title: string;
  fullAddress: string;
}

@Injectable({
    providedIn: 'root'
})
export class CatalogsService {

    private readonly catalogsUrl = environment.catalogsApiUrl;
    private servicesSubject = new BehaviorSubject<Service[]>([]);

    public services$ = this.servicesSubject.asObservable();

    constructor(private http: HttpClient) {}

    getServices() {
        return this.http.get<Service[]>(`${this.catalogsUrl}/services`).pipe(
            tap((services) => {
                this.servicesSubject.next(services);
            })
        );
    }

}