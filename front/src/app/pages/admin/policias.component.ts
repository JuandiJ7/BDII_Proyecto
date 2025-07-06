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
  selector: 'app-admin-policias',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatButtonModule, MatDialogModule, AvisoDialogComponent
  ],
  template: `
    <div class="empleado-container">
      <h2>Gestión de Policías</h2>
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
            <mat-label>Comisaría</mat-label>
            <input type="text" matInput [formControl]="comisariaControl" [matAutocomplete]="autoComisaria" required autocomplete="off" placeholder="Buscar por nombre o id">
            <mat-autocomplete #autoComisaria="matAutocomplete" [displayWith]="displayComisaria">
              <mat-option *ngFor="let com of comisariasFiltrados$ | async" [value]="com">
                {{ com.id }} - {{ com.nombre }}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Establecimiento</mat-label>
            <input type="text" matInput [formControl]="establecimientoControl" [matAutocomplete]="autoEstablecimiento" required autocomplete="off" placeholder="Buscar por dirección o id">
            <mat-autocomplete #autoEstablecimiento="matAutocomplete" [displayWith]="displayEstablecimiento">
              <mat-option *ngFor="let est of establecimientosFiltrados$ | async" [value]="est">
                {{ est.id }} - {{ est.direccion }}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>
          <div class="acciones-form">
            <button mat-raised-button color="primary" type="submit" [disabled]="!credencialControl.value || !comisariaControl.value || !establecimientoControl.value">Aceptar</button>
            <button mat-raised-button color="accent" type="button" (click)="resetForm()">Cancelar</button>
            <button *ngIf="esEdicion" mat-raised-button color="warn" type="button" (click)="eliminarPolicia()" class="btn-eliminar">Eliminar</button>
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
export class AdminPoliciasComponent implements OnInit {
  credencialControl = new FormControl();
  comisariaControl = new FormControl();
  establecimientoControl = new FormControl();
  ciudadanos: any[] = [];
  policias: any[] = [];
  comisarias: any[] = [];
  establecimientos: any[] = [];
  ciudadanosFiltrados$: Observable<any[]>;
  comisariasFiltrados$: Observable<any[]>;
  establecimientosFiltrados$: Observable<any[]>;
  mensaje = '';
  esEdicion = false;
  policiaActual: any = null;

  constructor(private eleccionesService: EleccionesService, private dialog: MatDialog) {
    this.ciudadanosFiltrados$ = this.credencialControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterCiudadanos(value))
    );
    this.comisariasFiltrados$ = this.comisariaControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterComisarias(value))
    );
    this.establecimientosFiltrados$ = this.establecimientoControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterEstablecimientos(value))
    );
  }

  async ngOnInit() {
    await this.cargarCiudadanos();
    await this.cargarPolicias();
    await this.cargarComisarias();
    await this.cargarEstablecimientos();
  }

  async cargarCiudadanos() {
    this.ciudadanos = await this.eleccionesService.listarCiudadanosSinEmpleado(); // Reutilizamos, asume que no son policías
  }
  async cargarPolicias() {
    this.policias = await this.eleccionesService.listarPolicias();
  }
  async cargarComisarias() {
    this.comisarias = await this.eleccionesService.listarComisarias();
  }
  async cargarEstablecimientos() {
    this.establecimientos = await this.eleccionesService.listarEstablecimientos();
  }

  displayCredencial = (c: any) => c ? `${c.credencial} - ${c.nombres} ${c.apellido1} ${c.apellido2}` : '';
  displayComisaria = (c: any) => c ? `${c.id} - ${c.nombre}` : '';
  displayEstablecimiento = (e: any) => e ? `${e.id} - ${e.direccion}` : '';

  private _filterCiudadanos(value: any): any[] {
    if (!value) return [...this.ciudadanos, ...this.policias];
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    const todos = [...this.ciudadanos, ...this.policias.filter(p => !this.ciudadanos.some(c => c.credencial === p.credencial))];
    return todos.filter(c =>
      c.credencial.toLowerCase().includes(filterValue) ||
      (c.nombres?.toLowerCase().includes(filterValue) || '') ||
      (c.apellido1?.toLowerCase().includes(filterValue) || '') ||
      (c.apellido2?.toLowerCase().includes(filterValue) || '')
    );
  }
  private _filterComisarias(value: any): any[] {
    if (!value) return this.comisarias;
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.comisarias.filter(c =>
      c.nombre.toLowerCase().includes(filterValue) ||
      c.id.toString().includes(filterValue)
    );
  }
  private _filterEstablecimientos(value: any): any[] {
    if (!value) return this.establecimientos;
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.establecimientos.filter(e =>
      e.direccion.toLowerCase().includes(filterValue) ||
      e.id.toString().includes(filterValue)
    );
  }

  async onCredencialBlur() {
    const value = this.credencialControl.value;
    if (!value || typeof value !== 'object') {
      this.esEdicion = false;
      this.policiaActual = null;
      this.comisariaControl.reset();
      this.establecimientoControl.reset();
      return;
    }
    const credencial = value.credencial;
    const pol = this.policias.find((p: any) => p.credencial === credencial);
    if (pol) {
      this.esEdicion = true;
      this.policiaActual = pol;
      const com = this.comisarias.find((c: any) => c.nombre === pol.comisaria);
      const est = this.establecimientos.find((e: any) => e.direccion === pol.establecimiento);
      this.comisariaControl.setValue(com || null);
      this.establecimientoControl.setValue(est || null);
    } else {
      this.esEdicion = false;
      this.policiaActual = null;
      this.comisariaControl.reset();
      this.establecimientoControl.reset();
    }
  }

  async onSubmit() {
    if (!this.credencialControl.value || !this.comisariaControl.value || !this.establecimientoControl.value) return;
    const credencial = this.credencialControl.value.credencial;
    const id_comisaria = this.comisariaControl.value.id;
    const id_establecimiento = this.establecimientoControl.value.id;
    if (this.esEdicion) {
      const dialogRef = this.dialog.open(AvisoDialogComponent, {
        data: { mensaje: '¿Está seguro que desea modificar los datos de este policía?' }
      });
      const result = await dialogRef.afterClosed().toPromise();
      if (result !== true) return;
      try {
        const res = await this.eleccionesService.editarPolicia(credencial, { id_comisaria, id_establecimiento });
        this.mensaje = res.mensaje || 'Policía actualizado';
        await this.cargarPolicias();
        await this.cargarCiudadanos();
        this.resetForm();
      } catch (error: any) {
        this.mensaje = error?.mensaje || 'Error al actualizar policía';
      }
    } else {
      try {
        const res = await this.eleccionesService.agregarPolicia({ credencial, id_comisaria, id_establecimiento });
        this.mensaje = res.mensaje || 'Policía agregado correctamente';
        await this.cargarPolicias();
        await this.cargarCiudadanos();
        this.resetForm();
      } catch (error: any) {
        this.mensaje = error?.mensaje || 'Error al agregar policía';
      }
    }
  }

  async eliminarPolicia() {
    if (!this.policiaActual) return;
    const dialogRef = this.dialog.open(AvisoDialogComponent, {
      data: { mensaje: '¿Está seguro que desea eliminar este policía?' }
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (result !== true) return;
    try {
      const res = await this.eleccionesService.eliminarPolicia(this.policiaActual.credencial);
      this.mensaje = res.mensaje || 'Policía eliminado';
      await this.cargarPolicias();
      await this.cargarCiudadanos();
      this.resetForm();
    } catch (error: any) {
      this.mensaje = error?.mensaje || 'Error al eliminar policía';
    }
  }

  resetForm() {
    this.credencialControl.reset();
    this.comisariaControl.reset();
    this.establecimientoControl.reset();
    this.esEdicion = false;
    this.policiaActual = null;
  }
} 