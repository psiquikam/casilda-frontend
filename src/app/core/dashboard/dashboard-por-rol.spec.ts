import { DASHBOARD_POR_ROL, widgetsDelRol, type RolCasilda } from './dashboard-por-rol';

/** El registro es el único lugar donde se decide qué ve cada rol (DSH-12-02). */
describe('registro de widgets por rol', () => {
  const rolesPersonal: RolCasilda[] = ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'];

  it('cubre los cinco roles reales del código', () => {
    expect(Object.keys(DASHBOARD_POR_ROL).sort()).toEqual(
      ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR', 'USUARIO'].sort()
    );
  });

  it('pone lo accionable antes que lo informativo (DSH-P1, DSH-07-01)', () => {
    for (const rol of rolesPersonal) {
      const widgets = DASHBOARD_POR_ROL[rol];
      expect(widgets.indexOf('pendientes')).withContext(rol).toBeLessThan(widgets.indexOf('kpis'));
    }
  });

  it('da a cada rol de personal una sola vista principal (DSH-P5)', () => {
    const vistasPrincipales = ['distribucion-identidad', 'agenda-hoy', 'carga-equipo'];
    for (const rol of rolesPersonal) {
      const cuantas = DASHBOARD_POR_ROL[rol].filter((w) => vistasPrincipales.includes(w)).length;
      expect(cuantas).withContext(rol).toBe(1);
    }
  });

  it('no asigna widgets al rol Usuario: su panel es la Subfase 4', () => {
    expect(DASHBOARD_POR_ROL.USUARIO).toEqual([]);
  });

  it('devuelve una lista vacía para un rol desconocido, sin lanzar', () => {
    expect(widgetsDelRol('ROL_INEXISTENTE')).toEqual([]);
  });
});
