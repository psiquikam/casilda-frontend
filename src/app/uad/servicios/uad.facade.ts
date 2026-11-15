import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, shareReplay, tap } from 'rxjs';
import { UadApiPort } from '../contratos/uad-api.port';
import {
  ActuacionDisponible,
  CasoAsociado,
  CasoUadDetalle,
  CasoUadResumen,
  CodigoActuacion,
  ClasificacionResponse,
  ContextoUsuarioUad,
  DecisionEvaluacionRequest,
  DecisionEvaluacionResponse,
  EventoHistorial,
  EvidenciaMetadato,
  FiltroCasosUad,
  FiltroNoticias,
  MaestroUad,
  NoticiaDetalle,
  NoticiaResumen,
  Pagina,
  ResultadoAccionCaso,
  VinculacionInvestigado
} from '../contratos/uad-api.types';

export interface CatalogosEvaluacion {
  readonly causalesInhibitorio: readonly MaestroUad[];
  readonly entidadesRemision: readonly MaestroUad[];
  readonly tiposSolicitud: readonly MaestroUad[];
}

/**
 * Servicio de aplicación del módulo UAD: lo único que inyectan las páginas.
 *
 * No contiene reglas de negocio (las decide el servidor y las simula el mock); solo orquesta el
 * puerto, cachea el contexto del usuario y los catálogos de la sesión. Los errores llegan como
 * `ErrorUad` desde el adaptador.
 */
@Injectable()
export class UadFacade {
  private readonly api = inject(UadApiPort);
  private catalogos$: Observable<CatalogosEvaluacion> | null = null;

  /** Contexto del usuario (`null` hasta cargarlo). Solo para mostrar u ocultar: no es autorización. */
  readonly contexto = signal<ContextoUsuarioUad | null>(null);

  cargarContexto(): Observable<ContextoUsuarioUad> {
    return this.api.obtenerContexto().pipe(tap((c) => this.contexto.set(c)));
  }

  listarNoticias(filtro: FiltroNoticias): Observable<Pagina<NoticiaResumen>> {
    return this.api.listarNoticias(filtro);
  }

  obtenerNoticia(noticiaId: string): Observable<NoticiaDetalle> {
    return this.api.obtenerNoticia(noticiaId);
  }

  clasificar(noticia: NoticiaDetalle, vinculacionInvestigado: VinculacionInvestigado): Observable<ClasificacionResponse> {
    return this.api.clasificarVinculacion(noticia.noticiaId, { vinculacionInvestigado, version: noticia.version });
  }

  consultarCasosAsociados(noticiaId: string): Observable<readonly CasoAsociado[]> {
    return this.api.consultarCasosAsociados(noticiaId);
  }

  registrarDecision(noticiaId: string, cuerpo: DecisionEvaluacionRequest): Observable<DecisionEvaluacionResponse> {
    return this.api.registrarDecision(noticiaId, cuerpo);
  }

  historial(noticiaId: string): Observable<readonly EventoHistorial[]> {
    return this.api.historialNoticia(noticiaId);
  }

  descargarEvidencia(evidenciaId: string): Observable<Blob> {
    return this.api.descargarEvidencia(evidenciaId);
  }

  listarCasos(filtro: FiltroCasosUad): Observable<Pagina<CasoUadResumen>> {
    return this.api.listarCasos(filtro);
  }

  // ------------------------------------------------------------------ Entrega 2: Gestionar caso

  obtenerCaso(casoUadId: string): Observable<CasoUadDetalle> {
    return this.api.obtenerCaso(casoUadId);
  }

  catalogoActuaciones(casoUadId: string): Observable<readonly ActuacionDisponible[]> {
    return this.api.catalogoActuaciones(casoUadId);
  }

  historialCaso(casoUadId: string): Observable<readonly EventoHistorial[]> {
    return this.api.historialCaso(casoUadId);
  }

  evidenciasCaso(casoUadId: string): Observable<readonly EvidenciaMetadato[]> {
    return this.api.evidenciasCaso(casoUadId);
  }

  /** Cada acción lleva la `version` leída del caso: si otra persona lo cambió, el servidor responde 409. */
  registrarActuaciones(caso: CasoUadDetalle, actuaciones: readonly CodigoActuacion[], observaciones: string | null): Observable<ResultadoAccionCaso> {
    return this.api.registrarActuaciones(caso.casoUadId, { actuaciones, observaciones, version: caso.version });
  }

  registrarExpediente(caso: CasoUadDetalle, expedienteUad: string | null): Observable<ResultadoAccionCaso> {
    return this.api.registrarExpediente(caso.casoUadId, { expedienteUad, version: caso.version });
  }

  finalizarInstruccion(caso: CasoUadDetalle, observaciones: string | null): Observable<ResultadoAccionCaso> {
    return this.api.finalizarInstruccion(caso.casoUadId, { confirmaTraslado: true, observaciones, version: caso.version });
  }

  remitirCasoPorCompetencia(
    caso: CasoUadDetalle,
    datos: { entidadDestinatariaCodigo: string; fechaRemision: string; justificacion: string | null }
  ): Observable<ResultadoAccionCaso> {
    return this.api.remitirCasoPorCompetencia(caso.casoUadId, { ...datos, version: caso.version });
  }

  /** Catálogos de la evaluación, una vez por sesión del módulo. Si fallan, se vuelven a pedir la próxima vez. */
  catalogosEvaluacion(): Observable<CatalogosEvaluacion> {
    if (!this.catalogos$) {
      this.catalogos$ = forkJoin({
        causalesInhibitorio: this.api.catalogo('uad-causales-inhibitorio'),
        entidadesRemision: this.api.catalogo('uad-entidades-remision'),
        tiposSolicitud: this.api.catalogo('uad-tipos-solicitud-informacion')
      }).pipe(
        tap({ error: () => (this.catalogos$ = null) }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.catalogos$;
  }

  /** Texto de una opción de catálogo por su código (para resúmenes y confirmaciones). */
  static nombreDe(lista: readonly MaestroUad[], codigo: string | null | undefined): string {
    return lista.find((m) => m.codigo === codigo)?.nombre ?? codigo ?? '';
  }
}
