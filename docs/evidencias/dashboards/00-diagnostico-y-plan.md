# Panel de inicio por rol — Diagnóstico y plan de implementación

> **Fase:** mejoras del panel de inicio autenticado (`/inicio`).
> **Fecha del diagnóstico:** 4 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards` (sobre `09de1bb`).
> **Contrato de la fase:** `docs/contratos/DASHBOARDS_POR_ROL.md`.
> **Estado:** diagnóstico. **No se modificó ningún archivo de `src/`.**
> **Entorno de verificación:** `ng serve` en `http://127.0.0.1:4300`, Playwright MCP,
> Chromium, viewports de 375 y 1440 px.

---

## 0. Resumen ejecutivo

El panel de inicio es **un único componente monolítico** (`DashboardHomeComponent`:
465 líneas de TS, 870 de HTML, 2096 de SCSS) que resuelve los cinco roles del sistema con
cinco bloques `@if` sobre `AuthService`, con **todos los datos quemados como propiedades
`readonly` del componente**. No hay servicios, DTOs, estados de carga/vacío/error ni
registro de widgets.

De los 25 hallazgos `[OBSERVADO]` del §2 del contrato, **21 quedan CONFIRMADOS**,
**3 son DISTINTOS** (el síntoma es real pero la causa no es la supuesta) y **1 NO APLICA**.

Tres cosas salieron del diagnóstico que el contrato no anticipaba y que cambian las
prioridades:

1. **`casilda-diseno-v1.md` no existe en el repositorio** (ni en el historial de Git), pese
   a ser la fuente de verdad nº 2 según `CLAUDE.md`, el skill `casilda-ux` y el propio
   contrato. El §4 de este documento explica qué se usó en su lugar y qué queda sin resolver.
2. **El selector de roles de prueba no está protegido por ningún flag.** Está en el
   encabezado (`header.component.html:54-70`) y en el login (`login.component.html:34-50`),
   renderizado incondicionalmente. En producción permite a cualquier persona autenticada
   —o sin autenticar— obtener una sesión `ADMIN` con un JWT forjado en el cliente. Es más
   grave que DSH-05-01 y se trata en la Subfase 0.
3. **Buena parte del SCSS del panel no existe:** las clases `.step-card*`, `.tools-catalog`,
   `.tools-intro*`, `.protocols-intro*`, `.details-heading`, `.details-list` y `.check-icon`
   se usan en la plantilla pero **no tienen ninguna regla**. Eso explica de golpe
   DSH-04-06, DSH-04-07 y parte de DSH-04-02: no es un problema de estilo mal aplicado,
   es ausencia de estilo.

---

## 1. Inventario de archivos involucrados

### 1.1 Núcleo del panel de inicio

| Archivo | Líneas | Rol en la fase |
|---|---|---|
| `src/app/components/dashboard-home/dashboard-home.component.ts` | 465 | Componente único de `/inicio`. Contiene **todos** los mocks (KPIs, agenda, carga de equipo, diversidad, catálogo de 13 módulos, 5 pasos de la ruta). |
| `src/app/components/dashboard-home/dashboard-home.component.html` | 870 | Cinco vistas por rol + tres pestañas transversales. |
| `src/app/components/dashboard-home/dashboard-home.component.scss` | 2096 | 80 declaraciones con color literal (55 hex + 25 `rgba()`). Clases huérfanas (ver §3, DSH-04-06/07). |
| `src/app/components/dashboard-home/dashboard-home.component.spec.ts` | 88 | Pruebas actuales del componente. |

### 1.2 Rutas, guardas y modelo de roles

| Archivo | Qué aporta |
|---|---|
| `src/app/app.routes.ts:13-18` | Ruta `/inicio`, `title: 'Inicio operativo'`, `canActivate: [authGuard]`. **Sin `roleGuard`**: el rol no decide el acceso, decide el contenido. |
| `src/app/app.routes.ts:19-22` | `/dashboard` → `redirectTo: 'inicio'`. |
| `src/app/services/auth.service.ts:29-39` | `UserRole`: `ADMIN · COORDINADOR · PROFESIONAL · REVISOR · USUARIO` (y sus variantes capitalizadas). |
| `src/app/services/auth.service.ts:75-136` | `MOCK_USERS`: las cinco cuentas de prueba con contraseña, nombre y descripción. |
| `src/app/services/auth.service.ts:165-208` | `getRoleCode()`, `getRoleName()`, `isAdmin()…isUsuario()`. |
| `src/app/services/auth.service.ts:242-244` | `getDefaultRoute()` → `/inicio` para todos los roles. |
| `src/app/services/role.guard.ts:18-20` | **El ADMIN pasa todas las guardas** (`if (authService.isAdmin()) return true`). |
| `src/app/core/features/feature-capability.guard.ts` | `canMatch` por `environment.features[...]`. |
| `src/environments/environment.ts:9` · `environment.prod.ts:9` | `telefonoOrientacion: '1234567890'` ← origen de DSH-05-01. |
| `src/environments/environment.ts:10-15` | `features`: `complaintIntakePrototype`, `publicTrackingPrototype`, `reviewerDashboardPrototype`, `assignmentsPrototype`. **No hay flag de datos de demostración.** |

### 1.3 Navegación que el panel duplica

| Archivo | Qué aporta |
|---|---|
| `src/app/components/layout/sidebar/sidebar.component.html` | Menú lateral: 7 secciones colapsables con su propio gating por rol y flags (líneas 17, 52, 81, 128, 153, 186, 215). Es la navegación primaria (DSH-P4). |
| `src/app/components/layout/horizontal-nav/horizontal-nav.component.*` | Variante horizontal del mismo menú. |
| `src/app/components/layout/header/header.component.html:35-36` | Nombre de usuario + píldora de rol. |
| `src/app/components/layout/header/header.component.html:54-70` | **Selector «Cambiar Rol (Modo Prueba)», sin gating.** |
| `src/app/services/navigation-layout.service.ts` | Preferencia de disposición, llave `casilda_menu_layout` (cumple DSH-06-03). |

### 1.4 Shell y scroll

| Archivo | Qué aporta |
|---|---|
| `src/app/app.component.html:5-31` | Shell autenticado: `mat-sidenav-container` o barra horizontal. |
| `src/app/app.component.scss:1-6` | `html, body { height: 100vh; overflow: hidden }`. |
| `src/app/app.component.scss:44-50` | `.main-content { overflow-y: auto }` ← **el documento no desplaza; desplaza el contenedor interno.** Base de DSH-04-08. |

### 1.5 Transversales que se reutilizan (no se reescriben)

`QuickExitComponent` + `QuickExitService` · `NotificacionService` · `DialogoService` ·
`CasildaTitleStrategy` · `EnfoqueRutaService` · `getPaginadorIntlEs()` ·
`ContenidoHomeService` (como **patrón** de servicio mock → endpoint) ·
`src/styles/_tokens.scss` · `src/styles/_base.scss`.

### 1.6 Vecino, fuera del alcance estricto

`src/app/components/dashboard-revisor/` (`/dashboard-revisor`, «Panel de indicadores»,
tras `reviewerDashboardPrototype`). Es el destino analítico al que enlaza el panel de
inicio del perfil Reportes (§4.5 del contrato), no el panel de inicio en sí.

---

## 2. Mapeo de roles

### 2.1 Cómo se decide hoy qué ve cada rol

Tres mecanismos independientes, y **ninguno** gobierna el panel de inicio:

1. **`authGuard`** — único requisito para entrar a `/inicio`: estar autenticado.
2. **`roleGuard`** (`route.data.roles`) — gobierna el resto de rutas, no el panel.
   Regla de negocio explícita: **el ADMIN pasa siempre** (`role.guard.ts:19`).
3. **`featureCapabilityGuard`** (`canMatch` + `route.data.feature`) — gobierna prototipos.

El contenido del panel se decide **dentro de la plantilla**, con cinco condicionales
mutuamente excluyentes sobre `AuthService`:

| Bloque | Condición | Línea |
|---|---|---|
| Portal Usuario | `auth.isUsuario()` | `dashboard-home.component.html:116` |
| Portal Profesional | `auth.isProfesional()` | `:274` |
| Portal Coordinador | `auth.isCoordinador()` | `:377` |
| Portal Revisor | `auth.isRevisor()` | `:468` |
| Portal Admin | `auth.isAdmin()` | `:555` |
| Pestañas transversales | `!auth.isUsuario()` | `:659` |

Dos consecuencias prácticas:

- **El ADMIN no «hereda» las vistas de los demás**: ve su propio bloque más las pestañas.
  Pero sí hereda el catálogo completo de 13 módulos (`filteredTools`, `:435`), de ahí
  que vea «Reportar Caso» (etiqueta «Mis Solicitudes»), que es del rol USUARIO → DSH-04-04.
- **Una persona con dos roles vería dos portales apilados.** Hoy `MOCK_USERS` asigna un
  rol por cuenta, así que no ocurre; con el backend real puede ocurrir.

**Cómo se cambia de rol en desarrollo** (tres caminos, todos sin backend):

1. **Login → «Cuentas de prueba (Roles Fase 2)»** (`login.component.html:34-50`): un clic
   por rol. Es el camino usado para la verificación visual de este documento.
2. **Encabezado → menú de usuario → «Cambiar Rol (Modo Prueba)»**
   (`header.component.html:54-70`): cambia de rol sin cerrar sesión y navega a `/inicio`.
3. **Formulario de login** con las credenciales de `MOCK_USERS` (`auth.service.ts:75-136`):
   `admin@udea.edu.co / Admin123*`, `coordinador@udea.edu.co / Coord123*`,
   `profesional@udea.edu.co / Pro123*`, `revisor@udea.edu.co / Revisor123*`,
   `usuario@udea.edu.co / User123*`. También se aceptan `123456` y `password123`
   (`auth.service.ts:251`).

> ⚠️ **Los tres caminos están activos en producción.** Ninguno consulta
> `environment.production` ni un feature flag. `loginAsMock()` (`auth.service.ts:302-327`)
> fabrica el JWT en el navegador (`createMockToken`, `:54-73`) y lo guarda en
> `localStorage`. El `roleGuard` solo lee ese objeto local, de modo que un clic basta
> para obtener acceso de administrador. Esto se trata en la **Subfase 0**.

### 2.2 Perfiles del contrato §4 frente a los roles reales

| Perfil del contrato §4 | ¿Existe como rol en el código? | Identificador real | Qué ve hoy en `/inicio` |
|---|---|---|---|
| **4.1 Administración** (Super Administrador / Admin) | ✅ Sí | `ADMIN` | 4 KPIs globales (156/48/52/41), 3 tarjetas «Gestión del Sistema», barra segmentada + 4 tarjetas de identidad de género, y las 3 pestañas con los **13** módulos. `dashboard-home.component.html:555-654`. |
| **4.2 Profesional del Equipo de Atención** | ⚠️ Parcial | `PROFESIONAL` | 4 KPIs de jornada, 5 botones de acción de colores saturados, tabla «Citas Programadas para Hoy» con 4 filas, y las 3 pestañas (9 módulos). `:274-372`. **Las cuatro especialidades de la matriz (Jurídico, Psicojurídico, Psicológico, Psicoorientación) no existen**: hay un único rol genérico, así que DSH-08-01 (ver solo los seguimientos de la propia especialidad) no es implementable hoy. |
| **4.3 Recepción / Bandeja** | ❌ No existe | — | Nadie. La función de triaje y reparto la cubre hoy `COORDINADOR`. |
| **4.4 Línea ALMA** | ❌ No es un rol | — | Es una **sección del menú lateral** (`sidebar:128-150`) y una ruta (`/linea-alma/atencion-pr`) abiertas a `ADMIN`, `COORDINADOR` y `PROFESIONAL`. Fuera de alcance por §4.4. |
| **4.4 UAD Equipos 3 y 4** | ❌ No es un rol | — | Sección del menú (`sidebar:153-183`) visible a **todo rol que no sea USUARIO**, tras `complaintIntakePrototype` / `publicTrackingPrototype`. Fuera de alcance. |
| **4.5 Reportes y Métricas** | ⚠️ Parcial | `REVISOR` | 4 KPIs de auditoría —dos de ellos cadenas (`'< 24h'`, `'96%'`)—, 4 botones de acción y las 4 tarjetas de identidad de género sin barra. `:468-550`. La sección homónima del menú se abre a `ADMIN`, `COORDINADOR` y `REVISOR` (`sidebar:186`). |
| **4.6 Usuario** | ✅ Sí | `USUARIO` | Banner con **el teléfono 1234567890**, 3 tarjetas de acción, 2 solicitudes simuladas con nombre del profesional y próxima cita, y guía de 4 pasos. **No ve las pestañas.** `:116-268`. |
| — *(sin perfil en el contrato)* | ✅ Sí | **`COORDINADOR`** | 4 KPIs de equipo, 5 botones de acción, «Carga de Trabajo del Equipo» con 4 profesionales nominados y barra de capacidad. `:377-463`. **El contrato §4 no define este perfil**, pese a ser el que más se parece a «Recepción / Bandeja» (§4.3). → Pregunta P-02. |

**Lectura de conjunto.** Los perfiles de §4 se infirieron de las **secciones del menú
lateral**, no del modelo de roles. El modelo real tiene cinco roles planos; el menú tiene
siete secciones. El registro de widgets de DSH-12-02 debe indexarse por los **cinco
códigos de rol existentes**, no por las secciones del menú.

---

## 3. Estado de cada hallazgo DSH

Leyenda: **CONFIRMADO** = el síntoma y la causa supuesta coinciden con el código ·
**DISTINTO** = el síntoma existe pero la causa es otra · **NO APLICA**.

Las rutas se abrevian: `dh.ts` = `dashboard-home.component.ts`,
`dh.html` = `…component.html`, `dh.scss` = `…component.scss`.

### 3.1 Cabecera y saludo

| ID | Estado | Evidencia | Causa |
|---|---|---|---|
| **DSH-01-01** | **CONFIRMADO** | Píldora del encabezado `header.component.html:36`; insignia del menú de usuario `header.component.html:47`; insignia del saludo `dh.html:8`; título `«Módulos Disponibles para {{ rolUsuario }}»` `dh.html:788`. Verificado en navegador (ADMIN, 1440 px). | Cuatro consumidores independientes de `auth.getRoleName()`. Además `getRoleName()` devuelve `'Admin'` (`auth.service.ts:178`) mientras `MOCK_USERS.admin.nombre` dice «Super Administrador CASILDA»: dos denominaciones para el mismo rol. |
| **DSH-01-02** | **DISTINTO** (síntoma real, causa distinta) | DOM: `"domingo, 4 de octubre de 2026"` (correcto). Render: `"Domingo, 4 De Octubre De 2026"`. `getComputedStyle(.user-greeting__date).textTransform === "capitalize"` → **`dh.scss:153`**. | **No hay `titlecase`.** `fechaFormateada` (`dh.ts:193-201`) usa `toLocaleDateString('es-CO')` y devuelve el texto correcto; lo rompe una regla CSS. Corrección: eliminar `text-transform: capitalize` en `dh.scss:153`. Independientemente, el getter debe migrar a `DatePipe` + `LOCALE_ID` (DSH-11-08) para no duplicar la configuración regional. |
| **DSH-01-03** | **CONFIRMADO** | `dh.html:18-49`, en `.workspace-header__top`, junto al `h1`. Íconos `dock_to_left` / `dock_to_top`. | Preferencia de interfaz en la zona de mayor jerarquía. **Ya existe el destino correcto**: el menú de usuario tiene el mismo control (`header.component.html:76-92`), así que el bloque del panel es un duplicado puro y puede retirarse sin pérdida funcional. Nota: los íconos **no** son de teléfono móvil (el contrato lo supuso); son correctos. |
| **DSH-01-04** | **CONFIRMADO** | `header.component.html:35` → «Super Administrador CASI…»; el `h1` del panel sí muestra el nombre completo (`dh.html:11`). Verificado en navegador (ADMIN y REVISOR, 1440 px). | `nombreUsuario` (`dh.ts:169-171`) devuelve `currentUser.nombre` completo; el truncado ocurre en el encabezado por ancho. No hay campo de nombre corto en `UserSession` (`auth.service.ts:9-17`). → Pregunta P-21. |
| **DSH-01-05** | **CONFIRMADO** | `dh.html:53-67`; ancho completo bajo el saludo. `filteredTools` (`dh.ts:433-453`) busca sobre los mismos 13 módulos del menú. | El buscador duplica la navegación y, al escribir, **reemplaza todo el panel** por la grilla de resultados (`dh.html:71-110`): pierde KPIs y pendientes. |

### 3.2 Indicadores (KPIs)

| ID | Estado | Evidencia | Causa |
|---|---|---|---|
| **DSH-02-01** | **CONFIRMADO** | `dh.ts:118-160`. 48/156 = 30,77 %; 52/156 = 33,33 %; 41/156 = 26,28 %. Suma 90,4 %. El denominador no aparece en ninguna parte de la tarjeta (`dh.html:560-576`). | Los porcentajes se escriben a mano en `badge` sin declarar el total. |
| **DSH-02-02** | **CONFIRMADO** | `dh.ts:141-149`: «Citas Activas», `count: 52`, `badge: '33.3%'`. | 52 citas expresadas como porcentaje de 156 **casos**. Unidades distintas. Falta periodo. |
| **DSH-02-03** | **CONFIRMADO** | `dh.ts:128` → `badge: 'Activos'` sobre la tarjeta «Casos Activos» (`dh.html:570-572`). | El campo `badge` se reutiliza para dos cosas: porcentaje y etiqueta decorativa. |
| **DSH-02-04** | **DISTINTO** (no hay restos de `#814ea5`) | Colores por serie en `dh.scss:131-153` (insignias de rol) y `:1870-1874` (botones de acción). Grep de `#814ea5` y `#348F41` en `src/`: **0 coincidencias**; `npm run a11y:audit` → «usos de la paleta heredada: 0». | El morado **no** es herencia: es `#70205b`, la **Pantone 7650 C oficial de la UdeA**, ya declarada como token (`_tokens.scss:24`, alias `--color-comp-purple`). El defecto real es doble: (a) está escrito **literal** en el componente en vez de usarse el token; (b) se usa como **identificador de rol y de serie sin significado semántico**. La migración a token está en la tarea 4.2 del plan de accesibilidad: el panel concentra **80 de las 136 declaraciones literales pendientes** (55 hex + 25 `rgba()`). |
| **DSH-02-05** | **CONFIRMADO** | No existe ninguna fecha de corte ni variación en `dh.ts:118-167` ni en `dh.html:559-577`. | Los mocks no tienen campo de corte ni de periodo. |
| **DSH-02-06** | **CONFIRMADO**, con dos causas | (a) **Texto preformateado**: `badge: '30.8%'`, `'33.3%'`, `'26.3%'` (`dh.ts:138,148,158`) y los KPIs del revisor `count: '< 24h'`, `'96%'` (`dh.ts:111,114`) son cadenas. (b) **Número sin pipe**: `{{ d.porcentaje }}%` (`dh.html:542,646`) interpola el `number` con `toString()`, que usa punto. | `LOCALE_ID` es-CO está provisto, pero ningún `PercentPipe`/`DecimalPipe` se usa en el panel (grep de `| percent`/`| number` en `dh.html`: 0). Los mocks deben entregar números y la vista formatear. |

### 3.3 Distribución por identidad de género

| ID | Estado | Evidencia | Causa |
|---|---|---|---|
| **DSH-03-01** | **CONFIRMADO** | `dh.scss:481-491`: `slice--female` = degradado `#70205b → #96357d` (morado/magenta); `slice--male` = `#137598 → #2a94bc` (azul). Píldoras en `:586-600`; puntos en `:547-550`. Verificado en navegador (ADMIN, 1440 px). | Asignación estereotipada morado→mujeres / azul→hombres. **No existe ninguna paleta `--color-data-*`** en `_tokens.scss`; lo más cercano son los alias `--color-comp-*` (`_tokens.scss:33-47`), descritos como «para gráficos, métricas y badges» pero sin criterio de serie ni contrastes verificados. Propuesta en el §5. |
| **DSH-03-02** | **CONFIRMADO** | `dh.ts:161-166`: `'Mujeres (Cis/Trans)'`, `'Hombres (Cis/Trans)'`, `'Personas No Binarias'`, `'Disidencias / Otras'`. | Categorías quemadas en el componente, no servidas por catálogo. **[PENDIENTE]** del contrato: sigue abierto (P-05). |
| **DSH-03-03** | **CONFIRMADO**, y peor de lo descrito | `dh.html:629-634`: la barra lleva `role="progressbar"` **sin** `aria-valuenow`/`valuemin`/`valuemax`/`aria-valuetext`, y cada segmento es un `<div>` vacío cuyo único contenido es el atributo `[title]` (`:632`) — no accesible por teclado ni anunciado de forma fiable. No existe tabla alternativa. | Además del color como portador único, hay **uso incorrecto de ARIA**: `progressbar` no describe una distribución categórica. Las tarjetas de debajo sí llevan texto, pero la barra por sí sola no es interpretable. |
| **DSH-03-04** | **CONFIRMADO** | `dh.ts:165` → `{ label: 'Disidencias / Otras', count: 8 }`. | No hay supresión de celdas pequeñas ni filtros hoy; el riesgo se materializa al añadir filtros (facultad, sede), que es justo lo que pide §4.5. **[PENDIENTE]** umbral (P-06). |

### 3.4 Pestañas

| ID | Estado | Evidencia | Causa |
|---|---|---|---|
| **DSH-04-01** | **CONFIRMADO** | Vía 1: menú lateral (`sidebar.component.html`). Vía 2: tarjetas «Gestión del Sistema y Configuración» (`dh.html:580-608`). Vía 3: grilla de 13 módulos (`dh.html:794-814`). Vía 4 no listada en el contrato: los botones «Acciones Rápidas» de cada rol (`dh.html:301-322`, `:404-425`, `:495-512`). Vía 5: el buscador (`dh.html:53-67`). | **Cinco** caminos a los mismos destinos, no tres. |
| **DSH-04-02** | **CONFIRMADO** | `dh.html:92-93` → `<strong>¿Qué es?</strong>` / `<strong>¿Cuándo usarlo?</strong>` con los textos de `dh.ts:294-295` y equivalentes para los 13 módulos. CTA: `«Abrir {{ tool.title }}»` (`dh.html:96`). | Las MAYÚSCULAS sostenidas **no vienen del texto** sino del CSS: `.tool-card__category` y las etiquetas de KPI usan `text-transform: uppercase` (p. ej. `dh.scss:1119-1126`). El CTA no está en mayúsculas en el DOM. Las clases `.tool-card__what` y `.tools-intro*` **no tienen estilos** (ver DSH-04-07), por eso los párrafos se ven sin jerarquía. |
| **DSH-04-03** | **CONFIRMADO** | «Nueva Solicitud» (`sidebar:97`) / «Solicitud de Acompañamiento» (`dh.ts:290`) / «Ir a Nueva Solicitud» (`dh.ts:221`) / `title: 'Solicitud de acompañamiento'` (`app.routes.ts:88`). · «Consulta Solicitudes» (`sidebar:101`) / «Consulta y Bandeja de Solicitudes» (`dh.ts:312`) / `'Consulta de solicitudes'` (`app.routes.ts:116`). · «Registro de Caso» (`sidebar:115`) / «Registro de Caso (Expediente)» (`dh.ts:334`). · «Primer Respondiente» (`sidebar:144`) / «Línea Alma (Primer Respondiente)» (`dh.ts:367`). · «Queja Disciplinaria (UAD)» (`sidebar:42`) / «Registrar Queja» (`sidebar:170`) / «UAD — Registrar Queja Disciplinaria» (`dh.ts:378`). | **Seis** módulos con nombre divergente, no tres. No existe catálogo central de navegación: cada superficie escribe su propio literal. **[PENDIENTE]** nombres oficiales (P-07). |
| **DSH-04-04** | **CONFIRMADO** | `dh.ts:300-309`: `id: 'reportar-caso'`, `category: 'Mis Solicitudes'`, `roles: ['USUARIO']`, `icon: 'add_circle_outline'` — **el mismo ícono** que `id: 'solicitud'` (`dh.ts:293`). Aparece para el ADMIN porque `filteredTools` omite el filtro por rol cuando `isAdmin()` (`dh.ts:435,439`). Verificado en navegador (ADMIN, pestaña «Módulos de la Plataforma (13)»). | El filtro de rol tiene una excepción para ADMIN heredada de `roleGuard`, pero en una vista de catálogo «ver todo» no equivale a «es mi tarea». |
| **DSH-04-05** | **CONFIRMADO** | `dh.scss:751-759` → `.stepper-item__name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis }` dentro de una grilla `repeat(auto-fit, minmax(180px, 1fr))` (`dh.scss:705-707`) con 5 columnas. Verificado en navegador (ADMIN, 1440 px, pestaña «Ruta del Caso»): se lee «Recepción y Radic…», «Bandeja y Contact…», «Agendamiento de …», «Apertura de Caso …». | 5 columnas de ≈180 px para títulos de hasta 25 caracteres. En ≤768 px el stepper pasa a scroll horizontal (`dh.scss:1429-1446`) y **ahí no se trunca**: el defecto es exclusivo de escritorio. |
| **DSH-04-06** | **CONFIRMADO**, causa precisa | **Ninguna** de estas clases tiene regla en `dh.scss`: `.step-card`, `.step-card__header`, `.step-card__badge-pill`, `.step-card__title`, `.step-card__subtitle`, `.step-card__body`, `.step-card__desc`, `.step-card__details-box`, `.step-card__footer`, `.details-heading`, `.details-list`, `.check-icon`. Solo existen `.step-card__restricted-wrap` y `.step-card__restricted-msg` (`dh.scss:964,973`). Verificado en navegador (ADMIN, pestaña «Ruta del Caso»). | El SCSS define `.step-detail-card` (`dh.scss:853`), nombre que la plantilla **no usa**. El `<ul class="details-list">` conserva su `list-style` nativo y además cada `<li>` incluye un `<mat-icon>check_circle</mat-icon>` (`dh.html:752`) → viñeta + ícono. El `<mat-icon>` del `badge-pill` (`dh.html:734`) no tiene `display:flex` que lo alinee con el texto. |
| **DSH-04-07** | **CONFIRMADO**, y la inversión es exacta | Medido en el navegador con `getComputedStyle`. **ADMIN:** `h1 «Hola, Super Administrador CASILDA»` → **Inter**; `h2 «Gestión del Sistema y Configuración»` → **Inter**; `h2 «Distribución por Identidad de Género…»` → **Inter**; `h2 «Flujo de Vida de una Solicitud en CASILDA»` → **Inter**; `h3 «Recepción y Radicación»` → **Lora**. **USUARIO:** `h1` → **Inter**; `h2` del banner → **Lora**; `h3` de las tarjetas → **Lora**; `h2 «Mis Solicitudes en Seguimiento»` → **Inter**. | `_base.scss:10-16` fija `h1,h2,h3 { font-family: var(--font-serif) }`. El panel **sobrescribe con `--font-sans` en 15 selectores de encabezado** (`dh.scss:165, 417, 686, 1040, 1128, 1221, 1282`…) y **deja sin sobrescribir** los que no tienen estilo (`.step-card__title`, `.banner-ciudadano__title`, `.user-action-card__title`, `.guia-usuario-card__title`, `.agenda-title`). Resultado: los niveles correctos (`h1`–`h3`) salen en sans y los no estilizados salen en serif — **exactamente al revés de la regla**. El SCSS del panel **no usa `--font-serif` ni una sola vez**. Sobre `h1` único: el panel cumple (un solo `h1`, `dh.html:11`). |
| **DSH-04-08** | **DISTINTO** (no hay doble scroll vertical en el panel) | Medido: `document.documentElement.scrollHeight > window.innerHeight` → **`false`**; el que desplaza es `.main-content` (`scrollHeight 1433 / clientHeight 836`). Causa: `app.component.scss:1-6` (`body { overflow: hidden }`) y `:44-50`. Dentro del panel: `.nav-tabs { overflow-x: auto }` (`dh.scss:613`), `.citas-table-wrapper` (`:1927`), `.stepper-nav` en ≤768 px (`:1431`). | No hay dos barras verticales anidadas; hay **una sola vertical, pero del contenedor interno, no del documento**: la barra aparece pegada al contenido y no en el borde del navegador, que es lo que se percibe como scroll anidado. Los `overflow-x` del tab-strip y de la tabla sí son barras adicionales, horizontales. **Decisión de arquitectura del shell, no del panel**: cambiarla afecta a las 23 rutas → se trata aparte (Subfase 2, riesgo alto). |

### 3.5 Protocolos y canales

| ID | Estado | Evidencia | Causa |
|---|---|---|---|
| **DSH-05-01 [CRÍTICO]** | **CONFIRMADO** | Origen: `environment.ts:9` **y `environment.prod.ts:9`** → `telefonoOrientacion: '1234567890'`, ambos con el comentario `TODO(negocio)`. Consumo: `dh.ts:45` → `dh.html:138` (banner del rol USUARIO, «Línea de Orientación en Crisis») y `dh.html:840` (pestaña Protocolos, personal). Verificado en navegador (USUARIO, 1440 y 375 px). | **Está también en `environment.prod.ts`**: no es un valor solo de desarrollo. Se renderiza sin ninguna condición. **Cómo ocultar la línea mientras no haya dato real:** poner `telefonoOrientacion: ''` en ambos entornos y envolver el bloque en `@if (telefonoOrientacion)`. Conviene además un predicado en el componente (`get hayLineaOrientacion()`) que rechace cadena vacía **y** marcadores evidentes (secuencias como `1234567890`, repeticiones de un mismo dígito), para que un valor de prueba reintroducido no vuelva a pasar; y una prueba unitaria que lo fije. Las líneas **155** y **123** (`dh.html:841-842`) son reales y pueden conservarse. |
| **DSH-05-02** | **CONFIRMADO** | `dh.html:840-842`: `<li><strong>…</strong> {{ telefonoOrientacion }}</li>`, texto plano. `dh.html:138`: `<strong class="help-box-phone">{{ telefonoOrientacion }}</strong>`. Ningún `href="tel:"` en todo el panel. | Falta `tel:`. Aplica a las tres líneas. |
| **DSH-05-03** | **CONFIRMADO** | `dh.html:839-843`: solo nombre y número. | **[PENDIENTE]** horarios y cobertura (P-04). |
| **DSH-05-04** | **CONFIRMADO** | `dh.html:857` «Resolución Rectoral 41986» (sin año); `:858` «Ley 1257 de 2008»; `:859` «Ley 1581» (sin año). | Literales en plantilla, sin catálogo normativo. **[PENDIENTE]** validación jurídica (P-08). |
| **DSH-05-05** | **CONFIRMADO** | `dh.html:837`: «Si la persona se encuentra en una situación de riesgo inminente… **activa de inmediato la ruta de emergencia**». | Texto dirigido al personal. El rol USUARIO no ve esta pestaña (`dh.html:659`), pero sí ve el banner con el teléfono falso, redactado en otra voz. No hay versión por audiencia. |

### 3.6 Salida rápida

| ID | Estado | Evidencia | Conclusión |
|---|---|---|---|
| **DSH-06-01** | **CONFIRMADO** (sin interferencia hoy) | En 1440 px el botón ocupa la esquina superior derecha del encabezado; en 375 px colapsa a botón circular (verificado en navegador a 375 px en los cinco roles) y nada del panel lo tapa. Reserva en `_tokens.scss:165-166`. **Riesgo futuro:** la paleta de comandos propuesta en DSH-01-05 escucharía `Escape`, y **el doble `Escape` es un disparador de la salida rápida** (`quick-exit.component.ts:39-48`). Un `MatDialog` abierto consume el primer `Escape` al cerrarse. | No se modifica nada. Requisito para la Subfase 2: si se implementa paleta de comandos, **no** debe registrar `Escape` propio, o debe reemitir. |
| **DSH-06-02** | **VERIFICADO — no se corrige, se reporta** | `quick-exit.component.ts:33` → `if (evento.altKey && evento.key.toLowerCase() === 'q')`. | **(a) Falsos positivos: no ocurren.** El manejador compara `event.key`, no `event.code`. En teclado latinoamericano `AltGr + Q` produce `@`, de modo que `event.key === '@'` y la condición **no se cumple**, aunque en Windows AltGr fije `altKey` y `ctrlKey`. Escribir un correo es seguro. La recomendación del contrato de «comprobar `event.key` y excluir `event.ctrlKey`» **ya está satisfecha en su parte esencial**; añadir `&& !evento.ctrlKey` sería defensa en profundidad sin efecto observable. **(b) Falsos negativos: sí existen.** En macOS, `Option + Q` produce `œ`, por lo que `event.key.toLowerCase() !== 'q'` y **el atajo documentado no dispara**. El mismo efecto puede darse en distribuciones Linux con tecla de composición. El botón y el doble `Escape` siguen funcionando. **Pendiente de confirmación manual** sobre teclado físico latinoamericano en Windows y sobre macOS; una comprobación sintética con Playwright no sirve, porque inyecta `key:'q'` y no la traducción del sistema. → Pregunta P-18. |
| **DSH-06-03** | **CONFIRMADO** (cumple) | `QuickExitService` limpia `sessionStorage` completo + llaves con prefijo `casilda_` + `userSession` (`quick-exit.service.ts:5,11,38-56`). Llaves existentes: `casilda_menu_layout` (`navigation-layout.service.ts:13`) ✅, `casilda_borrador_anonimo` / `casilda_borrador_reporte` (`formulario-anonimo.component.ts:51,63`) ✅, `userSession` ✅. | Requisito claro para la fase: **toda llave nueva del panel debe empezar por `casilda_`**. Nota relacionada con DSH-10-14: la sesión del rol USUARIO se guarda hoy en `localStorage` (`auth.service.ts:262,279,294,325`); la salida rápida la borra, pero el cierre normal de pestaña no. |
| **DSH-06-04** | **NO APLICA todavía** | No existe ningún texto sobre el historial del navegador en el panel ni en `quick-exit.component.html`. | Es contenido nuevo del rol USUARIO (Subfase 4), no un defecto a corregir. |

### 3.7 Hallazgos adicionales del diagnóstico (fuera del §2 del contrato)

| ID propuesto | Severidad | Evidencia | Descripción |
|---|---|---|---|
| **ADD-01** | **ACEPTADO — deuda conocida de la etapa de desarrollo** (2026-10-04) | `header.component.html:54-70`, `login.component.html:34-50`, `auth.service.ts:302-327` y `:54-73`. | El selector de roles de prueba y el login rápido se renderizan **sin ningún flag**. `loginAsMock()` forja el JWT en el cliente y lo persiste; `roleGuard` solo lee ese objeto. Escalada a ADMIN con un clic, también en `environment.prod.ts`. **Decisión del equipo:** se mantiene sin cambios mientras el proyecto esté exclusivamente en etapa de desarrollo y sin backend, por ser la vía de verificación por rol. Registrado como pendiente 6 de `CLAUDE.md` §5, a resolver **antes** de conectar el backend o de cualquier despliegue fuera de desarrollo. **No se vuelve a reportar como bloqueante en las subfases siguientes.** |
| **ADD-02** | Alto | `_tokens.scss:59` → `--color-danger: var(--udea-red-032)` y `:68` → `--color-info: var(--udea-blue-633)`. **Ninguna de esas dos variables existe** (los tokens son `--udea-pantone-032` y `--udea-pantone-633`). | Sustitución `var()` fallida ⇒ la declaración queda inválida en tiempo de cálculo y se comporta como `unset`. Afecta a `.casilda-alerta--peligro` (`_base.scss:106`), `.boton--emergencia` (`_base.scss:238`) y 20 componentes que usan `var(--color-danger)`, incluido `dh.scss:1321,1325`. Los bordes de peligro no se pintan del color previsto. |
| **ADD-03** | Medio | `dh.scss:598-599`: `.pill--diverse { color: var(--color-comp-red) }` = `#ef434d` como **texto** sobre un fondo `rgba(239,67,77,.12)` ≈ `#fdecee`. Contraste medido: **3,3:1** (requisito 4,5:1). | Doble incumplimiento: contraste AA y la regla de `CLAUDE.md` §3 («rojo de marca nunca en texto»). |
| **ADD-04** | Medio | `dh.scss:985` `var(--color-amber-600, #d97706)`, `:1948` `var(--color-border-subtle, #f1f5f9)`, `:1995` `var(--color-bg-surface-elevated, #f8fafc)`. | Tres tokens inexistentes con *fallback* literal: aparentan usar el sistema de diseño pero siempre resuelven al literal. |
| **ADD-05** | Medio | Botones de acción rápida en rojo/rosa: `dh.scss:1873` `.btn-quick-action--rose { background:#e11d48 }`, usado en «Línea ALMA» (`dh.html:314`) y «Métricas e Indicadores» (`dh.html:421`). Verificado en navegador (PROFESIONAL y COORDINADOR, 1440 px). | Superficie roja saturada para acciones ordinarias: compite con la salida rápida y contradice DSH-P5. |
| **ADD-06** | Bajo | Consola del navegador: `NG0100 ExpressionChangedAfterItHasBeenCheckedError` en `AppComponent` (sidenav) en cada carga de `/inicio`; `NG0913` por `Logo-Udea-Blanco-horizontal.png` (1470×378 renderizado a ~130 px). | Ruido de consola preexistente; conviene no arrastrarlo a la fase. |
| **ADD-07** | Bajo (documentación) | `.agents/skills/angular_frontend_guidelines/SKILL.md` declara Angular 17, Material 17 y **SweetAlert2** como estándar. `CLAUDE.md` §2 y §4 dicen Angular 21 y «SweetAlert2 fue retirado». | La guía de código que el skill `casilda-ux` cita como fuente nº 4 está desactualizada y contradice las reglas vigentes. |

---

## 4. Comparación con `casilda-diseno-v1.md`

### 4.1 Hallazgo principal: el documento no existe

Búsqueda exhaustiva en el árbol de trabajo y en **todo** el historial de Git
(`git log --all -- "*casilda-diseno*"`): **sin resultados**. El archivo nunca estuvo versionado.

Sin embargo es citado como fuente de verdad de UI/UX en, al menos:

- `CLAUDE.md` §1 (tabla de documentos de referencia, segunda fila).
- `.claude/skills/casilda-ux/SKILL.md` (tabla de precedencia, fila 2).
- `docs/contratos/DASHBOARDS_POR_ROL.md`, encabezado y DSH-03-01, DSH-11-05.
- `src/styles/_tokens.scss:6` → «Fuente de verdad: casilda-diseno-v1.md (§3.A)».
- `src/app/core/security/quick-exit.service.ts:18` → «Ver `casilda-diseno-v1.md` §4».

**Consecuencia para esta fase:** no se puede responder el pendiente nº 11 del contrato
(«coincidencias con la hoja de ruta de `casilda-diseno-v1.md` para el panel de inicio»),
ni confirmar si ese documento ya define tarjeta de indicador (DSH-11-05) o paleta de
gráficos (DSH-03-01). → **Pregunta P-01, bloqueante para la Subfase 2.**

### 4.2 Qué se usó en su lugar

Mientras el documento aparece, el sustituto funcional es el par
**`CLAUDE.md` §3 + `src/styles/_tokens.scss`**, que sí recoge la decisión de diseño
vigente y es el que la regla 1 de `CLAUDE.md` §6 hace exigible. La comparación de abajo
se hace contra ese sustituto.

### 4.3 Coincidencias (el contrato no inventa nada)

| Tema | Contrato | Sistema vigente |
|---|---|---|
| Tokens obligatorios, cero literales | §6 encabezado, DSH-11-06 | `CLAUDE.md` §3 y §6 regla 1 · `_tokens.scss` |
| Verde `#026937` para la acción principal | DSH-11-06 | `--color-primary` (`_tokens.scss:52`) |
| Turquesa `#0e7774` para enlaces/secundario | DSH-11-06 | `--color-secondary` (`_tokens.scss:56`) |
| Rojo de marca solo en gráficos, nunca en texto | DSH-11-06 | `CLAUDE.md` §3 · `_tokens.scss:59-65` |
| `.casilda-alerta--*` para mensajes de estado | DSH-11-06 | `_base.scss:92-128` |
| Color nunca como único portador | DSH-11-07 | `CLAUDE.md` §6 regla 5 |
| `h1`–`h3` en Lora, resto en Inter | DSH-04-07, §5.5 | `CLAUDE.md` §3 · `_base.scss:10-23` |
| Área táctil 44 px | DSH-11-12 | `--touch-target-min` (`_tokens.scss:143`) |
| `mat-icon-button` con `aria-label` | DSH-11-01 | `CLAUDE.md` §6 regla 7 (lint lo exige) |
| Un `h1` por vista, `title` por ruta | DSH-11-09 | `CLAUDE.md` §6 regla 8 |
| Diálogos por `DialogoService`, nunca `alert`/SweetAlert2 | DSH-12-10 | `CLAUDE.md` §6 regla 8 |
| Errores por `NotificacionService`; `subscribe` con `error` | DSH-12-05 | `CLAUDE.md` §6 reglas 2 y 8 |
| Mock tipado con endpoint documentado | DSH-12-04 | `ContenidoHomeService` (`contenido-home.service.ts:120-135`) |
| Salida rápida intocable | §2.6 | `CLAUDE.md` §6 regla 6 |
| `prefers-reduced-motion` | DSH-10-17 | `_base.scss:175-184` |

### 4.4 Diferencias (el contrato pide cosas que el sistema aún no tiene)

| # | Lo que pide el contrato | Estado en el sistema | Resolución propuesta |
|---|---|---|---|
| D-1 | Paleta `--color-data-*` para series (DSH-03-01, DSH-11-06) | No existe. Lo más cercano: `--color-comp-*` (`_tokens.scss:33-47`), sin criterio de serie ni contrastes verificados. | Propuesta en §5. Requiere aprobación (P-03). |
| D-2 | Tamaño de cuerpo ≥16 px para el rol Usuario (§5.5) | **Sí existe**: `--font-size-base: 1rem` (`_tokens.scss:101`). | **No hace falta token nuevo.** Basta usar `--font-size-base` en el texto corrido del rol Usuario y no bajar de ahí. Se documenta como decisión, no como token. |
| D-3 | Tarjeta de indicador (KPI) como componente (DSH-11-05) | No existe. `CasildaCardComponent` es para `ContenidoDestacadoDto`, no para métricas. | Componente nuevo `CasildaKpiCardComponent` que **reutilice los tokens de superficie, borde, radio y sombra** de `CasildaCardComponent` (Subfase 2). |
| D-4 | Estados de carga (skeleton), vacío y error por zona (DSH-07-04) | No existe ningún patrón de skeleton ni de estado vacío en el proyecto. | Definir un patrón único en la Subfase 2 y aplicarlo a todas las zonas. |
| D-5 | Franja «Datos de demostración» por entorno (DSH-12-08) | `environment.features` existe pero **no tiene un flag de datos simulados**. | Añadir `features.demoData` (`true` en dev, `false` en prod) en la Subfase 2. |
| D-6 | Supresión de celdas pequeñas (DSH-03-04, DSH-09-01) | No existe. | Pendiente de umbral (P-06); implementable como función pura del servicio de métricas. |
| D-7 | Catálogo central de nombres de módulo (DSH-04-03) | No existe; cada superficie escribe su literal. | Catálogo de navegación servido como los demás (patrón `ContenidoHomeService`), consumido por menú, panel y `title` de ruta. Requiere P-07. |
| D-8 | Panel colapsable con `aria-expanded` + `inert` (DSH-11-11) | El patrón ya existe en el proyecto (filas expandibles, documentado en `CLAUDE.md` §5). | Reutilizar, no reinventar. |

### 4.5 Contradicciones

Con la salvedad de que la fuente de rango superior (`casilda-diseno-v1.md`) no está
disponible, **no se encontró ninguna contradicción** entre el contrato y
`CLAUDE.md` §3/§6 + `_tokens.scss`. Dos puntos de fricción menores, con el ajuste que
se propone al contrato:

| Punto | Fricción | Ajuste propuesto al contrato |
|---|---|---|
| DSH-02-04 | Atribuye los morados a «restos de la paleta anterior `#814ea5`». Verificado: esa paleta está en **cero** usos; el morado es `#70205b`, Pantone 7650 **oficial** de la UdeA, ya tokenizada. | Reescribir el hallazgo como: «literales sin token **y** uso del color como identificador sin significado», sin la hipótesis de paleta heredada. |
| §5.5 | «para el texto corrido de esta vista se recomienda el tamaño de cuerpo del sistema, sin bajar de 16 px. Si no existe un token para ese tamaño, proponerlo». | El token existe (`--font-size-base`). Sustituir la condicional por la referencia directa al token. |
| §4 | Los perfiles se infirieron de las secciones del menú y **omiten `COORDINADOR`**, que sí es un rol real con dashboard propio. | Añadir un §4.x para Coordinación, o fusionarlo explícitamente con §4.3 (Recepción/Bandeja) si el equipo confirma que son la misma función. → P-02. |

---

## 5. Tokens propuestos (pendientes de aprobación — **no añadidos**)

Todos derivan de la paleta institucional ya declarada en `_tokens.scss` §1. Los contrastes
se calcularon con la fórmula de luminancia relativa de WCAG 2.x.

### 5.1 Paleta de series de datos `--color-data-*` (DSH-03-01, pendiente 10 del contrato)

Criterios: ≥3:1 contra blanco y contra `--color-bg-main` (#f9fafb) para cumplir **WCAG
1.4.11** como objeto gráfico; variante `-text` con ≥4,5:1 sobre su propia superficie
atenuada para las píldoras de porcentaje; **sin asociación cultural de género**;
luminancias escalonadas para no depender solo del tono.

| Token | Valor | Derivación | vs. blanco | vs. `#f9fafb` |
|---|---|---|---|---|
| `--color-data-1` | `#024b27` | `--udea-green-349` oscurecido ≈25 % | 10,30:1 | 9,86:1 |
| `--color-data-2` | `#2a94bc` | `--udea-pantone-633` aclarado ≈20 % | 3,47:1 | 3,32:1 |
| `--color-data-3` | `#70205b` | `--udea-pantone-7650` (sin cambio) | 10,26:1 | 9,82:1 |
| `--color-data-4` | `#069a7e` | `--udea-blue-334` (sin cambio) | 3,54:1 | 3,39:1 |
| `--color-data-5` | `#b45309` | `--udea-pantone-137` oscurecido ≈30 % | 5,02:1 | 4,81:1 |
| `--color-data-6` | `#5c6672` | Neutro gris-azul, para «sin dato» / series sin estado | 5,84:1 | 5,58:1 |

Variantes de texto, sobre la superficie atenuada al 8 % de la misma serie:

| Token | Valor | Sobre | Contraste |
|---|---|---|---|
| `--color-data-1-text` | `#024b27` | `#ebf1ee` | 9,00:1 |
| `--color-data-2-text` | `#0d5c78` | `#eef6fa` | 6,81:1 |
| `--color-data-3-text` | `#70205b` | `#f4edf2` | 8,91:1 |
| `--color-data-4-text` | `#046b57` | `#ebf7f5` | 5,90:1 |
| `--color-data-5-text` | `#8f4207` | `#f9f1eb` | 6,38:1 |
| `--color-data-6-text` | `#4a525c` | `#f2f3f4` | 7,13:1 |

**Limitación que hay que decir con todas las letras:** la paleta institucional es
cromáticamente estrecha y varias series quedan a menos de 1,5:1 de luminancia entre sí
(1↔3, 2↔4, 4↔5, 5↔6). **El color por sí solo no basta para distinguir las series**, ni
siquiera con esta propuesta. Por eso DSH-03-03 (etiqueta de texto en cada segmento +
tabla alternativa) **no es opcional ni mejorable después**: es parte del requisito de la
visualización. Para gráficos de más de tres series conviene añadir además una trama
(rayado/punteado) diferenciada.

El orden de asignación debe ser **neutral por definición**: la serie 1 va a la primera
categoría del catálogo oficial, no a «mujeres». Eso elimina el estereotipo de raíz, sin
depender de qué color se considere «femenino».

### 5.2 Token de cuerpo del rol Usuario (§5.5)

**No se propone token nuevo:** `--font-size-base: 1rem` ya existe (`_tokens.scss:101`).
Lo que falta es usarlo. Se propone en su lugar una línea de documentación en `CLAUDE.md`
§3: «el texto corrido de las vistas del rol Usuario usa `--font-size-base` y nunca baja de ahí».

### 5.3 Correcciones de tokens existentes (ADD-02, ADD-04)

No son tokens nuevos sino defectos; se listan aquí porque tocan `_tokens.scss`:

| Línea | Hoy | Debería ser |
|---|---|---|
| `_tokens.scss:59` | `--color-danger: var(--udea-red-032)` | `var(--udea-pantone-032)` |
| `_tokens.scss:68` | `--color-info: var(--udea-blue-633)` | `var(--udea-pantone-633)` |

Y tres tokens que el panel invoca con *fallback* y no existen — decidir si se crean o se
sustituyen por tokens vigentes: `--color-amber-600` (≈ `--color-warning`),
`--color-border-subtle` (≈ `--color-border`), `--color-bg-surface-elevated`
(≈ `--color-bg-subtle`).

---

## 6. Plan por subfases

Secuencia ajustada respecto de la propuesta original: se antepone una **Subfase 0** por el
hallazgo ADD-01, y DSH-05-01 sube a esa subfase por criticidad. El resto conserva el orden
propuesto.

> **Criterio común a todas las subfases:** `npm run check` (lint + `a11y:audit` + pruebas +
> build) pasa sin deuda nueva · ningún literal visual en los archivos tocados ·
> la salida rápida verificada con teclado · reporte en `docs/evidencias/dashboards/NN-*.md`
> con el formato del skill `casilda-ux`.

---

### Subfase 0 — Contenido de crisis y atajo de la salida rápida ✅ **EJECUTADA (2026-10-04)**

> Resultado en `docs/evidencias/dashboards/01-subfase-0-crisis-y-atajo.md`.
> El bloque (b) original —gating de las cuentas de prueba— **se retiró del plan**: el
> equipo aceptó ADD-01 como deuda conocida de la etapa de desarrollo (ver §3.7). En su
> lugar se ejecutó la corrección de DSH-06-02, autorizada por el equipo (P-18).

**Por qué va primero:** DSH-05-01 es el único hallazgo marcado `[CRÍTICO]` y DSH-06-02 toca
funcionalidad crítica de seguridad. Ninguno depende de decisiones de diseño pendientes.

| IDs | DSH-05-01 · DSH-06-02 |
|---|---|
| **Archivos** | `src/environments/environment.ts`, `environment.prod.ts`, `core/security/telefono-crisis.ts` (nuevo), `dashboard-home.component.{ts,html}`, `public-footer.component.{ts,html}`, `quick-exit.component.ts` y specs correspondientes. |
| **Alcance** | (a) `telefonoOrientacion: ''` en ambos entornos; predicado que rechace vacío y marcadores; `@if` en los dos puntos de render; prueba unitaria que falle si vuelve a aparecer un número de relleno. Se amplió al pie público, que mostraba el mismo número de relleno como enlace `tel:` a visitantes anónimos. (b) Reconocer `Alt + Q` también cuando la distribución traduce el carácter (macOS), sin reintroducir el falso positivo de `AltGr + Q` en teclado latinoamericano. |
| **Riesgos** | (a) Ninguno funcional: se oculta contenido, no se agrega. (b) La salida rápida es la función más crítica de la interfaz: cualquier cambio en su manejador puede romperla. Mitigación: ocho casos de prueba que cubren las distribuciones objetivo en ambos sentidos, incluido el recorrido real por el `@HostListener`; sin tocar `QuickExitService` ni ningún otro comportamiento del componente. |
| **Terminado cuando** | No existe ningún número telefónico de relleno en `src/` (grep). La línea de orientación no se renderiza con `telefonoOrientacion` vacío, en los dos puntos y en los cinco roles. El atajo dispara con `Alt + q` y con `Option + Q` en macOS, y no dispara al escribir «@» con AltGr. `npm run check` sin deuda nueva. |

---

### Subfase 1 — Correcciones transversales sin cambiar la estructura ✅ **EJECUTADA (2026-10-04)**

> Resultado en `docs/evidencias/dashboards/02-subfase-1-correcciones-transversales.md`.

**Objetivo:** dejar el panel correcto en formato, color y tipografía **sin tocar la
arquitectura**, para que la Subfase 2 reorganice contenido ya saneado.

| IDs | DSH-01-02 · DSH-02-04 · DSH-02-06 · DSH-04-05 · DSH-04-06 · DSH-04-07 · DSH-05-02 · DSH-05-04 · DSH-01-01 · ADD-02 · ADD-03 · ADD-04 · ADD-05 |
|---|---|
| **Archivos** | `dashboard-home.component.{ts,html,scss}` (el grueso), `src/styles/_tokens.scss` (solo ADD-02 y, si se aprueban, los tres tokens de ADD-04), `layout/header/header.component.html` (DSH-01-01). |
| **Alcance** | Quitar `text-transform: capitalize` (`dh.scss:153`) y migrar `fechaFormateada` a `DatePipe` + `LOCALE_ID`. Mocks que entreguen **números** y vista que formatee con `DecimalPipe`/`PercentPipe` (elimina `badge: '30.8%'`, `'< 24h'`, `'96%'`). Migrar las 80 declaraciones literales a tokens. Corregir `--color-danger` y `--color-info`. Sustituir `#ef434d` como texto por `--color-data-3-text` o `--color-danger-text`. Retirar las superficies rojas de acciones ordinarias (ADD-05). Reescribir los encabezados: `h1`–`h3` sin sobrescribir `--font-serif`; lo que solo *parece* título pasa a `<p>`/`<span>` con `--font-sans`. **Escribir el SCSS ausente** de `.step-card*`, `.tools-*`, `.protocols-intro*`, `.details-*` (resuelve DSH-04-06 y parte de DSH-04-07): `display:flex` para alinear íconos, `list-style:none` para quitar el doble marcador. Stepper sin truncar (etiquetas cortas completas o stepper vertical en escritorio). Enlaces `tel:` en las tres líneas. «Ley 1581 **de 2012**». Dejar el rol **una sola vez**: retirar la insignia del saludo (`dh.html:8`) y conservar la del menú de usuario. |
| **Dependencias** | DSH-02-04 y ADD-03 necesitan la paleta del §5 aprobada (**P-03**) para las series; el resto de literales (botones, insignias) se migra con tokens existentes. DSH-05-04 necesita **P-08** solo para la Resolución Rectoral; «Ley 1581 de 2012» es inmediato. |
| **Riesgos** | El SCSS tiene 2096 líneas con clases huérfanas: hay riesgo de tocar reglas muertas y creer que se corrigió algo. Mitigación: antes de editar, listar las clases de la plantilla sin regla (script ya usado en este diagnóstico) y trabajar sobre esa lista. Cambiar la tipografía de los encabezados altera la densidad visual: revisar las cinco vistas de rol en navegador antes de cerrar. |
| **Terminado cuando** | `a11y:audit` reporta `dashboard-home.component.scss` **fuera** de la lista de SCSS con literales. Ningún `getComputedStyle` de `h1`–`h3` del panel devuelve Inter, ni de un no-encabezado devuelve Lora. Ningún porcentaje o fecha se construye como cadena en el TS. Las etiquetas del stepper se leen completas en 1440, 768 y 375 px. Las tres líneas telefónicas son enlaces `tel:` operables. El rol aparece exactamente una vez por pantalla. |

---

### Subfase 2 — Arquitectura común (Z1–Z6) ✅ **EJECUTADA (2026-10-04)**

> Resultado en `docs/evidencias/dashboards/03-subfase-2-arquitectura-comun.md`.
> DSH-04-08 queda fuera y documentado: tocar el scroll del shell afecta a las 23 rutas.

| IDs | DSH-01-03 · DSH-01-05 · DSH-04-01 · DSH-04-02 · DSH-04-03 · DSH-04-04 · DSH-04-08 · DSH-07-01…05 · DSH-11-01…05 · DSH-12-01…10 · D-3, D-4, D-5, D-7 |
|---|---|
| **Archivos** | **Nuevos:** `src/app/components/dashboard/` (contenedor de zonas + un componente standalone por widget), `src/app/components/casilda-kpi-card/`, `src/app/services/dashboard-metricas.service.ts`, `…/dashboard-pendientes.service.ts`, `…/catalogo-navegacion.service.ts`, `src/app/core/dashboard/dashboard-por-rol.ts` (registro). **Modificados:** `dashboard-home.component.*` (se vacía y pasa a orquestar), `app.routes.ts` (si cambia el `loadComponent`), `environment*.ts` (`features.demoData`), `layout/sidebar` y `horizontal-nav` (nombres desde el catálogo), `app.component.scss` (solo si se aborda DSH-04-08). **Nuevo contrato:** `docs/contratos/` con los DTO del panel. |
| **Alcance** | Esqueleto Z1–Z6 con Z2 antes de Z3. Registro `DASHBOARD_POR_ROL: Record<RolCasilda, readonly WidgetId[]>` indexado por los **cinco roles reales** (§2.2), con el orden del registro como orden visual. Un servicio por fuente de datos con DTO tipado, endpoint documentado y latencia/error simulables (DSH-12-09), siguiendo `ContenidoHomeService`. Estados de carga/vacío/error por zona. Franja «Datos de demostración» tras `features.demoData`. Retirar del panel la grilla de 13 módulos, las tarjetas «Gestión del Sistema» y el conmutador de disposición (ya está en el menú de usuario). Mover «Ruta del Caso» y «Protocolos» a Z6 colapsable con `aria-expanded` + `inert`, estado recordado bajo llave `casilda_*`. Catálogo central de nombres consumido por menú, panel y `title` de ruta. Buscador: o paleta de comandos que **no capture `Escape`**, o campo compacto en la cabecera. |
| **Dependencias** | **P-01** (`casilda-diseno-v1.md`: ¿define ya tarjeta de KPI o zonas?) es bloqueante para no construir dos veces. **P-07** (nombres oficiales) bloquea el catálogo. **P-02** condiciona si el registro lleva cuatro o cinco entradas de personal. |
| **Riesgos** | **Alto.** Es la subfase que puede romper las cuatro vistas de personal a la vez. Mitigaciones: construir el contenedor nuevo **en paralelo** al actual y conmutar por rol conforme cada dashboard de la Subfase 3 esté listo; cada widget con su propia prueba; comparación visual en navegador contra la línea base descrita en el §8. **DSH-04-08 se evalúa aparte**: pasar el scroll del shell al documento toca las 23 rutas y la salida rápida fija; si el análisis no es concluyente, se deja fuera y se documenta, y en esta subfase solo se eliminan los `overflow` innecesarios **dentro** del panel. |
| **Terminado cuando** | Ningún `@if` por rol en las plantillas de widget: el rol solo se consulta en el registro. Cada widget obtiene sus datos de un servicio (DSH-12-03), con `next` **y** `error`, y los errores pasan por `NotificacionService`. Las tres zonas de cada rol muestran skeleton, vacío y error forzables desde el mock. Un mismo módulo se llama igual en menú, panel y título de pestaña. La franja de demostración aparece con `demoData: true` y desaparece con `false`. La salida rápida sigue operando con clic, `Alt + Q` y doble `Escape` **con la paleta de comandos abierta**. |

---

### Subfase 3 — Dashboards del personal

| IDs | §4.1 (Admin) · §4.2 (Profesional) · §4.3 (Recepción, si existe) · §4.5 (Reportes) · DSH-02-01 · DSH-02-02 · DSH-02-03 · DSH-02-05 · DSH-03-01…04 · DSH-08-01…03 · DSH-09-01, 09-02 · DSH-11-02, 11-03, 11-10 |
|---|---|
| **Archivos** | Widgets de la Subfase 2 (`kpis-admin`, `kpis-profesional`, `agenda-hoy`, `pendientes`, `distribucion-identidad`, `kpis-reportes`), sus servicios y specs. |
| **Alcance** | Máximo 4 KPIs, 1 vista principal y 1 lista de pendientes por rol (DSH-P5). Cada cifra con periodo, fecha de corte y denominador declarado; botón ⓘ como `mat-icon-button` con `aria-label` contextual y definición también disponible para lectores de pantalla. Citas como valor absoluto con periodo. Visualización de identidad de género con la paleta `--color-data-*`, **etiqueta de texto por segmento y tabla alternativa** con `aria-label` y `scope`; `role="progressbar"` sustituido por marcado correcto. Listas con **radicado e iniciales**, nunca nombre completo (DSH-P6). Supresión de celdas pequeñas en vistas filtradas. |
| **Dependencias** | **P-03** (paleta) bloquea la visualización. **P-05** (categorías de identidad de género) bloquea las etiquetas. **P-06** (umbral) bloquea la supresión. **P-02** decide si hay dashboard de Recepción. **P-11** (acceso del Admin al contenido de casos) decide qué puede listar Z2 del Admin. DSH-08-01 **no es implementable** hasta que exista el modelo de especialidades (**P-12**). |
| **Riesgos** | Los mocks deben cuadrar entre sí (DSH-12-06): hoy los totales cuadran (48+52+41 ≠ 156 por diseño; 88+36+24+8 = 156) pero no hay una única fuente de verdad, así que al repartirlos en varios servicios es fácil desincronizarlos. Mitigación: un solo mock base del que deriven las agregaciones, con prueba que verifique la consistencia. |
| **Terminado cuando** | Cada rol de personal cumple la lista de aceptación del §8 del contrato. Ninguna vista de resumen muestra nombre completo de persona atendida. Toda visualización tiene «Ver como tabla» y declara su fecha de corte. Verificado en 375, 768 y 1440 px. |

---

### Subfase 4 — Dashboard del rol Usuario (enfoque informado en trauma)

| IDs | §5 completo: DSH-10-01…17 · DSH-06-04 · DSH-05-05 |
|---|---|
| **Archivos** | Widgets `estado-solicitud`, `proxima-cita`, `mis-compromisos`, `lineas-ayuda`, `preferencias-contacto`; sus servicios; posible ajuste de `CasildaTitleStrategy` (DSH-10-15) y de `auth.service.ts` (DSH-10-14). |
| **Alcance** | Estado de la solicitud en lenguaje claro con el siguiente paso; próxima cita con opción de pedir cambio; compromisos de la persona en tono de acompañamiento; contacto por el canal elegido; líneas de ayuda serenas con `tel:`; preferencias de contacto y privacidad; saludo con el nombre elegido. **Nada de** estadísticas, relato de hechos, información interna, grillas de módulos, jerga ni rojo. Guía de lenguaje §5.3 aplicada a cada cadena. Aviso de DSH-06-04 sobre el historial del navegador y la navegación privada. |
| **Dependencias** | **P-13** (tiempos de respuesta oficiales) bloquea DSH-10-01: sin ellos no se promete plazo. **P-14** (nombre identitario en el modelo) bloquea DSH-10-07. **P-15** (política de lenguaje inclusivo) condiciona la redacción. **P-16** (título/favicon neutros) es decisión abierta. DSH-10-14 choca con la implementación actual: la sesión vive en `localStorage` para todos los roles. |
| **Riesgos** | El más alto en impacto humano y el más bajo en reversibilidad: un texto mal calibrado reexpone. Mitigación: **toda cadena visible se valida con el equipo de atención antes de implementar**, no después (es además el pendiente nº 5 de `CLAUDE.md`). Ningún `[PENDIENTE]` se resuelve por suposición: si falta el dato, el bloque no se muestra. |
| **Terminado cuando** | La vista no contiene ninguna cifra institucional, ningún relato de hechos, ningún dato interno del caso ni ninguna superficie roja distinta de la salida rápida. El texto corrido usa `--font-size-base`. Sin `localStorage` para datos de la persona en este rol. La salida rápida verificada sin obstrucción en 375 px. Cada cadena visible revisada contra §5.3 y aprobada por el equipo de atención. |

---

### Fuera de alcance de esta fase

- **Línea ALMA y UAD Equipos 3 y 4** (§4.4 del contrato): el alcance funcional no está
  documentado y no se diseña por suposición. Además **no son roles**, son secciones del
  menú: antes de diseñarles panel hay que decidir si pasan a ser roles (**P-02**).
- **`/dashboard-revisor`**: panel analítico aparte; se reciben enlaces desde el inicio,
  no se rediseña aquí.
- **DSH-04-08 a nivel de shell**: se evalúa en la Subfase 2 pero puede quedar documentado
  sin ejecutar, por su alcance transversal.

### Dependencias externas

No se requiere **ninguna dependencia nueva**. En particular, **no hace falta librería de
gráficos**: la visualización del §2.3 es una distribución de 4 categorías que se resuelve
con una barra segmentada en CSS —como hoy— más la tabla alternativa que exige DSH-03-03.

Si en una fase posterior el perfil analítico (§4.5) pidiera series temporales o gráficos
con ejes, la recomendación sería **ECharts** (`ngx-echarts`), por licencia Apache-2.0,
soporte de tabla accesible y tamaño modular; la alternativa sin dependencia es **SVG
generado en plantilla** con `@for`, viable hasta ~3 tipos de gráfico y que mantiene el
control total de tokens y accesibilidad. En ambos casos sería una propuesta separada,
con su justificación y su medición de peso de bundle.

---

## 7. Preguntas para el equipo

### Bloqueantes

| # | Pregunta | Bloquea | Origen |
|---|---|---|---|
| **P-01** | **¿Dónde está `casilda-diseno-v1.md`?** No existe en el repositorio ni en el historial de Git, pero es fuente de verdad nº 2 en `CLAUDE.md`, en el skill `casilda-ux`, en el contrato y en dos archivos de `src/`. ¿Se incorpora al repo, o se declara que `CLAUDE.md` §3 + `_tokens.scss` lo reemplazan y se actualizan las cinco referencias? En concreto: ¿define ya tarjeta de indicador (DSH-11-05), zonas del panel o paleta de gráficos? | Subfase 2 | Pendiente 11 del contrato |
| **P-02** | **Catálogo oficial de roles.** El código tiene cinco roles planos (`ADMIN`, `COORDINADOR`, `PROFESIONAL`, `REVISOR`, `USUARIO`). El contrato §4 describe siete perfiles tomados de las secciones del menú y **no menciona `COORDINADOR`**. ¿`COORDINADOR` es «Recepción/Bandeja» (§4.3)? ¿Línea ALMA y UAD 3 y 4 son roles o solo secciones? ¿Qué entrada le corresponde a cada uno en el registro de widgets? | Subfases 2 y 3 | Pendientes 1 y 3 |
| **P-03** | **Aprobación de la paleta `--color-data-*`** del §5.1 de este documento, con la advertencia de que la paleta institucional no da separación de luminancia suficiente para distinguir series solo por color, y que por tanto la etiqueta de texto y la tabla alternativa son obligatorias. | Subfases 1 y 3 | Pendiente 10, DSH-03-01 |
| **P-04** | **Número real de la Línea de Orientación Telefónica**, con horarios y cobertura de las tres líneas. Hasta tenerlo, la línea de la UdeA no se muestra (Subfase 0). | Contenido de Subfases 0 y 4 | Pendiente 5 |
| **P-05** | **Categorías y etiquetas de identidad de género** alineadas con Maestros del Sistema y con el enfoque diferencial. Hoy están quemadas como «Mujeres (Cis/Trans)», «Hombres (Cis/Trans)», «Personas No Binarias», «Disidencias / Otras». | Subfase 3 | Pendiente 7, DSH-03-02 |
| **P-07** | **Nombre oficial único de cada módulo.** Hay seis con nombre divergente entre menú, panel, stepper y `title` de ruta (evidencia en DSH-04-03). | Subfase 2 | Pendiente 9 |
| **P-13** | **Tiempos de respuesta oficiales** comunicables a la persona usuaria. Sin ellos, el estado de la solicitud no promete plazo. | Subfase 4 | Pendiente 12, DSH-10-01 |

### No bloqueantes, pero necesarias antes de cerrar

| # | Pregunta | Afecta | Origen |
|---|---|---|---|
| **P-06** | Umbral de supresión de celdas pequeñas (hoy hay una categoría con 8 casos). | Subfase 3 | Pendiente 8 |
| **P-08** | Validación jurídica del número y denominación de la Resolución Rectoral («41986», sin año en la plantilla). | Subfase 1 | Pendiente 6 |
| **P-11** | ¿El Admin accede al contenido de los casos o solo a datos agregados? Determina qué puede listar su Z2. | Subfase 3 | Pendiente 4 |
| **P-12** | ¿Existirá un modelo de **especialidades** del Equipo de Atención (Jurídico, Psicojurídico, Psicológico, Psicoorientación)? Hoy hay un único rol `PROFESIONAL`, por lo que DSH-08-01 (ver solo los seguimientos de la propia especialidad) **no es implementable**. | Subfase 3 | §4.2, matriz VBG-08-10 |
| **P-14** | ¿El modelo de datos soporta **nombre identitario** distinto del legal? | Subfase 4 | Pendiente 13, DSH-10-07 |
| **P-15** | Política de lenguaje inclusivo del equipo (afecta a cada cadena del rol Usuario). | Subfase 4 | Pendiente 15 |
| **P-16** | ¿Título de pestaña y favicon neutros para el rol Usuario? | Subfase 4 | Pendiente 14, DSH-10-15 |

> **Nota de numeración.** No existen P-09 ni P-10: fueron identificadores de borrador
> usados en el §3 durante la redacción y quedaron absorbidos por **P-21** (nombre corto,
> DSH-01-04) y **P-18** (atajo de la salida rápida, DSH-06-02). Las referencias del §3 ya
> apuntan a los identificadores definitivos. El resto de la numeración se mantiene estable
> para no romper las referencias ya intercambiadas con el equipo.

### Nuevas, surgidas de este diagnóstico

| # | Pregunta | Afecta |
|---|---|---|
| ~~**P-17**~~ | **RESUELTA (2026-10-04).** ADD-01: el equipo decide **mantener** las cuentas de prueba y el selector de roles sin cambios mientras el proyecto esté solo en desarrollo y sin backend. Queda como pendiente 6 de `CLAUDE.md` §5, a resolver antes de conectar el backend o desplegar fuera de desarrollo. | — |
| ~~**P-18**~~ | **RESUELTA (2026-10-04).** DSH-06-02: corrección autorizada y aplicada en la Subfase 0. **Queda pendiente para el equipo** la verificación manual sobre teclado físico latinoamericano en Windows y sobre macOS, que ninguna prueba sintética puede sustituir. | Verificación manual |
| **P-19** | **DSH-10-14.** La sesión se guarda en `localStorage` (`userSession`) para todos los roles, incluido Usuario, que puede usar un dispositivo compartido. La salida rápida la borra, pero cerrar la pestaña no. ¿Se mueve a `sessionStorage` para el rol Usuario? Afecta a `auth.service.ts`, no solo al panel. | Subfase 4 |
| **P-20** | **ADD-07.** `.agents/skills/angular_frontend_guidelines/SKILL.md` declara Angular 17, Material 17 y SweetAlert2, contradiciendo `CLAUDE.md` (Angular 21, SweetAlert2 retirado). ¿Se actualiza el skill antes de la Subfase 2, que es la que más código nuevo crea? | Subfase 2 |
| **P-21** | **DSH-01-04.** No existe campo de nombre corto en `UserSession`. ¿Se deriva en el frontend (nombre de pila) o lo entrega el backend? | Subfase 1 |

---

## 8. Línea base observada

Verificación visual del 4 de octubre de 2026 sobre `http://127.0.0.1:4300/inicio`,
Chromium vía Playwright MCP, en **375 y 1440 px** para **los cinco roles**. No quedó
ningún rol sin revisar.

> **Las imágenes no se versionan.** Lo que importa a futuro es la observación, no el
> archivo: los PNG saturan el repositorio y envejecen mal. Lo observado queda descrito
> aquí y en la columna «Evidencia» del §3, que es lo que permite reproducir la
> verificación. Para repetirla, ver «cómo se cambia de rol en desarrollo» en el §2.1.

| Rol | Ancho | Qué se observó |
|---|---|---|
| ADMIN | 1440 | Cabecera con el rol repetido, 4 KPIs con píldoras de porcentaje, «Gestión del Sistema», barra segmentada de identidad de género y las tres pestañas. |
| ADMIN | 1440 | Pestaña «Ruta del Caso»: stepper con las cinco etapas truncadas, lista con doble marcador (viñeta + ícono) y «Recepción y Radicación» en serif frente a los `h2` en sans. |
| ADMIN | 375 | Apilado móvil correcto; salida rápida colapsada a botón circular y sin obstrucción. |
| COORDINADOR | 1440 / 375 | KPIs de equipo, cinco botones de acción en colores saturados (uno rojo) y «Carga de Trabajo» con nombres completos de profesionales. |
| PROFESIONAL | 1440 / 375 | KPIs de jornada, cinco acciones rápidas de colores y tabla «Citas Programadas para Hoy». |
| REVISOR | 1440 / 375 | KPIs con valores de texto (`< 24h`, `96%`), módulos de auditoría y distribución de identidad de género sin barra. |
| USUARIO | 1440 / 375 | Banner con el teléfono `1234567890`, tres tarjetas de acción y jerga visible («radicado», «trámite»). |
| USUARIO | 1440 | «Mis Solicitudes en Seguimiento» con radicado, nombre del profesional y próxima cita; guía de cuatro pasos. |

**Dato técnico recogido durante la verificación:** el documento no desplaza
(`document.documentElement.scrollHeight > window.innerHeight` → `false`); desplaza
`.main-content` (`app.component.scss:1-6` y `:44-50`). Por eso una captura `fullPage`
devuelve solo la parte visible. Es la evidencia de DSH-04-08.

**Consola:** `NG0100` en `AppComponent` en cada carga de `/inicio` y `NG0913` por el
tamaño intrínseco del logo (ADD-06). Sin errores atribuibles al panel.

---

## 9. Resultado del diagnóstico

| ID | Estado | Evidencia |
|----|--------|-----------|
| DSH-01-01 | CONFIRMADO → **CORREGIDO** (Subfase 1) | `header.component.html:36,47` · `dashboard-home.component.html:8,788` |
| DSH-01-02 | DISTINTO → **CORREGIDO** (Subfase 1) | `dashboard-home.component.scss:153` (CSS, no pipe) |
| DSH-01-03 | CONFIRMADO → **CORREGIDO** (Subfase 2) | `dashboard-home.component.html:18-49` |
| DSH-01-04 | CONFIRMADO → **CORREGIDO** (Subfase 2) | `header.component.html:35` |
| DSH-01-05 | CONFIRMADO → **CORREGIDO** (Subfase 2) | `dashboard-home.component.html:53-67,71-110` |
| DSH-02-01 | CONFIRMADO | `dashboard-home.component.ts:118-160` |
| DSH-02-02 | CONFIRMADO | `dashboard-home.component.ts:141-149` |
| DSH-02-03 | CONFIRMADO | `dashboard-home.component.ts:128` |
| DSH-02-04 | DISTINTO → **CORREGIDO** (Subfase 1) | `dashboard-home.component.scss:131-153,1870-1874`; `#814ea5` = 0 usos |
| DSH-02-05 | CONFIRMADO | `dashboard-home.component.ts:118-167` |
| DSH-02-06 | CONFIRMADO → **CORREGIDO** (Subfase 1) | `dashboard-home.component.ts:111,114,138,148,158` · `…html:542,646` |
| DSH-03-01 | CONFIRMADO | `dashboard-home.component.scss:481-491,547-550,586-600` |
| DSH-03-02 | CONFIRMADO | `dashboard-home.component.ts:161-166` |
| DSH-03-03 | CONFIRMADO → **CORREGIDO** (Subfase 2: tabla con `scope`) | `dashboard-home.component.html:629-634` |
| DSH-03-04 | CONFIRMADO | `dashboard-home.component.ts:165` |
| DSH-04-01 | CONFIRMADO → **CORREGIDO** (Subfase 2) | `sidebar.component.html` · `…html:580-608,794-814,301-322,53-67` |
| DSH-04-02 | CONFIRMADO → **CORREGIDO** (Subfase 2) | `dashboard-home.component.html:92-93` · `…scss:1119-1126` |
| DSH-04-03 | CONFIRMADO → **CORREGIDO** (Subfase 2, nombres pendientes de P-07) | `sidebar.component.html:97,101,115,144,42,170` · `…ts:290,312,334,367,378` |
| DSH-04-04 | CONFIRMADO → **CORREGIDO** (Subfase 2) | `dashboard-home.component.ts:300-309,435,439` |
| DSH-04-05 | CONFIRMADO → **CORREGIDO** (Subfase 1) | `dashboard-home.component.scss:705-707,751-759` |
| DSH-04-06 | CONFIRMADO → **CORREGIDO** (Subfase 1) | `.step-card*`, `.details-*`, `.check-icon` sin regla en `…scss` |
| DSH-04-07 | CONFIRMADO → **CORREGIDO** (Subfase 1) | `_base.scss:10-16` vs. 15 sobrescrituras en `…scss`; medición en navegador |
| DSH-04-08 | DISTINTO | `app.component.scss:1-6,44-50`; `document` no desplaza |
| DSH-05-01 | CONFIRMADO → **CORREGIDO** (Subfase 0) | `environment.ts:9` · `environment.prod.ts:9` · `…html:138,840` |
| DSH-05-02 | CONFIRMADO → **CORREGIDO** (Subfase 1) | `dashboard-home.component.html:138,840-842` |
| DSH-05-03 | CONFIRMADO | `dashboard-home.component.html:839-843` |
| DSH-05-04 | CONFIRMADO → **PARCIAL** (falta P-08) | `dashboard-home.component.html:857-859` |
| DSH-05-05 | CONFIRMADO | `dashboard-home.component.html:837` |
| DSH-06-01 | CONFIRMADO (sin interferencia) | Verificado a 375 px · `_tokens.scss:165-166` |
| DSH-06-02 | VERIFICADO → **CORREGIDO** (Subfase 0) | `quick-exit.component.ts:33` |
| DSH-06-03 | CONFIRMADO (cumple) | `quick-exit.service.ts:5,11,38-56` |
| DSH-06-04 | NO APLICA (contenido nuevo) | — |
| ADD-01 | **ACEPTADO — deuda conocida** | `header.component.html:54-70` · `login.component.html:34-50` · `auth.service.ts:54-73,302-327` |
| ADD-02 | **CORREGIDO** (Subfase 1) | `_tokens.scss:59,68` |
| ADD-03 | **CORREGIDO** (Subfase 1) | `dashboard-home.component.scss:598-599` (3,3:1) |
| ADD-04 | **CORREGIDO** (Subfase 1) | `dashboard-home.component.scss:985,1948,1995` |
| ADD-05 | **CORREGIDO** (Subfase 1) | `dashboard-home.component.scss:1873` · `…html:314,421` |
| ADD-06 | NUEVO — bajo | Consola del navegador (NG0100, NG0913) |
| ADD-07 | NUEVO — bajo | `.agents/skills/angular_frontend_guidelines/SKILL.md` vs. `CLAUDE.md` §2 |

**Pendientes para el equipo:** P-01 a P-21, sin P-09 ni P-10 y con P-17 y P-18 ya resueltas
(§7). Ningún `[PENDIENTE]` del contrato se resolvió por suposición.
