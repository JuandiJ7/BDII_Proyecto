import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-aviso-dialog',
  template: `
    <h2 mat-dialog-title>Aviso</h2>
    <mat-dialog-content>
      <p>{{ data.mensaje }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `
})
export class AvisoDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { mensaje: string }) {}
} 