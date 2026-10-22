import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth-service';

export const authGuardGuard: CanActivateFn = (route, state) => {
  if (inject(AuthService).token()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const invitadoGuard: CanActivateFn = () =>
  inject(AuthService).token() ? inject(Router).createUrlTree(['/inicio']) : true;
