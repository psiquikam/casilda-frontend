# Evidencia 04 — Verificación final

Fecha: 31 de agosto de 2026. Entorno: Node 24.18.0, npm 11.16.0, Angular 21.2.22.

Commits funcionales verificados: `e81b8c2`, `9589c6c` y `51b2b24`.

| Control | Resultado |
|---|---|
| `npm run lint` | exit 0; 0 errores y 303 advertencias controladas |
| `npm run test:ci` | exit 0; 56/56 pruebas exitosas |
| Cobertura de sentencias | 30,27 % — 1068/3528 |
| Cobertura de ramas | 8,76 % — 154/1756 |
| Cobertura de funciones | 20,10 % — 191/950 |
| Cobertura de líneas | 30,93 % — 1032/3336 |
| `npm run build` | exit 0; 13,048 s |
| Bundle inicial | 877,25 kB raw / 198,93 kB estimados |
| `npm run audit:prod` | exit 0; 0 vulnerabilidades productivas |

El build conserva cuatro advertencias de presupuesto SCSS previamente inventariadas. No hay referencias registradas a SVG inexistentes ni errores de recuperación de iconos en la salida de pruebas.

## Riesgo externo pendiente

`environment.prod.ts` todavía referencia una API HTTP. Un frontend HTTPS requiere un endpoint HTTPS válido o parametrización de despliegue coordinada. Se documenta como bloqueo externo porque cambiar el protocolo o inventar otro host sin comprobar soporte modificaría el contrato de infraestructura, fuera del alcance frontend autorizado.
