import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, model, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { CatalogosAlmaService } from '../../catalogos/catalogos-alma.service';
import { ConsentimientoDto } from '../../types/alma-dto';
import { MEDIOS_CONSENTIMIENTO, MedioConsentimiento } from '../../types/alma.types';

let secuencia = 0;

/**
 * `ConsentimientoInformado` — lectura y aceptación registradas (RF-ALMA-004, RN-ALMA-02).
 *
 * **Frontera F5**: APH lo usa en la derivación (variante **digital** o verbal, la persona
 * llama por teléfono así que normalmente es verbal) y Psicología en el primer contacto
 * (variante **verbal**). El valor es el `ConsentimientoDto` del contrato: `{ otorgado, medio,
 * fechaRegistro, versionTexto }`; `null` mientras no se haya otorgado, de modo que el padre
 * habilita «Derivar» solo con un valor presente.
 *
 * El texto oficial lo entrega el Backend (catálogo `textos-consentimiento`, pendiente Q9): no se
 * escribe aquí. Si no carga, la casilla queda deshabilitada: sin texto no hay consentimiento
 * informado que registrar.
 */
@Component({
  selector: 'app-consentimiento-informado',
  imports: [DatePipe, MatCheckboxModule, MatIconModule, MatRadioModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="cons">
      <legend class="cons__titulo">Consentimiento informado</legend>

      @if (cargando()) {
        <p role="status">Cargando el texto del consentimiento…</p>
      } @else if (errorTexto()) {
        <div class="casilda-alerta casilda-alerta--peligro" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <div>
            <p>No pudimos cargar el texto del consentimiento, por eso no se puede registrar.</p>
            <button type="button" class="boton boton--secundario" (click)="cargarTexto()">Intentar de nuevo</button>
          </div>
        </div>
      } @else {
        <p class="cons__texto" [id]="idTexto" tabindex="0">{{ texto() }}</p>
      }

      @if (permitirCambiarMedio()) {
        <mat-radio-group class="cons__medios" [value]="medio()" (change)="cambiarMedio($event.value)" [disabled]="deshabilitado()" aria-label="Medio en que se obtiene el consentimiento">
          @for (opcion of medios; track opcion) {
            <mat-radio-button [value]="opcion">{{ etiquetaMedio[opcion] }}</mat-radio-button>
          }
        </mat-radio-group>
      }

      <mat-checkbox
        [checked]="!!valor()?.otorgado"
        [disabled]="deshabilitado() || cargando() || errorTexto()"
        [attr.aria-describedby]="idTexto"
        (change)="alternar($event.checked)"
      >
        {{ medio() === 'VERBAL' ? 'Se leyó el texto a la persona y ella aceptó de forma voluntaria.' : 'La persona leyó el texto y aceptó de forma voluntaria.' }}
      </mat-checkbox>

      @if (valor(); as v) {
        <p class="cons__registro" role="status">
          <mat-icon aria-hidden="true">check_circle</mat-icon>
          Consentimiento registrado ({{ etiquetaMedio[v.medio].toLowerCase() }}) el {{ v.fechaRegistro | date: 'd MMM y, h:mm a' }}.
        </p>
      }
    </fieldset>
  `,
  styles: `
    .cons { border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); margin: 0; }
    .cons__titulo { font-weight: 700; padding: 0 var(--space-2); }
    .cons__texto { margin: 0; max-height: 9rem; overflow: auto; padding: var(--space-3); background: var(--color-bg-subtle); border-radius: var(--radius-sm); line-height: var(--line-height-relaxed); }
    .cons__medios { display: flex; flex-wrap: wrap; gap: var(--space-4); }
    .cons__registro { margin: 0; display: flex; align-items: center; gap: var(--space-2); color: var(--color-primary); font-weight: 600; }
  `
})
export class ConsentimientoInformadoComponent implements OnInit {
  private readonly catalogos = inject(CatalogosAlmaService);

  /** Valor del consentimiento (binding de dos vías con `[(valor)]`). */
  readonly valor = model<ConsentimientoDto | null>(null);
  /** Medio en que se obtiene. Psicología lo fija en `VERBAL` y oculta el selector. */
  readonly medio = model<MedioConsentimiento>('VERBAL');
  readonly permitirCambiarMedio = input(true);
  readonly deshabilitado = input(false);

  protected readonly medios = MEDIOS_CONSENTIMIENTO;
  protected readonly etiquetaMedio: Record<MedioConsentimiento, string> = { VERBAL: 'Verbal', DIGITAL: 'Digital' };
  protected readonly idTexto = `cons-texto-${++secuencia}`;
  protected readonly texto = signal('');
  private versionTexto = '';
  protected readonly cargando = signal(true);
  protected readonly errorTexto = signal(false);

  ngOnInit(): void {
    this.cargarTexto();
  }

  protected cargarTexto(): void {
    this.cargando.set(true);
    this.errorTexto.set(false);
    this.catalogos.invalidar('textos-consentimiento');
    this.catalogos.obtener('textos-consentimiento').subscribe({
      next: (items) => {
        const vigente = items[0];
        this.texto.set(vigente?.etiqueta ?? '');
        this.versionTexto = vigente?.codigo ?? '';
        this.errorTexto.set(!vigente);
        this.cargando.set(false);
      },
      error: () => {
        this.errorTexto.set(true);
        this.cargando.set(false);
      }
    });
  }

  protected cambiarMedio(medio: MedioConsentimiento): void {
    this.medio.set(medio);
    // Cambiar el medio invalida lo registrado: hay que volver a confirmarlo.
    this.valor.set(null);
  }

  protected alternar(otorgado: boolean): void {
    this.valor.set(
      otorgado
        ? { otorgado: true, medio: this.medio(), fechaRegistro: new Date().toISOString(), versionTexto: this.versionTexto }
        : null
    );
  }
}
