import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { environment } from '../../../../environments/environment';
import { esTelefonoPublicable } from '../../../core/security/telefono-crisis';

/** Llave de preferencia. El prefijo `casilda_` la incluye en la limpieza de la
 *  salida rápida (DSH-06-03). */
const LLAVE_AYUDA_ABIERTA = 'casilda_panel_ayuda_abierta';

/**
 * Z6 — Ayuda y protocolos, en un panel colapsable recordado por persona
 * usuaria (DSH-07-03).
 *
 * Aquí viven la «Ruta del Caso» y los protocolos, que antes ocupaban dos de las
 * tres pestañas del panel: son contenido de consulta, no de operación diaria.
 */
@Component({
  selector: 'app-widget-ayuda-protocolos',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ayuda">
      <h2 class="visually-hidden">Ayuda y protocolos</h2>
      <button
        type="button"
        class="ayuda__disparador"
        [attr.aria-expanded]="abierta()"
        aria-controls="panel-ayuda-protocolos"
        (click)="alternar()"
      >
        <mat-icon aria-hidden="true">menu_book</mat-icon>
        <span class="ayuda__titulo">Ayuda y protocolos</span>
        <span class="ayuda__pista">Ruta del caso, canales y normatividad</span>
        <mat-icon class="ayuda__chevron" aria-hidden="true">
          {{ abierta() ? 'expand_less' : 'expand_more' }}
        </mat-icon>
      </button>

      <!-- El atributo inert saca el contenido oculto del orden de tabulación y del árbol
           de accesibilidad, igual que las filas expandibles del proyecto
           (DSH-11-11). -->
      <div
        id="panel-ayuda-protocolos"
        class="ayuda__contenido"
        [class.ayuda__contenido--abierta]="abierta()"
        [attr.inert]="abierta() ? null : ''"
      >
        <div class="ayuda__bloque">
          <h3 class="ayuda__subtitulo">Ruta del caso</h3>
          <ol class="ayuda__ruta">
            @for (etapa of etapas; track etapa.nombre) {
              <li>
                <strong>{{ etapa.nombre }}</strong>
                <span>{{ etapa.descripcion }}</span>
              </li>
            }
          </ol>
        </div>

        <div class="ayuda__bloque">
          <h3 class="ayuda__subtitulo">Canales de emergencia</h3>
          <p class="ayuda__nota">
            Para el equipo de atención: ante riesgo inminente para la vida o la integridad
            física, activa de inmediato la ruta de emergencia.
          </p>
          <ul class="ayuda__lista">
            @if (hayLineaOrientacion) {
              <li>
                <strong>Línea de orientación:</strong>
                <a [href]="'tel:' + telefonoOrientacion">{{ telefonoOrientacion }}</a>
              </li>
            }
            <li><strong>Línea nacional:</strong> <a href="tel:155">155</a> — mujeres víctimas de violencia</li>
            <li><strong>Emergencias:</strong> <a href="tel:123">123</a> — Medellín / Policía Nacional</li>
          </ul>
        </div>

        <div class="ayuda__bloque">
          <h3 class="ayuda__subtitulo">Normatividad</h3>
          <ul class="ayuda__lista">
            <li><strong>Resolución Rectoral 41986:</strong> ruta universitaria de atención en VBG</li>
            <li><strong>Ley 1257 de 2008:</strong> no violencia contra las mujeres</li>
            <li><strong>Ley 1581 de 2012:</strong> reserva legal de datos sensibles</li>
          </ul>
        </div>
      </div>
    </section>
  `,
  styleUrl: './widgets.scss'
})
export class AyudaProtocolosWidget {
  readonly telefonoOrientacion = environment.telefonoOrientacion;
  readonly hayLineaOrientacion = esTelefonoPublicable(this.telefonoOrientacion);

  readonly abierta = signal(this.leerPreferencia());

  /** Etapas del proceso, en el orden en que ocurren. */
  readonly etapas = [
    { nombre: 'Recepción y radicación', descripcion: 'Ingreso del reporte y datos de contacto.' },
    { nombre: 'Bandeja y contacto inicial', descripcion: 'Triaje y validación de la voluntad de la persona.' },
    { nombre: 'Agendamiento de citas', descripcion: 'Coordinación de sesiones psicosociales o jurídicas.' },
    { nombre: 'Apertura de caso', descripcion: 'Expediente formal cuando se requiere intervención continuada.' },
    { nombre: 'Intervención y cierre', descripcion: 'Acuerdos, remisiones y archivo bajo reserva legal.' }
  ];

  alternar(): void {
    const siguiente = !this.abierta();
    this.abierta.set(siguiente);
    try {
      localStorage.setItem(LLAVE_AYUDA_ABIERTA, String(siguiente));
    } catch {
      /* El almacenamiento puede estar bloqueado: la preferencia es prescindible. */
    }
  }

  private leerPreferencia(): boolean {
    try {
      return localStorage.getItem(LLAVE_AYUDA_ABIERTA) === 'true';
    } catch {
      return false;
    }
  }
}
