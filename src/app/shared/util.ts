import { Injectable, inject } from "@angular/core"; // Usamos inject para que sea más moderno
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Injectable({
  providedIn: 'root' // Esto hace que esté disponible en toda la app
})
export class UtilService {
  private router = inject(Router);
  private authService = inject(AuthService);

  logout(): void {
    this.authService.clearStoredUserSession();
    this.router.navigate(['/']);
  }
}
