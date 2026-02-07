import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Addresses, PaymentMethod, ProfileService } from '../services/profile.service';
import { CatalogsService, Service } from '../services/catalogs.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-recollection',
  imports: [RouterLink, CommonModule],
  templateUrl: './new-recollection.component.html',
  styleUrl: './new-recollection.component.css'
})
export class NewRecollectionComponent {
public user_session: any = null;
UserAddresses : Addresses[] = [];
UserPaymentMethods: PaymentMethod[] = [];
Services: Service[] = [];
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
}
