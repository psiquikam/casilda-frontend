import { DOCUMENT, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { CatalogosAlmaService, etiquetasDe } from '../../../shared/catalogos/catalogos-alma.service';
import { AlertaGestionSimultaneaComponent } from '../../../shared/components/alerta-gestion-simultanea/alerta-gestion-simultanea.component';
import { AuditTrailComponent } from '../../../shared/components/audit-trail/audit-trail.component';
import { NotasTimelineComponent } from '../../../shared/components/notas-timeline/notas-timeline.component';
import { PanelDerivacionesComponent } from '../../../shared/components/panel-derivaciones/panel-derivaciones.component';
import { BloqueoOptimista } from '../../../shared/concurrencia/bloqueo-optimista';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { AlmaPermisosService } from '../../../shared/permisos/alma-permisos.service';
import { TipoNota } from '../../../shared/types/alma-dto';
import {
  ETIQUETA_ESTADO_ATENCION,
  ETIQUETA_ESTADO_CASO,
  ETIQUETA_PRIORIDAD_CASO,
  ETIQUETA_RIESGO_CLINICO,
  ETIQUETA_TRIAJE,
  ItemCatalogo
} from '../../../shared/types/alma.types';
import { CierreCasoDialogComponent, CierreCasoDialogData, CierreCasoResultado } from '../../components/cierre-caso-dialog/cierre-caso-dialog.component';
import { SeguimientosComponent } from '../../components/seguimientos/seguimientos.component';
import { CasoAlma, CasosAlmaService } from '../../services/casos-alma.service';
import { NotificacionesPsicologiaService } from '../../services/notificaciones-psicologia.service';

const TIPOS_NOTA_CLINICOS: readonly TipoNota[] = ['APH', 'PSICO', 'SEGTO', 'POST_CIERRE'];

/**
 * Expediente del caso — `/linea-alma/psicologia/casos/:numeroCaso` (J-2.1; J-1.5, J-1.6).
 *
 * Vista **consolidada en una sola llamada** (`GET /casos/{n}`): datos, triaje APH y valoración
 * clínica por separado (RN-ALMA-04), dimensiones, presunto agresor, atenciones APH vinculadas
 * (1:N), línea de tiempo (`NotasTimeline`), seguimientos, derivaciones (`PanelDerivaciones` con
 * contexto `CASO`), alertas, cierre con motivo predefinido y PDF (solo con `alma.pdf.exportar`),
 * y `AuditTrail`. Tras el cierre queda de solo lectura.
 */
@Component({
  selector: 'app-caso-page',
  imports: [
    DatePipe,
    RouterLink,
    MatIconModule,
    AlertaGestionSimultaneaComponent,
    AuditTrailComponent,
    NotasTimelineComponent,
    PanelDerivacionesComponent,
    SeguimientosComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './caso.page.html',
  styleUrl: './caso.page.scss'
})
export class CasoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly servicio = inject(CasosAlmaService);
  private readonly catalogos = inject(CatalogosAlmaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly notificaciones = inject(NotificacionesPsicologiaService);
  private readonly dialog = inject(MatDialog);
  private readonly documento = inject(DOCUMENT);
  protected readonly permisos = inject(AlmaPermisosService);

  private readonly numeroCaso = this.route.snapshot.paramMap.get('numeroCaso') ?? '';

  protected readonly demo = Object.values(environment.lineaAlma.mocks).some(Boolean);
  protected readonly etiquetaEstado = ETIQUETA_ESTADO_CASO;
  protected readonly etiquetaEstadoAtencion = ETIQUETA_ESTADO_ATENCION;
  protected readonly etiquetaPrioridad = ETIQUETA_PRIORIDAD_CASO;
  protected readonly etiquetaTriaje = ETIQUETA_TRIAJE;
  protected readonly etiquetaRiesgo = ETIQUETA_RIESGO_CLINICO;
  protected readonly tiposNota = TIPOS_NOTA_CLINICOS;

  protected readonly bloqueo = new BloqueoOptimista<CasoAlma>({
    recargar: () => this.servicio.obtener(this.numeroCaso),
    alConflicto: () => this.notificacion.info('El caso cambió mientras lo revisaba. Cargamos la versión más reciente.')
  });
  protected readonly caso = this.bloqueo.recurso;
  protected readonly cargando = signal(true);
  protected readonly error = signal<ErrorAlma | null>(null);
  protected readonly descargandoPdf = signal(false);
  protected readonly versionAuditoria = signal(0);
  protected readonly dimensiones = signal<ItemCatalogo[]>([]);
  protected readonly vinculos = signal<ItemCatalogo[]>([]);
  protected readonly motivosCierre = signal<ItemCatalogo[]>([]);

  protected readonly puedeEditar = computed(() => (this.caso()?.activo ?? false) && this.permisos.tiene('alma.psicologia.editar'));
  protected readonly puedeCerrar = computed(() => (this.caso()?.activo ?? false) && this.permisos.tiene('alma.psicologia.cerrar'));
  protected readonly puedeExportarPdf = computed(() => this.permisos.tiene('alma.pdf.exportar'));
  protected readonly puedeVerAph = computed(() => this.permisos.tiene('alma.aph.consultar'));
  protected readonly contexto = computed(() => ({ tipo: 'CASO' as const, id: this.caso()?.numeroCaso ?? '' }));
  protected readonly etiquetasDimensiones = computed(() => etiquetasDe(this.dimensiones(), this.caso()?.dimensiones ?? []));
  protected readonly etiquetaVinculo = computed(() => {
    const vinculo = this.caso()?.presuntoAgresor?.vinculo;
    return vinculo ? (this.vinculos().find((v) => v.codigo === vinculo)?.etiqueta ?? vinculo) : null;
  });
  protected readonly etiquetaMotivoCierre = computed(() => {
    const motivo = this.caso()?.cierre?.motivo;
    return motivo ? (this.motivosCierre().find((m) => m.codigo === motivo)?.etiqueta ?? motivo) : null;
  });

  ngOnInit(): void {
    this.cargar();
    this.catalogos.obtener('dimensiones-salud-mental').subscribe({ next: (items) => this.dimensiones.set(items), error: () => undefined });
    this.catalogos.obtener('vinculos-agresor').subscribe({ next: (items) => this.vinculos.set(items), error: () => undefined });
    this.catalogos.obtener('motivos-cierre-psicologia').subscribe({ next: (items) => this.motivosCierre.set(items), error: () => undefined });
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.bloqueo.cargar().subscribe({
      next: () => {
        this.cargando.set(false);
        this.versionAuditoria.update((v) => v + 1);
      },
      error: (e: ErrorAlma) => {
        this.error.set(e);
        this.cargando.set(false);
      }
    });
  }

  protected actualizado(caso: CasoAlma): void {
    this.bloqueo.establecer(caso);
    this.versionAuditoria.update((v) => v + 1);
    this.notificaciones.refrescar();
  }

  protected tras409(): void {
    this.cargar();
  }

  protected abrirCierre(): void {
    const caso = this.caso();
    if (!caso || !this.puedeCerrar()) return;
    const data: CierreCasoDialogData = { numeroCaso: caso.numeroCaso, puedeExportarPdf: this.puedeExportarPdf() };
    this.dialog
      .open<CierreCasoDialogComponent, CierreCasoDialogData, CierreCasoResultado | undefined>(CierreCasoDialogComponent, {
        data,
        width: '520px',
        maxWidth: '92vw',
        restoreFocus: true
      })
      .afterClosed()
      .subscribe({
        next: (resultado) => resultado && this.cerrar(resultado),
        error: () => undefined
      });
  }

  private cerrar(resultado: CierreCasoResultado): void {
    this.bloqueo
      .ejecutar((version) => this.servicio.cerrar(this.numeroCaso, { version, motivo: resultado.motivo, observacion: resultado.observacion }))
      .subscribe({
        next: (caso) => {
          this.versionAuditoria.update((v) => v + 1);
          this.notificaciones.refrescar();
          this.notificacion.exito(`Caso ${caso.numeroCaso} cerrado. Queda de solo lectura.`);
          if (resultado.generarPdf) this.descargarPdf();
        },
        error: (e: ErrorAlma) => this.notificacion.error(e.mensaje, e)
      });
  }

  /** RF-ALMA-007: el PDF lo genera el servidor; aquí solo se descarga con tolerancia de 30 s (Q10). */
  protected descargarPdf(): void {
    const caso = this.caso();
    if (!caso || !this.puedeExportarPdf() || this.descargandoPdf()) return;
    this.descargandoPdf.set(true);
    this.servicio.descargarPdf(caso.numeroCaso).subscribe({
      next: (archivo) => {
        this.descargandoPdf.set(false);
        this.ofrecerDescarga(archivo, `${caso.numeroCaso}.pdf`);
        this.notificacion.exito('PDF del historial descargado.');
      },
      error: (e: ErrorAlma | Error) => {
        this.descargandoPdf.set(false);
        const mensaje = 'mensaje' in e ? e.mensaje : 'La generación del PDF tardó más de lo esperado. Intente de nuevo en unos minutos.';
        this.notificacion.error(mensaje, e);
      }
    });
  }

  private ofrecerDescarga(archivo: Blob, nombre: string): void {
    const ventana = this.documento.defaultView;
    if (!ventana) return;
    const url = ventana.URL.createObjectURL(archivo);
    const enlace = this.documento.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.rel = 'noopener';
    this.documento.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    ventana.setTimeout(() => ventana.URL.revokeObjectURL(url), 10_000);
  }
}
