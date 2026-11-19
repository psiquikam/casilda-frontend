import { DatePipe, LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DialogoService } from '../../../core/a11y/dialogo.service';
import { ErrorFormulario } from '../../../core/a11y/errores-formulario';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { ResumenErroresComponent } from '../../../core/a11y/resumen-errores.component';
import { ConCambiosPendientes } from '../../../core/navegacion/cambios-sin-guardar.guard';
import {
  AccionNoticia,
  CasoAsociado,
  DecisionEvaluacionResponse,
  EventoHistorial,
  ModoCaso,
  NoticiaDetalle,
  Reportante,
  TipoDecision,
  VinculacionInvestigado
} from '../../contratos/uad-api.types';
import { CasosAsociadosComponent } from '../../componentes/casos-asociados/casos-asociados.component';
import { EstadoNoticiaComponent } from '../../componentes/estado-noticia/estado-noticia.component';
import { PanelSimulacionComponent } from '../../componentes/panel-simulacion/panel-simulacion.component';
import { equipoInstructor, esVinculacionDeterminada } from '../../dominio/competencia';
import {
  JUSTIFICACION_INHIBITORIO_OBLIGATORIA,
  LIMITE_EXPEDIENTE_UAD,
  LIMITE_TEXTO_DECISION,
  ValoresDecision,
  construirDecision,
  fechaCalendario,
  validarDecision
} from '../../dominio/decision-evaluacion';
import {
  DESCRIPCION_DECISION,
  ETIQUETA_ACTOR,
  ETIQUETA_DECISION,
  ETIQUETA_DESTINATARIO,
  ETIQUETA_EQUIPO,
  ETIQUETA_ESTADO_NOTICIA,
  ETIQUETA_ESTADO_NOTIFICACION,
  ETIQUETA_EVENTO,
  ETIQUETA_FASE,
  ETIQUETA_ORIGEN,
  ETIQUETA_VINCULACION,
  VINCULACIONES
} from '../../dominio/etiquetas';
import { UadSimulacionService } from '../../infraestructura/mock/uad-mock-store';
import { ErrorUad } from '../../infraestructura/uad-error';
import { CatalogosEvaluacion, UadFacade } from '../../servicios/uad.facade';
import { AvisoBandeja } from '../bandeja-noticias/bandeja-noticias.page';

type VistaEvaluacion = 'cargando' | 'listo' | 'error' | 'no-encontrado' | 'sin-permiso';

const DECISIONES: readonly TipoDecision[] = ['CONTINUAR_TRAMITE', 'SOLICITAR_INFORMACION', 'INHIBITORIO', 'REMISION_COMPETENCIA'];

/** Ruta del campo en el cuerpo (como `validationErrors`) → control del DOM y etiqueta visible. */
const CAMPOS: Record<string, { id: string; etiqueta: string; control?: string }> = {
  tipo: { id: 'uad-decision', etiqueta: 'Decisión' },
  observaciones: { id: 'uad-observaciones', etiqueta: 'Observaciones', control: 'observaciones' },
  'continuarTramite.vinculacion': { id: 'uad-vinculacion', etiqueta: 'Vinculación del presunto responsable' },
  'continuarTramite.modoCaso': { id: 'uad-modo-caso', etiqueta: 'Caso Casilda' },
  'continuarTramite.casoIdVincular': { id: 'uad-casos-asociados', etiqueta: 'Caso existente' },
  'continuarTramite.confirmaMismosHechos': { id: 'uad-confirma-hechos', etiqueta: 'Confirmación de mismos hechos', control: 'confirmaMismosHechos' },
  'continuarTramite.expedienteUad': { id: 'uad-expediente', etiqueta: 'Número de expediente UAD', control: 'expedienteUad' },
  'solicitudInformacion.tipoSolicitudCodigo': { id: 'uad-tipo-solicitud', etiqueta: 'Tipo de solicitud', control: 'tipoSolicitudCodigo' },
  'solicitudInformacion.informacionRequerida': { id: 'uad-informacion', etiqueta: 'Información requerida', control: 'informacionRequerida' },
  'solicitudInformacion.fechaLimite': { id: 'uad-fecha-limite', etiqueta: 'Fecha límite para responder', control: 'fechaLimite' },
  'inhibitorio.causalCodigo': { id: 'uad-causal', etiqueta: 'Causal de inhibitorio', control: 'causalCodigo' },
  'inhibitorio.justificacion': { id: 'uad-justificacion-inhibitorio', etiqueta: 'Justificación de la decisión', control: 'justificacionInhibitorio' },
  'remisionCompetencia.faseProceso': { id: 'uad-fase-remision', etiqueta: 'Fase del proceso' },
  'remisionCompetencia.entidadDestinatariaCodigo': { id: 'uad-entidad', etiqueta: 'Entidad destinataria', control: 'entidadDestinatariaCodigo' },
  'remisionCompetencia.fechaRemision': { id: 'uad-fecha-remision', etiqueta: 'Fecha de remisión', control: 'fechaRemision' },
  'remisionCompetencia.justificacion': { id: 'uad-justificacion-remision', etiqueta: 'Justificación de la remisión', control: 'justificacionRemision' }
};

/**
 * Evaluación preliminar de una noticia NDI/NDA — `/uad/noticias/:noticiaId` (P-UAD-04/05; UAD-EVA-01 a 12).
 *
 * - Abrir esta vista **no** cambia el estado ni crea `casoId` (GET seguro, UAD-EVA-03).
 * - Una sola decisión por operación, con confirmación explícita y botón bloqueado mientras se envía.
 * - Las acciones habilitadas vienen del servidor (`accionesDisponibles` + `motivosNoDisponible`).
 * - Concurrencia: cada acción lleva la `version` leída; ante 409 se avisa y se recarga sin perder lo escrito.
 */
@Component({
  selector: 'app-uad-evaluacion-noticia-page',
  imports: [
    DatePipe,
    LowerCasePipe,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ResumenErroresComponent,
    CasosAsociadosComponent,
    EstadoNoticiaComponent,
    PanelSimulacionComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evaluacion-noticia.page.html',
  styleUrl: './evaluacion-noticia.page.scss'
})
export class EvaluacionNoticiaPage implements OnInit, ConCambiosPendientes {
  private readonly facade = inject(UadFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialogo = inject(DialogoService);
  private readonly notificacion = inject(NotificacionService);
  private readonly documento = inject(DOCUMENT);
  private readonly fb = inject(FormBuilder);
  protected readonly simulacion = inject(UadSimulacionService, { optional: true });

  protected readonly noticiaId = this.route.snapshot.paramMap.get('noticiaId') ?? '';
  protected readonly vista = signal<VistaEvaluacion>('cargando');
  protected readonly noticia = signal<NoticiaDetalle | null>(null);
  protected readonly historial = signal<readonly EventoHistorial[]>([]);
  protected readonly catalogos = signal<CatalogosEvaluacion | null>(null);
  protected readonly decision = signal<TipoDecision | null>(null);
  protected readonly casoIdVincular = signal<string | null>(null);
  protected readonly casosConsultados = signal<readonly string[] | null>(null);
  protected readonly erroresCampo = signal<Readonly<Record<string, string>>>({});
  protected readonly resumenErrores = signal<ErrorFormulario[]>([]);
  protected readonly enviando = signal(false);
  protected readonly clasificando = signal(false);
  protected readonly resultado = signal<DecisionEvaluacionResponse | null>(null);
  protected readonly vinculacionElegida = signal<VinculacionInvestigado | null>(null);

  protected readonly hoy = fechaCalendario(new Date());
  protected readonly manana = fechaCalendario(new Date(Date.now() + 86_400_000));

  protected readonly form = this.fb.nonNullable.group({
    observaciones: [''],
    modoCaso: ['CREAR_NUEVO' as ModoCaso],
    confirmaMismosHechos: [false],
    expedienteUad: [''],
    tipoSolicitudCodigo: [''],
    informacionRequerida: [''],
    fechaLimite: [''],
    causalCodigo: [''],
    justificacionInhibitorio: [''],
    entidadDestinatariaCodigo: [''],
    fechaRemision: [this.hoy],
    justificacionRemision: ['']
  });

  protected readonly decisiones = DECISIONES;
  protected readonly vinculaciones = VINCULACIONES;
  protected readonly limiteTexto = LIMITE_TEXTO_DECISION;
  protected readonly limiteExpediente = LIMITE_EXPEDIENTE_UAD;
  protected readonly justificacionInhibitorioObligatoria = JUSTIFICACION_INHIBITORIO_OBLIGATORIA;
  protected readonly etiquetaDecision = ETIQUETA_DECISION;
  protected readonly descripcionDecision = DESCRIPCION_DECISION;
  protected readonly etiquetaVinculacion = ETIQUETA_VINCULACION;
  protected readonly etiquetaOrigen = ETIQUETA_ORIGEN;
  protected readonly etiquetaActor = ETIQUETA_ACTOR;
  protected readonly etiquetaEquipo = ETIQUETA_EQUIPO;
  protected readonly etiquetaFase = ETIQUETA_FASE;
  protected readonly etiquetaEvento = ETIQUETA_EVENTO;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO_NOTICIA;
  protected readonly etiquetaNotificacion = ETIQUETA_ESTADO_NOTIFICACION;
  protected readonly etiquetaDestinatario = ETIQUETA_DESTINATARIO;

  protected readonly acciones = computed<ReadonlySet<AccionNoticia>>(() => new Set(this.noticia()?.accionesDisponibles ?? []));
  protected readonly puedeDecidir = computed(() => DECISIONES.some((d) => this.acciones().has(d)));
  protected readonly vinculacionEfectiva = computed(() => {
    const n = this.noticia();
    return n ? (n.vinculacionClasificada ?? n.vinculacionDeclarada) : null;
  });
  protected readonly equipoInstructor = computed(() => equipoInstructor(this.vinculacionEfectiva()));
  protected readonly modoCaso = signal<ModoCaso>('CREAR_NUEVO');

  ngOnInit(): void {
    this.form.controls.modoCaso.valueChanges.subscribe({ next: (m) => this.modoCaso.set(m), error: () => undefined });
    this.cargar();
  }

  tieneCambiosPendientes(): boolean {
    return this.form.dirty && !this.resultado() && !this.enviando();
  }

  protected cargar(): void {
    this.vista.set('cargando');
    if (!this.facade.contexto()) this.facade.cargarContexto().subscribe({ next: () => undefined, error: () => undefined });
    forkJoin({ noticia: this.facade.obtenerNoticia(this.noticiaId), historial: this.facade.historial(this.noticiaId) }).subscribe({
      next: ({ noticia, historial }) => {
        this.aplicarNoticia(noticia);
        this.historial.set(historial);
        this.vista.set('listo');
      },
      error: (e: ErrorUad) => this.errorDeCarga(e)
    });
    this.facade.catalogosEvaluacion().subscribe({
      next: (c) => this.catalogos.set(c),
      error: (e: ErrorUad) => this.notificacion.error('No pudimos cargar las listas de la evaluación. ' + e.mensaje, e)
    });
  }

  /** Recarga solo datos del servidor, conservando lo escrito en el formulario (tras 409 o simulaciones). */
  protected recargar(): void {
    forkJoin({ noticia: this.facade.obtenerNoticia(this.noticiaId), historial: this.facade.historial(this.noticiaId) }).subscribe({
      next: ({ noticia, historial }) => {
        this.aplicarNoticia(noticia);
        this.historial.set(historial);
      },
      error: (e: ErrorUad) => this.errorDeCarga(e)
    });
  }

  private aplicarNoticia(noticia: NoticiaDetalle): void {
    this.noticia.set(noticia);
    this.vinculacionElegida.set(noticia.vinculacionClasificada ?? noticia.vinculacionDeclarada);
    // UAD-ID-06: si el hecho ya tiene ID de caso, se conserva; no se ofrece crear otro.
    const modo: ModoCaso = noticia.casoId ? 'CONSERVAR_ASIGNADO' : this.form.controls.modoCaso.value === 'CONSERVAR_ASIGNADO' ? 'CREAR_NUEVO' : this.form.controls.modoCaso.value;
    this.form.controls.modoCaso.setValue(modo, { emitEvent: true });
    const elegida = this.decision();
    if (elegida && !this.acciones().has(elegida)) this.decision.set(null);
  }

  private errorDeCarga(e: ErrorUad): void {
    if (e.tipo === 'no-encontrado') this.vista.set('no-encontrado');
    else if (e.tipo === 'sin-permiso') this.vista.set('sin-permiso');
    else {
      this.vista.set('error');
      this.notificacion.error(e.mensaje, e);
    }
  }

  protected elegirDecision(tipo: TipoDecision): void {
    if (!this.acciones().has(tipo)) return;
    this.decision.set(tipo);
    this.erroresCampo.set({});
    this.resumenErrores.set([]);
  }

  protected nombreReportante(r: Reportante): string {
    return [r.primerNombre, r.segundoNombre, r.primerApellido, r.segundoApellido].filter((p) => !!p).join(' ') || 'Sin dato';
  }

  protected motivoNoDisponible(accion: AccionNoticia): string | null {
    return this.noticia()?.motivosNoDisponible[accion] ?? null;
  }

  protected error(ruta: string): string | null {
    return this.erroresCampo()[ruta] ?? null;
  }

  protected alConsultarCasos(lista: readonly CasoAsociado[]): void {
    this.casosConsultados.set(lista.map((c) => c.casoId));
    this.recargarHistorial();
  }

  // ------------------------------------------------------------------ clasificación (UAD-NOT-07/08)

  protected clasificar(): void {
    const n = this.noticia();
    const elegida = this.vinculacionElegida();
    if (!n || !elegida || this.clasificando()) return;
    const equipo = equipoInstructor(elegida);
    this.dialogo
      .confirmar({
        titulo: 'Clasificar vinculación',
        subtitulo: n.consecutivo,
        mensaje: equipo
          ? `La noticia quedará asignada a ${ETIQUETA_EQUIPO[equipo]} para instrucción. Si su equipo no es el competente, la noticia saldrá de su bandeja.`
          : 'Con esta vinculación la noticia sigue visible para ambos equipos hasta una nueva clasificación.',
        textoConfirmar: 'Guardar clasificación',
        iconoConfirmar: 'rule',
        textoCancelar: 'Cancelar'
      })
      .subscribe({
        next: (ok) => {
          if (!ok) return;
          this.clasificando.set(true);
          this.facade.clasificar(n, elegida).subscribe({
            next: (r) => {
              this.clasificando.set(false);
              if (!r.visibleParaUsuario || !r.noticia) {
                const estado: AvisoBandeja = {
                  aviso: `La noticia ${n.consecutivo} se clasificó como «${ETIQUETA_VINCULACION[elegida]}» y pasó al equipo competente. Ya no aparece en su bandeja.`
                };
                this.form.markAsPristine();
                void this.router.navigate(['/uad/noticias'], { queryParams: { tipo: n.tipo }, state: estado });
                return;
              }
              this.aplicarNoticia(r.noticia);
              this.recargarHistorial();
              this.notificacion.exito('Clasificación guardada.');
            },
            error: (e: ErrorUad) => this.errorDeAccion(e, () => this.clasificando.set(false))
          });
        },
        error: () => undefined
      });
  }

  // ------------------------------------------------------------------ decisión

  protected registrar(): void {
    const n = this.noticia();
    const tipo = this.decision();
    if (!n || this.enviando()) return;
    if (!tipo) {
      this.mostrarErrores({ tipo: 'Seleccione una decisión.' });
      return;
    }
    const v = this.form.getRawValue();
    const valores: ValoresDecision = {
      ...v,
      casoIdVincular: this.casoIdVincular(),
      faseProceso: 'EVALUACION_PRELIMINAR'
    };
    const cuerpo = construirDecision(tipo, n.version, valores);
    const errores = validarDecision(cuerpo, {
      tipoNoticia: n.tipo,
      casoIdActual: n.casoId,
      casosConsultados: this.casosConsultados(),
      tieneReportanteIdentificado: !!n.reportante,
      vinculacionDeterminada: esVinculacionDeterminada(this.vinculacionEfectiva()),
      hoy: this.hoy
    });
    if (Object.keys(errores).length > 0) {
      this.mostrarErrores(errores);
      return;
    }
    this.mostrarErrores({});

    this.dialogo
      .confirmar({
        titulo: `Confirmar: ${ETIQUETA_DECISION[tipo]}`,
        subtitulo: n.consecutivo,
        mensaje: this.resumenConfirmacion(n, tipo),
        textoConfirmar: 'Sí, registrar decisión',
        iconoConfirmar: 'gavel',
        textoCancelar: 'Revisar'
      })
      .subscribe({
        next: (ok) => {
          if (!ok || this.enviando()) return;
          this.enviando.set(true);
          this.facade.registrarDecision(n.noticiaId, cuerpo).subscribe({
            next: (r) => {
              this.enviando.set(false);
              this.resultado.set(r);
              this.form.markAsPristine();
              this.decision.set(null);
              this.aplicarNoticia(r.noticia);
              this.recargarHistorial();
              this.notificacion.exito('Decisión registrada.');
              queueMicrotask(() => this.documento.getElementById('uad-resultado')?.focus());
            },
            error: (e: ErrorUad) => this.errorDeAccion(e, () => this.enviando.set(false))
          });
        },
        error: () => undefined
      });
  }

  private resumenConfirmacion(n: NoticiaDetalle, tipo: TipoDecision): string {
    const c = this.catalogos();
    switch (tipo) {
      case 'CONTINUAR_TRAMITE': {
        const equipo = this.equipoInstructor();
        const caso =
          n.casoId != null
            ? `Se conserva el ID de caso Casilda ${n.casoId}.`
            : this.modoCaso() === 'VINCULAR_EXISTENTE'
              ? `Se vinculará al caso existente ${this.casoIdVincular()} por tratarse de los mismos hechos, conservando el consecutivo ${n.consecutivo}.`
              : 'El sistema generará un nuevo ID de caso Casilda al guardar.';
        const expediente = this.form.controls.expedienteUad.value.trim()
          ? `Expediente UAD: ${this.form.controls.expedienteUad.value.trim()}.`
          : 'Sin expediente UAD por ahora: puede registrarlo después.';
        return `La noticia pasará a «Procede trámite» y entrará a la bandeja de casos UAD${equipo ? ` de ${ETIQUETA_EQUIPO[equipo]}` : ''} en instrucción. ${caso} ${expediente} Esta decisión operativa no reemplaza el acto jurídico que inicia cada etapa.`;
      }
      case 'SOLICITAR_INFORMACION':
        return `La solicitud llegará al reportante dentro de Casilda («Mis reportes») y la noticia quedará «Pendiente de subsanación». Si no responde antes del ${this.form.controls.fechaLimite.value}, la noticia no se cierra sola: usted decide cómo continuar.`;
      case 'INHIBITORIO':
        return `Causal: ${UadFacade.nombreDe(c?.causalesInhibitorio ?? [], this.form.controls.causalCodigo.value)}. La gestión de la UAD sobre esta noticia queda como inhibitoria. El caso institucional, si existe, no se cierra. Este flujo está pendiente de validación jurídica.`;
      case 'REMISION_COMPETENCIA':
        return `Entidad: ${UadFacade.nombreDe(c?.entidadesRemision ?? [], this.form.controls.entidadDestinatariaCodigo.value)}. Casilda solo deja constancia: no envía correos ni documentos a esa entidad. La remisión oficial se hace por los canales institucionales.`;
    }
  }

  private mostrarErrores(errores: Record<string, string>): void {
    this.erroresCampo.set(errores);
    const resumen: ErrorFormulario[] = [];
    for (const [ruta, mensaje] of Object.entries(errores)) {
      const campo = CAMPOS[ruta] ?? { id: 'uad-decision', etiqueta: 'Decisión' };
      resumen.push({ id: campo.id, etiqueta: campo.etiqueta, mensaje });
      if (campo.control) {
        const control = this.form.get(campo.control);
        control?.setErrors({ servidor: mensaje });
        control?.markAsTouched();
      }
    }
    this.resumenErrores.set(resumen);
  }

  private errorDeAccion(e: ErrorUad, liberar: () => void): void {
    liberar();
    if (e.tipo === 'validacion' && Object.keys(e.camposInvalidos).length > 0) {
      this.mostrarErrores({ ...e.camposInvalidos });
      return;
    }
    this.notificacion.error(e.mensaje, e);
    // 409/404: lo leído ya no es vigente; se recarga sin borrar lo escrito (nunca se reintenta solo).
    if (e.tipo === 'conflicto' || e.tipo === 'no-encontrado') this.recargar();
  }

  private recargarHistorial(): void {
    this.facade.historial(this.noticiaId).subscribe({ next: (h) => this.historial.set(h), error: () => undefined });
  }

  // ------------------------------------------------------------------ evidencias (UAD-PRU-03, UAD-SEG-08)

  protected descargar(evidenciaId: string, nombre: string): void {
    this.facade.descargarEvidencia(evidenciaId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const enlace = this.documento.createElement('a');
        enlace.href = url;
        enlace.download = blob.type === 'text/plain' && !nombre.endsWith('.txt') ? `${nombre}.txt` : nombre;
        enlace.click();
        URL.revokeObjectURL(url);
        this.recargarHistorial();
      },
      error: (e: ErrorUad) => this.notificacion.error(e.mensaje, e)
    });
  }

  // ------------------------------------------------------------------ simulación (solo adaptador mock)

  protected simularCambioConcurrente(): void {
    const equipo = this.facade.contexto()?.equipos[0] ?? 'EQUIPO_3';
    this.simulacion?.simularCambioConcurrente(this.noticiaId, equipo);
    this.notificacion.info('Simulado: otra persona modificó la noticia. Su próxima acción recibirá un aviso de conflicto.');
  }

  protected simularRespuesta(): void {
    if (this.simulacion?.simularRespuestaReportante(this.noticiaId)) {
      this.notificacion.info('Simulado: el reportante respondió desde «Mis reportes».');
      this.recargar();
    }
  }
}
