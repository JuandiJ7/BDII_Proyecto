import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

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
  password = '';
  confirmar = '';

  nombre = '';
  apellido = '';
  departamento = '';
  circuito = '';
  direccionEstablecimiento = '';

  datosValidos = false;
  mensaje = '';
  exito = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  async verificarDatos() {
    const credencial = (this.serie + this.numero).toUpperCase();
    const cedula = this.ci.replace(/\D/g, '');

    try {
      const datos = await this.buscarDatos(credencial, cedula);
      if (datos) {
        this.nombre = datos.nombre;
        this.apellido = datos.apellido;
        this.departamento = datos.departamento;
        this.circuito = datos.circuito;
        this.direccionEstablecimiento = datos.direccion_establecimiento;

        const yaRegistrado = await this.verificarUsuarioExistente(credencial);
        if (yaRegistrado) {
          this.mensaje = 'Este usuario ya está registrado.';
          this.datosValidos = false;
          return;
        }

        this.datosValidos = true;
        this.mensaje = '';
      } else {
        this.mensaje = 'No se encontró ningún ciudadano con esa credencial y cédula.';
        this.datosValidos = false;
      }
    } catch (error) {
      console.error(error);
      this.mensaje = 'Error al verificar datos.';
    }
  }

  async buscarDatos(credencial: string, ci: string) {
    try {
      const res = await fetch(`http://localhost/back/usuarios/verificar?credencial=${credencial}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) return null;
      
      const datos = await res.json();
      // Verificar que la cédula coincida
      if (datos && datos.cedula === ci) {
        return datos;
      }
      return null;
    } catch (error) {
      console.error('Error al buscar datos:', error);
      return null;
    }
  }

  async verificarUsuarioExistente(credencial: string): Promise<boolean> {
    const res = await fetch(`http://localhost/back/usuarios/verificar/${credencial}`);
    return res.status === 200;
  }

  async registrarUsuario() {
    // Validar campos requeridos antes de enviar
    if (!this.serie || !this.numero || !this.ci || !this.password || !this.confirmar) {
      this.mensaje = 'Todos los campos son obligatorios.';
      return;
    }

    // Validar formato de serie (3 letras)
    if (!/^[A-Za-z]{3}$/.test(this.serie)) {
      this.mensaje = 'La serie debe tener exactamente 3 letras.';
      return;
    }

    // Validar formato del número de credencial (solo números, hasta 5 dígitos)
    if (!/^[0-9]{1,5}$/.test(this.numero)) {
      this.mensaje = 'El número de credencial debe tener solo números (hasta 5 dígitos).';
      return;
    }

    // Validar formato de cédula
    if (!/^[0-9]{6,8}$/.test(this.ci)) {
      this.mensaje = 'La cédula debe tener entre 6 y 8 dígitos sin puntos ni guiones.';
      return;
    }

    // Validar contraseñas
    if (this.password !== this.confirmar) {
      this.mensaje = 'Las contraseñas no coinciden.';
      return;
    }

    // Validar que la contraseña tenga 8 a 12 caracteres, una mayúscula y un número
    if (!/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/.test(this.password)) {
      this.mensaje = 'La contraseña debe tener entre 8 y 12 caracteres, incluir una mayúscula y un número.';
      return;
    }

    const credencial = this.serie.toUpperCase() + this.numero;

    try {
      const response = await fetch('http://localhost/back/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credencial, password: this.password })
      });
      
      if (response.status === 201) {
        this.exito = 'Usuario registrado correctamente.';
        
        // Hacer login automático
        const loginExitoso = await this.authService.login(credencial, this.password);
        
        if (loginExitoso) {
          setTimeout(() => {
            this.router.navigate(['/inicio']);
          }, 2000);
        } else {
          this.mensaje = 'Usuario registrado pero no se pudo iniciar sesión. Por favor, inicie sesión manualmente.';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }
      } else {
        const error = await response.json();
        this.mensaje = error?.message || 'Error al registrar el usuario.';
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      this.mensaje = 'No se pudo registrar. Verificá los datos o intenta más tarde.';
    }
  }

}