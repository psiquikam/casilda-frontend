import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { EstadoNoticia, NoticiaResumen, TipoNoticia } from '../../contratos/uad-api.types';
import { EstadoNoticiaComponent } from '../../componentes/estado-noticia/estado-noticia.component';
import { PanelSimulacionComponent } from '../../componentes/panel-simulacion/panel-simulacion.component';
import { fechaContrato } from '../../dominio/decision-evaluacion';
import { ESTADOS_NOTICIA, ETIQUETA_ACTOR, ETIQUETA_EQUIPO, ETIQUETA_ESTADO_NOTICIA, ETIQUETA_ORIGEN, ETIQUETA_VINCULACION } from '../../dominio/etiquetas';
import { ErrorUad } from '../../infraestructura/uad-error';
import { UadFacade } from '../../servicios/uad.facade';

export const TAMANO_PAGINA_NOTICIAS = 10;

type EstadoVista = 'cargando' | 'listo' | 'error' | 'sin-permiso' | 'sin-equipo';

/** Aviso que deja la evaluación al volver (p. ej. la noticia pasó al otro equipo). Solo texto, sin datos personales. */
export interface AvisoBandeja {
  readonly aviso: string;
}

/**
 * Bandejas NDI y NDA — `/uad/noticias` (P-UAD-03; UAD-NOT-01, 05 a 11).
 *
 * Columnas de UAD-NOT-10 (consecutivo, ID de caso si existe, origen, fecha, estado, acción). La fila
 * expandible (UAD-NOT-11) muestra teléfono, correo y descripción **solo si el servidor los envía**;
 * en NDA nunca hay identidad. «Asunto» y expediente UAD no son columnas. La competencia por equipo la
 * filtra el servidor; esta vista no oculta nada por su cuenta.
 */
@Component({
  selector: 'app-uad-bandeja-noticias-page',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    EstadoNoticiaComponent,
    PanelSimulacionComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bandeja-noticias.page.html',
  styleUrl: './bandeja-noticias.page.scss'
})
export class BandejaNoticiasPage implements OnInit {
  private readonly facade = inject(UadFacade);
  private readonly notificacion = inject(NotificacionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documento = inject(DOCUMENT);

  protected readonly tipo = signal<TipoNoticia>('NDI');
  protected readonly estado = signal<EstadoNoticia | ''>('');
  protected readonly desde = signal<Date | null>(null);
  protected readonly hasta = signal<Date | null>(null);
  protected readonly consecutivo = signal('');
  protected readonly pagina = signal(0);

  protected readonly vista = signal<EstadoVista>('cargando');
  protected readonly items = signal<readonly NoticiaResumen[]>([]);
  protected readonly total = signal(0);
  protected readonly expandida = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly vacio = computed(() => this.vista() === 'listo' && this.items().length === 0);
  protected readonly contexto = this.facade.contexto;
  protected readonly equiposTexto = computed(() => (this.contexto()?.equipos ?? []).map((e) => ETIQUETA_EQUIPO[e]).join(' y '));

  protected readonly tamano = TAMANO_PAGINA_NOTICIAS;
  protected readonly estados = ESTADOS_NOTICIA;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO_NOTICIA;
  protected readonly etiquetaOrigen = ETIQUETA_ORIGEN;
  protected readonly etiquetaActor = ETIQUETA_ACTOR;
  protected readonly etiquetaVinculacion = ETIQUETA_VINCULACION;
  protected readonly etiquetaEquipo = ETIQUETA_EQUIPO;

  ngOnInit(): void {
    const tipo = this.route.snapshot.queryParamMap.get('tipo');
    if (tipo === 'NDA') this.tipo.set('NDA');
    const aviso = (this.router.lastSuccessfulNavigation()?.extras.state as AvisoBandeja | undefined)?.aviso;
    if (aviso) this.aviso.set(aviso);
    this.iniciar();
  }

  /** Carga el contexto del usuario y, si tiene equipo, la bandeja. */
  protected iniciar(): void {
    this.vista.set('cargando');
    this.facade.cargarContexto().subscribe({
      next: (ctx) => {
        if (ctx.equipos.length === 0) {
          this.vista.set('sin-equipo');
          return;
        }
        this.cargar();
      },
      error: (e: ErrorUad) => this.manejarError(e)
    });
  }

  protected cambiarTipo(tipo: TipoNoticia): void {
    if (tipo === this.tipo()) return;
    this.tipo.set(tipo);
    this.expandida.set(null);
    this.pagina.set(0);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { tipo }, replaceUrl: true });
    this.cargar();
  }

  /** Flechas izquierda/derecha entre pestañas (patrón ARIA tabs). */
  protected teclaPestana(evento: KeyboardEvent): void {
    if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return;
    evento.preventDefault();
    const siguiente: TipoNoticia = this.tipo() === 'NDI' ? 'NDA' : 'NDI';
    this.cambiarTipo(siguiente);
    queueMicrotask(() => this.documento.getElementById(`uad-pestana-${siguiente}`)?.focus());
  }

  protected filtrar(): void {
    this.pagina.set(0);
    this.cargar();
  }

  protected limpiarFiltros(): void {
    this.estado.set('');
    this.desde.set(null);
    this.hasta.set(null);
    this.consecutivo.set('');
    this.filtrar();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.cargar();
  }

  protected alternar(item: NoticiaResumen): void {
    this.expandida.set(this.expandida() === item.noticiaId ? null : item.noticiaId);
  }

  protected cargar(): void {
    this.vista.set('cargando');
    this.facade
      .listarNoticias({
        tipo: this.tipo(),
        estado: this.estado() || null,
        fechaRecepcionDesde: fechaContrato(this.desde()),
        fechaRecepcionHasta: fechaContrato(this.hasta()),
        consecutivo: this.consecutivo().trim() || null,
        page: this.pagina(),
        size: TAMANO_PAGINA_NOTICIAS
      })
      .subscribe({
        next: (pagina) => {
          this.items.set(pagina.content);
          this.total.set(pagina.totalElements);
          this.vista.set('listo');
        },
        error: (e: ErrorUad) => this.manejarError(e)
      });
  }

  private manejarError(e: ErrorUad): void {
    if (e.tipo === 'sin-permiso') {
      this.vista.set(e.codigo === 'SIN_EQUIPO_UAD' ? 'sin-equipo' : 'sin-permiso');
      return;
    }
    if (e.tipo === 'sin-sesion') {
      this.notificacion.error(e.mensaje, e);
      void this.router.navigate(['/login']);
      return;
    }
    this.vista.set('error');
    this.notificacion.error(e.mensaje, e);
  }
}
