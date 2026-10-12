import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { modulosVisiblesPara } from '../../../core/navegacion/catalogo-navegacion';

/**
 * Z5 — Accesos frecuentes. **Máximo 4**, y solo si aportan un atajo real: el
 * menú lateral sigue siendo la navegación primaria (DSH-P4, DSH-07-05).
 *
 * Los nombres e íconos salen del catálogo central, de modo que un módulo se
 * llama igual aquí, en el menú y en el título de su página (DSH-04-03).
 */
@Component({
  selector: 'app-widget-accesos-frecuentes',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (accesos().length) {
      <nav class="accesos" aria-label="Accesos frecuentes">
        @for (modulo of accesos(); track modulo.id) {
          <a class="accesos__enlace" [routerLink]="modulo.ruta">
            <mat-icon aria-hidden="true">{{ modulo.icono }}</mat-icon>
            <span>{{ modulo.nombre }}</span>
          </a>
        }
      </nav>
    }
  `,
  styleUrl: './widgets.scss'
})
export class AccesosFrecuentesWidget {
  readonly rol = input.required<string>();
  readonly esAdmin = input(false);

  /** Atajos sugeridos por rol, en orden de uso esperado. */
  private readonly porRol: Record<string, readonly string[]> = {
    ADMIN: ['usuarios', 'maestros', 'indicadores'],
    COORDINADOR: ['consulta', 'citas', 'nueva-solicitud'],
    PROFESIONAL: ['registro-atencion', 'citas', 'mis-asignaciones'],
    REVISOR: ['indicadores', 'consulta', 'seguimiento']
  };

  readonly accesos = computed(() => {
    const visibles = modulosVisiblesPara(this.rol(), this.esAdmin());
    const sugeridos = this.porRol[this.rol()] ?? [];
    return sugeridos
      .map((id) => visibles.find((modulo) => modulo.id === id))
      .filter((modulo) => modulo !== undefined)
      .slice(0, 4);
  });
}
