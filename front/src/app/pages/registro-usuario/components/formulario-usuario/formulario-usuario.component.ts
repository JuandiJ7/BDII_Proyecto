import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-formulario-usuario',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './formulario-usuario.component.html',
  styleUrl: './formulario-usuario.component.css',
})
export class FormularioUsuarioComponent {
  serie = '';
  numero = '';
  ci = '';
  email = '';
  password = '';
  confirmar = '';

  nombre = '';
  apellido = '';
  departamento = '';
  circuito = '';

  datosValidos = false;
  mensaje = '';

  async verificarDatos() {
    const credencial = (this.serie + this.numero).toUpperCase();
    const cedula = this.ci.replace(/\D/g, '');

    if (credencial.length === 8 && /^\d{6,8}$/.test(cedula)) {
      const datos = await this.buscarDatos(credencial, cedula);
      if (datos) {
        this.nombre = datos.nombre;
        this.apellido = datos.apellido;
        this.departamento = datos.departamento;
        this.circuito = datos.circuito;
        this.datosValidos = true;
      } else {
        this.mensaje = 'No se encontró coincidencia con esa credencial.';
        this.datosValidos = false;
      }
    }
  }

  async buscarDatos(credencial: string, ci: string) {
    try {
      const response = await fetch('http://localhost/back/usuarios/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credencial, cedula: ci })
      });

      if (!response.ok) {
        throw new Error('No encontrado');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error al buscar datos:', err);
      return null;
    }
  }

  registrarUsuario() {
    if (!/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/.test(this.password)) {
      this.mensaje = 'La contraseña debe tener entre 8 y 12 caracteres, incluir una mayúscula y un número.';
      return;
    }

    if (this.password !== this.confirmar) {
      this.mensaje = 'Las contraseñas no coinciden.';
      return;
    }

    // TODO: hacer POST al backend
    this.mensaje = 'Usuario registrado correctamente (simulado).';
  }
}