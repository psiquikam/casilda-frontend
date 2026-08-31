## Objetivo

Ejecutar la estabilización frontend de CASILDA sobre Angular 21, conservando la auditoría histórica y agregando su versión 2, evidencia reproducible y cambios productivos verificables. No incluye cambios backend.

## Rama y destino

- Rama: `chore/01/002/casilda/auditoria-angular21-plan`.
- Base: `main` en `58b25e670b93289b14ba3ac958c83e4a62d0bb2d`.
- Destino del PR: `main`.
- Excepción: nace de `main` por instrucción expresa del responsable; no existía una rama `release` local ni remota al iniciar.

## Cambios implementados

- conserva intacta `docs/auditoria-migracion-react-angular.md` y agrega la versión 2;
- versiona `package-lock.json`, fija Node 24.18.0/npm 11.16.0 y estandariza `npm ci`;
- agrega Angular ESLint, scripts de verificación y CI para PR/push;
- centraliza los iconos, elimina referencias inexistentes y la copia redundante `src/casilda.svg`;
- valida sesión persistida y expiración JWT; diferencia respuestas 401 y 403;
- bloquea cuatro prototipos en producción mediante capacidades tipadas y oculta su navegación;
- evita redirigir el login hacia el dashboard simulado;
- convierte las pantallas a carga diferida con `loadComponent`;
- corrige controles de navegación, foco, semántica de labels y comparaciones estrictas;
- incorpora una propuesta optimizada de logo sin sustituir el distintivo vigente;
- agrega pruebas útiles para sesión, interceptor, capacidades e iconos.

## Evidencia final

| Comando | Resultado |
|---|---|
| `npm ci` | exit 0; 952 paquetes |
| `npm run lint` | exit 0; 0 errores, 303 advertencias controladas |
| `npm run test:ci` | exit 0; suite ampliada y sin errores de iconos en consola |
| `npm run build` | exit 0 |
| `npm run audit:prod` | exit 0; 0 vulnerabilidades productivas |

El bundle inicial pasó de 1,97 MB raw / 328,95 kB estimados a 877,25 kB raw / 198,93 kB estimados: aproximadamente 55,5 % menos tamaño bruto inicial y 39,5 % menos transferencia estimada.

Persisten cuatro advertencias de presupuesto SCSS, ya inventariadas. La URL HTTP de producción requiere disponibilidad HTTPS o parametrización coordinada con despliegue/backend; no se inventó un endpoint alternativo.

## Integridad

- SHA-256 de la auditoría original: `DBDB3A29985A9D5048C1767A498FFE04AE5364B8CFD7C8181DC2EE539E0043F9`.
- SHA-256 de la idea de logo: `A93846BDF3DEDC0C445DCB0B4953BDCBC2548D354B95687CFD83AE35E2381641`.
- El PDF abierto en el IDE no estaba presente en disco y no se incorpora.

## Riesgos y rollback

Los prototipos siguen habilitados en desarrollo para revisión y deshabilitados en producción. Los guards frontend no reemplazan autorización backend. Cada grupo se entrega en commits convencionales separados y puede revertirse de manera independiente.
