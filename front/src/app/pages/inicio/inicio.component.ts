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

  constructor(
    private router: Router,
    private authService: AuthService,
    private eleccionesService: EleccionesService,
    private dialog: MatDialog
  ) { }

  async ngOnInit(): Promise<void> {
    this.usuario = await this.authService.getUsuarioActual();
    console.log('Usuario en el componente de inicio:', this.usuario);
    if (!this.usuario) {
      // Si no hay usuario, redirigir al login
      this.router.navigate(['/auth/login']);
    }
  }

  async irAVotar(): Promise<void> {
    try {
      const habilitacion = await this.eleccionesService.verificarHabilitacion();
      if (!habilitacion.habilitado) {
        alert(habilitacion.mensaje);
        return;
      }
      this.router.navigate(['/votar']);
    } catch (error) {
      alert('Error al verificar habilitación. Intente nuevamente.');
    }
  }

  verResultados(): void {
    this.router.navigate(['/resultados']);
  }

  // Métodos para el rol ADMIN
  abrirEleccion(): void {
    if (confirm('¿Está seguro que desea ABRIR todas las mesas?')) {
      this.eleccionesService.abrirTodasLasMesas().then(res => {
        if (res.success) {
          alert(`✅ ${res.mensaje}\nCircuitos abiertos: ${res.circuitos_abiertos}`);
        } else {
          alert('❌ Error al abrir las mesas');
        }
      }).catch(error => {
        console.error('Error al abrir todas las mesas:', error);
        alert('❌ Error al abrir las mesas. Verifique su conexión.');
      });
    }
  }

  cerrarEleccion(): void {
    if (confirm('¿Está seguro que desea CERRAR todas las mesas?')) {
      this.eleccionesService.cerrarTodasLasMesas().then(res => {
        if (res.success) {
          alert(`✅ ${res.mensaje}\nCircuitos cerrados: ${res.circuitos_cerrados}`);
        } else {
          alert('❌ Error al cerrar las mesas');
        }
      }).catch(error => {
        console.error('Error al cerrar todas las mesas:', error);
        alert('❌ Error al cerrar las mesas. Verifique su conexión.');
      });
    }
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
      const resultado = await this.eleccionesService.abrirCircuito();
      if (resultado.success) {
        alert('Mesa abierta correctamente');
      } else {
        alert('Error al abrir la mesa: ' + resultado.mensaje);
      }
    } catch (error) {
      console.error('Error al abrir mesa:', error);
      alert('Error al abrir la mesa. Intente nuevamente.');
    }
  }

  async cerrarMesa(): Promise<void> {
    try {
      const resultado = await this.eleccionesService.cerrarCircuito();
      if (resultado.success) {
        alert('Mesa cerrada correctamente');
      } else {
        alert('Error al cerrar la mesa: ' + resultado.mensaje);
      }
    } catch (error) {
      console.error('Error al cerrar mesa:', error);
      alert('Error al cerrar la mesa. Intente nuevamente.');
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
