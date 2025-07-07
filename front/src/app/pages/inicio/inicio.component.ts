import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { EleccionesService } from '../../services/elecciones.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AutoridadesModalComponent } from '../admin/autoridades-modal.component';
import { AvisoDialogComponent } from '../../components/aviso-dialog/aviso-dialog.component';
import Swal from 'sweetalert2';

type Usuario = {
  nombre: string;
  apellido: string;
  cedula: string;
  circuito: string;
  departamento: string;
  direccion_establecimiento: string;
  rol?: string;
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
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  usuario: Usuario | null = null;
  mensajePadron: string = '';
  cargandoPadron: boolean = false;
  circuitoFunc: Circuito | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private eleccionesService: EleccionesService,
    private dialog: MatDialog
  ) { }

  async ngOnInit(): Promise<void> {
  this.usuario = await this.authService.getUsuarioActual();
  console.log(this.usuario);

  if (!this.usuario) {
    this.router.navigate(['/auth/login']);
  } else if (this.usuario.rol === 'FUNCIONARIO') {
    try {
      this.circuitoFunc = await this.eleccionesService.obtenerCircuito();
      console.log('Circuito del funcionario:', this.circuitoFunc);
    } catch (error) {
      return
    }
  }
}

  async irAVotar(): Promise<void> {
    try {
      const habilitacion = await this.eleccionesService.verificarHabilitacion();

      if (!habilitacion.habilitado) {
        await Swal.fire({
          icon: 'warning',
          title: 'No habilitado',
          text: habilitacion.mensaje,
          confirmButtonText: 'OK'
        });
        return;
      }

      this.router.navigate(['/votar']);

    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al verificar habilitación. Intente nuevamente.',
        confirmButtonText: 'OK'
      });
    }
  }

  verResultados(): void {
    this.router.navigate(['/resultados']);
  }

  // Métodos para el rol ADMIN
  abrirEleccion(): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea ABRIR todas las mesas?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, abrir',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.eleccionesService.abrirTodasLasMesas().then(res => {
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Mesas abiertas',
              html: `✅ ${res.mensaje}<br>Circuitos abiertos: ${res.circuitos_abiertos}`,
              confirmButtonText: 'OK'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: '❌ Error al abrir las mesas',
              confirmButtonText: 'OK'
            });
          }
        }).catch(error => {
          console.error('Error al abrir todas las mesas:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: '❌ Error al abrir las mesas. Verifique su conexión.',
            confirmButtonText: 'OK'
          });
        });
      }
    });
  }

  cerrarEleccion(): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea CERRAR todas las mesas?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.eleccionesService.cerrarTodasLasMesas().then(res => {
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Mesas cerradas',
              html: `✅ ${res.mensaje}<br>Circuitos cerrados: ${res.circuitos_cerrados}`,
              confirmButtonText: 'OK'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: '❌ Error al cerrar las mesas',
              confirmButtonText: 'OK'
            });
          }
        }).catch(error => {
          console.error('Error al cerrar todas las mesas:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: '❌ Error al cerrar las mesas. Verifique su conexión.',
            confirmButtonText: 'OK'
          });
        });
      }
    });
  }

  crearEleccion(): void {
    this.router.navigate(['/admin/ciudadanos']);
  }

  editarEleccion(): void {
    this.router.navigate(['/admin/padron']);
  }

  editarCircuito(): void {
    this.dialog.open(AutoridadesModalComponent, {
      width: '600px',
      disableClose: false
    });
  }

  editarEstablecimiento(): void {
    this.router.navigate(['/admin/empleados']);
  }

  // Métodos para el rol FUNCIONARIO (Integrante de mesa)
  async abrirMesa(): Promise<void> {
    try {
      if (!this.circuitoFunc) {
        console.error('No hay circuitoFunc cargado');
        return;
      }

      const resultado = await this.eleccionesService.abrirCircuito(this.circuitoFunc.id);
      if (resultado.success) {
        Swal.fire({
          icon: 'success',
          title: 'Mesa abierta',
          text: resultado.mensaje,
          confirmButtonText: 'Aceptar'
        });
        this.ngOnInit();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: resultado.mensaje || 'No se pudo abrir la mesa.',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error: any) {
      console.error('Error al abrir mesa:', error);

      // Si el backend devuelve 403 o 404, mostrar mensaje claro:
      const backendMsg = error?.error?.error || error?.message || 'Error inesperado';
      Swal.fire({
        icon: 'error',
        title: 'No autorizado',
        text: backendMsg,
        confirmButtonText: 'Aceptar'
      });
    }
  }

  async cerrarMesa(): Promise<void> {
    try {
      if (!this.circuitoFunc) {
        console.error('No hay circuitoFunc cargado');
        return;
      }

      const resultado = await this.eleccionesService.cerrarCircuito(this.circuitoFunc.id);

      if (resultado.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Mesa cerrada',
          text: resultado.mensaje,
          confirmButtonText: 'OK'
        });
        window.location.reload();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: resultado.mensaje || 'No se pudo cerrar la mesa',
          confirmButtonText: 'OK'
        });
      }
    } catch (error: any) {
      console.error('Error al cerrar mesa:', error);

      const backendMsg = error?.error?.error || error?.message || 'Error inesperado';

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: backendMsg,
        confirmButtonText: 'OK'
      });
    }
  }

  validarVotante(): void {
    this.router.navigate(['/confirmar-circuito']);
  }

  async actualizarPadronDirecto(): Promise<void> {
    const dialogRef = this.dialog.open(AvisoDialogComponent, {
      data: { mensaje: '¿Está seguro que desea actualizar el padrón? Se agregarán automáticamente todos los ciudadanos que correspondan.' },
      disableClose: true
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (result !== true) return;
    this.cargandoPadron = true;
    this.mensajePadron = '';
    try {
      const res = await this.eleccionesService.actualizarPadron();
      this.mensajePadron = res.mensaje;
    } catch (error) {
      this.mensajePadron = 'Error al actualizar el padrón';
    } finally {
      this.cargandoPadron = false;
    }
  }

  gestionarPolicias(): void {
    this.router.navigate(['/admin/policias']);
  }
}
