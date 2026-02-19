import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Intentamos obtener el objeto de sesión
  const userSession = localStorage.getItem('user_session');

  if (userSession) {
    // Si el objeto existe, el usuario está autenticado
    return true;
  } else {
    // Si no existe, lo redirigimos al login
    console.warn('Acceso denegado: No se encontró sesión activa.');
    router.navigate(['/login']);
    return false;
  }
};