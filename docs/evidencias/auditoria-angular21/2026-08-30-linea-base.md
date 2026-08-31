# Evidencia de línea base — Angular 21

- **Fecha local:** 30 de agosto de 2026
- **Zona horaria:** America/Bogota
- **Commit:** `58b25e670b93289b14ba3ac958c83e4a62d0bb2d`
- **Rama:** `chore/01/002/casilda/auditoria-angular21-plan`
- **Entorno:** Windows 10, Node 24.18.0, npm 11.16.0, Chrome Headless 151.0.0.0

## Archivos de entrada preservados

- `docs/auditoria-migracion-react-angular.md`: copiado sin modificación desde el checkout principal.
- `src/assets/Casilda idea de logo.jpeg`: copiado sin modificación desde el checkout principal.
- `docs/Procedimiento de Versionado y control de código_Casilda_v1.0.0.pdf`: no estaba presente en disco al crear el worktree; las convenciones se tomaron del texto proporcionado por el responsable.

## Instalación

```powershell
npm install
```

- exit code: 0;
- duración aproximada: 4 minutos;
- paquetes añadidos: 952;
- árbol auditado por npm: 953 paquetes;
- resultado completo: 7 vulnerabilidades —4 moderadas y 3 altas—;
- `npm audit --omit=dev --json`: 0 vulnerabilidades de producción;
- advertencias de scripts pendientes: `esbuild`, `lmdb`, `msgpackr-extract`, `@parcel/watcher`;
- advertencias de deprecación relevantes: `@angular/platform-browser-dynamic`, `@angular/animations`.

El lockfile generado permanece ignorado por la configuración existente; no se añadió como parte de esta evidencia documental.

## Versiones instaladas

```text
@angular/core                    21.2.22
@angular/cli                     21.2.22
@angular-devkit/build-angular    21.2.22
@angular/material                21.2.14
@angular/cdk                     21.2.14
typescript                       5.9.3
rxjs                             7.8.2
zone.js                          0.15.1
karma                            6.4.4
```

`npm ls react react-dom react-router react-router-dom react-scripts @types/react @types/react-dom --all` devolvió `(empty)` con exit code 0.

## Build de producción

```powershell
npm run build
```

- exit code: 0;
- duración Angular: 55,563 s;
- salida: `dist/casilda-fnsp`;
- bundle inicial: 1,97 MB raw / 328,95 kB estimados;
- lazy chunk observado: 64,19 kB raw / 17,19 kB estimados.

Advertencias:

1. `RouterLink` no usado en `header.component.ts`.
2. `ModalPresuntoAgresorComponent` no usado en `registro-caso.component.ts`.
3. `registro-atencion.component.scss`: 7,72 kB frente a budget de 6 kB.
4. `atencion-pr.component.scss`: 8,86 kB frente a budget de 6 kB.
5. `formulario-acompanamiento.component.scss`: 6,32 kB frente a budget de 6 kB.
6. `registro-caso.component.scss`: 7,70 kB frente a budget de 6 kB.

## Pruebas

```powershell
npm test -- --watch=false --browsers=ChromeHeadless
```

- exit code: 0;
- runner: Karma 6.4.4;
- navegador: Chrome Headless 151.0.0.0;
- resultado: 46 de 46 casos exitosos;
- tiempo de aserciones informado: aproximadamente 1,5 s;
- tiempo previo de compilación: varios minutos;
- los 46 casos encontrados son pruebas de creación superficial.

Durante una ejecución verde se imprimieron errores `Unable to find icon` para iconos como `logo-custom`, `logo-login`, `uad-equipo`, `equipo-atencion`, `logo-alma`, `seguridad-bienes`, `reportes-indicadores` y `estadisticas-vbg`. Los archivos de varios de esos iconos sí existen; el problema observado es que los TestBed que renderizan componentes dependientes no preparan el registro global. La suite actual no falla ante estos errores de consola.

## Métricas estáticas

| Control | Resultado |
|---|---:|
| Componentes | 50 |
| Specs | 46 |
| Casos `it(...)` | 46 |
| Casos `should create` | 46 |
| Imports eager de componentes de ruta | 18 |
| `loadComponent` | 0 |
| Marcadores laxos aproximados | 163 |
| `.subscribe()` aproximados | 156 |
| `error:` aproximados | 75 |
| Componentes con `HttpClient` | 17 |
| Plantillas con `ngModel` | 17 |
| `.DS_Store` versionados | 2 |
| Lockfiles versionados | 0 |

## Hallazgos confirmados por búsqueda

- simulación: `formulario-queja.component.ts`, `seguimiento-tramite.component.ts`, `dashboard-revisor.component.ts` y `mis-asignaciones.component.ts`;
- referencias inexistentes: `assets/AdminPara.svg` y `assets/Reportes.svg`;
- URL productiva: `http://35.208.251.66:8080/api-casilda`;
- componentes sin spec equivalente: `caso`, `modal-agregar-caso`, `modal-medidas-proteccion`, `modal-presunto-agresor` y `modal-reparto`;
- archivos de mayor riesgo por tamaño: `registro-atencion.component.ts`, `registro-caso.component.ts`, `registro-caso.component.html`, `atencion-pr.component.ts` y `solicitud.service.ts`.

## Estado Git después de medir

La instalación y los comandos de validación no modificaron archivos versionados. Los únicos archivos destinados al PR son documentación de auditoría/evidencia y el insumo visual expresamente proporcionado.
