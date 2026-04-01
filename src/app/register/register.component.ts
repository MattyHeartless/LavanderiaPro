
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
    readonly minPasswordLength = 10;
    showPassword = false;

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

  get passwordChecks() {
    const password = this.model.password ?? '';

    return [
      {
        label: `Mínimo ${this.minPasswordLength} caracteres`,
        passed: password.length >= this.minPasswordLength
      },
      {
        label: 'Al menos una mayúscula',
        passed: /[A-Z]/.test(password)
      },
      {
        label: 'Al menos una minúscula',
        passed: /[a-z]/.test(password)
      },
      {
        label: 'Al menos un número',
        passed: /\d/.test(password)
      },
      {
        label: 'Al menos un caracter especial',
        passed: /[^A-Za-z0-9]/.test(password)
      }
    ];
  }

  get isPasswordValid() {
    return this.passwordChecks.every((rule) => rule.passed);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

   register() {
    if (!this.isPasswordValid) {
      this.errorMessage = 'La contraseña no cumple con los requisitos mínimos.';
      return;
    }

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
