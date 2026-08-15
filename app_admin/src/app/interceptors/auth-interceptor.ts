import {
  HttpInterceptorFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Authentication } from '../services/authentication';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authentication = inject(Authentication);
  const token = authentication.getToken();

  if (token) {
    const authenticatedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(authenticatedRequest);
  }

  return next(req);
};