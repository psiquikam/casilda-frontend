import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { UadApiPort } from '../../contratos/uad-api.port';
import {
  AccionNoticia,
  ActuacionDisponible,
  CasoUadDetalle,
  CapacidadUad,
  CasoAsociado,
  CasoUadResumen,
  CatalogoUad,
  ClasificacionRequest,
  ClasificacionResponse,
  ContextoUsuarioUad,
  DecisionEvaluacionRequest,
  DecisionEvaluacionResponse,
  EquipoUad,
  EstadoNoticia,
  EventoHistorial,
  FiltroCasosUad,
  FiltroNoticias,
  MaestroUad,
  NoticiaDetalle,
  NoticiaResumen,
  NotificacionEstado,
  Pagina,
  EvidenciaMetadato,
  ExpedienteRequest,
  RegistrarActuacionesRequest,
  RemisionCompetenciaCasoRequest,
  ResultadoAccionCaso,
  TrasladoRequest
} from '../../contratos/uad-api.types';
import { equipoDecisor, equipoInstructor, equiposConVisibilidad, esVinculacionDeterminada, esVisiblePara } from '../../dominio/competencia';
import { catalogoParaCaso, nombreActuacion, validarActuaciones } from '../../dominio/catalogo-actuaciones';
import { LIMITE_EXPEDIENTE_UAD, LIMITE_TEXTO_DECISION, fechaCalendario, validarDecision } from '../../dominio/decision-evaluacion';
import { ETIQUETA_DECISION, ETIQUETA_EQUIPO, ETIQUETA_ESTADO_NOTICIA, ETIQUETA_VINCULACION, VINCULACIONES } from '../../dominio/etiquetas';
import { interpretarErrorUad } from '../uad-error';
import { CATALOGOS_MOCK, CasoUadMock, NoticiaMock } from './uad-mock-seed';
import { UadMockStore, UadSimulacionService } from './uad-mock-store';

/** Latencia simulada (ms). Las pruebas la ponen en 0. */
export const UAD_MOCK_LATENCIA_MS = new InjectionToken<number>('UAD_MOCK_LATENCIA_MS', { factory: () => 250 });

const ESTADOS_EVALUABLES: ReadonlySet<EstadoNoticia> = new Set<EstadoNoticia>([
  'RECIBIDA',
  'PENDIENTE_CLASIFICACION',
  'EN_EVALUACION_PRELIMINAR',
  'PENDIENTE_SUBSANACION',
  'SUBSANACION_RECIBIDA',
  'EN_REEVALUACION'
]);

const TODAS_LAS_CAPACIDADES: readonly CapacidadUad[] = ['VER_NDI', 'VER_NDA', 'EVALUAR_NOTICIA', 'VER_CASOS'];

interface Actor {
  readonly contexto: ContextoUsuarioUad;
  readonly nombre: string;
  readonly equipo: EquipoUad | null;
}

/**
 * Adaptador **mock** del puerto UAD: simula el servidor propuesto en `openapi-uad.yaml` con datos
 * sintéticos, sin red. Cumple las mismas formas de respuesta y de error que el adaptador HTTP.
 *
 * Simula del lado «servidor»: visibilidad por equipo (UAD-NOT-05 a 09), cálculo de acciones
 * disponibles, versiones y 409, asignación de IDs, historial append-only y notificaciones como
 * **estado** (nunca envía nada: ni correos, ni remisiones externas, ni descargas reales).
 */
@Injectable()
export class UadMockAdapter extends UadApiPort {
  private readonly store = inject(UadMockStore);
  private readonly simulacion = inject(UadSimulacionService);
  private readonly auth = inject(AuthService);
  private readonly latencia = inject(UAD_MOCK_LATENCIA_MS);

  obtenerContexto(): Observable<ContextoUsuarioUad> {
    return this.responder(() => this.actor().contexto);
  }

  listarNoticias(filtro: FiltroNoticias): Observable<Pagina<NoticiaResumen>> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      const capacidad: CapacidadUad = filtro.tipo === 'NDI' ? 'VER_NDI' : 'VER_NDA';
      if (!actor.contexto.capacidades.includes(capacidad)) throw this.error(403, 'Sin permiso para esta bandeja.');
      const consecutivo = (filtro.consecutivo ?? '').trim().toUpperCase();
      const visibles = this.store.noticias
        .filter((n) => n.tipo === filtro.tipo)
        .filter((n) => this.visible(n, actor))
        .filter((n) => !filtro.estado || n.estado === filtro.estado)
        .filter((n) => !filtro.fechaRecepcionDesde || n.fechaRecepcion.slice(0, 10) >= filtro.fechaRecepcionDesde)
        .filter((n) => !filtro.fechaRecepcionHasta || n.fechaRecepcion.slice(0, 10) <= filtro.fechaRecepcionHasta)
        .filter((n) => !consecutivo || n.consecutivo.includes(consecutivo))
        .sort((a, b) => b.fechaRecepcion.localeCompare(a.fechaRecepcion));
      return paginar(visibles.map((n) => this.resumen(n)), filtro.page, filtro.size);
    });
  }

  obtenerNoticia(noticiaId: string): Observable<NoticiaDetalle> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      // GET seguro: no cambia estado ni crea casoId (UAD-EVA-03).
      return this.detalle(this.noticiaVisible(noticiaId, actor), actor);
    });
  }

  clasificarVinculacion(noticiaId: string, cuerpo: ClasificacionRequest): Observable<ClasificacionResponse> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      const n = this.noticiaVisible(noticiaId, actor);
      if (!ESTADOS_EVALUABLES.has(n.estado)) throw this.error(409, 'La noticia ya no está en evaluación.', 'NOTICIA_NO_EVALUABLE');
      if (!VINCULACIONES.includes(cuerpo.vinculacionInvestigado)) {
        throw this.error(400, 'Revise los datos marcados.', 'VALIDACION', { vinculacionInvestigado: 'Seleccione una vinculación de la lista.' });
      }
      this.exigirVersion(n, cuerpo.version);
      const anterior = n.vinculacionClasificada ?? n.vinculacionDeclarada;
      n.vinculacionClasificada = cuerpo.vinculacionInvestigado;
      if (n.estado === 'PENDIENTE_CLASIFICACION' || n.estado === 'RECIBIDA') n.estado = 'EN_EVALUACION_PRELIMINAR';
      n.version += 1;
      n.revisionConcurrente = null;
      this.store.registrarEvento(
        n.noticiaId,
        'CLASIFICACION_VINCULACION',
        `Vinculación: ${anterior ? ETIQUETA_VINCULACION[anterior] : 'sin dato'} → ${ETIQUETA_VINCULACION[cuerpo.vinculacionInvestigado]}.`,
        { profesional: actor.nombre, equipo: actor.equipo }
      );
      const visible = this.visible(n, actor);
      return { visibleParaUsuario: visible, noticia: visible ? this.detalle(n, actor) : null };
    });
  }

  consultarCasosAsociados(noticiaId: string): Observable<readonly CasoAsociado[]> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      const n = this.noticiaVisible(noticiaId, actor);
      if (!this.acciones(n, actor).acciones.includes('CONSULTAR_CASOS_ASOCIADOS')) {
        throw this.error(409, 'La consulta solo está disponible en evaluación preliminar.', 'NOTICIA_NO_EVALUABLE');
      }
      const casos = n.personaClave ? (this.store.casosPorPersona.get(n.personaClave) ?? []) : [];
      this.store.casosConsultados.set(n.noticiaId, casos.map((c) => c.casoId));
      // Se audita quién consultó (UAD-EVA-09); consultar no vincula ni crea caso.
      this.store.registrarEvento(n.noticiaId, 'CASOS_ASOCIADOS_CONSULTADOS', `Consulta de casos asociados: ${casos.length} resultado(s).`, {
        profesional: actor.nombre,
        equipo: actor.equipo
      });
      return casos.map((c) => ({ ...c }));
    });
  }

  registrarDecision(noticiaId: string, cuerpo: DecisionEvaluacionRequest): Observable<DecisionEvaluacionResponse> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      const n = this.noticiaVisible(noticiaId, actor);
      if (!ESTADOS_EVALUABLES.has(n.estado)) throw this.error(409, 'Ya hay una decisión registrada.', 'NOTICIA_YA_DECIDIDA');
      this.exigirVersion(n, cuerpo.version);

      const { acciones } = this.acciones(n, actor);
      const errores = validarDecision(cuerpo, {
        tipoNoticia: n.tipo,
        casoIdActual: n.casoId,
        casosConsultados: this.store.casosConsultados.get(n.noticiaId) ?? null,
        tieneReportanteIdentificado: !!n.reportante,
        vinculacionDeterminada: esVinculacionDeterminada(n.vinculacionClasificada ?? n.vinculacionDeclarada),
        hoy: fechaCalendario(new Date())
      });
      if (Object.keys(errores).length > 0) {
        const codigo = errores['tipo'] === 'Registre una sola decisión por vez.' ? 'DECISION_INCOMPATIBLE' : 'VALIDACION';
        throw this.error(400, 'Revise los datos marcados.', codigo, errores);
      }
      if (!acciones.includes(cuerpo.tipo as AccionNoticia)) throw this.error(403, 'Esta decisión no está disponible para su equipo.');

      const estadoAnterior = n.estado;
      const notificaciones: NotificacionEstado[] = [];
      let casoUad: CasoUadResumen | null = null;

      switch (cuerpo.tipo) {
        case 'CONTINUAR_TRAMITE': {
          const c = cuerpo.continuarTramite!;
          if (c.modoCaso === 'CREAR_NUEVO') {
            n.casoId = this.store.siguienteCasoId();
            this.store.registrarEvento(n.noticiaId, 'CASO_CREADO', `Se generó el ID de caso Casilda ${n.casoId}.`, { profesional: actor.nombre, equipo: actor.equipo });
          } else if (c.modoCaso === 'VINCULAR_EXISTENTE') {
            n.casoId = c.casoIdVincular;
            this.store.registrarEvento(
              n.noticiaId,
              'CASO_VINCULADO',
              `Vinculada al caso existente ${n.casoId} por tratarse de los mismos hechos. Se conserva el consecutivo ${n.consecutivo}.`,
              { profesional: actor.nombre, equipo: actor.equipo }
            );
          }
          // CONSERVAR_ASIGNADO: no cambia `casoId` (UAD-ID-06).
          n.expedienteUad = c.expedienteUad;
          n.estado = 'PROCEDE_TRAMITE';
          const vinculacion = (n.vinculacionClasificada ?? n.vinculacionDeclarada)!;
          const caso = {
            casoUadId: this.store.siguienteId('mock-cuad'),
            casoId: n.casoId!,
            expedienteUad: n.expedienteUad,
            consecutivosNoticia: [n.consecutivo],
            victimaNombre: n.personaAfectada?.nombreCompleto ?? null,
            vinculacionInvestigado: vinculacion,
            fechaAdmision: new Date().toISOString(),
            faseActual: 'INSTRUCCION' as const,
            equipoResponsable: equipoInstructor(vinculacion)!,
            estadoGestion: 'ACTIVA' as const,
            motivoFinGestion: null,
            fechaUltimoTraslado: null,
            // Las pruebas de la noticia pasan al caso y se conservan en adelante (UAD-PRU-04).
            evidencias: n.evidencias.map((e) => ({ ...e })),
            version: 1
          };
          this.store.casosUad.push(caso);
          this.store.registrarEventoCaso(caso.casoUadId, 'CASO_CREADO', `Caso admitido para trámite desde ${n.consecutivo}.`, {
            profesional: actor.nombre,
            equipo: caso.equipoResponsable,
            fase: 'INSTRUCCION'
          });
          n.casoUadId = caso.casoUadId;
          casoUad = this.resumenCaso(caso);
          notificaciones.push(
            n.tipo === 'NDA' || !n.personaAfectada
              ? { evento: 'ADMISION', destinatario: 'VICTIMA', estado: 'NO_APLICA', motivo: 'Sin contacto autorizado de la víctima.' }
              : { evento: 'ADMISION', destinatario: 'VICTIMA', estado: 'PENDIENTE', motivo: 'Simulado: no se envía ningún correo.' }
          );
          break;
        }
        case 'SOLICITAR_INFORMACION': {
          const s = cuerpo.solicitudInformacion!;
          n.estado = 'PENDIENTE_SUBSANACION';
          n.solicitudInformacion = {
            solicitudId: this.store.siguienteId('mock-sol'),
            tipoSolicitudCodigo: s.tipoSolicitudCodigo,
            informacionRequerida: s.informacionRequerida,
            fechaSolicitud: new Date().toISOString(),
            fechaLimite: s.fechaLimite,
            vencida: false,
            respondida: false
          };
          this.store.registrarEvento(n.noticiaId, 'SOLICITUD_INFORMACION', `Se solicitó información adicional al reportante. Fecha límite: ${s.fechaLimite}.`, {
            profesional: actor.nombre,
            equipo: actor.equipo
          });
          notificaciones.push({ evento: 'SOLICITUD_INFORMACION', destinatario: 'REPORTANTE', estado: 'PENDIENTE', motivo: 'Simulado: no se envía ningún correo.' });
          break;
        }
        case 'INHIBITORIO':
          n.estado = 'INHIBITORIA';
          break;
        case 'REMISION_COMPETENCIA':
          // Solo se registra: no se envía nada a la entidad (UAD-REM-04/05).
          n.estado = 'REMITIDA_POR_COMPETENCIA';
          break;
      }
      n.version += 1;
      n.revisionConcurrente = null;
      this.store.registrarEvento(n.noticiaId, 'DECISION_REGISTRADA', `${ETIQUETA_DECISION[cuerpo.tipo]}.`, {
        profesional: actor.nombre,
        equipo: actor.equipo,
        estadoAnterior,
        estadoNuevo: n.estado,
        observaciones: cuerpo.observaciones ?? null
      });
      return { noticia: this.detalle(n, actor), casoUad, notificaciones };
    });
  }

  historialNoticia(noticiaId: string): Observable<readonly EventoHistorial[]> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      const n = this.noticiaVisible(noticiaId, actor);
      return (this.store.historial.get(n.noticiaId) ?? []).map((e) => ({ ...e }));
    });
  }

  descargarEvidencia(evidenciaId: string): Observable<Blob> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      const n = this.store.noticias.find((x) => x.evidencias.some((e) => e.evidenciaId === evidenciaId));
      const c = this.store.casosUad.find((x) => x.evidencias.some((e) => e.evidenciaId === evidenciaId));
      if (n && this.visible(n, actor)) {
        this.store.registrarEvento(n.noticiaId, 'NOTIFICACION', 'Descarga de evidencia registrada (simulado).', { profesional: actor.nombre, equipo: actor.equipo });
      } else if (c && this.casoVisible(c, actor)) {
        this.store.registrarEventoCaso(c.casoUadId, 'NOTIFICACION', 'Descarga de evidencia registrada (simulado).', {
          profesional: actor.nombre,
          equipo: actor.equipo,
          fase: c.faseActual
        });
      } else {
        throw this.error(404, 'No encontrado.');
      }
      // Archivo sintético: el mock nunca entrega contenido real.
      return new Blob(['Archivo simulado de demostración. No contiene evidencia real.'], { type: 'text/plain' });
    });
  }

  catalogo(nombre: CatalogoUad): Observable<readonly MaestroUad[]> {
    return this.responder(() => (CATALOGOS_MOCK[nombre] ?? []).map((m) => ({ ...m })));
  }

  listarCasos(filtro: FiltroCasosUad): Observable<Pagina<CasoUadResumen>> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      // Bandeja activa (UAD-CAS-12): gestión activa y equipo responsable en la fase actual.
      const visibles = this.store.casosUad
        .filter((c) => c.estadoGestion === 'ACTIVA' && this.casoVisible(c, actor))
        .filter((c) => !filtro.fase || c.faseActual === filtro.fase)
        .sort((a, b) => b.fechaAdmision.localeCompare(a.fechaAdmision))
        .map((c) => this.resumenCaso(c));
      return paginar(visibles, filtro.page, filtro.size);
    });
  }

  obtenerCaso(casoUadId: string): Observable<CasoUadDetalle> {
    return this.responder(() => this.detalleCaso(this.casoVisibleOError(casoUadId, this.exigirEquipo())));
  }

  catalogoActuaciones(casoUadId: string): Observable<readonly ActuacionDisponible[]> {
    return this.responder(() => {
      const c = this.casoVisibleOError(casoUadId, this.exigirEquipo());
      return catalogoParaCaso(c.faseActual, c.equipoResponsable, c.estadoGestion);
    });
  }

  registrarActuaciones(casoUadId: string, cuerpo: RegistrarActuacionesRequest): Observable<ResultadoAccionCaso> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      const c = this.casoVisibleOError(casoUadId, actor);
      this.exigirCasoActivo(c);
      this.exigirVersionCaso(c, cuerpo.version);
      const catalogo = catalogoParaCaso(c.faseActual, c.equipoResponsable, c.estadoGestion);
      const errores = validarActuaciones(cuerpo.actuaciones ?? [], cuerpo.observaciones, catalogo, LIMITE_TEXTO_DECISION);
      if (Object.keys(errores).length > 0) {
        const codigo = errores['actuaciones'] ? 'ACTUACION_NO_DISPONIBLE' : 'VALIDACION';
        throw this.error(400, 'Revise los datos marcados.', codigo, errores);
      }
      // Ordinarias: no cambian la fase ni disparan correo de cambio de etapa (UAD-HIS-01 a 07, bitácora §13).
      const eventos = cuerpo.actuaciones.map((codigo) =>
        this.store.registrarEventoCaso(c.casoUadId, 'ACTUACION', `${nombreActuacion(codigo)}.`, {
          profesional: actor.nombre,
          equipo: actor.equipo,
          fase: c.faseActual,
          observaciones: cuerpo.observaciones
        })
      );
      c.version += 1;
      return { visibleParaUsuario: true, caso: this.detalleCaso(c), eventos, notificaciones: [] };
    });
  }

  historialCaso(casoUadId: string): Observable<readonly EventoHistorial[]> {
    return this.responder(() => {
      const c = this.casoVisibleOError(casoUadId, this.exigirEquipo());
      return (this.store.historialCasos.get(c.casoUadId) ?? []).map((e) => ({ ...e }));
    });
  }

  evidenciasCaso(casoUadId: string): Observable<readonly EvidenciaMetadato[]> {
    return this.responder(() => this.casoVisibleOError(casoUadId, this.exigirEquipo()).evidencias.map((e) => ({ ...e })));
  }

  registrarExpediente(casoUadId: string, cuerpo: ExpedienteRequest): Observable<ResultadoAccionCaso> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      const c = this.casoVisibleOError(casoUadId, actor);
      this.exigirCasoActivo(c);
      this.exigirVersionCaso(c, cuerpo.version);
      const nuevo = (cuerpo.expedienteUad ?? '').trim() || null;
      if ((nuevo ?? '').length > LIMITE_EXPEDIENTE_UAD) {
        throw this.error(400, 'Revise los datos marcados.', 'VALIDACION', { expedienteUad: `Máximo ${LIMITE_EXPEDIENTE_UAD} caracteres.` });
      }
      if (nuevo === c.expedienteUad) {
        throw this.error(400, 'Revise los datos marcados.', 'VALIDACION', { expedienteUad: 'Es el mismo número que ya está registrado.' });
      }
      const anterior = c.expedienteUad;
      c.expedienteUad = nuevo;
      c.version += 1;
      // Se conserva el valor anterior en el historial: corrección auditada, no sobrescritura silenciosa.
      const evento = this.store.registrarEventoCaso(
        c.casoUadId,
        'EXPEDIENTE_ACTUALIZADO',
        `Expediente UAD: ${anterior ?? 'sin registrar'} → ${nuevo ?? 'sin registrar'}.`,
        { profesional: actor.nombre, equipo: actor.equipo, fase: c.faseActual, estadoAnterior: anterior, estadoNuevo: nuevo }
      );
      return { visibleParaUsuario: true, caso: this.detalleCaso(c), eventos: [evento], notificaciones: [] };
    });
  }

  finalizarInstruccion(casoUadId: string, cuerpo: TrasladoRequest): Observable<ResultadoAccionCaso> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      const c = this.casoVisibleOError(casoUadId, actor);
      this.exigirCasoActivo(c);
      if (c.faseActual !== 'INSTRUCCION') throw this.error(409, 'El caso no está en instrucción.', 'FASE_NO_PERMITE');
      this.exigirVersionCaso(c, cuerpo.version);
      if (cuerpo.confirmaTraslado !== true) {
        throw this.error(400, 'Revise los datos marcados.', 'VALIDACION', { confirmaTraslado: 'Confirme expresamente el paso a la etapa de decisión.' });
      }
      if ((cuerpo.observaciones ?? '').length > LIMITE_TEXTO_DECISION) {
        throw this.error(400, 'Revise los datos marcados.', 'VALIDACION', { observaciones: `Máximo ${LIMITE_TEXTO_DECISION} caracteres.` });
      }
      const instructor = c.equipoResponsable;
      const decisor = equipoDecisor(c.vinculacionInvestigado)!;
      // Conserva casoId, expediente, admisión, evidencias e historial (UAD-CAS-09).
      c.faseActual = 'DECISION';
      c.equipoResponsable = decisor;
      c.fechaUltimoTraslado = new Date().toISOString();
      c.version += 1;
      const evento = this.store.registrarEventoCaso(
        c.casoUadId,
        'TRASLADO_FASE',
        `Finalizó la etapa de instrucción. El caso pasó de ${ETIQUETA_EQUIPO[instructor]} (instrucción) a ${ETIQUETA_EQUIPO[decisor]} (decisión).`,
        { profesional: actor.nombre, equipo: actor.equipo, fase: 'INSTRUCCION', estadoAnterior: 'INSTRUCCION', estadoNuevo: 'DECISION', observaciones: cuerpo.observaciones }
      );
      const notificaciones: NotificacionEstado[] = [
        c.victimaNombre
          ? { evento: 'CAMBIO_FASE', destinatario: 'VICTIMA', estado: 'PENDIENTE', motivo: 'Simulado: no se envía ningún correo.' }
          : { evento: 'CAMBIO_FASE', destinatario: 'VICTIMA', estado: 'NO_APLICA', motivo: 'Sin contacto autorizado de la víctima.' }
      ];
      const visible = this.casoVisible(c, actor);
      return { visibleParaUsuario: visible, caso: visible ? this.detalleCaso(c) : null, eventos: [evento], notificaciones };
    });
  }

  remitirCasoPorCompetencia(casoUadId: string, cuerpo: RemisionCompetenciaCasoRequest): Observable<ResultadoAccionCaso> {
    return this.responder(() => {
      const actor = this.exigirEquipo();
      const c = this.casoVisibleOError(casoUadId, actor);
      this.exigirCasoActivo(c);
      this.exigirVersionCaso(c, cuerpo.version);
      const errores: Record<string, string> = {};
      if (!cuerpo.entidadDestinatariaCodigo) errores['entidadDestinatariaCodigo'] = 'Seleccione la entidad destinataria.';
      if (!cuerpo.fechaRemision) errores['fechaRemision'] = 'Indique la fecha de remisión.';
      else if (cuerpo.fechaRemision > fechaCalendario(new Date())) errores['fechaRemision'] = 'La fecha de remisión no puede ser futura.';
      if ((cuerpo.justificacion ?? '').length > LIMITE_TEXTO_DECISION) errores['justificacion'] = `Máximo ${LIMITE_TEXTO_DECISION} caracteres.`;
      if (Object.keys(errores).length > 0) throw this.error(400, 'Revise los datos marcados.', 'VALIDACION', errores);
      const entidad = CATALOGOS_MOCK['uad-entidades-remision'].find((e) => e.codigo === cuerpo.entidadDestinatariaCodigo)?.nombre ?? cuerpo.entidadDestinatariaCodigo;
      // Solo se registra: no se envía nada a la entidad. El caso CASILDA sigue activo para otros actores.
      c.estadoGestion = 'FINALIZADA';
      c.motivoFinGestion = 'REMITIDA_POR_COMPETENCIA';
      c.version += 1;
      const evento = this.store.registrarEventoCaso(c.casoUadId, 'REMISION_COMPETENCIA', `Remisión por competencia a ${entidad} (${cuerpo.fechaRemision}).`, {
        profesional: actor.nombre,
        equipo: actor.equipo,
        fase: c.faseActual,
        estadoAnterior: 'ACTIVA',
        estadoNuevo: 'FINALIZADA',
        observaciones: cuerpo.justificacion
      });
      return { visibleParaUsuario: true, caso: this.detalleCaso(c), eventos: [evento], notificaciones: [] };
    });
  }

  // ------------------------------------------------------------------ «servidor» simulado

  private actor(): Actor {
    const nombre = this.auth.currentUser?.nombre ?? 'Profesional UAD (prueba)';
    const equipos: EquipoUad[] = [];
    if (this.auth.hasRole('UAD_EQUIPO_3')) equipos.push('EQUIPO_3');
    if (this.auth.hasRole('UAD_EQUIPO_4')) equipos.push('EQUIPO_4');
    const coordinacion = this.auth.hasRole('UAD_COORDINACION');
    if (equipos.length > 0) return { contexto: { equipos, coordinacion, capacidades: TODAS_LAS_CAPACIDADES }, nombre, equipo: equipos[0] };
    // D-UAD-03: coordinación sin matriz aprobada → sin lectura global.
    if (coordinacion) return { contexto: { equipos: [], coordinacion: true, capacidades: [] }, nombre, equipo: null };
    if (this.auth.isAdmin()) {
      const equipo = this.simulacion.equipoSimulado();
      return { contexto: { equipos: [equipo], coordinacion: false, capacidades: TODAS_LAS_CAPACIDADES }, nombre, equipo };
    }
    throw this.error(403, 'Sin permiso.');
  }

  private exigirEquipo(): Actor {
    const actor = this.actor();
    if (actor.contexto.equipos.length === 0) throw this.error(403, 'Sin equipo UAD.', 'SIN_EQUIPO_UAD');
    return actor;
  }

  private visible(n: NoticiaMock, actor: Actor): boolean {
    return esVisiblePara(actor.contexto.equipos, n.tipo, n.vinculacionClasificada ?? n.vinculacionDeclarada);
  }

  /** 404 tanto si no existe como si no es visible: el servidor no revela cuál de los dos. */
  private noticiaVisible(noticiaId: string, actor: Actor): NoticiaMock {
    const n = this.store.buscar(noticiaId);
    if (!n || !this.visible(n, actor)) throw this.error(404, 'No encontrado.');
    return n;
  }

  private exigirVersion(n: NoticiaMock, version: number): void {
    if (version !== n.version) throw this.error(409, 'La noticia cambió.', 'CONFLICTO_VERSION');
  }

  private acciones(n: NoticiaMock, actor: Actor): { acciones: AccionNoticia[]; motivos: Partial<Record<AccionNoticia, string>> } {
    const acciones: AccionNoticia[] = [];
    const motivos: Partial<Record<AccionNoticia, string>> = {};
    if (n.evidencias.length > 0) acciones.push('DESCARGAR_EVIDENCIAS');
    if (!actor.contexto.capacidades.includes('EVALUAR_NOTICIA')) return { acciones, motivos };
    if (!ESTADOS_EVALUABLES.has(n.estado)) {
      const motivo = `La noticia ya está en estado «${ETIQUETA_ESTADO_NOTICIA[n.estado]}».`;
      for (const a of ['CLASIFICAR_VINCULACION', 'CONSULTAR_CASOS_ASOCIADOS', 'CONTINUAR_TRAMITE', 'SOLICITAR_INFORMACION', 'INHIBITORIO', 'REMISION_COMPETENCIA'] as AccionNoticia[]) {
        motivos[a] = motivo;
      }
      return { acciones, motivos };
    }
    acciones.push('CLASIFICAR_VINCULACION', 'INHIBITORIO', 'REMISION_COMPETENCIA');
    if (n.personaClave) acciones.push('CONSULTAR_CASOS_ASOCIADOS');
    else motivos.CONSULTAR_CASOS_ASOCIADOS = 'Las noticias anónimas no tienen una persona identificada para consultar.';
    if (esVinculacionDeterminada(n.vinculacionClasificada ?? n.vinculacionDeclarada)) acciones.push('CONTINUAR_TRAMITE');
    else motivos.CONTINUAR_TRAMITE = 'Primero clasifique la vinculación de la persona presuntamente responsable.';
    if (n.tipo === 'NDA' || !n.reportante) motivos.SOLICITAR_INFORMACION = 'Solo se puede pedir información a un reportante identificado.';
    else if (n.estado === 'PENDIENTE_SUBSANACION') motivos.SOLICITAR_INFORMACION = 'Ya hay una solicitud de información en curso.';
    else acciones.push('SOLICITAR_INFORMACION');
    return { acciones, motivos };
  }

  /** El caso es del equipo del usuario en su fase actual (instructor en instrucción, decisor en decisión). */
  private casoVisible(c: CasoUadMock, actor: Actor): boolean {
    return actor.contexto.equipos.includes(c.equipoResponsable);
  }

  /** 404 si no existe o no es del equipo y la fase del usuario (no revela cuál de los dos). */
  private casoVisibleOError(casoUadId: string, actor: Actor): CasoUadMock {
    const c = this.store.buscarCaso(casoUadId);
    if (!c || !this.casoVisible(c, actor)) throw this.error(404, 'No encontrado.');
    return c;
  }

  private exigirCasoActivo(c: CasoUadMock): void {
    if (c.estadoGestion !== 'ACTIVA') throw this.error(409, 'La gestión UAD terminó.', 'CASO_NO_ACTIVO');
  }

  private exigirVersionCaso(c: CasoUadMock, version: number): void {
    if (version !== c.version) throw this.error(409, 'El caso cambió.', 'CONFLICTO_VERSION');
  }

  private resumenCaso(c: CasoUadMock): CasoUadResumen {
    return {
      casoUadId: c.casoUadId,
      casoId: c.casoId,
      expedienteUad: c.expedienteUad,
      consecutivosNoticia: [...c.consecutivosNoticia],
      victimaNombre: c.victimaNombre,
      vinculacionInvestigado: c.vinculacionInvestigado,
      fechaAdmision: c.fechaAdmision,
      faseActual: c.faseActual,
      equipoResponsable: c.equipoResponsable,
      estadoGestion: c.estadoGestion,
      version: c.version
    };
  }

  private detalleCaso(c: CasoUadMock): CasoUadDetalle {
    return {
      ...this.resumenCaso(c),
      motivoFinGestion: c.motivoFinGestion,
      fechaUltimoTraslado: c.fechaUltimoTraslado,
      equipoInstructor: equipoInstructor(c.vinculacionInvestigado)!,
      equipoDecisor: equipoDecisor(c.vinculacionInvestigado)!
    };
  }

  private resumen(n: NoticiaMock): NoticiaResumen {
    return {
      noticiaId: n.noticiaId,
      consecutivo: n.consecutivo,
      tipo: n.tipo,
      casoId: n.casoId,
      origen: { ...n.origen },
      fechaRecepcion: n.fechaRecepcion,
      estado: n.estado,
      vinculacionDeclarada: n.vinculacionClasificada ?? n.vinculacionDeclarada,
      clasificada: esVinculacionDeterminada(n.vinculacionClasificada ?? n.vinculacionDeclarada),
      version: n.version,
      revisionConcurrente: n.revisionConcurrente ? { ...n.revisionConcurrente } : null,
      detalleExpandible: {
        // NDA: nunca identidad ni contacto del reportante (UAD-NOT-04, UAD-SEG-06).
        telefono: n.tipo === 'NDA' ? null : n.telefono,
        correo: n.tipo === 'NDA' ? null : n.correo,
        descripcionHechos: n.hechos.descripcion.slice(0, 400)
      }
    };
  }

  private detalle(n: NoticiaMock, actor: Actor): NoticiaDetalle {
    const { acciones, motivos } = this.acciones(n, actor);
    const vinculacion = n.vinculacionClasificada ?? n.vinculacionDeclarada;
    return {
      noticiaId: n.noticiaId,
      consecutivo: n.consecutivo,
      tipo: n.tipo,
      casoId: n.casoId,
      expedienteUad: n.expedienteUad,
      casoUadId: n.casoUadId,
      origen: { ...n.origen },
      fechaRecepcion: n.fechaRecepcion,
      estado: n.estado,
      version: n.version,
      vinculacionDeclarada: n.vinculacionDeclarada,
      vinculacionClasificada: n.vinculacionClasificada,
      equiposCompetentes: [...equiposConVisibilidad(n.tipo, vinculacion)],
      reportante: n.tipo === 'NDA' ? null : n.reportante ? { ...n.reportante } : null,
      personaAfectada: n.personaAfectada ? { ...n.personaAfectada } : null,
      hechos: { ...n.hechos },
      evidencias: n.evidencias.map((e) => ({ ...e })),
      solicitudInformacion: n.solicitudInformacion ? { ...n.solicitudInformacion } : null,
      revisionConcurrente: n.revisionConcurrente ? { ...n.revisionConcurrente } : null,
      accionesDisponibles: acciones,
      motivosNoDisponible: motivos
    };
  }

  private error(estado: number, message: string, codigo: string | null = null, validationErrors?: Record<string, string>): HttpErrorResponse {
    return new HttpErrorResponse({
      status: estado,
      error: { timestamp: new Date().toISOString(), status: estado, error: String(estado), message, path: null, codigo, validationErrors }
    });
  }

  /** Ejecuta el manejador como lo haría el servidor y entrega éxito o `ErrorUad`, con latencia. */
  private responder<T>(manejador: () => T): Observable<T> {
    const forzado = this.simulacion.fallarSiguiente();
    let salida: Observable<T>;
    if (forzado !== null) {
      this.simulacion.fallarSiguiente.set(null);
      salida = throwError(() => interpretarErrorUad(this.error(forzado, 'Error simulado.')));
    } else {
      try {
        salida = of(manejador());
      } catch (e) {
        salida = throwError(() => interpretarErrorUad(e));
      }
    }
    return this.latencia > 0 ? salida.pipe(delay(this.latencia)) : salida;
  }
}

function paginar<T>(items: readonly T[], page: number, size: number): Pagina<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const inicio = page * size;
  return {
    content: items.slice(inicio, inicio + size),
    totalElements: items.length,
    totalPages,
    number: page,
    size,
    first: page === 0,
    last: page >= totalPages - 1
  };
}
