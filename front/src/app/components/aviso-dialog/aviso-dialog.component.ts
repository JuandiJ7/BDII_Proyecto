import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-aviso-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="aviso-dialog-container">
      <h2 mat-dialog-title class="aviso-dialog-title">Aviso</h2>
      <mat-dialog-content class="aviso-dialog-content">
        <p>{{ data.mensaje }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="aviso-dialog-actions">
        <button mat-button class="btn-si" (click)="confirmar()">Sí</button>
        <button mat-button class="btn-no" mat-dialog-close="false">No</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .aviso-dialog-container {
      min-width: 350px;
      max-width: 480px;
      padding: 8px 0 0 0;
      text-align: center;
    }
    .aviso-dialog-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .aviso-dialog-content p {
      font-size: 1.13rem;
      margin: 18px 0 18px 0;
      color: #333;
    }
    .aviso-dialog-actions {
      display: flex;
      justify-content: center;
      gap: 18px;
      margin-bottom: 8px;
    }
    .aviso-dialog-actions .btn-si {
      min-width: 80px;
      font-size: 1.08rem;
      font-weight: 500;
      padding: 8px 0;
      background: #1976d2;
      color: #fff;
      border-radius: 4px;
      border: none;
      transition: background 0.2s;
    }
    .aviso-dialog-actions .btn-si:hover {
      background: #1256a0;
    }
    .aviso-dialog-actions .btn-no {
      min-width: 80px;
      font-size: 1.08rem;
      font-weight: 500;
      padding: 8px 0;
      background: #f5f5f5;
      color: #222;
      border-radius: 4px;
      border: none;
      transition: background 0.2s;
    }
    .aviso-dialog-actions .btn-no:hover {
      background: #e0e0e0;
    }
  `]
})
export class AvisoDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mensaje: string },
    private dialogRef: MatDialogRef<AvisoDialogComponent>
  ) {}

  confirmar() {
    this.dialogRef.close(true);
  }
} 