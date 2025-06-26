import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EleccionesService } from '../../../services/elecciones.service';
import { AuthService } from '../../../services/auth.service';

interface VotoData {
  partido: any;
  lista: any;
  papeletas: any[];
  esVotoEnBlanco: boolean;
}

@Component({
  selector: 'app-confirmar-voto',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirmar-voto-container">
      <h2 mat-dialog-title>
        <mat-icon>how_to_vote</mat-icon>
        Confirmar Voto
      </h2>
      
      <mat-dialog-content>
        <div class="voto-resumen">
          <div class="seccion">
            <h3>Partido Seleccionado</h3>
            <div class="partido-info" *ngIf="!data.esVotoEnBlanco">
              <p><strong>{{ data.partido?.nombre }}</strong></p>
              <p *ngIf="data.partido?.presidente">
                Presidente: {{ data.partido.presidente.nombres }} {{ data.partido.presidente.apellidos }}
              </p>
              <p *ngIf="data.partido?.vicepresidente">
                Vicepresidente: {{ data.partido.vicepresidente.nombres }} {{ data.partido.vicepresidente.apellidos }}
              </p>
            </div>
            <div class="voto-blanco" *ngIf="data.esVotoEnBlanco">
              <p><strong>VOTO EN BLANCO</strong></p>
              <p class="descripcion">No se seleccionó ningún partido ni lista</p>
            </div>
          </div>

          <div class="seccion" *ngIf="!data.esVotoEnBlanco">
            <h3>Lista Seleccionada</h3>
            <div class="lista-info">
              <p><strong>Lista {{ data.lista?.numero }}</strong></p>
              <p>Departamento: {{ data.lista?.nombre_departamento }}</p>
            </div>
          </div>

          <div class="seccion" *ngIf="data.papeletas && data.papeletas.length > 0">
            <h3>Papeletas Seleccionadas</h3>
            <div class="papeletas-list">
              <div *ngFor="let papeleta of data.papeletas" class="papeleta-item">
                <mat-icon>ballot</mat-icon>
                <span>{{ papeleta.nombre }}</span>
              </div>
            </div>
          </div>

          <div class="seccion" *ngIf="!data.papeletas || data.papeletas.length === 0">
            <h3>Papeletas</h3>
            <p class="no-papeletas">No se seleccionaron papeletas</p>
          </div>

          <div class="advertencia">
            <mat-icon>warning</mat-icon>
            <p><strong>Importante:</strong> Una vez confirmado, no podrás cambiar tu voto.</p>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancelar()">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button color="primary" (click)="confirmarVoto()" [disabled]="procesando">
          <mat-icon>how_to_vote</mat-icon>
          {{ procesando ? 'Procesando...' : 'Confirmar Voto' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmar-voto-container {
      min-width: 500px;
    }

    h2 mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
    }

    .voto-resumen {
      margin: 1rem 0;
    }

    .seccion {
      margin-bottom: 1.5rem;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #fafafa;
    }

    .seccion h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.1em;
    }

    .partido-info p, .lista-info p {
      margin: 0.25rem 0;
    }

    .voto-blanco {
      text-align: center;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .voto-blanco .descripcion {
      color: #666;
      font-style: italic;
    }

    .papeletas-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .papeleta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0.5rem;
      background-color: #e3f2fd;
      border-radius: 4px;
    }

    .no-papeletas {
      color: #666;
      font-style: italic;
    }

    .advertencia {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 1rem;
      background-color: #fff3e0;
      border: 1px solid #ffb74d;
      border-radius: 4px;
      margin-top: 1rem;
    }

    .advertencia mat-icon {
      color: #f57c00;
    }

    .advertencia p {
      margin: 0;
      color: #e65100;
    }

    mat-dialog-actions {
      padding: 1rem 0;
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }
  `]
})
export class ConfirmarVotoComponent implements OnInit {
  procesando = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmarVotoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VotoData,
    private eleccionesService: EleccionesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('Datos del voto a confirmar:', this.data);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  async confirmarVoto(): Promise<void> {
    this.procesando = true;
    
    try {
      // Obtener el usuario actual
      const usuario = await this.authService.getUsuarioActual();
      if (!usuario) {
        alert('Error: Usuario no autenticado');
        this.procesando = false;
        return;
      }

      console.log('Usuario autenticado:', usuario);

      // Primero hacer debug para ver qué está pasando
      console.log('Haciendo debug del votante...');
      const debugData = await this.eleccionesService.debugVotante();
      console.log('Datos de debug:', debugData);

      // Si no hay datos en padrón, mostrar error
      if (!debugData.padron) {
        alert('Error: No se encontró el votante en el padrón. Contacte al administrador.');
        this.procesando = false;
        return;
      }

      // Obtener el circuito del votante
      const circuito = await this.eleccionesService.getCircuitoVotante();
      
      // Preparar datos del voto
      const votoData = {
        id_lista: this.data.lista?.id || null,
        papeletas: this.data.papeletas?.map(p => p.id) || [],
        credencial_votante: usuario.credencial
      };

      console.log('Enviando voto:', votoData);

      // Registrar el voto
      const resultado = await this.eleccionesService.registrarVoto(votoData);
      
      console.log('Voto registrado:', resultado);
      
      // Cerrar modal con éxito
      this.dialogRef.close(true);
      
    } catch (error) {
      console.error('Error al registrar voto:', error);
      alert('Error al registrar el voto. Por favor, inténtalo de nuevo.');
      this.procesando = false;
    }
  }
} 