import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EleccionesService } from '../../services/elecciones.service';

@Component({
  selector: 'app-admin-padron',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Gestión de Padrón</h2>
    <button (click)="confirmarActualizarPadron()">Actualizar padrón</button>
    <p *ngIf="mensaje">{{ mensaje }}</p>
  `
})
export class AdminPadronComponent {
  mensaje = '';
  constructor(private eleccionesService: EleccionesService) {}

  async confirmarActualizarPadron() {
    if (confirm('¿Está seguro que desea actualizar el padrón? Se agregarán automáticamente todos los ciudadanos que correspondan.')) {
      try {
        const res = await this.eleccionesService.actualizarPadron();
        this.mensaje = res.mensaje;
      } catch (error) {
        this.mensaje = 'Error al actualizar el padrón';
      }
    }
  }
} 