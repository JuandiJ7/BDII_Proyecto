import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { EleccionesService } from '../services/elecciones.service';

@Injectable({
  providedIn: 'root'
})
export class HabilitacionGuard implements CanActivate {
  
  constructor(
    private eleccionesService: EleccionesService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      console.log('Guard: Verificando habilitación del votante...');
      
      const habilitacion = await this.eleccionesService.verificarHabilitacion();
      console.log('Guard: Resultado verificación:', habilitacion);
      
      if (!habilitacion.habilitado) {
        console.log('Guard: Votante no habilitado, redirigiendo...');
        alert(habilitacion.mensaje);
        this.router.navigate(['/inicio']);
        return false;
      }
      
      console.log('Guard: Votante habilitado, permitiendo acceso...');
      return true;
      
    } catch (error) {
      console.error('Guard: Error al verificar habilitación:', error);
      alert('Error al verificar habilitación. Intente nuevamente.');
      this.router.navigate(['/inicio']);
      return false;
    }
  }
} 