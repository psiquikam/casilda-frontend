import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { DecisionEvaluacionRequest, FiltroNoticias, NoticiaResumen } from '../../contratos/uad-api.types';
import { fechaCalendario } from '../../dominio/decision-evaluacion';
import { ErrorUad } from '../uad-error';
import { UAD_MOCK_LATENCIA_MS, UadMockAdapter } from './uad-mock.adapter';
import { UadMockStore, UadSimulacionService } from './uad-mock-store';

/** Suscribe de forma síncrona (latencia 0) y devuelve el valor o lanza el `ErrorUad`. */
function valor<T>(obs: Observable<T>): T {
  let salida: { v?: T; e?: unknown } = {};
  obs.subscribe({ next: (v) => (salida = { v }), error: (e) => (salida = { e }) });
  if ('e' in salida) throw salida.e;
  return salida.v as T;
}

function fallo<T>(obs: Observable<T>): ErrorUad {
  try {
    valor(obs);
  } catch (e) {
    return e as ErrorUad;
  }
  throw new Error('Se esperaba un error');
}

function crear(roles: string[]): { api: UadMockAdapter; simulacion: UadSimulacionService } {
  const auth = {
    currentUser: { nombre: 'Profesional de prueba' },
    hasRole: (r: string) => roles.includes(r),
    isAdmin: () => roles.includes('ADMIN')
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      UadMockStore,
      UadSimulacionService,
      UadMockAdapter,
      { provide: AuthService, useValue: auth },
      { provide: UAD_MOCK_LATENCIA_MS, useValue: 0 }
    ]
  });
  return { api: TestBed.inject(UadMockAdapter), simulacion: TestBed.inject(UadSimulacionService) };
}

const NDI: FiltroNoticias = { tipo: 'NDI', page: 0, size: 50 };
const NDA: FiltroNoticias = { tipo: 'NDA', page: 0, size: 50 };
const consecutivos = (items: readonly NoticiaResumen[]) => items.map((n) => n.consecutivo);
const LEJANA = '2099-12-31';

describe('UAD · adaptador mock (servidor simulado)', () => {
  describe('visibilidad por equipo', () => {
    it('Equipo 3 ve docentes/personal y «No sé», no estudiantes', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const lista = consecutivos(valor(api.listarNoticias(NDI)).content);
      expect(lista).toContain('NDI-2026-000141'); // docente vinculado
      expect(lista).toContain('NDI-2026-000143'); // No sé
      expect(lista).toContain('NDI-2026-000147'); // No tiene vínculo (provisional D-UAD-12)
      expect(lista).not.toContain('NDI-2026-000142'); // estudiante
    });

    it('Equipo 4 ve estudiantes y «No sé», no docentes', () => {
      const { api } = crear(['UAD_EQUIPO_4']);
      const lista = consecutivos(valor(api.listarNoticias(NDI)).content);
      expect(lista).toContain('NDI-2026-000142');
      expect(lista).toContain('NDI-2026-000143');
      expect(lista).not.toContain('NDI-2026-000141');
    });

    it('todas las NDA son visibles a ambos equipos y nunca traen contacto', () => {
      const e3 = valor(crear(['UAD_EQUIPO_3']).api.listarNoticias(NDA)).content;
      const e4 = valor(crear(['UAD_EQUIPO_4']).api.listarNoticias(NDA)).content;
      expect(consecutivos(e3)).toEqual(consecutivos(e4));
      expect(e3.length).toBe(3);
      expect(e3.every((n) => n.detalleExpandible.telefono === null && n.detalleExpandible.correo === null)).toBeTrue();
    });

    it('coordinación sin matriz aprobada no tiene lectura global (D-UAD-03)', () => {
      const { api } = crear(['UAD_COORDINACION']);
      expect(valor(api.obtenerContexto())).toEqual({ equipos: [], coordinacion: true, capacidades: [] });
      expect(fallo(api.listarNoticias(NDI)).tipo).toBe('sin-permiso');
    });

    it('un rol ajeno a la UAD recibe 403', () => {
      expect(fallo(crear(['PROFESIONAL']).api.listarNoticias(NDI)).estado).toBe(403);
    });

    it('una noticia de otro equipo responde 404 (no revela que existe)', () => {
      expect(fallo(crear(['UAD_EQUIPO_4']).api.obtenerNoticia('mock-ndi-141')).estado).toBe(404);
    });

    it('ADMIN actúa con el equipo simulado', () => {
      const { api, simulacion } = crear(['ADMIN']);
      simulacion.equipoSimulado.set('EQUIPO_4');
      expect(consecutivos(valor(api.listarNoticias(NDI)).content)).toContain('NDI-2026-000142');
    });

    it('pagina con la forma de Spring Page', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const p0 = valor(api.listarNoticias({ tipo: 'NDI', page: 0, size: 5 }));
      const p1 = valor(api.listarNoticias({ tipo: 'NDI', page: 1, size: 5 }));
      expect(p0.content.length).toBe(5);
      expect(p0.totalElements).toBeGreaterThan(5);
      expect(p0.first).toBeTrue();
      expect(p1.number).toBe(1);
      expect(consecutivos(p1.content)).not.toEqual(consecutivos(p0.content));
    });
  });

  describe('identificadores (UAD-ID, UAD-EVA-03)', () => {
    it('abrir la evaluación y consultar casos asociados no crea casoId ni cambia estado', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const antes = valor(api.obtenerNoticia('mock-ndi-141'));
      const casos = valor(api.consultarCasosAsociados('mock-ndi-141'));
      const despues = valor(api.obtenerNoticia('mock-ndi-141'));
      expect(casos.length).toBe(2);
      expect(despues.casoId).toBeNull();
      expect(despues.estado).toBe(antes.estado);
      expect(despues.version).toBe(antes.version);
    });

    it('«Continuar trámite» con caso nuevo genera el ID en el servidor y no exige expediente', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const n = valor(api.obtenerNoticia('mock-ndi-141'));
      const r = valor(
        api.registrarDecision(n.noticiaId, {
          tipo: 'CONTINUAR_TRAMITE',
          version: n.version,
          continuarTramite: { modoCaso: 'CREAR_NUEVO', casoIdVincular: null, confirmaMismosHechos: false, expedienteUad: null }
        })
      );
      expect(r.noticia.estado).toBe('PROCEDE_TRAMITE');
      expect(r.noticia.casoId).toMatch(/^CAS-2026-\d{6}$/);
      expect(r.noticia.consecutivo).toBe('NDI-2026-000141');
      expect(r.noticia.expedienteUad).toBeNull();
      expect(r.casoUad?.equipoResponsable).toBe('EQUIPO_3');
      expect(r.casoUad?.faseActual).toBe('INSTRUCCION');
      // La notificación es un estado: el mock no envía nada.
      expect(r.notificaciones.every((x) => x.estado !== 'ENVIADA')).toBeTrue();
      expect(valor(api.listarCasos({ page: 0, size: 10 })).content.some((c) => c.casoId === r.noticia.casoId)).toBeTrue();
    });

    it('vincular a un caso existente conserva su ID y el consecutivo, solo tras consultar y confirmar', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const n = valor(api.obtenerNoticia('mock-ndi-141'));
      const cuerpo: DecisionEvaluacionRequest = {
        tipo: 'CONTINUAR_TRAMITE',
        version: n.version,
        continuarTramite: { modoCaso: 'VINCULAR_EXISTENTE', casoIdVincular: 'CAS-2026-000500', confirmaMismosHechos: true, expedienteUad: 'EXP-1' }
      };
      expect(fallo(api.registrarDecision(n.noticiaId, cuerpo)).camposInvalidos['continuarTramite.casoIdVincular']).toBeTruthy();

      valor(api.consultarCasosAsociados(n.noticiaId));
      const sinConfirmar = fallo(api.registrarDecision(n.noticiaId, { ...cuerpo, continuarTramite: { ...cuerpo.continuarTramite!, confirmaMismosHechos: false } }));
      expect(sinConfirmar.camposInvalidos['continuarTramite.confirmaMismosHechos']).toBeTruthy();

      const r = valor(api.registrarDecision(n.noticiaId, cuerpo));
      expect(r.noticia.casoId).toBe('CAS-2026-000500');
      expect(r.noticia.consecutivo).toBe('NDI-2026-000141');
      expect(r.noticia.expedienteUad).toBe('EXP-1');
    });

    it('una noticia remitida con ID de caso lo conserva y no permite crear otro', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const n = valor(api.obtenerNoticia('mock-ndi-144'));
      expect(n.casoId).toBe('CAS-2026-000610');
      const crearNuevo = fallo(
        api.registrarDecision(n.noticiaId, { tipo: 'CONTINUAR_TRAMITE', version: n.version, continuarTramite: { modoCaso: 'CREAR_NUEVO', casoIdVincular: null, confirmaMismosHechos: false, expedienteUad: null } })
      );
      expect(crearNuevo.tipo).toBe('validacion');
      const r = valor(
        api.registrarDecision(n.noticiaId, { tipo: 'CONTINUAR_TRAMITE', version: n.version, continuarTramite: { modoCaso: 'CONSERVAR_ASIGNADO', casoIdVincular: null, confirmaMismosHechos: false, expedienteUad: null } })
      );
      expect(r.noticia.casoId).toBe('CAS-2026-000610');
    });
  });

  describe('decisiones', () => {
    it('solicitar información deja «Pendiente de subsanación» sin crear casoId', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const n = valor(api.obtenerNoticia('mock-ndi-141'));
      const r = valor(
        api.registrarDecision(n.noticiaId, {
          tipo: 'SOLICITAR_INFORMACION',
          version: n.version,
          solicitudInformacion: { tipoSolicitudCodigo: 'ACLARACION_HECHOS', informacionRequerida: 'Texto ficticio suficiente.', fechaLimite: LEJANA }
        })
      );
      expect(r.noticia.estado).toBe('PENDIENTE_SUBSANACION');
      expect(r.noticia.casoId).toBeNull();
      expect(r.notificaciones[0]).toEqual(jasmine.objectContaining({ destinatario: 'REPORTANTE', estado: 'PENDIENTE' }));
      expect(r.noticia.accionesDisponibles).not.toContain('SOLICITAR_INFORMACION');
    });

    it('una subsanación vencida no cierra la noticia y la UAD puede seguir decidiendo (UAD-EVA-05)', () => {
      const n = valor(crear(['UAD_EQUIPO_4']).api.obtenerNoticia('mock-ndi-145'));
      expect(n.estado).toBe('PENDIENTE_SUBSANACION');
      expect(n.solicitudInformacion?.vencida).toBeTrue();
      expect(n.accionesDisponibles).toContain('CONTINUAR_TRAMITE');
    });

    it('la respuesta simulada del reportante pasa a «Subsanación recibida»', () => {
      const { api, simulacion } = crear(['UAD_EQUIPO_4']);
      expect(simulacion.simularRespuestaReportante('mock-ndi-145')).toBeTrue();
      expect(valor(api.obtenerNoticia('mock-ndi-145')).estado).toBe('SUBSANACION_RECIBIDA');
    });

    it('a una NDA no se le puede pedir información', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const n = valor(api.obtenerNoticia('mock-nda-021'));
      expect(n.reportante).toBeNull();
      expect(n.accionesDisponibles).not.toContain('SOLICITAR_INFORMACION');
      expect(n.accionesDisponibles).not.toContain('CONSULTAR_CASOS_ASOCIADOS');
    });

    it('remisión por competencia: registra, no crea casoId y rechaza fecha futura', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const n = valor(api.obtenerNoticia('mock-nda-021'));
      const futura = fallo(
        api.registrarDecision(n.noticiaId, { tipo: 'REMISION_COMPETENCIA', version: n.version, remisionCompetencia: { faseProceso: 'EVALUACION_PRELIMINAR', entidadDestinatariaCodigo: 'PROCURADURIA_REGIONAL', fechaRemision: LEJANA, justificacion: null } })
      );
      expect(futura.camposInvalidos['remisionCompetencia.fechaRemision']).toBeTruthy();
      const r = valor(
        api.registrarDecision(n.noticiaId, {
          tipo: 'REMISION_COMPETENCIA',
          version: n.version,
          remisionCompetencia: { faseProceso: 'EVALUACION_PRELIMINAR', entidadDestinatariaCodigo: 'PROCURADURIA_REGIONAL', fechaRemision: fechaCalendario(new Date()), justificacion: null }
        })
      );
      expect(r.noticia.estado).toBe('REMITIDA_POR_COMPETENCIA');
      expect(r.noticia.casoId).toBeNull();
      expect(r.notificaciones).toEqual([]);
    });

    it('rechaza dos decisiones en una misma operación', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const n = valor(api.obtenerNoticia('mock-ndi-141'));
      const e = fallo(
        api.registrarDecision(n.noticiaId, {
          tipo: 'INHIBITORIO',
          version: n.version,
          inhibitorio: { causalCodigo: 'DUPLICIDAD', justificacion: 'x' },
          remisionCompetencia: { faseProceso: 'EVALUACION_PRELIMINAR', entidadDestinatariaCodigo: 'X', fechaRemision: '2026-11-01', justificacion: null }
        })
      );
      expect(e.codigo).toBe('DECISION_INCOMPATIBLE');
    });

    it('una noticia con decisión registrada no admite otra (409)', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const n = valor(api.obtenerNoticia('mock-ndi-140'));
      expect(n.accionesDisponibles).not.toContain('INHIBITORIO');
      const e = fallo(api.registrarDecision(n.noticiaId, { tipo: 'INHIBITORIO', version: n.version, inhibitorio: { causalCodigo: 'DUPLICIDAD', justificacion: 'x' } }));
      expect(e.codigo).toBe('NOTICIA_YA_DECIDIDA');
    });
  });

  describe('concurrencia y reclasificación (UAD-NOT-08)', () => {
    it('una versión vieja recibe 409 CONFLICTO_VERSION; el doble envío también', () => {
      const { api, simulacion } = crear(['UAD_EQUIPO_3']);
      const n = valor(api.obtenerNoticia('mock-ndi-141'));
      simulacion.simularCambioConcurrente(n.noticiaId, 'EQUIPO_3');
      const cuerpo: DecisionEvaluacionRequest = { tipo: 'INHIBITORIO', version: n.version, inhibitorio: { causalCodigo: 'DUPLICIDAD', justificacion: 'x' } };
      expect(fallo(api.registrarDecision(n.noticiaId, cuerpo)).codigo).toBe('CONFLICTO_VERSION');

      const fresca = valor(api.obtenerNoticia('mock-ndi-141'));
      valor(api.registrarDecision(n.noticiaId, { ...cuerpo, version: fresca.version }));
      expect(fallo(api.registrarDecision(n.noticiaId, { ...cuerpo, version: fresca.version })).estado).toBe(409);
    });

    it('clasificar «No sé» como estudiante saca la noticia de la bandeja del Equipo 3', () => {
      const e3 = crear(['UAD_EQUIPO_3']);
      const n = valor(e3.api.obtenerNoticia('mock-ndi-143'));
      expect(n.accionesDisponibles).not.toContain('CONTINUAR_TRAMITE');
      const r = valor(e3.api.clasificarVinculacion(n.noticiaId, { vinculacionInvestigado: 'ESTUDIANTE_PREGRADO', version: n.version }));
      expect(r.visibleParaUsuario).toBeFalse();
      expect(r.noticia).toBeNull();
      expect(consecutivos(valor(e3.api.listarNoticias(NDI)).content)).not.toContain('NDI-2026-000143');
      expect(fallo(e3.api.obtenerNoticia('mock-ndi-143')).estado).toBe(404);
    });

    it('el historial es append-only', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const antes = valor(api.historialNoticia('mock-ndi-141'));
      valor(api.consultarCasosAsociados('mock-ndi-141'));
      const despues = valor(api.historialNoticia('mock-ndi-141'));
      expect(despues.length).toBe(antes.length + 1);
      expect(despues.slice(0, antes.length)).toEqual(antes);
    });
  });

  describe('simulación', () => {
    it('fuerza un único error de servidor', () => {
      const { api, simulacion } = crear(['UAD_EQUIPO_3']);
      simulacion.fallarSiguiente.set(500);
      expect(fallo(api.listarNoticias(NDI)).tipo).toBe('servidor');
      expect(valor(api.listarNoticias(NDI)).content.length).toBeGreaterThan(0);
    });

    it('la descarga devuelve un archivo sintético', () => {
      const blob = valor(crear(['UAD_EQUIPO_3']).api.descargarEvidencia('mock-ev-1411'));
      expect(blob.type).toBe('text/plain');
    });
  });

  describe('casos UAD (Entrega 2)', () => {
    const CASOS = { page: 0, size: 50 };
    const ids = (api: UadMockAdapter) => valor(api.listarCasos(CASOS)).content.map((c) => c.casoUadId);

    it('la bandeja muestra solo casos activos del equipo en su fase actual', () => {
      const e3 = crear(['UAD_EQUIPO_3']).api;
      expect(ids(e3)).toEqual(jasmine.arrayWithExactContents(['mock-cuad-201', 'mock-cuad-203']));
      const e4 = crear(['UAD_EQUIPO_4']).api;
      expect(ids(e4)).toEqual(jasmine.arrayWithExactContents(['mock-cuad-139', 'mock-cuad-202']));
    });

    it('la gestión finalizada no aparece en la bandeja activa', () => {
      expect(ids(crear(['UAD_EQUIPO_3']).api)).not.toContain('mock-cuad-204');
    });

    it('un caso de otro equipo o fase responde 404', () => {
      expect(fallo(crear(['UAD_EQUIPO_4']).api.obtenerCaso('mock-cuad-201')).estado).toBe(404);
    });

    it('el catálogo depende de fase y equipo', () => {
      const e3 = crear(['UAD_EQUIPO_3']).api;
      const instruccion = valor(e3.catalogoActuaciones('mock-cuad-201')).filter((a) => !a.permanente).map((a) => a.codigo);
      expect(instruccion).toContain('INDAGACION_PREVIA');
      expect(instruccion).not.toContain('FALLO');
      const decision = valor(e3.catalogoActuaciones('mock-cuad-203')).filter((a) => !a.permanente).map((a) => a.codigo);
      expect(decision).toContain('FALLO');
      expect(decision).not.toContain('PLIEGO_CARGOS');
    });

    it('una actuación ordinaria se agrega al historial y no cambia la fase ni el equipo', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const caso = valor(api.obtenerCaso('mock-cuad-201'));
      const antes = valor(api.historialCaso(caso.casoUadId));
      const r = valor(api.registrarActuaciones(caso.casoUadId, { actuaciones: ['PLIEGO_CARGOS'], observaciones: null, version: caso.version }));
      expect(r.caso?.faseActual).toBe('INSTRUCCION');
      expect(r.caso?.equipoResponsable).toBe('EQUIPO_3');
      expect(r.notificaciones).toEqual([]);
      expect(r.eventos[0]).toEqual(jasmine.objectContaining({ tipo: 'ACTUACION', fase: 'INSTRUCCION', equipo: 'EQUIPO_3' }));
      const despues = valor(api.historialCaso(caso.casoUadId));
      expect(despues.length).toBe(antes.length + 1);
      expect(despues.slice(0, antes.length)).toEqual(antes);
    });

    it('«Reposición y/o apelación» no cierra el caso', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const caso = valor(api.obtenerCaso('mock-cuad-203'));
      const r = valor(api.registrarActuaciones(caso.casoUadId, { actuaciones: ['REPOSICION_APELACION'], observaciones: 'Texto ficticio', version: caso.version }));
      expect(r.caso?.estadoGestion).toBe('ACTIVA');
    });

    it('rechaza permanentes, actuaciones de otra fase y la mediación pendiente', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const c201 = valor(api.obtenerCaso('mock-cuad-201'));
      expect(fallo(api.registrarActuaciones(c201.casoUadId, { actuaciones: ['FINALIZAR_INSTRUCCION'], observaciones: null, version: c201.version })).codigo).toBe('ACTUACION_NO_DISPONIBLE');
      expect(fallo(api.registrarActuaciones(c201.casoUadId, { actuaciones: ['FALLO'], observaciones: null, version: c201.version })).codigo).toBe('ACTUACION_NO_DISPONIBLE');
      const c203 = valor(api.obtenerCaso('mock-cuad-203'));
      expect(fallo(api.registrarActuaciones(c203.casoUadId, { actuaciones: ['MEDIACION'], observaciones: null, version: c203.version })).codigo).toBe('ACTUACION_NO_DISPONIBLE');
    });

    it('una versión vieja recibe 409', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const caso = valor(api.obtenerCaso('mock-cuad-201'));
      valor(api.registrarActuaciones(caso.casoUadId, { actuaciones: ['PRACTICA_PRUEBAS'], observaciones: null, version: caso.version }));
      expect(fallo(api.registrarActuaciones(caso.casoUadId, { actuaciones: ['PRACTICA_PRUEBAS'], observaciones: null, version: caso.version })).codigo).toBe('CONFLICTO_VERSION');
    });

    it('el expediente UAD se registra después y el cambio queda en el historial', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const caso = valor(api.obtenerCaso('mock-cuad-201'));
      expect(caso.expedienteUad).toBeNull();
      const r = valor(api.registrarExpediente(caso.casoUadId, { expedienteUad: ' EXP-FICTICIO-0100 ', version: caso.version }));
      expect(r.caso?.expedienteUad).toBe('EXP-FICTICIO-0100');
      expect(r.eventos[0]).toEqual(jasmine.objectContaining({ tipo: 'EXPEDIENTE_ACTUALIZADO', estadoAnterior: null, estadoNuevo: 'EXP-FICTICIO-0100' }));
    });

    describe('traslado instrucción → decisión', () => {
      it('exige confirmación explícita', () => {
        const { api } = crear(['UAD_EQUIPO_3']);
        const caso = valor(api.obtenerCaso('mock-cuad-201'));
        expect(fallo(api.finalizarInstruccion(caso.casoUadId, { confirmaTraslado: false, observaciones: null, version: caso.version })).camposInvalidos['confirmaTraslado']).toBeTruthy();
      });

      it('docente: pasa de Equipo 3 a Equipo 4, conserva identificadores, evidencias e historial', () => {
        const e3 = crear(['UAD_EQUIPO_3']);
        const caso = valor(e3.api.obtenerCaso('mock-cuad-201'));
        const evidencias = valor(e3.api.evidenciasCaso(caso.casoUadId));
        const historial = valor(e3.api.historialCaso(caso.casoUadId));
        const r = valor(e3.api.finalizarInstruccion(caso.casoUadId, { confirmaTraslado: true, observaciones: null, version: caso.version }));
        expect(r.visibleParaUsuario).toBeFalse();
        expect(r.caso).toBeNull();
        expect(r.notificaciones[0]).toEqual(jasmine.objectContaining({ evento: 'CAMBIO_FASE', destinatario: 'VICTIMA' }));
        expect(r.notificaciones[0].estado).not.toBe('ENVIADA');
        // Sale de la bandeja del instructor.
        expect(ids(e3.api)).not.toContain('mock-cuad-201');
        expect(fallo(e3.api.obtenerCaso('mock-cuad-201')).estado).toBe(404);

        // Aparece en la del decisor, con todo conservado. El store es otro TestBed: se simula sobre el mismo.
        const store = TestBed.inject(UadMockStore);
        const trasladado = store.buscarCaso('mock-cuad-201')!;
        expect(trasladado.faseActual).toBe('DECISION');
        expect(trasladado.equipoResponsable).toBe('EQUIPO_4');
        expect(trasladado.casoId).toBe(caso.casoId);
        expect(trasladado.fechaAdmision).toBe(caso.fechaAdmision);
        expect(trasladado.evidencias.map((e) => e.evidenciaId)).toEqual(evidencias.map((e) => e.evidenciaId));
        const historialNuevo = store.historialCasos.get('mock-cuad-201')!;
        expect(historialNuevo.slice(0, historial.length)).toEqual(historial);
        expect(historialNuevo[historialNuevo.length - 1].tipo).toBe('TRASLADO_FASE');
      });

      it('el decisor lo ve en su bandeja tras el traslado (ADMIN cambiando de equipo simulado)', () => {
        const { api, simulacion } = crear(['ADMIN']);
        simulacion.equipoSimulado.set('EQUIPO_4');
        const caso = valor(api.obtenerCaso('mock-cuad-139'));
        valor(api.finalizarInstruccion(caso.casoUadId, { confirmaTraslado: true, observaciones: null, version: caso.version }));
        expect(ids(api)).not.toContain('mock-cuad-139');
        simulacion.equipoSimulado.set('EQUIPO_3');
        expect(ids(api)).toContain('mock-cuad-139');
        expect(valor(api.obtenerCaso('mock-cuad-139')).faseActual).toBe('DECISION');
      });

      it('en decisión responde 409 FASE_NO_PERMITE', () => {
        const { api } = crear(['UAD_EQUIPO_3']);
        const caso = valor(api.obtenerCaso('mock-cuad-203'));
        expect(fallo(api.finalizarInstruccion(caso.casoUadId, { confirmaTraslado: true, observaciones: null, version: caso.version })).codigo).toBe('FASE_NO_PERMITE');
      });
    });

    it('la remisión por competencia finaliza la gestión UAD sin enviar nada y sin cerrar el caso CASILDA', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const caso = valor(api.obtenerCaso('mock-cuad-201'));
      const futura = fallo(api.remitirCasoPorCompetencia(caso.casoUadId, { entidadDestinatariaCodigo: 'FISCALIA', fechaRemision: LEJANA, justificacion: null, version: caso.version }));
      expect(futura.camposInvalidos['fechaRemision']).toBeTruthy();
      const r = valor(
        api.remitirCasoPorCompetencia(caso.casoUadId, { entidadDestinatariaCodigo: 'FISCALIA', fechaRemision: fechaCalendario(new Date()), justificacion: null, version: caso.version })
      );
      expect(r.caso?.estadoGestion).toBe('FINALIZADA');
      expect(r.caso?.motivoFinGestion).toBe('REMITIDA_POR_COMPETENCIA');
      expect(r.caso?.casoId).toBe(caso.casoId);
      expect(r.notificaciones).toEqual([]);
      expect(ids(api)).not.toContain('mock-cuad-201');
      expect(fallo(api.registrarActuaciones(caso.casoUadId, { actuaciones: ['PRACTICA_PRUEBAS'], observaciones: null, version: r.caso!.version })).codigo).toBe('CASO_NO_ACTIVO');
    });

    it('la admisión crea un caso activo en instrucción con las evidencias de la noticia', () => {
      const { api } = crear(['UAD_EQUIPO_3']);
      const n = valor(api.obtenerNoticia('mock-ndi-141'));
      const r = valor(
        api.registrarDecision(n.noticiaId, { tipo: 'CONTINUAR_TRAMITE', version: n.version, continuarTramite: { modoCaso: 'CREAR_NUEVO', casoIdVincular: null, confirmaMismosHechos: false, expedienteUad: null } })
      );
      const caso = valor(api.obtenerCaso(r.casoUad!.casoUadId));
      expect(caso.estadoGestion).toBe('ACTIVA');
      expect(valor(api.evidenciasCaso(caso.casoUadId)).length).toBe(n.evidencias.length);
      expect(valor(api.historialCaso(caso.casoUadId))[0].tipo).toBe('CASO_CREADO');
    });

    it('descarga evidencias del caso para el equipo responsable', () => {
      expect(valor(crear(['UAD_EQUIPO_3']).api.descargarEvidencia('mock-ev-2011')).type).toBe('text/plain');
      expect(fallo(crear(['UAD_EQUIPO_4']).api.descargarEvidencia('mock-ev-2011')).estado).toBe(404);
    });
  });
});
