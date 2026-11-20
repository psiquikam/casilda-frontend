import { MensajeErrorPipe } from '../../shared/mensaje-error.pipe';
import { SpybSoloNumerosDirective, SpybSoloLetrasDirective } from '../../shared/spyb-restricciones.directive';
import { ahoraLocal, fechaHoraNoFutura, noSoloEspacios, posteriorA, revalidarAlCambiar, textoRequerido, validadoresCedula, validadoresNombre } from '../../shared/spyb-validadores';
import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SpybAcompanamientoService } from '../../services/spyb-acompanamiento.service';
import { OrdenAcompanamiento } from '../../models/spyb.models';
import { CATALOGO_INCIDENTES_ACOMPANAMIENTO } from '../../models/spyb-catalogos';
import { RegistrarInformeAcompanamientoRequest } from '../../models/spyb-dtos';

@Component({
  selector: 'app-ejecutar-orden-vigilante',
  standalone: true,
  imports: [
    MensajeErrorPipe, SpybSoloNumerosDirective, SpybSoloLetrasDirective,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule
],
  templateUrl: './ejecutar-orden-vigilante.component.html',
  styleUrls: ['./ejecutar-orden-vigilante.component.scss']
})
export class EjecutarOrdenVigilanteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly acompService = inject(SpybAcompanamientoService);
  private readonly snackBar = inject(MatSnackBar);

  incidentesCatalogo = CATALOGO_INCIDENTES_ACOMPANAMIENTO;

  tokenAcceso = '';
  cargando = true;
  orden: OrdenAcompanamiento | null = null;
  errorCarga = false;
  guardandoInforme = false;
  informeCompletado = false;

  readonly ahora = ahoraLocal();

  form: FormGroup = this.fb.group({
    cedulaVigilante: ['', validadoresCedula],
    vigilantePrimerNombre: ['', validadoresNombre(true)],
    vigilanteSegundoNombre: ['', validadoresNombre(false)],
    vigilantePrimerApellido: ['', validadoresNombre(true)],
    vigilanteSegundoApellido: ['', validadoresNombre(false)],
    lugarInicio: ['', textoRequerido(3, 150)],
    lugardestino: ['', textoRequerido(3, 150)],
    fechaHoraInicio: ['', [Validators.required, fechaHoraNoFutura]],
    fechaHoraFin: ['', [Validators.required, fechaHoraNoFutura, posteriorA('fechaHoraInicio', 'finAnterior')]],
    identificoAgresor: [false],
    lugarHoraAgresor: ['', [Validators.maxLength(200)]],
    descripcionAgresor: ['', [Validators.maxLength(1000)]],
    ocurrioIncidente: [false],
    tipoIncidente: [null],
    descripcionIncidente: ['', [Validators.maxLength(1000)]],
    actuacionAdoptada: ['', [Validators.maxLength(1000)]],
    camarasDisponibles: [false],
    observacionesCamaras: ['', [Validators.maxLength(500)]],
    novedadesAdicionales: ['', [Validators.maxLength(1000)]]
  });

  constructor() {
    revalidarAlCambiar(this.form, 'fechaHoraInicio', 'fechaHoraFin');
    // Los detalles solo se exigen cuando la persona marca que ocurrieron.
    this.exigirSi('identificoAgresor', ['lugarHoraAgresor', 'descripcionAgresor'], 1000);
    this.exigirSi('ocurrioIncidente', ['tipoIncidente', 'descripcionIncidente', 'actuacionAdoptada'], 1000);
    this.exigirSi('camarasDisponibles', ['observacionesCamaras'], 500);
  }

  private exigirSi(interruptor: string, campos: string[], max: number): void {
    const aplicar = (activo: boolean): void => {
      for (const nombre of campos) {
        const control = this.form.get(nombre);
        if (!control) continue;
        control.setValidators(activo ? [Validators.required, noSoloEspacios, Validators.maxLength(max)] : [Validators.maxLength(max)]);
        control.updateValueAndValidity({ emitEvent: false });
      }
    };
    this.form.get(interruptor)?.valueChanges.subscribe(aplicar);
  }

  ngOnInit(): void {
    this.tokenAcceso = this.route.snapshot.paramMap.get('tokenAcceso') || 'token-orden-demo-001';
    this.cargarOrden();
  }

  cargarOrden(): void {
    this.cargando = true;
    this.errorCarga = false;
    this.acompService.obtenerOrdenPorToken(this.tokenAcceso).subscribe({
      next: (res) => {
        this.orden = res;
        this.cargando = false;
        this.form.patchValue({
          lugarInicio: res.lugarOrigen,
          lugardestino: res.lugarDestino
        });
      },
      error: () => {
        this.cargando = false;
        this.errorCarga = true;
      }
    });
  }

  enviarInforme(): void {
    if (this.form.invalid || !this.orden) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardandoInforme = true;
    const {
      vigilantePrimerNombre, vigilanteSegundoNombre, vigilantePrimerApellido, vigilanteSegundoApellido,
      ...resto
    } = this.form.value;
    const req: RegistrarInformeAcompanamientoRequest = {
      ...resto,
      vigilanteResponsable: [vigilantePrimerNombre, vigilanteSegundoNombre, vigilantePrimerApellido, vigilanteSegundoApellido]
        .map((x: string) => (x ?? '').trim()).filter(Boolean).join(' '),
      idOrden: this.orden.id,
      idRegistroSeguridad: this.orden.idRegistroOrigen
    };

    this.acompService.registrarInforme(this.orden.codigoOrden, req).subscribe({
      next: () => {
        this.guardandoInforme = false;
        this.informeCompletado = true;
        this.snackBar.open('Informe de acompañamiento radicado con éxito', 'Aceptar', { duration: 5000 });
      },
      error: () => {
        this.guardandoInforme = false;
        this.snackBar.open('Error al radicar informe de acompañamiento', 'Cerrar', { duration: 4000 });
      }
    });
  }
}

