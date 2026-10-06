import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ModalApreciacionJuridicaComponent } from '../modal-apreciacion-juridica/modal-apreciacion-juridica.component';
import { ModalApreciacionPsicologicaComponent } from '../modal-apreciacion-psicologica/modal-apreciacion-psicologica.component';

export interface ApreciacionRegistrada {
  idTipoApreciacion: number;
  descripcion: string;
}

/**
 * VBG-06: «Apreciaciones profesionales» (sección repetida en `registro-caso`
 * y `registro-atencion`, extraída a componente compartido por la misma
 * regla transversal que `SeccionPresuntoAgresorComponent`).
 *
 * VBG-06-02/03/04: cada modal entrega únicamente un campo narrativo libre —
 * no hay lista "Tipo de apreciación" ni etiqueta "Observación" que mostrar.
 */
@Component({
  selector: 'app-seccion-apreciaciones',
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
  templateUrl: './seccion-apreciaciones.component.html',
  styleUrls: ['./seccion-apreciaciones.component.scss']
})
export class SeccionApreciacionesComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @Input() apreciacionesJuridicas: ApreciacionRegistrada[] = [];
  @Output() apreciacionesJuridicasChange = new EventEmitter<ApreciacionRegistrada[]>();

  @Input() apreciacionesPsicologicas: ApreciacionRegistrada[] = [];
  @Output() apreciacionesPsicologicasChange = new EventEmitter<ApreciacionRegistrada[]>();

  readonly columnas = ['descripcion', 'acciones'];

  abrirModalApreciacionJuridica(): void {
    const dialogRef = this.dialog.open(ModalApreciacionJuridicaComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.apreciacionesJuridicas = [...this.apreciacionesJuridicas, result];
        this.apreciacionesJuridicasChange.emit(this.apreciacionesJuridicas);
        this.snackBar.open('Apreciación agregada', 'Cerrar', { duration: 2000 });
      }
    });
  }

  abrirModalApreciacionPsicologica(): void {
    const dialogRef = this.dialog.open(ModalApreciacionPsicologicaComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.apreciacionesPsicologicas = [...this.apreciacionesPsicologicas, result];
        this.apreciacionesPsicologicasChange.emit(this.apreciacionesPsicologicas);
        this.snackBar.open('Apreciación agregada', 'Cerrar', { duration: 2000 });
      }
    });
  }

  eliminarApreciacionJuridica(i: number): void {
    this.apreciacionesJuridicas.splice(i, 1);
    this.apreciacionesJuridicas = [...this.apreciacionesJuridicas];
    this.apreciacionesJuridicasChange.emit(this.apreciacionesJuridicas);
  }

  eliminarApreciacionPsicologica(i: number): void {
    this.apreciacionesPsicologicas.splice(i, 1);
    this.apreciacionesPsicologicas = [...this.apreciacionesPsicologicas];
    this.apreciacionesPsicologicasChange.emit(this.apreciacionesPsicologicas);
  }
}
