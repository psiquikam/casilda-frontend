import { AtencionAphDto } from '../shared/types/alma-dto';
import { CanalIngreso, EstadoAtencion, ItemCatalogo, OrigenRemision, Triaje } from '../shared/types/alma.types';

/**
 * Seed compartido del módulo (Anexo B del plan): personas **ficticias** que cubren los
 * escenarios clave. Ambos submódulos prueban con las mismas cédulas. Nunca datos reales: el
 * módulo maneja información sensible. Las cédulas `1000000001…10` son las del Anexo B; las
 * `2000000001…03` son remisiones de prueba que solo usa la bandeja de APH.
 */
export interface PersonaSemilla {
  idPersona: number;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombres: string;
  apellidos: string;
  /** Escenario F2: hay seguimiento psicológico activo (días hasta el próximo control). */
  seguimientoActivoEnDias?: number;
  casoCerrado?: { numeroCaso: string; diasDesdeCierre: number };
}

export const PERSONAS_SEMILLA: PersonaSemilla[] = [
  { idPersona: 41, tipoIdentificacion: 'CC', numeroIdentificacion: '1000000002', nombres: 'Persona', apellidos: 'De Prueba Dos', seguimientoActivoEnDias: 3 },
  { idPersona: 42, tipoIdentificacion: 'CC', numeroIdentificacion: '1000000003', nombres: 'Persona', apellidos: 'De Prueba Tres', casoCerrado: { numeroCaso: 'CAS-2026-000003', diasDesdeCierre: 20 } },
  { idPersona: 43, tipoIdentificacion: 'CC', numeroIdentificacion: '1000000004', nombres: 'Persona', apellidos: 'De Prueba Cuatro' },
  { idPersona: 44, tipoIdentificacion: 'CC', numeroIdentificacion: '1000000005', nombres: 'Persona', apellidos: 'De Prueba Cinco' },
  { idPersona: 45, tipoIdentificacion: 'CC', numeroIdentificacion: '1000000006', nombres: 'Persona', apellidos: 'De Prueba Seis' },
  { idPersona: 46, tipoIdentificacion: 'CC', numeroIdentificacion: '1000000007', nombres: 'Persona', apellidos: 'De Prueba Siete' },
  { idPersona: 47, tipoIdentificacion: 'CC', numeroIdentificacion: '1000000008', nombres: 'Persona', apellidos: 'De Prueba Ocho', seguimientoActivoEnDias: 1 },
  { idPersona: 48, tipoIdentificacion: 'CC', numeroIdentificacion: '1000000009', nombres: 'Persona', apellidos: 'De Prueba Nueve' },
  { idPersona: 49, tipoIdentificacion: 'CC', numeroIdentificacion: '1000000010', nombres: 'Persona', apellidos: 'De Prueba Diez' }
];

const HORA = 3_600_000;

interface ParametrosAtencion {
  numero: number;
  documento: string;
  nombres: string;
  apellidos: string;
  estado: EstadoAtencion;
  canal?: CanalIngreso;
  origen?: OrigenRemision | null;
  triaje?: Triaje | null;
  horasDesdeDerivacion?: number;
  horasDesdeCreacion?: number;
  tomadaPor?: string | null;
  gestionSimultanea?: boolean;
  motivo?: string;
  numeroCaso?: string | null;
}

function atencion(ahora: Date, p: ParametrosAtencion): AtencionAphDto {
  const creada = new Date(ahora.getTime() - (p.horasDesdeCreacion ?? p.horasDesdeDerivacion ?? 2) * HORA).toISOString();
  const derivada =
    p.horasDesdeDerivacion !== undefined
      ? new Date(ahora.getTime() - p.horasDesdeDerivacion * HORA)
      : null;
  const horasLimite = p.triaje === 'ALTO' ? 12 : p.triaje === 'MEDIO' ? 24 : 48;
  return {
    idAtencion: `ALMA-${ahora.getFullYear()}-${String(p.numero).padStart(6, '0')}`,
    version: 1,
    estado: p.estado,
    canalIngreso: p.canal ?? 'LLAMADA',
    origenRemision: p.origen ?? null,
    persona: {
      tipoIdentificacion: 'CC',
      numeroIdentificacion: p.documento,
      nombres: p.nombres,
      apellidos: p.apellidos,
      telefonoPrincipal: null,
      correoPersonal: null,
      ciudad: 'Medellín',
      estrato: null
    },
    solicitante: null,
    motivoConsulta: p.motivo ?? 'Motivo de consulta de prueba (dato ficticio).',
    notaAph: 'Nota de valoración APH de prueba (dato ficticio).',
    triaje: p.triaje ?? null,
    omisionTriaje: null,
    aceptaPsicologia: derivada ? true : null,
    consentimiento: derivada
      ? { otorgado: true, medio: 'VERBAL', fechaRegistro: derivada.toISOString(), versionTexto: 'v0-provisional' }
      : null,
    fechaDerivacion: derivada?.toISOString() ?? null,
    sla: derivada
      ? {
          horasLimite,
          venceEn: new Date(derivada.getTime() + horasLimite * HORA).toISOString(),
          ahoraServidor: ahora.toISOString()
        }
      : null,
    tomadaPor: p.tomadaPor ?? null,
    cierre: p.estado === 'CERRADO' ? { motivo: 'NO_ACEPTA_PSICOLOGIA', observacion: null, fecha: creada } : null,
    numeroCaso: p.numeroCaso ?? null,
    gestionSimultanea: p.gestionSimultanea ?? false,
    notas: [
      {
        idNota: `NOTA-${p.numero}`,
        tipoOrigen: 'APH',
        contenido: 'Contención emocional brindada y triaje registrado (nota de prueba).',
        fechaRegistro: creada,
        autor: 'Técnico APH (prueba)'
      }
    ],
    derivaciones: [],
    rutasExternas: [],
    fechaCreacion: creada,
    fechaActualizacion: creada
  };
}

/** Atenciones iniciales. El consecutivo de las nuevas arranca después de la más alta. */
export function crearAtencionesSemilla(ahora: Date): AtencionAphDto[] {
  return [
    // CC 1000000004 — varias atenciones APH sin caso (no aceptó Psicología).
    atencion(ahora, { numero: 1, documento: '1000000004', nombres: 'Persona', apellidos: 'De Prueba Cuatro', estado: 'CERRADO', horasDesdeCreacion: 24 * 20 }),
    atencion(ahora, { numero: 2, documento: '1000000004', nombres: 'Persona', apellidos: 'De Prueba Cuatro', estado: 'CERRADO', canal: 'WHATSAPP', horasDesdeCreacion: 24 * 6 }),
    // CC 1000000005 — SLA vencido (rojo): triaje ALTO derivado hace 30 h.
    atencion(ahora, { numero: 3, documento: '1000000005', nombres: 'Persona', apellidos: 'De Prueba Cinco', estado: 'PENDIENTE_PSICOLOGIA', triaje: 'ALTO', horasDesdeDerivacion: 30, tomadaPor: 'Técnico APH (prueba)' }),
    // CC 1000000006 / 07 — novedades con intentos (los registra Psicología).
    atencion(ahora, { numero: 4, documento: '1000000006', nombres: 'Persona', apellidos: 'De Prueba Seis', estado: 'PENDIENTE_PSICOLOGIA', triaje: 'MEDIO', horasDesdeDerivacion: 20, tomadaPor: 'Técnico APH (prueba)' }),
    atencion(ahora, { numero: 5, documento: '1000000007', nombres: 'Persona', apellidos: 'De Prueba Siete', estado: 'PENDIENTE_PSICOLOGIA', triaje: 'BAJO', horasDesdeDerivacion: 40, tomadaPor: 'Técnico APH (prueba)' }),
    // CC 1000000009 — novedad tomada por otro profesional (409).
    atencion(ahora, { numero: 6, documento: '1000000009', nombres: 'Persona', apellidos: 'De Prueba Nueve', estado: 'PENDIENTE_PSICOLOGIA', triaje: 'ALTO', horasDesdeDerivacion: 3, tomadaPor: 'Técnico APH (prueba)' }),
    // CC 1000000010 — gestión simultánea con Equipo de Atención.
    atencion(ahora, { numero: 7, documento: '1000000010', nombres: 'Persona', apellidos: 'De Prueba Diez', estado: 'EN_SEGUIMIENTO', triaje: 'MEDIO', horasDesdeDerivacion: 90, numeroCaso: 'CAS-2026-000010', gestionSimultanea: true }),
    // Remisiones recibidas (bandeja APH).
    atencion(ahora, { numero: 8, documento: '2000000001', nombres: 'Persona', apellidos: 'Remitida Uno', estado: 'PENDIENTE_APH', canal: 'REMISION_EA', origen: 'EA', horasDesdeCreacion: 5, motivo: 'Remitida por el Equipo de Atención: requiere soporte telefónico (dato ficticio).' }),
    atencion(ahora, { numero: 9, documento: '2000000002', nombres: 'Persona', apellidos: 'Remitida Dos', estado: 'PENDIENTE_APH', canal: 'REMISION_SPYB', origen: 'SPYB', horasDesdeCreacion: 1, motivo: 'Situación detectada en ronda; se requiere contención (dato ficticio).' }),
    atencion(ahora, { numero: 10, documento: '2000000003', nombres: 'Persona', apellidos: 'Remitida Tres', estado: 'PENDIENTE_APH', canal: 'REMISION_UAD', origen: 'UAD', horasDesdeCreacion: 26, motivo: 'Remisión informativa de la UAD (dato ficticio).' })
  ];
}

function items(...pares: [string, string][]): ItemCatalogo[] {
  return pares.map(([codigo, etiqueta]) => ({ codigo, etiqueta, activo: true }));
}

/**
 * Catálogos placeholder (Q6): los oficiales no se han entregado. Sustituir el contenido por los
 * del Backend es transparente para los componentes, que solo conocen `codigo` y `etiqueta`.
 */
export const CATALOGOS_SEMILLA: Record<string, ItemCatalogo[]> = {
  'tipos-identificacion': items(
    ['CC', 'Cédula de ciudadanía'],
    ['TI', 'Tarjeta de identidad'],
    ['CE', 'Cédula de extranjería'],
    ['PPT', 'Permiso por protección temporal'],
    ['PAS', 'Pasaporte']
  ),
  estratos: items(['1', 'Estrato 1'], ['2', 'Estrato 2'], ['3', 'Estrato 3'], ['4', 'Estrato 4'], ['5', 'Estrato 5'], ['6', 'Estrato 6']),
  'destinos-internos': items(
    ['SPYB', 'Seguridad a Personas y Bienes (Central de Monitoreo)'],
    ['EA', 'Equipo de Atención'],
    ['DUPLA_PSICOJURIDICA', 'Dupla Psicojurídica'],
    ['MASCULINIDADES', 'Programa de Masculinidades'],
    ['UAD', 'Unidad de Asuntos Disciplinarios']
  ),
  'rutas-externas': items(
    ['LINEA_123', 'Línea 123'],
    ['CODIGO_FUCSIA', 'Código Fucsia / Sector Salud'],
    ['FISCALIA', 'Fiscalía General de la Nación'],
    ['COMISARIA_FAMILIA', 'Comisarías de Familia'],
    ['POLICIA_NACIONAL', 'Policía Nacional'],
    ['ICBF', 'ICBF'],
    ['CAIVAS', 'CAIVAS']
  ),
  'motivos-cierre-aph': items(
    ['NO_ACEPTA_PSICOLOGIA', 'La persona no desea atención psicológica'],
    ['ORIENTACION_BRINDADA', 'Se brindó orientación y no requiere más gestión'],
    ['REMITIDA_RUTA_EXTERNA', 'Se remitió a una ruta externa y quedó resuelta'],
    ['SIN_RESPUESTA', 'No fue posible continuar la comunicación']
  ),
  'resultados-ruta-externa': items(
    ['ATENDIDA', 'La entidad atendió el caso'],
    ['SIN_RESPUESTA', 'Sin respuesta de la entidad'],
    ['NO_ACEPTA', 'La persona decidió no continuar']
  ),
  'parentescos-solicitante': items(
    ['MADRE_PADRE', 'Madre o padre'],
    ['PAREJA', 'Pareja'],
    ['AMISTAD', 'Amistad'],
    ['COMPANERIA_ACADEMICA', 'Compañía de estudio o trabajo'],
    ['DOCENTE', 'Docente o jefatura'],
    ['OTRO', 'Otro']
  ),
  'textos-consentimiento': items([
    'v0-provisional',
    'Texto provisional, pendiente de aprobación oficial. Su decisión de recibir atención y de que compartamos su información con otras dependencias es voluntaria. Puede cambiarla en cualquier momento. La información se usa solo para acompañarla y se maneja con confidencialidad.'
  ])
};
