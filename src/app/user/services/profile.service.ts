import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';

export interface Addresses {
    id?: string;
    title: string;
    userId: string;
    street: string;
    city: string;
    neighbourhood: string;
    state: string;
    zipCode: string;
    country: string;
    
}

@Injectable({
    providedIn: 'root'
})
export class ProfileService {

    private readonly profileUrl = environment.profileApiUrl;
    private addressesSubject = new BehaviorSubject<Addresses[]>([]);

    public addresses$ = this.addressesSubject.asObservable();

    constructor(private http: HttpClient) {}

    getAddress(userId: string) {
        return this.http.get<Addresses[]>(`${this.profileUrl}/addresses/${userId}`).pipe(
            tap((addresses) => {
                this.addressesSubject.next(addresses);
            })
        );
    }

    saveAddress(data: Addresses) {
        return this.http.post<{ message: string }>(`${this.profileUrl}/addresses`, data)
    }

    updateAddress(data: Addresses) {
        return this.http.put<Addresses>(`${this.profileUrl}/addresses/${data.id}`, data)
    }

    deleteAddress(addressId: string, userId: string) {
        return this.http.delete(`${this.profileUrl}/addresses/${addressId}/${userId}`)
    }

}