import { Component, Inject, OnInit, inject } from '@angular/core';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MaestroDto } from '../../services/listas.service';
import { MaestrosVbgService } from '../../services/maestros-vbg.service';

@Component({
    selector: 'app-modal-remisiones',
    imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
],
    templateUrl: './modal-seguimiento.component.html',
    styleUrls: ['./modal-seguimiento.component.scss']
})
export class ModalSeguimientosComponent implements OnInit {

  private readonly maestrosVbg = inject(MaestrosVbgService);

  tiposSeguimiento: MaestroDto[] = [];
  acciones: MaestroDto[] = [];
  actividades: MaestroDto[] = [];

  cargandoMaestros = false;

  data = {
    idtiposeguimiento: null as number | null,
    tipoSeguimiento: '',
    fecha: null as Date | null,
    idaccion: null as number | null,
    accion: '',
    idactividad: null as number | null,
    actividad: '',
    descripcion: '',
    archivo: null as File | null
  };

  bloquearTipo = false;

  constructor(
    public dialogRef: MatDialogRef<ModalSeguimientosComponent>,
    @Inject(MAT_DIALOG_DATA) public incomingData: any
  ) {
    if (incomingData?.tipoSeguimiento) {
      this.data.tipoSeguimiento = incomingData.tipoSeguimiento;
      this.bloquearTipo = true;
    }
  }

  ngOnInit(): void {
    this.cargarMaestrosSeguimiento();
  }

  seleccionarTipoSeguimiento(id: number | null): void {
    const item = this.tiposSeguimiento.find((x) => x.id === id);
    this.data.idtiposeguimiento = id;
    this.data.tipoSeguimiento = item?.nombre ?? '';
  }

  seleccionarAccion(id: number | null): void {
    const item = this.acciones.find((x) => x.id === id);
    this.data.idaccion = id;
    this.data.accion = item?.nombre ?? '';

    this.data.idactividad = null;
    this.data.actividad = '';
    this.actividades = [];

    if (id == null || !item?.codigo) {
      return;
    }

    this.maestrosVbg.obtenerCatalogo(`acciones-seguimiento/padre/${item.codigo}`).subscribe({
      next: (data) => { this.actividades = data; },
      error: () => { this.actividades = []; }
    });
  }

  seleccionarActividad(id: number | null): void {
    const item = this.actividades.find((x) => x.id === id);
    this.data.idactividad = id;
    this.data.actividad = item?.nombre ?? '';
  }

  guardar(): void {
    if (!this.data.fecha || this.data.idtiposeguimiento == null || this.data.idaccion == null ||
        this.data.idactividad == null || !this.data.descripcion) {
      return;
    }

    this.dialogRef.close({ ...this.data });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) { this.data.archivo = file; }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  private cargarMaestrosSeguimiento(): void {
    this.cargandoMaestros = true;

    this.maestrosVbg.obtenerCatalogo('tipos-seguimiento').subscribe({
      next: (data) => {
        this.tiposSeguimiento = data;
        this.intentarBloquearTipoDesdeEntrada();
        this.cargandoMaestros = false;
      },
      error: () => {
        this.tiposSeguimiento = [];
        this.cargandoMaestros = false;
      }
    });

    this.maestrosVbg.obtenerCatalogo('acciones-seguimiento').subscribe({
      next: (data) => { this.acciones = data; },
      error: () => { this.acciones = []; }
    });
  }

  private intentarBloquearTipoDesdeEntrada(): void {
    if (!this.bloquearTipo || !this.data.tipoSeguimiento) {
      return;
    }

    const opcion = this.tiposSeguimiento.find((x) => x.nombre === this.data.tipoSeguimiento);
    if (opcion) {
      this.data.idtiposeguimiento = opcion.id;
    }
  }
}
