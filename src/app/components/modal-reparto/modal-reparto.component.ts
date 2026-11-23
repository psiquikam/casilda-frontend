import { Component, Inject, OnInit, inject } from '@angular/core';

import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SolicitudService, GrupoProfesionalDto } from '../../services/solicitud.service';
import { MaestroDto } from '../../services/listas.service';
import { NotificacionService } from '../../core/a11y/notificacion.service';

function fechaLocalActual(): string {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

@Component({
    selector: 'app-reparto-modal',
    templateUrl: './modal-reparto.component.html',
    styleUrls: ['./modal-reparto.component.scss'],
    imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
]
})
export class RepartoModalComponent implements OnInit {
  private readonly notificacion = inject(NotificacionService);
  repartoForm: FormGroup;
  gruposProfesionales: GrupoProfesionalDto[] = [];

  tiposAsignacion: MaestroDto[] = [];
  tiposServicio: MaestroDto[] = [];
  cargandoCatalogos = false;
  guardando = false;

  get gruposProfesionalesDisponibles(): GrupoProfesionalDto[] {
    const idServicio = this.repartoForm.get('idTipoServicio')?.value;
    return this.gruposProfesionales.filter((grupo) => {
      if (grupo.activo === false) return false;
      // Si el backend ya indica el tipo de servicio, filtramos por él;
      // si no viene el campo (compatibilidad), mostramos todos los activos.
      if (idServicio != null && grupo.idTipoServicio != null) {
        return grupo.idTipoServicio === idServicio;
      }
      return true;
    });
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RepartoModalComponent>,
    private solicitudService: SolicitudService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.repartoForm = this.fb.group({
      idTipoAsignacion: [null, Validators.required],
      fechaReparto: [fechaLocalActual()],
      idTipoServicio: [null, Validators.required],
      grupoProfesionalId: [{ value: null, disabled: true }, Validators.required],
      observaciones: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]]
    });
    this.repartoForm.get('idTipoServicio')?.valueChanges.subscribe((idTipoServicio) => {
      const grupoControl = this.repartoForm.get('grupoProfesionalId');
      grupoControl?.reset(null, { emitEvent: false });
      if (idTipoServicio == null) {
        grupoControl?.disable({ emitEvent: false });
      } else {
        grupoControl?.enable({ emitEvent: false });
      }
    });
  }

  ngOnInit() {
    this.cargandoCatalogos = true;
    this.repartoForm.disable({ emitEvent: false });
    forkJoin({
      tiposAsignacion: this.solicitudService.listarTiposAsignacion().pipe(
        catchError((error) => {
          this.notificacion.error('No fue posible cargar los tipos de reparto.', error);
          return of([] as MaestroDto[]);
        })
      ),
      tiposServicio: this.solicitudService.listarTiposServicio().pipe(
        catchError((error) => {
          this.notificacion.error('No fue posible cargar los tipos de servicio.', error);
          return of([] as MaestroDto[]);
        })
      ),
      grupos: this.solicitudService.listarGruposProfesionales().pipe(
        catchError((error) => {
          this.notificacion.error('No fue posible cargar los profesionales o duplas.', error);
          return of([] as GrupoProfesionalDto[]);
        })
      )
    }).subscribe({
      next: ({ tiposAsignacion, tiposServicio, grupos }) => {
        this.tiposAsignacion = tiposAsignacion;
        this.tiposServicio = tiposServicio;
        this.gruposProfesionales = grupos;
        this.cargandoCatalogos = false;
        if (tiposAsignacion.length && tiposServicio.length && this.gruposProfesionalesDisponibles.length) {
          this.repartoForm.enable({ emitEvent: false });
          this.repartoForm.get('grupoProfesionalId')?.disable({ emitEvent: false });
        } else {
          this.notificacion.error('El reparto está bloqueado porque faltan catálogos o profesionales activos.');
        }
      },
      error: (error) => {
        this.cargandoCatalogos = false;
        this.tiposAsignacion = [];
        this.tiposServicio = [];
        this.gruposProfesionales = [];
        this.notificacion.error('No fue posible cargar las opciones de reparto. Cierre el diálogo e intente nuevamente.', error);
      }
    });
  }

  guardar() {
    if (this.repartoForm.invalid || this.guardando || this.cargandoCatalogos) {
      this.repartoForm.markAllAsTouched();
      return;
    }

    const solicitudId = Number(this.data?.solicitudId);
    if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
      this.notificacion.error('No fue posible identificar la solicitud que se desea repartir.');
      return;
    }

    this.guardando = true;
    const reparto = this.repartoForm.getRawValue();
    this.repartoForm.disable({ emitEvent: false });
    this.solicitudService.asignar(solicitudId, reparto).subscribe({
      next: (solicitudActualizada) => {
        this.guardando = false;
        this.notificacion.exito('El reparto se guardó correctamente.');
        this.dialogRef.close(solicitudActualizada);
      },
      error: (error) => {
        this.guardando = false;
        this.repartoForm.enable({ emitEvent: false });
        this.notificacion.error('No fue posible guardar el reparto. Revise los datos e intente nuevamente.', error);
      }
    });
  }

  cerrar() {
    if (this.guardando) return;
    this.dialogRef.close();
  }
}
