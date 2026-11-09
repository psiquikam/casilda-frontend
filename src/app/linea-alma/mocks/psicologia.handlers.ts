import { semaforoDe } from '../shared/sla/sla';
import { AtencionAphDto, CierreAtencionDto, NotaAtencionDto, PaginaAlma, PersonaAtencionDto } from '../shared/types/alma-dto';
import {
  AgendaItemDto,
  BandejaPsicologiaItemDto,
  CasoActivoResumenDto,
  CasoDto,
  IntentoContactoDto,
  NotificacionesPsicologiaDto,
  NovedadPsicologiaDto,
  PresuntoAgresorDto,
  PrimerContactoRespuestaDto,
  RecontactoDto,
  ResolucionRecontactoRespuestaDto,
  SeguimientoDto
} from '../shared/types/alma-psicologia-dto';
import {
  DECISIONES_RECONTACTO,
  ESTADOS_BANDEJA_PSICOLOGIA,
  ESTADOS_CASO_ACTIVOS,
  INTENTOS_SIN_JUSTIFICACION,
  MAX_INTENTOS_CONTACTO,
  MOTIVO_CIERRE_NO_CONTACTO,
  PRIORIDAD_POR_TRIAJE,
  RIESGOS_CLINICOS,
  TRIAJES,
  esNumeroCasoValido,
  protocoloDeIntento
} from '../shared/types/alma.types';
import { AlmaMockStore } from './alma-mock-store';
import { PeticionMock, RespuestaMock, RutaMock, errorMock, ok, validacion } from './alma-mock-tipos';
import { NovedadMock } from './psicologia-mock-seed';

/**
 * Manejadores mock del submódulo **Psicología** (dueño: Jonathan). Replican las validaciones y los
 * códigos de error de `docs/contratos/linea-alma/contrato-psicologia-*.md`: si el mock acepta
 * algo que el contrato rechaza, la pantalla pasaría en desarrollo y fallaría contra el servicio
 * real. Trabajan sobre el **store compartido**: lo que APH deriva aparece aquí sin intervención.
 */

const MIN_NOTA = 5;
const MIN_TEXTO_CLINICO = 10;
/** Tolerancia para «no en el futuro» (relojes ligeramente desfasados). */
const TOLERANCIA_FUTURO_MS = 5 * 60_000;

// ───────────────────────── utilidades ─────────────────────────

function nombreCompleto(persona: PersonaAtencionDto): string {
  return [persona.nombres, persona.apellidos].filter(Boolean).join(' ') || 'Sin nombre registrado';
}

/** Una atención es «novedad» de Psicología cuando APH la derivó (F1). */
function esNovedad(atencion: AtencionAphDto): boolean {
  return !!atencion.fechaDerivacion && !!atencion.sla;
}

function texto(valor: unknown, minimo: number): valor is string {
  return typeof valor === 'string' && valor.trim().length >= minimo;
}

function fechaValida(valor: unknown): valor is string {
  return typeof valor === 'string' && !Number.isNaN(Date.parse(valor));
}

function buscarNovedad(s: AlmaMockStore, id: string): AtencionAphDto | RespuestaMock {
  const atencion = s.atenciones.get(id);
  if (!atencion || !esNovedad(atencion)) {
    return errorMock(404, 'NOVEDAD_NO_ENCONTRADA', 'No encontramos la novedad solicitada.');
  }
  return atencion;
}

function buscarCaso(s: AlmaMockStore, numeroCaso: string): CasoDto | RespuestaMock {
  return s.casos.get(numeroCaso) ?? errorMock(404, 'CASO_NO_ENCONTRADO', 'No encontramos el caso solicitado.');
}

function esRespuesta(valor: object): valor is RespuestaMock {
  return 'estado' in valor && 'cuerpo' in valor && !('idAtencion' in valor) && !('numeroCaso' in valor);
}

function guardarAtencion(s: AlmaMockStore, atencion: AtencionAphDto, cambios: Partial<AtencionAphDto>): AtencionAphDto {
  const nueva: AtencionAphDto = { ...atencion, ...cambios, version: atencion.version + 1, fechaActualizacion: s.ahora().toISOString() };
  s.atenciones.set(nueva.idAtencion, nueva);
  return nueva;
}

function guardarCaso(s: AlmaMockStore, caso: CasoDto, cambios: Partial<CasoDto>): CasoDto {
  const nuevo: CasoDto = { ...caso, ...cambios, version: caso.version + 1, fechaActualizacion: s.ahora().toISOString() };
  s.casos.set(nuevo.numeroCaso, nuevo);
  s.sincronizarPersonaDesdeCaso(nuevo);
  return nuevo;
}

function slaActualizado(s: AlmaMockStore, atencion: AtencionAphDto): AtencionAphDto['sla'] {
  return atencion.sla ? { ...atencion.sla, ahoraServidor: s.ahora().toISOString() } : null;
}

function resumenCaso(caso: CasoDto): CasoActivoResumenDto {
  return {
    numeroCaso: caso.numeroCaso,
    estado: caso.estado,
    fechaApertura: caso.fechaApertura,
    profesional: caso.profesional,
    numeroSeguimientos: caso.numeroSeguimientos,
    proximoControl: caso.proximoControl
  };
}

/** Recontacto pendiente: novedad sin caso cuya persona ya tiene un caso activo y nadie ha decidido (RN-ALMA-06). */
function recontactoPendiente(s: AlmaMockStore, atencion: AtencionAphDto): CasoDto | null {
  if (!esNovedad(atencion) || atencion.numeroCaso || atencion.estado !== 'PENDIENTE_PSICOLOGIA') return null;
  if (s.novedadDe(atencion.idAtencion).recontactoResuelto) return null;
  return s.casoActivoDe(atencion.persona.tipoIdentificacion, atencion.persona.numeroIdentificacion) ?? null;
}

function aItemBandeja(s: AlmaMockStore, atencion: AtencionAphDto, usuario: string): BandejaPsicologiaItemDto {
  const novedad = s.novedadDe(atencion.idAtencion);
  return {
    idAtencion: atencion.idAtencion,
    version: atencion.version,
    persona: {
      tipoIdentificacion: atencion.persona.tipoIdentificacion,
      numeroIdentificacion: atencion.persona.numeroIdentificacion,
      nombreCompleto: nombreCompleto(atencion.persona)
    },
    triaje: atencion.triaje ?? 'ALTO',
    canalIngreso: atencion.canalIngreso,
    estado: atencion.estado,
    fechaDerivacion: atencion.fechaDerivacion!,
    tomadaPor: novedad.tomadaPor,
    tomadaPorMi: novedad.tomadaPor === usuario,
    recontacto: recontactoPendiente(s, atencion) !== null,
    intentosRealizados: novedad.intentos.length,
    sla: slaActualizado(s, atencion)!
  };
}

function aNovedadDto(s: AlmaMockStore, atencion: AtencionAphDto, usuario: string): NovedadPsicologiaDto {
  const novedad = s.novedadDe(atencion.idAtencion);
  const casoActivo = s.casoActivoDe(atencion.persona.tipoIdentificacion, atencion.persona.numeroIdentificacion);
  return {
    idAtencion: atencion.idAtencion,
    version: atencion.version,
    estado: atencion.estado,
    canalIngreso: atencion.canalIngreso,
    origenRemision: atencion.origenRemision,
    persona: atencion.persona,
    motivoConsulta: atencion.motivoConsulta,
    triaje: atencion.triaje,
    omisionTriaje: atencion.omisionTriaje,
    consentimientoAph: atencion.consentimiento,
    fechaDerivacion: atencion.fechaDerivacion!,
    sla: slaActualizado(s, atencion)!,
    tomadaPor: novedad.tomadaPor,
    tomadaPorMi: novedad.tomadaPor === usuario,
    recontacto: recontactoPendiente(s, atencion) !== null,
    casoActivo: casoActivo ? resumenCaso(casoActivo) : null,
    numeroCaso: atencion.numeroCaso,
    // RNF-ALMA-002: solo notas APH y de post-cierre; las clínicas viven en el caso.
    notasAph: atencion.notas.filter((n) => n.tipoOrigen === 'APH' || n.tipoOrigen === 'POST_CIERRE'),
    derivaciones: s.derivaciones.filter((d) => d.tipoContexto === 'ATENCION_APH' && d.idContexto === atencion.idAtencion),
    rutasExternas: s.rutasExternas.filter((r) => r.tipoContexto === 'ATENCION_APH' && r.idContexto === atencion.idAtencion),
    intentos: [...novedad.intentos],
    cierre: atencion.cierre,
    gestionSimultanea: atencion.gestionSimultanea || !!casoActivo?.gestionSimultanea,
    fechaCreacion: atencion.fechaCreacion,
    fechaActualizacion: atencion.fechaActualizacion
  };
}

/** Expediente con las notas APH de las atenciones vinculadas intercaladas en la línea de tiempo. */
function aCasoDto(s: AlmaMockStore, caso: CasoDto): CasoDto {
  const notasAph: NotaAtencionDto[] = caso.atenciones.flatMap((v) => {
    const atencion = s.atenciones.get(v.idAtencion);
    return atencion ? atencion.notas.filter((n) => n.tipoOrigen === 'APH' || n.tipoOrigen === 'POST_CIERRE') : [];
  });
  const propias = caso.notas.filter((n) => !notasAph.some((a) => a.idNota === n.idNota));
  return { ...caso, notas: [...propias, ...notasAph] };
}

/** Comprueba que la sesión actual tenga tomada la novedad y que siga abierta. */
function verificarGestion(s: AlmaMockStore, atencion: AtencionAphDto, usuario: string, version: unknown): RespuestaMock | null {
  if (atencion.estado !== 'PENDIENTE_PSICOLOGIA') {
    return errorMock(422, 'NOVEDAD_CERRADA', 'Esta novedad ya no está pendiente: no admite nuevas acciones.', { estado: atencion.estado });
  }
  const novedad = s.novedadDe(atencion.idAtencion);
  if (novedad.tomadaPor !== usuario) {
    return errorMock(422, 'NOVEDAD_NO_TOMADA', 'Tome la novedad antes de registrar acciones sobre ella.', { tomadaPor: novedad.tomadaPor });
  }
  if (version !== atencion.version) {
    return errorMock(409, 'CONFLICTO_VERSION', 'La novedad cambió desde que la abrió.', { versionActual: atencion.version });
  }
  return null;
}

// ───────────────────────── bandeja y notificaciones (J-1.1) ─────────────────────────

const listarBandeja = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const triaje = p.query.get('triaje') ?? '';
  const semaforo = p.query.get('semaforo') ?? '';
  const estado = p.query.get('estado') ?? '';
  const documento = (p.query.get('documento') ?? '').trim();
  const page = Math.max(0, Number(p.query.get('page') ?? 0));
  const size = Math.min(100, Math.max(1, Number(p.query.get('size') ?? 20)));
  if (triaje && !TRIAJES.includes(triaje as never)) return validacion({ triaje: 'El triaje no es válido.' });
  if (estado && !ESTADOS_BANDEJA_PSICOLOGIA.includes(estado as never)) return validacion({ estado: 'El estado no es válido para la bandeja.' });

  const items = [...s.atenciones.values()]
    .filter((a) => esNovedad(a) && ESTADOS_BANDEJA_PSICOLOGIA.includes(a.estado))
    .filter((a) => (estado ? a.estado === estado : true))
    .filter((a) => (triaje ? a.triaje === triaje : true))
    .filter((a) => (documento ? a.persona.numeroIdentificacion.includes(documento) : true))
    .map((a) => aItemBandeja(s, a, p.usuario))
    .filter((item) => (semaforo ? semaforoDe(item.sla) === semaforo : true))
    // Menor tiempo restante primero; las cerradas al final.
    .sort((a, b) => {
      if (a.estado !== b.estado) return a.estado === 'PENDIENTE_PSICOLOGIA' ? -1 : 1;
      return Date.parse(a.sla.venceEn) - Date.parse(b.sla.venceEn);
    });
  const pagina: PaginaAlma<BandejaPsicologiaItemDto> = { items: items.slice(page * size, page * size + size), page, size, total: items.length };
  return ok(pagina);
};

const notificaciones = (_p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const pendientes = [...s.atenciones.values()].filter((a) => esNovedad(a) && a.estado === 'PENDIENTE_PSICOLOGIA');
  const ahora = s.ahora();
  const respuesta: NotificacionesPsicologiaDto = {
    novedadesPendientes: pendientes.length,
    recontactosPendientes: pendientes.filter((a) => recontactoPendiente(s, a) !== null).length,
    slaVencidos: pendientes.filter((a) => Date.parse(a.sla!.venceEn) <= ahora.getTime()).length,
    ahoraServidor: ahora.toISOString()
  };
  return ok(respuesta);
};

// ───────────────────────── tomar, liberar y detalle (J-1.2) ─────────────────────────

const tomarNovedad = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscarNovedad(s, p.parametros[0]);
  if (esRespuesta(atencion)) return atencion;
  const c = p.cuerpo ?? {};
  if (atencion.estado !== 'PENDIENTE_PSICOLOGIA') {
    return errorMock(422, 'NOVEDAD_CERRADA', 'Esta novedad ya no está pendiente.', { estado: atencion.estado });
  }
  const novedad = s.novedadDe(atencion.idAtencion);
  if (novedad.tomadaPor && novedad.tomadaPor !== p.usuario) {
    return errorMock(409, 'NOVEDAD_YA_TOMADA', 'La novedad ya fue tomada por otro profesional.', { tomadaEn: novedad.tomadaEn, tomadaPor: novedad.tomadaPor });
  }
  if (c.version !== atencion.version) {
    return errorMock(409, 'CONFLICTO_VERSION', 'La novedad cambió desde que la abrió.', { versionActual: atencion.version });
  }
  novedad.tomadaPor = p.usuario;
  novedad.tomadaEn = s.ahora().toISOString();
  const nueva = guardarAtencion(s, atencion, {});
  s.registrarAuditoria('ATENCION_APH', nueva.idAtencion, p.usuario, 'ACTUALIZACION', 'Novedad tomada en la bandeja de Psicología.');
  return ok(aNovedadDto(s, nueva, p.usuario));
};

const liberarNovedad = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscarNovedad(s, p.parametros[0]);
  if (esRespuesta(atencion)) return atencion;
  const c = p.cuerpo ?? {};
  const novedad = s.novedadDe(atencion.idAtencion);
  if (novedad.tomadaPor !== p.usuario) {
    return errorMock(422, 'NOVEDAD_NO_TOMADA', 'Solo quien tomó la novedad puede liberarla.', { tomadaPor: novedad.tomadaPor });
  }
  if (c.version !== atencion.version) {
    return errorMock(409, 'CONFLICTO_VERSION', 'La novedad cambió desde que la abrió.', { versionActual: atencion.version });
  }
  novedad.tomadaPor = null;
  novedad.tomadaEn = null;
  const nueva = guardarAtencion(s, atencion, {});
  s.registrarAuditoria('ATENCION_APH', nueva.idAtencion, p.usuario, 'ACTUALIZACION', 'Novedad liberada: vuelve a la cola compartida.');
  return ok(aNovedadDto(s, nueva, p.usuario));
};

const obtenerNovedad = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscarNovedad(s, p.parametros[0]);
  return esRespuesta(atencion) ? atencion : ok(aNovedadDto(s, atencion, p.usuario));
};

// ───────────────────────── intentos de contacto (J-1.3, RN-ALMA-03) ─────────────────────────

const listarIntentos = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscarNovedad(s, p.parametros[0]);
  return esRespuesta(atencion) ? atencion : ok([...s.novedadDe(atencion.idAtencion).intentos]);
};

const crearIntento = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscarNovedad(s, p.parametros[0]);
  if (esRespuesta(atencion)) return atencion;
  const c = p.cuerpo ?? {};
  const bloqueo = verificarGestion(s, atencion, p.usuario, c.version);
  if (bloqueo) return bloqueo;

  const novedad = s.novedadDe(atencion.idAtencion);
  const numero = novedad.intentos.length + 1;
  if (numero > MAX_INTENTOS_CONTACTO) {
    return errorMock(422, 'INTENTOS_AGOTADOS', 'Ya se registraron los 9 intentos del protocolo.', { intentos: novedad.intentos.length });
  }
  const faltantes: Record<string, string> = {};
  const resultados = s.catalogos.get('resultados-intento') ?? [];
  if (!resultados.some((r) => r.codigo === c.resultado)) faltantes['resultado'] = 'Seleccione el resultado del intento.';
  if (!fechaValida(c.fechaHora)) faltantes['fechaHora'] = 'Indique la fecha y hora del intento.';
  else if (Date.parse(c.fechaHora) > s.ahora().getTime() + TOLERANCIA_FUTURO_MS) faltantes['fechaHora'] = 'La fecha del intento no puede estar en el futuro.';
  if (!texto(c.nota, MIN_NOTA)) faltantes['nota'] = `Escriba la nota del intento (mínimo ${MIN_NOTA} caracteres).`;
  if (numero > INTENTOS_SIN_JUSTIFICACION && !texto(c.justificacion, MIN_TEXTO_CLINICO)) {
    faltantes['justificacion'] = `A partir del intento ${INTENTOS_SIN_JUSTIFICACION + 1} se exige una justificación (mínimo ${MIN_TEXTO_CLINICO} caracteres).`;
  }
  if (Object.keys(faltantes).length) return validacion(faltantes);

  const intento: IntentoContactoDto = {
    idIntento: s.siguienteId('INT'),
    numeroIntento: numero,
    protocolo: protocoloDeIntento(numero),
    fechaHora: new Date(c.fechaHora).toISOString(),
    resultado: c.resultado,
    nota: c.nota.trim(),
    justificacion: numero > INTENTOS_SIN_JUSTIFICACION ? String(c.justificacion).trim() : null,
    autor: p.usuario
  };
  novedad.intentos = [...novedad.intentos, intento];

  const cambios: Partial<AtencionAphDto> = {};
  let detalle = `Intento de contacto ${numero}/${MAX_INTENTOS_CONTACTO} (${c.resultado}).`;
  if (numero === MAX_INTENTOS_CONTACTO) {
    // RF-ALMA-PSI-002: con 9 intentos sin éxito el servidor cierra por «No contacto».
    const cierre: CierreAtencionDto = { motivo: MOTIVO_CIERRE_NO_CONTACTO, observacion: 'Cierre automático: se agotaron los 9 intentos de contacto.', fecha: s.ahora().toISOString() };
    cambios.estado = 'CERRADO';
    cambios.cierre = cierre;
    detalle += ' Se agotó el protocolo: cierre automático por «No contacto».';
  }
  const nueva = guardarAtencion(s, atencion, cambios);
  s.registrarAuditoria('ATENCION_APH', nueva.idAtencion, p.usuario, numero === MAX_INTENTOS_CONTACTO ? 'CAMBIO_ESTADO' : 'NOTA', detalle);
  return ok(aNovedadDto(s, nueva, p.usuario), 201);
};

// ───────────────────────── primer contacto efectivo (J-1.4) ─────────────────────────

function validarAgresor(s: AlmaMockStore, valor: unknown, faltantes: Record<string, string>): PresuntoAgresorDto | null {
  if (!valor || typeof valor !== 'object') return null;
  const a = valor as Record<string, unknown>;
  const vinculos = s.catalogos.get('vinculos-agresor') ?? [];
  if (a['vinculo'] && !vinculos.some((v) => v.codigo === a['vinculo'])) faltantes['presuntoAgresor.vinculo'] = 'El vínculo no es válido.';
  const campo = (clave: string): string | null => (typeof a[clave] === 'string' && (a[clave] as string).trim() ? (a[clave] as string).trim() : null);
  const agresor: PresuntoAgresorDto = {
    nombres: campo('nombres'),
    apellidos: campo('apellidos'),
    vinculo: campo('vinculo'),
    convivencia: typeof a['convivencia'] === 'boolean' ? a['convivencia'] : null,
    observaciones: campo('observaciones')
  };
  return Object.values(agresor).some((v) => v !== null) ? agresor : null;
}

const primerContacto = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscarNovedad(s, p.parametros[0]);
  if (esRespuesta(atencion)) return atencion;
  const c = p.cuerpo ?? {};
  const bloqueo = verificarGestion(s, atencion, p.usuario, c.version);
  if (bloqueo) return bloqueo;
  if (c.consentimiento?.otorgado !== true || !fechaValida(c.consentimiento?.fechaRegistro)) {
    return errorMock(422, 'CONSENTIMIENTO_REQUERIDO', 'No se puede iniciar la atención psicológica sin consentimiento informado.');
  }

  const faltantes: Record<string, string> = {};
  if (!RIESGOS_CLINICOS.includes(c.valoracionRiesgo?.nivel)) faltantes['valoracionRiesgo.nivel'] = 'Indique el nivel de riesgo valorado.';
  if (!texto(c.valoracionRiesgo?.descripcion, MIN_TEXTO_CLINICO)) faltantes['valoracionRiesgo.descripcion'] = `Describa la valoración (mínimo ${MIN_TEXTO_CLINICO} caracteres).`;
  if (!texto(c.acuerdos, MIN_TEXTO_CLINICO)) faltantes['acuerdos'] = `Registre los acuerdos con la persona (mínimo ${MIN_TEXTO_CLINICO} caracteres).`;
  if (!fechaValida(c.proximoControl)) faltantes['proximoControl'] = 'Indique la fecha y hora del próximo control.';
  else if (Date.parse(c.proximoControl) <= s.ahora().getTime()) faltantes['proximoControl'] = 'El próximo control debe ser una fecha futura.';
  const dimensionesCatalogo = s.catalogos.get('dimensiones-salud-mental') ?? [];
  const dimensiones: string[] = Array.isArray(c.dimensiones) ? c.dimensiones : [];
  if (dimensiones.some((d) => !dimensionesCatalogo.some((item) => item.codigo === d))) faltantes['dimensiones'] = 'Hay una dimensión que no existe en el catálogo.';
  const agresor = validarAgresor(s, c.presuntoAgresor, faltantes);
  if (Object.keys(faltantes).length) return validacion(faltantes);

  const novedad = s.novedadDe(atencion.idAtencion);
  const casoActivo = s.casoActivoDe(atencion.persona.tipoIdentificacion, atencion.persona.numeroIdentificacion);
  const vincularA: string | null = typeof c.vincularA === 'string' ? c.vincularA : null;
  if (vincularA && vincularA !== 'CASO_NUEVO' && (!esNumeroCasoValido(vincularA) || vincularA !== casoActivo?.numeroCaso)) {
    return validacion({ vincularA: 'El caso indicado no es el caso activo de la persona.' });
  }
  if (casoActivo && novedad.recontactoResuelto !== 'CASO_NUEVO' && !vincularA) {
    // RN-ALMA-06: nunca se vincula automáticamente; la UI pide confirmación explícita y reenvía `vincularA`.
    return errorMock(422, 'CASO_ACTIVO_EXISTENTE', 'La persona ya tiene un caso activo. Confirme si desea vincular esta atención o abrir un caso nuevo.', resumenCaso(casoActivo) as unknown as Record<string, unknown>);
  }

  const ahora = s.ahora().toISOString();
  const persona: PersonaAtencionDto = {
    ...atencion.persona,
    ...(c.persona ?? {}),
    tipoIdentificacion: atencion.persona.tipoIdentificacion,
    numeroIdentificacion: atencion.persona.numeroIdentificacion
  };
  const notaPrimerContacto: NotaAtencionDto = {
    idNota: s.siguienteId('NOTA-PSICO'),
    tipoOrigen: 'PSICO',
    contenido: `Primer contacto efectivo. Riesgo valorado: ${c.valoracionRiesgo.nivel}. ${String(c.valoracionRiesgo.descripcion).trim()} Acuerdos: ${String(c.acuerdos).trim()}`,
    fechaRegistro: ahora,
    autor: p.usuario
  };
  const vinculada = { idAtencion: atencion.idAtencion, fechaCreacion: atencion.fechaCreacion, canalIngreso: atencion.canalIngreso, triaje: atencion.triaje, estado: 'ABIERTO_ACTIVO' as const, motivoConsulta: atencion.motivoConsulta };

  let caso: CasoDto;
  const vinculado = !!casoActivo && vincularA === casoActivo.numeroCaso;
  if (vinculado) {
    caso = guardarCaso(s, casoActivo!, {
      persona,
      atenciones: [...casoActivo!.atenciones, vinculada],
      proximoControl: new Date(c.proximoControl).toISOString(),
      acuerdos: String(c.acuerdos).trim(),
      notas: [...casoActivo!.notas, { ...notaPrimerContacto, contenido: `Atención ${atencion.idAtencion} vinculada al caso. ${notaPrimerContacto.contenido}` }]
    });
    s.registrarAuditoria('CASO', caso.numeroCaso, p.usuario, 'VINCULACION', `Atención ${atencion.idAtencion} vinculada tras confirmación explícita.`);
  } else {
    caso = {
      numeroCaso: s.siguienteNumeroCaso(),
      version: 1,
      estado: 'ABIERTO',
      prioridad: atencion.triaje ? PRIORIDAD_POR_TRIAJE[atencion.triaje] : 'ALTA',
      persona,
      fechaApertura: ahora,
      profesional: p.usuario,
      triajeAph: atencion.triaje,
      valoracionRiesgo: { nivel: c.valoracionRiesgo.nivel, descripcion: String(c.valoracionRiesgo.descripcion).trim() },
      consentimiento: c.consentimiento,
      dimensiones,
      presuntoAgresor: agresor,
      acuerdos: String(c.acuerdos).trim(),
      atenciones: [vinculada],
      numeroSeguimientos: 0,
      proximoControl: new Date(c.proximoControl).toISOString(),
      seguimientos: [],
      notas: [notaPrimerContacto],
      cierre: null,
      gestionSimultanea: atencion.gestionSimultanea,
      pdfDisponible: true,
      fechaActualizacion: ahora
    };
    s.casos.set(caso.numeroCaso, caso);
    s.sincronizarPersonaDesdeCaso(caso);
    s.registrarAuditoria('CASO', caso.numeroCaso, p.usuario, 'CREACION', `Caso creado en el primer contacto efectivo de ${atencion.idAtencion}.`);
  }
  novedad.recontactoResuelto = novedad.recontactoResuelto ?? (vinculado ? 'VINCULAR_A_CASO' : casoActivo ? 'CASO_NUEVO' : null);
  const nueva = guardarAtencion(s, atencion, { persona, numeroCaso: caso.numeroCaso, estado: 'ABIERTO_ACTIVO' });
  s.registrarAuditoria('ATENCION_APH', nueva.idAtencion, p.usuario, 'CAMBIO_ESTADO', `Primer contacto efectivo. Caso ${caso.numeroCaso}. Estado: con caso abierto.`);
  const respuesta: PrimerContactoRespuestaDto = { numeroCaso: caso.numeroCaso, idAtencion: nueva.idAtencion, version: nueva.version, estadoAtencion: nueva.estado, vinculado };
  return ok(respuesta, 201);
};

// ───────────────────────── expediente, seguimientos, cierre y PDF (J-1.5, J-1.6, J-2.1) ─────────────────────────

const obtenerCaso = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const caso = buscarCaso(s, p.parametros[0]);
  return esRespuesta(caso) ? caso : ok(aCasoDto(s, caso));
};

const listarSeguimientos = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const caso = buscarCaso(s, p.parametros[0]);
  return esRespuesta(caso) ? caso : ok([...caso.seguimientos]);
};

function estadoAtencionesVinculadas(s: AlmaMockStore, caso: CasoDto, estado: AtencionAphDto['estado'], cierre: CierreAtencionDto | null = null): void {
  for (const vinculada of caso.atenciones) {
    const atencion = s.atenciones.get(vinculada.idAtencion);
    if (atencion && atencion.estado !== 'CERRADO') guardarAtencion(s, atencion, { estado, ...(cierre ? { cierre } : {}) });
  }
}

const crearSeguimiento = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const caso = buscarCaso(s, p.parametros[0]);
  if (esRespuesta(caso)) return caso;
  const c = p.cuerpo ?? {};
  if (!ESTADOS_CASO_ACTIVOS.includes(caso.estado)) {
    return errorMock(422, 'CASO_CERRADO', 'El caso está cerrado: no admite nuevos seguimientos.', { estado: caso.estado });
  }
  if (c.version !== caso.version) {
    return errorMock(409, 'CONFLICTO_VERSION', 'El caso cambió desde que lo abrió.', { versionActual: caso.version });
  }
  const faltantes: Record<string, string> = {};
  if (!texto(c.nota, MIN_NOTA)) faltantes['nota'] = `Escriba la nota del seguimiento (mínimo ${MIN_NOTA} caracteres).`;
  if (typeof c.deseaContinuar !== 'boolean') faltantes['deseaContinuar'] = 'Indique si la persona desea continuar con el seguimiento.';
  if (c.deseaContinuar === true) {
    if (!fechaValida(c.proximoControl)) faltantes['proximoControl'] = 'Programe la fecha y hora del próximo control.';
    else if (Date.parse(c.proximoControl) <= s.ahora().getTime()) faltantes['proximoControl'] = 'El próximo control debe ser una fecha futura.';
  }
  if (Object.keys(faltantes).length) return validacion(faltantes);

  const ahora = s.ahora().toISOString();
  const continua = c.deseaContinuar === true;
  const proximoControl = continua ? new Date(c.proximoControl).toISOString() : null;
  const seguimiento: SeguimientoDto = {
    idSeguimiento: s.siguienteId('SEG'),
    numeroSeguimiento: caso.numeroSeguimientos + 1,
    tipo: 'REGULAR',
    fecha: ahora,
    nota: c.nota.trim(),
    deseaContinuar: continua,
    proximoControl,
    // RNF-ALMA-004: el correo lo envía el servidor; aquí se simula según haya correo registrado.
    recordatorio: continua
      ? caso.persona.correoPersonal
        ? { estado: 'ENVIADO', correo: caso.persona.correoPersonal, fechaEnvio: ahora }
        : { estado: 'SIN_CORREO', correo: null, fechaEnvio: null }
      : null,
    autor: p.usuario
  };
  const nuevo = guardarCaso(s, caso, {
    estado: continua ? 'ACTIVO' : 'EN_CIERRE',
    numeroSeguimientos: caso.numeroSeguimientos + 1,
    proximoControl,
    seguimientos: [...caso.seguimientos, seguimiento],
    notas: [...caso.notas, { idNota: `NOTA-${seguimiento.idSeguimiento}`, tipoOrigen: 'SEGTO', contenido: seguimiento.nota, fechaRegistro: ahora, autor: p.usuario }]
  });
  estadoAtencionesVinculadas(s, nuevo, 'EN_SEGUIMIENTO');
  s.registrarAuditoria('CASO', nuevo.numeroCaso, p.usuario, 'NOTA', `Seguimiento ${seguimiento.numeroSeguimiento} registrado. ${continua ? 'Próximo control programado.' : 'La persona no desea continuar.'}`);
  return ok(aCasoDto(s, nuevo), 201);
};

const cerrarCaso = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const caso = buscarCaso(s, p.parametros[0]);
  if (esRespuesta(caso)) return caso;
  const c = p.cuerpo ?? {};
  if (caso.estado === 'CERRADO') return errorMock(422, 'CASO_CERRADO', 'El caso ya está cerrado.');
  if (c.version !== caso.version) {
    return errorMock(409, 'CONFLICTO_VERSION', 'El caso cambió desde que lo abrió.', { versionActual: caso.version });
  }
  const motivos = s.catalogos.get('motivos-cierre-psicologia') ?? [];
  if (!motivos.some((m) => m.codigo === c.motivo)) return validacion({ motivo: 'Seleccione el motivo de cierre.' });
  if (c.motivo === 'OTRO' && !texto(c.observacion, MIN_TEXTO_CLINICO)) return validacion({ observacion: 'Describa el motivo de cierre.' });

  const ahora = s.ahora().toISOString();
  const cierre = { motivo: c.motivo, observacion: texto(c.observacion, 1) ? c.observacion.trim() : null, fecha: ahora, autor: p.usuario };
  const nuevo = guardarCaso(s, caso, { estado: 'CERRADO', proximoControl: null, cierre, pdfDisponible: true });
  estadoAtencionesVinculadas(s, nuevo, 'CERRADO', { motivo: c.motivo, observacion: cierre.observacion, fecha: ahora });
  s.registrarAuditoria('CASO', nuevo.numeroCaso, p.usuario, 'CAMBIO_ESTADO', `Caso cerrado (${c.motivo}).`);
  return ok(aCasoDto(s, nuevo));
};

const descargarPdf = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const caso = buscarCaso(s, p.parametros[0]);
  if (esRespuesta(caso)) return caso;
  if (!caso.pdfDisponible) return errorMock(422, 'PDF_NO_DISPONIBLE', 'El PDF del caso todavía no está disponible.');
  // Documento de demostración: el real lo genera el Backend (RNF-ALMA-004, Q10).
  const lineas = [
    `Caso ${caso.numeroCaso} — Línea Alma (documento de demostración, datos ficticios)`,
    `Persona: ${nombreCompleto(caso.persona)} · ${caso.persona.tipoIdentificacion} ${caso.persona.numeroIdentificacion}`,
    `Apertura: ${caso.fechaApertura} · Estado: ${caso.estado} · Prioridad: ${caso.prioridad}`,
    `Atenciones APH vinculadas: ${caso.atenciones.map((a) => a.idAtencion).join(', ')}`,
    ...caso.seguimientos.map((sg) => `Seguimiento ${sg.numeroSeguimiento} (${sg.fecha}): ${sg.nota}`),
    caso.cierre ? `Cierre: ${caso.cierre.motivo} (${caso.cierre.fecha})` : 'Caso abierto'
  ];
  return ok(new Blob([`%PDF-1.4\n% ${lineas.join('\n% ')}\n`], { type: 'application/pdf' }));
};

const agenda = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const desde = p.query.get('desde');
  const hasta = p.query.get('hasta');
  const alcance = p.query.get('alcance') ?? 'mios';
  const inicio = desde ? Date.parse(desde) : s.ahora().getTime() - 86_400_000;
  const fin = hasta ? Date.parse(hasta) + 86_400_000 : s.ahora().getTime() + 14 * 86_400_000;
  if (Number.isNaN(inicio) || Number.isNaN(fin)) return validacion({ desde: 'El rango de fechas no es válido.' });
  const items: AgendaItemDto[] = [...s.casos.values()]
    .filter((c) => ESTADOS_CASO_ACTIVOS.includes(c.estado) && !!c.proximoControl)
    .filter((c) => alcance === 'todos' || c.profesional === p.usuario)
    .filter((c) => Date.parse(c.proximoControl!) >= inicio && Date.parse(c.proximoControl!) < fin)
    .map((c) => ({
      numeroCaso: c.numeroCaso,
      nombreCompleto: nombreCompleto(c.persona),
      proximoControl: c.proximoControl!,
      numeroSeguimientos: c.numeroSeguimientos,
      profesional: c.profesional,
      recordatorio: c.seguimientos.at(-1)?.recordatorio ?? null
    }))
    .sort((a, b) => Date.parse(a.proximoControl) - Date.parse(b.proximoControl));
  return ok(items);
};

// ───────────────────────── recontactos (J-1.7, F2) ─────────────────────────

function aRecontacto(s: AlmaMockStore, atencion: AtencionAphDto, caso: CasoDto): RecontactoDto {
  const ultima = [...caso.notas].filter((n) => n.tipoOrigen !== 'APH').sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro))[0];
  return {
    idAtencion: atencion.idAtencion,
    version: atencion.version,
    fechaCreacion: atencion.fechaCreacion,
    canalIngreso: atencion.canalIngreso,
    triaje: atencion.triaje,
    motivoConsulta: atencion.motivoConsulta,
    notaAph: atencion.notaAph,
    persona: {
      tipoIdentificacion: atencion.persona.tipoIdentificacion,
      numeroIdentificacion: atencion.persona.numeroIdentificacion,
      nombreCompleto: nombreCompleto(atencion.persona)
    },
    casoActivo: { ...resumenCaso(caso), ultimaNota: ultima?.contenido ?? null }
  };
}

const listarRecontactos = (_p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const items = [...s.atenciones.values()]
    .map((a) => ({ a, caso: recontactoPendiente(s, a) }))
    .filter((x): x is { a: AtencionAphDto; caso: CasoDto } => x.caso !== null)
    .map(({ a, caso }) => aRecontacto(s, a, caso))
    .sort((a, b) => a.fechaCreacion.localeCompare(b.fechaCreacion));
  return ok(items);
};

const resolverRecontacto = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscarNovedad(s, p.parametros[0]);
  if (esRespuesta(atencion)) return atencion;
  const c = p.cuerpo ?? {};
  const caso = recontactoPendiente(s, atencion);
  if (!caso) return errorMock(422, 'RECONTACTO_YA_RESUELTO', 'Este recontacto ya fue resuelto o no requiere decisión.');
  if (c.version !== atencion.version) {
    return errorMock(409, 'CONFLICTO_VERSION', 'La atención cambió desde que la abrió.', { versionActual: atencion.version });
  }
  const faltantes: Record<string, string> = {};
  if (!DECISIONES_RECONTACTO.includes(c.decision)) faltantes['decision'] = 'Elija qué hacer con el recontacto.';
  if (!texto(c.nota, MIN_NOTA)) faltantes['nota'] = `Explique brevemente la decisión (mínimo ${MIN_NOTA} caracteres).`;
  if ((c.decision === 'VINCULAR_A_CASO' || c.decision === 'CONTENCION_PUNTUAL') && c.numeroCaso !== caso.numeroCaso) {
    faltantes['numeroCaso'] = 'El caso indicado no es el caso activo de la persona.';
  }
  if (Object.keys(faltantes).length) return validacion(faltantes);

  const novedad: NovedadMock = s.novedadDe(atencion.idAtencion);
  novedad.recontactoResuelto = c.decision;
  const ahora = s.ahora().toISOString();
  const nota = String(c.nota).trim();
  let nueva: AtencionAphDto;
  if (c.decision === 'VINCULAR_A_CASO') {
    guardarCaso(s, caso, {
      atenciones: [...caso.atenciones, { idAtencion: atencion.idAtencion, fechaCreacion: atencion.fechaCreacion, canalIngreso: atencion.canalIngreso, triaje: atencion.triaje, estado: 'EN_SEGUIMIENTO', motivoConsulta: atencion.motivoConsulta }],
      notas: [...caso.notas, { idNota: s.siguienteId('NOTA-PSICO'), tipoOrigen: 'PSICO', contenido: `Recontacto ${atencion.idAtencion} vinculado al caso. ${nota}`, fechaRegistro: ahora, autor: p.usuario }]
    });
    nueva = guardarAtencion(s, atencion, { numeroCaso: caso.numeroCaso, estado: 'EN_SEGUIMIENTO' });
    s.registrarAuditoria('CASO', caso.numeroCaso, p.usuario, 'VINCULACION', `Recontacto ${atencion.idAtencion} vinculado por decisión de Psicología.`);
    s.registrarAuditoria('ATENCION_APH', atencion.idAtencion, p.usuario, 'VINCULACION', `Vinculada al caso ${caso.numeroCaso}. ${nota}`);
  } else if (c.decision === 'CONTENCION_PUNTUAL') {
    // Q8: contención puntual sobre un caso activo; no incrementa el contador de seguimientos.
    guardarCaso(s, caso, {
      notas: [...caso.notas, { idNota: s.siguienteId('NOTA-PSICO'), tipoOrigen: 'PSICO', contenido: `Contención puntual (no suma seguimientos), atención ${atencion.idAtencion}: ${nota}`, fechaRegistro: ahora, autor: p.usuario }]
    });
    nueva = guardarAtencion(s, atencion, { numeroCaso: caso.numeroCaso, estado: 'CERRADO', cierre: { motivo: 'CONTENCION_PUNTUAL', observacion: nota, fecha: ahora } });
    s.registrarAuditoria('CASO', caso.numeroCaso, p.usuario, 'NOTA', `Contención puntual registrada desde ${atencion.idAtencion}; el contador de seguimientos no cambia.`);
    s.registrarAuditoria('ATENCION_APH', atencion.idAtencion, p.usuario, 'CAMBIO_ESTADO', 'Resuelta como contención puntual. Estado: cerrada.');
  } else {
    nueva = guardarAtencion(s, atencion, {});
    s.registrarAuditoria('ATENCION_APH', atencion.idAtencion, p.usuario, 'ACTUALIZACION', `Psicología decidió abrir un caso nuevo por hechos distintos. ${nota}`);
  }
  const respuesta: ResolucionRecontactoRespuestaDto = {
    idAtencion: nueva.idAtencion,
    version: nueva.version,
    decision: c.decision,
    numeroCaso: nueva.numeroCaso,
    estadoAtencion: nueva.estado
  };
  return ok(respuesta);
};

/** Tabla de rutas de Psicología. Se suma a `RUTAS_MOCK_APH` en el interceptor. */
export const RUTAS_MOCK_PSICOLOGIA: readonly RutaMock[] = [
  { metodo: 'GET', patron: /^\/bandeja\/psicologia$/, grupo: 'bandejaPsicologia', manejador: listarBandeja },
  { metodo: 'GET', patron: /^\/psicologia\/notificaciones$/, grupo: 'bandejaPsicologia', manejador: notificaciones },
  { metodo: 'POST', patron: /^\/bandeja\/psicologia\/([\w-]+)\/tomar$/, grupo: 'bandejaPsicologia', manejador: tomarNovedad },
  { metodo: 'POST', patron: /^\/bandeja\/psicologia\/([\w-]+)\/liberar$/, grupo: 'bandejaPsicologia', manejador: liberarNovedad },
  { metodo: 'GET', patron: /^\/psicologia\/novedades\/([\w-]+)$/, grupo: 'novedades', manejador: obtenerNovedad },
  { metodo: 'GET', patron: /^\/psicologia\/novedades\/([\w-]+)\/intentos$/, grupo: 'novedades', manejador: listarIntentos },
  { metodo: 'POST', patron: /^\/psicologia\/novedades\/([\w-]+)\/intentos$/, grupo: 'novedades', manejador: crearIntento },
  { metodo: 'POST', patron: /^\/psicologia\/novedades\/([\w-]+)\/primer-contacto$/, grupo: 'novedades', manejador: primerContacto },
  { metodo: 'GET', patron: /^\/casos\/([\w-]+)$/, grupo: 'casos', manejador: obtenerCaso },
  { metodo: 'GET', patron: /^\/casos\/([\w-]+)\/seguimientos$/, grupo: 'casos', manejador: listarSeguimientos },
  { metodo: 'POST', patron: /^\/casos\/([\w-]+)\/seguimientos$/, grupo: 'casos', manejador: crearSeguimiento },
  { metodo: 'POST', patron: /^\/casos\/([\w-]+)\/cierre$/, grupo: 'casos', manejador: cerrarCaso },
  { metodo: 'GET', patron: /^\/casos\/([\w-]+)\/pdf$/, grupo: 'casos', manejador: descargarPdf },
  { metodo: 'GET', patron: /^\/psicologia\/agenda$/, grupo: 'agenda', manejador: agenda },
  { metodo: 'GET', patron: /^\/psicologia\/recontactos$/, grupo: 'recontactos', manejador: listarRecontactos },
  { metodo: 'POST', patron: /^\/psicologia\/recontactos\/([\w-]+)\/resolucion$/, grupo: 'recontactos', manejador: resolverRecontacto }
];
