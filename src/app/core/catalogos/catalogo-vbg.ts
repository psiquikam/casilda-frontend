/**
 * Catálogo central del módulo Equipo de Atención VBG.
 *
 * Fuente de verdad: `docs/contratos/MATRIZ_MODULO_ATENCION_VBG.md`. Las
 * etiquetas y el orden son literales de la matriz (regla 2 de su §0):
 * no se parafrasean.
 *
 * Cada opción separa **lo que se guarda** (`codigo`, estable, nunca cambia
 * con un renombre de la matriz) de **lo que se lee** (`etiqueta`, la que
 * exige la matriz). Así un cambio de denominación —p. ej. «Ruta de
 * amenazas» → «Protocolo de amenazas», VBG-07-07— no toca los valores ya
 * guardados.
 */

export interface OpcionCatalogoVbg {
  /** Código estable. Es lo que viaja al backend y lo que persiste. */
  readonly codigo: string;
  /** Etiqueta visible, literal de la matriz. */
  readonly etiqueta: string;
  /** Código del padre, para los árboles (modalidades, vínculos, misional). */
  readonly padre?: string;
  /**
   * Texto de ayuda de la matriz. Va en `<mat-hint>`, nunca en `placeholder`
   * (R-06). Cuando el texto es solo descriptivo —no una opción seleccionable,
   * como los paréntesis de "Explotación sexual" (pendiente 9, decisión
   * provisional)— se expone aquí y no como hijo del árbol.
   */
  readonly ayuda?: string;
}

/* ==========================================================================
   Sección 1 — Documentación del hecho (VBG-01-06, 01-07, 01-08)
   ========================================================================== */

export const AMBITO_OCURRENCIA: readonly OpcionCatalogoVbg[] = [
  { codigo: 'pareja-expareja', etiqueta: 'Pareja / expareja' },
  { codigo: 'laboral', etiqueta: 'Laboral' },
  { codigo: 'academico', etiqueta: 'Académico' },
  { codigo: 'sindical', etiqueta: 'Sindical' },
  { codigo: 'politico', etiqueta: 'Político' },
  { codigo: 'publico', etiqueta: 'Público' },
  { codigo: 'privado', etiqueta: 'Privado' },
  { codigo: 'familiar', etiqueta: 'Familiar' },
  { codigo: 'otro-ambito', etiqueta: 'Otro' }
];

export const FORMA_OCURRENCIA: readonly OpcionCatalogoVbg[] = [
  { codigo: 'presencial', etiqueta: 'Presencial' },
  { codigo: 'virtual', etiqueta: 'Virtual' },
  { codigo: 'mixta', etiqueta: 'Mixta' }
];

/**
 * VBG-01-10: se refiere a los bienes inmuebles o predios universitarios. El
 * texto de ayuda debe dejarlo explícito.
 */
export const LUGAR_OCURRENCIA: readonly OpcionCatalogoVbg[] = [
  { codigo: 'dentro', etiqueta: 'Dentro' },
  { codigo: 'fuera', etiqueta: 'Fuera' },
  { codigo: 'mixto-lugar', etiqueta: 'Mixto' }
];

export const AYUDA_LUGAR_OCURRENCIA =
  'Se refiere a si el hecho ocurrió dentro, fuera o parcialmente dentro de bienes inmuebles o predios de la Universidad de Antioquia.';

/* ==========================================================================
   Sección 2 — Relación misional e institucional (VBG-02-01 a 02-04)
   Estructura de dos niveles: decisión provisional del pendiente 7.
   ========================================================================== */

export const RELACION_MISIONAL: readonly OpcionCatalogoVbg[] = [
  { codigo: 'misional', etiqueta: 'Misional' },
  { codigo: 'actividades-institucionales', etiqueta: 'Actividades Institucionales' },
  { codigo: 'representacion-u', etiqueta: 'En representación de la U' },
  { codigo: 'bienes-inmuebles', etiqueta: 'En bienes inmuebles' },
  // Nivel 2, obligatorio (al menos uno) solo si se marca "misional".
  { codigo: 'misional-docencia', etiqueta: 'Docencia', padre: 'misional' },
  { codigo: 'misional-investigacion', etiqueta: 'Investigación', padre: 'misional' },
  { codigo: 'misional-extension', etiqueta: 'Extensión', padre: 'misional' }
];

/**
 * Texto del protocolo (VBG-02-01). La matriz lo transcribe incompleto
 * (termina en "…"): se muestra tal como está y se marca como pendiente de
 * texto completo (pendiente 6 de la matriz).
 */
export const TEXTO_PROTOCOLO_RELACION_MISIONAL =
  'Ocurrió en el desarrollo de actividades misionales, institucionales, en representación de la universidad o en bienes inmuebles...';

/* ==========================================================================
   Sección 3 — Tipos y modalidades de violencia (VBG-03-01 a 03-08)
   Solo la rama Sexual tiene subcategorías (decisión provisional del
   pendiente 8): Psicológica, Física, Patrimonial, Por prejuicio e
   Institucional quedan como hojas sin hijos.
   ========================================================================== */

export const MODALIDADES_VIOLENCIA: readonly OpcionCatalogoVbg[] = [
  { codigo: 'psicologica', etiqueta: 'Psicológica' },
  { codigo: 'fisica', etiqueta: 'Física' },
  { codigo: 'sexual', etiqueta: 'Sexual' },
  { codigo: 'patrimonial', etiqueta: 'Patrimonial' },
  { codigo: 'por-prejuicio', etiqueta: 'Por prejuicio' },
  { codigo: 'institucional', etiqueta: 'Institucional' },

  // --- Subcategorías de Sexual (nivel 2) ---
  { codigo: 'acceso-carnal-violento', etiqueta: 'Acceso carnal violento', padre: 'sexual' },
  { codigo: 'acto-sexual-violento', etiqueta: 'Acto sexual violento', padre: 'sexual' },
  {
    codigo: 'explotacion-sexual',
    etiqueta: 'Explotación sexual',
    padre: 'sexual',
    // Pendiente 9, decisión provisional: texto descriptivo, no opciones
    // seleccionables de un tercer nivel.
    ayuda: 'Inducción a la prostitución, proxenetismo con menor de edad, constreñimiento a la prostitución, trata de personas.'
  },
  {
    codigo: 'violencia-tecnologica',
    etiqueta: 'Violencia facilitada por nuevas tecnologías',
    padre: 'sexual'
  },

  // --- Subcategorías de "Violencia facilitada por nuevas tecnologías" (nivel 3) ---
  {
    codigo: 'uso-explotacion-trata-amenazas',
    etiqueta: 'Uso, explotación y trata mediante amenazas / extorsión',
    padre: 'violencia-tecnologica'
  },
  { codigo: 'grooming', etiqueta: 'Grooming', padre: 'violencia-tecnologica' },
  {
    codigo: 'creacion-contenido-sin-consentimiento',
    etiqueta: 'Creación de contenido sin consentimiento',
    padre: 'violencia-tecnologica'
  },
  {
    // VBG-03-07: la etiqueta debe ser literalmente esta, nunca "Sexting" a secas.
    codigo: 'sexting-sin-consentimiento',
    etiqueta: 'Sexting sin consentimiento',
    padre: 'violencia-tecnologica'
  }
];

/* ==========================================================================
   Sección 5 — Datos del presunto agresor (VBG-05-03, 05-04, 05-08)
   ========================================================================== */

export const VINCULO_UNIVERSIDAD: readonly OpcionCatalogoVbg[] = [
  { codigo: 'estudiante', etiqueta: 'Estudiante' },
  { codigo: 'docente', etiqueta: 'Docente' },
  // VBG-05-08: denominación obligatoria "Personal no docente", no "Administrativos".
  { codigo: 'personal-no-docente', etiqueta: 'Personal no docente' },
  { codigo: 'otro-vinculo-universidad', etiqueta: 'Otro' },

  { codigo: 'estudiante-pregrado', etiqueta: 'Pregrado', padre: 'estudiante' },
  { codigo: 'estudiante-posgrado', etiqueta: 'Posgrado', padre: 'estudiante' },
  { codigo: 'estudiante-tecnologia', etiqueta: 'Tecnología', padre: 'estudiante' },
  { codigo: 'estudiante-tecnica', etiqueta: 'Técnica', padre: 'estudiante' },

  { codigo: 'docente-vinculado', etiqueta: 'Vinculado', padre: 'docente' },
  { codigo: 'docente-ocasional', etiqueta: 'Ocasional', padre: 'docente' },
  { codigo: 'docente-catedra', etiqueta: 'Cátedra', padre: 'docente' },
  { codigo: 'docente-catedra-50', etiqueta: 'Cátedra 50', padre: 'docente' }
];

export const VINCULO_VICTIMA: readonly OpcionCatalogoVbg[] = [
  { codigo: 'pareja-expareja-victima', etiqueta: 'Pareja / Expareja' },
  { codigo: 'familiar-victima', etiqueta: 'Familiar' },
  { codigo: 'companeros-estudio', etiqueta: 'Compañeros de estudio' },
  { codigo: 'docente-victima', etiqueta: 'Docente' },
  { codigo: 'otro-vinculo-victima', etiqueta: 'Otro' }
];

/* ==========================================================================
   Sección 7 — Rutas internas y externas (VBG-07-02, 07-03, 07-07)
   ========================================================================== */

export const RUTAS_INTERNAS: readonly OpcionCatalogoVbg[] = [
  { codigo: 'asuntos-disciplinarios', etiqueta: 'Asuntos disciplinarios' },
  { codigo: 'resolucion-conflictos', etiqueta: 'Resolución de conflictos' },
  { codigo: 'medidas-administrativas', etiqueta: 'Medidas administrativas' },
  // VBG-07-07: renombrada de "Ruta de amenazas" a "Protocolo de amenazas".
  { codigo: 'protocolo-amenazas', etiqueta: 'Protocolo de amenazas' },
  { codigo: 'medidas-academicas', etiqueta: 'Medidas académicas' },
  { codigo: 'medidas-laborales', etiqueta: 'Medidas laborales' },
  { codigo: 'otras-rutas-internas', etiqueta: 'Otras' }
];

export const RUTAS_EXTERNAS: readonly OpcionCatalogoVbg[] = [
  { codigo: 'salud', etiqueta: 'Salud' },
  { codigo: 'fiscalia', etiqueta: 'Fiscalía' },
  { codigo: 'comisaria-familia', etiqueta: 'Comisaría de Familia' },
  { codigo: 'inspeccion-policia', etiqueta: 'Inspección de Policía' },
  { codigo: 'procuraduria', etiqueta: 'Procuraduría General de la Nación' },
  { codigo: 'otras-rutas-externas', etiqueta: 'Otras' }
];

/* ==========================================================================
   Sección 8 — Especialidades de seguimiento (VBG-08-01..04)
   Las cuatro subsecciones de la matriz (7.1-7.4), sin el número de sección
   (decisión provisional del pendiente 1). Sostienen el aislamiento VBG-08-10
   junto con la especialidad de las cuentas de prueba PROFESIONAL (P-12).
   ========================================================================== */

export const ESPECIALIDADES_SEGUIMIENTO: readonly OpcionCatalogoVbg[] = [
  { codigo: 'juridico', etiqueta: 'Jurídico' },
  { codigo: 'psicojuridico', etiqueta: 'Psicojurídico' },
  { codigo: 'psicologico', etiqueta: 'Psicológico' },
  { codigo: 'psicoorientacion', etiqueta: 'Psicoorientación' }
];

/* ==========================================================================
   Sección 8 — Acción → Actividad de seguimientos (VBG-08-06, 08-07)
   Pendiente 15 sin definición oficial: catálogo simulado mínimo, marcado
   como provisional (decisión provisional del pendiente 15).
   ========================================================================== */

export const ACCIONES_SEGUIMIENTO: readonly OpcionCatalogoVbg[] = [
  { codigo: 'llamada-telefonica', etiqueta: 'Llamada telefónica' },
  { codigo: 'sesion-presencial', etiqueta: 'Sesión presencial' },
  { codigo: 'sesion-virtual', etiqueta: 'Sesión virtual' },
  { codigo: 'gestion-documental', etiqueta: 'Gestión documental' },

  { codigo: 'llamada-efectiva', etiqueta: 'Llamada efectiva', padre: 'llamada-telefonica' },
  { codigo: 'llamada-sin-respuesta', etiqueta: 'Llamada sin respuesta', padre: 'llamada-telefonica' },
  { codigo: 'mensaje-dejado', etiqueta: 'Mensaje dejado', padre: 'llamada-telefonica' },

  { codigo: 'sesion-orientacion', etiqueta: 'Sesión de orientación', padre: 'sesion-presencial' },
  { codigo: 'sesion-seguimiento-acuerdos', etiqueta: 'Seguimiento a acuerdos', padre: 'sesion-presencial' },

  { codigo: 'videollamada-orientacion', etiqueta: 'Videollamada de orientación', padre: 'sesion-virtual' },
  { codigo: 'videollamada-seguimiento', etiqueta: 'Videollamada de seguimiento', padre: 'sesion-virtual' },

  { codigo: 'envio-remision', etiqueta: 'Envío de remisión', padre: 'gestion-documental' },
  { codigo: 'radicacion-documento', etiqueta: 'Radicación de documento', padre: 'gestion-documental' }
];

/* ==========================================================================
   Sección 9 — Grupo de atención (VBG-09-01). Solo etiquetas: el cálculo
   está bloqueado por el pendiente 17 (tabla de decisión) y no se implementa
   (decisión provisional del pendiente 17, M5 lo deja en solo lectura).
   ========================================================================== */

export const GRUPOS_ATENCION: readonly OpcionCatalogoVbg[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  codigo: `grupo-${n}`,
  etiqueta: `Grupo ${n}`
}));

/* ==========================================================================
   Utilidades de árbol
   ========================================================================== */

/** Hijos directos de un código. */
export function hijosDe(
  catalogo: readonly OpcionCatalogoVbg[],
  codigoPadre: string
): readonly OpcionCatalogoVbg[] {
  return catalogo.filter((opcion) => opcion.padre === codigoPadre);
}

/** Opciones de nivel raíz (sin padre). */
export function raiz(catalogo: readonly OpcionCatalogoVbg[]): readonly OpcionCatalogoVbg[] {
  return catalogo.filter((opcion) => !opcion.padre);
}

/** Busca una opción por su código en cualquier nivel. */
export function porCodigo(
  catalogo: readonly OpcionCatalogoVbg[],
  codigo: string
): OpcionCatalogoVbg | undefined {
  return catalogo.find((opcion) => opcion.codigo === codigo);
}
