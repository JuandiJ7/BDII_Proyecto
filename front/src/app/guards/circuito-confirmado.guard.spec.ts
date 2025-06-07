import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class CircuitoConfirmadoGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const confirmado = localStorage.getItem('observado');
    if (confirmado === null) {
      // No pasó por la confirmación
      return this.router.parseUrl('/confirmar-circuito');
    }
    return true;
  }
}
