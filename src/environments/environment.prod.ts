export const environment = {
  production: true,
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
  /**
   * Módulo Línea Alma (submódulos APH y Psicología): servicios simulados mientras Backend
   * publica los contratos de `docs/contratos/linea-alma/`. Un interruptor por
   * grupo de endpoints (`mocks/alma-mock.interceptor.ts`): al publicarse uno,
   * se pone en `false` **sin tocar componentes** (H-3.4). Los datos son
   * ficticios (Anexo B del plan) y no se mezclan con `datosDemostracion`.
   * **Nunca `true` en un entorno desplegado.**
   */
  lineaAlma: {
    mocks: {
      catalogos: false,
      personas: false,
      atencionesAph: false,
      derivaciones: false,
      bandejaAph: false,
      contenciones: false,
      auditoria: false,
      // Psicología (contratos en `docs/contratos/linea-alma/contrato-psicologia-*.md`).
      bandejaPsicologia: false,
      novedades: false,
      casos: false,
      agenda: false,
      recontactos: false
    }
  },
  seguridadPyB: {
    mocks: {
      catalogos: false,
      registros: false,
      bandejaAnalista: false,
      medidas: false,
      ordenes: false,
      camaras: false,
      remisiones: false,
      indicadores: false
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
    adaptador: 'http' as 'mock' | 'http'
  },
  features: {
    complaintIntakePrototype: false,
    publicTrackingPrototype: false,
    reviewerDashboardPrototype: false,
    assignmentsPrototype: false,
    /** Apagada hasta probar `POST /uad/noticias-anonimas` de punta a punta: un formulario público que falla no se publica. */
    uadQuejaAnonima: false
  }
};
