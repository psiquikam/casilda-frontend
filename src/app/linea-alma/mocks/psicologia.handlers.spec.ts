import { PaginaAlma } from '../shared/types/alma-dto';
import {
  AgendaItemDto,
  BandejaPsicologiaItemDto,
  CasoDto,
  NotificacionesPsicologiaDto,
  NovedadPsicologiaDto,
  PrimerContactoRespuestaDto,
  RecontactoDto,
  ResolucionRecontactoRespuestaDto
} from '../shared/types/alma-psicologia-dto';
import { almaMockStore } from './alma-mock-store';
import { RespuestaMock } from './alma-mock-tipos';
import { RUTAS_MOCK_APH } from './aph.handlers';
import { RUTAS_MOCK_PSICOLOGIA } from './psicologia.handlers';

/**
 * El mock de Psicología debe respetar **exactamente** el contrato
 * (`docs/contratos/linea-alma/contrato-psicologia-*.md`): validaciones, códigos de error y
 * escenarios del Anexo B. Cubre además la integración con APH por el store compartido (J-2.2).
 */
describe('manejadores mock de Psicología', () => {
  const PROFESIONAL = 'Profesional de prueba';
  const OTRA = 'Otra profesional (prueba)';
  const anio = new Date().getFullYear();
  const id = (n: number) => `ALMA-${anio}-${String(n).padStart(6, '0')}`;
  const HORA = 3_600_000;

  function llamar(metodo: 'GET' | 'POST' | 'PUT' | 'PATCH', ruta: string, cuerpo?: unknown, query = '', usuario = PROFESIONAL): RespuestaMock {
    const candidata = [...RUTAS_MOCK_PSICOLOGIA, ...RUTAS_MOCK_APH].find((r) => r.metodo === metodo && r.patron.test(ruta));
    if (!candidata) throw new Error(`Sin manejador para ${metodo} ${ruta}`);
    return candidata.manejador(
      { metodo, ruta, query: new URLSearchParams(query), cuerpo, usuario, parametros: (ruta.match(candidata.patron) ?? []).slice(1) },
      almaMockStore
    );
  }

  const detalles = (r: RespuestaMock) => (r.cuerpo as { detalles: Record<string, unknown> }).detalles;
  const codigo = (r: RespuestaMock) => (r.cuerpo as { codigo: string }).codigo;
  const novedad = (idAtencion: string) => llamar('GET', `/psicologia/novedades/${idAtencion}`).cuerpo as NovedadPsicologiaDto;
  const futuro = (horas: number) => new Date(Date.now() + horas * HORA).toISOString();
  const pasado = (horas: number) => new Date(Date.now() - horas * HORA).toISOString();
  const consentimiento = { otorgado: true, medio: 'VERBAL', fechaRegistro: new Date().toISOString(), versionTexto: 'v0-provisional' };

  function tomar(idAtencion: string, usuario = PROFESIONAL): NovedadPsicologiaDto {
    const actual = novedad(idAtencion);
    const r = llamar('POST', `/bandeja/psicologia/${idAtencion}/tomar`, { version: actual.version }, '', usuario);
    expect(r.estado).withContext(JSON.stringify(r.cuerpo)).toBe(200);
    return r.cuerpo as NovedadPsicologiaDto;
  }

  function primerContactoValido(version: number, extra: Record<string, unknown> = {}) {
    return {
      version,
      consentimiento,
      persona: { correoPersonal: 'persona@ejemplo.test' },
      valoracionRiesgo: { nivel: 'MEDIO', descripcion: 'Valoración clínica de prueba suficiente.' },
      dimensiones: ['DIM_01', 'DIM_03'],
      presuntoAgresor: null,
      acuerdos: 'Acuerdos de prueba con la persona atendida.',
      proximoControl: futuro(48),
      ...extra
    };
  }

  /** Deriva a Psicología una atención nueva creada por APH (flujo H-1.2 → H-1.4 sobre el mismo store). */
  function derivarDesdeAph(documento: string, triaje = 'ALTO'): string {
    const creada = llamar('POST', '/atenciones-aph', { canalIngreso: 'LLAMADA', persona: { tipoIdentificacion: 'CC', numeroIdentificacion: documento }, motivoConsulta: 'Motivo' }, '', 'Técnico APH (prueba)');
    const a = creada.cuerpo as { idAtencion: string; version: number };
    const conTriaje = llamar('PUT', `/atenciones-aph/${a.idAtencion}/triaje`, { version: a.version, triaje }, '', 'Técnico APH (prueba)').cuerpo as { version: number };
    const derivada = llamar('POST', `/atenciones-aph/${a.idAtencion}/derivaciones/psicologia`, { version: conTriaje.version, consentimiento }, '', 'Técnico APH (prueba)');
    expect(derivada.estado).toBe(201);
    return a.idAtencion;
  }

  beforeEach(() => almaMockStore.reiniciar());

  describe('bandeja compartida (J-1.1, F1/F3)', () => {
    it('lista solo novedades derivadas, pendientes por defecto, ordenadas por menor tiempo restante', () => {
      const pagina = llamar('GET', '/bandeja/psicologia', undefined, 'estado=PENDIENTE_PSICOLOGIA&page=0&size=20').cuerpo as PaginaAlma<BandejaPsicologiaItemDto>;
      expect(pagina.total).toBeGreaterThanOrEqual(5);
      expect(pagina.items.every((i) => i.estado === 'PENDIENTE_PSICOLOGIA')).toBeTrue();
      const vencimientos = pagina.items.map((i) => Date.parse(i.sla.venceEn));
      expect(vencimientos).toEqual([...vencimientos].sort((a, b) => a - b));
      expect(pagina.items[0].persona.numeroIdentificacion).toBe('1000000005'); // SLA vencido (Anexo B)
    });

    it('cada ítem trae SLA con `ahoraServidor` reciente, intentos y marca de recontacto', () => {
      const pagina = llamar('GET', '/bandeja/psicologia', undefined, 'page=0&size=50').cuerpo as PaginaAlma<BandejaPsicologiaItemDto>;
      const seis = pagina.items.find((i) => i.persona.numeroIdentificacion === '1000000006')!;
      expect(seis.intentosRealizados).toBe(3);
      expect(Math.abs(Date.parse(seis.sla.ahoraServidor) - Date.now())).toBeLessThan(5000);
      const recontacto = pagina.items.find((i) => i.idAtencion === id(14))!;
      expect(recontacto.recontacto).toBeTrue();
      expect(pagina.items.find((i) => i.idAtencion === id(6))?.tomadaPor).toBe(OTRA);
    });

    it('filtra por triaje, semáforo y documento, y rechaza valores inválidos', () => {
      const rojo = llamar('GET', '/bandeja/psicologia', undefined, 'semaforo=ROJO&page=0&size=50').cuerpo as PaginaAlma<BandejaPsicologiaItemDto>;
      expect(rojo.items.some((i) => i.persona.numeroIdentificacion === '1000000005')).toBeTrue();
      const alto = llamar('GET', '/bandeja/psicologia', undefined, 'triaje=ALTO&page=0&size=50').cuerpo as PaginaAlma<BandejaPsicologiaItemDto>;
      expect(alto.items.every((i) => i.triaje === 'ALTO')).toBeTrue();
      const doc = llamar('GET', '/bandeja/psicologia', undefined, 'documento=1000000007').cuerpo as PaginaAlma<BandejaPsicologiaItemDto>;
      expect(doc.total).toBe(1);
      expect(llamar('GET', '/bandeja/psicologia', undefined, 'triaje=URGENTE').estado).toBe(400);
    });

    it('`GET /psicologia/notificaciones` cuenta pendientes, recontactos y vencidos', () => {
      const n = llamar('GET', '/psicologia/notificaciones').cuerpo as NotificacionesPsicologiaDto;
      expect(n.novedadesPendientes).toBeGreaterThanOrEqual(5);
      expect(n.recontactosPendientes).toBe(1);
      expect(n.slaVencidos).toBeGreaterThanOrEqual(1);
      expect(n.ahoraServidor).toBeTruthy();
    });

    it('lo que APH deriva aparece en la bandeja sin intervención manual (store compartido, H-2.2/J-2.2)', () => {
      const nueva = derivarDesdeAph('1000000001', 'MEDIO');
      const pagina = llamar('GET', '/bandeja/psicologia', undefined, 'documento=1000000001').cuerpo as PaginaAlma<BandejaPsicologiaItemDto>;
      expect(pagina.items.map((i) => i.idAtencion)).toContain(nueva);
      expect(pagina.items[0].sla.horasLimite).toBe(24);
    });
  });

  describe('tomar y liberar (J-1.2, RNF-ALMA-001)', () => {
    it('tomar registra a la profesional, sube la versión y marca `tomadaPorMi`', () => {
      const antes = novedad(id(3));
      const tomada = tomar(id(3));
      expect(tomada.tomadaPor).toBe(PROFESIONAL);
      expect(tomada.tomadaPorMi).toBeTrue();
      expect(tomada.version).toBe(antes.version + 1);
      expect(novedad(id(3)).tomadaPor).toBe(PROFESIONAL);
    });

    it('CC 1000000009: ya tomada por otra profesional → 409 NOVEDAD_YA_TOMADA', () => {
      const actual = novedad(id(6));
      const r = llamar('POST', `/bandeja/psicologia/${id(6)}/tomar`, { version: actual.version });
      expect(r.estado).toBe(409);
      expect(codigo(r)).toBe('NOVEDAD_YA_TOMADA');
      expect(detalles(r)['tomadaPor']).toBe(OTRA);
    });

    it('versión desfasada → 409 CONFLICTO_VERSION con la versión actual', () => {
      const r = llamar('POST', `/bandeja/psicologia/${id(3)}/tomar`, { version: 99 });
      expect(r.estado).toBe(409);
      expect(codigo(r)).toBe('CONFLICTO_VERSION');
      expect(detalles(r)['versionActual']).toBe(novedad(id(3)).version);
    });

    it('solo quien la tomó puede liberarla; al liberar vuelve a la cola', () => {
      const tomada = tomar(id(3));
      const ajena = llamar('POST', `/bandeja/psicologia/${id(3)}/liberar`, { version: tomada.version }, '', OTRA);
      expect(ajena.estado).toBe(422);
      expect(codigo(ajena)).toBe('NOVEDAD_NO_TOMADA');
      const propia = llamar('POST', `/bandeja/psicologia/${id(3)}/liberar`, { version: tomada.version });
      expect(propia.estado).toBe(200);
      expect((propia.cuerpo as NovedadPsicologiaDto).tomadaPor).toBeNull();
    });

    it('una atención no derivada o inexistente no es novedad: 404', () => {
      expect(codigo(llamar('GET', `/psicologia/novedades/${id(8)}`))).toBe('NOVEDAD_NO_ENCONTRADA');
      expect(llamar('GET', '/psicologia/novedades/ALMA-2026-999999').estado).toBe(404);
    });
  });

  describe('detalle de la novedad (RNF-ALMA-002, RN-ALMA-04)', () => {
    it('trae el triaje de APH, el consentimiento y solo notas APH; nunca notas clínicas', () => {
      const n = novedad(id(4));
      expect(n.triaje).toBe('MEDIO');
      expect(n.consentimientoAph?.otorgado).toBeTrue();
      expect(n.notasAph.every((nota) => nota.tipoOrigen === 'APH' || nota.tipoOrigen === 'POST_CIERRE')).toBeTrue();
      expect(n.intentos.length).toBe(3);
      expect(n.sla.horasLimite).toBe(24);
    });

    it('marca el recontacto y resume el caso activo (F2)', () => {
      const n = novedad(id(14));
      expect(n.recontacto).toBeTrue();
      expect(n.casoActivo?.numeroCaso).toBe(`CAS-${anio}-000002`);
      expect(n.casoActivo?.proximoControl).toBeTruthy();
    });
  });

  describe('protocolo de intentos (J-1.3, RN-ALMA-03)', () => {
    const intento = (idAtencion: string, version: number, numero: number, extra: Record<string, unknown> = {}) =>
      llamar('POST', `/psicologia/novedades/${idAtencion}/intentos`, {
        version,
        fechaHora: pasado(1),
        resultado: 'NO_CONTESTA',
        nota: `Intento ${numero} de prueba`,
        ...extra
      });

    it('exige haber tomado la novedad (422 NOVEDAD_NO_TOMADA) y la versión vigente (409)', () => {
      const libre = novedad(id(3));
      expect(codigo(intento(id(3), libre.version, 1))).toBe('NOVEDAD_NO_TOMADA');
      const tomada = tomar(id(3));
      expect(codigo(intento(id(3), tomada.version + 5, 1))).toBe('CONFLICTO_VERSION');
    });

    it('valida resultado del catálogo, fecha no futura y nota mínima con `detalles` por campo', () => {
      const tomada = tomar(id(3));
      const r = intento(id(3), tomada.version, 1, { resultado: 'INVENTADO', fechaHora: futuro(2), nota: 'ab' });
      expect(r.estado).toBe(400);
      expect(Object.keys(detalles(r)).sort()).toEqual(['fechaHora', 'nota', 'resultado']);
    });

    it('registra el intento con su protocolo, devuelve la novedad y sube la versión', () => {
      const tomada = tomar(id(3));
      const r = intento(id(3), tomada.version, 1);
      expect(r.estado).toBe(201);
      const n = r.cuerpo as NovedadPsicologiaDto;
      expect(n.intentos.length).toBe(1);
      expect(n.intentos[0].protocolo).toBe('PROTOCOLO_1');
      expect(n.intentos[0].numeroIntento).toBe(1);
      expect(n.version).toBe(tomada.version + 1);
    });

    it('desde el cuarto intento exige justificación (CC 1000000006 ya tiene 3)', () => {
      const n = tomar(id(4));
      const sin = intento(id(4), n.version, 4);
      expect(sin.estado).toBe(400);
      expect(detalles(sin)['justificacion']).toBeDefined();
      const con = intento(id(4), n.version, 4, { justificacion: 'La persona pidió que se le insistiera.' });
      expect(con.estado).toBe(201);
      expect((con.cuerpo as NovedadPsicologiaDto).intentos[3].protocolo).toBe('ADICIONAL');
    });

    it('con el noveno intento sin éxito cierra por «No contacto» y ya no admite más (CC 1000000007 tiene 8)', () => {
      const n = tomar(id(5));
      const noveno = intento(id(5), n.version, 9, { justificacion: 'Último intento del protocolo.' });
      expect(noveno.estado).toBe(201);
      const cerrada = noveno.cuerpo as NovedadPsicologiaDto;
      expect(cerrada.estado).toBe('CERRADO');
      expect(cerrada.cierre?.motivo).toBe('NO_CONTACTO');
      expect(cerrada.intentos.length).toBe(9);
      const decimo = intento(id(5), cerrada.version, 10, { justificacion: 'Otro más.' });
      expect(codigo(decimo)).toBe('NOVEDAD_CERRADA');
      expect(novedad(id(5)).tomadaPorMi).toBeTrue();
    });
  });

  describe('primer contacto efectivo (J-1.4, RF-ALMA-001, RN-ALMA-02/04/06)', () => {
    it('sin consentimiento verbal responde 422 CONSENTIMIENTO_REQUERIDO', () => {
      const t = tomar(id(3));
      const r = llamar('POST', `/psicologia/novedades/${id(3)}/primer-contacto`, primerContactoValido(t.version, { consentimiento: { otorgado: false } }));
      expect(r.estado).toBe(422);
      expect(codigo(r)).toBe('CONSENTIMIENTO_REQUERIDO');
    });

    it('valida riesgo, acuerdos, próximo control futuro y dimensiones del catálogo', () => {
      const t = tomar(id(3));
      const r = llamar('POST', `/psicologia/novedades/${id(3)}/primer-contacto`, primerContactoValido(t.version, {
        valoracionRiesgo: { nivel: 'EXTREMO', descripcion: 'x' },
        acuerdos: '',
        proximoControl: pasado(1),
        dimensiones: ['DIM_99']
      }));
      expect(r.estado).toBe(400);
      expect(Object.keys(detalles(r)).sort()).toEqual(['acuerdos', 'dimensiones', 'proximoControl', 'valoracionRiesgo.descripcion', 'valoracionRiesgo.nivel']);
    });

    it('crea el CAS-AAAA-NNNNNN, vincula la atención, conserva triaje y valoración, y deja a la persona con seguimiento activo (F2)', () => {
      const t = tomar(id(3));
      const r = llamar('POST', `/psicologia/novedades/${id(3)}/primer-contacto`, primerContactoValido(t.version, {
        presuntoAgresor: { nombres: 'N', apellidos: '', vinculo: 'EXPAREJA', convivencia: false, observaciones: null }
      }));
      expect(r.estado).toBe(201);
      const resp = r.cuerpo as PrimerContactoRespuestaDto;
      expect(resp.numeroCaso).toMatch(/^CAS-\d{4}-\d{6}$/);
      expect(resp.vinculado).toBeFalse();
      expect(resp.estadoAtencion).toBe('ABIERTO_ACTIVO');

      const caso = llamar('GET', `/casos/${resp.numeroCaso}`).cuerpo as CasoDto;
      expect(caso.estado).toBe('ABIERTO');
      expect(caso.prioridad).toBe('ALTA');
      expect(caso.triajeAph).toBe('ALTO');
      expect(caso.valoracionRiesgo?.nivel).toBe('MEDIO');
      expect(caso.presuntoAgresor?.vinculo).toBe('EXPAREJA');
      expect(caso.atenciones.map((a) => a.idAtencion)).toEqual([id(3)]);
      expect(caso.notas.some((n) => n.tipoOrigen === 'PSICO')).toBeTrue();
      expect(caso.notas.some((n) => n.tipoOrigen === 'APH')).toBeTrue();
      expect(caso.numeroSeguimientos).toBe(0);
      expect(novedad(id(3)).numeroCaso).toBe(resp.numeroCaso);

      const consulta = llamar('GET', '/personas/consulta', undefined, 'tipoIdentificacion=CC&numeroIdentificacion=1000000005', 'Técnico APH (prueba)').cuerpo as { seguimientoActivo: { activo: boolean } };
      expect(consulta.seguimientoActivo.activo).toBeTrue();
    });

    it('con caso activo exige decisión explícita (422 CASO_ACTIVO_EXISTENTE) y vincula solo si se confirma', () => {
      const t = tomar(id(14));
      const sin = llamar('POST', `/psicologia/novedades/${id(14)}/primer-contacto`, primerContactoValido(t.version));
      expect(sin.estado).toBe(422);
      expect(codigo(sin)).toBe('CASO_ACTIVO_EXISTENTE');
      expect(detalles(sin)['numeroCaso']).toBe(`CAS-${anio}-000002`);

      const otro = llamar('POST', `/psicologia/novedades/${id(14)}/primer-contacto`, primerContactoValido(t.version, { vincularA: 'CAS-2000-000001' }));
      expect(otro.estado).toBe(400);

      const con = llamar('POST', `/psicologia/novedades/${id(14)}/primer-contacto`, primerContactoValido(t.version, { vincularA: `CAS-${anio}-000002` }));
      expect(con.estado).toBe(201);
      const resp = con.cuerpo as PrimerContactoRespuestaDto;
      expect(resp.vinculado).toBeTrue();
      expect(resp.numeroCaso).toBe(`CAS-${anio}-000002`);
      const caso = llamar('GET', `/casos/${resp.numeroCaso}`).cuerpo as CasoDto;
      expect(caso.atenciones.map((a) => a.idAtencion)).toContain(id(14));
    });

    it('`vincularA: CASO_NUEVO` abre un caso distinto aunque exista uno activo (hechos distintos)', () => {
      const t = tomar(id(14));
      const r = llamar('POST', `/psicologia/novedades/${id(14)}/primer-contacto`, primerContactoValido(t.version, { vincularA: 'CASO_NUEVO' }));
      expect(r.estado).toBe(201);
      expect((r.cuerpo as PrimerContactoRespuestaDto).numeroCaso).not.toBe(`CAS-${anio}-000002`);
    });
  });

  describe('expediente y seguimientos (J-1.5, J-2.1, RN-ALMA-05)', () => {
    const caso8 = `CAS-${anio}-000008`;

    it('el expediente trae atenciones vinculadas, seguimientos y notas de todas las fuentes en una sola llamada', () => {
      const caso = llamar('GET', `/casos/${caso8}`).cuerpo as CasoDto;
      expect(caso.numeroSeguimientos).toBe(4);
      expect(caso.seguimientos.length).toBe(4);
      expect(caso.atenciones.length).toBe(1);
      expect(caso.notas.filter((n) => n.tipoOrigen === 'SEGTO').length).toBe(4);
      expect(caso.notas.some((n) => n.tipoOrigen === 'APH')).toBeTrue();
      expect(llamar('GET', '/casos/CAS-2026-999999').estado).toBe(404);
    });

    it('registra seguimientos más allá de los 3 reglamentarios sin bloquear, con recordatorio según haya correo', () => {
      const caso = llamar('GET', `/casos/${caso8}`).cuerpo as CasoDto;
      const r = llamar('POST', `/casos/${caso8}/seguimientos`, { version: caso.version, nota: 'Quinto seguimiento', deseaContinuar: true, proximoControl: futuro(72) });
      expect(r.estado).toBe(201);
      const nuevo = r.cuerpo as CasoDto;
      expect(nuevo.numeroSeguimientos).toBe(5);
      expect(nuevo.estado).toBe('ACTIVO');
      expect(nuevo.seguimientos.at(-1)?.recordatorio?.estado).toBe('ENVIADO');
      expect(nuevo.proximoControl).toBeTruthy();
    });

    it('«no desea continuar» no exige próximo control y deja el caso en cierre', () => {
      const caso = llamar('GET', `/casos/${caso8}`).cuerpo as CasoDto;
      const r = llamar('POST', `/casos/${caso8}/seguimientos`, { version: caso.version, nota: 'La persona no desea continuar', deseaContinuar: false });
      expect(r.estado).toBe(201);
      expect((r.cuerpo as CasoDto).estado).toBe('EN_CIERRE');
      expect((r.cuerpo as CasoDto).proximoControl).toBeNull();
    });

    it('valida nota, respuesta y fecha futura; 409 con versión vieja; 422 si el caso está cerrado', () => {
      const caso = llamar('GET', `/casos/${caso8}`).cuerpo as CasoDto;
      const r = llamar('POST', `/casos/${caso8}/seguimientos`, { version: caso.version, nota: '', deseaContinuar: true, proximoControl: pasado(1) });
      expect(r.estado).toBe(400);
      expect(Object.keys(detalles(r)).sort()).toEqual(['nota', 'proximoControl']);
      expect(codigo(llamar('POST', `/casos/${caso8}/seguimientos`, { version: 99, nota: 'Nota', deseaContinuar: false }))).toBe('CONFLICTO_VERSION');
      const cerrado = llamar('GET', `/casos/CAS-${anio}-000003`).cuerpo as CasoDto;
      expect(codigo(llamar('POST', `/casos/${cerrado.numeroCaso}/seguimientos`, { version: cerrado.version, nota: 'Nota', deseaContinuar: false }))).toBe('CASO_CERRADO');
    });

    it('la agenda lista los controles del rango para la profesional o para todo el equipo', () => {
      const hoy = new Date().toISOString().slice(0, 10);
      const en30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
      const mios = llamar('GET', '/psicologia/agenda', undefined, `desde=${hoy}&hasta=${en30}&alcance=mios`).cuerpo as AgendaItemDto[];
      expect(mios.map((i) => i.numeroCaso)).toContain(caso8);
      const nadie = llamar('GET', '/psicologia/agenda', undefined, `desde=${hoy}&hasta=${en30}&alcance=mios`, 'Alguien sin casos').cuerpo as AgendaItemDto[];
      expect(nadie.length).toBe(0);
      const todos = llamar('GET', '/psicologia/agenda', undefined, `desde=${hoy}&hasta=${en30}&alcance=todos`, 'Alguien sin casos').cuerpo as AgendaItemDto[];
      expect(todos.length).toBeGreaterThanOrEqual(3);
      expect(todos.map((i) => Date.parse(i.proximoControl))).toEqual(todos.map((i) => Date.parse(i.proximoControl)).sort((a, b) => a - b));
    });
  });

  describe('cierre y PDF (J-1.6, RF-ALMA-007)', () => {
    const caso2 = `CAS-${anio}-000002`;

    it('exige motivo del catálogo y observación cuando el motivo es «Otro»', () => {
      const caso = llamar('GET', `/casos/${caso2}`).cuerpo as CasoDto;
      expect(detalles(llamar('POST', `/casos/${caso2}/cierre`, { version: caso.version, motivo: 'INVENTADO' }))['motivo']).toBeDefined();
      expect(detalles(llamar('POST', `/casos/${caso2}/cierre`, { version: caso.version, motivo: 'OTRO' }))['observacion']).toBeDefined();
    });

    it('cierra el caso y sus atenciones, deja el expediente de solo lectura y actualiza la consulta de APH (caso cerrado)', () => {
      const caso = llamar('GET', `/casos/${caso2}`).cuerpo as CasoDto;
      const r = llamar('POST', `/casos/${caso2}/cierre`, { version: caso.version, motivo: 'OBJETIVOS_CUMPLIDOS' });
      expect(r.estado).toBe(200);
      const cerrado = r.cuerpo as CasoDto;
      expect(cerrado.estado).toBe('CERRADO');
      expect(cerrado.cierre?.motivo).toBe('OBJETIVOS_CUMPLIDOS');
      expect(cerrado.proximoControl).toBeNull();
      expect(novedad(id(11)).estado).toBe('CERRADO');
      expect(codigo(llamar('POST', `/casos/${caso2}/cierre`, { version: cerrado.version, motivo: 'OTRO', observacion: 'Ya estaba cerrado antes.' }))).toBe('CASO_CERRADO');
      const consulta = llamar('GET', '/personas/consulta', undefined, 'tipoIdentificacion=CC&numeroIdentificacion=1000000002', 'Técnico APH (prueba)').cuerpo as { tieneCasoCerrado: boolean; seguimientoActivo: { activo: boolean } };
      expect(consulta.tieneCasoCerrado).toBeTrue();
      expect(consulta.seguimientoActivo.activo).toBeFalse();
    });

    it('el PDF se entrega como archivo', () => {
      const r = llamar('GET', `/casos/${caso2}/pdf`);
      expect(r.estado).toBe(200);
      expect(r.cuerpo instanceof Blob).toBeTrue();
      expect((r.cuerpo as Blob).type).toBe('application/pdf');
      expect(llamar('GET', '/casos/CAS-2026-999999/pdf').estado).toBe(404);
    });
  });

  describe('recontactos (J-1.7, RN-ALMA-06, F2)', () => {
    it('lista la atención nueva frente al caso activo con su última nota', () => {
      const lista = llamar('GET', '/psicologia/recontactos').cuerpo as RecontactoDto[];
      expect(lista.length).toBe(1);
      expect(lista[0].idAtencion).toBe(id(14));
      expect(lista[0].casoActivo.numeroCaso).toBe(`CAS-${anio}-000002`);
      expect(lista[0].casoActivo.ultimaNota).toBeTruthy();
    });

    it('vincular al caso: la atención entra al caso y sale de la lista', () => {
      const [r] = llamar('GET', '/psicologia/recontactos').cuerpo as RecontactoDto[];
      const res = llamar('POST', `/psicologia/recontactos/${r.idAtencion}/resolucion`, { version: r.version, decision: 'VINCULAR_A_CASO', numeroCaso: r.casoActivo.numeroCaso, nota: 'Mismos hechos.' });
      expect(res.estado).toBe(200);
      const cuerpo = res.cuerpo as ResolucionRecontactoRespuestaDto;
      expect(cuerpo.numeroCaso).toBe(r.casoActivo.numeroCaso);
      expect(cuerpo.estadoAtencion).toBe('EN_SEGUIMIENTO');
      expect((llamar('GET', '/psicologia/recontactos').cuerpo as RecontactoDto[]).length).toBe(0);
      const caso = llamar('GET', `/casos/${r.casoActivo.numeroCaso}`).cuerpo as CasoDto;
      expect(caso.atenciones.map((a) => a.idAtencion)).toContain(r.idAtencion);
      expect(caso.numeroSeguimientos).toBe(1);
    });

    it('contención puntual: nota en el caso sin sumar seguimientos y la atención se cierra', () => {
      const [r] = llamar('GET', '/psicologia/recontactos').cuerpo as RecontactoDto[];
      const antes = (llamar('GET', `/casos/${r.casoActivo.numeroCaso}`).cuerpo as CasoDto).numeroSeguimientos;
      const res = llamar('POST', `/psicologia/recontactos/${r.idAtencion}/resolucion`, { version: r.version, decision: 'CONTENCION_PUNTUAL', numeroCaso: r.casoActivo.numeroCaso, nota: 'Contención breve por teléfono.' });
      expect(res.estado).toBe(200);
      expect((res.cuerpo as ResolucionRecontactoRespuestaDto).estadoAtencion).toBe('CERRADO');
      const caso = llamar('GET', `/casos/${r.casoActivo.numeroCaso}`).cuerpo as CasoDto;
      expect(caso.numeroSeguimientos).toBe(antes);
      expect(caso.notas.some((n) => n.contenido.includes('Contención puntual'))).toBeTrue();
    });

    it('caso nuevo: la novedad sigue en la bandeja y el primer contacto ya no pide decisión', () => {
      const [r] = llamar('GET', '/psicologia/recontactos').cuerpo as RecontactoDto[];
      const res = llamar('POST', `/psicologia/recontactos/${r.idAtencion}/resolucion`, { version: r.version, decision: 'CASO_NUEVO', nota: 'Hechos distintos a los del caso.' });
      expect(res.estado).toBe(200);
      expect(novedad(r.idAtencion).recontacto).toBeFalse();
      const t = tomar(r.idAtencion);
      const pc = llamar('POST', `/psicologia/novedades/${r.idAtencion}/primer-contacto`, primerContactoValido(t.version));
      expect(pc.estado).toBe(201);
      expect((pc.cuerpo as PrimerContactoRespuestaDto).vinculado).toBeFalse();
    });

    it('valida decisión, nota y caso; 409 con versión vieja; 422 si ya está resuelto', () => {
      const [r] = llamar('GET', '/psicologia/recontactos').cuerpo as RecontactoDto[];
      const invalida = llamar('POST', `/psicologia/recontactos/${r.idAtencion}/resolucion`, { version: r.version, decision: 'OTRA', numeroCaso: 'CAS-2000-000001', nota: '' });
      expect(invalida.estado).toBe(400);
      expect(Object.keys(detalles(invalida)).sort()).toEqual(['decision', 'nota']);
      const casoErrado = llamar('POST', `/psicologia/recontactos/${r.idAtencion}/resolucion`, { version: r.version, decision: 'VINCULAR_A_CASO', numeroCaso: 'CAS-2000-000001', nota: 'Nota válida' });
      expect(detalles(casoErrado)['numeroCaso']).toBeDefined();
      expect(codigo(llamar('POST', `/psicologia/recontactos/${r.idAtencion}/resolucion`, { version: 99, decision: 'CASO_NUEVO', nota: 'Nota válida' }))).toBe('CONFLICTO_VERSION');
      llamar('POST', `/psicologia/recontactos/${r.idAtencion}/resolucion`, { version: r.version, decision: 'CASO_NUEVO', nota: 'Nota válida' });
      expect(codigo(llamar('POST', `/psicologia/recontactos/${r.idAtencion}/resolucion`, { version: r.version + 1, decision: 'CASO_NUEVO', nota: 'Nota válida' }))).toBe('RECONTACTO_YA_RESUELTO');
    });
  });
});
