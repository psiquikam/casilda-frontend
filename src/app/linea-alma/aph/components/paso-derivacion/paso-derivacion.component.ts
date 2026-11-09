import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ConsentimientoInformadoComponent } from '../../../shared/components/consentimiento-informado/consentimiento-informado.component';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { ConsentimientoDto, DerivacionPsicologiaDto } from '../../../shared/types/alma-dto';
import { AtencionAph, AtencionesAphService } from '../../services/atenciones-aph.service';

/**
 * «¿Desea remisión a Psicología?» y derivación con consentimiento (H-1.4, `RF-ALMA-004`,
 * `RF-ALMA-APH-003`, `RN-ALMA-02`; frontera **F1**).
 *
 * - **Sí:** se captura el consentimiento con `ConsentimientoInformado` (F5) y **solo entonces**
 *   se habilita «Derivar». Sin consentimiento no hay derivación: el 422 `CONSENTIMIENTO_REQUERIDO`
 *   del Backend también se muestra.
 * - **No:** la atención sigue `EN_GESTION_APH`; se pueden gestionar rutas o cerrarla.
 *
 * Tras derivar muestra el estado `PENDIENTE_PSICOLOGIA` y el plazo que entrega el servidor
 * (`sla.venceEn`): el front no calcula plazos con el reloj del navegador.
 */
@Component({
  selector: 'app-paso-derivacion',
  imports: [DatePipe, RouterLink, MatIconModule, MatRadioModule, ConsentimientoInformadoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="der" aria-labelledby="der-titulo">
      <h3 id="der-titulo" class="der__titulo">Remisión a Psicología</h3>

      @if (derivada(); as r) {
        <div class="casilda-alerta casilda-alerta--exito" role="status">
          <mat-icon aria-hidden="true">check_circle</mat-icon>
          <div>
            <p class="der__fuerte">La atención {{ r.idAtencion }} quedó en la cola de Psicología.</p>
            <ul class="der__datos">
              <li>Estado: Esperando a Psicología</li>
              <li>Triaje registrado: {{ r.triaje }}</li>
              <li>Primer contacto, como máximo, hasta el {{ r.sla.venceEn | date: "EEEE d 'de' MMMM, h:mm a" }} ({{ r.sla.horasLimite }} h).</li>
            </ul>
            <a class="boton boton--secundario" [routerLink]="['/linea-alma/aph/atenciones', r.idAtencion]">Ver el detalle de la atención</a>
          </div>
        </div>
      } @else if (atencion().estado === 'PENDIENTE_PSICOLOGIA') {
        <p class="casilda-alerta" role="status">
          <mat-icon aria-hidden="true">hourglass_top</mat-icon>
          <span>Esta atención ya fue derivada y espera a Psicología.</span>
        </p>
      } @else {
        <fieldset class="der__pregunta" [disabled]="soloLectura()">
          <legend>¿La persona desea remisión a Psicología?</legend>
          <mat-radio-group [value]="respuesta()" (change)="respuesta.set($event.value)" [disabled]="soloLectura()" aria-label="¿La persona desea remisión a Psicología?">
            <mat-radio-button value="SI">Sí, desea atención psicológica</mat-radio-button>
            <mat-radio-button value="NO">No, por ahora no</mat-radio-button>
          </mat-radio-group>
        </fieldset>

        @if (respuesta() === 'SI') {
          @if (!tieneTriaje()) {
            <p class="casilda-alerta casilda-alerta--precaucion" role="status">
              <mat-icon aria-hidden="true">info</mat-icon>
              <span>Para derivar a Psicología primero registre el triaje en el paso anterior: de él depende el plazo de primer contacto.</span>
            </p>
          }
          <app-consentimiento-informado [(valor)]="consentimiento" />
          <div>
            <button type="button" class="boton boton--primario" [disabled]="!puedeDerivar() || enviando() || soloLectura()" (click)="derivar()">
              Derivar a Psicología
            </button>
            @if (!consentimiento()) {
              <p class="der__nota">«Derivar» se habilita cuando el consentimiento queda registrado.</p>
            }
          </div>
        }

        @if (respuesta() === 'NO') {
          @if (atencion().aceptaPsicologia === false) {
            <p class="casilda-alerta" role="status">
              <mat-icon aria-hidden="true">info</mat-icon>
              <span>
                Quedó registrado que la persona no desea remisión. La atención sigue en gestión: puede activar rutas o cerrarla desde
                <a [routerLink]="['/linea-alma/aph/atenciones', atencion().idAtencion]">el detalle de la atención</a>.
              </span>
            </p>
          } @else {
            <div>
              <button type="button" class="boton boton--secundario" [disabled]="enviando() || soloLectura()" (click)="registrarNo()">
                Registrar que no desea remisión
              </button>
            </div>
          }
        }
      }
    </section>
  `,
  styles: `
    .der { display: flex; flex-direction: column; gap: var(--space-4); }
    .der__titulo { margin: 0; font-size: var(--font-size-xl); }
    .der__pregunta { border: 0; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
    .der__pregunta legend { font-weight: 700; margin-bottom: var(--space-2); }
    .der__pregunta mat-radio-group { display: flex; flex-direction: column; }
    .der__fuerte { margin: 0 0 var(--space-2); font-weight: 700; }
    .der__datos { margin: 0 0 var(--space-3); padding-left: var(--space-5); }
    .der__nota { margin: var(--space-2) 0 0; color: var(--color-text-secondary); font-size: var(--font-size-sm); }
  `
})
export class PasoDerivacionComponent {
  private readonly servicio = inject(AtencionesAphService);
  private readonly notificacion = inject(NotificacionService);

  readonly atencion = input.required<AtencionAph>();
  readonly soloLectura = input(false);
  readonly actualizada = output<AtencionAph>();
  readonly conflicto = output<void>();
  /** Se emite tras derivar, con la respuesta de F1. */
  readonly derivacionRealizada = output<DerivacionPsicologiaDto>();

  protected readonly respuesta = signal<'SI' | 'NO' | null>(null);
  protected readonly consentimiento = signal<ConsentimientoDto | null>(null);
  protected readonly enviando = signal(false);
  protected readonly derivada = signal<DerivacionPsicologiaDto | null>(null);
  protected readonly tieneTriaje = computed(() => !!this.atencion().triaje);
  protected readonly puedeDerivar = computed(() => this.tieneTriaje() && this.consentimiento()?.otorgado === true);

  constructor() {
    // Rehidrata la respuesta si la atención ya la tenía guardada (retomar borrador, o tras registrar «No»).
    effect(() => {
      const aceptada = this.atencion().aceptaPsicologia;
      if (aceptada !== null) this.respuesta.set(aceptada ? 'SI' : 'NO');
    });
  }

  protected derivar(): void {
    const consentimiento = this.consentimiento();
    if (!this.puedeDerivar() || !consentimiento) return;
    this.enviando.set(true);
    this.servicio.derivarAPsicologia(this.atencion().idAtencion, this.atencion().version, consentimiento).subscribe({
      next: (resultado) => {
        this.enviando.set(false);
        this.derivada.set(resultado);
        this.notificacion.exito('La atención se derivó a Psicología.');
        this.derivacionRealizada.emit(resultado);
        this.recargar();
      },
      error: (e: ErrorAlma) => this.fallo(e)
    });
  }

  protected registrarNo(): void {
    this.enviando.set(true);
    this.servicio.actualizar(this.atencion().idAtencion, { version: this.atencion().version, aceptaPsicologia: false }).subscribe({
      next: (atencion) => {
        this.enviando.set(false);
        this.notificacion.info('Quedó registrado que la persona no desea remisión a Psicología.');
        this.actualizada.emit(atencion);
      },
      error: (e: ErrorAlma) => this.fallo(e)
    });
  }

  private recargar(): void {
    this.servicio.obtener(this.atencion().idAtencion).subscribe({
      next: (atencion) => this.actualizada.emit(atencion),
      error: () => undefined
    });
  }

  private fallo(error: ErrorAlma): void {
    this.enviando.set(false);
    if (error.tipo === 'conflicto') this.conflicto.emit();
    this.notificacion.error(error.mensaje, error);
  }
}
