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
});
