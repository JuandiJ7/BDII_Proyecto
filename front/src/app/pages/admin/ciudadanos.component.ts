import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EleccionesService } from '../../services/elecciones.service';

@Component({
  selector: 'app-admin-ciudadanos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ciudadanos-container">
      <h2>Gestión de Ciudadanos</h2>
      <form #f="ngForm" (ngSubmit)="agregarCiudadano()" class="ciudadano-form">
        <div class="form-row">
          <label for="credencial">Credencial:</label>
          <input id="credencial" name="credencial" [(ngModel)]="credencial" required autocomplete="off" (input)="onCredencialInput($event)">
        </div>
        <div class="form-row">
          <label for="nombres">Nombres:</label>
          <input id="nombres" name="nombres" [(ngModel)]="nombres" required autocomplete="off">
        </div>
        <div class="form-row">
          <label for="apellido1">Apellido 1:</label>
          <input id="apellido1" name="apellido1" [(ngModel)]="apellido1" required autocomplete="off">
        </div>
        <div class="form-row">
          <label for="apellido2">Apellido 2:</label>
          <input id="apellido2" name="apellido2" [(ngModel)]="apellido2" autocomplete="off">
        </div>
        <div class="form-row">
          <label for="cedula">Cédula:</label>
          <input id="cedula" name="cedula" [(ngModel)]="cedula" required autocomplete="off">
        </div>
        <div class="form-row">
          <label for="fecha_nac">Fecha de nacimiento:</label>
          <input id="fecha_nac" name="fecha_nac" type="date" [(ngModel)]="fecha_nac" required>
        </div>
        <div class="form-row">
          <label for="direccion">Dirección:</label>
          <input id="direccion" name="direccion" [(ngModel)]="direccion" required autocomplete="off">
        </div>
        <div class="form-actions">
          <button type="submit" [disabled]="f.invalid">Agregar ciudadano</button>
        </div>
      </form>
      <div *ngIf="mensaje" class="mensaje-feedback">{{ mensaje }}</div>
    </div>
  `,
  styleUrls: ['./ciudadanos.component.css']
})
export class AdminCiudadanosComponent {
  credencial = '';
  nombres = '';
  apellido1 = '';
  apellido2 = '';
  cedula = '';
  fecha_nac = '';
  direccion = '';
  mensaje = '';

  constructor(private eleccionesService: EleccionesService) {}

  async agregarCiudadano() {
    try {
      const res = await this.eleccionesService.crearCiudadano({
        credencial: this.credencial,
        nombres: this.nombres,
        apellido1: this.apellido1,
        apellido2: this.apellido2,
        cedula: this.cedula,
        fecha_nac: this.fecha_nac,
        direccion: this.direccion
      });
      this.mensaje = res.mensaje || 'Ciudadano agregado correctamente';
      this.credencial = this.nombres = this.apellido1 = this.apellido2 = this.cedula = this.fecha_nac = this.direccion = '';
    } catch (error: any) {
      this.mensaje = error?.mensaje || 'Error al agregar ciudadano';
    }
  }

  onCredencialInput(event: any) {
    if (this.credencial.length > 0) {
      // Forzar los primeros 3 caracteres a mayúscula
      const letras = this.credencial.substring(0, 3).toUpperCase();
      const numeros = this.credencial.substring(3);
      this.credencial = letras + numeros;
    }
  }
} 