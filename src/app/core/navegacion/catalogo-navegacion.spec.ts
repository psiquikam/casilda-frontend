import { CATALOGO_MODULOS, modulosVisiblesPara, moduloPorId } from './catalogo-navegacion';

/**
 * El catálogo es la única fuente de nombres de módulo (DSH-04-03). Estas
 * pruebas impiden que vuelvan a divergir o a duplicarse.
 */
describe('catálogo de navegación', () => {
  it('no repite ids', () => {
    const ids = CATALOGO_MODULOS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no repite nombres: dos módulos nunca se llaman igual', () => {
    const nombres = CATALOGO_MODULOS.map((m) => m.nombre);
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it('asigna un ícono único por módulo (DSH-04-04)', () => {
    const iconos = CATALOGO_MODULOS.map((m) => m.icono);
    expect(new Set(iconos).size).toBe(iconos.length);
  });

  it('escribe los nombres en tipo oración, sin MAYÚSCULAS sostenidas', () => {
    for (const modulo of CATALOGO_MODULOS) {
      expect(modulo.nombre).not.toBe(modulo.nombre.toUpperCase());
    }
  });

  it('declara al menos un rol por módulo', () => {
    for (const modulo of CATALOGO_MODULOS) {
      expect(modulo.roles.length).withContext(modulo.id).toBeGreaterThan(0);
    }
  });

  describe('visibilidad por rol', () => {
    it('el rol Usuario no ve módulos del equipo de atención', () => {
      const visibles = modulosVisiblesPara('USUARIO').map((m) => m.id);

      expect(visibles).not.toContain('registro-caso');
      expect(visibles).not.toContain('consulta');
      expect(visibles).toContain('reportar-caso');
    });

    it('solo el rol Admin ve los módulos de administración', () => {
      expect(modulosVisiblesPara('PROFESIONAL').map((m) => m.id)).not.toContain('usuarios');
      expect(modulosVisiblesPara('ADMIN', true).map((m) => m.id)).toContain('usuarios');
    });

    it('«Reportar caso» es exclusivo del rol Usuario, incluso para Admin', () => {
      // Antes aparecía en el catálogo del Admin porque el filtro tenía una
      // excepción para ese rol: ver todo no equivale a que sea su tarea
      // (DSH-04-04). El acceso sigue gobernado por `roleGuard`.
      const moduloReportar = moduloPorId('reportar-caso');
      expect(moduloReportar?.roles).toEqual(['USUARIO']);
    });
  });
});
