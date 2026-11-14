import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../../../environments/environment';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { AlmaPermisosService } from '../../../shared/permisos/alma-permisos.service';
import { BandejaAphItemDto, VistaBandejaAph } from '../../../shared/types/alma-dto';
import {
  ESTADOS_ATENCION,
  ETIQUETA_CANAL_INGRESO,
  ETIQUETA_ESTADO_ATENCION,
  ETIQUETA_ORIGEN_REMISION,
  ETIQUETA_TRIAJE,
  ORIGENES_REMISION,
  OrigenRemision
} from '../../../shared/types/alma.types';
import { BandejaAphService } from '../../services/bandeja-aph.service';

const TAMANO_PAGINA = 10;

/**
 * Bandeja de APH — `/linea-alma/aph/remisiones` (H-1.6, `RF-ALMA-002`, `RF-ALMA-APH-001`).
 *
 * Dos vistas sobre el mismo servicio: **Remisiones recibidas** (EA, SPyB y UAD, estado
 * `PENDIENTE_APH`) y **Mis atenciones**, con el plazo de primer contacto de las derivadas a
 * Psicología (`RN-ALMA-01` aplica también a APH). Abrir una remisión la **toma** enviando la
 * `version` leída: si otra persona se adelantó, el servidor responde 409 y la lista se refresca
 * (bloqueo optimista, análogo a `RNF-ALMA-001`). Al tomarla se pre-llena el registro (H-1.2).
 */
@Component({
  selector: 'app-bandeja-remisiones-page',
  imports: [DatePipe, FormsModule, RouterLink, MatFormFieldModule, MatIconModule, MatPaginatorModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bandeja-remisiones.page.html',
  styleUrl: './bandeja-remisiones.page.scss'
})
export class BandejaRemisionesPage implements OnInit {
  private readonly servicio = inject(BandejaAphService);
  private readonly notificacion = inject(NotificacionService);
  private readonly router = inject(Router);
  protected readonly permisos = inject(AlmaPermisosService);

  protected readonly demo = Object.values(environment.lineaAlma.mocks).some(Boolean);
  protected readonly vista = signal<VistaBandejaAph>('remisiones');
  protected readonly origen = signal<OrigenRemision | ''>('');
  protected readonly estado = signal('');
  protected readonly pagina = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly tomando = signal<string | null>(null);
  protected readonly items = signal<BandejaAphItemDto[]>([]);
  protected readonly total = signal(0);
  protected readonly vacio = computed(() => !this.cargando() && !this.error() && this.items().length === 0);

  protected readonly tamano = TAMANO_PAGINA;
  protected readonly origenes = ORIGENES_REMISION;
  protected readonly etiquetaOrigen = ETIQUETA_ORIGEN_REMISION;
  protected readonly etiquetaCanal = ETIQUETA_CANAL_INGRESO;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO_ATENCION;
  protected readonly etiquetaTriaje = ETIQUETA_TRIAJE;
  protected readonly estadosFiltro = ESTADOS_ATENCION.filter((e) => e !== 'PENDIENTE_APH');

  ngOnInit(): void {
    this.cargar();
  }

  protected cambiarVista(vista: VistaBandejaAph): void {
    if (this.vista() === vista) return;
    this.vista.set(vista);
    this.origen.set('');
    this.estado.set('');
    this.pagina.set(0);
    this.cargar();
  }

  protected filtrar(): void {
    this.pagina.set(0);
    this.cargar();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.servicio
      .listar({ vista: this.vista(), origen: this.origen(), estado: this.estado(), page: this.pagina(), size: TAMANO_PAGINA })
      .subscribe({
        next: (pagina) => {
          this.items.set(pagina.items);
          this.total.set(pagina.total);
          this.cargando.set(false);
        },
        error: (e: ErrorAlma) => {
          this.error.set(true);
          this.cargando.set(false);
          this.notificacion.error(e.mensaje, e);
        }
      });
  }

  protected tomar(item: BandejaAphItemDto): void {
    this.tomando.set(item.idAtencion);
    this.servicio.tomar(item.idAtencion, item.version).subscribe({
      next: (atencion) => {
        this.tomando.set(null);
        this.notificacion.exito(`Tomó la remisión ${atencion.idAtencion}.`);
        void this.router.navigate(['/linea-alma/aph/nueva'], { queryParams: { atencion: atencion.idAtencion } });
      },
      error: (e: ErrorAlma) => {
        this.tomando.set(null);
        this.notificacion.error(e.mensaje, e);
        // 409: alguien se adelantó o la remisión cambió; se refresca para mostrar las que siguen libres.
        if (e.tipo === 'conflicto') this.cargar();
      }
    });
  }

  /** «Vencido» según el reloj **del servidor** (`ahoraServidor`), nunca el del navegador (R6). */
  protected vencido(item: BandejaAphItemDto): boolean {
    return !!item.sla && Date.parse(item.sla.venceEn) <= Date.parse(item.sla.ahoraServidor);
  }

  protected retomable(item: BandejaAphItemDto): boolean {
    return item.estado === 'BORRADOR' || item.estado === 'EN_GESTION_APH';
  }
}
