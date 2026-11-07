import {
  AtencionAphDto,
  BandejaAphItemDto,
  ConsultaPersonaDto,
  ContencionPostCierreDto,
  DerivacionInternaDto,
  DerivacionPsicologiaDto,
  NotaAtencionDto,
  PaginaAlma,
  RutaExternaDto
} from '../shared/types/alma-dto';
import { CANALES_INGRESO, ESTADOS_EDITABLES_APH, TRIAJES } from '../shared/types/alma.types';
import { AlmaMockStore } from './alma-mock-store';
import { PeticionMock, RespuestaMock, RutaMock, errorMock, ok, validacion } from './alma-mock-tipos';

/**
 * Manejadores mock del submódulo APH (dueña: Hinara). **Cada uno replica las validaciones y los
 * códigos de error del contrato** (`docs/contratos/linea-alma/`): si el mock acepta algo que el
 * contrato rechaza, la pantalla pasaría en desarrollo y fallaría contra el servicio real.
 */

const MIN_JUSTIFICACION = 10;

function minimoNota(texto: unknown, minimo: number): boolean {
  return typeof texto === 'string' && texto.trim().length >= minimo;
}

function aVista(atencion: AtencionAphDto): AtencionAphDto {
  // El rol APH y el de Psicología solo reciben notas APH y de post-cierre (RNF-ALMA-002).
  return { ...atencion, notas: atencion.notas.filter((nota) => nota.tipoOrigen === 'APH' || nota.tipoOrigen === 'POST_CIERRE') };
}

function buscar(store: AlmaMockStore, id: string): AtencionAphDto | RespuestaMock {
  const atencion = store.atenciones.get(id);
  return atencion ?? errorMock(404, 'ATENCION_NO_ENCONTRADA', 'No encontramos la atención solicitada.');
}

function esRespuesta(valor: AtencionAphDto | RespuestaMock): valor is RespuestaMock {
  return 'estado' in valor && 'cuerpo' in valor && !('idAtencion' in valor);
}

function guardarVersion(store: AlmaMockStore, atencion: AtencionAphDto, cambios: Partial<AtencionAphDto>): AtencionAphDto {
  const nueva: AtencionAphDto = {
    ...atencion,
    ...cambios,
    version: atencion.version + 1,
    fechaActualizacion: store.ahora().toISOString()
  };
  store.atenciones.set(nueva.idAtencion, nueva);
  return nueva;
}

/** 409 por versión desfasada, o 422 si la atención ya no es editable por APH. */
function verificarEdicion(atencion: AtencionAphDto, version: unknown): RespuestaMock | null {
  if (version !== atencion.version) {
    return errorMock(409, 'CONFLICTO_VERSION', 'La atención cambió desde que la abrió.', { versionActual: atencion.version });
  }
  if (!ESTADOS_EDITABLES_APH.includes(atencion.estado)) {
    return errorMock(422, 'ATENCION_NO_EDITABLE', 'La atención ya no se puede modificar.', { estado: atencion.estado });
  }
  return null;
}

function notaAph(atencion: AtencionAphDto, contenido: string | null | undefined, usuario: string, ahora: string): NotaAtencionDto[] {
  const otras = atencion.notas.filter((nota) => nota.idNota !== `NOTA-APH-${atencion.idAtencion}`);
  if (!contenido?.trim()) return otras;
  return [
    {
      idNota: `NOTA-APH-${atencion.idAtencion}`,
      tipoOrigen: 'APH',
      contenido: contenido.trim(),
      fechaRegistro: ahora,
      autor: usuario
    },
    ...otras
  ];
}

// ───────────────────────── catálogos y personas ─────────────────────────

const obtenerCatalogo = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const items = s.catalogos.get(p.parametros[0]);
  return items ? ok(items) : errorMock(404, 'CATALOGO_NO_ENCONTRADO', 'No existe ese catálogo.');
};

const consultarPersona = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const tipo = p.query.get('tipoIdentificacion')?.trim() ?? '';
  const numero = p.query.get('numeroIdentificacion')?.trim() ?? '';
  const faltantes: Record<string, string> = {};
  if (!tipo) faltantes['tipoIdentificacion'] = 'Seleccione el tipo de documento.';
  if (!numero) faltantes['numeroIdentificacion'] = 'Escriba el número de documento.';
  if (Object.keys(faltantes).length) return validacion(faltantes);

  const persona = s.buscarPersona(tipo, numero);
  const previa = [...s.atenciones.values()].find(
    (a) => a.persona.tipoIdentificacion === tipo && a.persona.numeroIdentificacion === numero
  );
  const dia = 86_400_000;
  const respuesta: ConsultaPersonaDto = {
    existe: !!(persona || previa),
    persona: persona
      ? { idPersona: persona.idPersona, nombres: persona.nombres, apellidos: persona.apellidos }
      : previa
        ? { idPersona: 0, nombres: previa.persona.nombres ?? '', apellidos: previa.persona.apellidos ?? '' }
        : null,
    seguimientoActivo:
      persona?.seguimientoActivoEnDias !== undefined
        ? {
            activo: true,
            proximoSeguimiento: new Date(s.ahora().getTime() + persona.seguimientoActivoEnDias * dia).toISOString(),
            profesional: 'Profesional de prueba'
          }
        : { activo: false, proximoSeguimiento: null, profesional: null },
    tieneCasoCerrado: !!persona?.casoCerrado,
    ultimoCasoCerrado: persona?.casoCerrado
      ? {
          numeroCaso: persona.casoCerrado.numeroCaso,
          fechaCierre: new Date(s.ahora().getTime() - persona.casoCerrado.diasDesdeCierre * dia).toISOString()
        }
      : null
  };
  return ok(respuesta);
};

// ───────────────────────── atenciones APH ─────────────────────────

const crearAtencion = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const c = p.cuerpo ?? {};
  const persona = c.persona ?? {};
  const faltantes: Record<string, string> = {};
  if (!persona.tipoIdentificacion) faltantes['persona.tipoIdentificacion'] = 'Seleccione el tipo de documento.';
  if (!persona.numeroIdentificacion) faltantes['persona.numeroIdentificacion'] = 'Escriba el número de documento.';
  if (!CANALES_INGRESO.includes(c.canalIngreso)) faltantes['canalIngreso'] = 'Indique por qué canal llegó la solicitud.';
  if (Object.keys(faltantes).length) return validacion(faltantes);

  const ahora = s.ahora().toISOString();
  const id = s.siguienteIdAtencion();
  const atencion: AtencionAphDto = {
    idAtencion: id,
    version: 1,
    estado: 'BORRADOR',
    canalIngreso: c.canalIngreso,
    origenRemision: null,
    persona: {
      tipoIdentificacion: persona.tipoIdentificacion,
      numeroIdentificacion: persona.numeroIdentificacion,
      nombres: persona.nombres ?? null,
      apellidos: persona.apellidos ?? null,
      telefonoPrincipal: persona.telefonoPrincipal ?? null,
      correoPersonal: persona.correoPersonal ?? null,
      ciudad: persona.ciudad ?? null,
      estrato: persona.estrato ?? null
    },
    solicitante: c.solicitante ?? null,
    motivoConsulta: c.motivoConsulta ?? null,
    notaAph: c.notaAph ?? null,
    triaje: null,
    omisionTriaje: null,
    aceptaPsicologia: null,
    consentimiento: null,
    fechaDerivacion: null,
    sla: null,
    tomadaPor: p.usuario,
    cierre: null,
    numeroCaso: null,
    gestionSimultanea: false,
    notas: [],
    derivaciones: [],
    rutasExternas: [],
    fechaCreacion: ahora,
    fechaActualizacion: ahora
  };
  atencion.notas = notaAph(atencion, c.notaAph, p.usuario, ahora);
  s.atenciones.set(id, atencion);
  s.registrarAuditoria('ATENCION_APH', id, p.usuario, 'CREACION', 'Se creó la atención en estado borrador.');
  return ok(aVista(atencion), 201);
};

const obtenerAtencion = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscar(s, p.parametros[0]);
  return esRespuesta(atencion) ? atencion : ok(aVista(atencion));
};

const actualizarAtencion = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscar(s, p.parametros[0]);
  if (esRespuesta(atencion)) return atencion;
  const c = p.cuerpo ?? {};
  const bloqueo = verificarEdicion(atencion, c.version);
  if (bloqueo) return bloqueo;

  const ahora = s.ahora().toISOString();
  const cambios: Partial<AtencionAphDto> = {};
  if (c.canalIngreso !== undefined) {
    if (!CANALES_INGRESO.includes(c.canalIngreso)) return validacion({ canalIngreso: 'El canal no es válido.' });
    cambios.canalIngreso = c.canalIngreso;
  }
  // El documento identifica la atención y no se modifica por PATCH (decisión D-ALMA-08 del contrato).
  if (c.persona) {
    cambios.persona = {
      ...atencion.persona,
      ...c.persona,
      tipoIdentificacion: atencion.persona.tipoIdentificacion,
      numeroIdentificacion: atencion.persona.numeroIdentificacion
    };
  }
  if (c.solicitante !== undefined) cambios.solicitante = c.solicitante;
  if (c.motivoConsulta !== undefined) cambios.motivoConsulta = c.motivoConsulta;
  if (c.notaAph !== undefined) {
    cambios.notaAph = c.notaAph;
    cambios.notas = notaAph(atencion, c.notaAph, p.usuario, ahora);
  }
  if (c.aceptaPsicologia !== undefined) cambios.aceptaPsicologia = c.aceptaPsicologia;
  const nueva = guardarVersion(s, atencion, cambios);
  s.registrarAuditoria('ATENCION_APH', nueva.idAtencion, p.usuario, 'ACTUALIZACION', 'Se actualizaron los datos de la atención.');
  return ok(aVista(nueva));
};

const registrarTriaje = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscar(s, p.parametros[0]);
  if (esRespuesta(atencion)) return atencion;
  const c = p.cuerpo ?? {};
  const bloqueo = verificarEdicion(atencion, c.version);
  if (bloqueo) return bloqueo;

  const conTriaje = TRIAJES.includes(c.triaje);
  const omision = c.peligroInminente === true;
  if (conTriaje === omision) {
    return errorMock(422, 'TRIAJE_REQUERIDO', 'Indique el triaje o registre el motivo por el que se omite.');
  }
  if (omision && !minimoNota(c.justificacionOmision, MIN_JUSTIFICACION)) {
    return validacion({ justificacionOmision: 'Escriba brevemente por qué se omite el triaje (mínimo 10 caracteres).' });
  }
  if (!atencion.motivoConsulta?.trim()) {
    return errorMock(422, 'ATENCION_INCOMPLETA', 'Falta el motivo de consulta.', { motivoConsulta: 'Escriba el motivo de consulta.' });
  }

  const nueva = guardarVersion(s, atencion, {
    estado: 'EN_GESTION_APH',
    triaje: conTriaje ? c.triaje : null,
    omisionTriaje: omision ? { peligroInminente: true, justificacion: String(c.justificacionOmision).trim() } : null
  });
  s.registrarAuditoria(
    'ATENCION_APH',
    nueva.idAtencion,
    p.usuario,
    'CAMBIO_ESTADO',
    conTriaje ? `Triaje ${c.triaje}. Estado: en gestión.` : 'Triaje omitido por peligro inminente. Estado: en gestión.'
  );
  return ok(aVista(nueva));
};

const derivarAPsicologia = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscar(s, p.parametros[0]);
  if (esRespuesta(atencion)) return atencion;
  const c = p.cuerpo ?? {};
  const bloqueo = verificarEdicion(atencion, c.version);
  if (bloqueo) return bloqueo;
  if (atencion.estado === 'BORRADOR' || !atencion.triaje) {
    return errorMock(422, 'TRIAJE_REQUERIDO', 'Registre el triaje antes de derivar a Psicología.');
  }
  if (c.consentimiento?.otorgado !== true || !c.consentimiento?.fechaRegistro) {
    return errorMock(422, 'CONSENTIMIENTO_REQUERIDO', 'No se puede derivar sin consentimiento informado.');
  }

  const ahora = s.ahora();
  const sla = s.calcularSla(atencion.triaje, ahora);
  const nueva = guardarVersion(s, atencion, {
    estado: 'PENDIENTE_PSICOLOGIA',
    aceptaPsicologia: true,
    consentimiento: c.consentimiento,
    fechaDerivacion: ahora.toISOString(),
    sla
  });
  s.registrarAuditoria('ATENCION_APH', nueva.idAtencion, p.usuario, 'DERIVACION', `Derivada a Psicología (triaje ${atencion.triaje}).`);
  const respuesta: DerivacionPsicologiaDto = {
    idAtencion: nueva.idAtencion,
    version: nueva.version,
    estado: nueva.estado,
    triaje: atencion.triaje,
    fechaDerivacion: ahora.toISOString(),
    sla
  };
  return ok(respuesta, 201);
};

const cerrarAtencion = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscar(s, p.parametros[0]);
  if (esRespuesta(atencion)) return atencion;
  const c = p.cuerpo ?? {};
  if (atencion.estado === 'PENDIENTE_PSICOLOGIA') {
    return errorMock(422, 'PSICOLOGIA_PENDIENTE', 'La atención está en la cola de Psicología.');
  }
  const bloqueo = verificarEdicion(atencion, c.version);
  if (bloqueo) return bloqueo;
  const motivos = s.catalogos.get('motivos-cierre-aph') ?? [];
  if (!motivos.some((m) => m.codigo === c.motivo)) return validacion({ motivo: 'Seleccione el motivo de cierre.' });
  if (atencion.rutasExternas.some((ruta) => ruta.estado !== 'CERRADA')) {
    return errorMock(422, 'RUTAS_PENDIENTES', 'Hay rutas externas sin cerrar.');
  }
  const ahora = s.ahora().toISOString();
  const nueva = guardarVersion(s, atencion, {
    estado: 'CERRADO',
    cierre: { motivo: c.motivo, observacion: c.observacion ?? null, fecha: ahora }
  });
  s.registrarAuditoria('ATENCION_APH', nueva.idAtencion, p.usuario, 'CAMBIO_ESTADO', `Atención cerrada (${c.motivo}).`);
  return ok(aVista(nueva));
};

// ───────────────────────── derivaciones y rutas ─────────────────────────

function verificarContexto(s: AlmaMockStore, tipo: unknown, id: unknown): RespuestaMock | null {
  if (tipo !== 'ATENCION_APH' && tipo !== 'CASO') return validacion({ tipoContexto: 'El contexto no es válido.' });
  if (typeof id !== 'string' || !id) return validacion({ idContexto: 'Falta el identificador.' });
  if (tipo === 'ATENCION_APH' && !s.atenciones.has(id)) {
    return errorMock(404, 'ATENCION_NO_ENCONTRADA', 'No encontramos la atención solicitada.');
  }
  return null;
}

function consentimientoValido(c: any): boolean {
  return c?.otorgado === true && !!c?.fechaRegistro && (c?.medio === 'DIGITAL' || c?.medio === 'VERBAL');
}

const crearDerivacionInterna = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const c = p.cuerpo ?? {};
  const fallo = verificarContexto(s, c.tipoContexto, c.idContexto);
  if (fallo) return fallo;
  const destinos = s.catalogos.get('destinos-internos') ?? [];
  const faltantes: Record<string, string> = {};
  if (!destinos.some((d) => d.codigo === c.destino)) faltantes['destino'] = 'Seleccione a qué dependencia se deriva.';
  if (!minimoNota(c.motivo, 5)) faltantes['motivo'] = 'Escriba el motivo de la derivación.';
  if (Object.keys(faltantes).length) return validacion(faltantes);
  if (c.peligroInminente !== true && !consentimientoValido(c.consentimiento)) {
    return errorMock(422, 'CONSENTIMIENTO_REQUERIDO', 'No se puede derivar sin consentimiento informado.');
  }
  const derivacion: DerivacionInternaDto = {
    idDerivacion: s.siguienteId('DER'),
    tipoContexto: c.tipoContexto,
    idContexto: c.idContexto,
    destino: c.destino,
    motivo: c.motivo.trim(),
    estado: 'ENVIADA',
    fechaEnvio: s.ahora().toISOString(),
    peligroInminente: c.peligroInminente === true,
    consentimiento: c.peligroInminente === true ? (c.consentimiento ?? null) : c.consentimiento,
    resultado: null
  };
  s.derivaciones.push(derivacion);
  const atencion = s.atenciones.get(c.idContexto);
  if (atencion) {
    s.atenciones.set(atencion.idAtencion, { ...atencion, derivaciones: [...atencion.derivaciones, derivacion] });
  }
  s.registrarAuditoria(c.tipoContexto, c.idContexto, p.usuario, 'DERIVACION', `Derivación interna a ${c.destino}.`);
  return ok(derivacion, 201);
};

const listarDerivacionesInternas = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const tipo = p.query.get('tipoContexto');
  const id = p.query.get('idContexto');
  return ok(s.derivaciones.filter((d) => d.tipoContexto === tipo && d.idContexto === id));
};

const crearRutaExterna = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const c = p.cuerpo ?? {};
  const fallo = verificarContexto(s, c.tipoContexto, c.idContexto);
  if (fallo) return fallo;
  const entidades = s.catalogos.get('rutas-externas') ?? [];
  const faltantes: Record<string, string> = {};
  if (!entidades.some((e) => e.codigo === c.entidad)) faltantes['entidad'] = 'Seleccione la entidad.';
  if (!minimoNota(c.motivo, 5)) faltantes['motivo'] = 'Escriba el motivo de la activación.';
  if (!c.fechaActivacion) faltantes['fechaActivacion'] = 'Indique cuándo se activó la ruta.';
  if (Object.keys(faltantes).length) return validacion(faltantes);
  if (c.peligroInminente !== true && !consentimientoValido(c.consentimiento)) {
    return errorMock(422, 'CONSENTIMIENTO_REQUERIDO', 'No se puede activar la ruta sin consentimiento informado.');
  }
  const ruta: RutaExternaDto = {
    idRuta: s.siguienteId('RUT'),
    version: 1,
    tipoContexto: c.tipoContexto,
    idContexto: c.idContexto,
    entidad: c.entidad,
    motivo: c.motivo.trim(),
    fechaActivacion: c.fechaActivacion,
    estado: 'ACTIVADA',
    resultado: null,
    peligroInminente: c.peligroInminente === true,
    consentimiento: c.consentimiento ?? null
  };
  s.rutasExternas.push(ruta);
  const atencion = s.atenciones.get(c.idContexto);
  if (atencion) {
    s.atenciones.set(atencion.idAtencion, { ...atencion, rutasExternas: [...atencion.rutasExternas, ruta] });
  }
  s.registrarAuditoria(c.tipoContexto, c.idContexto, p.usuario, 'DERIVACION', `Ruta externa activada: ${c.entidad}.`);
  return ok(ruta, 201);
};

const actualizarRutaExterna = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const ruta = s.rutasExternas.find((r) => r.idRuta === p.parametros[0]);
  if (!ruta) return errorMock(404, 'RUTA_NO_ENCONTRADA', 'No encontramos la ruta solicitada.');
  const c = p.cuerpo ?? {};
  if (c.version !== ruta.version) {
    return errorMock(409, 'CONFLICTO_VERSION', 'La ruta cambió desde que la abrió.', { versionActual: ruta.version });
  }
  if (!['ACTIVADA', 'EN_SEGUIMIENTO', 'CERRADA'].includes(c.estado)) return validacion({ estado: 'El estado no es válido.' });
  if (c.estado === 'CERRADA' && !minimoNota(c.resultado, 3)) {
    return validacion({ resultado: 'Registre el resultado para cerrar la ruta.' });
  }
  const actualizada: RutaExternaDto = { ...ruta, version: ruta.version + 1, estado: c.estado, resultado: c.resultado ?? ruta.resultado };
  s.rutasExternas = s.rutasExternas.map((r) => (r.idRuta === ruta.idRuta ? actualizada : r));
  const atencion = s.atenciones.get(ruta.idContexto);
  if (atencion) {
    s.atenciones.set(atencion.idAtencion, {
      ...atencion,
      rutasExternas: atencion.rutasExternas.map((r) => (r.idRuta === ruta.idRuta ? actualizada : r))
    });
  }
  s.registrarAuditoria(ruta.tipoContexto, ruta.idContexto, p.usuario, 'ACTUALIZACION', `Ruta ${ruta.entidad}: ${c.estado}.`);
  return ok(actualizada);
};

const listarRutasExternas = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const tipo = p.query.get('tipoContexto');
  const id = p.query.get('idContexto');
  return ok(s.rutasExternas.filter((r) => r.tipoContexto === tipo && r.idContexto === id));
};

// ───────────────────────── bandeja ─────────────────────────

const REMISIONES_CONOCIDAS_YA_TOMADAS = '2000000003';

const listarBandejaAph = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const vista = p.query.get('vista') === 'mias' ? 'mias' : 'remisiones';
  const origen = p.query.get('origen');
  const estado = p.query.get('estado');
  const page = Math.max(0, Number(p.query.get('page') ?? 0));
  const size = Math.min(100, Math.max(1, Number(p.query.get('size') ?? 20)));

  let filas = [...s.atenciones.values()].filter((a) =>
    vista === 'remisiones' ? a.canalIngreso.startsWith('REMISION_') && a.estado === 'PENDIENTE_APH' : a.estado !== 'PENDIENTE_APH'
  );
  if (origen) filas = filas.filter((a) => a.origenRemision === origen);
  if (estado) filas = filas.filter((a) => a.estado === estado);
  filas.sort((a, b) =>
    vista === 'remisiones'
      ? a.fechaCreacion.localeCompare(b.fechaCreacion)
      : b.fechaActualizacion.localeCompare(a.fechaActualizacion)
  );

  const items: BandejaAphItemDto[] = filas.slice(page * size, page * size + size).map((a) => ({
    idAtencion: a.idAtencion,
    version: a.version,
    persona: {
      tipoIdentificacion: a.persona.tipoIdentificacion,
      numeroIdentificacion: a.persona.numeroIdentificacion,
      nombreCompleto: [a.persona.nombres, a.persona.apellidos].filter(Boolean).join(' ') || 'Sin nombre registrado'
    },
    canalIngreso: a.canalIngreso,
    origenRemision: a.origenRemision,
    resumen: a.motivoConsulta,
    fechaRemision: a.fechaCreacion,
    estado: a.estado,
    tomadaPor: a.tomadaPor,
    triaje: a.triaje,
    sla: vista === 'mias' && a.sla ? { ...a.sla, ahoraServidor: s.ahora().toISOString() } : null
  }));
  const pagina: PaginaAlma<BandejaAphItemDto> = { items, page, size, total: filas.length };
  return ok(pagina);
};

const tomarRemision = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const atencion = buscar(s, p.parametros[0]);
  if (esRespuesta(atencion)) return atencion;
  const c = p.cuerpo ?? {};

  // Escenario de concurrencia (Anexo B): otra persona la toma justo antes que usted.
  if (atencion.persona.numeroIdentificacion === REMISIONES_CONOCIDAS_YA_TOMADAS && atencion.estado === 'PENDIENTE_APH') {
    guardarVersion(s, atencion, { estado: 'EN_GESTION_APH', tomadaPor: 'Otro técnico APH (prueba)' });
    return errorMock(409, 'REMISION_YA_TOMADA', 'La remisión ya fue tomada por otro técnico.', { tomadaEn: s.ahora().toISOString() });
  }
  if (atencion.estado !== 'PENDIENTE_APH') {
    return errorMock(409, 'REMISION_YA_TOMADA', 'La remisión ya fue tomada por otro técnico.', { tomadaEn: atencion.fechaActualizacion });
  }
  if (c.version !== atencion.version) {
    return errorMock(409, 'CONFLICTO_VERSION', 'La remisión cambió desde que la abrió.', { versionActual: atencion.version });
  }
  const nueva = guardarVersion(s, atencion, { estado: 'EN_GESTION_APH', tomadaPor: p.usuario });
  s.registrarAuditoria('ATENCION_APH', nueva.idAtencion, p.usuario, 'CAMBIO_ESTADO', 'Remisión tomada por APH.');
  return ok(aVista(nueva));
};

// ───────────────────────── contención post-cierre y auditoría ─────────────────────────

const crearContencion = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const c = p.cuerpo ?? {};
  const atencion = typeof c.idAtencion === 'string' ? s.atenciones.get(c.idAtencion) : undefined;
  const faltantes: Record<string, string> = {};
  if (!atencion) faltantes['idAtencion'] = 'Falta la atención sobre la que se registra la contención.';
  if (!minimoNota(c.nota, 10)) faltantes['nota'] = 'Escriba la nota de contención (mínimo 10 caracteres).';
  if (!c.numeroCaso) faltantes['numeroCaso'] = 'Falta el caso cerrado.';
  if (Object.keys(faltantes).length) return validacion(faltantes);

  const persona = s.buscarPersona(atencion!.persona.tipoIdentificacion, atencion!.persona.numeroIdentificacion);
  if (persona?.casoCerrado?.numeroCaso !== c.numeroCaso) {
    return errorMock(422, 'PERSONA_SIN_CASO_CERRADO', 'La persona no tiene ese caso cerrado.');
  }
  const ahora = s.ahora().toISOString();
  const contencion: ContencionPostCierreDto = {
    idContencion: s.siguienteId('CON'),
    idAtencion: c.idAtencion,
    numeroCaso: c.numeroCaso,
    tipoSeguimiento: 'POST_CIERRE',
    nota: c.nota.trim(),
    fechaRegistro: ahora,
    autor: p.usuario
  };
  s.contenciones.push(contencion);
  s.atenciones.set(atencion!.idAtencion, {
    ...atencion!,
    notas: [
      { idNota: contencion.idContencion, tipoOrigen: 'POST_CIERRE', contenido: contencion.nota, fechaRegistro: ahora, autor: p.usuario },
      ...atencion!.notas
    ]
  });
  s.registrarAuditoria('ATENCION_APH', c.idAtencion, p.usuario, 'NOTA', `Contención post-cierre sobre ${c.numeroCaso}. No reabre el caso.`);
  return ok(contencion, 201);
};

const listarAuditoria = (p: PeticionMock, s: AlmaMockStore): RespuestaMock => {
  const tipo = p.query.get('tipoContexto');
  const id = p.query.get('idContexto');
  if (!tipo || !id) return validacion({ idContexto: 'Falta el contexto a consultar.' });
  return ok(s.auditoria.get(`${tipo}:${id}`) ?? []);
};

/** Tabla de rutas de APH. Jonathan agrega la suya en `psicologia.handlers.ts`. */
export const RUTAS_MOCK_APH: readonly RutaMock[] = [
  { metodo: 'GET', patron: /^\/catalogos\/([\w-]+)$/, grupo: 'catalogos', manejador: obtenerCatalogo },
  { metodo: 'GET', patron: /^\/personas\/consulta$/, grupo: 'personas', manejador: consultarPersona },
  { metodo: 'POST', patron: /^\/atenciones-aph$/, grupo: 'atencionesAph', manejador: crearAtencion },
  { metodo: 'GET', patron: /^\/atenciones-aph\/([\w-]+)$/, grupo: 'atencionesAph', manejador: obtenerAtencion },
  { metodo: 'PATCH', patron: /^\/atenciones-aph\/([\w-]+)$/, grupo: 'atencionesAph', manejador: actualizarAtencion },
  { metodo: 'PUT', patron: /^\/atenciones-aph\/([\w-]+)\/triaje$/, grupo: 'atencionesAph', manejador: registrarTriaje },
  { metodo: 'POST', patron: /^\/atenciones-aph\/([\w-]+)\/derivaciones\/psicologia$/, grupo: 'atencionesAph', manejador: derivarAPsicologia },
  { metodo: 'POST', patron: /^\/atenciones-aph\/([\w-]+)\/cierre$/, grupo: 'atencionesAph', manejador: cerrarAtencion },
  { metodo: 'POST', patron: /^\/derivaciones\/internas$/, grupo: 'derivaciones', manejador: crearDerivacionInterna },
  { metodo: 'GET', patron: /^\/derivaciones\/internas$/, grupo: 'derivaciones', manejador: listarDerivacionesInternas },
  { metodo: 'POST', patron: /^\/rutas-externas$/, grupo: 'derivaciones', manejador: crearRutaExterna },
  { metodo: 'GET', patron: /^\/rutas-externas$/, grupo: 'derivaciones', manejador: listarRutasExternas },
  { metodo: 'PATCH', patron: /^\/rutas-externas\/([\w-]+)$/, grupo: 'derivaciones', manejador: actualizarRutaExterna },
  { metodo: 'GET', patron: /^\/bandeja\/aph$/, grupo: 'bandejaAph', manejador: listarBandejaAph },
  { metodo: 'POST', patron: /^\/bandeja\/aph\/([\w-]+)\/tomar$/, grupo: 'bandejaAph', manejador: tomarRemision },
  { metodo: 'POST', patron: /^\/contenciones-post-cierre$/, grupo: 'contenciones', manejador: crearContencion },
  { metodo: 'GET', patron: /^\/auditoria$/, grupo: 'auditoria', manejador: listarAuditoria }
];
