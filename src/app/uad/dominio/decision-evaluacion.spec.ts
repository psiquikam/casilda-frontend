import { ContextoValidacionDecision, construirDecision, fechaContrato, inicioDelDia, validarDecision } from './decision-evaluacion';

const CTX: ContextoValidacionDecision = {
  tipoNoticia: 'NDI',
  casoIdActual: null,
  casosConsultados: null,
  tieneReportanteIdentificado: true,
  vinculacionDeterminada: true,
  hoy: '2026-11-14'
};

describe('UAD · decisión de evaluación preliminar', () => {
  it('arma un solo bloque, el de la decisión elegida', () => {
    const cuerpo = construirDecision('REMISION_COMPETENCIA', 3, {
      entidadDestinatariaCodigo: 'X',
      fechaRemision: '2026-11-10',
      justificacionInhibitorio: 'no debe viajar',
      informacionRequerida: 'tampoco'
    });
    expect(cuerpo.remisionCompetencia).toBeDefined();
    expect(cuerpo.inhibitorio).toBeUndefined();
    expect(cuerpo.solicitudInformacion).toBeUndefined();
    expect(cuerpo.continuarTramite).toBeUndefined();
    expect(cuerpo.version).toBe(3);
  });

  it('rechaza decisiones incompatibles en una misma operación', () => {
    const cuerpo = { ...construirDecision('INHIBITORIO', 1, { causalCodigo: 'A', justificacionInhibitorio: 'x' }), remisionCompetencia: { faseProceso: 'EVALUACION_PRELIMINAR' as const, entidadDestinatariaCodigo: 'X', fechaRemision: '2026-11-10', justificacion: null } };
    expect(validarDecision(cuerpo, CTX)['tipo']).toBeTruthy();
  });

  it('continuar trámite: el expediente UAD es opcional (UAD-ID-07)', () => {
    const cuerpo = construirDecision('CONTINUAR_TRAMITE', 1, { modoCaso: 'CREAR_NUEVO', expedienteUad: '   ' });
    expect(cuerpo.continuarTramite?.expedienteUad).toBeNull();
    expect(validarDecision(cuerpo, CTX)).toEqual({});
  });

  it('continuar trámite exige vinculación determinada', () => {
    const cuerpo = construirDecision('CONTINUAR_TRAMITE', 1, { modoCaso: 'CREAR_NUEVO' });
    expect(validarDecision(cuerpo, { ...CTX, vinculacionDeterminada: false })['continuarTramite.vinculacion']).toBeTruthy();
  });

  it('vincular exige un caso salido de la consulta y la confirmación de mismos hechos', () => {
    const sinConsulta = construirDecision('CONTINUAR_TRAMITE', 1, { modoCaso: 'VINCULAR_EXISTENTE', casoIdVincular: 'CAS-1', confirmaMismosHechos: true });
    expect(validarDecision(sinConsulta, CTX)['continuarTramite.casoIdVincular']).toBeTruthy();

    const sinConfirmar = construirDecision('CONTINUAR_TRAMITE', 1, { modoCaso: 'VINCULAR_EXISTENTE', casoIdVincular: 'CAS-1', confirmaMismosHechos: false });
    expect(validarDecision(sinConfirmar, { ...CTX, casosConsultados: ['CAS-1'] })['continuarTramite.confirmaMismosHechos']).toBeTruthy();

    expect(validarDecision(sinConsulta, { ...CTX, casosConsultados: ['CAS-1'] })).toEqual({});
  });

  it('si la noticia ya trae ID de caso, solo se permite conservarlo (UAD-ID-06)', () => {
    const crear = construirDecision('CONTINUAR_TRAMITE', 1, { modoCaso: 'CREAR_NUEVO' });
    expect(validarDecision(crear, { ...CTX, casoIdActual: 'CAS-9' })['continuarTramite.modoCaso']).toBeTruthy();
    const conservar = construirDecision('CONTINUAR_TRAMITE', 1, { modoCaso: 'CONSERVAR_ASIGNADO' });
    expect(validarDecision(conservar, { ...CTX, casoIdActual: 'CAS-9' })).toEqual({});
  });

  it('solicitud de información: solo a reportante identificado y con fecha futura', () => {
    const cuerpo = construirDecision('SOLICITAR_INFORMACION', 1, { tipoSolicitudCodigo: 'A', informacionRequerida: 'Precise las fechas de los hechos.', fechaLimite: '2026-11-14' });
    expect(validarDecision(cuerpo, CTX)['solicitudInformacion.fechaLimite']).toBeTruthy();
    expect(validarDecision(cuerpo, { ...CTX, tipoNoticia: 'NDA' })['tipo']).toBeTruthy();
    const valida = construirDecision('SOLICITAR_INFORMACION', 1, { tipoSolicitudCodigo: 'A', informacionRequerida: 'Precise las fechas de los hechos.', fechaLimite: '2026-11-20' });
    expect(validarDecision(valida, CTX)).toEqual({});
  });

  it('remisión: sin radicado de salida, justificación opcional y fecha no futura (UAD-REM-02/03)', () => {
    const cuerpo = construirDecision('REMISION_COMPETENCIA', 1, { entidadDestinatariaCodigo: 'X', fechaRemision: '2026-11-14' });
    expect(cuerpo.remisionCompetencia?.justificacion).toBeNull();
    expect(Object.keys(cuerpo.remisionCompetencia ?? {})).not.toContain('numeroOficio');
    expect(validarDecision(cuerpo, CTX)).toEqual({});
    const futura = construirDecision('REMISION_COMPETENCIA', 1, { entidadDestinatariaCodigo: 'X', fechaRemision: '2026-12-01' });
    expect(validarDecision(futura, CTX)['remisionCompetencia.fechaRemision']).toBeTruthy();
  });

  it('las observaciones son opcionales', () => {
    const cuerpo = construirDecision('INHIBITORIO', 1, { causalCodigo: 'A', justificacionInhibitorio: 'Texto', observaciones: '' });
    expect(cuerpo.observaciones).toBeNull();
    expect(validarDecision(cuerpo, CTX)).toEqual({});
  });

  it('la fecha elegida en el calendario viaja como YYYY-MM-DD local, sin corrimiento de zona horaria', () => {
    expect(fechaContrato(new Date(2026, 10, 5))).toBe('2026-11-05');
    expect(fechaContrato(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05');
    expect(fechaContrato(null)).toBeNull();
    expect(fechaContrato(new Date('no es fecha'))).toBeNull();
  });

  it('los límites del calendario son medianoche local de hoy y de mañana', () => {
    const hoy = inicioDelDia();
    expect([hoy.getHours(), hoy.getMinutes()]).toEqual([0, 0]);
    expect(inicioDelDia(1).getTime()).toBeGreaterThan(hoy.getTime());
    expect(fechaContrato(hoy)).toBe(fechaContrato(new Date()));
  });
});
