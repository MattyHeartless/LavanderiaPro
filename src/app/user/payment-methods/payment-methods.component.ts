import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaymentMethod, ProfileService } from '../services/profile.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UtilService } from '../../shared/util';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-payment-methods',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './payment-methods.component.html',
  styleUrl: './payment-methods.component.css'
})
export class PaymentMethodsComponent {
   public user_session: any = null;
isMobileMenuOpen = false;
showpaymentForm: boolean = false;
newPaymentMethod: PaymentMethod = {
  id : 0,
  cardHolderName: '',
  cardNumber: '',
  expirationDate: '',
  cvv: '',
  userId: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
UserPaymentMethods: PaymentMethod[] = [];
showDeleteCardModal: boolean = false;
cardToDelete: any = null;
  constructor(private profileService: ProfileService, private authService: AuthService, public util: UtilService) {
 
   }
  ngOnInit() {
    this.loadUserData();
    this.getPaymentMethods()
  }

  togglePaymentForm(): void {
      this.showpaymentForm = !this.showpaymentForm;
    }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }


  
  loadUserData() {
    const data = this.authService.getStoredUserSession();
    
    if (data) {
      try {
        this.user_session = data;
        console.log('User session cargada:', this.user_session);
       
      } catch (error) {
        console.error('Error al recuperar la sesión del usuario', error);
      }
    }
  }

  resetForm(){
    this.showpaymentForm = false;
  }

  savePaymentMethod(): void {
    this.newPaymentMethod.userId = this.user_session.id;
    console.log('Guardando método de pago:', this.newPaymentMethod);
    this.profileService.savePaymentMethod(this.newPaymentMethod).subscribe({
      next: (response:any) => {
        console.log('Payment method saved successfully:', response);
        this.resetForm();
        this.getPaymentMethods();
      },
      error: (err:any) => {
        console.error('Error saving payment method:', err);
      }
    });


    
  }

  getPaymentMethods(): void {
    if (this.user_session?.id) {
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
  }

  getCardBrand(cardNumber: string): string {
  if (!cardNumber) return 'Tarjeta';
  
  if (cardNumber.startsWith('4')) {
    return 'Visa';
  } else if (cardNumber.startsWith('5')) {
    return 'Mastercard';
  }
  
  return 'Tarjeta'; // Genérico si no coincide
}

getLastFourDigits(cardNumber: string): string {
  if (!cardNumber) return '****';
  // Tomamos los últimos 4 caracteres
  return cardNumber.slice(-4);
}

  formatExpirationDate(event: any) {
  let input = event.target.value;
  
  // 1. Eliminar todo lo que no sea número
  let values = input.replace(/\D/g, '');
  
  // 2. Si tiene más de 2 números, insertar la diagonal
  if (values.length > 2) {
    values = values.substring(0, 2) + '/' + values.substring(2, 4);
  }
  
  // 3. Actualizar el modelo y el valor del input
  this.newPaymentMethod.expirationDate = values;
  event.target.value = values;
}




// Abre el modal y guarda la referencia de la tarjeta
openDeleteCardModal(card: any) {
  this.cardToDelete = card;
  this.showDeleteCardModal = true;
}

// Llama al servicio para eliminar
confirmDeleteCard() {
  if (this.cardToDelete) {

    this.profileService.deletePaymentMethod(this.cardToDelete.id, this.user_session.id).subscribe({
      next: () => {
        console.log('Tarjeta eliminada correctamente');

        this.getPaymentMethods(); 
        this.showDeleteCardModal = false;
        this.cardToDelete = null;
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
      }
    });
  }
}

scrollToForm() {

  this.resetForm(); 
this.togglePaymentForm()
  
  setTimeout(() => {
    const element = document.getElementById('payment-form');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'      
      });
    }
  }, 100);
}
}
