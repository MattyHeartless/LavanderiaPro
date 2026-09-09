import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginRequest, LoginResponse } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../shared/notification.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink,FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
      showPassword = false;
      rememberUser = false;
   
model: LoginRequest = {
        email: '',
        password: ''
    };

       loading = false;
    errorMessage = '';

   constructor(
    private authService: AuthService,
    private router: Router,
    private notifications: NotificationService
  ) {}

    login(){
        this.loading = true;
      this.errorMessage = '';

      this.authService.login(this.model).subscribe({
        next: (response: LoginResponse) => {
          this.authService.setStoredUserSession(response, this.rememberUser);
          this.notifications.success('Sesión iniciada. Bienvenido de nuevo.');
          this.router.navigate(['/new-recollection']);
        },
        error: (error) => {
          this.errorMessage = 'Error al iniciar sesión. Por favor, inténtalo de nuevo. ' + error.error.message;
          this.notifications.error(error, 'No fue posible iniciar sesión. Verifica tus datos.');
          this.loading = false;
        }
    });
    }



togglePassword() {
  this.showPassword = !this.showPassword;
}
}
