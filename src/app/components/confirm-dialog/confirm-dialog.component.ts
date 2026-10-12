import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  titulo?: string;
  mensaje?: string;
  /** Texto del botón de confirmación; por defecto «Eliminar». */
  textoConfirmar?: string;
  /** Ícono decorativo del botón de confirmación; por defecto `delete`. */
  iconoConfirmar?: string;
  /** Texto del botón de cancelar; por defecto «Cancelar». */
  textoCancelar?: string;
  /** Subtítulo bajo el título; por defecto «Esta acción no se puede deshacer». */
  subtitulo?: string;
}

@Component({
    selector: 'app-confirm-dialog',
    imports: [MatDialogModule, MatButtonModule, MatIconModule],
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  confirmar(): void {
    this.dialogRef.close(true);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
