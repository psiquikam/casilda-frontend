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
 *
 * Se compila con `ng build --configuration production,demo` (`angular.json`). **Nunca** se usa en
 * el despliegue de producción: `npm run build` y `deploy:vercel` siguen usando `environment.prod.ts`.
 */
export const environment = {
  ...produccion,
  uad: {
    adaptador: 'mock' as 'mock' | 'http'
  }
};
