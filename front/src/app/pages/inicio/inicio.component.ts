import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

type Usuario = {
  nombre: string;
  apellido: string;
  cedula: string;
  circuito: string;
  departamento: string;
  direccion_establecimiento: string;
  rol?: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  usuario: Usuario | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  async ngOnInit(): Promise<void> {
    this.usuario = await this.authService.getUsuarioActual();
    console.log('Usuario en el componente de inicio:', this.usuario);
    if (!this.usuario) {
      // Si no hay usuario, redirigir al login
      this.router.navigate(['/auth/login']);
    }
  }

  irAVotar(): void {
    this.router.navigate(['/votar']);
  }

  verResultados(): void {
    this.router.navigate(['/resultados']);
  }

  // Métodos para el rol ADMIN
  abrirEleccion(): void {
    console.log('Abrir elección');
    // Lógica para abrir elección
  }

  cerrarEleccion(): void {
    console.log('Cerrar elección');
    // Lógica para cerrar elección
  }

  crearEleccion(): void {
    console.log('Crear elección');
    // Lógica para crear elección
  }

  editarEleccion(): void {
    console.log('Editar elección');
    // Lógica para editar elección
  }

  editarCircuito(): void {
    console.log('Editar circuito');
    // Lógica para editar circuito
  }

  editarEstablecimiento(): void {
    console.log('Editar establecimiento');
    // Lógica para editar establecimiento
  }

  // Métodos para el rol FUNCIONARIO (Integrante de mesa)
  cerrarMesa(): void {
    console.log('Cerrar mesa');
    // Lógica para cerrar mesa
  }
}
