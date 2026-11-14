import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ConCambiosPendientes } from '../../../../core/navegacion/cambios-sin-guardar.guard';
import { AlertaGestionSimultaneaComponent } from '../../../shared/components/alerta-gestion-simultanea/alerta-gestion-simultanea.component';
import { AuditTrailComponent } from '../../../shared/components/audit-trail/audit-trail.component';
import { NotasTimelineComponent } from '../../../shared/components/notas-timeline/notas-timeline.component';
import { PanelDerivacionesComponent } from '../../../shared/components/panel-derivaciones/panel-derivaciones.component';
import { SlaBadgeComponent } from '../../../shared/components/sla-badge/sla-badge.component';
import { BloqueoOptimista } from '../../../shared/concurrencia/bloqueo-optimista';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { AlmaPermisosService } from '../../../shared/permisos/alma-permisos.service';
import { PrimerContactoRespuestaDto } from '../../../shared/types/alma-psicologia-dto';
import { ETIQUETA_CANAL_INGRESO, ETIQUETA_ESTADO_ATENCION, ETIQUETA_ORIGEN_REMISION, ETIQUETA_TRIAJE } from '../../../shared/types/alma.types';
import { IntentosContactoComponent } from '../../components/intentos-contacto/intentos-contacto.component';
import { PrimerContactoComponent } from '../../components/primer-contacto/primer-contacto.component';
import { NotificacionesPsicologiaService } from '../../services/notificaciones-psicologia.service';
import { NovedadPsicologia, NovedadesPsicologiaService } from '../../services/novedades-psicologia.service';

/**
 * Gestión de la novedad — `/linea-alma/psicologia/novedades/:idAtencion` (J-1.2, J-1.3, J-1.4).
 *
 * Detalle de lo que entregó APH (notas APH de solo lectura, triaje **no editable** por
 * RN-ALMA-04, consentimiento, derivaciones previas) y marca de recontacto; **Tomar** / **Liberar**
 * con bloqueo optimista (`BloqueoOptimista`, RNF-ALMA-001); protocolo de intentos; primer
 * contacto efectivo que crea el `CAS-…` y redirige al expediente.
 */
@Component({
  selector: 'app-novedad-page',
  imports: [
    DatePipe,
    RouterLink,
    MatIconModule,
    AlertaGestionSimultaneaComponent,
    AuditTrailComponent,
    IntentosContactoComponent,
    NotasTimelineComponent,
    PanelDerivacionesComponent,
    PrimerContactoComponent,
    SlaBadgeComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './novedad.page.html',
  styleUrl: './novedad.page.scss'
})
export class NovedadPage implements OnInit, ConCambiosPendientes {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly servicio = inject(NovedadesPsicologiaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly notificaciones = inject(NotificacionesPsicologiaService);
  protected readonly permisos = inject(AlmaPermisosService);

  private readonly primerContacto = viewChild(PrimerContactoComponent);
  private readonly idAtencion = this.route.snapshot.paramMap.get('idAtencion') ?? '';

  protected readonly demo = Object.values(environment.lineaAlma.mocks).some(Boolean);
  protected readonly etiquetaEstado = ETIQUETA_ESTADO_ATENCION;
  protected readonly etiquetaCanal = ETIQUETA_CANAL_INGRESO;
  protected readonly etiquetaOrigen = ETIQUETA_ORIGEN_REMISION;
  protected readonly etiquetaTriaje = ETIQUETA_TRIAJE;

  /** Recurso versionado: tomar, liberar e intentos envían la `version` leída. */
  protected readonly bloqueo = new BloqueoOptimista<NovedadPsicologia>({
    recargar: () => this.servicio.obtener(this.idAtencion),
    alConflicto: () => this.notificacion.info('La novedad cambió mientras la revisaba. Cargamos la versión más reciente.')
  });
  protected readonly novedad = this.bloqueo.recurso;
  protected readonly cargando = signal(true);
  protected readonly error = signal<ErrorAlma | null>(null);
  protected readonly mostrarPrimerContacto = signal(false);
  protected readonly versionAuditoria = signal(0);

  protected readonly puedeEditar = computed(() => this.permisos.tiene('alma.psicologia.editar'));
  protected readonly puedeVerClinico = computed(() => this.permisos.tiene('alma.notasClinicas.consultar'));
  protected readonly puedeTomar = computed(() => {
    const n = this.novedad();
    return !!n && n.pendiente && !n.tomadaPor && this.puedeEditar();
  });
  protected readonly puedeLiberar = computed(() => {
    const n = this.novedad();
    return !!n && n.pendiente && n.tomadaPorMi && this.puedeEditar();
  });
  protected readonly gestionando = computed(() => {
    const n = this.novedad();
    return !!n && n.pendiente && n.tomadaPorMi && this.puedeEditar();
  });
  protected readonly contexto = computed(() => ({ tipo: 'ATENCION_APH' as const, id: this.novedad()?.idAtencion ?? '' }));

  ngOnInit(): void {
    this.cargar();
  }

  tieneCambiosPendientes(): boolean {
    return this.primerContacto()?.tieneCambiosPendientes() ?? false;
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

  protected tomar(): void {
    this.bloqueo.ejecutar((version) => this.servicio.tomar(this.idAtencion, version)).subscribe({
      next: () => {
        this.notificacion.exito('Novedad tomada. Ahora puede registrar intentos de contacto.');
        this.notificaciones.refrescar();
        this.versionAuditoria.update((v) => v + 1);
      },
      error: (e: ErrorAlma) => this.notificacion.error(e.mensaje, e)
    });
  }

  protected liberar(): void {
    this.bloqueo.ejecutar((version) => this.servicio.liberar(this.idAtencion, version)).subscribe({
      next: () => {
        this.mostrarPrimerContacto.set(false);
        this.notificacion.info('Novedad liberada: vuelve a la cola compartida.');
        this.notificaciones.refrescar();
        this.versionAuditoria.update((v) => v + 1);
      },
      error: (e: ErrorAlma) => this.notificacion.error(e.mensaje, e)
    });
  }

  protected actualizada(novedad: NovedadPsicologia): void {
    this.bloqueo.establecer(novedad);
    this.versionAuditoria.update((v) => v + 1);
    if (!novedad.pendiente) this.mostrarPrimerContacto.set(false);
  }

  protected tras409(): void {
    this.cargar();
  }

  protected abrirPrimerContacto(): void {
    this.mostrarPrimerContacto.set(true);
  }

  protected casoCreado(respuesta: PrimerContactoRespuestaDto): void {
    this.mostrarPrimerContacto.set(false);
    this.notificaciones.refrescar();
    void this.router.navigate(['/linea-alma/psicologia/casos', respuesta.numeroCaso]);
  }
}
