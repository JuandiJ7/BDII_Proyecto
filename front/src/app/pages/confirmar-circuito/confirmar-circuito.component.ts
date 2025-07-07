import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EleccionesService } from '../../services/elecciones.service';

interface Usuario {
  nombre: string;
  apellido: string;
  circuito: string;
  departamento: string;
  direccion_establecimiento: string;
  rol?: string;
}

interface Votante {
  nombre: string;
  apellido: string;
  cedula: string;
  credencial: string;
  circuito: string;
}

type Circuito = {
  id: number;
  numero: string;
  circuito_cerrado: boolean;
  departamento: string;
  establecimiento: string;
  presidente: string;
  secretario: string;
  vocal: string;
};

@Component({
  selector: 'app-confirmar-circuito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmar-circuito.component.html',
  styleUrls: ['./confirmar-circuito.component.css']
})
export class ConfirmarCircuitoComponent implements OnInit {
  // Datos del funcionario
  nombre: string = '';
  apellido: string = '';
  circuito: string = '';
  departamento: string = '';
  direccion_establecimiento: string = '';
  rol: string = '';
  circuitoFunc: Circuito | null = null;

  // Datos del votante a validar
  credencialVotante: string = '';
  votanteEncontrado: Votante | null = null;
  esObservado: boolean = false;
  mensaje: string = '';
  exito: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private eleccionesService: EleccionesService,
  ) { }

  async ngOnInit(): Promise<void> {
    const usuario = await this.authService.getUsuarioActual();
    if (usuario) {
      this.nombre = usuario.nombre;
      this.apellido = usuario.apellido;
      this.circuito = usuario.circuito;
      this.departamento = usuario.departamento;
      this.direccion_establecimiento = usuario.direccion_establecimiento;
      this.rol = usuario.rol || '';

      // Si no es funcionario, redirigir
      if (this.rol !== 'FUNCIONARIO') {
        this.router.navigate(['/inicio']);
      } else {
            try {
          this.circuitoFunc = await this.eleccionesService.obtenerCircuito();
          console.log('Circuito del funcionario:', this.circuitoFunc);
        } catch (error) {
          return
        }
      }
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  async buscarVotante(): Promise<void> {
    if (!this.credencialVotante.trim()) {
      this.mensaje = 'Por favor ingrese la credencial del votante';
      return;
    }

    try {
      const response = await fetch(`http://localhost/back/usuarios/verificar?credencial=${this.credencialVotante}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const datos = await response.json();
        this.votanteEncontrado = {
          nombre: datos.nombre,
          apellido: datos.apellido,
          cedula: datos.cedula,
          credencial: this.credencialVotante,
          circuito: datos.circuito
        };
        this.esObservado = datos.circuito !== this.circuitoFunc?.numero;
        this.mensaje = '';
      } else {
        this.votanteEncontrado = null;
        this.mensaje = 'Votante no encontrado';
      }
    } catch (error) {
      console.error('Error al buscar votante:', error);
      this.mensaje = 'Error al buscar votante';
      this.votanteEncontrado = null;
    }
  }

  async validarVotante(): Promise<void> {
    if (!this.votanteEncontrado) {
      this.mensaje = 'Debe buscar un votante primero';
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost/back/usuarios/validar-votante', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ credencialVotante: this.credencialVotante, id_circuito_funcionario: this.circuitoFunc?.id })
      });

      const resultado = await response.json();

      if (response.ok) {
        this.exito = resultado.mensaje;
        this.mensaje = '';
        
        // Limpiar formulario después de 3 segundos
        setTimeout(() => {
          this.credencialVotante = '';
          this.votanteEncontrado = null;
          this.exito = '';
          this.mensaje = '';
        }, 3000);
      } else {
        this.mensaje = resultado.message || 'Error al validar votante';
        this.exito = '';
      }
    } catch (error) {
      console.error('Error al validar votante:', error);
      this.mensaje = 'Error al validar votante';
      this.exito = '';
    }
  }

  volverInicio(): void {
    this.router.navigate(['/inicio']);
  }
}