import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Addresses, ProfileService } from '../services/profile.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-address',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './address.component.html',
  styleUrl: './address.component.css'
})
export class AddressComponent {
  newAddressData: Addresses = {
    title: '',
    userId: '',
    street: '',
    city: '',
    neighbourhood: '',
    state: 'Jalisco',
    zipCode: '',
    country: 'MX'
  };
  showaddressform: boolean = false;
  public user_session: any = null;
  addresses : Addresses[] = [];
  isEditing: boolean = false;
  addressToEdit: Addresses | null = null;

 constructor(private profileService: ProfileService) {

  }
  ngOnInit() {
    this.loadUserData();
    this.loadAddresses();
  }

  toggleAddressForm(): void {
    this.showaddressform = !this.showaddressform;
  }

  

 

  loadAddresses(): void {
    const userId = this.user_session.id; // Get userId from auth service or route params
    console.log('Loading addresses for userId:', userId);
    this.profileService.getAddress(userId).subscribe({
      next: (data:any) => {
        this.addresses = data.addresses;
        console.log('Addresses loaded:', this.addresses);
      },
      error: err => {
        console.error('Error loading addresses:', err);
      }
    });
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


  saveAddress(): void {
    if(this.isEditing){
        this.profileService.updateAddress(this.newAddressData).subscribe({
      next: () => {
        this.loadAddresses(); // Refrescar lista
        this.resetForm();
      }
    });
    }else{
    this.newAddressData.userId = this.user_session.id;
        this.profileService.saveAddress(this.newAddressData).subscribe({
          next: (response) => {
            console.log('Address saved successfully:', response);
            this.loadAddresses();
            this.showaddressform = false;
          },
          error: (err) => {
            console.error('Error saving address:', err);
          }
        });
    }
    
  }

  loadAddressData(address: Addresses){
    this.isEditing = true;
    this.newAddressData = { ...address }; 
  // Mostramos el formulario (usando tu función existente)
  this.showaddressform = true;
    console.log('Address to edit:', this.newAddressData);
  }

  resetForm(){
    this.isEditing = false;
  this.newAddressData = { // O los valores por defecto
    title: '',
    userId: '',
    street: '',
    city: '',
    neighbourhood: '',
    state: 'Jalisco',
    zipCode: '',
    country: 'MX'
  };
  this.showaddressform = false;
  }
}
