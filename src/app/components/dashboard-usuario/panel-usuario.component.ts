import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../services/auth.service';
import { MiProcesoDto, MiProcesoService } from '../../services/mi-proceso.service';
import { NotificacionService } from '../../core/a11y/notificacion.service';
import { esTelefonoPublicable } from '../../core/security/telefono-crisis';
import { environment } from '../../../environments/environment';

/**
 * Panel de la persona que solicita acompañamiento (§5 del contrato).
 *
 * Cada decisión de esta vista se midió con una sola pregunta: **¿esto aumenta
 * su sensación de seguridad y control, o la disminuye?**
 *
 * Lo que esta vista **no** hace, y es tan importante como lo que hace:
 * - No muestra cifras, estadísticas ni gráficos institucionales (DSH-10-08).
 * - No muestra el relato de los hechos ni detalles de la violencia (DSH-10-09).
 * - No muestra información interna del proceso ni datos de terceras personas
 *   (DSH-10-10).
 * - No usa jerga («caso», «expediente», «radicado», «bandeja») ni grillas de
 *   módulos (DSH-10-11).
 * - No usa rojo, contadores ni urgencias fabricadas (DSH-10-12).
 * - No guarda nada en `localStorage`: el dispositivo puede ser compartido
 *   (DSH-10-14).
 */
@Component({
  selector: 'app-panel-usuario',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel-usuario.component.html',
  styleUrl: './panel-usuario.component.scss'
})
export class PanelUsuarioComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly miProceso = inject(MiProcesoService);
  private readonly notificacion = inject(NotificacionService);

  readonly telefonoOrientacion = environment.telefonoOrientacion;
  readonly hayLineaOrientacion = esTelefonoPublicable(this.telefonoOrientacion);

  readonly proceso = signal<MiProcesoDto | null>(null);
  readonly cargando = signal(true);
  readonly error = signal(false);

  /**
   * Nombre con el que saludar.
   *
   * **[PENDIENTE P-14]** Debe ser el **nombre identitario** que la persona
   * eligió, no necesariamente el legal (DSH-10-07). El modelo de datos todavía
   * no lo distingue, así que se usa el nombre de la sesión; cuando exista el
   * campo, solo cambia esta línea.
   */
  readonly nombre = this.calcularNombre();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.miProceso.obtenerMiProceso().subscribe({
      next: (proceso) => {
        this.proceso.set(proceso);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
        this.notificacion.error('No pudimos cargar tu información en este momento.');
      }
    });
  }

  private calcularNombre(): string {
    const partes = (this.auth.currentUser?.nombre ?? '').trim().split(/\s+/).filter(Boolean);
    // Descarta lo que vaya entre paréntesis («(Estudiante UdeA)»): es un dato
    // del sistema, no parte de cómo la persona se llama.
    const limpio = partes.filter((parte) => !parte.startsWith('('));
    return limpio[0] ?? '';
  }
}
