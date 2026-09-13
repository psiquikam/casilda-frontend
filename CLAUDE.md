# CLAUDE.md — Contexto y trazabilidad del frontend de Casilda

> Archivo vivo. Se actualiza al cerrar cada fase de trabajo para que cualquier
> sesión posterior (humana o asistida) retome sin repetir el análisis.
>
> **Última actualización:** 12 de septiembre de 2026 (documentación de accesibilidad reubicada en `docs/evidencias/accesibilidad/`)

---

## 1. Qué es este repositorio

`casilda-frontend` (proyecto Angular `Casilda-FNSP`) es la capa web de **CASILDA**, el
sistema de vigilancia en salud pública de la Universidad de Antioquia para el abordaje
de las discriminaciones y violencias basadas en género (VBG).

Documentos de referencia, en orden de precedencia para decisiones de diseño:

| Documento | Para qué sirve |
|-----------|----------------|
| `casilda-diseno-v1.md` | **Fuente de verdad de UI/UX**: marca UdeA, tokens, accesibilidad y hoja de ruta por fases. |
| `ANALISIS_ARQUITECTURA_Y_MIGRACION.md` | Arquitectura, rutas, servicios y deuda técnica detectada. |
| `AGENTS.md` | Prompt/rol de la migración Angular 17 → 21 (ya completada). |
| `.agents/skills/angular_frontend_guidelines/SKILL.md` | Convenciones obligatorias de código Angular del equipo. |
| `.agents/skills/accessibility/SKILL.md` | Criterios WCAG 2.2 aplicados. |
| `docs/evidencias/accesibilidad/plan_accesibilidad.md` | Diagnóstico, hallazgos H-01…H-18, plan por fases hacia WCAG 2.2 AA y **estado de cada tarea** (§4, §6). |
| `docs/evidencias/accesibilidad/01-fases-1-5-correcciones.md` | Cómo se implementó cada corrección de las fases 1–5 (evidencia de la entrega del 2026-09-11). |

## 2. Stack y comandos

- Angular **21.2** standalone (sin `NgModule`), TypeScript **5.9 strict**, Angular Material 21 (tema M2 compat), RxJS 7.8, SweetAlert2, Karma/Jasmine.
- Rutas con `loadComponent` (lazy) y guards `authGuard` / `roleGuard` / `featureCapabilityGuard`.

```powershell
npm start        # ng serve → http://localhost:4200
npm run build    # build de producción → dist/casilda-fnsp
npm run test:ci  # pruebas headless con cobertura
npm run lint     # ESLint (tope actual: 299 warnings heredados; reglas de accesibilidad = error)
npm run a11y:audit  # auditoría estática de accesibilidad (falla con deuda P0); `-- --detalle` lista cada caso
npm run a11y:rules  # pruebas de la regla ESLint propia casilda/mat-icon-button-accessible-name
npm run check    # lint + a11y:audit + tests + build
```

## 3. Sistema de diseño (obligatorio para toda UI nueva)

Los tokens viven en **`src/styles/_tokens.scss`** y se cargan globalmente desde
`src/styles.scss`. **Ningún componente debe declarar colores, tipografías,
espaciados ni radios literales**: siempre `var(--token)`.

- **Color primario:** verde institucional UdeA `#026937` (Pantone 349 C, 5.16:1 sobre blanco).
- **Secundario / enlaces:** turquesa oscuro `#0e7774`.
- **Tipografía:** `Lora` (`--font-serif`) exclusivamente para `h1`–`h3` y para el
  nombre "Casilda"; `Inter` (`--font-sans`) para todo lo demás, incluido el tema
  Material. Ambas se cargan en `src/index.html`. `Times New Roman` queda como
  primer respaldo del serif para no perder el carácter institucional si Lora no carga.
- **Rojo de marca `#ef434d`:** solo bordes y elementos gráficos (3.76:1 con blanco,
  válido para componentes pero **no** para texto). Para superficies rojas con texto
  blanco se usan `--color-danger-surface` (#c62828) y `--color-danger-surface-hover`.
- **Utilidades globales** en `src/styles/_base.scss`: `.boton` (`--primario`,
  `--secundario`, `--emergencia`), `.casilda-alerta` (+ `--peligro`, `--precaucion`,
  `--exito`), `.visually-hidden`, `.skip-link`, foco visible y `prefers-reduced-motion`.
- **Marca UdeA:** la jerarquía institucional la sostiene el logosímbolo horizontal
  de la UdeA — `assets/Logo-Udea-Blanco-horizontal.png`, recortado a la caja real
  de la marca (ancho mínimo 130 px, tokens `--udea-logo-min-width` y
  `--udea-logo-aspect`) — con el nombre de la dependencia en serif bold. "Casilda" se presenta como texto estilizado
  acompañado del distintivo `logo-custom`, **nunca** integrado al escudo: el manual
  prohíbe crear un logosímbolo propio para iniciativas. El uso del distintivo está
  pendiente de aval de Comunicaciones; si se niega, se retira de
  `header.component.html` y `login.component.html`.

## 4. Componentes transversales

| Componente / servicio | Ubicación | Nota |
|---|---|---|
| `QuickExitComponent` | `src/app/components/quick-exit/` | Botón flotante de **Salida rápida**, montado globalmente en `app.component.html`. |
| `QuickExitService` | `src/app/core/security/quick-exit.service.ts` | Limpia `sessionStorage` + llaves `casilda_*` y `userSession`, y redirige con `location.replace()` a `environment.quickExitUrl`. |
| `ContenidoHomeService` | `src/app/services/contenido-home.service.ts` | Contenido editable del home (`imagen`, `titulo`, `contenido`, vigencia, sección). Hoy devuelve un **mock**; el endpoint previsto es `GET {apiBaseUrl}/contenidos/home`. |
| `CasildaCardComponent` | `src/app/components/casilda-card/` | Tarjeta puramente presentacional alimentada por `ContenidoDestacadoDto`. |
| `CasildaTitleStrategy` | `src/app/core/a11y/casilda-title.strategy.ts` | Título del documento por ruta (`title` en `app.routes.ts`) + sufijo «Casilda — UdeA». |
| `EnfoqueRutaService` | `src/app/core/a11y/enfoque-ruta.service.ts` | Foco al `<main id="contenido-principal">` tras cada navegación. |
| `FiltroColumnaDirective` | `src/app/core/a11y/filtro-columna.directive.ts` | `<input appFiltroColumna="ID del caso">`: nombre accesible, `type="search"`, foco visible. Obligatoria en filtros de cabecera de tabla. |
| `ResumenErroresComponent` + `recolectarErrores()` | `src/app/core/a11y/resumen-errores.component.ts`, `errores-formulario.ts` | Resumen enfocable de errores al enviar (`role="alert"`) con salto al campo. Los inputs listados llevan `id="<prefijo>-<control>"`. |
| `NotificacionService` | `src/app/core/a11y/notificacion.service.ts` | `error()` / `exito()` / `info()` sobre MatSnackBar con `role` adecuado. **Reemplaza a `console.error`** en los `subscribe`. |
| `DialogoService` | `src/app/core/a11y/dialogo.service.ts` | `aviso()` y `confirmar()` sobre MatDialog (`AvisoDialogComponent`, `ConfirmDialogComponent`). **SweetAlert2 fue retirado.** |
| `getPaginadorIntlEs()` | `src/app/core/i18n/paginador-es.ts` | Paginador en español provisto una sola vez en `app.config.ts`. |

## 5. Bitácora de avances

### 2026-08 — Migración Angular 17 → 21 y estabilización
Cuatro fases incrementales con `ng update`, control flow homogeneizado a `@if`/`@for`,
lazy loading por ruta, feature flags por entorno y suite de tests reparada.
Evidencias en `docs/evidencias/auditoria-angular21/`.

### 2026-09-02 — Fases 1 a 3 del sistema de diseño UdeA (este cambio)
Detalle completo en `docs/evidencias/rediseno-udea/01-fases-1-3-sistema-diseno.md`.

- **Fase 1 — Cimientos:** `src/styles/_tokens.scss` y `src/styles/_base.scss`; tema
  Material repaletizado al verde UdeA (antes morado `#814ea5`/`#348F41`);
  `index.html` con `lang="es"`, título descriptivo, `meta description` y fuente Lato.
- **Fase 2 — Salida rápida:** componente flotante + servicio, con clic, `Alt + Q` y
  doble `Escape` (< 1 s), `aria-keyshortcuts`, colapso a botón circular de 44 px
  en pantallas ≤ 900 px y reserva de espacio en el header para no solaparlo.
- **Fase 3 — Landing y login:** home con hero serif, CTAs (reporte seguro /
  orientación telefónica), aviso de privacidad de baja carga y tarjetas servidas
  por el gestor de contenidos; login en dos paneles (institucional + formulario)
  con etiquetas asociadas, `autocomplete`, toggle de contraseña anunciado,
  estado `aria-live` y recuperación de contraseña por correo de soporte.
- **Retiro de acceso público a "Consultar caso"** en la navegación pública y en el
  login (la ruta `/seguimiento` queda tras feature flag, para uso autenticado).

### 2026-09-03 — Ajustes de la primera revisión
- **Tipografía modernizada:** `Lora` + `Inter` en reemplazo de `Times New Roman` + `Lato`
  (decisión del equipo; se conserva un serif para no romper el tono institucional).
- **Retorno al inicio:** el bloque de marca del header es ahora un enlace a `/home`
  (con el distintivo de Casilda restituido a su izquierda), la navegación pública
  abre con "Inicio" y marca la ruta activa con `aria-current="page"`, y el login
  —que se renderiza a pantalla completa, sin header— tiene su propio
  "Volver al inicio".
- **Distintivo de Casilda:** se mantiene acompañando al texto en el header y en el
  panel del login, documentado como pendiente de aval de marca.

### 2026-09-03 — Ajustes de la segunda revisión: proporción del cromo fijo
Motivo: el encabezado, la navegación y el pie ocupaban ~250 px en escritorio y
hasta ~280 px en móvil, dejando poco alto útil y obligando a desplazarse en
exceso; el formulario multipaso se veía recortado.

- **Logosímbolo UdeA recortado:** `assets/Logo-Udea-Blanco-horizontal.png` es el
  PNG original recortado a la caja real de la marca (1470 × 378, relación 3.89:1).
  El archivo original tenía un lienzo transparente de 2043 × 1222 que, al aplicar
  el ancho mínimo de 130 px, aportaba 55 px de alto vacío al encabezado. **El
  ancho mínimo del manual se conserva y ahora corresponde a la marca visible.**
  El asset original queda en el repositorio sin uso, por si Comunicaciones exige
  un recorte distinto.
- **Encabezado en una sola fila:** el descriptor institucional y el nombre de la
  dependencia pasan a acompañar horizontalmente a su marca (filete de separación)
  en lugar de apilarse. Alto: 96 px → **64 px** (escritorio) y **56 px** (≤900 px).
  El descriptor sólo se muestra desde 1200 px; por debajo, el mismo mensaje
  encabeza la portada.
- **Navegación pública:** en ≤600 px el texto visible se acorta ("Iniciar",
  "Reportar VBG") y el complemento queda oculto visualmente pero disponible para
  lectores de pantalla, de modo que el nombre accesible completo se conserva
  (WCAG 2.5.3). Antes la fila se rompía en dos o tres líneas.
- **Pie público dentro del área desplazable:** deja de ocupar alto fijo del
  viewport y aparece al final del contenido (`app.component.html`). En móvil
  llegaba a robar tres filas. Conserva los tres canales de contacto.
- **`100dvh`** en los tres contenedores de página: con `100vh` la barra de
  direcciones móvil dejaba el último tramo del contenido fuera de la pantalla.
- **Formulario anónimo:** se eliminaron las alturas forzadas de 36 px y los
  desplazamientos fijos de la etiqueta flotante (rompían el área táctil mínima y
  recortaban los campos); ahora los campos miden 48 px y la etiqueta usa su
  posición nativa. Se recuperó la visibilidad de `mat-hint` y de los mensajes de
  error, que estaban ocultos con `display: none` sobre el subscript de MDC. En
  ≤768 px la cabecera del stepper (5 pasos) se desplaza en horizontal en vez de
  comprimirse. Espaciados y sombras migrados a tokens.

### 2026-09-11 — Plan de accesibilidad, fases 0 a 5 (WCAG 2.2 AA)
Detalle y métricas en `docs/evidencias/accesibilidad/01-fases-1-5-correcciones.md`
(línea base en `00-linea-base.json`, resultado en `01-tras-fases-1-5.json`).

- **Instrumentación:** `tools/auditar-accesibilidad.mjs` (deuda H-01/02/03/12/13/14) y regla
  ESLint propia `casilda/mat-icon-button-accessible-name` con prueba; ambos en CI.
- **P0 a cero:** 98 botones de ícono con nombre contextual, 42 filtros con `appFiltroColumna`
  y foco visible, 21 rutas con `title` + `CasildaTitleStrategy`.
- **Orientación:** foco al `<main>` al navegar, `h1` en las 6 vistas que no lo tenían,
  `aria-current` en menús, sidenav superpuesto bajo 900 px, tablas con `aria-label` y `scope`,
  filas expandibles con `aria-expanded` + `inert`.
- **Formularios:** `autocomplete` con política de privacidad documentada (reporte anónimo),
  instrucciones en `<mat-hint>` (no `placeholder`), entrada sin mutación al teclear, resumen
  de errores enfocable en reporte anónimo y solicitud de acompañamiento.
- **Retroalimentación:** `NotificacionService` reemplaza 47 `console.error`; SweetAlert2
  retirado en favor de `DialogoService`/MatDialog.
- **Tokens:** paleta heredada `#348F41` eliminada (→ `--color-primary`), 524 literales
  migrados a tokens, piso tipográfico de 14 px, `LOCALE_ID` es-CO.
- **Colateral:** handlers «Eliminar» intercambiados entre Rutas activadas y Remisiones en
  `registro-caso` y `registro-atencion`, corregidos.

### Pendiente
1. Accesibilidad — tareas abiertas priorizadas en
   `docs/evidencias/accesibilidad/plan_accesibilidad.md` §6: fases 0.1/0.2/0.4 (axe,
   Lighthouse, recorrido con teclado), 2.4 (conectar `ResumenErroresComponent` a
   `registro-caso` y `registro-atencion`), 4.2 (136 colores literales sin token), 4.4/4.5
   (reflujo 320 px y texto 200 %), 5.3 (`jasmine-axe`) y Fase 6 (NVDA/VoiceOver, personas
   usuarias, declaración de accesibilidad).
2. Sustituir el mock de `ContenidoHomeService` por el endpoint real del gestor de contenidos.
3. Confirmar con Comunicaciones UdeA: dependencia exacta del logosímbolo y uso del
   distintivo de Casilda como favicon.
4. Datos reales de contacto: `environment.telefonoOrientacion` y los del pie público.
5. Validar con el equipo de atención el tono de los mensajes de error y notificaciones.

## 6. Reglas que no se deben romper

1. Nada de listas, URLs, colores ni textos de negocio quemados en componentes:
   backend, `environment` o tokens.
2. Todo `subscribe()` maneja `next` **y** `error`.
3. Componentes standalone; se importa solo el módulo Material que se usa.
4. Área táctil mínima 44 px, contraste mínimo 4.5:1 en texto y foco siempre visible.
5. El color nunca es el único portador de significado: acompáñalo de ícono y texto.
6. La Salida rápida es funcionalidad crítica de seguridad: no se degrada ni se oculta.
7. Todo `<button mat-icon-button>` lleva `aria-label` (o `[attr.aria-label]` contextual) y su
   `<mat-icon>` `aria-hidden="true"`; `matTooltip` no es nombre accesible. El lint lo exige.
8. Toda ruta nueva declara `title`; toda vista tiene un único `h1`; los filtros de tabla usan
   `appFiltroColumna`; los errores de red pasan por `NotificacionService`, los modales por
   `MatDialog` (`DialogoService`), nunca por `alert`/`confirm`/SweetAlert2.
9. `autocomplete`: semántico solo para datos de la persona usuaria; `off` en formularios sobre
   terceras personas y en los datos de contacto del reporte anónimo (ver comentario en la plantilla).
