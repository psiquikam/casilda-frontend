import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SpybSoloLetrasDirective } from '../../../../seguridad-personas-bienes/shared/spyb-restricciones.directive';
import { EtiquetaCampoComponent } from '../etiqueta-campo/etiqueta-campo.component';
import { CatalogosAlmaService } from '../../catalogos/catalogos-alma.service';
import { mensajeDeError } from '../../http/errores-servidor';
import { ItemCatalogo } from '../../types/alma.types';
import { environment } from '../../../../../environments/environment';
import { CAMPOS_CARACTERIZACION, CAMPOS_SIN_BACKEND, CampoCaracterizacion } from './caracterizacion-campos';

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
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, EtiquetaCampoComponent, SpybSoloLetrasDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spyb-grid" [formGroup]="grupo()">
      @for (campo of campos; track campo.control) {
        <div class="spyb-campo">
          <app-etiqueta-campo [texto]="campo.etiqueta" [para]="prefijoId() + '-' + campo.control" [obligatorio]="campo.obligatorio" [ayuda]="campo.ayuda ?? ''" />
          <mat-form-field appearance="outline">
            @if (campo.tipo === 'catalogo') {
              <mat-select [formControlName]="campo.control" [id]="prefijoId() + '-' + campo.control" placeholder="Seleccione una opción">
                <mat-option [value]="null">Sin dato</mat-option>
                @for (item of opciones()[campo.catalogo!] ?? []; track item.codigo) {
                  <mat-option [value]="item.codigo">{{ item.etiqueta }}</mat-option>
                }
              </mat-select>
            } @else if (campo.tipo === 'nombre') {
              <input matInput appSoloLetras [formControlName]="campo.control" [id]="prefijoId() + '-' + campo.control" [maxlength]="campo.maxLength ?? 50" [placeholder]="campo.placeholder ?? ''" autocomplete="off" />
            } @else {
              <input
                matInput
                [formControlName]="campo.control"
                [id]="prefijoId() + '-' + campo.control"
                [type]="campo.tipo === 'correo' ? 'email' : campo.tipo === 'telefono' ? 'tel' : campo.tipo === 'fecha' ? 'date' : 'text'"
                [attr.inputmode]="campo.tipo === 'telefono' ? 'tel' : null"
                [attr.max]="campo.tipo === 'fecha' ? hoy : null"
                [placeholder]="campo.placeholder ?? ''"
                autocomplete="off"
              />
            }
            @if (error(campo); as mensaje) {
              <mat-error>{{ mensaje }}</mat-error>
            }
          </mat-form-field>
        </div>
      }
    </div>
  `
})
export class CaracterizacionFormComponent implements OnInit {
  private readonly catalogos = inject(CatalogosAlmaService);

  readonly grupo = input.required<FormGroup>();
  /** Los `id` de los controles son `${prefijoId}-${control}`, para el resumen de errores. */
  readonly prefijoId = input('caracterizacion');

  protected readonly campos = environment.lineaAlma.extensiones
    ? CAMPOS_CARACTERIZACION
    : CAMPOS_CARACTERIZACION.filter((c) => !CAMPOS_SIN_BACKEND.includes(c.control));
  protected readonly hoy = new Date().toISOString().slice(0, 10);
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
