import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, model, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { CasoAsociado } from '../../contratos/uad-api.types';
import { ETIQUETA_ACTOR } from '../../dominio/etiquetas';
import { ErrorUad } from '../../infraestructura/uad-error';
import { UadFacade } from '../../servicios/uad.facade';

/**
 * «Casos asociados de la persona» (P-UAD-05; UAD-EVA-06 a 09).
 *
 * - Solo vive en la evaluación preliminar, **nunca** en «Gestionar caso – Decisión» (UAD-EVA-06).
 * - Consultar **no vincula ni crea** caso: la vinculación es una decisión aparte, explícita y
 *   confirmada como «mismos hechos» (UAD-EVA-08/09). La coincidencia la decide el servidor.
 * - Datos mínimos: ID, actor, fecha y estado de gestión. Sin notas ni evidencias de otros actores.
 */
@Component({
  selector: 'app-uad-casos-asociados',
  imports: [DatePipe, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="casos" aria-labelledby="uad-casos-titulo">
      <div class="casos__cabecera">
        <h3 id="uad-casos-titulo" class="casos__titulo">Casos asociados de la persona</h3>
        <button type="button" class="boton boton--secundario" [disabled]="cargando() || !disponible()" (click)="consultar()">
          <mat-icon aria-hidden="true">manage_search</mat-icon>
          {{ cargando() ? 'Consultando…' : casos() ? 'Consultar de nuevo' : 'Consultar otros casos' }}
        </button>
      </div>
      @if (!disponible() && motivo()) {
        <p class="casos__nota">{{ motivo() }}</p>
      }
      <p class="casos__nota">
        Muestra posibles casos de la misma persona en otros actores de la Ruta Violeta, con datos mínimos. Consultar no vincula la noticia.
      </p>

      <div aria-live="polite">
        @if (casos(); as lista) {
          @if (lista.length === 0) {
            <p class="casos__vacio">No encontramos otros casos registrados para esta persona.</p>
          } @else {
            <table class="casos__tabla" aria-label="Casos asociados encontrados">
              <thead>
                <tr>
                  @if (seleccionable()) {
                    <th scope="col"><span class="visually-hidden">Seleccionar</span></th>
                  }
                  <th scope="col">ID de caso Casilda</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Fecha de apertura</th>
                  <th scope="col">Estado en el actor</th>
                </tr>
              </thead>
              <tbody>
                @for (c of lista; track c.casoId) {
                  <tr>
                    @if (seleccionable()) {
                      <td>
                        <input
                          type="radio"
                          name="uad-caso-vincular"
                          class="casos__radio"
                          [id]="'uad-caso-' + c.casoId"
                          [checked]="seleccionado() === c.casoId"
                          (change)="seleccionado.set(c.casoId)"
                          [attr.aria-label]="'Vincular al caso ' + c.casoId"
                        />
                      </td>
                    }
                    <th scope="row">{{ c.casoId }}</th>
                    <td>{{ etiquetaActor[c.actor] }}</td>
                    <td>{{ c.fechaApertura ? (c.fechaApertura | date: 'd MMM y') : 'Sin dato' }}</td>
                    <td>{{ c.estadoGestionActor === 'ACTIVO' ? 'Activo' : 'Cerrado' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        }
      </div>
    </section>
  `,
  styles: `
    .casos { display: flex; flex-direction: column; gap: var(--space-2); }
    .casos__cabecera { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); }
    .casos__titulo { margin: 0; font-size: var(--font-size-md); }
    .casos__nota, .casos__vacio { margin: 0; color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .casos__tabla { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
    .casos__tabla th, .casos__tabla td { padding: var(--space-2); text-align: left; border-bottom: 1px solid var(--color-border); }
    .casos__tabla thead th { background: var(--color-bg-subtle); color: var(--color-text-secondary); }
    .casos__radio { width: 22px; height: 22px; accent-color: var(--color-primary); }
  `
})
export class CasosAsociadosComponent {
  private readonly facade = inject(UadFacade);
  private readonly notificacion = inject(NotificacionService);

  readonly noticiaId = input.required<string>();
  readonly disponible = input(true);
  readonly motivo = input<string | null>(null);
  /** Muestra la columna de selección (solo con «Continuar trámite → vincular a un caso existente»). */
  readonly seleccionable = input(false);
  /** `casoId` elegido para vincular. Elegirlo no vincula: lo hace la decisión confirmada. */
  readonly seleccionado = model<string | null>(null);
  readonly consultados = output<readonly CasoAsociado[]>();

  protected readonly cargando = signal(false);
  protected readonly casos = signal<readonly CasoAsociado[] | null>(null);
  protected readonly etiquetaActor = ETIQUETA_ACTOR;

  consultar(): void {
    this.cargando.set(true);
    this.facade.consultarCasosAsociados(this.noticiaId()).subscribe({
      next: (lista) => {
        this.cargando.set(false);
        this.casos.set(lista);
        if (this.seleccionado() && !lista.some((c) => c.casoId === this.seleccionado())) this.seleccionado.set(null);
        this.consultados.emit(lista);
      },
      error: (e: ErrorUad) => {
        this.cargando.set(false);
        this.notificacion.error(e.mensaje, e);
      }
    });
  }
}
