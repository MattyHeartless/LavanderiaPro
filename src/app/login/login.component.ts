import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginRequest, LoginResponse } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
    private router: Router
  ) {}

    login(){
        this.loading = true;
      this.errorMessage = '';

      this.authService.login(this.model).subscribe({
        next: (response: LoginResponse) => {
          this.authService.setStoredUserSession(response, this.rememberUser);
          this.router.navigate(['/profile']);
        },
        error: (error) => {
          this.errorMessage = 'Error al iniciar sesión. Por favor, inténtalo de nuevo. ' + error.error.message;
          this.loading = false;
        }
    });
    }



togglePassword() {
  this.showPassword = !this.showPassword;
}
}
