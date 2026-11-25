import { environment as produccion } from './environment.prod';

/**
 * Entorno de **demostración** para la vista previa en Vercel (`npm run deploy:vercel:demo`).
 *
 * Hereda todo de producción (backend QA, cuentas de prueba apagadas, feature flags) y solo cambia
 * los adaptadores de los módulos que aún no tienen backend, para poder mostrarlos con datos
 * sintéticos. Así, cualquier clave nueva de `environment.prod.ts` llega aquí sin tocar este archivo.
 *
 * - UAD Equipos 3 y 4: adaptador mock (el adaptador HTTP aún no se ha probado contra el backend; ver
 *   `docs/contratos/uad/README.md`). Las pantallas muestran la franja «Datos de demostración».
 * - Queja anónima UAD (`features.uadQuejaAnonima`): visible, con la radicación simulada.
 * - «Mis reportes» (`features.uadMisReportes`): visible, con reportes simulados.
 * - Línea Alma (APH y Psicología): todos los grupos del servidor simulado encendidos. El interceptor
 *   solo atiende `{apiBaseUrl}/alma/...`, así que no oculta endpoints reales del backend. Se generan
 *   a partir de las claves de producción: un grupo nuevo queda simulado sin tocar este archivo.
 * - Seguridad a personas y bienes: todo simulado, incluido «Registro de solicitud».
 *
 * Se compila con `ng build --configuration production,demo` (`angular.json`). **Nunca** se usa en
 * el despliegue de producción: `npm run build` y `deploy:vercel` siguen usando `environment.prod.ts`.
 */
type GruposMockAlma = typeof produccion.lineaAlma.mocks;

const todosLosGruposSimulados = Object.fromEntries(
  Object.keys(produccion.lineaAlma.mocks).map((grupo) => [grupo, true])
) as { [K in keyof GruposMockAlma]: boolean };

type GruposMockSeguridad = typeof produccion.seguridadPyB.mocks;

const seguridadSimulada = Object.fromEntries(
  Object.keys(produccion.seguridadPyB.mocks).map((grupo) => [grupo, true])
) as { [K in keyof GruposMockSeguridad]: boolean };

export const environment = {
  ...produccion,
  seguridadPyB: {
    mocks: seguridadSimulada
  },
  lineaAlma: {
    ...produccion.lineaAlma,
    // Con el servidor simulado se muestran también los campos que el backend real aún no admite.
    extensiones: true,
    mocks: todosLosGruposSimulados
  },
  uad: {
    adaptador: 'mock' as 'mock' | 'http'
  },
  features: {
    ...produccion.features,
    uadQuejaAnonima: true,
    uadMisReportes: true
  }
};
