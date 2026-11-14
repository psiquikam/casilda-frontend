import { AtencionAphDto, ConsultaPersonaDto, DerivacionPsicologiaDto, PaginaAlma, BandejaAphItemDto } from '../shared/types/alma-dto';
import { RUTAS_MOCK_APH } from './aph.handlers';
import { almaMockStore } from './alma-mock-store';
import { RespuestaMock } from './alma-mock-tipos';

/**
 * El mock debe respetar **exactamente** el contrato: validaciones, códigos de error y
 * escenarios del Anexo B. Si el mock acepta lo que el contrato rechaza, la pantalla pasaría en
 * desarrollo y fallaría contra el servicio real.
 */
describe('manejadores mock de APH', () => {
  function llamar(metodo: 'GET' | 'POST' | 'PUT' | 'PATCH', ruta: string, cuerpo?: unknown, query = ''): RespuestaMock {
    const candidata = RUTAS_MOCK_APH.find((r) => r.metodo === metodo && r.patron.test(ruta));
    if (!candidata) throw new Error(`Sin manejador para ${metodo} ${ruta}`);
    return candidata.manejador(
      { metodo, ruta, query: new URLSearchParams(query), cuerpo, usuario: 'Técnico APH (prueba)', parametros: (ruta.match(candidata.patron) ?? []).slice(1) },
      almaMockStore
    );
  }

  const consentimiento = { otorgado: true, medio: 'VERBAL', fechaRegistro: '2026-11-06T09:14:00-05:00', versionTexto: 'v0-provisional' };

  function crearBorrador(documento = '1000000001'): AtencionAphDto {
    const r = llamar('POST', '/atenciones-aph', {
      canalIngreso: 'LLAMADA',
      persona: { tipoIdentificacion: 'CC', numeroIdentificacion: documento },
      motivoConsulta: 'Motivo de prueba'
    });
    expect(r.estado).toBe(201);
    return r.cuerpo as AtencionAphDto;
  }

  beforeEach(() => almaMockStore.reiniciar());

  describe('consulta por documento (F2)', () => {
    it('una persona sin historial: no existe y no hay alertas', () => {
      const c = llamar('GET', '/personas/consulta', undefined, 'tipoIdentificacion=CC&numeroIdentificacion=1000000001').cuerpo as ConsultaPersonaDto;
      expect(c.existe).toBeFalse();
      expect(c.seguimientoActivo?.activo).toBeFalse();
      expect(c.tieneCasoCerrado).toBeFalse();
    });

    it('CC 1000000002 tiene seguimiento activo con fecha futura y profesional', () => {
      const c = llamar('GET', '/personas/consulta', undefined, 'tipoIdentificacion=CC&numeroIdentificacion=1000000002').cuerpo as ConsultaPersonaDto;
      expect(c.seguimientoActivo?.activo).toBeTrue();
      expect(Date.parse(c.seguimientoActivo!.proximoSeguimiento!)).toBeGreaterThan(Date.now());
      expect(c.seguimientoActivo?.profesional).toBeTruthy();
    });

    it('CC 1000000003 tiene un caso cerrado con su número', () => {
      const c = llamar('GET', '/personas/consulta', undefined, 'tipoIdentificacion=CC&numeroIdentificacion=1000000003').cuerpo as ConsultaPersonaDto;
      expect(c.tieneCasoCerrado).toBeTrue();
      expect(c.ultimoCasoCerrado?.numeroCaso).toBe('CAS-2026-000003');
    });

    it('nunca devuelve información clínica al Técnico APH', () => {
      const c = llamar('GET', '/personas/consulta', undefined, 'tipoIdentificacion=CC&numeroIdentificacion=1000000002').cuerpo as Record<string, unknown>;
      expect(Object.keys(c).sort()).toEqual(['existe', 'persona', 'seguimientoActivo', 'tieneCasoCerrado', 'ultimoCasoCerrado']);
    });

    it('rechaza una consulta sin documento con 400 y el campo en `detalles`', () => {
      const r = llamar('GET', '/personas/consulta', undefined, 'tipoIdentificacion=CC');
      expect(r.estado).toBe(400);
      expect((r.cuerpo as { detalles: Record<string, string> }).detalles['numeroIdentificacion']).toBeDefined();
    });
  });

  describe('registro de la atención', () => {
    it('crea un borrador con ID ALMA-AAAA-NNNNNN y versión 1', () => {
      const a = crearBorrador();
      expect(a.idAtencion).toMatch(/^ALMA-\d{4}-\d{6}$/);
      expect(a.estado).toBe('BORRADOR');
      expect(a.version).toBe(1);
    });

    it('cada llamada nueva genera una atención nueva, aun con seguimiento activo (RN-ALMA-06)', () => {
      const primera = crearBorrador('1000000002');
      const segunda = crearBorrador('1000000002');
      expect(segunda.idAtencion).not.toBe(primera.idAtencion);
      expect(segunda.numeroCaso).toBeNull();
    });

    it('exige documento y canal al crear: 400 con un mensaje por campo', () => {
      const r = llamar('POST', '/atenciones-aph', { persona: {} });
      expect(r.estado).toBe(400);
      const detalles = (r.cuerpo as { detalles: Record<string, string> }).detalles;
      expect(Object.keys(detalles)).toEqual(['persona.tipoIdentificacion', 'persona.numeroIdentificacion', 'canalIngreso']);
    });

    it('PATCH con la versión correcta guarda y sube la versión', () => {
      const a = crearBorrador();
      const r = llamar('PATCH', `/atenciones-aph/${a.idAtencion}`, { version: 1, persona: { nombres: 'Persona' }, motivoConsulta: 'Otro' });
      expect(r.estado).toBe(200);
      expect((r.cuerpo as AtencionAphDto).version).toBe(2);
      expect((r.cuerpo as AtencionAphDto).persona.nombres).toBe('Persona');
    });

    it('PATCH con una versión vieja responde 409 CONFLICTO_VERSION', () => {
      const a = crearBorrador();
      llamar('PATCH', `/atenciones-aph/${a.idAtencion}`, { version: 1, motivoConsulta: 'A' });
      const r = llamar('PATCH', `/atenciones-aph/${a.idAtencion}`, { version: 1, motivoConsulta: 'B' });
      expect(r.estado).toBe(409);
      expect((r.cuerpo as { codigo: string }).codigo).toBe('CONFLICTO_VERSION');
    });

    it('PATCH no permite cambiar el documento: la atención conserva el original', () => {
      const a = crearBorrador('1000000001');
      const r = llamar('PATCH', `/atenciones-aph/${a.idAtencion}`, { version: 1, persona: { numeroIdentificacion: '999', tipoIdentificacion: 'TI' } });
      expect((r.cuerpo as AtencionAphDto).persona.numeroIdentificacion).toBe('1000000001');
      expect((r.cuerpo as AtencionAphDto).persona.tipoIdentificacion).toBe('CC');
    });

    it('una atención inexistente responde 404', () => {
      expect(llamar('GET', '/atenciones-aph/ALMA-2026-999999').estado).toBe(404);
    });

    it('el detalle solo trae notas APH o de post-cierre, nunca clínicas', () => {
      const a = crearBorrador();
      const guardada = almaMockStore.atenciones.get(a.idAtencion)!;
      almaMockStore.atenciones.set(a.idAtencion, {
        ...guardada,
        notas: [...guardada.notas, { idNota: 'N-PSI', tipoOrigen: 'PSICO', contenido: 'clínica', fechaRegistro: guardada.fechaCreacion, autor: 'Psicóloga' }]
      });
      const notas = (llamar('GET', `/atenciones-aph/${a.idAtencion}`).cuerpo as AtencionAphDto).notas;
      expect(notas.some((n) => n.tipoOrigen === 'PSICO')).toBeFalse();
    });
  });

  describe('triaje (H-1.3)', () => {
    it('registrar triaje pasa el borrador a EN_GESTION_APH', () => {
      const a = crearBorrador();
      const r = llamar('PUT', `/atenciones-aph/${a.idAtencion}/triaje`, { version: 1, triaje: 'ALTO' });
      expect((r.cuerpo as AtencionAphDto).estado).toBe('EN_GESTION_APH');
      expect((r.cuerpo as AtencionAphDto).triaje).toBe('ALTO');
    });

    it('sin triaje ni omisión responde 422 TRIAJE_REQUERIDO', () => {
      const a = crearBorrador();
      const r = llamar('PUT', `/atenciones-aph/${a.idAtencion}/triaje`, { version: 1 });
      expect(r.estado).toBe(422);
      expect((r.cuerpo as { codigo: string }).codigo).toBe('TRIAJE_REQUERIDO');
    });

    it('la omisión por peligro inminente exige justificación', () => {
      const a = crearBorrador();
      const sin = llamar('PUT', `/atenciones-aph/${a.idAtencion}/triaje`, { version: 1, peligroInminente: true, justificacionOmision: 'corto' });
      expect(sin.estado).toBe(400);
      const con = llamar('PUT', `/atenciones-aph/${a.idAtencion}/triaje`, { version: 1, peligroInminente: true, justificacionOmision: 'Violencia en curso en el campus.' });
      expect(con.estado).toBe(200);
      expect((con.cuerpo as AtencionAphDto).omisionTriaje?.peligroInminente).toBeTrue();
    });

    it('no acepta triaje y omisión a la vez', () => {
      const a = crearBorrador();
      const r = llamar('PUT', `/atenciones-aph/${a.idAtencion}/triaje`, { version: 1, triaje: 'BAJO', peligroInminente: true, justificacionOmision: 'Justificación larga.' });
      expect(r.estado).toBe(422);
    });
  });

  describe('derivación a Psicología (F1, RN-ALMA-02)', () => {
    function conTriaje(triaje: 'ALTO' | 'MEDIO' | 'BAJO'): AtencionAphDto {
      const a = crearBorrador();
      return llamar('PUT', `/atenciones-aph/${a.idAtencion}/triaje`, { version: 1, triaje }).cuerpo as AtencionAphDto;
    }

    it('sin consentimiento responde 422 CONSENTIMIENTO_REQUERIDO y no cambia el estado', () => {
      const a = conTriaje('ALTO');
      const r = llamar('POST', `/atenciones-aph/${a.idAtencion}/derivaciones/psicologia`, { version: a.version });
      expect(r.estado).toBe(422);
      expect((r.cuerpo as { codigo: string }).codigo).toBe('CONSENTIMIENTO_REQUERIDO');
      expect(almaMockStore.atenciones.get(a.idAtencion)?.estado).toBe('EN_GESTION_APH');
    });

    it('con consentimiento deriva y devuelve el SLA según el triaje (12 / 24 / 48 h)', () => {
      for (const [triaje, horas] of [['ALTO', 12], ['MEDIO', 24], ['BAJO', 48]] as const) {
        const a = conTriaje(triaje);
        const r = llamar('POST', `/atenciones-aph/${a.idAtencion}/derivaciones/psicologia`, { version: a.version, consentimiento });
        expect(r.estado).toBe(201);
        const d = r.cuerpo as DerivacionPsicologiaDto;
        expect(d.estado).toBe('PENDIENTE_PSICOLOGIA');
        expect(d.sla.horasLimite).toBe(horas);
        expect(Date.parse(d.sla.venceEn) - Date.parse(d.fechaDerivacion)).toBe(horas * 3_600_000);
      }
    });

    it('derivar sin triaje responde 422 TRIAJE_REQUERIDO', () => {
      const a = crearBorrador();
      const r = llamar('POST', `/atenciones-aph/${a.idAtencion}/derivaciones/psicologia`, { version: 1, consentimiento });
      expect((r.cuerpo as { codigo: string }).codigo).toBe('TRIAJE_REQUERIDO');
    });

    it('lo derivado queda disponible para la bandeja de Psicología (store compartido)', () => {
      const a = conTriaje('MEDIO');
      llamar('POST', `/atenciones-aph/${a.idAtencion}/derivaciones/psicologia`, { version: a.version, consentimiento });
      const guardada = almaMockStore.atenciones.get(a.idAtencion)!;
      expect(guardada.estado).toBe('PENDIENTE_PSICOLOGIA');
      expect(guardada.sla?.horasLimite).toBe(24);
    });

    it('una atención derivada ya no se puede editar', () => {
      const a = conTriaje('ALTO');
      const d = llamar('POST', `/atenciones-aph/${a.idAtencion}/derivaciones/psicologia`, { version: a.version, consentimiento }).cuerpo as DerivacionPsicologiaDto;
      const r = llamar('PATCH', `/atenciones-aph/${a.idAtencion}`, { version: d.version, motivoConsulta: 'cambio' });
      expect(r.estado).toBe(422);
      expect((r.cuerpo as { codigo: string }).codigo).toBe('ATENCION_NO_EDITABLE');
    });
  });

  describe('rutas, cierre y contención (H-1.5, H-1.7)', () => {
    function enGestion(documento = '1000000001'): AtencionAphDto {
      const a = crearBorrador(documento);
      return llamar('PUT', `/atenciones-aph/${a.idAtencion}/triaje`, { version: 1, triaje: 'BAJO' }).cuerpo as AtencionAphDto;
    }

    it('una derivación interna exige consentimiento, salvo peligro inminente', () => {
      const a = enGestion();
      const base = { tipoContexto: 'ATENCION_APH', idContexto: a.idAtencion, destino: 'EA', motivo: 'Acompañamiento presencial' };
      expect(llamar('POST', '/derivaciones/internas', base).estado).toBe(422);
      expect(llamar('POST', '/derivaciones/internas', { ...base, consentimiento }).estado).toBe(201);
      expect(llamar('POST', '/derivaciones/internas', { ...base, destino: 'SPYB', peligroInminente: true }).estado).toBe(201);
    });

    it('lista las derivaciones del contexto', () => {
      const a = enGestion();
      llamar('POST', '/derivaciones/internas', { tipoContexto: 'ATENCION_APH', idContexto: a.idAtencion, destino: 'UAD', motivo: 'Remisión informativa', consentimiento });
      const lista = llamar('GET', '/derivaciones/internas', undefined, `tipoContexto=ATENCION_APH&idContexto=${a.idAtencion}`).cuerpo as unknown[];
      expect(lista.length).toBe(1);
    });

    it('una ruta externa abierta impide cerrar la atención: 422 RUTAS_PENDIENTES', () => {
      const a = enGestion();
      llamar('POST', '/rutas-externas', { tipoContexto: 'ATENCION_APH', idContexto: a.idAtencion, entidad: 'FISCALIA', motivo: 'Denuncia', fechaActivacion: '2026-11-06', consentimiento });
      const r = llamar('POST', `/atenciones-aph/${a.idAtencion}/cierre`, { version: a.version, motivo: 'NO_ACEPTA_PSICOLOGIA' });
      expect(r.estado).toBe(422);
      expect((r.cuerpo as { codigo: string }).codigo).toBe('RUTAS_PENDIENTES');
    });

    it('cerrar una ruta exige resultado y luego permite cerrar la atención', () => {
      const a = enGestion();
      const ruta = llamar('POST', '/rutas-externas', { tipoContexto: 'ATENCION_APH', idContexto: a.idAtencion, entidad: 'ICBF', motivo: 'Menor de edad', fechaActivacion: '2026-11-06', consentimiento }).cuerpo as { idRuta: string; version: number };
      expect(llamar('PATCH', `/rutas-externas/${ruta.idRuta}`, { version: ruta.version, estado: 'CERRADA' }).estado).toBe(400);
      expect(llamar('PATCH', `/rutas-externas/${ruta.idRuta}`, { version: ruta.version, estado: 'CERRADA', resultado: 'La entidad atendió el caso' }).estado).toBe(200);
      const actual = almaMockStore.atenciones.get(a.idAtencion)!;
      const cierre = llamar('POST', `/atenciones-aph/${a.idAtencion}/cierre`, { version: actual.version, motivo: 'REMITIDA_RUTA_EXTERNA' });
      expect(cierre.estado).toBe(200);
      expect((cierre.cuerpo as AtencionAphDto).estado).toBe('CERRADO');
    });

    it('una atención en la cola de Psicología no se cierra desde APH', () => {
      const a = enGestion();
      llamar('POST', `/atenciones-aph/${a.idAtencion}/derivaciones/psicologia`, { version: a.version, consentimiento });
      const actual = almaMockStore.atenciones.get(a.idAtencion)!;
      const r = llamar('POST', `/atenciones-aph/${a.idAtencion}/cierre`, { version: actual.version, motivo: 'NO_ACEPTA_PSICOLOGIA' });
      expect((r.cuerpo as { codigo: string }).codigo).toBe('PSICOLOGIA_PENDIENTE');
    });

    it('la contención post-cierre NO cambia el estado de la atención ni crea un caso', () => {
      const a = enGestion('1000000003');
      const r = llamar('POST', '/contenciones-post-cierre', { idAtencion: a.idAtencion, numeroCaso: 'CAS-2026-000003', nota: 'La persona llamó angustiada y se la contuvo.' });
      expect(r.estado).toBe(201);
      expect((r.cuerpo as { tipoSeguimiento: string }).tipoSeguimiento).toBe('POST_CIERRE');
      const despues = almaMockStore.atenciones.get(a.idAtencion)!;
      expect(despues.estado).toBe('EN_GESTION_APH');
      expect(despues.numeroCaso).toBeNull();
      expect(despues.notas.some((n) => n.tipoOrigen === 'POST_CIERRE')).toBeTrue();
    });

    it('la contención exige que la persona tenga ese caso cerrado: 422', () => {
      const a = enGestion('1000000001');
      const r = llamar('POST', '/contenciones-post-cierre', { idAtencion: a.idAtencion, numeroCaso: 'CAS-2026-000003', nota: 'Nota suficientemente larga.' });
      expect(r.estado).toBe(422);
      expect((r.cuerpo as { codigo: string }).codigo).toBe('PERSONA_SIN_CASO_CERRADO');
    });
  });

  describe('bandeja de APH (H-1.6)', () => {
    it('lista solo remisiones pendientes, las más antiguas primero', () => {
      const pagina = llamar('GET', '/bandeja/aph', undefined, 'vista=remisiones').cuerpo as PaginaAlma<BandejaAphItemDto>;
      expect(pagina.total).toBe(3);
      expect(pagina.items.every((i) => i.estado === 'PENDIENTE_APH')).toBeTrue();
      const fechas = pagina.items.map((i) => i.fechaRemision);
      expect([...fechas].sort()).toEqual(fechas);
    });

    it('filtra por origen', () => {
      const pagina = llamar('GET', '/bandeja/aph', undefined, 'vista=remisiones&origen=SPYB').cuerpo as PaginaAlma<BandejaAphItemDto>;
      expect(pagina.items.map((i) => i.origenRemision)).toEqual(['SPYB']);
    });

    it('pagina', () => {
      const pagina = llamar('GET', '/bandeja/aph', undefined, 'vista=remisiones&page=1&size=2').cuerpo as PaginaAlma<BandejaAphItemDto>;
      expect(pagina.items.length).toBe(1);
      expect(pagina.total).toBe(3);
    });

    it('«Mis atenciones» incluye el plazo de las derivadas, con el reloj del servidor', () => {
      const pagina = llamar('GET', '/bandeja/aph', undefined, 'vista=mias&estado=PENDIENTE_PSICOLOGIA').cuerpo as PaginaAlma<BandejaAphItemDto>;
      expect(pagina.items.length).toBeGreaterThan(0);
      expect(pagina.items.every((i) => !!i.sla?.ahoraServidor)).toBeTrue();
    });

    it('el seed incluye una atención con el SLA vencido (CC 1000000005)', () => {
      const pagina = llamar('GET', '/bandeja/aph', undefined, 'vista=mias&estado=PENDIENTE_PSICOLOGIA').cuerpo as PaginaAlma<BandejaAphItemDto>;
      const vencida = pagina.items.find((i) => i.persona.numeroIdentificacion === '1000000005')!;
      expect(Date.parse(vencida.sla!.venceEn)).toBeLessThan(Date.parse(vencida.sla!.ahoraServidor));
    });

    it('tomar una remisión la pasa a EN_GESTION_APH y sube la versión', () => {
      const primera = (llamar('GET', '/bandeja/aph', undefined, 'vista=remisiones&origen=EA').cuerpo as PaginaAlma<BandejaAphItemDto>).items[0];
      const r = llamar('POST', `/bandeja/aph/${primera.idAtencion}/tomar`, { version: primera.version });
      expect(r.estado).toBe(200);
      expect((r.cuerpo as AtencionAphDto).estado).toBe('EN_GESTION_APH');
      expect((r.cuerpo as AtencionAphDto).version).toBe(primera.version + 1);
    });

    it('si otra persona la tomó antes, responde 409 REMISION_YA_TOMADA', () => {
      const items = (llamar('GET', '/bandeja/aph', undefined, 'vista=remisiones').cuerpo as PaginaAlma<BandejaAphItemDto>).items;
      const conflictiva = items.find((i) => i.persona.numeroIdentificacion === '2000000003')!;
      const r = llamar('POST', `/bandeja/aph/${conflictiva.idAtencion}/tomar`, { version: conflictiva.version });
      expect(r.estado).toBe(409);
      expect((r.cuerpo as { codigo: string }).codigo).toBe('REMISION_YA_TOMADA');
      // y deja de aparecer en la bandeja
      const despues = (llamar('GET', '/bandeja/aph', undefined, 'vista=remisiones').cuerpo as PaginaAlma<BandejaAphItemDto>).items;
      expect(despues.some((i) => i.idAtencion === conflictiva.idAtencion)).toBeFalse();
    });

    it('tomar dos veces la misma remisión: la segunda responde 409', () => {
      const [primera] = (llamar('GET', '/bandeja/aph', undefined, 'vista=remisiones').cuerpo as PaginaAlma<BandejaAphItemDto>).items;
      llamar('POST', `/bandeja/aph/${primera.idAtencion}/tomar`, { version: primera.version });
      expect(llamar('POST', `/bandeja/aph/${primera.idAtencion}/tomar`, { version: primera.version }).estado).toBe(409);
    });
  });

  describe('auditoría (H-3.1)', () => {
    it('registra creación, cambio de estado y derivación en orden', () => {
      const a = crearBorrador();
      const t = llamar('PUT', `/atenciones-aph/${a.idAtencion}/triaje`, { version: 1, triaje: 'ALTO' }).cuerpo as AtencionAphDto;
      llamar('POST', `/atenciones-aph/${a.idAtencion}/derivaciones/psicologia`, { version: t.version, consentimiento });
      const eventos = llamar('GET', '/auditoria', undefined, `tipoContexto=ATENCION_APH&idContexto=${a.idAtencion}`).cuerpo as { accion: string }[];
      expect(eventos.map((e) => e.accion)).toEqual(['CREACION', 'CAMBIO_ESTADO', 'DERIVACION']);
    });
  });

  describe('catálogos', () => {
    it('sirve los catálogos que consume APH, solo con código y etiqueta', () => {
      for (const nombre of ['tipos-identificacion', 'destinos-internos', 'rutas-externas', 'motivos-cierre-aph', 'textos-consentimiento']) {
        const items = llamar('GET', `/catalogos/${nombre}`).cuerpo as { codigo: string; etiqueta: string; activo: boolean }[];
        expect(items.length).withContext(nombre).toBeGreaterThan(0);
        expect(items.every((i) => i.codigo && i.etiqueta && i.activo === true)).withContext(nombre).toBeTrue();
      }
    });

    it('un catálogo inexistente responde 404', () => {
      expect(llamar('GET', '/catalogos/no-existe').estado).toBe(404);
    });
  });
});
