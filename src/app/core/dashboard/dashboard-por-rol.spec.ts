import { DASHBOARD_POR_ROL, WIDGETS_SIN_BACKEND, widgetsDelRol, type RolCasilda } from './dashboard-por-rol';

/** El registro es el único lugar donde se decide qué ve cada rol (DSH-12-02). */
describe('registro de widgets por rol', () => {
  const rolesPersonal: RolCasilda[] = ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'];

  it('cubre los seis roles reales del código', () => {
    expect(Object.keys(DASHBOARD_POR_ROL).sort()).toEqual(
      ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR', 'USUARIO', 'GESTOR_CONTENIDO'].sort()
    );
  });

  it('al gestor de contenidos solo le ofrece el acceso a su módulo', () => {
    expect(widgetsDelRol('GESTOR_CONTENIDO', false)).toEqual(['accesos-frecuentes']);
  });

  it('pone lo accionable antes que lo informativo (DSH-P1, DSH-07-01)', () => {
    for (const rol of rolesPersonal) {
      const widgets = DASHBOARD_POR_ROL[rol];
      expect(widgets.indexOf('pendientes')).withContext(rol).toBeLessThan(widgets.indexOf('kpis'));
    }
  });

  it('da a cada rol de personal una sola vista principal (DSH-P5)', () => {
    const vistasPrincipales = ['distribucion-identidad', 'vigilancia', 'agenda-hoy', 'carga-equipo'];
    for (const rol of rolesPersonal) {
      const cuantas = DASHBOARD_POR_ROL[rol].filter((w) => vistasPrincipales.includes(w)).length;
      expect(cuantas).withContext(rol).toBe(1);
    }
  });

  it('el perfil analítico usa la vista con filtros, no la distribución fija (§4.5)', () => {
    expect(DASHBOARD_POR_ROL.REVISOR).toContain('vigilancia');
    expect(DASHBOARD_POR_ROL.REVISOR).not.toContain('distribucion-identidad');
  });

  it('no asigna widgets al rol Usuario: su panel es la Subfase 4', () => {
    expect(DASHBOARD_POR_ROL.USUARIO).toEqual([]);
  });

  it('devuelve una lista vacía para un rol desconocido, sin lanzar', () => {
    expect(widgetsDelRol('ROL_INEXISTENTE', true)).toEqual([]);
  });

  it('en modo de demostración devuelve el registro completo del rol', () => {
    for (const rol of rolesPersonal) {
      expect(widgetsDelRol(rol, true)).withContext(rol).toEqual(DASHBOARD_POR_ROL[rol]);
    }
  });

  it('fuera del modo de demostración omite los widgets sin endpoint en el backend', () => {
    for (const rol of rolesPersonal) {
      const widgets = widgetsDelRol(rol, false);
      expect(widgets.some((w) => WIDGETS_SIN_BACKEND.has(w))).withContext(rol).toBeFalse();
      expect(widgets).withContext(rol).toEqual(['accesos-frecuentes', 'ayuda-protocolos']);
    }
  });
});
