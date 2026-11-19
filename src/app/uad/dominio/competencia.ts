import { EquipoUad, FaseUad, TipoNoticia, VinculacionInvestigado } from '../contratos/uad-api.types';

/**
 * Reglas de competencia UAD (bitácora UAD-NOT-05 a 09, UAD-CAS-04 a 07; catálogo de roles §3.c).
 *
 * | Persona presuntamente responsable                         | Instrucción | Decisión |
 * |-----------------------------------------------------------|-------------|----------|
 * | Docentes, administrativos, directivos, trabajadores of.   | Equipo 3    | Equipo 4 |
 * | Estudiantes de pregrado y posgrado                        | Equipo 4    | Equipo 3 |
 *
 * **Uso en el frontend:** solo para explicar y simular (adaptador mock, textos de ayuda). La
 * visibilidad real la impone el servidor; ocultar algo aquí no es un control de seguridad.
 */

export const TODOS_LOS_EQUIPOS: readonly EquipoUad[] = ['EQUIPO_3', 'EQUIPO_4'];

const ESTUDIANTES: ReadonlySet<VinculacionInvestigado> = new Set<VinculacionInvestigado>(['ESTUDIANTE_PREGRADO', 'ESTUDIANTE_POSGRADO']);

const PERSONAL: ReadonlySet<VinculacionInvestigado> = new Set<VinculacionInvestigado>([
  'DOCENTE_VINCULADO',
  'DOCENTE_OCASIONAL',
  'DOCENTE_CATEDRA',
  'ADMINISTRATIVO',
  'TRABAJADOR_OFICIAL',
  'DIRECTIVO'
]);

/** Vinculación que permite asignar un equipo concreto (no «No sé» ni «No tiene vínculo»). */
export function esVinculacionDeterminada(v: VinculacionInvestigado | null | undefined): v is VinculacionInvestigado {
  return !!v && (ESTUDIANTES.has(v) || PERSONAL.has(v));
}

export function equipoInstructor(v: VinculacionInvestigado | null | undefined): EquipoUad | null {
  if (!v) return null;
  if (ESTUDIANTES.has(v)) return 'EQUIPO_4';
  if (PERSONAL.has(v)) return 'EQUIPO_3';
  return null;
}

export function equipoDecisor(v: VinculacionInvestigado | null | undefined): EquipoUad | null {
  if (!v) return null;
  if (ESTUDIANTES.has(v)) return 'EQUIPO_3';
  if (PERSONAL.has(v)) return 'EQUIPO_4';
  return null;
}

export function equipoResponsable(v: VinculacionInvestigado, fase: FaseUad): EquipoUad | null {
  return fase === 'INSTRUCCION' ? equipoInstructor(v) : equipoDecisor(v);
}

/**
 * Equipos que ven una noticia en su bandeja NDI/NDA.
 * - NDA: ambos, siempre (UAD-NOT-09).
 * - NDI sin vinculación determinada («No sé», UAD-NOT-07): ambos hasta clasificarla.
 * - NDI «No tiene vínculo»: ambos — **PROVISIONAL (D-UAD-12)**: la bitácora no lo asigna a un equipo.
 * - NDI con estamento: solo el equipo instructor (UAD-NOT-05/06); tras reclasificar deja de verla
 *   el no competente (UAD-NOT-08).
 */
export function equiposConVisibilidad(tipo: TipoNoticia, vinculacionEfectiva: VinculacionInvestigado | null): readonly EquipoUad[] {
  if (tipo === 'NDA') return TODOS_LOS_EQUIPOS;
  const instructor = equipoInstructor(vinculacionEfectiva);
  return instructor ? [instructor] : TODOS_LOS_EQUIPOS;
}

export function esVisiblePara(equipos: readonly EquipoUad[], tipo: TipoNoticia, vinculacionEfectiva: VinculacionInvestigado | null): boolean {
  const visibles = equiposConVisibilidad(tipo, vinculacionEfectiva);
  return equipos.some((e) => visibles.includes(e));
}
