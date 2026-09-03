export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api/v1',
  /** Destino neutral de la Salida Rápida (componente de seguridad VBG). */
  quickExitUrl: 'https://www.google.com',
  /** TODO(negocio): reemplazar por la línea oficial de orientación de la UdeA. */
  telefonoOrientacion: '1234567890',
  features: {
    complaintIntakePrototype: true,
    publicTrackingPrototype: true,
    reviewerDashboardPrototype: true,
    assignmentsPrototype: true
  }
};
