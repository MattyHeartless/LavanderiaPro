import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginRequest, LoginResponse } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../shared/notification.service';
import { environment } from '../../environments/environment';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize: (configuration: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

@Component({
  selector: 'app-login',
  imports: [RouterLink,FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit {
      @ViewChild('googleSignInButton') googleSignInButton?: ElementRef<HTMLDivElement>;

      showPassword = false;
      rememberUser = false;
      googleLoading = false;
      readonly googleClientId = environment.googleClientId;
   
model: LoginRequest = {
        email: '',
        password: ''
    };

       loading = false;
    errorMessage = '';

   constructor(
    private authService: AuthService,
    private router: Router,
    private notifications: NotificationService,
    private zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    if (!this.googleClientId || !this.googleSignInButton) {
      return;
    }

    this.loadGoogleIdentityService()
      .then(() => {
        window.google?.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: (response) => this.zone.run(() => this.loginWithGoogle(response))
        });
        window.google?.accounts.id.renderButton(this.googleSignInButton!.nativeElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 440
        });
      })
      .catch(() => {
        this.errorMessage = 'No fue posible cargar el inicio de sesión con Google.';
      });
  }

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

  private loginWithGoogle(response: GoogleCredentialResponse): void {
    if (!response.credential) {
      this.errorMessage = 'Google no proporcionó una credencial válida.';
      return;
    }

    this.googleLoading = true;
    this.errorMessage = '';
    this.authService.loginWithGoogle({ credential: response.credential }).subscribe({
      next: (loginResponse) => {
        this.authService.setStoredUserSession(loginResponse, this.rememberUser);
        this.notifications.success('Sesión iniciada con Google. Bienvenido.');
        this.router.navigate(['/new-recollection']);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'No fue posible iniciar sesión con Google.';
        this.notifications.error(error, this.errorMessage);
        this.googleLoading = false;
      }
    });
  }

  private loadGoogleIdentityService(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.getElementById('google-identity-services');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }



togglePassword() {
  this.showPassword = !this.showPassword;
}
}
