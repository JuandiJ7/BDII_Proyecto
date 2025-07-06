import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { EleccionesService } from '../../services/elecciones.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AvisoDialogComponent } from '../../components/aviso-dialog/aviso-dialog.component';
import { Observable, startWith, map } from 'rxjs';

@Component({
  selector: 'app-admin-empleados',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatButtonModule, MatDialogModule, AvisoDialogComponent
  ],
  template: `
    <div class="empleado-container">
      <h2>Gestión de Empleados</h2>
      <div class="empleado-card">
        <form (ngSubmit)="onSubmit()" class="empleado-form">
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Credencial de ciudadano</mat-label>
            <input type="text" matInput [formControl]="credencialControl" [matAutocomplete]="autoCredencial" (blur)="onCredencialBlur()" required autocomplete="off" placeholder="Buscar por credencial o nombre">
            <mat-autocomplete #autoCredencial="matAutocomplete" [displayWith]="displayCredencial">
              <mat-option *ngFor="let c of ciudadanosFiltrados$ | async" [value]="c">
                {{ c.credencial }} - {{ c.nombres }} {{ c.apellido1 }} {{ c.apellido2 }}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Organismo</mat-label>
            <input type="text" matInput [formControl]="organismoControl" [matAutocomplete]="autoOrganismo" required autocomplete="off" placeholder="Buscar por nombre o id">
            <mat-autocomplete #autoOrganismo="matAutocomplete" [displayWith]="displayOrganismo">
              <mat-option *ngFor="let org of organismosFiltrados$ | async" [value]="org">
                {{ org.id }} - {{ org.nombre }}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>
          <div class="acciones-form">
            <button mat-raised-button color="primary" type="submit" [disabled]="!credencialControl.value || !organismoControl.value">Aceptar</button>
            <button mat-raised-button color="accent" type="button" (click)="resetForm()">Cancelar</button>
            <button *ngIf="esEdicion" mat-raised-button color="warn" type="button" (click)="eliminarEmpleado()" class="btn-eliminar">Eliminar</button>
          </div>
        </form>
        <div *ngIf="mensaje" class="mensaje-feedback">{{ mensaje }}</div>
      </div>
    </div>
  `,
  styles: [`
    .empleado-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 70vh;
      width: 100%;
    }
    .empleado-card {
      background: #fff;
      box-shadow: 0 2px 12px rgba(0,0,0,0.10), 0 1.5px 4px rgba(0,0,0,0.08);
      border-radius: 12px;
      padding: 32px 28px 24px 28px;
      margin-top: 18px;
      min-width: 320px;
      max-width: 370px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }
    .empleado-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
      align-items: stretch;
      width: 100%;
    }
    .full-width {
      width: 100%;
      min-width: 0;
      margin-bottom: 0;
    }
    .acciones-form {
      display: flex;
      flex-direction: row;
      gap: 18px;
      margin-top: 10px;
      justify-content: center;
      align-items: center;
    }
    .btn-eliminar {
      font-weight: bold;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(244,67,54,0.10);
      border-radius: 6px;
      min-width: 100px;
    }
    .mensaje-feedback { margin: 16px 0 0 0; color: #1976d2; font-weight: 500; text-align: center; }
    @media (max-width: 600px) {
      .empleado-card {
        padding: 18px 8px 14px 8px;
        min-width: 0;
        max-width: 100vw;
      }
      .acciones-form {
        flex-direction: column;
        gap: 10px;
        align-items: stretch;
      }
      .btn-eliminar {
        margin-left: 0;
        min-width: 0;
      }
    }
  `]
})
export class AdminEmpleadosComponent implements OnInit {
  credencialControl = new FormControl();
  organismoControl = new FormControl();
  ciudadanos: any[] = [];
  empleados: any[] = [];
  organismos: any[] = [];
  ciudadanosFiltrados$: Observable<any[]>;
  organismosFiltrados$: Observable<any[]>;
  mensaje = '';
  esEdicion = false;
  empleadoActual: any = null;

  constructor(private eleccionesService: EleccionesService, private dialog: MatDialog) {
    this.ciudadanosFiltrados$ = this.credencialControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterCiudadanos(value))
    );
    this.organismosFiltrados$ = this.organismoControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterOrganismos(value))
    );
  }

  async ngOnInit() {
    await this.cargarCiudadanos();
    await this.cargarEmpleados();
    await this.cargarOrganismos();
  }

  async cargarCiudadanos() {
    this.ciudadanos = await this.eleccionesService.listarCiudadanosSinEmpleado();
  }
  async cargarEmpleados() {
    this.empleados = await this.eleccionesService.listarEmpleados();
  }
  async cargarOrganismos() {
    this.organismos = await this.eleccionesService.listarOrganismos();
  }

  displayCredencial = (c: any) => c ? `${c.credencial} - ${c.nombres} ${c.apellido1} ${c.apellido2}` : '';
  displayOrganismo = (o: any) => o ? `${o.id} - ${o.nombre}` : '';

  private _filterCiudadanos(value: any): any[] {
    if (!value) return [...this.ciudadanos, ...this.empleados];
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    // Unificar ciudadanos sin empleado y empleados actuales (sin duplicar)
    const todos = [...this.ciudadanos, ...this.empleados.filter(e => !this.ciudadanos.some(c => c.credencial === e.credencial))];
    return todos.filter(c =>
      c.credencial.toLowerCase().includes(filterValue) ||
      (c.nombres?.toLowerCase().includes(filterValue) || '') ||
      (c.apellido1?.toLowerCase().includes(filterValue) || '') ||
      (c.apellido2?.toLowerCase().includes(filterValue) || '')
    );
  }
  private _filterOrganismos(value: any): any[] {
    if (!value) return this.organismos;
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.organismos.filter(o =>
      o.nombre.toLowerCase().includes(filterValue) ||
      o.id.toString().includes(filterValue)
    );
  }

  async onCredencialBlur() {
    const value = this.credencialControl.value;
    if (!value || typeof value !== 'object') {
      this.esEdicion = false;
      this.empleadoActual = null;
      this.organismoControl.reset();
      return;
    }
    const credencial = value.credencial;
    // Buscar en empleados
    const emp = this.empleados.find((e: any) => e.credencial === credencial);
    if (emp) {
      this.esEdicion = true;
      this.empleadoActual = emp;
      const org = this.organismos.find((o: any) => o.nombre === emp.organismo);
      this.organismoControl.setValue(org || null);
    } else {
      this.esEdicion = false;
      this.empleadoActual = null;
      this.organismoControl.reset();
    }
  }

  async onSubmit() {
    if (!this.credencialControl.value || !this.organismoControl.value) return;
    const credencial = this.credencialControl.value.credencial;
    const id_organismo = this.organismoControl.value.id;
    if (this.esEdicion) {
      const dialogRef = this.dialog.open(AvisoDialogComponent, {
        data: { mensaje: '¿Está seguro que desea modificar el organismo de este empleado?' }
      });
      const result = await dialogRef.afterClosed().toPromise();
      if (result !== true) return;
      try {
        const res = await this.eleccionesService.editarEmpleado(credencial, { id_organismo });
        this.mensaje = res.mensaje || 'Empleado actualizado';
        await this.cargarEmpleados();
        await this.cargarCiudadanos();
        this.resetForm();
      } catch (error: any) {
        this.mensaje = error?.mensaje || 'Error al actualizar empleado';
      }
    } else {
      try {
        const res = await this.eleccionesService.agregarEmpleado({ credencial, id_organismo });
        this.mensaje = res.mensaje || 'Empleado agregado correctamente';
        await this.cargarEmpleados();
        await this.cargarCiudadanos();
        this.resetForm();
      } catch (error: any) {
        this.mensaje = error?.mensaje || 'Error al agregar empleado';
      }
    }
  }

  async eliminarEmpleado() {
    if (!this.empleadoActual) return;
    const dialogRef = this.dialog.open(AvisoDialogComponent, {
      data: { mensaje: '¿Está seguro que desea eliminar este empleado?' }
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (result !== true) return;
    try {
      const res = await this.eleccionesService.eliminarEmpleado(this.empleadoActual.credencial);
      this.mensaje = res.mensaje || 'Empleado eliminado';
      await this.cargarEmpleados();
      await this.cargarCiudadanos();
      this.resetForm();
    } catch (error: any) {
      this.mensaje = error?.mensaje || 'Error al eliminar empleado';
    }
  }

  resetForm() {
    this.credencialControl.reset();
    this.organismoControl.reset();
    this.esEdicion = false;
    this.empleadoActual = null;
  }
} 