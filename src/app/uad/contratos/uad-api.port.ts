import { Observable } from 'rxjs';
import {
  ActuacionDisponible,
  CasoAsociado,
  CasoUadDetalle,
  CasoUadResumen,
  CatalogoUad,
  ClasificacionRequest,
  ClasificacionResponse,
  ContextoUsuarioUad,
  DecisionEvaluacionRequest,
  DecisionEvaluacionResponse,
  EventoHistorial,
  EvidenciaMetadato,
  ExpedienteRequest,
  FiltroCasosUad,
  FiltroNoticias,
  MaestroUad,
  NoticiaDetalle,
  NoticiaResumen,
  Pagina,
  RegistrarActuacionesRequest,
  RemisionCompetenciaCasoRequest,
  ResultadoAccionCaso,
  TrasladoRequest
} from './uad-api.types';

/**
 * Puerto del módulo UAD: **única frontera** entre la interfaz y el backend.
 *
 * ```text
 * Página / componentes  →  UadFacade  →  UadApiPort
 *                                          ├─ UadHttpAdapter  (backend Spring Boot, cuando exista)
 *                                          └─ UadMockAdapter  (primera iteración; datos sintéticos)
 * ```
 *
 * Cada método corresponde a un `operationId` de `docs/contratos/uad/openapi-uad.yaml`. Los errores
 * se entregan ya traducidos a `ErrorUad` (`infraestructura/uad-error.ts`), igual en ambos adaptadores.
 * El adaptador lo elige `provideUadApi()` según `environment.uad.adaptador`.
 */
export abstract class UadApiPort {
  /** `GET /uad/contexto` — obtenerContextoUad. */
  abstract obtenerContexto(): Observable<ContextoUsuarioUad>;

  /** `GET /uad/noticias` — listarNoticias. */
  abstract listarNoticias(filtro: FiltroNoticias): Observable<Pagina<NoticiaResumen>>;

  /** `GET /uad/noticias/{noticiaId}` — obtenerNoticia. Operación segura: no cambia estado ni crea casoId. */
  abstract obtenerNoticia(noticiaId: string): Observable<NoticiaDetalle>;

  /** `POST /uad/noticias/{noticiaId}/clasificacion` — clasificarVinculacion. */
  abstract clasificarVinculacion(noticiaId: string, cuerpo: ClasificacionRequest): Observable<ClasificacionResponse>;

  /** `GET /uad/noticias/{noticiaId}/casos-asociados` — consultarCasosAsociados. No vincula. */
  abstract consultarCasosAsociados(noticiaId: string): Observable<readonly CasoAsociado[]>;

  /** `POST /uad/noticias/{noticiaId}/decisiones` — registrarDecisionEvaluacion. */
  abstract registrarDecision(noticiaId: string, cuerpo: DecisionEvaluacionRequest): Observable<DecisionEvaluacionResponse>;

  /** `GET /uad/noticias/{noticiaId}/historial` — historialNoticia. */
  abstract historialNoticia(noticiaId: string): Observable<readonly EventoHistorial[]>;

  /** `GET /uad/evidencias/{evidenciaId}/descarga` — descargarEvidencia (binario autorizado). */
  abstract descargarEvidencia(evidenciaId: string): Observable<Blob>;

  /** `GET /maestros/{catalogo}` — catálogos propuestos con la forma real de `MaestroDTO`. */
  abstract catalogo(nombre: CatalogoUad): Observable<readonly MaestroUad[]>;

  // ------------------------------------------------------------------ Entrega 2: casos UAD

  /** `GET /uad/casos` — listarCasosUad. Solo casos activos del equipo y la fase del usuario. */
  abstract listarCasos(filtro: FiltroCasosUad): Observable<Pagina<CasoUadResumen>>;

  /** `GET /uad/casos/{casoUadId}` — obtenerCasoUad. Operación segura. */
  abstract obtenerCaso(casoUadId: string): Observable<CasoUadDetalle>;

  /** `GET /uad/casos/{casoUadId}/actuaciones/catalogo` — catalogoActuaciones. */
  abstract catalogoActuaciones(casoUadId: string): Observable<readonly ActuacionDisponible[]>;

  /** `POST /uad/casos/{casoUadId}/actuaciones` — registrarActuaciones (solo ordinarias; no cambian la fase). */
  abstract registrarActuaciones(casoUadId: string, cuerpo: RegistrarActuacionesRequest): Observable<ResultadoAccionCaso>;

  /** `GET /uad/casos/{casoUadId}/historial` — historialCaso. */
  abstract historialCaso(casoUadId: string): Observable<readonly EventoHistorial[]>;

  /** `GET /uad/casos/{casoUadId}/evidencias` — evidenciasCaso (metadatos; la carga está deshabilitada). */
  abstract evidenciasCaso(casoUadId: string): Observable<readonly EvidenciaMetadato[]>;

  /** `PATCH /uad/casos/{casoUadId}/expediente` — registrarExpedienteUad. */
  abstract registrarExpediente(casoUadId: string, cuerpo: ExpedienteRequest): Observable<ResultadoAccionCaso>;

  /** `POST /uad/casos/{casoUadId}/traslado-decision` — finalizarInstruccion. */
  abstract finalizarInstruccion(casoUadId: string, cuerpo: TrasladoRequest): Observable<ResultadoAccionCaso>;

  /** `POST /uad/casos/{casoUadId}/remisiones-competencia` — remitirCasoPorCompetencia (solo registra). */
  abstract remitirCasoPorCompetencia(casoUadId: string, cuerpo: RemisionCompetenciaCasoRequest): Observable<ResultadoAccionCaso>;
}
