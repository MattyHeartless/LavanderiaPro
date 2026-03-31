import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';

export interface ServicePricingOption {
  id: string;
  serviceId: string;
  optionName: string;
  price: number;
  uoM: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id?: string;
  name: string;
  description: string;
  price: number;
  uoM: string;
  icon: string;
  themeIcon: string;
  isActive?: boolean;
  pricingOptions: ServicePricingOption[];
}

export interface ServiceItem {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  unit: string;
  quantity: number;
  uoM: string;
  servicePricingOptionId?: string | null;
  pricingOptionName?: string | null;
  coloredClothQuantity?: number | null;
  blackClothQuantity?: number | null;
}

export interface ServicesResponse {
  services: Service[];
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
        return this.http.get<ServicesResponse>(`${this.catalogsUrl}/services`).pipe(
            tap((response) => {
                this.servicesSubject.next(response.services);
            })
        );
    }

    validatePricingOptionIsActive(optionId: string) {
        return this.http.get<{ isActive: boolean }>(`${this.catalogsUrl}/pricing-options/${optionId}/is-active`);
    }

}
