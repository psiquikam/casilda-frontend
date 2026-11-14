import { AtencionAphDto } from '../shared/types/alma-dto';
import { CasoDto, IntentoContactoDto, SeguimientoDto } from '../shared/types/alma-psicologia-dto';
import { DecisionRecontacto, ItemCatalogo, protocoloDeIntento } from '../shared/types/alma.types';
import { atencion } from './alma-mock-seed';

/**
 * Seed de **Psicología** (dueño: Jonathan), complementario al del Anexo B que mantiene Hinara en
 * `alma-mock-seed.ts`. Mismas cédulas ficticias, para que ambos submódulos prueben los mismos
 * escenarios; nunca datos reales.
 *
 * Numeración: las atenciones de APH usan `ALMA-…-000001…10`; las de aquí empiezan en `000011`.
 */

const HORA = 3_600_000;
const DIA = 24 * HORA;

/** Estado de gestión de una novedad en Psicología (≈ `atencion_psicologia` del ER, Q2). */
export interface NovedadMock {
  idAtencion: string;
  tomadaPor: string | null;
  tomadaEn: string | null;
  intentos: IntentoContactoDto[];
  /** Decisión tomada sobre el recontacto (`null` mientras esté pendiente). */
  recontactoResuelto: DecisionRecontacto | null;
}

function items(...pares: [string, string][]): ItemCatalogo[] {
  return pares.map(([codigo, etiqueta]) => ({ codigo, etiqueta, activo: true }));
}

/** Catálogos placeholder de Psicología (Q6). Las 15 dimensiones se llaman «Dimensión 1…15» hasta recibir las oficiales. */
export const CATALOGOS_PSICOLOGIA: Record<string, ItemCatalogo[]> = {
  'dimensiones-salud-mental': items(
    ...Array.from({ length: 15 }, (_, i): [string, string] => [`DIM_${String(i + 1).padStart(2, '0')}`, `Dimensión ${i + 1}`])
  ),
  'resultados-intento': items(
    ['NO_CONTESTA', 'No contesta'],
    ['BUZON_DE_VOZ', 'Buzón de voz'],
    ['OCUPADO', 'Línea ocupada'],
    ['APAGADO', 'Teléfono apagado o fuera de servicio'],
    ['NUMERO_ERRADO', 'Número equivocado'],
    ['CONTESTA_OTRA_PERSONA', 'Contesta otra persona'],
    ['PIDE_OTRO_HORARIO', 'Contesta y pide que se le llame en otro momento']
  ),
  'motivos-cierre-psicologia': items(
    ['OBJETIVOS_CUMPLIDOS', 'Se cumplieron los objetivos de la atención'],
    ['PERSONA_NO_DESEA_CONTINUAR', 'La persona decidió no continuar'],
    ['REMITIDA_A_OTRO_SERVICIO', 'Continúa su atención en otro servicio'],
    ['NO_CONTACTO', 'No fue posible el contacto (9 intentos)'],
    ['OTRO', 'Otro motivo (describir en la observación)']
  ),
  'vinculos-agresor': items(
    ['PAREJA', 'Pareja'],
    ['EXPAREJA', 'Expareja'],
    ['FAMILIAR', 'Familiar'],
    ['DOCENTE', 'Docente'],
    ['COMPANERO_ESTUDIO', 'Compañero o compañera de estudio'],
    ['COMPANERO_TRABAJO', 'Compañero o compañera de trabajo'],
    ['DESCONOCIDO', 'Persona desconocida'],
    ['OTRO', 'Otro']
  )
};

/** Atenciones derivadas que solo existen para los escenarios de Psicología. */
export function crearAtencionesSemillaPsicologia(ahora: Date): AtencionAphDto[] {
  return [
    // CC 1000000002 — caso activo (CAS-2026-000002), ya en seguimiento.
    atencion(ahora, { numero: 11, documento: '1000000002', nombres: 'Persona', apellidos: 'De Prueba Dos', estado: 'EN_SEGUIMIENTO', triaje: 'MEDIO', horasDesdeDerivacion: 24 * 6, numeroCaso: 'CAS-2026-000002', tomadaPor: 'Técnico APH (prueba)' }),
    // CC 1000000003 — caso cerrado hace 20 días (CAS-2026-000003).
    atencion(ahora, { numero: 12, documento: '1000000003', nombres: 'Persona', apellidos: 'De Prueba Tres', estado: 'CERRADO', triaje: 'BAJO', horasDesdeDerivacion: 24 * 45, numeroCaso: 'CAS-2026-000003', tomadaPor: 'Técnico APH (prueba)' }),
    // CC 1000000008 — caso con más de 3 seguimientos (CAS-2026-000008).
    atencion(ahora, { numero: 13, documento: '1000000008', nombres: 'Persona', apellidos: 'De Prueba Ocho', estado: 'EN_SEGUIMIENTO', triaje: 'ALTO', horasDesdeDerivacion: 24 * 30, numeroCaso: 'CAS-2026-000008', tomadaPor: 'Técnico APH (prueba)' }),
    // CC 1000000002 — **recontacto**: llamó de nuevo a APH y fue derivada; tiene caso activo (RN-ALMA-06).
    atencion(ahora, { numero: 14, documento: '1000000002', nombres: 'Persona', apellidos: 'De Prueba Dos', estado: 'PENDIENTE_PSICOLOGIA', triaje: 'MEDIO', horasDesdeDerivacion: 2, tomadaPor: 'Técnico APH (prueba)', motivo: 'Vuelve a comunicarse por un episodio reciente (dato ficticio).' })
  ];
}

interface ParametrosCaso {
  numero: number;
  documento: string;
  apellidos: string;
  estado: CasoDto['estado'];
  prioridad: CasoDto['prioridad'];
  triajeAph: CasoDto['triajeAph'];
  diasDesdeApertura: number;
  idAtencion: string;
  seguimientos: number;
  /** Días hasta el próximo control (negativo = ya pasó). `undefined` = sin control programado. */
  proximoControlEnDias?: number;
  cierre?: { motivo: string; diasDesdeCierre: number };
  gestionSimultanea?: boolean;
  correo?: string | null;
}

function seguimientosDe(ahora: Date, p: ParametrosCaso): SeguimientoDto[] {
  return Array.from({ length: p.seguimientos }, (_, i) => {
    const numero = i + 1;
    const fecha = new Date(ahora.getTime() - (p.diasDesdeApertura - 7 * numero) * DIA);
    const ultimo = numero === p.seguimientos;
    const deseaContinuar = !(ultimo && p.cierre);
    return {
      idSeguimiento: `SEG-${p.numero}-${numero}`,
      numeroSeguimiento: numero,
      tipo: 'REGULAR',
      fecha: fecha.toISOString(),
      nota: `Seguimiento ${numero}: la persona refiere avances (nota de prueba, dato ficticio).`,
      deseaContinuar,
      proximoControl: deseaContinuar ? new Date(fecha.getTime() + 7 * DIA).toISOString() : null,
      recordatorio: deseaContinuar
        ? { estado: p.correo ? 'ENVIADO' : 'SIN_CORREO', correo: p.correo ?? null, fechaEnvio: p.correo ? fecha.toISOString() : null }
        : null,
      autor: 'Profesional de prueba'
    };
  });
}

function caso(ahora: Date, p: ParametrosCaso): CasoDto {
  const apertura = new Date(ahora.getTime() - p.diasDesdeApertura * DIA).toISOString();
  const seguimientos = seguimientosDe(ahora, p);
  return {
    numeroCaso: `CAS-${ahora.getFullYear()}-${String(p.numero).padStart(6, '0')}`,
    version: 1,
    estado: p.estado,
    prioridad: p.prioridad,
    persona: {
      tipoIdentificacion: 'CC',
      numeroIdentificacion: p.documento,
      nombres: 'Persona',
      apellidos: p.apellidos,
      telefonoPrincipal: '3000000000',
      correoPersonal: p.correo ?? null,
      ciudad: 'Medellín',
      estrato: 3
    },
    fechaApertura: apertura,
    profesional: 'Profesional de prueba',
    triajeAph: p.triajeAph,
    valoracionRiesgo: { nivel: p.prioridad === 'ALTA' ? 'ALTO' : p.prioridad === 'MEDIA' ? 'MEDIO' : 'BAJO', descripcion: 'Valoración clínica de prueba (dato ficticio).' },
    consentimiento: { otorgado: true, medio: 'VERBAL', fechaRegistro: apertura, versionTexto: 'v0-provisional' },
    dimensiones: ['DIM_01', 'DIM_04'],
    presuntoAgresor: null,
    acuerdos: 'Acuerdos de prueba: la persona se compromete a asistir a los controles (dato ficticio).',
    atenciones: [
      { idAtencion: p.idAtencion, fechaCreacion: apertura, canalIngreso: 'LLAMADA', triaje: p.triajeAph, estado: p.cierre ? 'CERRADO' : 'EN_SEGUIMIENTO', motivoConsulta: 'Motivo de consulta de prueba (dato ficticio).' }
    ],
    numeroSeguimientos: p.seguimientos,
    proximoControl: p.proximoControlEnDias === undefined ? null : new Date(ahora.getTime() + p.proximoControlEnDias * DIA).toISOString(),
    seguimientos,
    notas: [
      {
        idNota: `NOTA-PSICO-${p.numero}`,
        tipoOrigen: 'PSICO',
        contenido: 'Primer contacto efectivo: se realizó valoración y se acordó el plan de seguimiento (nota de prueba).',
        fechaRegistro: apertura,
        autor: 'Profesional de prueba'
      },
      ...seguimientos.map((s) => ({ idNota: `NOTA-${s.idSeguimiento}`, tipoOrigen: 'SEGTO' as const, contenido: s.nota, fechaRegistro: s.fecha, autor: s.autor }))
    ],
    cierre: p.cierre
      ? { motivo: p.cierre.motivo, observacion: null, fecha: new Date(ahora.getTime() - p.cierre.diasDesdeCierre * DIA).toISOString(), autor: 'Profesional de prueba' }
      : null,
    gestionSimultanea: p.gestionSimultanea ?? false,
    pdfDisponible: true,
    fechaActualizacion: ahora.toISOString()
  };
}

/** Casos iniciales. El consecutivo de los nuevos arranca después del más alto. */
export function crearCasosSemilla(ahora: Date): CasoDto[] {
  const anio = ahora.getFullYear();
  return [
    // CC 1000000002 — seguimiento activo, próximo control en 3 días (alerta en APH, F2).
    caso(ahora, { numero: 2, documento: '1000000002', apellidos: 'De Prueba Dos', estado: 'ACTIVO', prioridad: 'MEDIA', triajeAph: 'MEDIO', diasDesdeApertura: 6, idAtencion: `ALMA-${anio}-000011`, seguimientos: 1, proximoControlEnDias: 3, correo: 'persona.dos@ejemplo.test' }),
    // CC 1000000003 — caso cerrado (contención post-cierre).
    caso(ahora, { numero: 3, documento: '1000000003', apellidos: 'De Prueba Tres', estado: 'CERRADO', prioridad: 'BAJA', triajeAph: 'BAJO', diasDesdeApertura: 45, idAtencion: `ALMA-${anio}-000012`, seguimientos: 3, cierre: { motivo: 'OBJETIVOS_CUMPLIDOS', diasDesdeCierre: 20 } }),
    // CC 1000000008 — más de 3 seguimientos (RN-ALMA-05), próximo control mañana.
    caso(ahora, { numero: 8, documento: '1000000008', apellidos: 'De Prueba Ocho', estado: 'ACTIVO', prioridad: 'ALTA', triajeAph: 'ALTO', diasDesdeApertura: 30, idAtencion: `ALMA-${anio}-000013`, seguimientos: 4, proximoControlEnDias: 1, correo: 'persona.ocho@ejemplo.test' }),
    // CC 1000000010 — gestión simultánea con Equipo de Atención (Q15).
    caso(ahora, { numero: 10, documento: '1000000010', apellidos: 'De Prueba Diez', estado: 'ACTIVO', prioridad: 'MEDIA', triajeAph: 'MEDIO', diasDesdeApertura: 4, idAtencion: `ALMA-${anio}-000007`, seguimientos: 0, proximoControlEnDias: 5, gestionSimultanea: true })
  ];
}

function intento(idAtencion: string, numero: number, fecha: Date, resultado: string): IntentoContactoDto {
  return {
    idIntento: `INT-${idAtencion.slice(-6)}-${numero}`,
    numeroIntento: numero,
    protocolo: protocoloDeIntento(numero),
    fechaHora: fecha.toISOString(),
    resultado,
    nota: `Intento ${numero}: ${resultado === 'BUZON_DE_VOZ' ? 'se dejó mensaje en el buzón' : 'sin respuesta'} (nota de prueba).`,
    justificacion: numero > 3 ? 'La persona pidió por WhatsApp que se le insistiera (justificación de prueba).' : null,
    autor: 'Profesional de prueba'
  };
}

/** Intentos previos: 3 para CC 1000000006 (`ALMA-…-000004`) y 8 para CC 1000000007 (`ALMA-…-000005`). */
export function crearNovedadesSemilla(ahora: Date): NovedadMock[] {
  const anio = ahora.getFullYear();
  const id = (n: number) => `ALMA-${anio}-${String(n).padStart(6, '0')}`;
  const intentosDe = (idAtencion: string, cantidad: number): IntentoContactoDto[] =>
    Array.from({ length: cantidad }, (_, i) => {
      // Días y horarios distintos, como exige el protocolo (RN-ALMA-03).
      const fecha = new Date(ahora.getTime() - (cantidad - i) * 12 * HORA);
      fecha.setMinutes(0, 0, 0);
      return intento(idAtencion, i + 1, fecha, i % 2 === 0 ? 'NO_CONTESTA' : 'BUZON_DE_VOZ');
    });
  return [
    // Liberadas tras los intentos previos: cualquier sesión puede tomarlas y continuar el protocolo.
    { idAtencion: id(4), tomadaPor: null, tomadaEn: null, intentos: intentosDe(id(4), 3), recontactoResuelto: null },
    { idAtencion: id(5), tomadaPor: null, tomadaEn: null, intentos: intentosDe(id(5), 8), recontactoResuelto: null },
    // CC 1000000009 — tomada por otra profesional: «Tomar» responde 409 NOVEDAD_YA_TOMADA.
    { idAtencion: id(6), tomadaPor: 'Otra profesional (prueba)', tomadaEn: new Date(ahora.getTime() - 1 * HORA).toISOString(), intentos: [], recontactoResuelto: null }
  ];
}
