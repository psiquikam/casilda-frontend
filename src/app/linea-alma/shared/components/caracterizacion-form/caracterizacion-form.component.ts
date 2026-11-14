import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CatalogosAlmaService } from '../../catalogos/catalogos-alma.service';
import { mensajeDeError } from '../../http/errores-servidor';
import { ItemCatalogo } from '../../types/alma.types';
import { CAMPOS_CARACTERIZACION, CampoCaracterizacion } from './caracterizacion-campos';

/**
 * `CaracterizacionForm` — variables sociodemográficas homologadas con Equipo de Atención
 * (RF-ALMA-006). **Frontera F4**: lo consume también Psicología en el primer contacto (J-1.4).
 *
 * Es de presentación: el formulario lo posee el padre (`crearGrupoCaracterizacion()`), que
 * decide cuándo guardar. El `autocomplete` es `off`: son datos de una tercera persona que el
 * navegador no debe memorizar (regla 9 de `CLAUDE.md`).
 */
@Component({
  selector: 'app-caracterizacion-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="car" [formGroup]="grupo()">
      @for (campo of campos; track campo.control) {
        <mat-form-field appearance="outline" class="car__campo">
          <mat-label>{{ campo.etiqueta }}</mat-label>
          @if (campo.tipo === 'catalogo') {
            <mat-select [formControlName]="campo.control" [id]="prefijoId() + '-' + campo.control">
              <mat-option value="">Sin dato</mat-option>
              @for (item of opciones()[campo.catalogo!] ?? []; track item.codigo) {
                <mat-option [value]="item.codigo">{{ item.etiqueta }}</mat-option>
              }
            </mat-select>
          } @else {
            <input
              matInput
              [formControlName]="campo.control"
              [id]="prefijoId() + '-' + campo.control"
              [type]="campo.tipo === 'correo' ? 'email' : campo.tipo === 'telefono' ? 'tel' : 'text'"
              [attr.inputmode]="campo.tipo === 'telefono' ? 'tel' : null"
              autocomplete="off"
            />
          }
          @if (campo.ayuda) {
            <mat-hint>{{ campo.ayuda }}</mat-hint>
          }
          @if (error(campo); as mensaje) {
            <mat-error>{{ mensaje }}</mat-error>
          }
        </mat-form-field>
      }
    </div>
  `,
  styles: `
    .car { display: grid; gap: var(--space-2) var(--space-4); grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .car__campo { width: 100%; }
  `
})
export class CaracterizacionFormComponent implements OnInit {
  private readonly catalogos = inject(CatalogosAlmaService);

  readonly grupo = input.required<FormGroup>();
  /** Los `id` de los controles son `${prefijoId}-${control}`, para el resumen de errores. */
  readonly prefijoId = input('caracterizacion');

  protected readonly campos = CAMPOS_CARACTERIZACION;
  protected readonly opciones = signal<Record<string, ItemCatalogo[] | undefined>>({});

  ngOnInit(): void {
    for (const campo of this.campos.filter((c) => c.tipo === 'catalogo' && c.catalogo)) {
      this.catalogos.obtener(campo.catalogo!).subscribe({
        next: (items) => this.opciones.update((actual) => ({ ...actual, [campo.catalogo!]: items })),
        // Sin el catálogo el campo queda en «Sin dato»: es opcional y no bloquea el registro.
        error: () => undefined
      });
    }
  }

  protected error(campo: CampoCaracterizacion): string | null {
    return mensajeDeError(this.grupo().get(campo.control), campo.etiqueta);
  }
}
