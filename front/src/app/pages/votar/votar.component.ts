import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { EleccionesService } from '../../services/elecciones.service';
import { ListaDetallesComponent } from './lista-detalles/lista-detalles.component';
import { ConfirmarVotoComponent } from './confirmar-voto/confirmar-voto.component';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

interface Partido {
  id: number;
  nombre: string;
  presidente: {
    nombres: string;
    apellidos: string;
  } | null;
  vicepresidente: {
    nombres: string;
    apellidos: string;
  } | null;
}

interface Lista {
  id: number;
  numero: number;
  id_departamento: number;
  nombre_departamento: string;
  nombre_partido: string;
}

interface Papeleta {
  id: number;
  nombre: string;
  color: string;
  votado?: boolean;
}

@Component({
  selector: 'app-votar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    
  ],
  providers: [provideAnimations()],
  templateUrl: './votar.component.html',
  styleUrl: './votar.component.css'
})
export class VotarComponent implements OnInit {
  partidos: Partido[] = [];
  listas: Lista[] = [];
  papeletas: Papeleta[] = [];

  partidoSeleccionado: number | null = null;
  listaSeleccionada: number | null = null;
  listasFiltradas: Lista[] = [];
  votoEnBlanco = false;

  constructor(
    private router: Router,
    private eleccionesService: EleccionesService,
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  async ngOnInit(): Promise<void> {
    console.log('Iniciando componente de votación');
    const usuario = await this.authService.getUsuarioActual();
    if (!usuario) {
      console.error('Usuario no autenticado');
      this.router.navigate(['/auth/login']);
      return;
    }

    // Verificar si el votante está habilitado
    try {
      const habilitacion = await this.eleccionesService.verificarHabilitacion();
      console.log('Resultado verificación habilitación:', habilitacion);
      
      if (!habilitacion.habilitado) {
        alert(habilitacion.mensaje);
        this.router.navigate(['/inicio']);
        return;
      }
    } catch (error) {
      console.error('Error al verificar habilitación:', error);
      alert('Error al verificar habilitación. Intente nuevamente.');
      this.router.navigate(['/inicio']);
      return;
    }

    this.cargarPartidos();
    this.cargarPapeletas();
  }

  compareById = (a: any, b: any) => a && b && a.id === b.id;

  displayLista = (lista: any) => {
    return lista ? `Lista ${lista.numero}` : '';
  };


  async cargarPartidos(): Promise<void> {
    try {
      console.log('Intentando cargar partidos...');
      const response = await this.eleccionesService.getPartidos();
      console.log('Respuesta del servicio de partidos:', response);
      this.partidos = response || [];
      console.log('Partidos cargados:', this.partidos);
    } catch (error) {
      console.error('Error al cargar partidos:', error);
      if (error instanceof Error && error.message.includes('401')) {
        console.error('Error de autenticación. Token inválido o expirado.');
        this.router.navigate(['/auth/login']);
      } else {
        alert('Error al cargar los partidos');
      }
    }
  }

  async cargarPapeletas(): Promise<void> {
    try {
      console.log('Intentando cargar papeletas...');
      const response = await this.eleccionesService.getPapeletas();
      console.log('Respuesta del servicio de papeletas:', response);
      this.papeletas = response || [];
      console.log('Papeletas cargadas:', this.papeletas);
    } catch (error) {
      console.error('Error al cargar papeletas:', error);
      if (error instanceof Error && error.message.includes('401')) {
        console.error('Error de autenticación. Token inválido o expirado.');
        this.router.navigate(['/auth/login']);
      } else {
        alert('Error al cargar las papeletas');
      }
    }
  }

  onVotoEnBlancoChange(): void {
    if (this.votoEnBlanco) {
      // Si selecciona voto en blanco, limpiar selecciones
      this.partidoSeleccionado = null;
      this.listaSeleccionada = null;
      this.listas = [];
      this.listasFiltradas = [];
    }
  }

  async onPartidoChange(): Promise<void> {
    if (!this.partidoSeleccionado) return;

    // Si selecciona un partido, desmarcar voto en blanco
    this.votoEnBlanco = false;

    try {
      console.log('Partido seleccionado:', this.partidoSeleccionado);
      this.listaSeleccionada = null;
      console.log('Intentando cargar listas...');
      const response = await this.eleccionesService.getListas(this.partidoSeleccionado);
      console.log('Respuesta del servicio de listas:', response);
      this.listas = response || [];
      this.listasFiltradas = this.listas;
      console.log('Listas cargadas:', this.listas);
      
      if (this.listas.length === 0) {
        alert('No hay listas disponibles para este partido en tu departamento');
      }
    } catch (error) {
      console.error('Error al cargar listas:', error);
      if (error instanceof Error && error.message.includes('401')) {
        console.error('Error de autenticación. Token inválido o expirado.');
        this.router.navigate(['/auth/login']);
      } else {
        alert('Error al cargar las listas');
      }
    }
  }

  verDetallesLista(lista: Lista): void {
    console.log('Ver detalles de lista:', lista);
    this.dialog.open(ListaDetallesComponent, {
      width: '600px',
      data: { listaId: lista.id }
    });
  }

  togglePapeleta(papeleta: Papeleta): void {
    papeleta.votado = !papeleta.votado;
    console.log('Papeleta actualizada:', papeleta);
  }

  async confirmarVoto(): Promise<void> {
    // Validar que se haya seleccionado algo
    if (!this.votoEnBlanco && (!this.partidoSeleccionado || !this.listaSeleccionada)) {
      alert('Por favor seleccione un partido y una lista, o marque la opción de voto en blanco');
      return;
    }

    let partidoSeleccionado = this.partidos.find(p => p.id === this.partidoSeleccionado);
    let listaSeleccionada = this.listas.find(l => l.id === this.listaSeleccionada);

    // Si es voto en blanco, obtener la lista del partido 12
    if (this.votoEnBlanco) {
      try {
        console.log('Obteniendo lista de voto en blanco (partido 12)...');
        const listasVotoBlanco = await this.eleccionesService.getListas(12);
        console.log('Listas de voto en blanco:', listasVotoBlanco);
        
        if (listasVotoBlanco && listasVotoBlanco.length > 0) {
          listaSeleccionada = listasVotoBlanco[0]; // Tomar la primera lista del departamento
          partidoSeleccionado = { id: 12, nombre: 'Voto en Blanco', presidente: null, vicepresidente: null };
        } else {
          alert('Error: No se encontró la lista de voto en blanco');
          return;
        }
      } catch (error) {
        console.error('Error al obtener lista de voto en blanco:', error);
        alert('Error al obtener la lista de voto en blanco');
        return;
      }
    }

    const papeletasSeleccionadas = this.papeletas.filter(p => p.votado);

    const votoData = {
      partido: partidoSeleccionado,
      lista: listaSeleccionada,
      papeletas: papeletasSeleccionadas,
      esVotoEnBlanco: this.votoEnBlanco
    };

    // Abrir modal de confirmación
    const dialogRef = this.dialog.open(ConfirmarVotoComponent, {
      width: '600px',
      data: votoData,
      disableClose: true
    });

    // Manejar resultado del modal
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        Swal.fire({
          icon: 'success',
          title: '¡Voto registrado!',
          text: 'Tu voto se registró correctamente.',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(['/inicio']);
        });
      }
    });
  }
}
