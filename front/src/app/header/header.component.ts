import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FetchService } from '../services/fetch.service';
import { NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  loggeado: boolean | undefined

  constructor(public fetchService: FetchService, public authService: AuthService, public router: Router) {}

  async cerrarSesion() {
    const resultado = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se cerrará la sesión actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
    });

    if (resultado.isConfirmed) {
      this.authService.logout();
      localStorage.removeItem('usuario');
      localStorage.removeItem('observado');
      await this.router.navigate(['/auth/login']);
    }
  }
}
