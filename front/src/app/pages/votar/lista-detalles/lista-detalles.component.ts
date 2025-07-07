import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { EleccionesService } from '../../../services/elecciones.service';

interface ListaDetalles {
  id: number;
  numero: number;
  departamento: {
    id: number;
    nombre: string;
  };
  partido: {
    id: number;
    nombre: string;
  };
  integrantes: {
    credencial: string;
    nombres: string;
    apellidos: string;
    orden: number;
    candidato: string;
  }[];
}

@Component({
  selector: 'app-lista-detalles',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Detalles de la Lista {{ lista?.numero }}</h2>
    <mat-dialog-content>
      <div *ngIf="lista">
        <p><strong>Partido:</strong> {{ lista.partido.nombre }}</p>
        <p><strong>Departamento:</strong> {{ lista.departamento.nombre }}</p>
        
        <h3>Integrantes</h3>
        <div class="integrantes-list">
          <div *ngFor="let integrante of lista.integrantes" class="integrante-item">
            <p><strong>{{ integrante.orden }}.</strong> {{ integrante.nombres }} {{ integrante.apellidos }}</p>
            <p class="candidato">{{ getEtiquetaCandidato(+integrante.candidato) }}</p>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cerrar()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .integrantes-list {
      margin-top: 1rem;
    }
    .integrante-item {
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }
    .candidato {
      color: #666;
      font-style: italic;
      margin-left: 1.5rem;
    }
  `]
})
export class ListaDetallesComponent implements OnInit {
  lista: ListaDetalles | null = null;

  constructor(
    public dialogRef: MatDialogRef<ListaDetallesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { listaId: number },
    private eleccionesService: EleccionesService
  ) {}

  ngOnInit(): void {
    this.cargarDetallesLista();
  }

  getEtiquetaCandidato(valor: number): string {
    switch (valor) {
      case 1: return 'Titular';
      case 2: return 'Primer suplente';
      case 3: return 'Segundo suplente';
      case 4: return 'Tercer suplente';
      default: return '';
    }
  }

  async cargarDetallesLista(): Promise<void> {
    try {
      this.lista = await this.eleccionesService.getDetallesLista(this.data.listaId) || null;
    } catch (error) {
      console.error('Error al cargar detalles de la lista:', error);
      alert('Error al cargar los detalles de la lista');
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
} 