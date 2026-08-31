import { Component, Inject, OnInit, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ModalCorreoComponent } from '../modal-correo/modal-correo.component';
import { ModalTelefonoComponent } from '../modal-telefono/modal-telefono.component';
import { ListasService, MaestroDto } from '../../services/listas.service';
import { SolicitudService, UpdateSolicitudDto } from '../../services/solicitud.service';

interface CorreoRegistrado {
  tipoId?: number | null;
  tipo?: string;
  correo: string;
}

interface TelefonoRegistrado {
  tipoId?: number | null;
  tipo?: string;
  telefono: string;
}

interface ContactoInfo {
  tipoId?: number | null;
  tipo?: string | null;
  correo?: string | null;
  telefono?: string | null;
}

@Component({
    selector: 'app-modal-detalle-solicitud',
    imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
],
    templateUrl: './modal-detalle-solicitud.component.html',
    styleUrls: ['./modal-detalle-solicitud.component.scss']
})
export class ModalDetalleSolicitudComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private solicitudService = inject(SolicitudService);
  private listasService = inject(ListasService);
  private snackBar = inject(MatSnackBar);
  detalleForm!: FormGroup;
  guardando = false;

  tiposDocumento: MaestroDto[] = [];
  identidadesGenero: MaestroDto[] = [];
  cargos: MaestroDto[] = [];
  campusLista: MaestroDto[] = [];
  unidadesAdministrativas: MaestroDto[] = [];
  unidadesAcademicas: MaestroDto[] = [];
  mediosSolicitud: MaestroDto[] = [];

  correoRegistrados: CorreoRegistrado[] = [];
  telefonosRegistrados: TelefonoRegistrado[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { info: any, modo: 'editar' | 'visualizar' },
    public dialogRef: MatDialogRef<ModalDetalleSolicitudComponent>
  ) {
    this.listasService.listas$
      .pipe(takeUntilDestroyed())
      .subscribe((data) => {
        this.tiposDocumento = data.tiposDocumento;
        this.identidadesGenero = data.identidadesGenero;
        this.cargos = data.cargos;
        this.campusLista = data.campus;
        this.unidadesAdministrativas = data.unidadesAdministrativas;
        this.unidadesAcademicas = data.unidadesAcademicas;
        this.mediosSolicitud = data.medioSolicitud;
      });
  }

  get esVisualizacion(): boolean {
    return this.data.modo === 'visualizar';
  }

  ngOnInit() {
    const info = this.data?.info ?? {};
    const esIndirecta = !!(info.remitentePrimerNombre || info.remitentePrimerApellido);
    const fechaNacimiento = this.parsearFechaParaControl(info.fechaNacimiento);

    this.detalleForm = this.fb.group({
      remitentePrimerNombre: [info.remitentePrimerNombre ?? '', esIndirecta ? Validators.required : []],
      remitenteSegundoNombre: [info.remitenteSegundoNombre ?? ''],
      remitentePrimerApellido: [info.remitentePrimerApellido ?? '', esIndirecta ? Validators.required : []],
      remitenteSegundoApellido: [info.remitenteSegundoApellido ?? ''],
      remitenteCargo: [info.remitenteCargoId ?? null],
      remitenteCampus: [info.remitenteCampusId ?? null],
      remitenteUnidadAdministrativa: [info.remitenteUnidadAdministrativaId ?? null],
      remitenteUnidadAcademica: [info.remitenteUnidadAcademicaId ?? null],
      remitenteTipoDocumento: [info.remitenteTipoDocumentoId ?? null],
      remitenteNumeroDocumento: [info.remitenteNumeroDocumento ?? ''],

      tipoDocumento: [info.tipoDocumentoId ?? null],
      numeroDocumento: [info.numeroDocumento ?? ''],
      fechaNacimiento: [fechaNacimiento],
      primerNombre: [info.primerNombre ?? '', Validators.required],
      segundoNombre: [info.segundoNombre ?? ''],
      primerApellido: [info.primerApellido ?? '', Validators.required],
      segundoApellido: [info.segundoApellido ?? ''],
      identidadGenero: [info.identidadGeneroId ?? null],
      medioSolicitud: [info.medioSolicitudId ?? null, Validators.required],
      observacionesTelefono: [info.observacionesTelefono ?? ''],
      observacionesCorreo: [info.observacionesCorreo ?? '']
    });

    const correosInfo = Array.isArray(info?.correos) ? (info.correos as ContactoInfo[]) : [];
    this.correoRegistrados = correosInfo
      .filter((correo) => this.normalizarTexto(correo?.correo).length > 0)
      .map((correo) => ({
        tipoId: correo.tipoId ?? null,
        tipo: this.normalizarTexto(correo.tipo),
        correo: this.normalizarTexto(correo.correo)
      }));

    const telefonosInfo = Array.isArray(info?.telefonos) ? (info.telefonos as ContactoInfo[]) : [];
    this.telefonosRegistrados = telefonosInfo
      .filter((telefono) => this.normalizarTexto(telefono?.telefono).length > 0)
      .map((telefono) => ({
        tipoId: telefono.tipoId ?? null,
        tipo: this.normalizarTexto(telefono.tipo),
        telefono: this.normalizarTexto(telefono.telefono)
      }));

    if (this.data.modo === 'visualizar') {
      this.detalleForm.disable();
    }
  }

  get tieneRemitente(): boolean {
    const info = this.data?.info ?? {};
    return !!(info.remitentePrimerNombre || info.remitentePrimerApellido);
  }

  abrirModalCorreo(): void {
    const ref = this.dialog.open(ModalCorreoComponent, { width: '600px', disableClose: true });
    ref.afterClosed().subscribe(result => {
      if (result) this.correoRegistrados = [...this.correoRegistrados, result];
    });
  }

  abrirModalTelefono(): void {
    const ref = this.dialog.open(ModalTelefonoComponent, { width: '600px', disableClose: true });
    ref.afterClosed().subscribe(result => {
      if (result) this.telefonosRegistrados = [...this.telefonosRegistrados, result];
    });
  }

  eliminarCorreo(i: number): void {
    this.correoRegistrados.splice(i, 1);
    this.correoRegistrados = [...this.correoRegistrados];
  }

  eliminarTelefono(i: number): void {
    this.telefonosRegistrados.splice(i, 1);
    this.telefonosRegistrados = [...this.telefonosRegistrados];
  }

  guardar(): void {
    if (this.detalleForm.invalid || this.guardando) {
      return;
    }

    const solicitudId = this.data?.info?.solicitudId;
    if (!solicitudId) {
      this.snackBar.open('No fue posible identificar la solicitud a actualizar.', 'Cerrar', {
        duration: 5000,
        panelClass: ['snack-error']
      });
      return;
    }

    this.guardando = true;

    this.solicitudService.actualizar(solicitudId, this.construirRequestActualizacion()).subscribe({
      next: (solicitudActualizada) => {
        this.guardando = false;
        this.snackBar.open(`Solicitud ${solicitudActualizada.codigo} actualizada correctamente.`, 'Cerrar', {
          duration: 5000,
          panelClass: ['snack-success']
        });
        this.dialogRef.close(solicitudActualizada);
      },
      error: (error) => {
        console.error('Error al actualizar solicitud:', error);
        this.guardando = false;
        this.snackBar.open(this.obtenerMensajeError(error), 'Cerrar', {
          duration: 6000,
          panelClass: ['snack-error']
        });
      }
    });
  }

  private construirRequestActualizacion(): UpdateSolicitudDto {
    const formValue = this.detalleForm.getRawValue();
    return {
      primerNombre: this.normalizarTexto(formValue.primerNombre),
      segundoNombre: this.normalizarTextoOpcional(formValue.segundoNombre),
      primerApellido: this.normalizarTexto(formValue.primerApellido),
      segundoApellido: this.normalizarTextoOpcional(formValue.segundoApellido),
      tipoDocumentoId: formValue.tipoDocumento ?? null,
      numeroDocumento: this.normalizarTextoOpcional(formValue.numeroDocumento),
      fechaNacimiento: this.formatearFecha(formValue.fechaNacimiento),
      identidadGeneroId: formValue.identidadGenero ?? null,
      correos: this.correoRegistrados
        .filter((correo) => correo.correo && correo.tipoId != null)
        .map((correo) => ({
        tipoId: correo.tipoId as number,
        tipo: this.normalizarTextoOpcional(correo.tipo),
        correo: this.normalizarTexto(correo.correo)
      })),
      telefonos: this.telefonosRegistrados
        .filter((telefono) => telefono.telefono && telefono.tipoId != null)
        .map((telefono) => ({
        tipoId: telefono.tipoId as number,
        tipo: this.normalizarTextoOpcional(telefono.tipo),
        telefono: this.normalizarTexto(telefono.telefono)
      })),
      remitentePrimerNombre: this.tieneRemitente ? this.normalizarTextoOpcional(formValue.remitentePrimerNombre) : null,
      remitenteSegundoNombre: this.tieneRemitente ? this.normalizarTextoOpcional(formValue.remitenteSegundoNombre) : null,
      remitentePrimerApellido: this.tieneRemitente ? this.normalizarTextoOpcional(formValue.remitentePrimerApellido) : null,
      remitenteSegundoApellido: this.tieneRemitente ? this.normalizarTextoOpcional(formValue.remitenteSegundoApellido) : null,
      remitenteCargoId: this.tieneRemitente ? (formValue.remitenteCargo ?? null) : null,
      remitenteCampusId: this.tieneRemitente ? (formValue.remitenteCampus ?? null) : null,
      remitenteUnidadAdministrativaId: this.tieneRemitente ? (formValue.remitenteUnidadAdministrativa ?? null) : null,
      remitenteUnidadAcademicaId: this.tieneRemitente ? (formValue.remitenteUnidadAcademica ?? null) : null,
      remitenteTipoDocumentoId: this.tieneRemitente ? (formValue.remitenteTipoDocumento ?? null) : null,
      remitenteNumeroDocumento: this.tieneRemitente ? this.normalizarTextoOpcional(formValue.remitenteNumeroDocumento) : null,
      observacionesTelefono: this.normalizarTextoOpcional(formValue.observacionesTelefono),
      observacionesCorreo: this.normalizarTextoOpcional(formValue.observacionesCorreo),
      medioSolicitudId: formValue.medioSolicitud ?? null
    };
  }

  private formatearFecha(valor: unknown): string | null {
    if (!valor) {
      return null;
    }

    let dateObj: Date | null = null;

    if (valor instanceof Date) {
      dateObj = valor;
    } else {
      const strVal = this.normalizarTexto(String(valor));
      if (!strVal) return null;
      
      // If it is already in dd/MM/yyyy format
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(strVal)) {
        return strVal;
      }
      
      // If it is in yyyy-MM-dd format
      if (/^\d{4}-\d{2}-\d{2}/.test(strVal)) {
        const parts = strVal.slice(0, 10).split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      
      const parsed = new Date(strVal);
      if (!Number.isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }

    if (dateObj) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }

    return String(valor);
  }

  private parsearFechaParaControl(valor: unknown): Date | null {
    if (!valor) {
      return null;
    }

    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? null : valor;
    }

    const texto = this.normalizarTexto(valor);
    if (!texto) {
      return null;
    }

    // Parseo estable para evitar desfases por zona horaria cuando llega YYYY-MM-DD.
    const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      const fecha = new Date(year, month, day);
      return Number.isNaN(fecha.getTime()) ? null : fecha;
    }

    const parseada = new Date(texto);
    return Number.isNaN(parseada.getTime()) ? null : parseada;
  }

  private normalizarTexto(valor: unknown): string {
    return String(valor ?? '').trim();
  }

  private normalizarTextoOpcional(valor: unknown): string | null {
    const texto = this.normalizarTexto(valor);
    return texto ? texto : null;
  }

  private obtenerMensajeError(error: unknown): string {
    const httpError = error as {
      error?: {
        message?: string;
        errors?: string[];
      };
    };

    if (Array.isArray(httpError?.error?.errors) && httpError.error.errors.length > 0) {
      return httpError.error.errors.join(' ');
    }

    if (httpError?.error?.message) {
      return httpError.error.message;
    }

    return 'No fue posible actualizar la solicitud.';
  }
}