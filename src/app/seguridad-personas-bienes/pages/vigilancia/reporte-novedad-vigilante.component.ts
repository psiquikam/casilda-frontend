import { MensajeErrorPipe } from '../../shared/mensaje-error.pipe';
import { SpybSoloNumerosDirective, SpybSoloLetrasDirective } from '../../shared/spyb-restricciones.directive';
import { Component, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SpybRegistroService } from '../../services/spyb-registro.service';
import { SpybConsecutivoBadgeComponent } from '../../components/spyb-consecutivo-badge.component';
import {
  CATALOGO_ROLES_PERSONA,
  CATALOGO_TIPOS_REGISTRO
} from '../../models/spyb-catalogos';
import { ListasService, MaestroDto } from '../../../services/listas.service';
import { ControlDocumento, textoRequerido, validadoresCedula, validadoresNombre, validadoresTelefono } from '../../shared/spyb-validadores';
import { CrearRegistroSeguridadRequest } from '../../models/spyb-dtos';

import { SpybAvisoDemoComponent } from '../../shared/spyb-aviso-demo.component';

@Component({
  selector: 'app-reporte-novedad-vigilante',
  standalone: true,
  imports: [
    SpybAvisoDemoComponent,
    MensajeErrorPipe, SpybSoloNumerosDirective, SpybSoloLetrasDirective,
    MatTooltipModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    SpybConsecutivoBadgeComponent
],
  templateUrl: './reporte-novedad-vigilante.component.html',
  styleUrls: ['./reporte-novedad-vigilante.component.scss']
})
export class ReporteNovedadVigilanteComponent {
  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  private readonly listasService = inject(ListasService);
  private readonly fb = inject(FormBuilder);
  private readonly registroService = inject(SpybRegistroService);
  private readonly snackBar = inject(MatSnackBar);

  tiposRegistro = CATALOGO_TIPOS_REGISTRO;
  rolesPersona = CATALOGO_ROLES_PERSONA;
  // Catálogos de la plataforma (los mismos que usa el formulario de Equipo de atención).
  campus: MaestroDto[] = [];
  tiposDocumento: MaestroDto[] = [];

  guardando = false;
  consecutivoGenerado: string | null = null;

  form: FormGroup = this.fb.group({
    tipoRegistroCodigo: [null, [Validators.required]],
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
    // Identificación obligatoria del supervisor (RF-SPB-006, RF-SPB-009)
    cedulaSupervisor: ['', validadoresCedula],
    supervisorPrimerNombre: ['', validadoresNombre(true)],
    supervisorSegundoNombre: ['', validadoresNombre(false)],
    supervisorPrimerApellido: ['', validadoresNombre(true)],
    supervisorSegundoApellido: ['', validadoresNombre(false)],
    cargoSupervisor: ['', textoRequerido(3, 80)]
  });

  /** Número de documento según el tipo elegido (longitud y formato). */
  readonly documento = new ControlDocumento(this.form, 'tipoIdentificacionId', 'numeroDocumento', () => this.tiposDocumento);

  private readonly cargaCatalogos = this.listasService.listas$.pipe(takeUntilDestroyed()).subscribe((listas) => {
    this.tiposDocumento = listas.tiposDocumento;
    this.campus = listas.campus;
    this.documento.actualizar();
  });

  private unir(...partes: (string | undefined)[]): string {
    return partes.map((p) => (p ?? '').trim()).filter(Boolean).join(' ');
  }

  enviarReporte(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const v = this.form.value;
    const req: CrearRegistroSeguridadRequest = {
      tipoRegistroCodigo: v.tipoRegistroCodigo,
      canalRecepcionCodigo: 'REVISION_INTERNA',
      fechaHoraHechos: new Date().toISOString(),
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
        nombreCompleto: this.unir(v.primerNombre, v.segundoNombre, v.primerApellido, v.segundoApellido),
        telefono: v.telefono
      },
      reportante: {
        cedula: v.cedulaSupervisor,
        nombre: this.unir(v.supervisorPrimerNombre, v.supervisorSegundoNombre, v.supervisorPrimerApellido, v.supervisorSegundoApellido),
        cargo: v.cargoSupervisor
      },
      consentimientoRutaVioleta: {
        lecturaConsentimiento: false,
        autorizaActivacionRuta: false
      }
    };

    this.registroService.crearRegistroRestringido(req).subscribe({
      next: (res) => {
        this.guardando = false;
        this.consecutivoGenerado = res.consecutivo;
        this.snackBar.open(`Reporte enviado con consecutivo ${res.consecutivo}`, 'Aceptar', { duration: 6000 });
        if (this.formDir) {
          this.formDir.resetForm();
        } else {
          this.form.reset();
        }
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('Error al radicar el reporte', 'Cerrar', { duration: 4000 });
      }
    });
  }
}

