import { ActuacionDisponible, CodigoActuacion, EquipoUad, EstadoGestionUad, FaseUad } from '../contratos/uad-api.types';

/**
 * Catálogo definitivo de «Gestionar caso» (bitácora §7 y §8; prototipos p. 10 y 11).
 *
 * | Actuación ordinaria          | Fase y equipo                                              |
 * |------------------------------|------------------------------------------------------------|
 * | Indagación previa            | Equipo 3 – Instrucción (personal)                          |
 * | Investigación disciplinaria  | Equipo 3 – Instrucción (personal)                          |
 * | Averiguaciones preliminares  | Equipo 4 – Instrucción (estudiantes)                       |
 * | Práctica de pruebas          | Instrucción y decisión de ambos equipos                    |
 * | Pliego de cargos             | Instrucción de ambos equipos                               |
 * | Audiencias                   | Decisión de ambos equipos                                  |
 * | Mediación                    | Decisión de ambos equipos, sujeto a procedencia (§16)      |
 * | Fallo                        | Decisión de ambos equipos                                  |
 * | Reposición y/o apelación     | Decisión de ambos equipos                                  |
 *
 * Acciones permanentes (§8), visibles siempre: remisión por competencia, inhibitorio, terminación,
 * finalizar etapa de instrucción y remisión a otro actor de la Ruta.
 *
 * **Uso en el frontend:** el catálogo vigente lo entrega el servidor (`catalogoActuaciones`). Esta
 * función alimenta el mock y documenta la regla; la interfaz no la usa para autorizar.
 */

interface DefinicionOrdinaria {
  readonly codigo: CodigoActuacion;
  readonly nombre: string;
  readonly aplica: Readonly<Record<FaseUad, readonly EquipoUad[]>>;
  readonly pendienteValidacion?: string;
}

const AMBOS: readonly EquipoUad[] = ['EQUIPO_3', 'EQUIPO_4'];

export const ACTUACIONES_ORDINARIAS: readonly DefinicionOrdinaria[] = [
  { codigo: 'INDAGACION_PREVIA', nombre: 'Indagación previa', aplica: { INSTRUCCION: ['EQUIPO_3'], DECISION: [] } },
  { codigo: 'INVESTIGACION_DISCIPLINARIA', nombre: 'Investigación disciplinaria', aplica: { INSTRUCCION: ['EQUIPO_3'], DECISION: [] } },
  { codigo: 'AVERIGUACIONES_PRELIMINARES', nombre: 'Averiguaciones preliminares', aplica: { INSTRUCCION: ['EQUIPO_4'], DECISION: [] } },
  { codigo: 'PRACTICA_PRUEBAS', nombre: 'Práctica de pruebas', aplica: { INSTRUCCION: AMBOS, DECISION: AMBOS } },
  { codigo: 'PLIEGO_CARGOS', nombre: 'Pliego de cargos', aplica: { INSTRUCCION: AMBOS, DECISION: [] } },
  { codigo: 'AUDIENCIAS', nombre: 'Audiencias', aplica: { INSTRUCCION: [], DECISION: AMBOS } },
  {
    codigo: 'MEDIACION',
    nombre: 'Mediación',
    aplica: { INSTRUCCION: [], DECISION: AMBOS },
    pendienteValidacion: 'Sujeta a procedencia: falta validar su viabilidad en cada régimen y en asuntos de VBG/VS.'
  },
  { codigo: 'FALLO', nombre: 'Fallo', aplica: { INSTRUCCION: [], DECISION: AMBOS } },
  { codigo: 'REPOSICION_APELACION', nombre: 'Reposición y/o apelación', aplica: { INSTRUCCION: [], DECISION: AMBOS } }
];

interface DefinicionPermanente {
  readonly codigo: CodigoActuacion;
  readonly nombre: string;
  /** Motivo por el que no se ejecuta aún (validación jurídica o campos sin aprobar). */
  readonly pendienteValidacion?: string;
}

export const ACCIONES_PERMANENTES: readonly DefinicionPermanente[] = [
  { codigo: 'REMISION_COMPETENCIA', nombre: 'Remisión por competencia' },
  {
    codigo: 'INHIBITORIO',
    nombre: 'Inhibitorio',
    pendienteValidacion: 'Pendiente de validación jurídica: procedencia después del inicio formal de la etapa.'
  },
  {
    codigo: 'TERMINACION',
    nombre: 'Terminación',
    pendienteValidacion: 'Pendiente de validación jurídica: alcance y diferencia con suspensión y archivo.'
  },
  { codigo: 'FINALIZAR_INSTRUCCION', nombre: 'Finalizar etapa de instrucción' },
  {
    codigo: 'REMISION_RUTA',
    nombre: 'Remisión a otro actor de la Ruta',
    pendienteValidacion: 'Los campos de la remisión interna están pendientes de aprobación. No cierra el caso institucional.'
  }
];

const CODIGOS_PERMANENTES: ReadonlySet<CodigoActuacion> = new Set(ACCIONES_PERMANENTES.map((a) => a.codigo));

export function esPermanente(codigo: CodigoActuacion): boolean {
  return CODIGOS_PERMANENTES.has(codigo);
}

export function nombreActuacion(codigo: CodigoActuacion): string {
  return [...ACTUACIONES_ORDINARIAS, ...ACCIONES_PERMANENTES].find((a) => a.codigo === codigo)?.nombre ?? codigo;
}

const GESTION_FINALIZADA = 'La gestión de la UAD sobre este caso ya terminó.';

/**
 * Catálogo para un caso: ordinarias de su fase y equipo, más todas las permanentes (siempre visibles,
 * bitácora §8). Una actuación ordinaria nunca cambia la fase; solo «Finalizar etapa de instrucción» lo hace.
 */
export function catalogoParaCaso(fase: FaseUad, equipo: EquipoUad, estado: EstadoGestionUad): ActuacionDisponible[] {
  const activa = estado === 'ACTIVA';
  const ordinarias: ActuacionDisponible[] = ACTUACIONES_ORDINARIAS.filter((a) => a.aplica[fase].includes(equipo)).map((a) => ({
    codigo: a.codigo,
    nombre: a.nombre,
    permanente: false,
    ejecutable: activa && !a.pendienteValidacion,
    motivoNoEjecutable: !activa ? GESTION_FINALIZADA : (a.pendienteValidacion ?? null),
    pendienteValidacion: !!a.pendienteValidacion
  }));

  const permanentes: ActuacionDisponible[] = ACCIONES_PERMANENTES.map((a) => {
    let motivo: string | null = a.pendienteValidacion ?? null;
    if (!activa) motivo = GESTION_FINALIZADA;
    else if (a.codigo === 'FINALIZAR_INSTRUCCION' && fase !== 'INSTRUCCION') {
      motivo = 'Solo se ejecuta durante la instrucción. El caso ya está en decisión.';
    }
    return {
      codigo: a.codigo,
      nombre: a.nombre,
      permanente: true,
      ejecutable: motivo === null,
      motivoNoEjecutable: motivo,
      pendienteValidacion: !!a.pendienteValidacion
    };
  });

  return [...ordinarias, ...permanentes];
}

/**
 * Valida un registro de actuaciones ordinarias contra el catálogo vigente. Devuelve errores por campo
 * (`actuaciones`, `observaciones`) con el formato de `validationErrors` del backend.
 */
export function validarActuaciones(
  codigos: readonly CodigoActuacion[],
  observaciones: string | null,
  catalogo: readonly ActuacionDisponible[],
  limiteObservaciones: number
): Record<string, string> {
  const errores: Record<string, string> = {};
  if (codigos.length === 0) {
    errores['actuaciones'] = 'Marque al menos una actuación.';
  } else if (new Set(codigos).size !== codigos.length) {
    errores['actuaciones'] = 'Hay actuaciones repetidas.';
  } else if (codigos.some((c) => esPermanente(c))) {
    errores['actuaciones'] = 'Las acciones permanentes se registran por separado, no junto con actuaciones ordinarias.';
  } else {
    const noDisponibles = codigos.filter((c) => !catalogo.some((a) => a.codigo === c && !a.permanente && a.ejecutable));
    if (noDisponibles.length > 0) {
      errores['actuaciones'] = `No disponible en la fase y el equipo actuales: ${noDisponibles.map(nombreActuacion).join(', ')}.`;
    }
  }
  if ((observaciones ?? '').length > limiteObservaciones) {
    errores['observaciones'] = `Máximo ${limiteObservaciones} caracteres.`;
  }
  return errores;
}
