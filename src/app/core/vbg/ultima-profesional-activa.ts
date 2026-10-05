import type { SeguimientoVbg } from '../../components/seccion-seguimientos/seccion-seguimientos.component';

/**
 * VBG-08-13 / DSH-08-03: ¿sigue habiendo algún seguimiento «Abierto», de
 * cualquier especialidad, además del que se está cerrando?
 *
 * Único predicado para la alerta de última profesional activa, usado por
 * `SeccionSeguimientosComponent` al cerrar un seguimiento. El panel de
 * inicio (`DashboardTrabajoService`) representa el mismo concepto, pero
 * hoy con datos mock agregados entre casos, no con este cálculo — no hay
 * todavía una fuente de seguimientos reales por caso disponible ahí. Cuando
 * exista, debe calcularse llamando a esta misma función, no duplicando la
 * lógica.
 */
export function esUltimaProfesionalActiva(
  seguimientos: readonly SeguimientoVbg[],
  seguimientoQueSeCierra: SeguimientoVbg
): boolean {
  return !seguimientos.some((s) => s !== seguimientoQueSeCierra && s.estado === 'Abierto');
}
