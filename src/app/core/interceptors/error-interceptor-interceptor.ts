import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth-service';
import { esLogin, esPeticionApi } from './api-url';

export const errorInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401 && esPeticionApi(req.url) && !esLogin(req.url)
        && router.url.split(/[?#]/, 1)[0] !== '/login') {
      auth.cerrarSesion('expirada', router.url);
    }
    return throwError(() => error);
  }));
};
