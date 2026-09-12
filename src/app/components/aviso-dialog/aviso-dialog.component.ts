import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AvisoDialogData {
  titulo: string;
  mensaje: string;
  /** Texto del único botón; por defecto «Entendido». */
  textoBoton?: string;
  /** Ícono decorativo de Material; por defecto `info`. */
  icono?: string;
}

/**
 * Aviso modal de un solo botón (reemplaza a `Swal.fire` de SweetAlert2).
 *
 * `MatDialog` aporta lo que SweetAlert2 no garantizaba en Casilda: trampa de
 * foco, cierre con Escape, `aria-labelledby` con el título y devolución del
 * foco al elemento que abrió el diálogo (WCAG 2.2 · 2.4.3 · 2.1.2).
 */
@Component({
  selector: 'app-aviso-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="aviso__titulo">
      <mat-icon aria-hidden="true">{{ data.icono ?? 'info' }}</mat-icon>
      {{ data.titulo }}
    </h2>
    <mat-dialog-content>
      <p class="aviso__mensaje">{{ data.mensaje }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" cdkFocusInitial (click)="dialogRef.close(true)">
        {{ data.textoBoton ?? 'Entendido' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .aviso__titulo { display: flex; align-items: center; gap: var(--space-2); }
    .aviso__titulo .mat-icon { color: var(--color-warning); flex-shrink: 0; }
    .aviso__mensaje { margin: 0; line-height: var(--line-height-relaxed); max-width: 42ch; }
  `
})
export class AvisoDialogComponent {
  readonly dialogRef = inject(MatDialogRef<AvisoDialogComponent>);
  readonly data = inject<AvisoDialogData>(MAT_DIALOG_DATA);
}
