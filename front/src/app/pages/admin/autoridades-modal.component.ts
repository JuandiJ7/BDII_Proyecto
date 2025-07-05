import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { EleccionesService } from '../../services/elecciones.service';

interface Circuito {
  id: number;
  numero: string;
  departamento: string;
}

interface Empleado {
  credencial: string;
  nombres: string;
  apellidos: string;
}

interface Autoridades {
  presidente: Empleado | null;
  secretario: Empleado | null;
  vocal: Empleado | null;
}

@Component({
  selector: 'app-autoridades-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule
  ],
  template: `
    <div class="modal-container">
      <h2 mat-dialog-title>
        <mat-icon>admin_panel_settings</mat-icon>
        Modificar Autoridades de Circuito
      </h2>
      
      <mat-dialog-content>
        <div class="form-container">
          <!-- Selección de Circuito con Autocomplete -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Buscar Circuito</mat-label>
            <input type="text" 
                   matInput 
                   [formControl]="circuitoControl"
                   [matAutocomplete]="auto"
                   placeholder="Escriba el número del circuito...">
            <mat-autocomplete #auto="matAutocomplete" 
                             (optionSelected)="onCircuitoSeleccionado($event)"
                             [displayWith]="displayCircuito">
              <mat-option *ngFor="let circuito of circuitosFiltrados$ | async" 
                         [value]="circuito">
                Circuito {{ circuito.numero }} - {{ circuito.departamento }}
              </mat-option>
            </mat-autocomplete>
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <!-- Información del Circuito Seleccionado -->
          <div *ngIf="circuitoSeleccionado" class="circuito-info">
            <h3>Circuito {{ circuitoSeleccionado.numero }} - {{ circuitoSeleccionado.departamento }}</h3>
          </div>

          <!-- Autoridades Actuales -->
          <div *ngIf="autoridadesActuales" class="autoridades-actuales">
            <h4>Autoridades Actuales:</h4>
            <div class="autoridad-item">
              <strong>Presidente:</strong> 
              <span *ngIf="autoridadesActuales.presidente">
                {{ autoridadesActuales.presidente.nombres }} {{ autoridadesActuales.presidente.apellidos }}
              </span>
              <span *ngIf="!autoridadesActuales.presidente" class="sin-asignar">Sin asignar</span>
            </div>
            <div class="autoridad-item">
              <strong>Secretario:</strong> 
              <span *ngIf="autoridadesActuales.secretario">
                {{ autoridadesActuales.secretario.nombres }} {{ autoridadesActuales.secretario.apellidos }}
              </span>
              <span *ngIf="!autoridadesActuales.secretario" class="sin-asignar">Sin asignar</span>
            </div>
            <div class="autoridad-item">
              <strong>Vocal:</strong> 
              <span *ngIf="autoridadesActuales.vocal">
                {{ autoridadesActuales.vocal.nombres }} {{ autoridadesActuales.vocal.apellidos }}
              </span>
              <span *ngIf="!autoridadesActuales.vocal" class="sin-asignar">Sin asignar</span>
            </div>
          </div>

          <!-- Formulario de Modificación -->
          <div *ngIf="circuitoSeleccionado" class="formulario-modificacion">
            <h4>Modificar Autoridades:</h4>
            
            <!-- Presidente -->
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Presidente</mat-label>
              <input type="text"
                     matInput
                     [formControl]="presidenteControl"
                     [matAutocomplete]="autoPresidente"
                     placeholder="Buscar por nombre o credencial">
              <mat-autocomplete #autoPresidente="matAutocomplete" [displayWith]="displayEmpleado">
                <mat-option value="">Sin asignar</mat-option>
                <mat-option *ngFor="let empleado of empleadosFiltradosPresidente$ | async" [value]="empleado">
                  {{ empleado.nombres }} {{ empleado.apellidos }} ({{ empleado.credencial }})
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>

            <!-- Secretario -->
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Secretario</mat-label>
              <input type="text"
                     matInput
                     [formControl]="secretarioControl"
                     [matAutocomplete]="autoSecretario"
                     placeholder="Buscar por nombre o credencial">
              <mat-autocomplete #autoSecretario="matAutocomplete" [displayWith]="displayEmpleado">
                <mat-option value="">Sin asignar</mat-option>
                <mat-option *ngFor="let empleado of empleadosFiltradosSecretario$ | async" [value]="empleado">
                  {{ empleado.nombres }} {{ empleado.apellidos }} ({{ empleado.credencial }})
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>

            <!-- Vocal -->
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Vocal</mat-label>
              <input type="text"
                     matInput
                     [formControl]="vocalControl"
                     [matAutocomplete]="autoVocal"
                     placeholder="Buscar por nombre o credencial">
              <mat-autocomplete #autoVocal="matAutocomplete" [displayWith]="displayEmpleado">
                <mat-option value="">Sin asignar</mat-option>
                <mat-option *ngFor="let empleado of empleadosFiltradosVocal$ | async" [value]="empleado">
                  {{ empleado.nombres }} {{ empleado.apellidos }} ({{ empleado.credencial }})
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cerrar()">Cancelar</button>
        <button mat-raised-button color="primary" 
                (click)="guardarCambios()"
                [disabled]="!circuitoSeleccionado">
          <mat-icon>save</mat-icon>
          Guardar Cambios
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-container {
      padding: 20px;
      max-width: 600px;
    }
    
    .form-container {
      min-width: 400px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }
    
    .circuito-info {
      background-color: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    .autoridades-actuales {
      background-color: #e8f5e9;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    .autoridad-item {
      margin-bottom: 0.5rem;
    }
    
    .sin-asignar {
      color: #666;
      font-style: italic;
    }
    
    .formulario-modificacion {
      margin-top: 1rem;
    }
    
    h4 {
      margin-bottom: 1rem;
      color: #333;
    }
  `]
})
export class AutoridadesModalComponent implements OnInit {
  circuitos: Circuito[] = [];
  empleados: Empleado[] = [];
  circuitoSeleccionado: Circuito | null = null;
  autoridadesActuales: Autoridades | null = null;
  
  nuevoPresidente: string = '';
  nuevoSecretario: string = '';
  nuevoVocal: string = '';

  // Autocomplete
  circuitoControl = new FormControl('');
  circuitosFiltrados$: Observable<Circuito[]>;

  presidenteControl = new FormControl<Empleado | null>(null);
  secretarioControl = new FormControl<Empleado | null>(null);
  vocalControl = new FormControl<Empleado | null>(null);
  empleadosFiltradosPresidente$: Observable<Empleado[]>;
  empleadosFiltradosSecretario$: Observable<Empleado[]>;
  empleadosFiltradosVocal$: Observable<Empleado[]>;

  constructor(
    public dialogRef: MatDialogRef<AutoridadesModalComponent>,
    private eleccionesService: EleccionesService
  ) {
    this.circuitosFiltrados$ = this.circuitoControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterCircuitos(value))
    );
    this.empleadosFiltradosPresidente$ = this.presidenteControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterEmpleados(value))
    );
    this.empleadosFiltradosSecretario$ = this.secretarioControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterEmpleados(value))
    );
    this.empleadosFiltradosVocal$ = this.vocalControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterEmpleados(value))
    );
  }

  displayCircuito = (circuito: Circuito | null): string => {
    return circuito ? `Circuito ${circuito.numero} - ${circuito.departamento}` : '';
  };

  displayEmpleado = (empleado: Empleado | null): string => {
    return empleado ? `${empleado.nombres} ${empleado.apellidos} (${empleado.credencial})` : '';
  };

  private _filterCircuitos(value: any): Circuito[] {
    if (!value) return this.circuitos;
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.circuitos.filter(circuito => 
      circuito.numero.toLowerCase().includes(filterValue) ||
      circuito.departamento.toLowerCase().includes(filterValue)
    );
  }

  private _filterEmpleados(value: any): Empleado[] {
    if (!value) return this.empleados;
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.empleados.filter(empleado =>
      empleado.nombres.toLowerCase().includes(filterValue) ||
      empleado.apellidos.toLowerCase().includes(filterValue) ||
      empleado.credencial.toLowerCase().includes(filterValue)
    );
  }

  onCircuitoSeleccionado(event: any): void {
    this.circuitoSeleccionado = event.option.value;
    if (this.circuitoSeleccionado) {
      this.cargarAutoridadesCircuito(this.circuitoSeleccionado.id);
    }
  }

  async cargarCircuitos(): Promise<void> {
    try {
      this.circuitos = await this.eleccionesService.getCircuitos();
      console.log('Circuitos cargados:', this.circuitos);
    } catch (error) {
      console.error('Error al cargar circuitos:', error);
      alert('Error al cargar los circuitos');
    }
  }

  async cargarEmpleados(): Promise<void> {
    try {
      this.empleados = await this.eleccionesService.getEmpleados();
      console.log('Empleados cargados:', this.empleados);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      alert('Error al cargar los empleados');
    }
  }

  async cargarAutoridadesCircuito(idCircuito: number): Promise<void> {
    try {
      this.autoridadesActuales = await this.eleccionesService.getAutoridadesCircuito(idCircuito);
      console.log('Autoridades cargadas:', this.autoridadesActuales);
      if (this.autoridadesActuales) {
        this.presidenteControl.setValue(this._findEmpleado(this.autoridadesActuales.presidente));
        this.secretarioControl.setValue(this._findEmpleado(this.autoridadesActuales.secretario));
        this.vocalControl.setValue(this._findEmpleado(this.autoridadesActuales.vocal));
      }
    } catch (error) {
      console.error('Error al cargar autoridades:', error);
      alert('Error al cargar las autoridades del circuito');
    }
  }

  private _findEmpleado(autoridad: Empleado | null): Empleado | null {
    if (!autoridad) return null;
    return this.empleados.find(e => e.credencial === autoridad.credencial) || null;
  }

  async guardarCambios(): Promise<void> {
    if (!this.circuitoSeleccionado) return;
    try {
      const autoridades = {
        presidente: this.presidenteControl.value ? this.presidenteControl.value.credencial : undefined,
        secretario: this.secretarioControl.value ? this.secretarioControl.value.credencial : undefined,
        vocal: this.vocalControl.value ? this.vocalControl.value.credencial : undefined
      };
      const resultado = await this.eleccionesService.modificarAutoridadesCircuito(
        this.circuitoSeleccionado.id, 
        autoridades
      );
      if (resultado.success) {
        alert('Autoridades actualizadas correctamente');
        this.dialogRef.close(true);
      } else {
        alert('Error al actualizar autoridades');
      }
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar los cambios');
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.cargarCircuitos();
    this.cargarEmpleados();
  }
} 