import { PERMISOS_ALMA, PermisoAlma, permisosDeRoles, rolesConPermiso } from './alma-permisos';

/**
 * H-3.2 — la matriz de permisos del plan §11, con sus casos negativos. El más importante es el
 * del Técnico APH: nunca debe llegar a notas clínicas, PDF ni pantallas de Psicología
 * (`RNF-ALMA-002`, riesgo R4).
 */
describe('permisos de Línea Alma', () => {
  const tiene = (rol: string, permiso: PermisoAlma) => permisosDeRoles([rol]).has(permiso);

  describe('Técnico APH', () => {
    it('puede crear, consultar, editar y cerrar atenciones APH y ver la bandeja de remisiones', () => {
      for (const permiso of ['alma.aph.crear', 'alma.aph.consultar', 'alma.aph.editar', 'alma.aph.cerrar', 'alma.aph.bandeja'] as const) {
        expect(tiene('TECNICO_APH', permiso)).withContext(permiso).toBeTrue();
      }
    });

    it('solo recibe la alerta informativa de seguimiento: sin notas clínicas, sin PDF, sin Psicología', () => {
      const negados: PermisoAlma[] = [
        'alma.notasClinicas.consultar',
        'alma.pdf.consultar',
        'alma.pdf.exportar',
        'alma.psicologia.crear',
        'alma.psicologia.consultar',
        'alma.psicologia.editar',
        'alma.psicologia.cerrar'
      ];
      for (const permiso of negados) {
        expect(tiene('TECNICO_APH', permiso)).withContext(permiso).toBeFalse();
      }
      expect(tiene('TECNICO_APH', 'alma.alertaSeguimiento.consultar')).toBeTrue();
    });
  });

  describe('Profesional (Psicología)', () => {
    it('trabaja en Psicología y solo consulta (notas APH) en APH', () => {
      expect(tiene('PROFESIONAL', 'alma.psicologia.cerrar')).toBeTrue();
      expect(tiene('PROFESIONAL', 'alma.pdf.exportar')).toBeTrue();
      expect(tiene('PROFESIONAL', 'alma.aph.consultar')).toBeTrue();
      expect(tiene('PROFESIONAL', 'alma.aph.crear')).toBeFalse();
      expect(tiene('PROFESIONAL', 'alma.aph.editar')).toBeFalse();
    });

    it('no ve la bandeja de remisiones de APH', () => {
      expect(tiene('PROFESIONAL', 'alma.aph.bandeja')).toBeFalse();
    });
  });

  describe('Coordinador', () => {
    it('crea, consulta y edita en ambos submódulos, pero no cierra', () => {
      expect(tiene('COORDINADOR', 'alma.aph.editar')).toBeTrue();
      expect(tiene('COORDINADOR', 'alma.psicologia.editar')).toBeTrue();
      expect(tiene('COORDINADOR', 'alma.aph.cerrar')).toBeFalse();
      expect(tiene('COORDINADOR', 'alma.psicologia.cerrar')).toBeFalse();
    });
  });

  describe('Revisor', () => {
    it('solo consulta: ninguna clave de crear, editar ni cerrar', () => {
      const efectivos = permisosDeRoles(['REVISOR']);
      for (const permiso of efectivos) {
        expect(/\.(crear|editar|cerrar|exportar)$/.test(permiso)).withContext(permiso).toBeFalse();
      }
      expect(tiene('REVISOR', 'alma.aph.consultar')).toBeTrue();
      expect(tiene('REVISOR', 'alma.psicologia.consultar')).toBeTrue();
    });
  });

  describe('Admin', () => {
    it('tiene todos los permisos', () => {
      expect(permisosDeRoles(['ADMIN']).size).toBe(PERMISOS_ALMA.length);
    });
  });

  describe('roles sin acceso', () => {
    it('Usuario (víctima) y Gestor de contenidos no tienen ningún permiso de Línea Alma', () => {
      expect(permisosDeRoles(['USUARIO']).size).toBe(0);
      expect(permisosDeRoles(['GESTOR_CONTENIDO']).size).toBe(0);
    });

    it('un rol desconocido no aporta permisos', () => {
      expect(permisosDeRoles(['ROL_INVENTADO']).size).toBe(0);
    });
  });

  it('une los permisos cuando la persona tiene más de un rol', () => {
    const efectivos = permisosDeRoles(['TECNICO_APH', 'PROFESIONAL']);
    expect(efectivos.has('alma.aph.crear')).toBeTrue();
    expect(efectivos.has('alma.psicologia.cerrar')).toBeTrue();
  });

  it('`rolesConPermiso` lista quién puede ver notas clínicas sin incluir al Técnico APH', () => {
    expect(rolesConPermiso('alma.notasClinicas.consultar')).not.toContain('TECNICO_APH');
    expect(rolesConPermiso('alma.notasClinicas.consultar')).toContain('PROFESIONAL');
  });
});
