import { MensajeErrorPipe } from '../../shared/mensaje-error.pipe';
import { SpybSoloNumerosDirective, SpybSoloLetrasDirective } from '../../shared/spyb-restricciones.directive';
import { Component, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { SpybRegistroService } from '../../services/spyb-registro.service';
import { SpybConsecutivoBadgeComponent } from '../../components/spyb-consecutivo-badge.component';
import { ModalNuevaOrdenComponent } from '../../components/modal-nueva-orden.component';
import {
  CATALOGO_CANALES_RECEPCION,
  CATALOGO_ROLES_PERSONA,
  CATALOGO_TIPOS_REGISTRO
} from '../../models/spyb-catalogos';
import {
  ConsultaMedidaActivaResponse
} from '../../models/spyb.models';
import { ListasService, MaestroDto } from '../../../services/listas.service';
import { ControlDocumento, hoyLocal, textoRequerido, validadoresCorreo, validadoresNombre, validadoresTelefono } from '../../shared/spyb-validadores';
import { CrearRegistroSeguridadRequest } from '../../models/spyb-dtos';

@Component({
  selector: 'app-central-monitoreo',
  standalone: true,
  imports: [
    MensajeErrorPipe, SpybSoloNumerosDirective, SpybSoloLetrasDirective,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatDialogModule,
    SpybConsecutivoBadgeComponent
],
  templateUrl: './central-monitoreo.component.html',
  styleUrls: ['./central-monitoreo.component.scss']
})
export class CentralMonitoreoComponent {
  readonly demo = environment.seguridadPyB?.mocks ?? true;
  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  private readonly listasService = inject(ListasService);
  private readonly fb = inject(FormBuilder);
  private readonly registroService = inject(SpybRegistroService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  canales = CATALOGO_CANALES_RECEPCION;
  tiposRegistro = CATALOGO_TIPOS_REGISTRO;
  rolesPersona = CATALOGO_ROLES_PERSONA;
  // Catálogos de la plataforma (los mismos que usa el formulario de Equipo de atención).
  campus: MaestroDto[] = [];
  tiposDocumento: MaestroDto[] = [];
  vinculos: MaestroDto[] = [];
  readonly hoy = hoyLocal();

  // Formulario Consulta Medidas
  docConsulta = '';
  readonly regexDocConsulta = /^[0-9]{5,20}$/;
  get docConsultaValido(): boolean {
    return this.regexDocConsulta.test(this.docConsulta.trim());
  }
  consultandoMedidas = false;
  resultadoConsultaMedidas: ConsultaMedidaActivaResponse | null = null;
  haConsultado = false;

  // Formulario Registro Recepción
  formRecepcion: FormGroup = this.fb.group({
    tipoRegistroCodigo: [null, [Validators.required]],
    canalRecepcionCodigo: [null, [Validators.required]],
    fechaHoraHechos: [''],
    campusId: [null, [Validators.required]],
    lugarHechos: ['', textoRequerido(3, 200)],
    descripcionHechos: ['', textoRequerido(10, 2000)],
    rolPersonaCodigo: [null, [Validators.required]],
    // Datos persona atendida
    tipoIdentificacionId: [null, [Validators.required]],
    numeroDocumento: ['', [Validators.required]],
    primerNombre: ['', validadoresNombre(true)],
    segundoNombre: ['', validadoresNombre(false)],
    primerApellido: ['', validadoresNombre(true)],
    segundoApellido: ['', validadoresNombre(false)],
    telefono: ['', validadoresTelefono],
    correo: ['', validadoresCorreo],
    vinculoUdeAId: [null],
    // Funcionario reportante
    cedulaReportante: ['71987654', [Validators.required]],
    nombreReportante: ['Operador central 01', [Validators.required]],
    cargoReportante: ['Operador/a Central de monitoreo'],
    // Consentimiento Ruta Violeta
    lecturaConsentimiento: [false],
    autorizaActivacionRuta: [false]
  });

  /** Número de documento según el tipo elegido (longitud y formato). */
  readonly documento = new ControlDocumento(this.formRecepcion, 'tipoIdentificacionId', 'numeroDocumento', () => this.tiposDocumento);

  private readonly cargaCatalogos = this.listasService.listas$.pipe(takeUntilDestroyed()).subscribe((listas) => {
    this.tiposDocumento = listas.tiposDocumento;
    this.campus = listas.campus;
    this.documento.actualizar();
  });

  private readonly cargaVinculos = this.listasService.obtenerMaestro('vinculos-udea').pipe(takeUntilDestroyed()).subscribe((v) => {
    this.vinculos = v;
  });

  guardandoRegistro = false;
  ultimoRegistroCreado: { consecutivo: string; id: number } | null = null;

  buscarMedidas(): void {
    if (!this.docConsulta.trim()) return;
    this.consultandoMedidas = true;
    this.haConsultado = true;
    this.registroService.consultarMedidaActiva(this.docConsulta.trim()).subscribe({
      next: (resp) => {
        this.resultadoConsultaMedidas = resp;
        this.consultandoMedidas = false;
      },
      error: () => {
        this.consultandoMedidas = false;
        this.snackBar.open('Error al consultar medidas activas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  generarOrdenDesdeMedida(medida: unknown): void {
    const dialogRef = this.dialog.open(ModalNuevaOrdenComponent, {
      width: '650px',
      data: {
        idCaso: (medida as { idCaso: number }).idCaso,
        idMedida: (medida as { idMedida: number }).idMedida
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open(`Orden ${res.codigoOrden} generada con éxito`, 'Aceptar', { duration: 4000 });
      }
    });
  }

  registrarRecepcion(): void {
    if (this.formRecepcion.invalid) {
      this.formRecepcion.markAllAsTouched();
      return;
    }

    this.guardandoRegistro = true;
    const v = this.formRecepcion.value;
    const req: CrearRegistroSeguridadRequest = {
      tipoRegistroCodigo: v.tipoRegistroCodigo,
      canalRecepcionCodigo: v.canalRecepcionCodigo,
      fechaHoraHechos: v.fechaHoraHechos ? new Date(v.fechaHoraHechos).toISOString() : new Date().toISOString(),
      campusId: v.campusId,
      lugarHechos: v.lugarHechos,
      descripcionHechos: v.descripcionHechos,
      rolPersonaCodigo: v.rolPersonaCodigo,
      persona: {
        tipoIdentificacionId: v.tipoIdentificacionId,
        numeroDocumento: v.numeroDocumento,
        primerNombre: v.primerNombre,
        segundoNombre: v.segundoNombre,
        primerApellido: v.primerApellido,
        segundoApellido: v.segundoApellido,
        nombreCompleto: [v.primerNombre, v.segundoNombre, v.primerApellido, v.segundoApellido]
          .map((p: string) => (p ?? '').trim()).filter(Boolean).join(' '),
        telefono: v.telefono,
        correo: v.correo,
        vinculoUdeAId: v.vinculoUdeAId
      },
      reportante: {
        cedula: v.cedulaReportante,
        nombre: v.nombreReportante,
        cargo: v.cargoReportante
      },
      consentimientoRutaVioleta: {
        lecturaConsentimiento: v.lecturaConsentimiento,
        autorizaActivacionRuta: v.autorizaActivacionRuta,
        funcionarioLectura: v.nombreReportante,
        fechaHora: new Date().toISOString()
      }
    };

    this.registroService.crearRegistro(req).subscribe({
      next: (res) => {
        this.guardandoRegistro = false;
        this.ultimoRegistroCreado = { consecutivo: res.consecutivo, id: res.id };
        this.snackBar.open(`Actuación registrada con consecutivo ${res.consecutivo}`, 'Aceptar', { duration: 5000 });
        const valoresIniciales = {
          cedulaReportante: '71987654',
          nombreReportante: 'Operador central 01',
          cargoReportante: 'Operador/a central de monitoreo',
          lecturaConsentimiento: false,
          autorizaActivacionRuta: false
        };
        if (this.formDir) {
          this.formDir.resetForm(valoresIniciales);
        } else {
          this.formRecepcion.reset(valoresIniciales);
        }
      },
      error: () => {
        this.guardandoRegistro = false;
        this.snackBar.open('Error al registrar actuación en el sistema', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
