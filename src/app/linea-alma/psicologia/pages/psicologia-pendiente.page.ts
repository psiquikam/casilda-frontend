import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/** Stub de H-0.1: marca el lugar de cada pantalla de Psicología hasta que Jonathan la construya. */
@Component({
  selector: 'app-psicologia-pendiente',
  imports: [MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pendiente">
      <h1>Psicología — Línea Alma</h1>
      <p class="casilda-alerta" role="status">
        <mat-icon aria-hidden="true">construction</mat-icon>
        <span>
          Esta pantalla todavía no está disponible: <strong>{{ pantalla }}</strong>.
        </span>
      </p>
      <a class="boton boton--secundario" routerLink="/inicio">Volver al inicio</a>
    </section>
  `,
  styles: `
    .pendiente { max-width: 720px; margin: 0 auto; padding: var(--space-8) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); align-items: flex-start; }
    h1 { margin: 0; font-size: var(--font-size-2xl); }
  `
})
export class PsicologiaPendientePage {
  readonly pantalla = (inject(ActivatedRoute).snapshot.data['pantalla'] as string | undefined) ?? 'en construcción';
}
