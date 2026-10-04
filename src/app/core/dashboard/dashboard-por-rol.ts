/**
 * Qué ve cada rol en el panel de inicio, **en un solo lugar**.
 *
 * El orden del arreglo define el orden visual, y responde a la arquitectura de
 * información del contrato (§3): Z2 «Atención requerida» va antes que Z3
 * «Indicadores», porque lo accionable precede a lo informativo (DSH-P1,
 * DSH-07-01).
 *
 * Se indexa por los **cinco roles reales del código** (`AuthService`), no por
 * las secciones del menú lateral de las que el contrato infirió sus perfiles
 * (DSH-12-01). **[PENDIENTE P-02]**: si el equipo confirma que Recepción/Bandeja
 * es un rol propio, se añade su entrada aquí sin tocar ningún componente.
 *
 * Línea ALMA y UAD Equipos 3 y 4 quedan fuera a propósito: su alcance funcional
 * no está documentado y no se diseña por suposición (§4.4 del contrato).
 */
export type WidgetId =
  | 'pendientes'
  | 'kpis'
  | 'distribucion-identidad'
  | 'agenda-hoy'
  | 'carga-equipo'
  | 'accesos-frecuentes'
  | 'ayuda-protocolos';

export type RolCasilda = 'ADMIN' | 'COORDINADOR' | 'PROFESIONAL' | 'REVISOR' | 'USUARIO';

export const DASHBOARD_POR_ROL: Record<RolCasilda, readonly WidgetId[]> = {
  // ¿La plataforma está bien configurada y funcionando? (§4.1)
  ADMIN: ['pendientes', 'kpis', 'distribucion-identidad', 'accesos-frecuentes', 'ayuda-protocolos'],

  // ¿Qué necesita asignación o seguimiento hoy? (§4.3, a la espera de P-02)
  COORDINADOR: ['pendientes', 'kpis', 'carga-equipo', 'accesos-frecuentes', 'ayuda-protocolos'],

  // ¿A quién atiendo hoy y qué tengo pendiente? (§4.2)
  PROFESIONAL: ['pendientes', 'kpis', 'agenda-hoy', 'accesos-frecuentes', 'ayuda-protocolos'],

  // ¿Qué patrones muestra la vigilancia? (§4.5)
  REVISOR: ['pendientes', 'kpis', 'distribucion-identidad', 'accesos-frecuentes', 'ayuda-protocolos'],

  // El dashboard del rol Usuario se rediseña completo en la Subfase 4 con
  // enfoque informado en trauma (§5). Hasta entonces conserva su vista actual:
  // no se le aplica este registro.
  USUARIO: []
};

/** Widgets del rol, o los del rol Usuario (vacío) si el código no se reconoce. */
export function widgetsDelRol(rol: string): readonly WidgetId[] {
  return DASHBOARD_POR_ROL[rol as RolCasilda] ?? [];
}
