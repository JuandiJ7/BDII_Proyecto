import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Usuario {
  nombre: string;
  apellido: string;
  circuito: string;
  departamento: string;
  direccion_establecimiento: string;
  rol?: string;
}

@Component({
  selector: 'app-confirmar-circuito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmar-circuito.component.html',
  styleUrls: ['./confirmar-circuito.component.css']
})
export class ConfirmarCircuitoComponent implements OnInit {
  nombre: string = '';
  apellido: string = '';
  circuito: string = '';
  departamento: string = '';
  direccion_establecimiento: string = '';
  circuitoIngresado: number = 0;
  circuitoAsignado: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  async ngOnInit(): Promise<void> {
    const usuario = await this.authService.getUsuarioActual();
    if (usuario) {
      this.nombre = usuario.nombre;
      this.apellido = usuario.apellido;
      this.circuito = usuario.circuito;
      this.departamento = usuario.departamento;
      this.direccion_establecimiento = usuario.direccion_establecimiento;
    }
    this.circuitoAsignado = 'Circuito 1'; // Temporal, reemplazar con el valor real
  }

  confirmarCircuito(): void {
    const observado = this.circuitoIngresado !== parseInt(this.circuito);
    localStorage.setItem('observado', observado.toString());
    this.router.navigate(['/votar']);
  }
}