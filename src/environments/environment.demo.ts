import { environment as produccion } from './environment.prod';

/**
 * Entorno de **demostración** para la vista previa en Vercel (`npm run deploy:vercel:demo`).
 *
 * Hereda todo de producción (backend QA, cuentas de prueba apagadas, feature flags) y solo cambia
 * los adaptadores de los módulos que aún no tienen backend, para poder mostrarlos con datos
 * sintéticos. Así, cualquier clave nueva de `environment.prod.ts` llega aquí sin tocar este archivo.
 *
 * - UAD Equipos 3 y 4: adaptador mock (el backend no tiene rutas `/uad`; ver
 *   `docs/contratos/uad/AUDITORIA_UAD.md`). Las pantallas muestran la franja «Datos de demostración».
 * - Línea Alma (APH y Psicología): todos los grupos del servidor simulado encendidos. El interceptor
 *   solo atiende `{apiBaseUrl}/alma/...`, así que no oculta endpoints reales del backend. Se generan
 *   a partir de las claves de producción: un grupo nuevo queda simulado sin tocar este archivo.
 *
 * Se compila con `ng build --configuration production,demo` (`angular.json`). **Nunca** se usa en
 * el despliegue de producción: `npm run build` y `deploy:vercel` siguen usando `environment.prod.ts`.
 */
type GruposMockAlma = typeof produccion.lineaAlma.mocks;

const todosLosGruposSimulados = Object.fromEntries(
  Object.keys(produccion.lineaAlma.mocks).map((grupo) => [grupo, true])
) as { [K in keyof GruposMockAlma]: boolean };

export const environment = {
  ...produccion,
  lineaAlma: {
    ...produccion.lineaAlma,
    mocks: todosLosGruposSimulados
  },
  uad: {
    adaptador: 'mock' as 'mock' | 'http'
  }
};
