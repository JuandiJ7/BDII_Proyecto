import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { EleccionesService } from '../../services/elecciones.service';

interface Usuario {
  nombre: string;
  apellido: string;
  cedula: string;
  circuito: string;
  departamento: string;
  direccion_establecimiento: string;
  rol?: string;
}

interface ResultadoLista {
  id_lista: number;
  numero_lista: number;
  nombre_partido: string;
  nombre_departamento: string;
  votos: number;
  porcentaje: number;
}

interface ResultadoPartido {
  id_partido: number;
  nombre_partido: string;
  presidente: string;
  votos: number;
  porcentaje: number;
}

interface ResultadoPapeleta {
  id_papeleta: number;
  nombre_papeleta: string;
  votos_favor: number;
  votos_contra: number;
  porcentaje_favor: number;
  porcentaje_contra: number;
}

interface Estadisticas {
  total_habilitados: number;
  total_votaron: number;
  total_observados: number;
}

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatProgressBarModule,
    MatTabsModule,
    MatIconModule
  ],
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.css']
})
export class ResultadosComponent implements OnInit {
  usuario: Usuario | null = null;
  loading = false;
  error = '';

  // Para funcionarios
  infoCircuito: any = null;
  resultadosListas: ResultadoLista[] = [];
  resultadosPartidos: ResultadoPartido[] = [];
  resultadosPapeletas: ResultadoPapeleta[] = [];

  // Para admin
  circuitos: any[] = [];
  departamentos: any[] = [];
  circuitoSeleccionado: number | null = null;
  departamentoSeleccionado: number | null = null;
  vistaSeleccionada: 'circuito' | 'departamento' | 'generales' = 'generales';
  
  // Resultados del admin
  resultadosAdmin: any = null;

  // Columnas para las tablas
  displayedColumnsListas = ['numero', 'partido', 'departamento', 'votos', 'porcentaje'];
  displayedColumnsPartidos = ['partido', 'presidente', 'votos', 'porcentaje'];
  displayedColumnsPapeletas = ['papeleta', 'favor', 'contra', 'porcentaje_favor', 'porcentaje_contra'];

  circuitoFiltro: string = '';

  constructor(
    private authService: AuthService,
    private eleccionesService: EleccionesService
  ) { }

  async ngOnInit(): Promise<void> {
    this.usuario = await this.authService.getUsuarioActual();
    if (!this.usuario) {
      this.error = 'Usuario no autenticado';
      return;
    }

    if (this.usuario.rol === 'FUNCIONARIO') {
      await this.cargarResultadosFuncionario();
    } else if (this.usuario.rol === 'ADMIN') {
      await this.cargarDatosAdmin();
    } else {
      this.error = 'No tienes permisos para ver resultados';
    }
  }

  async cargarResultadosFuncionario(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      // Cargar información del circuito
      this.infoCircuito = await this.eleccionesService.getInfoCircuito();
      
      // Cargar resultados por lista
      this.resultadosListas = await this.eleccionesService.getResultadosListasCircuito();
      
      // Cargar resultados por partido
      this.resultadosPartidos = await this.eleccionesService.getResultadosPartidosCircuito();
      
      // Cargar resultados de papeletas
      this.resultadosPapeletas = await this.eleccionesService.getResultadosPapeletasCircuito();

    } catch (error) {
      console.error('Error al cargar resultados:', error);
      this.error = 'Error al cargar los resultados';
    } finally {
      this.loading = false;
    }
  }

  async cargarDatosAdmin(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      // Cargar listas de circuitos y departamentos
      this.circuitos = await this.eleccionesService.getCircuitosAdmin();
      this.departamentos = await this.eleccionesService.getDepartamentosAdmin();
      
      // Cargar resultados generales por defecto
      await this.cargarResultadosGenerales();

    } catch (error) {
      console.error('Error al cargar datos admin:', error);
      this.error = 'Error al cargar los datos';
    } finally {
      this.loading = false;
    }
  }

  async cargarResultadosGenerales(): Promise<void> {
    // Limpiar selección de circuito, departamento y filtro
    this.circuitoSeleccionado = null;
    this.departamentoSeleccionado = null;
    this.circuitoFiltro = '';
    this.loading = true;
    this.error = '';

    try {
      this.resultadosAdmin = await this.eleccionesService.getResultadosGeneralesAdmin();
      this.vistaSeleccionada = 'generales';
    } catch (error) {
      console.error('Error al cargar resultados generales:', error);
      this.error = 'Error al cargar los resultados generales';
    } finally {
      this.loading = false;
    }
  }

  async cargarResultadosCircuito(): Promise<void> {
    if (!this.circuitoSeleccionado) return;

    // Limpiar selección de departamento y filtro
    this.departamentoSeleccionado = null;
    this.circuitoFiltro = '';

    this.loading = true;
    this.error = '';

    try {
      this.resultadosAdmin = await this.eleccionesService.getResultadosCircuitoAdmin(this.circuitoSeleccionado);
      this.vistaSeleccionada = 'circuito';
    } catch (error) {
      console.error('Error al cargar resultados del circuito:', error);
      this.error = 'Error al cargar los resultados del circuito';
    } finally {
      this.loading = false;
    }
  }

  async cargarResultadosDepartamento(): Promise<void> {
    if (!this.departamentoSeleccionado) return;

    // Limpiar selección de circuito y filtro
    this.circuitoSeleccionado = null;
    this.circuitoFiltro = '';

    this.loading = true;
    this.error = '';

    try {
      this.resultadosAdmin = await this.eleccionesService.getResultadosDepartamentoAdmin(this.departamentoSeleccionado);
      this.vistaSeleccionada = 'departamento';
    } catch (error) {
      console.error('Error al cargar resultados del departamento:', error);
      this.error = 'Error al cargar los resultados del departamento';
    } finally {
      this.loading = false;
    }
  }

  // Métodos auxiliares para formatear datos
  formatearPorcentaje(porcentaje: any): string {
    const num = Number(porcentaje);
    if (isNaN(num) || porcentaje === null || porcentaje === undefined) {
      return '0.00%';
    }
    return num.toFixed(2) + '%';
  }

  getColorPorcentaje(porcentaje: number): string {
    if (porcentaje >= 50) return 'primary';
    if (porcentaje >= 25) return 'accent';
    return 'warn';
  }

  getEstadisticas(): Estadisticas | null {
    if (this.usuario?.rol === 'FUNCIONARIO') {
      return this.infoCircuito?.estadisticas || null;
    } else if (this.usuario?.rol === 'ADMIN' && this.resultadosAdmin) {
      return this.resultadosAdmin.estadisticas || null;
    }
    return null;
  }

  getTituloVista(): string {
    if (this.usuario?.rol === 'FUNCIONARIO') {
      return `Resultados - Circuito ${this.infoCircuito?.circuito?.numero}`;
    } else if (this.usuario?.rol === 'ADMIN') {
      switch (this.vistaSeleccionada) {
        case 'circuito':
          const circuito = this.circuitos.find(c => c.id === this.circuitoSeleccionado);
          return `Resultados - Circuito ${circuito?.numero} (${circuito?.departamento})`;
        case 'departamento':
          const departamento = this.departamentos.find(d => d.id === this.departamentoSeleccionado);
          return `Resultados - Departamento ${departamento?.nombre}`;
        case 'generales':
          return 'Resultados Generales del País';
        default:
          return 'Resultados';
      }
    }
    return 'Resultados';
  }

  getPorcentajeParticipacion(): string {
    const stats = this.getEstadisticas();
    if (!stats || stats.total_habilitados <= 0) {
      return '0.0%';
    }
    const porcentaje = (stats.total_votaron / stats.total_habilitados) * 100;
    return porcentaje.toFixed(1) + '%';
  }

  get circuitosFiltrados(): any[] {
    if (!this.circuitoFiltro) return this.circuitos;
    return this.circuitos.filter(c =>
      (c.numero + ' - ' + c.departamento).toLowerCase().includes(this.circuitoFiltro.toLowerCase())
    );
  }
}
