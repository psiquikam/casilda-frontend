export const environment = {
  production: true,
  apiBaseUrl: 'http://35.208.251.66:8080/api-casilda',
  /** Destino neutral de la Salida Rápida (componente de seguridad VBG). */
  quickExitUrl: 'https://www.google.com',
  /** TODO(negocio): reemplazar por la línea oficial de orientación de la UdeA. */
  telefonoOrientacion: '1234567890',
  features: {
    complaintIntakePrototype: false,
    publicTrackingPrototype: false,
    reviewerDashboardPrototype: false,
    assignmentsPrototype: false
  }
};
