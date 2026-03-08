import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import Swal from 'sweetalert2';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    Swal.fire({ icon: 'warning', title: 'Acceso requerido', text: 'Debes iniciar sesión para reportar un caso' });
    router.navigate(['/seguimiento']);
    return false;
  }
};
