# Auditoría y plan de estabilización: base Angular 17 certificada

**Repositorio:** `casilda-frontend`  
**Rama y revisión analizada:** `main` — `b2f0fa2`  
**Fecha de la auditoría:** 26 de agosto de 2026  
**Versión actual comprobada:** Angular 17.3.12 / Angular CLI 17.3.17  
**Versión objetivo de este documento:** Angular 17.3.x estable y certificada  
**Alcance:** árbol de trabajo, referencias Git disponibles en el clon, dependencias, configuración de Angular/TypeScript/Vercel, código fuente, assets, compilación, pruebas unitarias y tareas necesarias para cerrar M1.

> Este documento cubre exclusivamente **M1: cerrar la migración desde React y estabilizar/certificar Angular 17**. La actualización a Angular 21 y el refactor estructural son trabajos futuros fuera de alcance. No se incluyen aquí sus comandos, arquitectura objetivo ni plan de ejecución.

## 0. Cómo usar este documento

Este informe no es solamente una lista de observaciones. Debe utilizarse como contrato técnico para planear issues, pull requests, revisiones y criterios de aceptación.

Mapa de lectura:

- secciones 1–3: diagnóstico, evidencias y hallazgos;
- secciones 4–6: plan de saneamiento, aceptación y dictamen;
- sección 7: entregables, PRs y gate final de M1;
- sección 8: inventario verificable para convertir M1 en issues;
- sección 9: riesgos, rollback y Definition of Done de M1.

El único hito definido es:

1. **M1 — Base Angular 17 certificada:** repositorio reproducible, sin React, build y pruebas verdes, CI activa, configuración limpia, rutas productivas sin simulaciones y comportamiento crítico caracterizado.

### Regla de decisión

- Si una modificación es necesaria para que Angular 17 compile, se pruebe, sea reproducible o deje de mostrar datos simulados como reales, pertenece a **M1**.
- Si una modificación actualiza el major de Angular, cambia la arquitectura por features, divide componentes, migra masivamente formularios o moderniza APIs Angular, queda **fuera de alcance de este documento**.
- Si una modificación cambia comportamiento de negocio, debe tener un issue funcional separado; no se debe presentar como “limpieza técnica”.

### Qué significa “primera parte lista”

Para este repositorio, la primera parte se considera terminada únicamente cuando se cumplan todos los criterios del hito M1 descritos en la sección 7. **Encontrar cero coincidencias de React no es suficiente**: también debe poder demostrarse desde una instalación limpia y mediante CI.

## 1. Conclusión ejecutiva

El árbol actual **ya es una aplicación Angular y no contiene código React detectable**. No se encontraron:

- dependencias directas o transitivas `react`, `react-dom`, `react-router`, `react-scripts` o tipos de React;
- archivos `.jsx` o `.tsx`;
- imports de React, hooks, `ReactDOM`, `createRoot`, `className`, `dangerouslySetInnerHTML`, configuración de Create React App, Next.js o Vite propia;
- nombres de archivos u objetos React en las referencias Git actualmente disponibles en el clon.

La aplicación arranca con `bootstrapApplication`, usa rutas Angular, `HttpClient`, RxJS, Angular Material y 50 de 50 componentes declaran `standalone: true`. Tampoco existen archivos `*.module.ts` ni un arranque legado con `bootstrapModule`.

Por tanto, el trabajo pendiente no es una conversión de React: es **cerrar y hacer demostrable la migración**, corregir deuda técnica Angular y evitar que vuelvan a entrar dependencias o archivos React.

Sin embargo, **Angular-only no equivale todavía a migración funcional completa**: quejas, seguimiento, dashboard del revisor y mis asignaciones contienen simulaciones o datos fijos. Estos cuatro flujos deben resolverse en M1 antes de comenzar la actualización a Angular 21.

La conclusión tiene un límite forense: la versión React mencionada no está en el historial Git alcanzable desde este clon. El commit raíz disponible es del 20 de enero de 2026 y no contiene esa aplicación anterior. Para comparar paridad funcional o asegurar que ningún archivo se perdió durante la migración se necesita la rama, etiqueta, commit o repositorio anterior de React.

## 2. Estado comprobado

| Control | Resultado | Estado |
|---|---:|---|
| Dependencias React (`npm ls`) | árbol vacío | Correcto |
| Marcadores React en fuentes/configuración | 0 coincidencias | Correcto |
| Archivos JSX/TSX | 0 | Correcto |
| Componentes Angular standalone | 50/50 | Correcto |
| `NgModule` / `*.module.ts` | 0 | Correcto |
| Compilación de producción | exitosa | Correcto con advertencias |
| Pruebas unitarias | no compilan | Bloqueante |
| Flujos con datos simulados | 4 rutas activas | Bloqueante |
| Lockfile versionado | no | Bloqueante |
| CI automatizada | no existe | Alto |
| Lint/format automatizado | no existe | Alto |
| Versión Angular | 17.3.12, fuera de soporte | Alto |
| Auditoría npm | 52 avisos; 10 altos en dependencias de producción | Alto |

### Evidencia de que el proyecto es Angular

- `src/main.ts` usa `bootstrapApplication(AppComponent, appConfig)`.
- `angular.json` usa el builder `@angular-devkit/build-angular:application` y toma `src/main.ts` como entrada de navegador.
- `app.config.ts` configura rutas, animaciones, `HttpClient` e interceptores Angular.
- `package.json` solo declara Angular, Angular Material/CDK, RxJS, SweetAlert2, TypeScript, Zone.js y herramientas de pruebas Angular.
- Los 50 componentes encontrados son standalone.
- `npm ls react react-dom react-router react-router-dom react-scripts @types/react @types/react-dom --all` devolvió `(empty)`.

### Aclaración sobre Vite

`node_modules` sí puede contener `vite`, pero **no es un residuo de React**. `npm explain vite` muestra que llega de forma transitiva desde `@angular-devkit/build-angular@17.3.17`. No debe eliminarse manualmente ni usarse como indicador de que la aplicación sigue siendo React.

## 3. Hallazgos priorizados

### P0 — Hay flujos de producción simulados o incompletos

La ausencia de React no significa que toda la funcionalidad ya haya sido migrada. Cuatro rutas activas contienen datos o respuestas simuladas:

| Ruta | Archivo | Evidencia | Riesgo |
|---|---|---|---|
| `/nueva-queja` | `formulario-queja.component.ts` | `enviarQueja()` no llama ningún servicio; genera `CAS-####` con `Math.random()` y muestra éxito | se informa al usuario que la queja quedó registrada aunque no existe persistencia comprobable |
| `/seguimiento` | `seguimiento-tramite.component.ts` | decide el flujo por prefijo, llama `simularResultado()` y genera días aleatorios | puede mostrar a una persona un estado falso de su trámite |
| `/dashboard-revisor` | `dashboard-revisor.component.ts` | estadísticas, quejas y acompañamientos están escritos como objetos fijos en el componente | el revisor observa métricas y casos que no vienen del sistema |
| `/mis-asignaciones` | `mis-asignaciones.component.ts` | `misCasos` contiene cuatro registros fijos y el propio comentario los identifica como “Datos simulados” | la bandeja no representa las asignaciones del usuario autenticado |

Este es el indicio más claro de una **migración funcional incompleta**, aunque técnicamente el código sea Angular. Antes de aprobar M1 se debe tomar una decisión explícita para cada ruta:

1. conectarla al endpoint real mediante un servicio Angular tipado;
2. ocultarla/deshabilitarla temporalmente si el backend todavía no existe; o
3. identificarla visiblemente como prototipo solo en un entorno no productivo.

No es aceptable mantener la ruta habilitada en producción y presentar datos simulados como reales. Para cada integración se debe documentar endpoint, método HTTP, request, response, errores, permisos y responsable backend. El código de radicado siempre debe provenir del backend o de un contrato transaccional equivalente; no debe generarse en el navegador.

### P0 — Las pruebas no constituyen una barrera de calidad

`npm test -- --watch=false --browsers=ChromeHeadless` termina con código 1 antes de ejecutar la suite. Hay siete archivos de prueba obsoletos:

1. `src/app/app.component.spec.ts` todavía espera el `title` y el HTML de bienvenida generado por Angular CLI, que ya no existen.
2. `casilda-card.component.spec.ts` importa `CASILDACARDComponent`, pero la clase real es `CasildaCardComponent`.
3. `dialog-exito.component.spec.ts` importa `DialogExitoComponent`, pero la clase real es `DialogoExitoComponent`.
4. `gestion-contacto.component.spec.ts` importa `DetalleAconpanamientoComponent`, pero la clase real es `DetalleAcompanamientoComponent`.
5. `modal-asignar-cita.component.spec.ts` importa `ModalAsignarCitaComponent`, pero la clase real es `AsignarCitaModalComponent`.
6. `modal-gestion-contacto.component.spec.ts` importa `ModalGestionContactoComponent`, pero la clase real es `ModalGestionComponent`.
7. `modal-reprogramar-cita.component.spec.ts` importa `ReprogramarCitaComponent`, pero la clase real es `ReprogramarCitaModalComponent`.

Además, cinco componentes no tienen un `*.component.spec.ts` con el mismo nombre:

- `caso`;
- `modal-agregar-caso`;
- `modal-medidas-proteccion`;
- `modal-presunto-agresor`;
- `modal-reparto` (hay un spec llamado `reparto-modal.component.spec.ts`, con nomenclatura invertida).

**Impacto:** hoy se puede fusionar código roto o reintroducir tecnología ajena sin que exista una validación automatizada confiable.

### P0 — Instalaciones no reproducibles

`.gitignore` excluye expresamente `package-lock.json` y `yarn.lock`. No hay ningún lockfile versionado, aunque Vercel ejecuta `npm install`.

**Impacto:** dos instalaciones pueden resolver versiones transitivas distintas; los resultados de compilación y seguridad cambian con el tiempo. También impide usar `npm ci`, que debe ser el camino de CI/despliegue una vez fijado npm como gestor.

### P1 — Angular 17 está fuera de soporte y presenta avisos de seguridad

La instalación resolvió Angular 17.3.12/CLI 17.3.17. La [tabla oficial de compatibilidad](https://angular.dev/reference/versions) clasifica Angular 17 entre las versiones sin soporte. La auditoría observada reportó:

- 52 vulnerabilidades totales: 4 bajas, 15 moderadas, 32 altas y 1 crítica;
- 10 vulnerabilidades altas al ejecutar `npm audit --omit=dev`.

No debe ejecutarse `npm audit fix --force` durante M1: npm propone saltos mayores y eso queda fuera del alcance de este documento. M1 debe registrar una línea base reproducible de vulnerabilidades y evitar introducir avisos nuevos.

### P1 — Runtime local incompatible con Angular 17

`package.json` exige Node `20.x`, pero la auditoría se ejecutó con Node 24.18.0. Angular CLI lo marcó como no soportado. Para Angular 17.3, la matriz oficial admite Node `^18.13.0` o `^20.9.0`, no Node 24.

La compilación fue exitosa pese a ello, pero esa ejecución no sustituye una validación en Node 20. Se recomienda fijar el runtime con `.nvmrc`/Volta y validarlo también en CI. Cuando se actualice Angular, debe ajustarse Node según la matriz oficial.

### P1 — No hay CI, lint ni prueba explícita “Angular-only”

`.github` solo contiene instrucciones para Copilot; no hay workflows. `package.json` tampoco tiene scripts de lint, format, verificación de tipos separada o E2E.

**Impacto:** la condición “sin React” depende de revisiones manuales. No existe una regla que rechace `.jsx`, `.tsx`, imports React o dependencias React futuras.

### P1 — Arquitectura muy concentrada y carga inicial completamente eager

Todas las pantallas se importan directamente en `app.routes.ts`; no se usa `loadComponent`. La compilación de producción genera un paquete inicial de **1.84 MB sin comprimir** (estimado transferido: 308.65 kB).

Hay archivos que concentran demasiadas responsabilidades:

- `registro-atencion.component.ts`: 1,690 líneas;
- `registro-caso.component.ts`: 1,637 líneas;
- `registro-caso.component.html`: 1,386 líneas;
- `atencion-pr.component.ts`: 1,033 líneas;
- `solicitud.service.ts`: 765 líneas.

Esto no es React residual, pero sí indica que parte de la migración pudo trasladarse como pantallas monolíticas en vez de quedar organizada en componentes, facades/servicios y modelos Angular más pequeños.

### P1 — Calidad de tipos y manejo RxJS inconsistentes

Se contaron 160 marcadores de tipado laxo (`any`, `as any` y similares). Como aproximación adicional, hay 156 llamadas a `.subscribe(` frente a 75 propiedades `error:`; esta comparación no prueba cada caso individual, pero amerita revisar los `subscribe` sin manejo explícito de error, de acuerdo con las reglas del proyecto.

Conviene también usar `takeUntilDestroyed`, `async` pipe o signals donde aplique para reducir suscripciones manuales y riesgos de fuga.

La inyección también está mezclada: 38 archivos TypeScript contienen constructor injection, 35 usan `inject()` y 25 contienen ambos estilos. No bloquea M1 y no debe corregirse de forma masiva en esta etapa; se registra como deuda futura.

### P1 — El estándar de formularios reactivos no se cumple de forma uniforme

La convención interna exige `ReactiveFormsModule`, `FormBuilder`, `FormGroup` y `Validators`. Sin embargo:

- 19 componentes importan `FormsModule`;
- 15 componentes importan `ReactiveFormsModule`;
- 17 plantillas usan `[(ngModel)]`;
- `registro-caso` y `registro-atencion` mezclan `FormsModule` y `ReactiveFormsModule`.

Las 17 plantillas con `ngModel` son:

- `gestion-listas`;
- `modal-activar-ruta`;
- `modal-apreciacion-juridica`;
- `modal-apreciacion-psicologica`;
- `modal-compromisos-profesionales`;
- `modal-compromisos-persona`;
- `modal-correo`;
- `modal-discapacidad`;
- `modal-hechos`;
- `modal-medidas-proteccion`;
- `modal-presunto-agresor`;
- `modal-remision`;
- `modal-seguimiento`;
- `modal-telefono`;
- `registro-caso`;
- `registro-atencion`;
- `seguimiento-tramite`.

Esto no bloquea la compilación, pero dificulta validaciones consistentes, formularios tipados y pruebas. La conversión general queda fuera de M1. Durante M1 solo se modifica un formulario si es necesario para reparar una prueba, corregir un defecto comprobado o integrar uno de los flujos simulados; el resto se registra como deuda futura.

### P1 — Existen catálogos hardcodeados contra la convención del proyecto

Se encontraron opciones escritas directamente en plantillas:

- `formulario-queja.component.html`: `Masculino`, `Femenino`, `Otro`, `Estudiante`, `Docente` y `Administrativo`;
- `dialog-usuario.component.html`: `Activo` e `Inactivo`.

También hay listas fijas en TypeScript que deben contrastarse con maestros o reglas explícitas de dominio:

- `registro-caso.component.ts` y `registro-atencion.component.ts`: `catalogoSeguimiento` contiene `Presencial`, `Telefónico`, `Virtual` y `Visita Domiciliaria`;
- `modal-direccion.component.ts`: `vias` contiene seis tipos de vía y, además, conserva imports/propiedades HTTP que no utiliza.

Los seis valores de sexo/cargo deben sustituirse por listas maestras del backend. Los estados de usuario, modalidades de seguimiento y tipos de vía deben contrastarse con el contrato backend: si son enums estables de API se debe crear un tipo explícito y documentado; si el backend ofrece catálogo, deben cargarse desde allí. No se deben cambiar los valores enviados sin una prueba de contrato, porque la etiqueta visible y el valor de API pueden ser diferentes.

### P1 — Duplicación extensa en flujos centrales

La comparación entre `registro-caso.component.ts` y `registro-atencion.component.ts` muestra solo 163 líneas añadidas y 110 eliminadas entre archivos de 1,637 y 1,690 líneas. Comparten formularios, catálogos, modales, mapeos y guardado de pestañas. `caso.component.ts` y `consulta.component.ts` también son variantes muy cercanas: 48 líneas añadidas y 15 eliminadas.

**Riesgo:** una corrección aplicada en un flujo puede quedar ausente en el otro. La descomposición queda fuera de M1. En esta etapa se deben crear pruebas de caracterización y evitar cambios divergentes; tampoco debe introducirse una superclase como “solución rápida”.

### P1 — `SolicitudService` agrupa demasiados dominios

`solicitud.service.ts` tiene 765 líneas, 49 interfaces/DTOs exportados, dos enums y cinco URLs base: solicitudes, citas, casos, atenciones y compromisos. También contiene conversión de archivos a Base64, catálogos y un método `registrarPestana(tabIndex, datos: any): Observable<any>` que decide el endpoint con base en un índice visual.

El índice de una pestaña es un detalle de UI y no debería decidir una operación HTTP. Dividir este servicio es deuda arquitectónica fuera de M1. En M1 se caracteriza su comportamiento actual y solo se extrae código si resulta indispensable para sustituir una simulación productiva.

### P1 — Acceso HTTP disperso en componentes

17 componentes inyectan `HttpClient` directamente. La guía permite hacerlo para listas maestras, pero la cantidad actual produce endpoints, fallbacks y transformaciones repetidos. La reorganización general queda fuera de M1. Sí pertenece a M1 retirar imports HTTP muertos y usar servicios tipados en las cuatro integraciones que reemplazan simulaciones.

`ListasService` también requiere ajuste: carga ocho listas al construirse, mantiene estado mutable, mezcla métodos que devuelven observables con métodos que se suscriben internamente y silencia fallos devolviendo arreglos vacíos. En M1 se documenta y prueba el comportamiento del que dependan los flujos críticos; su rediseño completo queda pospuesto.

### P1 — Riesgos en sesión y autorización

El token y el usuario completo se guardan en `localStorage`. Además:

- `JSON.parse` se ejecuta sin manejar datos corruptos;
- `isAuthenticated()` solo comprueba que exista un objeto, no expiración/validez del token;
- `isUsuario()` devuelve `true` para una sesión inexistente porque se define como “no Admin/Revisor”;
- producción usa HTTP, por lo que no hay garantía de transporte seguro;
- la protección del frontend no sustituye autorización del backend.

Antes de cambiar el almacenamiento del token se necesita coordinación con backend. La opción preferible es cookie `HttpOnly`, `Secure` y `SameSite` con protección CSRF cuando la arquitectura lo permita. Si se mantiene token bearer en almacenamiento web, debe documentarse el riesgo XSS, validar expiración, manejar JSON inválido y evitar exponer información innecesaria. En todos los casos, el backend debe validar roles para cada endpoint.

### P2 — Nombres de archivo, clase y función no son coherentes

Además de romper pruebas, hay nombres que dificultan encontrar el código:

| Archivo actual | Clase actual | Nombre recomendado |
|---|---|---|
| `gestion-contacto.component.ts` | `DetalleAcompanamientoComponent` | archivo y clase `detalle-acompanamiento` / `DetalleAcompanamientoComponent` |
| `dialog-exito.component.ts` | `DialogoExitoComponent` | unificar en `dialogo-exito` / `DialogoExitoComponent` |
| `modal-asignar-cita.component.ts` | `AsignarCitaModalComponent` | `modal-asignar-cita` / `ModalAsignarCitaComponent` |
| `modal-gestion-contacto.component.ts` | `ModalGestionComponent` | `modal-gestion-contacto` / `ModalGestionContactoComponent` |
| `modal-reparto.component.ts` | `RepartoModalComponent` | `modal-reparto` / `ModalRepartoComponent` |
| `modal-seguimiento.component.ts` | `ModalSeguimientosComponent` | `modal-seguimiento` / `ModalSeguimientoComponent` |

Los renombres deben hacerse en un PR aislado, actualizando clase, archivos TS/HTML/SCSS/spec, imports y referencias de `MatDialog`. No se debe mantener aliases permanentes solo para que pruebas antiguas compilen.

### P2 — Configuración y assets por depurar

- `app.component.ts` registra `assets/AdminPara.svg` y `assets/Reportes.svg`, pero los archivos no existen. Actualmente esos nombres tampoco se usan en plantillas, por lo que son configuración muerta; deben eliminarse o agregarse los assets si realmente son requeridos.
- `src/casilda.svg` duplica exactamente `src/assets/casilda.svg` y no está incluido en los assets del build. Debe conservarse una sola copia.
- Hay archivos `.DS_Store` versionados en la raíz y en `src/`; deben eliminarse del índice y añadirse a `.gitignore`.
- `@angular/platform-browser-dynamic` no aparece importado por el código fuente. Es Angular, no React; se puede intentar retirar y validar build/tests antes de confirmar que sobra.
- `allowedCommonJsDependencies: ["sweetalert2"]` debe revisarse. Si el build moderno no emite advertencia CommonJS al retirarlo, conviene eliminar esa excepción.
- Vercel está configurado con `"framework": null` y `npm install`. El directorio de salida sí coincide con el build actual (`dist/casilda-fnsp/browser`), pero después de versionar el lockfile debe cambiarse la instalación a `npm ci` y verificarse un despliegue de preview.
- Los entornos de desarrollo y producción apuntan por HTTP a la misma IP. No es un rastro React, pero producción debería usar HTTPS y una URL gestionada por ambiente para evitar contenido mixto y despliegues acoplados.
- El `README.md` es el texto genérico de Angular CLI y menciona `ng e2e`, aunque no hay runner E2E configurado.

### P2 — Advertencias del presupuesto de estilos

La compilación de producción finalizó correctamente, pero cuatro hojas SCSS superan el presupuesto de 6 kB:

- `atencion-pr.component.scss`: 8.67 kB;
- `registro-caso.component.scss`: 7.53 kB;
- `formulario-acompanamiento.component.scss`: 6.20 kB;
- `registro-atencion.component.scss`: 7.55 kB.

No se recomienda subir el presupuesto sin revisar primero duplicaciones y estilos compartidos.

## 4. Plan paso a paso para cerrar la migración

### Fase 1 — Crear una línea base reproducible

1. Crear una rama de saneamiento y etiquetar el estado auditado.
2. Usar temporalmente Node 20 compatible con Angular 17 (mínimo 20.9) y documentarlo en `.nvmrc` o Volta.
3. Elegir npm como único gestor, quitar `/package-lock.json` de `.gitignore`, regenerar el lockfile bajo la versión de Node/npm acordada y versionarlo.
4. Cambiar Vercel de `npm install` a `npm ci`.
5. Repetir desde un clon limpio:

```powershell
npm ci
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
npm audit --omit=dev
```

**Criterio de salida:** la misma instalación produce las mismas versiones en local, CI y Vercel.

### Fase 2 — Corregir la suite Angular

1. Corregir los seis nombres de clase desalineados en specs.
2. Reescribir las dos expectativas obsoletas de `AppComponent` para probar el comportamiento actual.
3. Renombrar el spec de `modal-reparto` y crear pruebas mínimas para los otros cuatro componentes sin spec.
4. Proveer en TestBed los servicios, router, `HttpClient` y datos de diálogos que cada standalone necesite.
5. Ejecutar toda la suite en modo headless hasta obtener exit code 0.

**Criterio de salida:** tests compilados y ejecutados, sin pruebas deshabilitadas para ocultar fallos.

### Fase 3 — Añadir una barrera automática contra React

1. Añadir un script `check:no-react` que falle si encuentra:
   - extensiones `.jsx` o `.tsx`;
   - imports de `react`, `react-dom`, `react-router*`;
   - `ReactDOM`, `createRoot`, hooks React, `className=` o `dangerouslySetInnerHTML`;
   - dependencias React en `package.json` o en `npm ls`.
2. Añadir ESLint para Angular/TypeScript y scripts `lint` y `check`.
3. Crear un workflow de GitHub Actions con Node fijado que ejecute:

```powershell
npm ci
npm run check:no-react
npm run lint
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
npm audit --omit=dev --audit-level=high
```

4. Proteger `main` para exigir el workflow antes de fusionar.

Un chequeo inicial puede usar `rg`, complementado con `npm ls` para no confundir archivos con dependencias:

```powershell
rg -n -i --hidden -g '!.git/**' -g '!node_modules/**' -g '!dist/**' `
  -g '*.ts' -g '*.html' -g '*.json' `
  'from ["'']react|react-dom|react-router|ReactDOM|createRoot|dangerouslySetInnerHTML|className='

Get-ChildItem -Recurse -File -Include *.jsx,*.tsx `
  | Where-Object FullName -NotMatch '\\(node_modules|dist)\\'

npm ls react react-dom react-router react-router-dom react-scripts `
  '@types/react' '@types/react-dom' --all
```

**Criterio de salida:** cualquier introducción futura de React hace fallar el pull request.

### Fase 4 — Limpiar configuración y residuos no funcionales

1. Eliminar los dos registros de iconos inexistentes o incorporar los archivos reales.
2. Eliminar una de las copias de `casilda.svg`, manteniendo la ubicada en `src/assets` si sigue en uso.
3. Ignorar y sacar del repositorio los `.DS_Store`.
4. Probar la retirada de `@angular/platform-browser-dynamic`; conservarla solo si build o tests demuestran que es necesaria.
5. Probar la retirada de la excepción CommonJS de SweetAlert2.
6. Actualizar `README.md` con arquitectura, versión de Node, instalación con `npm ci`, entornos, build, tests, lint y despliegue reales.
7. Sustituir los catálogos hardcodeados confirmados por maestros backend o enums de contrato explícitos.
8. Corregir restauración de sesión corrupta e `isUsuario()`, con pruebas de guards e interceptor.
9. Configurar una URL HTTPS de producción y separar claramente desarrollo/producción.

**Criterio de salida:** no quedan archivos huérfanos, referencias rotas ni instrucciones de operación falsas.

### Fase 5 — Sustituir simulaciones por integraciones reales

1. Priorizar `formulario-queja` y `seguimiento-tramite` porque exponen confirmaciones o estados directamente a personas usuarias.
2. Confirmar contratos backend y autorización para los cuatro flujos descritos en P0.
3. Implementar servicios/DTOs Angular y estados de carga, error, vacío y éxito.
4. Eliminar datos fijos y resultados aleatorios.
5. Crear pruebas de contrato HTTP, componentes y E2E.
6. Deshabilitar de producción cualquier ruta cuyo backend aún no exista.

**Criterio de salida:** ninguna ruta productiva presenta una simulación como dato real y las integraciones están caracterizadas por pruebas.

## 5. Lista final de aceptación de M1

- [ ] `npm ls` no muestra paquetes React.
- [ ] No existen `.jsx`, `.tsx`, imports ni sintaxis React fuera de documentación histórica explícita.
- [ ] `bootstrapApplication` es el único punto de arranque de la aplicación.
- [ ] Todos los componentes siguen siendo standalone o cualquier excepción está justificada.
- [ ] `package-lock.json` está versionado y local/CI/Vercel usan `npm ci`.
- [ ] Node y Angular cumplen la matriz oficial de compatibilidad.
- [ ] `npm run lint`, pruebas headless y build terminan con código 0.
- [ ] GitHub Actions exige el chequeo `no-react` antes de fusionar.
- [ ] No hay assets referenciados inexistentes ni archivos generados/OS versionados.
- [ ] Las vulnerabilidades que exigen un major posterior están registradas como excepción temporal con propietario y fecha de resolución.
- [ ] Las cuatro rutas identificadas no presentan datos simulados como reales.
- [ ] Existen pruebas de caracterización de los flujos críticos actuales.

## 6. Dictamen

**Código ejecutable actual:** Angular-only con alta confianza.  
**Migración certificable hoy:** parcial, porque faltan una suite verde, reproducibilidad, CI y la referencia histórica de React.  
**Orden de M1:** reproducibilidad → pruebas → detector no-React/CI → limpieza → integraciones reales → caracterización → certificación Angular 17.

La actualización a Angular 21 no forma parte de este documento y solo debe planearse después de aprobar el gate de M1.

## 7. Hito M1: especificación completa de la primera parte

M1 deja Angular 17 estable y certificable. Su objetivo no es modernizar toda la aplicación, sino crear una base confiable que permita detectar regresiones futuras.

### 7.1 Entregables obligatorios de M1

| Entregable | Cambio esperado | Evidencia de aceptación |
|---|---|---|
| Runtime fijado | `.nvmrc` o Volta con Node 20.19.x; `engines` coherente | `node --version` y `npx ng version` sin warning de incompatibilidad |
| Instalación reproducible | `package-lock.json` versionado; npm como gestor único | `npm ci` funciona en clon limpio |
| Pruebas reparadas | specs compilan y ejecutan | comando headless con exit code 0 |
| Lint | Angular ESLint configurado sin desactivar reglas masivamente | `npm run lint` con exit code 0 |
| Detector no-React | script versionado, no solo comando manual | `npm run check:no-react` con exit code 0 |
| CI | workflow para instalación, detector, lint, test y build | check obligatorio verde en PR |
| Limpieza | assets/referencias inválidas y `.DS_Store` resueltos | repo limpio y build sin 404 conocidos |
| Nomenclatura | archivos/clases/specs alineados | búsquedas/imports sin aliases obsoletos |
| Flujos reales | queja, seguimiento, dashboard y asignaciones sin simulaciones productivas | requests/responses probados o rutas deshabilitadas explícitamente |
| Caracterización | pruebas de flujos críticos existentes | resultados repetibles antes de actualizar |
| Operación | README real y Vercel con `npm ci` | desarrollador nuevo puede ejecutar el proyecto |

### 7.2 Secuencia recomendada de pull requests para M1

#### PR M1-01 — Runtime y lockfile

Archivos esperados: `.nvmrc` o `package.json` con Volta, `.gitignore`, `package-lock.json`, `package.json`, `vercel.json`, `README.md`.

Pasos:

1. Cambiar a Node 20.19.x.
2. Eliminar instalaciones generadas con Node 24.
3. Quitar `package-lock.json` de `.gitignore` y mantener ignorados `node_modules`, `dist`, `.angular` y cobertura.
4. Ejecutar `npm install` una sola vez para crear el lockfile.
5. En adelante usar `npm ci`.
6. Añadir `packageManager` a `package.json`, por ejemplo `npm@<versión-aprobada>`.
7. Cambiar `vercel.json` a `"installCommand": "npm ci"`.
8. Validar build en un clon o worktree limpio.

No actualizar Angular en este PR. Si `npm audit` cambia por haber creado el lockfile, registrar la nueva línea base.

#### PR M1-02 — Reparar compilación de tests y nomenclatura

1. Corregir las siete pruebas identificadas en P0.
2. Alinear nombres de archivo/clase de la tabla de nomenclatura.
3. Renombrar `reparto-modal.component.spec.ts` para que coincida con el componente.
4. Crear los specs faltantes.
5. Ejecutar la suite para descubrir la segunda capa de errores: proveedores ausentes, datos de diálogo, router, HTTP o animaciones.
6. Configurar TestBed con providers reales de testing; evitar `NO_ERRORS_SCHEMA` como solución general porque ocultaría errores de plantilla.
7. Sustituir pruebas generadas “should create” por expectativas útiles cuando el componente tenga lógica crítica.

Este PR puede ser grande por el estado actual de la suite, pero no debe cambiar lógica productiva salvo errores inequívocos cubiertos por una prueba.

#### PR M1-03 — ESLint, detector no-React y CI

1. Instalar la versión de Angular ESLint compatible con Angular 17.
2. Añadir scripts `lint`, `test:ci`, `check:no-react` y `check`.
3. Implementar el detector en un script versionado fuera de `src`, no como una expresión copiada en YAML.
4. Añadir GitHub Actions con Node y npm fijados.
5. Activar caché de npm basada en `package-lock.json`, pero ejecutar siempre `npm ci`.
6. Publicar resultados de pruebas/cobertura si el repositorio lo requiere.
7. Hacer obligatorio el check en protección de rama.

Las reglas iniciales de lint deben concentrarse en errores y consistencia. La deuda existente puede registrarse de forma explícita, pero no se debe añadir una exclusión global de `src/app/**`.

#### PR M1-04 — Limpieza técnica y seguridad base

1. Resolver iconos inexistentes y SVG duplicado.
2. Retirar `.DS_Store` del índice y añadir patrón global.
3. Revisar dependencia `platform-browser-dynamic` y excepción CommonJS.
4. Corregir README, comando de build y salida real.
5. Documentar entornos y exigir HTTPS para producción.
6. Eliminar imports Angular Material no utilizados mediante revisión/build, no solo búsqueda textual.
7. Resolver los cuatro warnings SCSS o registrar un issue por archivo con límite temporal; no aumentar budgets para silenciarlos.
8. Resolver los catálogos hardcodeados identificados, verificando valores con el contrato backend antes de cambiarlos.
9. Manejar JSON de sesión corrupto, corregir `isUsuario()` y probar sesión ausente, roles, 401 y 403.

#### PR M1-05 — Resolver flujos simulados

1. Acordar con backend el contrato de radicación de quejas, consulta pública de seguimiento, métricas del dashboard y asignaciones por profesional.
2. Crear o reutilizar servicios Angular tipados; los componentes no deben construir URLs ni generar identificadores de negocio.
3. Implementar estados `cargando`, `vacío`, `error`, `sin permiso` y `éxito` para cada ruta.
4. Obtener del backend el código de radicado y mostrar éxito únicamente después de una respuesta confirmada.
5. Eliminar objetos fijos, `simularResultado()` y `Math.random()` de los flujos de negocio.
6. Si un contrato backend no está disponible, retirar la ruta de navegación productiva y dejar documentado el bloqueo. No sustituir el backend por otra simulación silenciosa.
7. Añadir pruebas HTTP, de componente y E2E para los cuatro flujos.

Este PR puede dividirse por feature. Cada sub-PR debe ser funcionalmente completo y no mezclar actualización de Angular.

#### PR M1-06 — Pruebas de caracterización

Antes de actualizar versiones deben quedar cubiertos, como mínimo:

- bootstrap y layout público/privado;
- login correcto, login fallido, logout y restauración de sesión;
- `authGuard`, `roleGuard`, interceptor de token y respuesta 401/403;
- creación y edición de usuario;
- carga y mantenimiento de listas maestras;
- creación de solicitud de acompañamiento;
- consulta, asignación y detalle de solicitud;
- flujo cita → caso → atención;
- registro por pestañas y construcción de payloads;
- Línea ALMA: registro, remisión y contacto;
- carga, error y estado vacío en tablas.

Estas pruebas deben capturar el comportamiento vigente, incluso si luego se decide mejorarlo. Una mejora funcional se hará después con una prueba que muestre deliberadamente el cambio.

### 7.3 Gate de aprobación de M1

M1 no se aprueba si instalación, detector no-React, lint, tests, build o estado Git fallan:

```powershell
npm ci
npm run check:no-react
npm run lint
npm run test:ci
npm run build
git status --short
```

La auditoría se ejecuta aparte:

```powershell
npm audit --omit=dev --audit-level=high
```

M1 puede aceptar temporalmente el exit code distinto de cero causado por vulnerabilidades que solo se resuelvan actualizando el major de Angular, pero cada una debe quedar registrada con paquete, advisory, alcance producción/desarrollo, propietario y fecha prevista de resolución. CI debe publicar el reporte y comparar contra esa línea base; no debe ignorar silenciosamente vulnerabilidades nuevas.

M1 no se aprueba si cualquiera de las cuatro rutas simuladas continúa expuesta como funcional en producción. La ausencia temporal de un endpoint backend es un bloqueo explícito, no una razón para aprobar datos falsos.

Al aprobar M1 se debe crear un tag, por ejemplo `angular17-baseline`, y guardar:

- versiones de Node/npm/Angular;
- resultado de tests y build;
- tamaño de bundles;
- reporte de auditoría;
- capturas o resultado E2E de flujos críticos;
- listado de excepciones pendientes.

### 7.4 Límite exacto de M1

| Dentro de M1 | Fuera de M1 |
|---|---|
| comprobar y blindar la ausencia de React | actualizar Angular 17 a otro major |
| fijar Node/npm y versionar el lockfile | diseñar la arquitectura definitiva por features |
| reparar la suite actual y añadir caracterización crítica | dividir masivamente componentes o servicios |
| crear lint, detector no-React y CI | convertir todos los formularios a Reactive Forms |
| corregir nombres rotos, assets inválidos y configuración operativa | migrar masivamente a `inject()`, signals o control flow moderno |
| sustituir simulaciones productivas o deshabilitar sus rutas | lazy loading general, cambios visuales o modernizaciones opcionales |
| registrar deuda y vulnerabilidades que no pueden resolverse en Angular 17 | ejecutar cualquier actualización mayor de Angular |

Una tarea fuera de alcance se registra como deuda futura, pero no se implementa para aprobar M1. La única excepción es una extracción mínima necesaria para conectar uno de los cuatro flujos simulados con su backend; debe quedar limitada a ese contrato y cubierta por pruebas.

## 8. Inventario verificable de M1

Esta sección convierte los hallazgos que pertenecen a M1 en controles e issues concretos. Las métricas son una fotografía del commit auditado y deben volver a medirse al cerrar el hito.

### 8.1 Línea base medida

| Control | Valor auditado | Evidencia de cierre M1 |
|---|---:|---|
| Componentes standalone | 50/50 | el conteo se conserva |
| Archivos JSX/TSX | 0 | detector automático devuelve 0 |
| Dependencias React | 0 | `npm ls` devuelve árbol vacío |
| Specs | 46 | todos compilan y se ejecutan |
| Casos `it(...)` declarados | 48 | runner informa ejecución real; no solo compilación |
| Tests focalizados/deshabilitados | 0 | se conserva en 0 |
| Build de producción | exitoso | exit code 0 bajo Node fijado |
| Bundle inicial | 1.84 MB raw / 308.65 kB estimado | valor registrado para comparación futura |
| Componentes con warnings SCSS | 4 | resueltos o excepción M1 documentada |
| Lockfile versionado | 0 | existe un único `package-lock.json` versionado |
| Workflows CI | 0 | workflow obligatorio y verde |
| Rutas con simulaciones productivas | 4 | 0 expuestas como funcionalidad real |
| Assets registrados inexistentes | 2 | 0 |
| Archivos `.DS_Store` versionados | 2 | 0 |
| Vulnerabilidades observadas | 52 totales; 10 altas en producción | línea base fijada y excepciones temporales documentadas |

Las cifras de vulnerabilidades pueden cambiar al crear el lockfile, precisamente porque hoy la instalación no es reproducible. La línea base definitiva de M1 es la obtenida después de fijar Node/npm y versionar el lockfile.

### 8.2 Matriz exacta de reparación de pruebas

| Spec | Problema actual | Acción M1 |
|---|---|---|
| `app.component.spec.ts` | espera `app.title` y `Hello, Casilda-FNSP`, que ya no existen | probar creación, layout por ruta, router y estado de carga actuales |
| `casilda-card.component.spec.ts` | importa `CASILDACARDComponent` | alinear con `CasildaCardComponent` |
| `dialog-exito.component.spec.ts` | importa `DialogExitoComponent` | elegir el nombre definitivo, alinear archivo/clase y proveer datos del diálogo |
| `gestion-contacto.component.spec.ts` | usa `DetalleAconpanamientoComponent` | corregir a `DetalleAcompanamientoComponent` y configurar providers |
| `modal-asignar-cita.component.spec.ts` | espera `ModalAsignarCitaComponent` | alinear nomenclatura y datos de diálogo |
| `modal-gestion-contacto.component.spec.ts` | espera `ModalGestionContactoComponent` | alinear nomenclatura, HTTP y datos de diálogo |
| `modal-reprogramar-cita.component.spec.ts` | espera `ReprogramarCitaComponent` | alinear nomenclatura y providers HTTP |

Componentes sin spec equivalente:

- `caso`;
- `modal-agregar-caso`;
- `modal-medidas-proteccion`;
- `modal-presunto-agresor`;
- `modal-reparto`, cuyo spec actual se llama `reparto-modal.component.spec.ts`.

Después de corregir los errores de TypeScript se debe ejecutar toda la suite otra vez. Es esperable encontrar fallos de TestBed que hoy están ocultos por la primera capa de errores. No se aprueba M1 hasta que el runner termine con código 0.

No se permite resolver la suite mediante:

- `NO_ERRORS_SCHEMA` generalizado;
- exclusión de carpetas;
- conversión de `it` a `xit`;
- eliminación de expectativas sin reemplazo;
- mocks que hagan imposible comprobar las interacciones críticas.

### 8.3 Matriz de las rutas simuladas

| Ruta | Estado actual | Resolución aceptable en M1 |
|---|---|---|
| `/nueva-queja` | genera un radicado con `Math.random()` y muestra éxito sin persistencia | integrar endpoint real y usar el radicado backend; o retirar la ruta de producción |
| `/seguimiento` | calcula un resultado por prefijo y días aleatorios | integrar consulta real y manejar no encontrado/error; o retirar la ruta |
| `/dashboard-revisor` | métricas, quejas y acompañamientos fijos | integrar fuentes reales con carga/error/vacío; o retirar del menú productivo |
| `/mis-asignaciones` | cuatro casos fijos marcados como datos simulados | consultar asignaciones del usuario autenticado; o retirar la ruta |

Para cada integración deben quedar documentados:

1. endpoint y método HTTP;
2. request, response y DTOs;
3. autorización requerida;
4. estados de carga, vacío, error y reintento;
5. trazabilidad del código/radicado;
6. pruebas HTTP y de componente;
7. escenario E2E mínimo;
8. comportamiento cuando el backend no está disponible.

Ocultar la palabra “simulado”, cambiar los valores fijos o moverlos a un servicio no resuelve el hallazgo.

### 8.4 Inventario de rutas para smoke tests M1

| Ruta | Acceso actual | Smoke test requerido |
|---|---|---|
| `/home` | pública | render, navegación y assets |
| `/login` | pública | éxito, error, logout y redirección |
| `/seguimiento` | pública | consulta real, no encontrado y error |
| `/detalle-revisor/:id` | autenticado | acceso, ID válido/inválido y revisión del rol requerido |
| `/gestion-usuarios` | Admin | listado y operaciones autorizadas |
| `/dashboard-revisor` | Admin/Revisor | datos reales, carga, vacío y error |
| `/nueva-queja` | Admin/Revisor/Usuario según ruta actual | persistencia y radicado real; confirmar si debe ser pública |
| `/solicitud-acompanamiento` | Admin/Revisor/Usuario | creación y errores |
| `/gestion-sistema` | Admin | CRUD de maestros |
| `/mis-asignaciones` | Admin/Revisor | datos del usuario autenticado |
| `/detalle-acompanamiento/:id` | Admin/Revisor | detalle, historial e ID inválido |
| `/consulta` | Admin/Revisor | carga, filtros y vacío |
| `/registro-caso` | Admin/Revisor | origen y persistencia crítica |
| `/caso` | Admin/Revisor | listado y acciones |
| `/registro-atencion` | Admin/Revisor | origen y persistencia crítica |
| `/cita` | Admin/Revisor | asignar, reprogramar y cancelar |
| `/linea-alma/atencion-pr` | Admin/Revisor | registro, contacto y remisión |
| `/acceso-denegado` | pública | render sin información sensible |

Los guards del frontend no prueban autorización backend. Cuando un smoke test invoque una operación sensible, debe verificarse que el endpoint rechace roles no autorizados.

### 8.5 Especificación del detector no-React

El script `check:no-react` debe revisar como mínimo:

1. archivos `.jsx` y `.tsx`;
2. configuraciones propias de CRA, Next.js, Vite o React;
3. dependencias y devDependencies React del manifiesto;
4. árbol instalado mediante `npm ls`;
5. imports de `react`, `react-dom` y `react-router*`;
6. APIs/sintaxis como `ReactDOM`, `createRoot`, hooks, `className=` y `dangerouslySetInnerHTML`;
7. scripts de package como `react-scripts`, `next` o una entrada Vite propia.

Debe excluir:

- `.git`;
- `node_modules`;
- `dist`;
- `coverage`;
- documentación histórica que mencione React, incluido este informe.

Vite transitivo dentro de `@angular-devkit/build-angular` no es un fallo. Sí lo sería declarar Vite directamente, añadir `vite.config.*` o usarlo como punto de entrada de esta aplicación sin una decisión arquitectónica posterior.

Pruebas mínimas del detector:

- repositorio actual: exit code 0;
- fixture temporal con `sample.tsx`: exit code distinto de 0;
- fixture temporal con dependencia `react`: exit code distinto de 0;
- instalación Angular que contiene Vite transitivo: no produce falso positivo.

### 8.6 Pipeline mínimo de CI

Secuencia obligatoria:

```text
checkout
  → configurar Node/npm fijados
  → npm ci
  → npm run check:no-react
  → npm run lint
  → npm run test:ci
  → npm run build
  → npm audit --omit=dev
  → publicar resultados y artefactos
```

Scripts esperados:

```json
{
  "scripts": {
    "lint": "ng lint",
    "test:ci": "ng test --watch=false --browsers=ChromeHeadless",
    "check:no-react": "<script versionado>",
    "check": "npm run check:no-react && npm run lint && npm run test:ci && npm run build"
  }
}
```

La implementación concreta de ESLint debe usar versiones compatibles con Angular 17. No se deben desactivar globalmente reglas para conseguir una primera ejecución verde; si existe deuda, se corrige o se registra con exclusiones puntuales, justificadas y vencimiento.

El check obligatorio del pull request debe ser el workflow remoto. Que `npm run check` funcione en una máquina local no sustituye CI.

### 8.7 Evidencia obligatoria por PR de M1

Cada PR debe declarar:

- identificador `M1-01` a `M1-06`;
- objetivo y comportamiento que no debe cambiar;
- archivos afectados;
- contratos backend involucrados;
- comandos ejecutados y exit codes;
- pruebas añadidas/modificadas;
- capturas o payloads cuando aplique;
- variación de bundle y auditoría;
- riesgos y rollback;
- deuda deliberadamente pospuesta.

Un issue no está listo para desarrollo si solo dice “limpiar React”, “arreglar tests” o “configurar CI”. Debe nombrar archivos, resultado medible y evidencia de aceptación.

## 9. Riesgos y rollback de M1

| Riesgo | Prevención | Señal de detección |
|---|---|---|
| lockfile generado con runtime incorrecto | fijar Node/npm antes de regenerarlo | warning de Angular CLI o diferencias en `npm ls` |
| tests verdes ocultando plantillas rotas | evitar schemas/exclusiones globales | TestBed no renderiza dependencias reales |
| detector no-React con falsos positivos | fixtures positivos/negativos | falla por Vite transitivo de Angular |
| integración simulada reemplazada por otro mock | prueba HTTP y E2E con respuesta trazable | sigue apareciendo `Math.random` o data fija |
| cambio funcional accidental al renombrar | PR aislado y tests antes/después | diferencias de rutas, dialogs o payloads |
| CI distinta de Vercel | mismo Node, npm y `npm ci` | local/CI verde y deploy rojo |
| auditoría variable | lockfile versionado | conteos cambian sin modificar dependencias |
| autorización solo frontend | validar endpoints con roles | API acepta una operación no autorizada |

Rollback:

- cada PR M1 debe poder revertirse independientemente;
- el lockfile forma parte del cambio y del rollback;
- no mezclar integraciones de negocio con configuración de CI;
- no eliminar la ruta simulada sin coordinar navegación y comunicación funcional;
- al aprobar M1, crear el tag `angular17-baseline`.

## 10. Definition of Done de M1

M1 está completo únicamente cuando todos los puntos siguientes estén satisfechos:

### Repositorio Angular-only

- [ ] No existen `.jsx`, `.tsx`, imports, scripts ni dependencias React.
- [ ] `npm ls` no muestra React.
- [ ] Los 50 componentes continúan siendo standalone.
- [ ] `bootstrapApplication` continúa siendo el punto de arranque.
- [ ] El detector no-React está versionado, probado y es obligatorio en CI.

### Reproducibilidad

- [ ] Node 20 compatible con Angular 17 está fijado.
- [ ] La versión aprobada de npm está fijada/documentada.
- [ ] `package-lock.json` está versionado.
- [ ] Local, CI y Vercel usan `npm ci`.
- [ ] Un clon limpio puede instalar, probar y compilar siguiendo el README.

### Calidad y pruebas

- [ ] Los siete specs obsoletos están corregidos.
- [ ] Los componentes sin spec tienen cobertura mínima útil.
- [ ] No hay tests focalizados, deshabilitados o excluidos para ocultar fallos.
- [ ] `npm run lint` termina con código 0.
- [ ] `npm run test:ci` termina con código 0 e informa los casos ejecutados.
- [ ] `npm run build` termina con código 0.
- [ ] Los cuatro warnings SCSS están resueltos o tienen excepción temporal justificada.

### Funcionalidad real

- [ ] `/nueva-queja` no confirma una operación no persistida.
- [ ] `/seguimiento` no muestra estados aleatorios.
- [ ] `/dashboard-revisor` no presenta métricas/casos fijos como reales.
- [ ] `/mis-asignaciones` no presenta casos fijos como reales.
- [ ] Cada ruta tiene smoke test según la matriz.
- [ ] Carga, vacío y error están caracterizados en las integraciones críticas.

### Configuración y limpieza

- [ ] Los iconos inexistentes están eliminados o incorporados.
- [ ] Solo queda la copia válida de `casilda.svg`.
- [ ] Los `.DS_Store` no están versionados y se ignoran.
- [ ] La dependencia `platform-browser-dynamic` y la excepción CommonJS están justificadas o retiradas después de probar.
- [ ] Desarrollo y producción tienen configuración documentada; producción usa HTTPS o registra bloqueo externo explícito.
- [ ] README, Vercel y salida real del build son coherentes.

### Seguridad y cierre

- [ ] Los casos de sesión corrupta, sin sesión, 401 y 403 están probados.
- [ ] El comportamiento incorrecto de `isUsuario()` está corregido y probado.
- [ ] Las vulnerabilidades se midieron con el lockfile definitivo.
- [ ] Toda excepción temporal tiene advisory, alcance, propietario y vencimiento.
- [ ] CI está verde y es obligatorio para `main`.
- [ ] Se guardaron métricas, resultados y excepciones.
- [ ] Se creó el tag `angular17-baseline`.

## 11. Resultado esperado

Al cerrar este documento, el repositorio seguirá en Angular 17, pero contará con una base confiable y demostrable:

- completamente Angular y protegida contra reintroducción de React;
- instalable de forma reproducible;
- con build, lint y pruebas verdes;
- sin rutas que presenten simulaciones como datos reales;
- con configuración y despliegue documentados;
- con una línea base de seguridad y rendimiento;
- lista para que el equipo redacte, en un documento separado, la actualización a Angular 21.
