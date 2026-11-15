import {
  CasoAsociado,
  EstadoNoticia,
  EvidenciaMetadato,
  Hechos,
  MaestroUad,
  OrigenNoticia,
  PersonaAfectada,
  Reportante,
  RevisionConcurrente,
  SolicitudInformacionVigente,
  TipoNoticia,
  VinculacionInvestigado,
  EquipoUad,
  EstadoGestionUad,
  FaseUad
} from '../../contratos/uad-api.types';

/**
 * Datos **100 % sintéticos** del adaptador mock UAD. No reutilizan nombres, documentos ni teléfonos de
 * los prototipos ni de personas reales: nombres «Persona ficticia», documentos y teléfonos con ceros,
 * correos en `example.org` (dominio reservado, RFC 2606).
 *
 * Escenarios (prompt §9): NDI docente → Equipo 3; NDI estudiante → Equipo 4; NDI «No sé» y
 * «No tiene vínculo» → ambos; NDA → ambos; caso CASILDA existente (remitida por otro actor); sin caso;
 * subsanación vencida (no se cierra sola); inhibitoria; remisión; revisión concurrente; admitida.
 */

export interface NoticiaMock {
  noticiaId: string;
  consecutivo: string;
  tipo: TipoNoticia;
  casoId: string | null;
  expedienteUad: string | null;
  casoUadId: string | null;
  origen: OrigenNoticia;
  fechaRecepcion: string;
  estado: EstadoNoticia;
  version: number;
  vinculacionDeclarada: VinculacionInvestigado | null;
  vinculacionClasificada: VinculacionInvestigado | null;
  reportante: Reportante | null;
  personaAfectada: PersonaAfectada | null;
  hechos: Hechos;
  evidencias: EvidenciaMetadato[];
  solicitudInformacion: SolicitudInformacionVigente | null;
  revisionConcurrente: RevisionConcurrente | null;
  /** Contacto para la fila expandible (UAD-NOT-11). En NDA, siempre `null`. */
  telefono: string | null;
  correo: string | null;
  /** Clave sintética de la persona: el «servidor» la usa para encontrar casos asociados. Nunca sale al cliente. */
  personaClave: string | null;
}

export interface CasoUadMock {
  casoUadId: string;
  casoId: string;
  expedienteUad: string | null;
  consecutivosNoticia: string[];
  victimaNombre: string | null;
  vinculacionInvestigado: VinculacionInvestigado;
  fechaAdmision: string;
  faseActual: FaseUad;
  equipoResponsable: EquipoUad;
  estadoGestion: EstadoGestionUad;
  motivoFinGestion: 'REMITIDA_POR_COMPETENCIA' | null;
  fechaUltimoTraslado: string | null;
  /** Pruebas del caso (UAD-PRU-01): se conservan en cada cambio de equipo o fase. */
  evidencias: EvidenciaMetadato[];
  version: number;
}

/** Evento sembrado del historial de un caso (el store lo completa con id y campos vacíos). */
export interface EventoCasoSemilla {
  readonly tipo: 'ACTUACION' | 'TRASLADO_FASE' | 'CASO_CREADO';
  readonly descripcion: string;
  readonly fecha: string;
  readonly equipo: EquipoUad;
  readonly fase: FaseUad;
  readonly observaciones?: string;
}

function reportanteFicticio(n: string, tipoSolicitud: 'DIRECTA' | 'INDIRECTA'): Reportante {
  return {
    tipoSolicitud,
    primerNombre: 'Persona',
    segundoNombre: null,
    primerApellido: 'Ficticia',
    segundoApellido: n,
    tipoDocumento: 'Cédula de ciudadanía',
    numeroDocumento: `0000000${n}`,
    celular: `300 000 0${n}`,
    correoInstitucional: `reportante.${n}@example.org`,
    correoPersonal: null
  };
}

function evidencia(id: string, nombre: string, tipoMime: string, fecha: string): EvidenciaMetadato {
  return { evidenciaId: id, nombreArchivo: nombre, tipoMime, tamanoBytes: 120_000, fechaCarga: fecha };
}

const RELATO = 'Relato ficticio de prueba. Describe de forma general una situación en un espacio académico, sin datos reales.';

function base(parcial: Partial<NoticiaMock> & Pick<NoticiaMock, 'noticiaId' | 'consecutivo' | 'tipo' | 'fechaRecepcion' | 'estado'>): NoticiaMock {
  return {
    casoId: null,
    expedienteUad: null,
    casoUadId: null,
    origen: { tipo: parcial.tipo === 'NDA' ? 'FORMULARIO_ANONIMO' : 'FORMULARIO_WEB_CASILDA', actorRemitente: null },
    version: 1,
    vinculacionDeclarada: null,
    vinculacionClasificada: null,
    reportante: null,
    personaAfectada: null,
    hechos: { descripcion: RELATO, lugarOcurrencia: 'Ciudad Universitaria (ubicación ficticia)', presuntoResponsable: 'Descripción ficticia del presunto responsable' },
    evidencias: [],
    solicitudInformacion: null,
    revisionConcurrente: null,
    telefono: null,
    correo: null,
    personaClave: null,
    ...parcial
  };
}

export function sembrarNoticias(): NoticiaMock[] {
  const noticias: NoticiaMock[] = [
    base({
      noticiaId: 'mock-ndi-141',
      consecutivo: 'NDI-2026-000141',
      tipo: 'NDI',
      fechaRecepcion: '2026-11-02T15:24:00Z',
      estado: 'EN_EVALUACION_PRELIMINAR',
      version: 2,
      vinculacionDeclarada: 'DOCENTE_VINCULADO',
      reportante: reportanteFicticio('141', 'INDIRECTA'),
      personaAfectada: { nombreCompleto: 'Persona Afectada Ficticia 141', vinculoUniversidad: 'Estudiante' },
      evidencias: [
        evidencia('mock-ev-1411', 'relato_ficticio.pdf', 'application/pdf', '2026-11-02T15:28:00Z'),
        evidencia('mock-ev-1412', 'captura_ficticia.png', 'image/png', '2026-11-02T15:29:00Z')
      ],
      telefono: '300 000 0141',
      correo: 'reportante.141@example.org',
      personaClave: 'P-141'
    }),
    base({
      noticiaId: 'mock-ndi-142',
      consecutivo: 'NDI-2026-000142',
      tipo: 'NDI',
      fechaRecepcion: '2026-11-03T13:05:00Z',
      estado: 'RECIBIDA',
      vinculacionDeclarada: 'ESTUDIANTE_PREGRADO',
      reportante: reportanteFicticio('142', 'DIRECTA'),
      telefono: '300 000 0142',
      correo: 'reportante.142@example.org',
      personaClave: 'P-142'
    }),
    base({
      noticiaId: 'mock-ndi-143',
      consecutivo: 'NDI-2026-000143',
      tipo: 'NDI',
      fechaRecepcion: '2026-11-04T16:40:00Z',
      estado: 'PENDIENTE_CLASIFICACION',
      vinculacionDeclarada: 'NO_SE',
      reportante: reportanteFicticio('143', 'DIRECTA'),
      telefono: '300 000 0143',
      correo: 'reportante.143@example.org',
      personaClave: 'P-143'
    }),
    base({
      noticiaId: 'mock-ndi-144',
      consecutivo: 'NDI-2026-000144',
      tipo: 'NDI',
      // UAD-NOT-03: remitida por otro actor; conserva el ID de caso Casilda existente.
      origen: { tipo: 'REMISION_ACTOR', actorRemitente: 'EQUIPO_ATENCION' },
      casoId: 'CAS-2026-000610',
      fechaRecepcion: '2026-11-05T14:10:00Z',
      estado: 'EN_EVALUACION_PRELIMINAR',
      vinculacionDeclarada: 'ADMINISTRATIVO',
      reportante: reportanteFicticio('144', 'INDIRECTA'),
      personaAfectada: { nombreCompleto: 'Persona Afectada Ficticia 144', vinculoUniversidad: 'Personal administrativo' },
      telefono: '300 000 0144',
      correo: 'reportante.144@example.org',
      personaClave: 'P-144'
    }),
    base({
      noticiaId: 'mock-ndi-145',
      consecutivo: 'NDI-2026-000145',
      tipo: 'NDI',
      fechaRecepcion: '2026-10-20T19:00:00Z',
      estado: 'PENDIENTE_SUBSANACION',
      version: 3,
      vinculacionDeclarada: 'ESTUDIANTE_POSGRADO',
      reportante: reportanteFicticio('145', 'DIRECTA'),
      // Plazo vencido a propósito: la noticia NO se cierra sola (UAD-EVA-05).
      solicitudInformacion: {
        solicitudId: 'mock-sol-145',
        tipoSolicitudCodigo: 'ACLARACION_HECHOS',
        informacionRequerida: 'Texto ficticio: precise fechas y lugar de los hechos.',
        fechaSolicitud: '2026-10-22T15:00:00Z',
        fechaLimite: '2026-10-30',
        vencida: true,
        respondida: false
      },
      telefono: '300 000 0145',
      correo: 'reportante.145@example.org',
      personaClave: 'P-145'
    }),
    base({
      noticiaId: 'mock-ndi-146',
      consecutivo: 'NDI-2026-000146',
      tipo: 'NDI',
      fechaRecepcion: '2026-11-06T12:30:00Z',
      estado: 'EN_EVALUACION_PRELIMINAR',
      version: 4,
      vinculacionDeclarada: 'DIRECTIVO',
      reportante: reportanteFicticio('146', 'DIRECTA'),
      revisionConcurrente: { desde: '2026-11-14T13:00:00Z', equipo: 'EQUIPO_3' },
      telefono: '300 000 0146',
      correo: 'reportante.146@example.org',
      personaClave: 'P-146'
    }),
    base({
      noticiaId: 'mock-ndi-147',
      consecutivo: 'NDI-2026-000147',
      tipo: 'NDI',
      fechaRecepcion: '2026-11-07T21:15:00Z',
      estado: 'RECIBIDA',
      vinculacionDeclarada: 'NO_TIENE_VINCULO',
      reportante: reportanteFicticio('147', 'DIRECTA'),
      telefono: '300 000 0147',
      correo: 'reportante.147@example.org',
      personaClave: 'P-147'
    }),
    base({
      noticiaId: 'mock-ndi-140',
      consecutivo: 'NDI-2026-000140',
      tipo: 'NDI',
      fechaRecepcion: '2026-10-15T14:00:00Z',
      estado: 'INHIBITORIA',
      version: 5,
      vinculacionDeclarada: 'TRABAJADOR_OFICIAL',
      reportante: reportanteFicticio('140', 'DIRECTA'),
      telefono: '300 000 0140',
      correo: 'reportante.140@example.org',
      personaClave: 'P-140'
    }),
    base({
      noticiaId: 'mock-ndi-139',
      consecutivo: 'NDI-2026-000139',
      tipo: 'NDI',
      fechaRecepcion: '2026-10-08T15:45:00Z',
      estado: 'PROCEDE_TRAMITE',
      version: 4,
      casoId: 'CAS-2026-000248',
      casoUadId: 'mock-cuad-139',
      vinculacionDeclarada: 'ESTUDIANTE_PREGRADO',
      reportante: reportanteFicticio('139', 'DIRECTA'),
      telefono: '300 000 0139',
      correo: 'reportante.139@example.org',
      personaClave: 'P-139'
    }),
    base({
      noticiaId: 'mock-nda-021',
      consecutivo: 'NDA-2026-000021',
      tipo: 'NDA',
      fechaRecepcion: '2026-11-01T02:10:00Z',
      estado: 'RECIBIDA',
      vinculacionDeclarada: 'DOCENTE_CATEDRA'
    }),
    base({
      noticiaId: 'mock-nda-022',
      consecutivo: 'NDA-2026-000022',
      tipo: 'NDA',
      fechaRecepcion: '2026-11-08T23:50:00Z',
      estado: 'EN_EVALUACION_PRELIMINAR',
      vinculacionDeclarada: 'NO_SE'
    }),
    base({
      noticiaId: 'mock-nda-020',
      consecutivo: 'NDA-2026-000020',
      tipo: 'NDA',
      fechaRecepcion: '2026-10-25T10:00:00Z',
      estado: 'REMITIDA_POR_COMPETENCIA',
      version: 3,
      vinculacionDeclarada: 'ESTUDIANTE_POSGRADO'
    })
  ];

  // Relleno para la paginación: noticias recibidas de ambos estamentos.
  for (let i = 0; i < 12; i++) {
    const n = String(120 + i);
    const estudiante = i % 2 === 0;
    noticias.push(
      base({
        noticiaId: `mock-ndi-${n}`,
        consecutivo: `NDI-2026-000${n}`,
        tipo: 'NDI',
        fechaRecepcion: `2026-09-${String(10 + i).padStart(2, '0')}T15:00:00Z`,
        estado: 'RECIBIDA',
        vinculacionDeclarada: estudiante ? 'ESTUDIANTE_PREGRADO' : 'DOCENTE_OCASIONAL',
        reportante: reportanteFicticio(n, 'DIRECTA'),
        telefono: `300 000 0${n}`,
        correo: `reportante.${n}@example.org`,
        personaClave: `P-${n}`
      })
    );
  }
  return noticias;
}

/** Casos de la persona en otros actores (lo que el servidor encontraría). Datos mínimos (UAD-EVA-07). */
export function sembrarCasosPorPersona(): Map<string, CasoAsociado[]> {
  return new Map<string, CasoAsociado[]>([
    [
      'P-141',
      [
        { casoId: 'CAS-2026-000500', actor: 'EQUIPO_ATENCION', fechaApertura: '2026-10-01', estadoGestionActor: 'ACTIVO' },
        { casoId: 'CAS-2026-000377', actor: 'LINEA_ALMA', fechaApertura: '2026-06-12', estadoGestionActor: 'CERRADO' }
      ]
    ],
    ['P-144', [{ casoId: 'CAS-2026-000610', actor: 'EQUIPO_ATENCION', fechaApertura: '2026-11-04', estadoGestionActor: 'ACTIVO' }]]
  ]);
}

function caso(
  parcial: Partial<CasoUadMock> & Pick<CasoUadMock, 'casoUadId' | 'casoId' | 'vinculacionInvestigado' | 'faseActual' | 'equipoResponsable'>
): CasoUadMock {
  return {
    expedienteUad: null,
    consecutivosNoticia: [],
    victimaNombre: null,
    fechaAdmision: '2026-10-01T14:00:00Z',
    estadoGestion: 'ACTIVA',
    motivoFinGestion: null,
    fechaUltimoTraslado: null,
    evidencias: [],
    version: 1,
    ...parcial
  };
}

/**
 * Casos sembrados (prompt §9, Entrega 2): una combinación por equipo y fase, más una gestión finalizada.
 * - `mock-cuad-139`: estudiante, instrucción, Equipo 4.
 * - `mock-cuad-201`: docente, instrucción, Equipo 3, sin expediente UAD (se registra después).
 * - `mock-cuad-202`: administrativo instruido por Equipo 3, hoy en decisión con Equipo 4.
 * - `mock-cuad-203`: estudiante instruido por Equipo 4, hoy en decisión con Equipo 3.
 * - `mock-cuad-204`: remitido por competencia: gestión UAD finalizada, fuera de la bandeja activa.
 */
export function sembrarCasosUad(): CasoUadMock[] {
  return [
    caso({
      casoUadId: 'mock-cuad-139',
      casoId: 'CAS-2026-000248',
      expedienteUad: 'EXP-FICTICIO-0041',
      consecutivosNoticia: ['NDI-2026-000139'],
      victimaNombre: 'Persona Afectada Ficticia 139',
      vinculacionInvestigado: 'ESTUDIANTE_PREGRADO',
      fechaAdmision: '2026-10-09T14:00:00Z',
      faseActual: 'INSTRUCCION',
      equipoResponsable: 'EQUIPO_4',
      evidencias: [evidencia('mock-ev-1391', 'denuncia_ficticia.pdf', 'application/pdf', '2026-10-08T15:50:00Z')]
    }),
    caso({
      casoUadId: 'mock-cuad-201',
      casoId: 'CAS-2026-000301',
      consecutivosNoticia: ['NDI-2026-000101'],
      victimaNombre: 'Persona Afectada Ficticia 201',
      vinculacionInvestigado: 'DOCENTE_VINCULADO',
      fechaAdmision: '2026-10-06T16:00:00Z',
      faseActual: 'INSTRUCCION',
      equipoResponsable: 'EQUIPO_3',
      version: 3,
      evidencias: [
        evidencia('mock-ev-2011', 'relato_inicial_ficticio.pdf', 'application/pdf', '2026-10-05T14:00:00Z'),
        evidencia('mock-ev-2012', 'captura_chat_ficticia.png', 'image/png', '2026-10-09T10:20:00Z')
      ]
    }),
    caso({
      casoUadId: 'mock-cuad-202',
      casoId: 'CAS-2026-000302',
      expedienteUad: 'EXP-FICTICIO-0029',
      consecutivosNoticia: ['NDI-2026-000102'],
      victimaNombre: 'Persona Afectada Ficticia 202',
      vinculacionInvestigado: 'ADMINISTRATIVO',
      fechaAdmision: '2026-09-15T15:00:00Z',
      faseActual: 'DECISION',
      equipoResponsable: 'EQUIPO_4',
      fechaUltimoTraslado: '2026-10-28T19:00:00Z',
      version: 6,
      evidencias: [evidencia('mock-ev-2021', 'testimonio_ficticio.pdf', 'application/pdf', '2026-09-20T13:00:00Z')]
    }),
    caso({
      casoUadId: 'mock-cuad-203',
      casoId: 'CAS-2026-000303',
      consecutivosNoticia: ['NDI-2026-000103'],
      victimaNombre: 'Persona Afectada Ficticia 203',
      vinculacionInvestigado: 'ESTUDIANTE_POSGRADO',
      fechaAdmision: '2026-09-02T15:00:00Z',
      faseActual: 'DECISION',
      equipoResponsable: 'EQUIPO_3',
      fechaUltimoTraslado: '2026-10-20T15:00:00Z',
      version: 5
    }),
    caso({
      casoUadId: 'mock-cuad-204',
      casoId: 'CAS-2026-000304',
      consecutivosNoticia: ['NDI-2026-000104'],
      victimaNombre: 'Persona Afectada Ficticia 204',
      vinculacionInvestigado: 'DIRECTIVO',
      fechaAdmision: '2026-08-20T15:00:00Z',
      faseActual: 'INSTRUCCION',
      equipoResponsable: 'EQUIPO_3',
      estadoGestion: 'FINALIZADA',
      motivoFinGestion: 'REMITIDA_POR_COMPETENCIA',
      version: 4
    })
  ];
}

/** Historial sembrado por caso (append-only; el traslado no borra lo anterior, UAD-HIS-06). */
export function sembrarHistorialCasos(): Map<string, EventoCasoSemilla[]> {
  return new Map<string, EventoCasoSemilla[]>([
    [
      'mock-cuad-201',
      [
        { tipo: 'CASO_CREADO', descripcion: 'Caso admitido para trámite en la UAD.', fecha: '2026-10-06T16:00:00Z', equipo: 'EQUIPO_3', fase: 'INSTRUCCION' },
        { tipo: 'ACTUACION', descripcion: 'Indagación previa.', fecha: '2026-10-10T13:20:00Z', equipo: 'EQUIPO_3', fase: 'INSTRUCCION' }
      ]
    ],
    [
      'mock-cuad-202',
      [
        { tipo: 'CASO_CREADO', descripcion: 'Caso admitido para trámite en la UAD.', fecha: '2026-09-15T15:00:00Z', equipo: 'EQUIPO_3', fase: 'INSTRUCCION' },
        { tipo: 'ACTUACION', descripcion: 'Investigación disciplinaria.', fecha: '2026-09-22T14:00:00Z', equipo: 'EQUIPO_3', fase: 'INSTRUCCION' },
        { tipo: 'ACTUACION', descripcion: 'Práctica de pruebas.', fecha: '2026-10-02T19:45:00Z', equipo: 'EQUIPO_3', fase: 'INSTRUCCION' },
        { tipo: 'ACTUACION', descripcion: 'Pliego de cargos.', fecha: '2026-10-20T14:05:00Z', equipo: 'EQUIPO_3', fase: 'INSTRUCCION' },
        {
          tipo: 'TRASLADO_FASE',
          descripcion: 'Finalizó la etapa de instrucción. El caso pasó de Equipo 3 (instrucción) a Equipo 4 (decisión).',
          fecha: '2026-10-28T19:00:00Z',
          equipo: 'EQUIPO_3',
          fase: 'INSTRUCCION'
        }
      ]
    ],
    [
      'mock-cuad-203',
      [
        { tipo: 'CASO_CREADO', descripcion: 'Caso admitido para trámite en la UAD.', fecha: '2026-09-02T15:00:00Z', equipo: 'EQUIPO_4', fase: 'INSTRUCCION' },
        { tipo: 'ACTUACION', descripcion: 'Averiguaciones preliminares.', fecha: '2026-09-10T15:00:00Z', equipo: 'EQUIPO_4', fase: 'INSTRUCCION' },
        {
          tipo: 'TRASLADO_FASE',
          descripcion: 'Finalizó la etapa de instrucción. El caso pasó de Equipo 4 (instrucción) a Equipo 3 (decisión).',
          fecha: '2026-10-20T15:00:00Z',
          equipo: 'EQUIPO_4',
          fase: 'INSTRUCCION'
        },
        { tipo: 'ACTUACION', descripcion: 'Audiencias.', fecha: '2026-11-04T15:00:00Z', equipo: 'EQUIPO_3', fase: 'DECISION' }
      ]
    ]
  ]);
}

/**
 * Catálogos sintéticos con la forma real de `MaestroDTO`. **PENDIENTE DE VALIDACIÓN**: las causales
 * salen del prototipo (p. 8, «sugeridas»), las entidades del prototipo (p. 9). No son valores aprobados.
 */
export const CATALOGOS_MOCK: Record<string, MaestroUad[]> = {
  'uad-causales-inhibitorio': [
    { id: 1, codigo: 'NO_FALTA_DISCIPLINARIA', nombre: 'Los hechos no constituyen falta disciplinaria' },
    { id: 2, codigo: 'NO_COMPETENCIA_UAD', nombre: 'La situación no es de competencia de la UAD' },
    { id: 3, codigo: 'FALTA_ELEMENTOS_MINIMOS', nombre: 'Faltan elementos mínimos de configuración' },
    { id: 4, codigo: 'PRESCRIPCION', nombre: 'Prescripción de la acción disciplinaria' },
    { id: 5, codigo: 'DUPLICIDAD', nombre: 'Duplicidad de actuación en curso' }
  ],
  'uad-entidades-remision': [
    { id: 1, codigo: 'PROCURADURIA_REGIONAL', nombre: 'Procuraduría Regional de Instrucción (ejemplo)' },
    { id: 2, codigo: 'FISCALIA', nombre: 'Fiscalía General de la Nación (ejemplo)' },
    { id: 3, codigo: 'OTRA_AUTORIDAD', nombre: 'Otra autoridad competente (ejemplo)' }
  ],
  'uad-tipos-solicitud-informacion': [
    { id: 1, codigo: 'ACLARACION_HECHOS', nombre: 'Aclaración o ampliación de información' },
    { id: 2, codigo: 'APORTE_EVIDENCIAS', nombre: 'Aporte de evidencias' },
    { id: 3, codigo: 'VINCULO_PRESUNTO_RESPONSABLE', nombre: 'Precisar vínculo del presunto responsable' }
  ]
};
