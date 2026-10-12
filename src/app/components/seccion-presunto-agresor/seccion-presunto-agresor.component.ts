import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MaestroDto } from '../../services/listas.service';
import { ModalPresuntoAgresorComponent } from '../modal-presunto-agresor/modal-presunto-agresor.component';

export interface AgresorRegistrado {
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  idVinculoUniversidad?: number | null;
  vinculoUniversidad?: string;
  cualVinculoUniversidad?: string;
  idVinculoVictima?: number | null;
  vinculoVictima?: string;
  cualVinculoVictima?: string;
}

/**
 * VBG-05: «Datos del presunto agresor» (secciones repetidas en
 * `registro-caso` y `registro-atencion`, regla transversal de la
 * autorización: se extrae a un componente compartido en vez de duplicar
 * la plantilla).
 */
@Component({
  selector: 'app-seccion-presunto-agresor',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './seccion-presunto-agresor.component.html',
  styleUrls: ['./seccion-presunto-agresor.component.scss']
})
export class SeccionPresuntoAgresorComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @Input() catalogoVinculosUdea: MaestroDto[] = [];
  @Input() catalogoVinculosAgresorVictima: MaestroDto[] = [];
  @Input() agresoresRegistrados: AgresorRegistrado[] = [];
  @Output() agresoresRegistradosChange = new EventEmitter<AgresorRegistrado[]>();

  readonly columnas = ['nombre', 'vinculoUniversidad', 'vinculoVictima', 'opcion'];

  abrirModalAgresor(): void {
    const dialogRef = this.dialog.open(ModalPresuntoAgresorComponent, {
      width: '700px',
      disableClose: true,
      data: {
        vinculosUdea: this.catalogoVinculosUdea,
        vinculosAgresor: this.catalogoVinculosAgresorVictima
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.agresoresRegistrados = [...this.agresoresRegistrados, result];
        this.agresoresRegistradosChange.emit(this.agresoresRegistrados);
        this.snackBar.open('Presunto agresor agregado', 'Cerrar', { duration: 2000 });
      }
    });
  }

  eliminarAgresor(i: number): void {
    this.agresoresRegistrados.splice(i, 1);
    this.agresoresRegistrados = [...this.agresoresRegistrados];
    this.agresoresRegistradosChange.emit(this.agresoresRegistrados);
  }

  formatearNombreAgresor(agresor: AgresorRegistrado): string {
    if (!agresor) return 'Desconocido';
    const partes = [agresor.primerNombre, agresor.segundoNombre, agresor.primerApellido, agresor.segundoApellido];
    const nombreCompleto = partes.filter(n => typeof n === 'string' && n.trim() !== '').join(' ');
    return nombreCompleto || 'Desconocido';
  }
}
