# Plan de implementación para estabilizar el frontend Angular 21

> **Para trabajadores agénticos:** ejecutar este plan secuencialmente, tarea por tarea, en la rama indicada. Cada tarea termina en un commit revisable y no se inicia la siguiente si su gate falla.

**Objetivo:** convertir el frontend Angular 21 de CASILDA en una aplicación reproducible, verificable, segura en su alcance frontend, modular, accesible y sin prototipos presentados como funciones productivas.

**Arquitectura:** mantener componentes standalone y Angular Material, introducir límites `core`, `shared` y `features` de forma incremental, y cargar las pantallas secundarias mediante rutas lazy. Los contratos existentes se encapsulan con DTOs y facades tipados; ninguna tarea crea o modifica backend.

**Stack:** Angular 21.2.x, Angular Material/CDK 21.2.x, TypeScript 5.9.x, RxJS 7.8.x, Karma/Jasmine durante la estabilización, Angular ESLint, GitHub Actions y Vercel.

**Especificación:** `docs/auditoria-migracion-react-angular-v2.md`

## Restricciones globales

- Rama única: `chore/01/002/casilda/auditoria-angular21-plan`.
- PR único hacia `main`; se documenta que no existía una rama `release` al iniciar.
- Conventional Commits con tipo estándar y descripción en español.
- Sin cambios backend, endpoints nuevos ni contratos inventados.
- Angular permanece en 21.2.x durante este plan.
- Las cuatro funciones simuladas quedan desactivadas en producción.
- Los catálogos se consumen del backend solo cuando el endpoint ya existe y está comprobado.
- Cada commit debe dejar `npm run check` en verde después de que ese script exista.
- No usar `NO_ERRORS_SCHEMA`, `xit`, `xdescribe`, exclusiones globales ni aumento de budgets para ocultar fallos.
- No ejecutar `npm audit fix --force`.
- El documento histórico `docs/auditoria-migracion-react-angular.md` no se modifica.
- La evidencia de cada gate se agrega en `docs/evidencias/auditoria-angular21/`.

## Estructura de archivos objetivo

```text
.github/workflows/frontend-ci.yml            # gate remoto del PR
docs/identidad-visual-casilda.md              # reglas de logo e iconografía
docs/evidencias/auditoria-angular21/          # línea base y cierre
src/app/core/config/                          # capacidades por entorno
src/app/core/icons/                           # registro central de SVG
src/app/core/session/                         # persistencia y validación de sesión
src/app/shared/components/feature-unavailable/# fallback seguro
src/app/shared/models/                        # modelos UI reutilizables
src/app/features/                             # límites extraídos de forma incremental
src/app/app.routes.ts                         # composición de rutas eager/lazy
```

---

### Tarea 1: Hacer reproducible instalación, tooling y despliegue

**Archivos:**

- Modificar: `.gitignore`
- Crear: `.nvmrc`
- Modificar: `package.json`
- Crear y versionar: `package-lock.json`
- Crear: `eslint.config.js`
- Crear: `.github/workflows/frontend-ci.yml`
- Modificar: `vercel.json`
- Modificar: `README.md`

**Interfaces:**

- Produce: scripts `lint`, `test:ci`, `audit:prod` y `check` usados por todas las tareas siguientes.
- Fija: Node 24.18.0 y npm 11.16.0, que corresponden a la línea base verificada.

- [ ] **Paso 1: fijar runtime y gestor de paquetes**

Crear `.nvmrc` con:

```text
24.18.0
```

Agregar a `package.json`:

```json
{
  "packageManager": "npm@11.16.0",
  "engines": {
    "node": "24.18.0",
    "npm": "11.16.0"
  }
}
```

- [ ] **Paso 2: versionar el lockfile**

Eliminar `/package-lock.json` y `/yarn.lock` de `.gitignore`, retirar cualquier `yarn.lock` residual y ejecutar:

```powershell
npm install --package-lock-only
npm ci
```

Resultado esperado: un único `package-lock.json` seguido por instalación con exit code 0.

- [ ] **Paso 3: instalar y configurar Angular ESLint 21**

Ejecutar:

```powershell
npx ng add angular-eslint@21 --skip-confirmation
```

Configurar reglas iniciales para errores de TypeScript/Angular sin excluir `src/app/**`. Las advertencias preexistentes que no quepan en este commit se registran por archivo en la evidencia, con regla y justificación.

- [ ] **Paso 4: añadir scripts deterministas**

Dejar en `package.json`:

```json
{
  "scripts": {
    "lint": "ng lint",
    "test:ci": "ng test --watch=false --browsers=ChromeHeadless --code-coverage",
    "audit:prod": "npm audit --omit=dev --audit-level=high",
    "check": "npm run lint && npm run test:ci && npm run build"
  }
}
```

- [ ] **Paso 5: crear CI y alinear Vercel**

El workflow debe ejecutar, en orden: checkout, Node desde `.nvmrc`, `npm ci`, `npm run lint`, `npm run test:ci`, `npm run build`, `npm run audit:prod` y publicación de `coverage/` y `dist/`. Cambiar Vercel de `npm install` a `npm ci` y conservar `dist/casilda-fnsp/browser` como salida solo si coincide con el build real.

- [ ] **Paso 6: ejecutar el gate y registrar evidencia**

```powershell
npm ci
npm run lint
npm run test:ci
npm run build
npm run audit:prod
```

Guardar versiones, exit codes, vulnerabilidades y bundle en `docs/evidencias/auditoria-angular21/01-reproducibilidad.md`.

- [ ] **Paso 7: commit**

```powershell
git add .gitignore .nvmrc package.json package-lock.json eslint.config.js .github/workflows/frontend-ci.yml vercel.json README.md docs/evidencias/auditoria-angular21/01-reproducibilidad.md
git commit -m "chore: hace reproducible la instalación de Angular"
```

---

### Tarea 2: Convertir la suite actual en un gate confiable

**Archivos:**

- Modificar: `src/app/app.component.spec.ts`
- Modificar: los 45 specs de componentes existentes
- Crear: specs equivalentes para `caso`, `modal-agregar-caso`, `modal-medidas-proteccion` y `modal-presunto-agresor`
- Renombrar: `reparto-modal.component.spec.ts` a `modal-reparto.component.spec.ts`
- Crear: `src/app/core/icons/casilda-icon-registry.service.ts`
- Crear: `src/testing/fail-on-console-error.ts`
- Crear: `src/testing/icon-testing.providers.ts`
- Modificar: `tsconfig.spec.json`

**Interfaces:**

- Produce: `CasildaIconRegistry`, helper `provideCasildaIconsForTesting()` y fallo automático ante `console.error` inesperado.
- Conserva: Karma/Jasmine; Vitest no se mezcla con este saneamiento.

- [ ] **Paso 1: escribir una prueba que demuestre el error de iconos**

En `app.component.spec.ts`, renderizar el layout y comprobar que `console.error` no recibe mensajes `Unable to find icon`. Ejecutar el spec y confirmar que falla con el registro actual.

- [ ] **Paso 2: crear el registro central y sus providers de prueba**

Crear `CasildaIconRegistry` con la lista que hoy vive en `AppComponent` y un método `register(): void` idempotente. `AppComponent` lo inyecta y llama una sola vez; la limpieza de referencias y definición visual se completa en la Tarea 5.

Crear:

```typescript
export function provideCasildaIconsForTesting(): Provider[] {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [CasildaIconRegistry],
      useFactory: (icons: CasildaIconRegistry) => () => icons.register()
    }
  ];
}
```

Usarlo en specs que rendericen sidebar, header, login o app shell.

- [ ] **Paso 3: hacer fallar errores de consola**

Instalar en `beforeEach` global un spy que acumule `console.error`, restaurarlo en `afterEach` y fallar salvo que el caso declare explícitamente el error esperado. No silenciar mensajes.

- [ ] **Paso 4: reemplazar pruebas superficiales en flujos críticos**

Agregar expectativas de comportamiento para app shell, login, guards, interceptor, tablas, apertura/cierre de diálogos y mapeos de formularios. Cada spec debe comprobar al menos un resultado observable además de la creación.

- [ ] **Paso 5: crear specs faltantes y corregir nomenclatura**

Cada componente faltante debe verificar inputs requeridos, salida principal o validación del diálogo. `modal-reparto.component.spec.ts` importará `RepartoModalComponent` desde el archivo real mientras la tarea de nomenclatura decide el nombre definitivo.

- [ ] **Paso 6: ejecutar suite completa**

```powershell
npm run test:ci
```

Resultado esperado: exit code 0, cero errores de consola, 50 componentes con cobertura y reporte publicado.

- [ ] **Paso 7: commit**

```powershell
git add src/app src/testing tsconfig.spec.json docs/evidencias/auditoria-angular21/02-pruebas.md
git commit -m "test: establece controles de calidad frontend"
```

---

### Tarea 3: Deshabilitar prototipos en producción sin inventar backend

**Archivos:**

- Crear: `src/app/core/config/feature-capabilities.ts`
- Crear: `src/app/core/config/feature-capability.guard.ts`
- Crear: `src/app/shared/components/feature-unavailable/feature-unavailable.component.*`
- Modificar: `src/environments/environment.ts`
- Modificar: `src/environments/environment.prod.ts`
- Modificar: `src/app/app.routes.ts`
- Modificar: sidebar, public header y login
- Crear: specs de configuración, guard, navegación y fallback

**Interfaces:**

- Produce: tipo `FeatureCapability` y función `featureCapabilityGuard(capability)`.
- Capacidades: `complaintRegistration`, `publicTracking`, `reviewerDashboard`, `assignments`.

- [ ] **Paso 1: escribir pruebas de capacidades por entorno**

Comprobar que las cuatro capacidades son `false` en producción y que una capacidad deshabilitada retorna un `UrlTree` hacia `/funcion-no-disponible`.

- [ ] **Paso 2: implementar configuración tipada**

```typescript
export type FeatureCapability =
  | 'complaintRegistration'
  | 'publicTracking'
  | 'reviewerDashboard'
  | 'assignments';

export interface FeatureCapabilities {
  complaintRegistration: boolean;
  publicTracking: boolean;
  reviewerDashboard: boolean;
  assignments: boolean;
}
```

`environment.prod.ts` fija las cuatro en `false`. Desarrollo puede fijarlas en `true`, pero las pantallas deben mostrar `Modo prototipo: no genera ni consulta registros reales`.

- [ ] **Paso 3: proteger rutas y retirar enlaces**

Aplicar `canMatch` a `/nueva-queja`, `/seguimiento`, `/dashboard-revisor` y `/mis-asignaciones`. Condicionar sidebar, public header y enlace ciudadano del login a la misma fuente de capacidades.

- [ ] **Paso 4: corregir redirección post-login**

Cuando `reviewerDashboard` esté deshabilitado, Admin/Revisor debe ir a `/consulta`; Usuario debe ir a `/solicitud-acompanamiento`. Probar ambos destinos.

- [ ] **Paso 5: verificar que producción no expone simulaciones**

Compilar con configuración production y ejecutar pruebas de rutas. Buscar referencias navegables a las cuatro rutas y confirmar que todas están condicionadas.

- [ ] **Paso 6: commit**

```powershell
git add src/app/core/config src/app/shared/components/feature-unavailable src/environments src/app/app.routes.ts src/app/components
git commit -m "fix: deshabilita rutas simuladas en producción"
```

---

### Tarea 4: Fortalecer sesión, autorización y errores HTTP

**Archivos:**

- Crear: `src/app/core/session/session-storage.service.ts`
- Crear: `src/app/core/session/session.models.ts`
- Modificar: `src/app/services/auth.service.ts`
- Modificar: `src/app/services/auth.interceptor.ts`
- Modificar: `src/app/services/auth.guard.ts`
- Modificar: `src/app/services/role.guard.ts`
- Crear/modificar: specs de sesión, interceptor y guards

**Interfaces:**

- Produce: `SessionStorageService.read(): UserSession | null`, `write(session)` y `clear()`.
- Diferencia: 401 cierra sesión; 403 conserva sesión y redirige a acceso denegado.

- [ ] **Paso 1: escribir casos fallidos de sesión**

Cubrir almacenamiento ausente, JSON corrupto, objeto incompleto, token vacío, rol inválido y expiración cuando el JWT contenga `exp`. Confirmar que `isUsuario()` es `false` sin sesión.

- [ ] **Paso 2: validar sesión almacenada**

Leer dentro de `try/catch`, validar `email`, `nombre`, `rol` y `token`, aceptar solo roles `Admin`, `Revisor` y `Usuario`, y limpiar cualquier valor inválido.

- [ ] **Paso 3: diferenciar respuestas HTTP**

Para 401: limpiar sesión, navegar a login y mostrar mensaje de autenticación. Para 403: conservar sesión, navegar a acceso denegado y mostrar falta de permiso. Excluir `/auth/login` de cierre automático.

- [ ] **Paso 4: documentar límite de localStorage**

Actualizar README con riesgo XSS y dejar cookie `HttpOnly` como dependencia futura de backend, no como implementación frontend.

- [ ] **Paso 5: ejecutar pruebas focalizadas y gate completo**

```powershell
npm run test:ci
npm run check
```

- [ ] **Paso 6: commit**

```powershell
git add src/app/core/session src/app/services README.md
git commit -m "fix: fortalece el manejo de sesión en el frontend"
```

---

### Tarea 5: Centralizar iconos y consolidar la identidad CASILDA

**Archivos:**

- Modificar: `src/app/core/icons/casilda-icon-registry.service.ts`
- Modificar: `src/app/app.component.ts`
- Eliminar: `src/casilda.svg`
- Conservar y optimizar: `src/assets/distintivo_casilda.svg`
- Retirar referencias: `assets/AdminPara.svg`, `assets/Reportes.svg`
- Crear: `docs/identidad-visual-casilda.md`
- Crear: pruebas del registro de iconos y accesibilidad

**Interfaces:**

- Consume: `CasildaIconRegistry.register(): void` creado en la Tarea 2.
- Fuente visual: `distintivo_casilda.svg`; el JPEG permanece como referencia, no como asset productivo.

- [ ] **Paso 1: escribir prueba de integridad del inventario**

Iterar la lista de SVG registrada y comprobar que cada ruta exista bajo `src/assets`. La prueba debe fallar inicialmente por `AdminPara.svg` y `Reportes.svg`.

- [ ] **Paso 2: centralizar registro y retirar referencias rotas**

Mover la lista desde `AppComponent` al servicio de registro, eliminar entradas inexistentes y hacer `register()` seguro ante llamadas repetidas.

- [ ] **Paso 3: eliminar duplicado y optimizar isotipo**

Eliminar `src/casilda.svg`, conservar el SVG publicado y verificar favicon, contraste y render a 16, 32, 48, 192 y 512 px. No rasterizar el maestro.

- [ ] **Paso 4: documentar sistema visual**

`docs/identidad-visual-casilda.md` debe incluir paleta hexadecimal, versiones clara/oscura/monocroma, área de seguridad, tamaño mínimo, usos prohibidos, relación con el logo UdeA y reglas de texto alternativo.

- [ ] **Paso 5: revisar iconos interactivos**

Agregar `aria-label` a icon-buttons sin texto, `aria-hidden="true"` a decorativos y Material Symbols para acciones genéricas. No usar color como único indicador.

- [ ] **Paso 6: commit**

```powershell
git add src/app/core/icons src/app/app.component.ts src/assets src/index.html docs/identidad-visual-casilda.md
git commit -m "style: consolida la identidad visual de Casilda"
```

---

### Tarea 6: Cargar rutas secundarias de forma diferida

**Archivos:**

- Modificar: `src/app/app.routes.ts`
- Crear: `src/app/app.routes.spec.ts`
- Modificar: `src/app/app.config.ts` si se adopta preloading selectivo

**Interfaces:**

- Eager: `home`, `login`, `acceso-denegado`, `funcion-no-disponible`.
- Lazy: las restantes pantallas mediante `loadComponent`.

- [ ] **Paso 1: caracterizar rutas y guards actuales**

Usar `RouterTestingHarness` para comprobar navegación pública, Admin, Revisor, Usuario, acceso denegado y wildcard antes de cambiar imports.

- [ ] **Paso 2: convertir una ruta secundaria**

Aplicar el patrón:

```typescript
{
  path: 'consulta',
  loadComponent: () => import('./components/consulta/consulta.component')
    .then(({ ConsultaComponent }) => ConsultaComponent),
  canActivate: [roleGuard],
  data: { roles: ['Admin', 'Revisor'] }
}
```

Repetir para todas las rutas secundarias, conservando guards y datos exactamente.

- [ ] **Paso 3: verificar bundle y navegación**

Ejecutar build, registrar chunks por feature y comparar el total inicial contra 1,97 MB. Criterio: reducción del bundle inicial sin aumentar el total por duplicación injustificada.

- [ ] **Paso 4: commit**

```powershell
git add src/app/app.routes.ts src/app/app.routes.spec.ts src/app/app.config.ts docs/evidencias/auditoria-angular21/06-lazy-loading.md
git commit -m "refactor: carga de forma diferida las rutas secundarias"
```

---

### Tarea 7: Introducir tipos en tablas, eventos y fronteras HTTP

**Archivos:**

- Crear: `src/app/shared/models/table.models.ts`
- Modificar: `tabla-casos`, `tabla-citas`, `tabla-otros-casos`, `consulta`, `caso` y `gestion-contacto`
- Crear: modelos de cada feature junto al servicio que los consume
- Modificar: `solicitud.service.ts` solo en las interfaces afectadas

**Interfaces:**

- Sustituye: `MatTableDataSource<any>` y `EventEmitter<any>` por modelos explícitos.
- Mantiene: payloads y nombres de campos enviados actualmente.

- [ ] **Paso 1: escribir pruebas de contrato de tabla**

Crear fixtures tipados para solicitud, cita y caso, y comprobar que los eventos `editar`, `eliminar`, `iniciar`, `reprogramar`, `cancelar` y `expand` entregan el modelo correcto.

- [ ] **Paso 2: definir modelos mínimos sin campos inventados**

Derivar cada propiedad únicamente de interfaces existentes y usos comprobados. Convertir respuestas variables mediante funciones de normalización puras probadas, sin `as any`.

- [ ] **Paso 3: tipar filtros y elementos expandidos**

Reemplazar diccionarios laxos por `Partial<Record<ColumnKey, string>>` y elementos expandidos por uniones de modelo o `null`.

- [ ] **Paso 4: ejecutar TypeScript, lint y pruebas**

```powershell
npm run lint
npm run test:ci
npm run build
```

- [ ] **Paso 5: commit**

```powershell
git add src/app/shared/models src/app/components src/app/services/solicitud.service.ts
git commit -m "refactor: introduce tipos en tablas y eventos"
```

---

### Tarea 8: Separar `SolicitudService` por dominios sin cambiar contratos

**Archivos:**

- Crear: servicios y modelos bajo `src/app/features/solicitudes`, `citas`, `casos`, `atenciones` y `compromisos`
- Modificar: `src/app/services/solicitud.service.ts`
- Modificar: consumidores de los métodos trasladados
- Crear: specs HTTP por servicio

**Interfaces:**

- Produce: servicios con una única URL base y DTOs del dominio.
- Elimina: decisión HTTP basada en `registrarPestana(tabIndex, datos)` después de migrar cada llamada a un método nominal.

- [ ] **Paso 1: caracterizar métodos HTTP actuales**

Para cada método, probar verbo, URL, request y response con `HttpTestingController`. No mover código sin una prueba roja que describa el contrato vigente.

- [ ] **Paso 2: extraer un dominio por vez**

Orden: solicitudes, citas, casos, atenciones y compromisos. Después de cada extracción, ejecutar specs del servicio y consumidores antes de continuar.

- [ ] **Paso 3: reemplazar índice visual por métodos nominales**

Crear métodos como `registrarHechos`, `registrarSeguimientos` y `registrarCompromisos` únicamente para endpoints ya presentes. El componente elige una operación por intención, no por número de pestaña.

- [ ] **Paso 4: ejecutar gate completo**

```powershell
npm run check
```

- [ ] **Paso 5: commit**

```powershell
git add src/app/features src/app/services/solicitud.service.ts src/app/components
git commit -m "refactor: separa los servicios por dominio"
```

---

### Tarea 9: Reducir componentes monolíticos y duplicación

**Archivos:**

- Modificar: `registro-caso`, `registro-atencion`, `linea-alma/atencion-pr`
- Crear: componentes de sección y mappers dentro de sus features
- Crear: pruebas de caracterización y componentes extraídos

**Interfaces:**

- Contenedores: coordinan ID, carga y guardado.
- Secciones: reciben modelos tipados y emiten eventos tipados.
- Mappers: funciones puras de UI a request existente.

- [ ] **Paso 1: congelar payloads con pruebas de caracterización**

Capturar fixtures representativos para caso y atención; probar que los mappers produzcan exactamente fechas, IDs, archivos, seguimientos y compromisos actuales.

- [ ] **Paso 2: extraer mappers puros**

Mover formateo de fechas, normalización numérica y construcción de requests a archivos `*.mapper.ts`, sin dependencias de Angular.

- [ ] **Paso 3: extraer secciones compartibles**

Priorizar contacto, discapacidades, hechos, remisiones, medidas, agresores, apreciaciones, compromisos y seguimientos. Cada sección declara inputs/outputs tipados y su propio spec.

- [ ] **Paso 4: mantener diferencias explícitas**

No crear herencia entre `registro-caso` y `registro-atencion`. Compartir solo componentes o funciones cuya equivalencia esté demostrada por pruebas.

- [ ] **Paso 5: verificar tamaños y comportamiento**

Registrar líneas antes/después, cobertura, bundle y recorridos manuales. Objetivo: ningún contenedor nuevo supera 800 líneas y ninguna extracción reduce cobertura.

- [ ] **Paso 6: commit**

```powershell
git add src/app/features src/app/components/registro-caso src/app/components/registro-atencion src/app/components/linea-alma
git commit -m "refactor: divide los flujos principales por responsabilidad"
```

---

### Tarea 10: Migrar formularios modificados y manejar RxJS de forma consistente

**Archivos:**

- Modificar: formularios tocados por las tareas 7–9
- Modificar: `listas.service.ts`
- Crear: tests de validación, carga, error y destrucción

**Interfaces:**

- Formularios: Reactive Forms tipados y `getRawValue()` para controles deshabilitados.
- Listas: observables compartidos y errores visibles; no catálogos inventados.

- [ ] **Paso 1: escribir pruebas de validación**

Para cada formulario modificado, comprobar campos requeridos, mensajes accesibles, botón deshabilitado y payload con valores válidos.

- [ ] **Paso 2: migrar `ngModel` solo en el alcance tocado**

Usar `NonNullableFormBuilder` cuando el contrato no admita null; conservar null donde el backend actual lo acepte. No mezclar `ngModel` y controles reactivos en la misma sección.

- [ ] **Paso 3: normalizar cargas RxJS**

Usar `forkJoin` para catálogos independientes, `finalize` para indicadores y `takeUntilDestroyed` para streams vivos. Operaciones HTTP simples mantienen una única suscripción con `next` y `error`.

- [ ] **Paso 4: revisar catálogos hardcodeados**

Reemplazar sexo y cargo en `formulario-queja` solo con endpoints maestros ya existentes. Mantener estado de usuario, modalidad y vía sin cambio si no hay contrato comprobado; registrar esa deuda sin alterar valores.

- [ ] **Paso 5: commit**

```powershell
git add src/app/components src/app/features src/app/services/listas.service.ts
git commit -m "refactor: estandariza formularios y flujos RxJS"
```

---

### Tarea 11: Aplicar accesibilidad WCAG 2.2 AA y responsive

**Archivos:**

- Modificar: `src/styles.scss`
- Modificar: layouts, navegación, diálogos, formularios y tablas críticas
- Crear: `src/styles/_tokens.scss`
- Crear: pruebas de accesibilidad de componentes críticos
- Crear: `docs/evidencias/auditoria-angular21/11-accesibilidad.md`

**Interfaces:**

- Tokens: color, foco, espaciado, radios y breakpoints compartidos.
- Criterio: uso completo por teclado, contraste AA, reflow a 320 CSS px y mensajes asociados.

- [ ] **Paso 1: medir línea base visual y accesible**

Recorrer home, login, solicitud, consulta, cita, caso, atención y Línea ALMA con teclado; registrar foco, contraste, labels, diálogos y overflow.

- [ ] **Paso 2: crear tokens y foco visible**

Centralizar verdes, morados, fondos y estados. Implementar `:focus-visible` consistente y `prefers-reduced-motion`.

- [ ] **Paso 3: corregir formularios y diálogos**

Asociar `mat-error`, instrucciones e IDs; asegurar foco inicial, devolución de foco, nombre accesible y acciones con texto inequívoco.

- [ ] **Paso 4: adaptar navegación y tablas**

Sidebar colapsable, header sin desbordamiento y estrategia de tabla por prioridad de columnas o scroll etiquetado. Probar 320, 768, 1024 y 1440 px.

- [ ] **Paso 5: verificar**

Ejecutar pruebas automatizadas de accesibilidad, navegación manual por teclado y comprobación con lector de pantalla. Adjuntar capturas y matriz de resultados.

- [ ] **Paso 6: commit**

```powershell
git add src/styles.scss src/styles src/app docs/evidencias/auditoria-angular21/11-accesibilidad.md
git commit -m "style: mejora accesibilidad y diseño responsive"
```

---

### Tarea 12: Cerrar evidencia y preparar el único PR

**Archivos:**

- Crear: `docs/evidencias/auditoria-angular21/12-verificacion-final.md`
- Crear: `docs/evidencias/auditoria-angular21/descripcion-pr.md`
- Modificar: `docs/auditoria-migracion-react-angular-v2.md`
- Modificar: `README.md`

**Interfaces:**

- Consume: todos los gates anteriores.
- Produce: comparación inicial/final, checklist de DoD, rollback y descripción del PR.

- [ ] **Paso 1: ejecutar validación limpia**

Desde una instalación limpia:

```powershell
npm ci
npm run lint
npm run test:ci
npm run build
npm run audit:prod
git status --short
```

- [ ] **Paso 2: comparar métricas**

Registrar frente a la línea base: tiempo de instalación, 46 pruebas iniciales, cobertura, errores de consola, bundle de 1,97 MB, seis warnings de build, 163 marcadores laxos y cuatro rutas simuladas expuestas.

- [ ] **Paso 3: documentar rollback**

Listar cada commit en orden y su efecto. Confirmar que cada commit funcional pueda revertirse sin necesitar cambios backend.

Crear `descripcion-pr.md` con estas secciones y sus valores medidos: objetivo, excepción de rama base, alcance sin backend, archivos principales, comandos y exit codes, comparación de bundle/cobertura/auditoría, evidencia visual, riesgos, rollback y deuda pospuesta.

- [ ] **Paso 4: comprobar alcance Git**

```powershell
git diff --name-status main...HEAD
git log --oneline main..HEAD
git diff --check main...HEAD -- . ':(exclude)docs/auditoria-migracion-react-angular.md'
```

La exclusión del último comando conserva los saltos Markdown históricos del documento v1, cuyo hash debe seguir en `DBDB3A29985A9D5048C1767A498FFE04AE5364B8CFD7C8181DC2EE539E0043F9`.

- [ ] **Paso 5: commit final en español**

```powershell
git add README.md docs/auditoria-migracion-react-angular-v2.md docs/evidencias/auditoria-angular21/12-verificacion-final.md
git commit -m "docs: registra la verificación final del frontend"
```

- [ ] **Paso 6: publicar y crear PR hacia main**

```powershell
git push -u origin chore/01/002/casilda/auditoria-angular21-plan
gh pr create --base main --head chore/01/002/casilda/auditoria-angular21-plan --title "docs: agrega auditoría y plan de estabilización de Angular 21" --body-file docs/evidencias/auditoria-angular21/descripcion-pr.md
```

El PR debe declarar explícitamente: base excepcional `main`, ausencia de `release`, alcance sin backend, comandos ejecutados, métricas antes/después, riesgos, rollback y deuda pospuesta.

## Criterio de finalización del plan

El plan se considera ejecutado únicamente cuando las 12 tareas están marcadas, los commits están en español, el workflow remoto está verde, el PR apunta a `main`, las rutas simuladas no son productivas y la evidencia final permite reproducir todos los resultados.
