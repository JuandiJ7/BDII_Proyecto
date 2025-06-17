import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { EleccionesService } from '../../services/elecciones.service';
import { ListaDetallesComponent } from './lista-detalles/lista-detalles.component';
import { AuthService } from '../../services/auth.service';

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
    MatDialogModule
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
    this.cargarPartidos();
    this.cargarPapeletas();
  }

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

  async onPartidoChange(): Promise<void> {
    if (!this.partidoSeleccionado) return;

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

  async enviarVoto(): Promise<void> {
    if (!this.partidoSeleccionado || !this.listaSeleccionada) {
      alert('Por favor seleccione un partido y una lista');
      return;
    }

    try {
      console.log('Enviando voto:', {
        partidoId: this.partidoSeleccionado,
        listaId: this.listaSeleccionada,
        papeletas: this.papeletas.filter(p => p.votado)
      });

      await this.eleccionesService.enviarVoto({
        partidoId: this.partidoSeleccionado,
        listaId: this.listaSeleccionada,
        papeletas: this.papeletas.filter(p => p.votado)
      });

      alert('Voto registrado correctamente');
      this.router.navigate(['/inicio']);
    } catch (error) {
      console.error('Error al enviar voto:', error);
      if (error instanceof Error && error.message.includes('401')) {
        console.error('Error de autenticación. Token inválido o expirado.');
        this.router.navigate(['/auth/login']);
      } else {
        alert('Error al registrar el voto');
      }
    }
  }
}
