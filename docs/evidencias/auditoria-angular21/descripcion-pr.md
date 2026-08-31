## Objetivo

Agregar la segunda versión de la auditoría de migración React–Angular, actualizada al estado real de Angular 21, junto con una línea base reproducible y un plan de acción frontend detallado.

## Rama y base

- Rama: `chore/01/002/casilda/auditoria-angular21-plan`.
- Base: `main` en `58b25e670b93289b14ba3ac958c83e4a62d0bb2d`.
- Excepción: la rama nace de `main` por instrucción expresa del responsable, debido a que no existe una rama `release` local ni remota.
- Destino del PR: `main`.

## Alcance

- preserva sin cambios la auditoría original de Angular 17;
- agrega `auditoria-migracion-react-angular-v2.md` para Angular 21;
- agrega evidencia de instalación, dependencias, build, pruebas, vulnerabilidades y métricas estáticas;
- agrega un plan de 12 tareas con archivos, pruebas, gates, commits y rollback;
- incorpora la idea de logo entregada como insumo histórico;
- mantiene fuera de alcance cualquier implementación o contrato backend.

## Evidencia ejecutada

| Comando | Resultado |
|---|---|
| `npm install` | exit 0; 952 paquetes añadidos |
| `npm ls react react-dom react-router react-router-dom react-scripts @types/react @types/react-dom --all` | árbol vacío |
| `npm run build` | exit 0; 55,563 s |
| `npm test -- --watch=false --browsers=ChromeHeadless` | exit 0; 46/46 pruebas |
| `npm audit --omit=dev --json` | 0 vulnerabilidades de producción |

Bundle inicial: 1,97 MB raw / 328,95 kB estimados. El build informa dos imports no usados y cuatro estilos por encima del budget de 6 kB.

La suite termina verde, pero registra errores de iconos en consola y sus 46 casos son pruebas superficiales de creación. Ambos hallazgos quedan tratados en el plan.

## Integridad de insumos

- SHA-256 de la auditoría original: `DBDB3A29985A9D5048C1767A498FFE04AE5364B8CFD7C8181DC2EE539E0043F9`.
- SHA-256 de la idea de logo: `A93846BDF3DEDC0C445DCB0B4953BDCBC2548D354B95687CFD83AE35E2381641`.
- El PDF de procedimiento que aparecía abierto en el IDE no estaba presente en disco al crear el worktree y no se incorpora al PR.

## Riesgos y rollback

Este PR es documental y no modifica código productivo ni configuración. El rollback consiste en revertir sus commits; los archivos productivos existentes permanecen sin cambios.

El documento v1 contiene espacios finales usados como saltos de línea Markdown. Se preservan deliberadamente para mantener su hash; `git diff --check` se ejecuta sobre el resto del cambio excluyendo ese archivo histórico.

## Deuda pospuesta

La implementación del plan no forma parte de este primer corte documental. Cualquier ejecución posterior debe permanecer en la misma rama y PR si el responsable mantiene esa decisión, y completar la evidencia final antes del merge.
