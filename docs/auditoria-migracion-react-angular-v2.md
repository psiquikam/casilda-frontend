# Auditoría y estrategia de estabilización frontend — Angular 21

- **Repositorio:** `casilda-frontend`
- **Versión del documento:** 2.0
- **Fecha de verificación:** 30 de agosto de 2026
- **Commit base:** `58b25e670b93289b14ba3ac958c83e4a62d0bb2d`
- **Rama documental:** `docs/01/002/casilda/auditoria-angular21-plan`
- **Stack comprobado:** Angular 21.2.22, Angular Material/CDK 21.2.14, TypeScript 5.9.3, RxJS 7.8.2
- **Documento anterior preservado:** `docs/auditoria-migracion-react-angular.md`

## 0. Propósito y límites

Esta segunda versión reemplaza como referencia vigente las conclusiones temporales de la auditoría de Angular 17, pero no elimina ni modifica el documento anterior. La primera versión conserva valor histórico: demuestra el estado observado antes de actualizar Angular y explica cómo se cerró la presencia técnica de React.

El repositorio ya está en Angular 21. Por tanto, el objetivo actual no es migrar React ni actualizar Angular 17, sino estabilizar el frontend que quedó después de la migración y del salto de versiones.

### Alcance aprobado

- reproducibilidad de instalaciones, build y CI;
- calidad estática, pruebas y evidencia automatizada;
- seguridad que pueda resolverse exclusivamente en frontend;
- rutas, navegación y presentación segura cuando una función dependa de un backend aún no disponible;
- arquitectura Angular, rendimiento, tipado, formularios y RxJS;
- accesibilidad, responsive, identidad visual, logo e iconografía;
- documentación de trabajo, ramas, commits, validación y rollback.

### Fuera de alcance

- crear, modificar o asumir endpoints backend;
- inventar contratos, identificadores, métricas o estados de negocio;
- cambiar autenticación backend o adoptar cookies sin coordinación con el servidor;
- actualizar a Angular 22 dentro de este trabajo;
- modificar el comportamiento productivo de flujos que no pueda demostrarse con el contrato actual.

Cuando una pantalla dependa de backend y hoy muestre datos simulados, la única resolución frontend aceptable es impedir que se presente como funcionalidad real en producción. No se reemplazará una simulación por otra.

## 1. Conclusión ejecutiva

La migración tecnológica está cerrada: no existen archivos JSX/TSX, dependencias React ni imports React, y la aplicación arranca mediante `bootstrapApplication`. Los 50 componentes se comportan como standalone bajo Angular 21; la ausencia de `standalone: true` explícito es correcta porque standalone es el valor predeterminado desde Angular 19.

La actualización a Angular 21 también está materialmente completada. Las dependencias Angular principales resolvieron en 21.2.22 y Angular Material/CDK en 21.2.14. Angular 21 se encuentra en LTS hasta junio de 2027; Angular 22 está activo, pero su adopción debe tratarse como una iniciativa posterior y no mezclarse con esta estabilización. Véanse la [matriz oficial de compatibilidad](https://angular.dev/reference/versions) y el [calendario oficial de versiones](https://angular.dev/reference/releases).

La aplicación compila y las 46 pruebas declaradas terminan con código 0. Esto no equivale todavía a una barrera de calidad suficiente: las 46 pruebas son variantes de `should create`, cinco componentes carecen de spec equivalente y Karma imprime errores de iconos que no hacen fallar la ejecución.

Los riesgos principales que permanecen son:

1. cuatro rutas presentan información simulada o confirman operaciones no persistidas;
2. `package-lock.json` continúa ignorado y no existe CI ni lint;
3. producción usa una URL HTTP y la sesión se confía a un objeto de `localStorage` sin validar;
4. todas las rutas de pantalla se cargan de forma eager y el bundle inicial alcanza 1,97 MB raw;
5. los flujos centrales concentran miles de líneas, duplicación, `any`, formularios mixtos y suscripciones manuales;
6. existen dos referencias a SVG inexistentes, dos `.DS_Store` versionados y una identidad visual aún no normalizada.

## 2. Línea base reproducible

### 2.1 Runtime e instalación

| Control | Resultado verificado | Evaluación |
|---|---:|---|
| Node | 24.18.0 | compatible con Angular 21 |
| npm | 11.16.0 | debe fijarse para CI y despliegue |
| Angular core/CLI | 21.2.22 | objetivo actual cumplido |
| Angular Material/CDK | 21.2.14 | compatible; mantener versiones coordinadas |
| TypeScript | 5.9.3 | compatible con Angular 21 |
| RxJS | 7.8.2 | compatible |
| Instalación limpia | 952 paquetes en aproximadamente 4 min | exit code 0 |
| Lockfile versionado | 0 | bloqueante de reproducibilidad |
| Dependencias React | árbol vacío | correcto |

`package.json` declara correctamente el rango de Node `^20.19.0 || ^22.12.0 || >=24.0.0`, coherente con la matriz de Angular 21. Sin embargo, el repositorio debe elegir y fijar una versión concreta para desarrollo, CI y Vercel; permitir tres familias de runtime no garantiza que todos los entornos sean idénticos.

La instalación genera `package-lock.json`, pero `.gitignore` lo excluye. Se debe retirar esa exclusión y versionar un único lockfile generado con la versión aprobada de npm. Después, instalación local, CI y despliegue deben usar `npm ci`.

La instalación completa reportó 7 vulnerabilidades —4 moderadas y 3 altas— en el árbol total. La auditoría de producción `npm audit --omit=dev --json` reportó 0. Ambas cifras deben conservarse por separado y compararse en CI; no se debe ejecutar `npm audit fix --force` automáticamente.

npm 11 también reportó cuatro paquetes con scripts de instalación pendientes de revisión: `esbuild`, `lmdb`, `msgpackr-extract` y `@parcel/watcher`. El equipo debe revisar el árbol y definir una política explícita de `allow-scripts` antes de automatizar aprobaciones.

### 2.2 Build

`npm run build` finalizó con código 0 en 55,563 segundos.

| Artefacto | Tamaño raw | Transferencia estimada |
|---|---:|---:|
| `main` | 1,65 MB | 256,74 kB |
| chunk inicial | 183,09 kB | 52,95 kB |
| estilos | 104,17 kB | 7,92 kB |
| polyfills | 34,59 kB | 11,33 kB |
| **Total inicial** | **1,97 MB** | **328,95 kB** |

Advertencias observadas:

- `RouterLink` no usado en `HeaderComponent`;
- `ModalPresuntoAgresorComponent` no usado en `RegistroCasoComponent`;
- cuatro estilos superan el presupuesto de 6 kB: `registro-atencion`, `atencion-pr`, `formulario-acompanamiento` y `registro-caso`.

No se deben aumentar los budgets para silenciar estas advertencias. Primero se eliminarán imports muertos y se identificarán reglas de estilo duplicadas o compartibles.

### 2.3 Pruebas

`npm test -- --watch=false --browsers=ChromeHeadless` finalizó con código 0: **46 de 46 pruebas exitosas** en Chrome Headless 151.

La señal es insuficiente por cuatro motivos:

- los 46 casos se denominan `should create` o equivalentes y solo verifican instanciación;
- cinco componentes no tienen spec equivalente: `caso`, `modal-agregar-caso`, `modal-medidas-proteccion`, `modal-presunto-agresor` y `modal-reparto` —este último tiene un spec con nombre invertido—;
- la suite tarda varios minutos en compilar antes de ejecutar aproximadamente 1,5 segundos de aserciones;
- durante la ejecución se imprimen errores de recuperación de varios iconos y el proceso continúa verde.

La prioridad no es migrar inmediatamente de Karma a Vitest. Angular usa Vitest por defecto en proyectos nuevos, pero la [migración de proyectos existentes continúa marcada como experimental](https://angular.dev/guide/testing/migrating-to-vitest). Primero se convertirán las pruebas actuales en caracterización útil y se hará que los errores inesperados de consola fallen; la evaluación de Vitest será posterior y aislada.

## 3. Inventario técnico vigente

| Métrica | Valor |
|---|---:|
| Componentes | 50 |
| Specs | 46 |
| Casos `it(...)` | 46 |
| Casos de creación superficial | 46 |
| Rutas declaradas, incluidos redirects | 20 |
| Imports eager de componentes de ruta | 18 |
| Usos de `loadComponent` | 0 |
| Marcadores aproximados `any`/`as any` | 163 |
| Llamadas aproximadas a `.subscribe()` | 156 |
| Manejadores `error:` aproximados | 75 |
| Componentes que inyectan `HttpClient` | 17 |
| Componentes que importan `FormsModule` | 19 |
| Componentes que importan `ReactiveFormsModule` | 15 |
| Plantillas con `ngModel` | 17 |
| `.DS_Store` versionados | 2 |
| Referencias SVG inexistentes | 2 |

Las comparaciones de `subscribe` y `error` son indicadores de revisión, no una afirmación de que exactamente 81 suscripciones carezcan de manejo. Cada flujo debe evaluarse con su cadena RxJS completa.

Los archivos de mayor tamaño siguen siendo:

| Archivo | Líneas |
|---|---:|
| `registro-atencion.component.ts` | 1.689 |
| `registro-caso.component.ts` | 1.636 |
| `registro-caso.component.html` | 1.235 |
| `atencion-pr.component.ts` | 1.032 |
| `solicitud.service.ts` | 765 |

## 4. Hallazgos priorizados

### P0 — Funciones simuladas expuestas

| Ruta | Evidencia actual | Resolución exclusivamente frontend |
|---|---|---|
| `/nueva-queja` | genera `CAS-####` con `Math.random()` | ocultar entrada y bloquear navegación productiva hasta disponer de persistencia real |
| `/seguimiento` | `simularResultado()` y días aleatorios | ocultar acceso público y mostrar una página de función no disponible, sin estado de caso |
| `/dashboard-revisor` | métricas y registros fijos | retirar como destino post-login y del menú productivo |
| `/mis-asignaciones` | cuatro casos fijos | retirar navegación y bloquear ruta productiva |

La solución recomendada es una configuración tipada de capacidades por entorno, usada tanto por las rutas como por la navegación. En producción las cuatro capacidades estarán desactivadas. En desarrollo podrán permanecer disponibles únicamente como prototipos con un banner inequívoco y sin lenguaje que afirme persistencia.

La configuración no es un mecanismo de autorización. Los guards frontend solo controlan navegación; el backend seguirá siendo responsable de autorizar operaciones cuando existan los contratos.

### P0 — Reproducibilidad y automatización ausentes

- lockfile ignorado;
- Vercel usa `npm install`;
- no hay workflow de CI;
- no existe script `lint`, `test:ci` ni `check`;
- no se fijan de forma única Node y npm;
- dos `.DS_Store` están en el índice.

El gate mínimo del PR será:

```powershell
npm ci
npm run lint
npm run test:ci
npm run build
npm audit --omit=dev --audit-level=high
git status --short
```

La ausencia de React puede conservarse como una comprobación ligera, pero deja de ser el centro del plan: el repositorio ya demostró ser Angular-only.

### P0 — Configuración y sesión inseguras

`environment.prod.ts` contiene `http://35.208.251.66:8080/api-casilda`. Un frontend servido por HTTPS no debe depender de una API HTTP. El plan exige parametrización de despliegue y HTTPS; no incluye cambiar el servidor.

`AuthService` ejecuta `JSON.parse` sin manejar corrupción, considera autenticado cualquier objeto guardado, no valida expiración y `isUsuario()` devuelve `true` sin sesión. El interceptor trata 401 y 403 como expiración y cierra la sesión en ambos casos, aunque un 403 representa normalmente falta de permiso y debe conducir a acceso denegado sin destruir una sesión válida.

Mientras se mantenga `localStorage`, se debe reducir la información almacenada, validar la forma y expiración de la sesión y documentar el riesgo XSS. Adoptar cookies `HttpOnly` queda fuera de alcance por requerir backend. Como endurecimiento adicional se evaluarán CSP y Trusted Types siguiendo la [guía oficial de seguridad de Angular](https://angular.dev/best-practices/security).

### P1 — Pruebas verdes pero poco sensibles

La suite actual permite errores de iconos y no caracteriza login, guards, interceptores, rutas, formularios, tablas ni payloads. Antes de refactorizar se cubrirán:

- restauración de sesión válida, ausente, corrupta y expirada;
- login, logout, 401 y 403;
- `authGuard`, `roleGuard` y capacidades deshabilitadas;
- rutas públicas y privadas;
- estados de carga, vacío, error y reintento;
- formularios y mapeos críticos que ya tengan contrato frontend verificable;
- registro y render de iconos sin errores de consola.

### P1 — Carga eager y arquitectura concentrada

Las 18 pantallas importadas por `app.routes.ts` entran en la configuración eager. Se conservarán eager únicamente `home`, `login` y la página de acceso denegado; el resto usará `loadComponent`. Angular recomienda lazy loading para pantallas secundarias y eager para las entradas principales; véase [Route Loading Strategies](https://angular.dev/best-practices/performance/lazy-loaded-routes).

La separación de los componentes de más de 1.000 líneas será incremental y respaldada por caracterización. Los límites propuestos son:

- contenedor de feature: carga y coordinación;
- formularios por sección: validación y presentación;
- facade o servicio de aplicación: orquestación RxJS;
- DTOs y mappers tipados: adaptación del contrato existente;
- componentes de tabla: visualización y eventos tipados.

No se creará una superclase para compartir `registro-caso` y `registro-atencion`. Se extraerán unidades pequeñas solo cuando ambas variantes tengan pruebas equivalentes.

### P1 — Tipado, RxJS y formularios

Los 163 marcadores laxos se reducirán por frontera de datos, empezando por tablas, eventos, respuestas HTTP y payloads. No se realizará una sustitución mecánica de `any` por `unknown` sin narrowing.

Las suscripciones se revisarán para usar `async` pipe, signals o `takeUntilDestroyed` cuando exista una vida útil continua. Operaciones HTTP de una sola emisión no requieren cancelación por defecto, pero sí estados de error y finalización mediante `finalize` cuando controlen spinners.

Los formularios se migrarán a Reactive Forms de forma incremental. Los catálogos no deben quedar escritos en HTML si el backend ya ofrece un maestro; cuando el contrato no pueda verificarse, el valor actual se documentará y no se cambiará en este trabajo.

### P1 — Assets e identidad visual

`app.component.ts` registra dos archivos inexistentes: `assets/AdminPara.svg` y `assets/Reportes.svg`. Además, `src/casilda.svg` duplica `src/assets/casilda.svg`; la configuración de Angular solo publica `src/assets`, por lo que la copia fuera de assets no es necesaria.

El JPEG `src/assets/Casilda idea de logo.jpeg` representa un ojo con iris multicolor. Ya existe una interpretación vectorial apta como base en `src/assets/distintivo_casilda.svg`, usada como favicon y registrada como `logo-custom`. La estrategia visual será consolidar esa base, no generar variantes desconectadas.

Entregables visuales propuestos:

- isotipo maestro SVG optimizado y con procedencia documentada;
- versión horizontal con nombre CASILDA y relación institucional aprobada;
- versiones monocroma clara y oscura;
- favicon SVG y fallbacks raster en tamaños requeridos;
- área de seguridad, tamaño mínimo y paleta/tokens;
- inventario de iconos con nombre semántico, archivo, contexto y texto accesible;
- uso de Material Symbols para acciones genéricas y SVG propios solo para identidad o dominios institucionales.

Los colores del iris no se usarán como único medio para comunicar estados. Todo icono interactivo tendrá nombre accesible; los decorativos se ocultarán del árbol de accesibilidad.

### P1 — Accesibilidad y responsive

Se aplicará como criterio verificable WCAG 2.2 nivel AA:

- navegación completa por teclado y foco visible;
- contraste de texto, controles y estados;
- labels, instrucciones y errores asociados a campos;
- diálogos con foco inicial, retorno de foco y cierre predecible;
- tablas utilizables en anchos reducidos;
- objetivos táctiles y reflow sin pérdida de información;
- soporte de movimiento reducido;
- mensajes sensibles claros, sin revelar datos personales en errores.

La validación combinará Angular Material harnesses, axe en pruebas de componentes críticos y recorridos manuales con teclado y lector de pantalla.

### P2 — Dependencias y APIs deprecadas

npm marcó `@angular/platform-browser-dynamic` y `@angular/animations` como deprecadas. La primera debe retirarse si ninguna ruta de ejecución la requiere. La segunda necesita una migración diseñada hacia animaciones CSS o `animate.enter`/`animate.leave`; no debe eliminarse antes de inventariar usos y verificar regresión visual.

SweetAlert2 permanece permitido como CommonJS. Su excepción debe revisarse y compararse con `MatDialog`/`MatSnackBar`, pero una sustitución masiva no es requisito de estabilización.

## 5. Arquitectura objetivo

```text
app/
├── core/                 # sesión, interceptores, guards, configuración y layout global
├── shared/               # UI reutilizable, iconos, estados y utilidades sin negocio
├── features/
│   ├── auth/
│   ├── solicitudes/
│   ├── casos/
│   ├── atenciones/
│   ├── citas/
│   ├── linea-alma/
│   └── administracion/
└── app.routes.ts         # composición lazy de las features
```

Esta estructura es una dirección, no una orden de mover todos los archivos de una vez. Cada extracción deberá mantener rutas y contratos, incluir pruebas antes/después y dejar un conjunto compilable.

El flujo de datos objetivo es:

```text
componente de página
  → facade/servicio de feature
  → servicio HTTP tipado existente
  → interceptor de autenticación/carga
  → API configurada por entorno
```

Los componentes no generarán identificadores de negocio, no construirán URLs y no conocerán índices de pestaña como sustitutos de operaciones de dominio.

## 6. Estrategia de entrega en una rama y un PR

Por decisión del responsable, todo el trabajo documental y la futura ejecución asociada se mantendrán en una única rama y un único PR hacia `main`:

```text
docs/01/002/casilda/auditoria-angular21-plan
```

Esta excepción parte directamente de `main` porque no existe una rama `release` en el remoto. El PR debe explicarlo de forma visible.

Para controlar el riesgo de un PR amplio, se usarán commits autocontenidos y gates acumulativos. Secuencia de commits recomendada:

1. `docs: agrega línea base y evidencia de Angular 21`
2. `docs: agrega plan de estabilización frontend`
3. `chore: hace reproducible la instalación de Angular`
4. `test: establece controles de calidad frontend`
5. `fix: deshabilita rutas simuladas en producción`
6. `fix: fortalece el manejo de sesión en el frontend`
7. `refactor: carga de forma diferida las rutas secundarias`
8. `refactor: introduce fronteras tipadas en el frontend`
9. `style: consolida la identidad visual y accesibilidad de Casilda`
10. `docs: registra la evidencia final de verificación`

Aunque exista un solo PR, cada commit tendrá resultado verificable, archivos acotados y posibilidad de revert independiente. No se hará squash durante revisión si elimina la trazabilidad requerida; la estrategia final de merge se acordará preservando evidencia.

## 7. Gates y evidencia obligatoria

Cada checkpoint debe registrar:

- commit probado;
- Node, npm y Angular;
- comando exacto, fecha, duración y exit code;
- pruebas ejecutadas y conteo;
- warnings nuevos, resueltos y aceptados;
- tamaño de bundle inicial;
- auditoría completa y de producción;
- capturas para cambios visuales y accesibilidad;
- riesgos, rollback y deuda deliberadamente pospuesta.

El PR no estará listo para merge si:

- una ruta simulada se presenta como real en producción;
- instalación, lint, pruebas o build fallan;
- aparecen errores inesperados de consola en pruebas;
- el bundle excede el budget aprobado sin explicación;
- quedan referencias a assets inexistentes;
- producción usa HTTP sin un bloqueo externo documentado;
- el diff modifica el documento histórico en lugar de agregar esta versión 2.

## 8. Orden recomendado

1. Reproducibilidad y línea base automatizada.
2. Caracterización de sesión, rutas e iconos.
3. Desactivación segura de prototipos productivos.
4. Seguridad frontend y manejo de errores.
5. Lazy loading y presupuestos.
6. Tipado y separación incremental de features.
7. Formularios, catálogos y RxJS.
8. Identidad visual, accesibilidad y responsive.
9. Evidencia final y cierre del PR.

No se comenzará la descomposición arquitectónica antes de tener pruebas capaces de detectar cambios funcionales.

## 9. Definition of Done

- [ ] El documento histórico permanece intacto y la versión 2 está versionada.
- [ ] Existe un único `package-lock.json` versionado y todos los entornos usan `npm ci`.
- [ ] Node y npm están fijados y documentados.
- [ ] CI ejecuta lint, pruebas, build y auditoría.
- [ ] Las pruebas críticas verifican comportamiento y fallan ante errores inesperados de consola.
- [ ] Las cuatro rutas simuladas no se ofrecen como funcionalidad real en producción.
- [ ] Sesión corrupta, ausente, expirada, 401 y 403 tienen comportamiento diferenciado y probado.
- [ ] La configuración productiva no depende silenciosamente de HTTP.
- [ ] Las rutas secundarias se cargan lazy y el bundle queda medido.
- [ ] Los DTOs, tablas y eventos críticos no dependen de `any` evitable.
- [ ] Los formularios modificados son reactivos y sus catálogos respetan contratos comprobados.
- [ ] No existen assets registrados inexistentes ni copias SVG redundantes.
- [ ] El logo CASILDA tiene variantes y reglas de uso aprobadas.
- [ ] Los recorridos críticos cumplen los controles WCAG 2.2 AA definidos.
- [ ] El PR contiene evidencia inicial y final, riesgos y rollback.
- [ ] `npm run check` y `git status --short` producen los resultados esperados antes del merge.

## 10. Resultado esperado

Al finalizar el plan, CASILDA continuará en Angular 21, sin cambios backend y sin presentar prototipos como operaciones reales. El frontend será reproducible, verificable, más seguro, cargará por feature, tendrá fronteras tipadas y contará con una identidad visual accesible y documentada. La evidencia permitirá comparar cada mejora contra esta línea base y revertirla sin perder trazabilidad.
