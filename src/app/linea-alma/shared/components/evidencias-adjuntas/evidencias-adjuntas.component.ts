import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ACEPTA_EVIDENCIAS, LIMITES_EVIDENCIAS, validarEvidencias } from '../../../../services/reporte-caso.service';
import { EvidenciaAtencionDto } from '../../types/alma-dto';

/**
 * «Evidencias y documentos adjuntos (opcional)» de la atención.
 *
 * Es controlado: el padre es dueño de la lista de archivos **por subir** (`archivos`) y de los que
 * **ya están guardados** (`guardadas`); este componente solo valida y muestra. Usa los mismos
 * límites y formatos que el reporte de caso (`LIMITES_EVIDENCIAS`), de modo que lo que se acepta
 * aquí lo acepta también el servidor.
 */
@Component({
  selector: 'app-evidencias-adjuntas',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="evi" aria-labelledby="evi-titulo">
      <h3 id="evi-titulo" class="evi__titulo spyb-seccion-titulo">Evidencias y documentos adjuntos <span class="evi__opcional">(opcional)</span></h3>
      <p class="evi__ayuda" id="evi-ayuda">
        Formatos: {{ limites.descripcionFormatos }}. Hasta {{ limites.maxArchivos }} archivos.
      </p>

      @if (!soloLectura()) {
        <label class="boton boton--secundario evi__subir" for="evi-archivos">
          <mat-icon aria-hidden="true">attach_file</mat-icon> Adjuntar archivos
        </label>
        <input
          id="evi-archivos"
          class="visually-hidden"
          type="file"
          multiple
          [accept]="acepta"
          aria-describedby="evi-ayuda"
          (change)="alElegir($event)"
        />
      }

      @if (error(); as mensaje) {
        <p class="evi__error" role="alert">{{ mensaje }}</p>
      }

      @if (guardadas().length || archivos().length) {
        <ul class="evi__lista" aria-label="Archivos adjuntos">
          @for (g of guardadas(); track g.idEvidencia) {
            <li class="evi__item">
              <mat-icon aria-hidden="true">description</mat-icon>
              <span class="evi__nombre">{{ g.nombre }}</span>
              <span class="evi__peso">{{ tamano(g.tamanoBytes) }} · guardado</span>
              @if (!soloLectura()) {
                <button type="button" class="boton boton--secundario" (click)="quitarGuardada.emit(g.idEvidencia)">
                  Quitar<span class="visually-hidden"> el archivo {{ g.nombre }}</span>
                </button>
              }
            </li>
          }
          @for (a of archivos(); track $index) {
            <li class="evi__item">
              <mat-icon aria-hidden="true">upload_file</mat-icon>
              <span class="evi__nombre">{{ a.name }}</span>
              <span class="evi__peso">{{ tamano(a.size) }} · se guardará con la atención</span>
              <button type="button" class="boton boton--secundario" (click)="quitarPendiente($index)">
                Quitar<span class="visually-hidden"> el archivo {{ a.name }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .evi { display: flex; flex-direction: column; gap: var(--space-3); }
    .evi__titulo { font-size: 1.0625rem; }
    .evi__opcional { font-size: var(--font-size-sm); font-weight: 400; color: var(--color-text-secondary); }
    .evi__ayuda { margin: 0; color: var(--color-text-secondary); }
    .evi__subir { align-self: flex-start; cursor: pointer; }
    .evi__error { margin: 0; color: var(--color-danger-text); font-weight: 600; }
    .evi__lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
    .evi__item { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); background: var(--color-bg-subtle); border-radius: var(--radius-sm); }
    .evi__nombre { font-weight: 600; word-break: break-all; }
    .evi__peso { color: var(--color-text-secondary); font-size: var(--font-size-sm); flex: 1; }
  `
})
export class EvidenciasAdjuntasComponent {
  /** Archivos elegidos que aún no se han subido. */
  readonly archivos = model<File[]>([]);
  /** Archivos que la atención ya tiene guardados. */
  readonly guardadas = input<readonly EvidenciaAtencionDto[]>([]);
  readonly soloLectura = input(false);
  readonly quitarGuardada = output<string>();

  protected readonly limites = LIMITES_EVIDENCIAS;
  protected readonly acepta = ACEPTA_EVIDENCIAS;
  protected readonly error = signal<string | null>(null);
  protected readonly totalActual = computed(() => this.guardadas().length + this.archivos().length);

  protected alElegir(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const nuevos = Array.from(entrada.files ?? []);
    entrada.value = '';
    if (!nuevos.length) return;
    const candidatos = [...this.archivos(), ...nuevos];
    const falla =
      this.guardadas().length + candidatos.length > this.limites.maxArchivos
        ? `Una atención admite hasta ${this.limites.maxArchivos} archivos.`
        : validarEvidencias(candidatos);
    if (falla) {
      this.error.set(falla);
      return;
    }
    this.error.set(null);
    this.archivos.set(candidatos);
  }

  protected quitarPendiente(indice: number): void {
    this.error.set(null);
    this.archivos.update((lista) => lista.filter((_, i) => i !== indice));
  }

  protected tamano(bytes: number): string {
    return bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
}
