import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuditoriaAlmaService } from '../../../aph/services/auditoria-alma.service';
import { AuditoriaEventoDto } from '../../types/alma-dto';
import { ContextoAlma } from '../../types/alma.types';

const ETIQUETA_ACCION: Record<AuditoriaEventoDto['accion'], string> = {
  CREACION: 'Creación',
  ACTUALIZACION: 'Actualización',
  CAMBIO_ESTADO: 'Cambio de estado',
  DERIVACION: 'Derivación',
  VINCULACION: 'Vinculación',
  NOTA: 'Nota'
};

/**
 * `AuditTrail` — historial **inmutable** de solo lectura (`RNF-ALMA-003`): quién, cuándo y qué
 * cambió en creaciones, cambios de estado, derivaciones y vinculaciones manuales. No ofrece
 * ninguna acción de edición. Lo reutiliza Psicología en el expediente (J-2.1).
 */
@Component({
  selector: 'app-audit-trail',
  imports: [DatePipe, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="audit" aria-labelledby="audit-titulo">
      <h3 id="audit-titulo" class="audit__titulo">Historial de cambios</h3>
      @if (cargando()) {
        <p role="status" aria-busy="true">Cargando el historial…</p>
      } @else if (error()) {
        <div class="casilda-alerta casilda-alerta--peligro" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <div>
            <p>No pudimos cargar el historial.</p>
            <button type="button" class="boton boton--secundario" (click)="cargar()">Intentar de nuevo</button>
          </div>
        </div>
      } @else if (eventos().length === 0) {
        <p class="audit__vacio">Todavía no hay cambios registrados.</p>
      } @else {
        <table class="audit__tabla" aria-label="Historial de cambios, del más antiguo al más reciente">
          <thead>
            <tr>
              <th scope="col">Fecha y hora</th>
              <th scope="col">Persona</th>
              <th scope="col">Acción</th>
              <th scope="col">Detalle</th>
            </tr>
          </thead>
          <tbody>
            @for (e of eventos(); track e.idEvento) {
              <tr>
                <td>{{ e.fechaHora | date: 'd MMM y, h:mm:ss a' }}</td>
                <td>{{ e.usuario }}</td>
                <td>{{ etiquetas[e.accion] }}</td>
                <td>{{ e.detalle }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: `
    .audit__titulo { margin: 0 0 var(--space-3); font-size: var(--font-size-xl); }
    .audit__vacio { margin: 0; color: var(--color-text-secondary); }
    .audit__tabla { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
    .audit__tabla th, .audit__tabla td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); vertical-align: top; }
    .audit__tabla th { background: var(--color-bg-subtle); }
  `
})
export class AuditTrailComponent {
  private readonly servicio = inject(AuditoriaAlmaService);

  readonly contexto = input.required<ContextoAlma>();
  /** Cambiar este valor fuerza una recarga (p. ej. tras derivar). */
  readonly version = input<number | null>(null);

  protected readonly etiquetas = ETIQUETA_ACCION;
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly eventos = signal<AuditoriaEventoDto[]>([]);

  constructor() {
    effect(() => {
      this.contexto();
      this.version();
      this.cargar();
    });
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.servicio.listar(this.contexto()).subscribe({
      next: (eventos) => {
        this.eventos.set(eventos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }
}
