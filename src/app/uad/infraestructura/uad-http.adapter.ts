import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UadApiPort } from '../contratos/uad-api.port';
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
} from '../contratos/uad-api.types';
import { interpretarErrorUad } from './uad-error';

/**
 * Adaptador HTTP del puerto UAD. Rutas y verbos de `docs/contratos/uad/openapi-uad.yaml`.
 *
 * **Ninguna de estas rutas existe todavía en el backend** (auditoría 2026-11-14). Con
 * `environment.uad.adaptador = 'http'` las llamadas saldrán a red y, hasta que Backend registre las
 * rutas en `endpoint`/`endpointrole`, el `DynamicEndpointAuthorizationManager` responderá 403.
 * El JWT lo agrega el `authInterceptor` global.
 */
@Injectable()
export class UadHttpAdapter extends UadApiPort {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/uad`;
  private readonly maestros = `${environment.apiBaseUrl}/maestros`;

  obtenerContexto(): Observable<ContextoUsuarioUad> {
    return this.http.get<ContextoUsuarioUad>(`${this.base}/contexto`).pipe(this.traducir());
  }

  listarNoticias(filtro: FiltroNoticias): Observable<Pagina<NoticiaResumen>> {
    const params = parametros({
      tipo: filtro.tipo,
      estado: filtro.estado,
      fechaRecepcionDesde: filtro.fechaRecepcionDesde,
      fechaRecepcionHasta: filtro.fechaRecepcionHasta,
      consecutivo: filtro.consecutivo,
      page: filtro.page,
      size: filtro.size,
      sort: 'fechaRecepcion,desc'
    });
    return this.http.get<Pagina<NoticiaResumen>>(`${this.base}/noticias`, { params }).pipe(this.traducir());
  }

  obtenerNoticia(noticiaId: string): Observable<NoticiaDetalle> {
    return this.http.get<NoticiaDetalle>(`${this.base}/noticias/${encodeURIComponent(noticiaId)}`).pipe(this.traducir());
  }

  clasificarVinculacion(noticiaId: string, cuerpo: ClasificacionRequest): Observable<ClasificacionResponse> {
    return this.http
      .post<ClasificacionResponse>(`${this.base}/noticias/${encodeURIComponent(noticiaId)}/clasificacion`, cuerpo)
      .pipe(this.traducir());
  }

  consultarCasosAsociados(noticiaId: string): Observable<readonly CasoAsociado[]> {
    return this.http
      .get<CasoAsociado[]>(`${this.base}/noticias/${encodeURIComponent(noticiaId)}/casos-asociados`)
      .pipe(this.traducir());
  }

  registrarDecision(noticiaId: string, cuerpo: DecisionEvaluacionRequest): Observable<DecisionEvaluacionResponse> {
    return this.http
      .post<DecisionEvaluacionResponse>(`${this.base}/noticias/${encodeURIComponent(noticiaId)}/decisiones`, cuerpo)
      .pipe(this.traducir());
  }

  historialNoticia(noticiaId: string): Observable<readonly EventoHistorial[]> {
    return this.http.get<EventoHistorial[]>(`${this.base}/noticias/${encodeURIComponent(noticiaId)}/historial`).pipe(this.traducir());
  }

  descargarEvidencia(evidenciaId: string): Observable<Blob> {
    return this.http
      .get(`${this.base}/evidencias/${encodeURIComponent(evidenciaId)}/descarga`, { responseType: 'blob' })
      .pipe(this.traducir<Blob>());
  }

  catalogo(nombre: CatalogoUad): Observable<readonly MaestroUad[]> {
    return this.http.get<MaestroUad[]>(`${this.maestros}/${nombre}`).pipe(this.traducir());
  }

  listarCasos(filtro: FiltroCasosUad): Observable<Pagina<CasoUadResumen>> {
    const params = parametros({ fase: filtro.fase, page: filtro.page, size: filtro.size });
    return this.http.get<Pagina<CasoUadResumen>>(`${this.base}/casos`, { params }).pipe(this.traducir());
  }

  obtenerCaso(casoUadId: string): Observable<CasoUadDetalle> {
    return this.http.get<CasoUadDetalle>(this.caso(casoUadId)).pipe(this.traducir());
  }

  catalogoActuaciones(casoUadId: string): Observable<readonly ActuacionDisponible[]> {
    return this.http.get<ActuacionDisponible[]>(`${this.caso(casoUadId)}/actuaciones/catalogo`).pipe(this.traducir());
  }

  registrarActuaciones(casoUadId: string, cuerpo: RegistrarActuacionesRequest): Observable<ResultadoAccionCaso> {
    return this.http.post<ResultadoAccionCaso>(`${this.caso(casoUadId)}/actuaciones`, cuerpo).pipe(this.traducir());
  }

  historialCaso(casoUadId: string): Observable<readonly EventoHistorial[]> {
    return this.http.get<EventoHistorial[]>(`${this.caso(casoUadId)}/historial`).pipe(this.traducir());
  }

  evidenciasCaso(casoUadId: string): Observable<readonly EvidenciaMetadato[]> {
    return this.http.get<EvidenciaMetadato[]>(`${this.caso(casoUadId)}/evidencias`).pipe(this.traducir());
  }

  registrarExpediente(casoUadId: string, cuerpo: ExpedienteRequest): Observable<ResultadoAccionCaso> {
    return this.http.patch<ResultadoAccionCaso>(`${this.caso(casoUadId)}/expediente`, cuerpo).pipe(this.traducir());
  }

  finalizarInstruccion(casoUadId: string, cuerpo: TrasladoRequest): Observable<ResultadoAccionCaso> {
    return this.http.post<ResultadoAccionCaso>(`${this.caso(casoUadId)}/traslado-decision`, cuerpo).pipe(this.traducir());
  }

  remitirCasoPorCompetencia(casoUadId: string, cuerpo: RemisionCompetenciaCasoRequest): Observable<ResultadoAccionCaso> {
    return this.http.post<ResultadoAccionCaso>(`${this.caso(casoUadId)}/remisiones-competencia`, cuerpo).pipe(this.traducir());
  }

  private caso(casoUadId: string): string {
    return `${this.base}/casos/${encodeURIComponent(casoUadId)}`;
  }

  private traducir<T>() {
    return catchError<T, Observable<never>>((error: unknown) => throwError(() => interpretarErrorUad(error)));
  }
}

function parametros(valores: Record<string, string | number | null | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor !== null && valor !== undefined && valor !== '') params = params.set(clave, String(valor));
  }
  return params;
}
