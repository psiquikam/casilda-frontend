import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { AvisoDialogComponent, AvisoDialogData } from '../../components/aviso-dialog/aviso-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';

/**
 * Diálogos de aviso y confirmación sobre `MatDialog` (plan de accesibilidad, H-18).
 *
 * Un único mecanismo de modal en toda la aplicación: trampa de foco, cierre con
 * Escape y devolución del foco garantizados por el CDK. Sustituye a SweetAlert2.
 */
@Injectable({ providedIn: 'root' })
export class DialogoService {
  private readonly dialog = inject(MatDialog);

  /** Aviso de un solo botón. Resuelve al cerrarse. */
  aviso(data: AvisoDialogData, opciones: { bloqueante?: boolean } = {}): Observable<void> {
    return this.dialog
      .open(AvisoDialogComponent, {
        data,
        width: '420px',
        maxWidth: '92vw',
        disableClose: opciones.bloqueante ?? false,
        autoFocus: 'first-tabbable',
        restoreFocus: true
      })
      .afterClosed()
      .pipe(map(() => undefined));
  }

  /** Confirmación destructiva. Emite `true` solo si la persona confirma. */
  confirmar(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open(ConfirmDialogComponent, { data, width: '380px', maxWidth: '92vw', restoreFocus: true })
      .afterClosed()
      .pipe(map((r) => r === true));
  }
}
