import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const userSession = authService.getStoredUserSession();

  if (userSession) {
    return true;
  } else {
    console.warn('Acceso denegado: No se encontró sesión activa.');
    router.navigate(['/login']);
    return false;
  }
};
