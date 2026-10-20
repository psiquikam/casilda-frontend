export const environment = {
  production: false,
  apiBaseUrl: 'https://casildaqa.duckdns.org/api-casilda',
  /** Destino neutral de la Salida Rápida (componente de seguridad VBG). */
  quickExitUrl: 'https://www.google.com',
  /**
   * Línea oficial de orientación de la UdeA. **Vacía a propósito**: mientras no
   * exista el dato real, la línea no se muestra (ver `esTelefonoPublicable` en
   * `core/security/telefono-crisis.ts`). Nunca usar un número de relleno:
   * en contenido de crisis un número falso impide que alguien reciba ayuda.
   * TODO(negocio): reemplazar por la línea oficial confirmada por el equipo.
   */
  telefonoOrientacion: '',
  /**
   * Teléfono de contacto del pie público. Mismo criterio que
   * `telefonoOrientacion`: vacío mientras no haya dato real confirmado.
   * TODO(negocio): reemplazar por el contacto oficial del pie público.
   */
  telefonoContactoPublico: '',
  /**
   * Modo de demostración, para probar la interfaz sin backend. Activo:
   * cuentas de prueba (login rápido y selector de rol del encabezado), datos
   * simulados en el panel de inicio, el módulo Equipo de Atención y el home, y
   * una franja visible que lo declara (DSH-12-08). Inactivo: todo sale de
   * `apiBaseUrl` y las zonas sin endpoint en el backend no se muestran.
   * **Nunca `true` en un entorno desplegado**: las cuentas de prueba dan una
   * sesión ADMIN con un clic (pendiente 6 de `CLAUDE.md`).
   */
  datosDemostracion: false,
  features: {
    complaintIntakePrototype: true,
    publicTrackingPrototype: true,
    reviewerDashboardPrototype: true,
    assignmentsPrototype: true
  }
};
