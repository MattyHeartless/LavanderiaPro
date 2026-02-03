
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest } from '../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [RouterLink,FormsModule],
   standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

     model: RegisterRequest = {
        email: '',
        password: '',
        fullName: '',
        phoneNumber: ''
    };
    loading = false;
    errorMessage = '';

   constructor(
    private authService: AuthService,
    private router: Router
  ) {}

   register() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.model).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: err => {
        this.errorMessage = err?.error?.message ?? 'Error al registrar usuario';
        this.loading = false;
      }
    });
  }
}
