import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirmar-circuito',
  templateUrl: './confirmar-circuito.component.html',
  styleUrls: ['./confirmar-circuito.component.css'],
  imports: [FormsModule],
  standalone: true
})
export class ConfirmarCircuitoComponent {
  nombre: string = '';
  apellido: string = '';
  circuitoAsignado: number = 0;
  circuitoIngresado: number = 0;

  constructor(private router: Router, private authService: AuthService) {
    this.cargarDatosUsuario();
  }

  async cargarDatosUsuario() {
    const usuario = await this.authService.getUsuarioActual();
    if (usuario) {
      console.log(usuario)
      this.nombre = usuario.nombre || usuario.nombres;
      this.apellido = usuario.apellido || usuario.apellido1 + ' ' + (usuario.apellido2 || '');
      this.circuitoAsignado = +usuario.circuito;
    }
  }

  confirmarCircuito() {
    const observado = this.circuitoIngresado !== this.circuitoAsignado;
    localStorage.setItem('observado', observado.toString());

    if (observado) {
      Swal.fire({
        icon: 'warning',
        title: 'Circuito incorrecto',
        text: 'Estás votando en un circuito que no te corresponde. Tu voto será observado.',
        confirmButtonText: 'Continuar',
      }).then(() => {
        this.router.navigate(['/votar']);
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Circuito confirmado',
        text: 'Podés continuar con la votación.',
        confirmButtonText: 'Continuar',
      }).then(() => {
        this.router.navigate(['/votar']);
      });
    }
  }
}