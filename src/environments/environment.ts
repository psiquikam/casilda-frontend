export const environment = {
  production: false,
  apiBaseUrl: 'http://35.208.251.66:8080/api-casilda',
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
  features: {
    complaintIntakePrototype: true,
    publicTrackingPrototype: true,
    reviewerDashboardPrototype: true,
    assignmentsPrototype: true
  }
};
