import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { AlertaGestionSimultaneaComponent } from '../../../shared/components/alerta-gestion-simultanea/alerta-gestion-simultanea.component';
import { AuditTrailComponent } from '../../../shared/components/audit-trail/audit-trail.component';
import { ContencionPostCierreFormComponent } from '../../../shared/components/contencion-post-cierre-form/contencion-post-cierre-form.component';
import { NotasTimelineComponent } from '../../../shared/components/notas-timeline/notas-timeline.component';
import { PanelDerivacionesComponent } from '../../../shared/components/panel-derivaciones/panel-derivaciones.component';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { AlmaPermisosService } from '../../../shared/permisos/alma-permisos.service';
import {
  ETIQUETA_CANAL_INGRESO,
  ETIQUETA_ESTADO_ATENCION,
  ETIQUETA_ORIGEN_REMISION,
  ETIQUETA_TRIAJE
} from '../../../shared/types/alma.types';
import { CierreAtencionComponent } from '../../components/cierre-atencion/cierre-atencion.component';
import { AtencionAph, AtencionesAphService } from '../../services/atenciones-aph.service';
import { PersonasAlmaService } from '../../services/personas-alma.service';

/**
 * Detalle de una atención APH — `/linea-alma/aph/atenciones/:idAtencion` (H-2.1).
 *
 * Reúne datos, triaje, derivaciones y rutas, notas APH, estado, plazo y la alerta de gestión
 * simultánea. **Solo notas APH (y de después del cierre): ningún dato clínico de Psicología**
 * (RNF-ALMA-002). Cada acción de edición depende del permiso y del estado de la atención; el
 * Backend sigue siendo la autoridad.
 */
@Component({
  selector: 'app-detalle-atencion-page',
  imports: [
    DatePipe,
    RouterLink,
    MatIconModule,
    AlertaGestionSimultaneaComponent,
    AuditTrailComponent,
    CierreAtencionComponent,
    ContencionPostCierreFormComponent,
    NotasTimelineComponent,
    PanelDerivacionesComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalle-atencion.page.html',
  styleUrl: './detalle-atencion.page.scss'
})
export class DetalleAtencionPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly atenciones = inject(AtencionesAphService);
  private readonly personas = inject(PersonasAlmaService);
  private readonly notificacion = inject(NotificacionService);
  protected readonly permisos = inject(AlmaPermisosService);

  protected readonly demo = Object.values(environment.lineaAlma.mocks).some(Boolean);
  protected readonly etiquetaEstado = ETIQUETA_ESTADO_ATENCION;
  protected readonly etiquetaCanal = ETIQUETA_CANAL_INGRESO;
  protected readonly etiquetaOrigen = ETIQUETA_ORIGEN_REMISION;
  protected readonly etiquetaTriaje = ETIQUETA_TRIAJE;

  protected readonly cargando = signal(true);
  protected readonly error = signal<ErrorAlma | null>(null);
  protected readonly atencion = signal<AtencionAph | null>(null);
  protected readonly casoCerrado = signal<string | null>(null);
  protected readonly versionAuditoria = signal(0);
  /** Hay rutas externas sin cerrar (impide el cierre de la atención). */
  protected readonly rutasPendientes = signal(false);

  protected readonly puedeEditar = computed(() => (this.atencion()?.editable ?? false) && this.permisos.tiene('alma.aph.editar'));
  protected readonly puedeCerrar = computed(() => {
    const a = this.atencion();
    return !!a && a.estado === 'EN_GESTION_APH' && a.aceptaPsicologia !== true && this.permisos.tiene('alma.aph.cerrar');
  });
  protected readonly bloqueoCierre = computed(() =>
    this.rutasPendientes() ? 'Hay rutas externas en curso. Registre su resultado o ciérrelas antes de cerrar la atención.' : null
  );
  protected readonly contexto = computed(() => ({ tipo: 'ATENCION_APH' as const, id: this.atencion()?.idAtencion ?? '' }));
  protected readonly vencido = computed(() => {
    const sla = this.atencion()?.sla;
    return !!sla && Date.parse(sla.venceEn) <= Date.parse(sla.ahoraServidor);
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    const id = this.route.snapshot.paramMap.get('idAtencion') ?? '';
    this.cargando.set(true);
    this.error.set(null);
    this.atenciones.obtener(id).subscribe({
      next: (atencion) => {
        this.aplicar(atencion);
        this.cargando.set(false);
        this.buscarCasoCerrado(atencion);
      },
      error: (e: ErrorAlma) => {
        this.error.set(e);
        this.cargando.set(false);
      }
    });
  }

  private aplicar(atencion: AtencionAph): void {
    this.atencion.set(atencion);
    this.rutasPendientes.set(atencion.rutasExternas.some((r) => r.estado !== 'CERRADA'));
    this.versionAuditoria.update((v) => v + 1);
  }

  /** Si la persona tiene un caso cerrado, se habilita la contención post-cierre (H-1.7). */
  private buscarCasoCerrado(atencion: AtencionAph): void {
    if (!this.permisos.tiene('alma.aph.editar') || atencion.estado === 'CERRADO') return;
    this.personas.consultar(atencion.persona.tipoIdentificacion, atencion.persona.numeroIdentificacion).subscribe({
      next: (c) => this.casoCerrado.set(c.casoCerrado?.numeroCaso ?? null),
      // La contención es opcional: si la consulta falla, la página sigue siendo útil.
      error: () => undefined
    });
  }

  protected tras(atencion: AtencionAph): void {
    this.aplicar(atencion);
  }

  protected alCambiarRutas(datos: { externas: { estado: string }[] }): void {
    this.rutasPendientes.set(datos.externas.some((r) => r.estado !== 'CERRADA'));
    this.versionAuditoria.update((v) => v + 1);
  }

  protected tras409(): void {
    this.notificacion.info('La atención cambió mientras la revisaba. Cargamos la versión más reciente.');
    this.cargar();
  }

  protected nombreCompleto(a: AtencionAph): string {
    return [a.persona.nombres, a.persona.apellidos].filter(Boolean).join(' ') || 'Sin nombre registrado';
  }
}
