export const environment = {
  production: false,
  apiBaseUrl: '/api-casilda',
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
  /** Correo de contacto de CASILDA: pie público y recuperación de contraseña del login. */
  correoContacto: 'notificacasilda.dbu@udea.edu.co',
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
  /**
   * Módulo Línea Alma (submódulos APH y Psicología): servicios simulados mientras Backend
   * publica los contratos de `docs/contratos/linea-alma/`. Un interruptor por
   * grupo de endpoints (`mocks/alma-mock.interceptor.ts`): al publicarse uno,
   * se pone en `false` **sin tocar componentes** (H-3.4). Los datos son
   * ficticios (Anexo B del plan) y no se mezclan con `datosDemostracion`.
   * **Nunca `true` en un entorno desplegado.**
   */
  lineaAlma: {
    /**
     * Campos y servicios de la revisión de flujos de noviembre de 2026 que el backend **aún no implementa**:
     * fecha de nacimiento, identidad de género y vínculo con la universidad de la persona, lugar de
     * ocurrencia, evidencias, correo y «¿Cuál?» del solicitante, novedades y cierre de remisiones, y
     * «Datos de la persona» en Psicología. Con `false` la interfaz los oculta y el interceptor
     * `almaContratoInterceptor` los retira de lo que se envía. Detalle en
     * `docs/contratos/linea-alma/revision-backend-vs-front-2026-11-20.md`.
     */
    extensiones: true,
    mocks: {
      catalogos: true,
      personas: true,
      atencionesAph: true,
      derivaciones: true,
      bandejaAph: true,
      contenciones: true,
      auditoria: true,
      // Psicología (contratos en `docs/contratos/linea-alma/contrato-psicologia-*.md`).
      bandejaPsicologia: true,
      novedades: true,
      casos: true,
      agenda: true,
      recontactos: true
    }
  },
  /**
   * Módulo Seguridad a Personas y Bienes (SPyB): mocks activos para desarrollo y pruebas
   * independientes. Al desplegarse en backend, se apagan los interruptores sin tocar código.
   */
  seguridadPyB: {
    mocks: {
      catalogos: true,
      registros: true,
      bandejaAnalista: true,
      medidas: true,
      ordenes: true,
      camaras: true,
      remisiones: true,
      indicadores: true,
      // «Registro de solicitud» (`SpybSolicitudService`): búsqueda, radicación y evidencias.
      solicitudes: true
    }
  },
  /**
   * Módulo UAD Equipos 3 y 4: adaptador del puerto `UadApiPort` (`src/app/uad/uad.providers.ts`).
   * `'mock'`: datos sintéticos en memoria, sin red. `'http'`: `{apiBaseUrl}/uad/...` según
   * `docs/contratos/uad/openapi-uad.yaml`. El backend ya implementa las Entregas 1 y 2, pero el adaptador
   * HTTP aún no se ha probado contra el servidor (ver `docs/contratos/uad/README.md` §3).
   * **Nunca `'mock'` en un entorno desplegado.**
   */
  uad: {
    adaptador: 'mock' as 'mock' | 'http'
  },
  features: {
    complaintIntakePrototype: true,
    publicTrackingPrototype: true,
    reviewerDashboardPrototype: true,
    assignmentsPrototype: true,
    /** Queja anónima ante la UAD (`/uad/queja-anonima`). El backend ya tiene `POST /uad/noticias-anonimas`; falta probarlo de punta a punta. */
    uadQuejaAnonima: true,
    /** «Mis reportes» (`/mis-reportes`), con datos simulados mientras `uad.adaptador` sea `'mock'`. */
    uadMisReportes: true,
    /** Accesos públicos al reporte anónimo: «Reportar VBG de forma anónima» en la navegación y «Iniciar reporte seguro» en la portada. Ocultos por decisión del equipo; la ruta `/formulario-anonimo` sigue activa. */
    reporteAnonimoPublico: false
  }
};
