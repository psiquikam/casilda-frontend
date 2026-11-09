import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../../../environments/environment';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { SlaBadgeComponent } from '../../../shared/components/sla-badge/sla-badge.component';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { AlmaPermisosService } from '../../../shared/permisos/alma-permisos.service';
import { RelojServidorService } from '../../../shared/sla/reloj-servidor.service';
import { ETIQUETA_SEMAFORO } from '../../../shared/sla/sla';
import { BandejaPsicologiaItemDto, SemaforoSla } from '../../../shared/types/alma-psicologia-dto';
import {
  ESTADOS_BANDEJA_PSICOLOGIA,
  ETIQUETA_CANAL_INGRESO,
  ETIQUETA_ESTADO_ATENCION,
  ETIQUETA_TRIAJE,
  EstadoAtencion,
  TRIAJES,
  Triaje
} from '../../../shared/types/alma.types';
import { BandejaPsicologiaService } from '../../services/bandeja-psicologia.service';
import { NotificacionesPsicologiaService } from '../../services/notificaciones-psicologia.service';
import { NovedadesPsicologiaService } from '../../services/novedades-psicologia.service';

const TAMANO_PAGINA = 10;
const SEMAFOROS: readonly SemaforoSla[] = ['ROJO', 'AMARILLO', 'VERDE'];

/**
 * Bandeja compartida de Psicología — `/linea-alma/psicologia/bandeja` (J-1.1, J-1.2;
 * `RF-ALMA-PSI-001`, `RF-ALMA-002`, `RN-ALMA-01`, `RNF-ALMA-001`).
 *
 * Cola **sin asignación individual**: el servidor la ordena por menor tiempo restante y entrega
 * `venceEn`/`ahoraServidor` (F3); `SlaBadge` descuenta sin recargar. Filtros por triaje,
 * semáforo, estado y documento; paginación; refresco periódico a través de
 * `NotificacionesPsicologiaService` (Q7). **Tomar** envía la `version` leída: si otra profesional
 * se adelantó, el servidor responde 409 `NOVEDAD_YA_TOMADA`, se avisa y se refresca la lista.
 */
@Component({
  selector: 'app-bandeja-psicologia-page',
  imports: [DatePipe, FormsModule, RouterLink, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSelectModule, SlaBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bandeja-psicologia.page.html',
  styleUrl: './bandeja-psicologia.page.scss'
})
export class BandejaPsicologiaPage implements OnInit {
  private readonly servicio = inject(BandejaPsicologiaService);
  private readonly novedades = inject(NovedadesPsicologiaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly reloj = inject(RelojServidorService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly notificaciones = inject(NotificacionesPsicologiaService);
  protected readonly permisos = inject(AlmaPermisosService);

  protected readonly demo = Object.values(environment.lineaAlma.mocks).some(Boolean);
  protected readonly triaje = signal<Triaje | ''>('');
  protected readonly semaforo = signal<SemaforoSla | ''>('');
  protected readonly estado = signal<EstadoAtencion | ''>('PENDIENTE_PSICOLOGIA');
  protected readonly documento = signal('');
  protected readonly pagina = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly tomando = signal<string | null>(null);
  protected readonly items = signal<BandejaPsicologiaItemDto[]>([]);
  protected readonly total = signal(0);
  protected readonly ultimaActualizacion = signal<string | null>(null);
  protected readonly vacio = computed(() => !this.cargando() && !this.error() && this.items().length === 0);
  protected readonly puedeTomar = computed(() => this.permisos.tiene('alma.psicologia.editar'));

  protected readonly tamano = TAMANO_PAGINA;
  protected readonly triajes = TRIAJES;
  protected readonly semaforos = SEMAFOROS;
  protected readonly estados = ESTADOS_BANDEJA_PSICOLOGIA;
  protected readonly etiquetaTriaje = ETIQUETA_TRIAJE;
  protected readonly etiquetaSemaforo = ETIQUETA_SEMAFORO;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO_ATENCION;
  protected readonly etiquetaCanal = ETIQUETA_CANAL_INGRESO;

  ngOnInit(): void {
    this.cargar();
    // Refresco periódico (Q7): cada resumen nuevo del servidor vuelve a pedir la página actual sin perder los filtros.
    let primera = true;
    this.notificaciones.cambios$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resumen) => {
        this.reloj.sincronizar(resumen.ahoraServidor);
        if (primera) primera = false;
        else if (!this.tomando()) this.cargar(true);
      },
      error: () => undefined
    });
  }

  protected filtrar(): void {
    this.pagina.set(0);
    this.cargar();
  }

  protected limpiarFiltros(): void {
    this.triaje.set('');
    this.semaforo.set('');
    this.estado.set('PENDIENTE_PSICOLOGIA');
    this.documento.set('');
    this.filtrar();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.cargar();
  }

  protected cargar(silencioso = false): void {
    if (!silencioso) this.cargando.set(true);
    this.error.set(false);
    this.servicio
      .listar({ triaje: this.triaje(), semaforo: this.semaforo(), estado: this.estado(), documento: this.documento(), page: this.pagina(), size: TAMANO_PAGINA })
      .subscribe({
        next: (pagina) => {
          this.items.set(pagina.items);
          this.total.set(pagina.total);
          const ahora = pagina.items[0]?.sla.ahoraServidor;
          if (ahora) this.reloj.sincronizar(ahora);
          this.ultimaActualizacion.set(ahora ?? new Date().toISOString());
          this.cargando.set(false);
        },
        error: (e: ErrorAlma) => {
          this.cargando.set(false);
          if (silencioso) return;
          this.error.set(true);
          this.notificacion.error(e.mensaje, e);
        }
      });
  }

  /** Bloqueo optimista (RNF-ALMA-001): se envía la `version` leída en la lista. */
  protected tomar(item: BandejaPsicologiaItemDto): void {
    this.tomando.set(item.idAtencion);
    this.novedades.tomar(item.idAtencion, item.version).subscribe({
      next: (novedad) => {
        this.tomando.set(null);
        this.notificacion.exito(`Tomó la novedad ${novedad.idAtencion}.`);
        this.notificaciones.refrescar();
        void this.router.navigate(['/linea-alma/psicologia/novedades', novedad.idAtencion]);
      },
      error: (e: ErrorAlma) => {
        this.tomando.set(null);
        this.notificacion.error(e.mensaje, e);
        // 409: alguien se adelantó o la novedad cambió; se refresca para mostrar las que siguen libres.
        if (e.tipo === 'conflicto') this.cargar();
      }
    });
  }
}
