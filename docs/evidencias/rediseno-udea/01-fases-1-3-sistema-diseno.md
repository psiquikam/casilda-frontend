# Evidencia — Sistema de diseño UdeA, Salida Rápida, Landing y Login

**Fecha:** 2 de septiembre de 2026 (revisado el 3 de septiembre de 2026)
**Alcance:** Fases 1, 2 y 3 de la hoja de ruta de `casilda-diseno-v1.md` (§6).
**Rama:** `feature/01/004/casilda/better-ux-for-login`

---

## 1. Fase 1 — Cimientos y tokens de diseño

| Archivo | Cambio |
|---|---|
| `src/styles/_tokens.scss` (nuevo) | Paleta oficial UdeA, aplicación semántica, tipografías, escala modular, espaciados de 4 px, radios, sombras, anillo de foco, área táctil mínima y ancho mínimo del logosímbolo. |
| `src/styles/_base.scss` (nuevo) | Tipografía institucional (serif en `h1`–`h3`), `:focus-visible` global, `.visually-hidden`, `.skip-link`, `.casilda-alerta`, `.boton` y respeto a `prefers-reduced-motion`. |
| `src/styles.scss` | Tema Material repaletizado del morado `#814ea5` al verde institucional `#026937`; acento turquesa `#0e7774`; tipografía Material a Lato; ripples y estados alineados; superficies y bordes por token. |
| `src/index.html` | `lang="es"` (antes `en`), `<title>` descriptivo, `meta description`, `theme-color`, precarga y familias **Lora + Inter**. |

### Decisión de contraste sobre el rojo de marca
`#ef434d` (Pantone 032 C) alcanza **3.76:1** con texto blanco: suficiente para
bordes y elementos gráficos (WCAG 1.4.11 ≥ 3:1) pero **insuficiente para texto**
(1.4.3 ≥ 4.5:1). Se conserva como color de identidad en bordes y se añaden
`--color-danger-surface` `#c62828` (**5.6:1**) y `--color-danger-surface-hover`
`#9b1c1c` (**8.1:1**) para superficies rojas con texto blanco, y
`--color-danger-text` `#b3141f` (**6.3:1**) para texto rojo sobre fondo pastel.

## 2. Fase 2 — Componente global de Salida Rápida

- `src/app/core/security/quick-exit.service.ts`: limpia todo `sessionStorage` y,
  de `localStorage`, las llaves con prefijo `casilda_` **más `userSession`** (la
  sesión autenticada es justamente el dato confidencial que no puede sobrevivir a
  una salida de emergencia); el resto de `localStorage` se preserva para no
  afectar otros flujos de la UdeA. Redirige con `location.replace()` a
  `environment.quickExitUrl`, de modo que el botón "Atrás" no regrese a Casilda.
  Los fallos de almacenamiento se absorben: la redirección debe ocurrir siempre.
- `src/app/components/quick-exit/`: botón fijo en la esquina superior derecha
  (`z-index` 9999), con `aria-label` descriptivo y `aria-keyshortcuts="Alt+Q Escape"`.
  Activación por clic, `Alt + Q` o doble `Escape` en menos de 1 segundo.
  En pantallas ≤ 900 px se reduce a botón circular de 44 × 44 px conservando el
  nombre accesible.
- Montado globalmente en `app.component.html`, fuera de las ramas de layout, para
  que exista también en login y en las vistas autenticadas.
- El header reserva 72 px (o 280 px en escritorio) a la derecha para que el botón
  nunca se superponga al logosímbolo institucional.

## 3. Fase 3 — Landing pública y Login

### Encabezado institucional
Conforme al manual de identidad (§1.C de `casilda-diseno-v1.md`), se retiró el
distintivo gráfico propio del encabezado: "Casilda" se presenta como texto plano
en serif y la identificación visual recae en el **logosímbolo horizontal de la
UdeA** (ancho mínimo 130 px) con el nombre de la dependencia —Facultad Nacional
de Salud Pública— debajo, centrado, en Times New Roman Bold.

> **Desviación documentada:** el manual pide el nombre de dependencia en el color
> 7740 C (`#35944b`); sobre el fondo verde institucional ese tono no alcanza el
> contraste AA, por lo que se usa blanco. Queda pendiente confirmar con
> Comunicaciones UdeA la dependencia exacta y una versión a color del logosímbolo.

### Contenido administrable del home
Las tarjetas de opción dejaron de estar quemadas en el componente. Ahora provienen
de `ContenidoHomeService`, que entrega objetos `{ imagen, titulo, contenido,
vigenciaInicio, vigenciaFin, enlace, seccion }` filtrados por vigencia. El servicio
devuelve hoy un **mock** que reproduce las opciones vigentes, con el endpoint real
ya declarado (`GET {apiBaseUrl}/contenidos/home`) y marcado con `TODO(backend)`.
`CasildaCardComponent` quedó puramente presentacional (`input.required`,
`ChangeDetectionStrategy.OnPush`) y renderiza imagen, título y contenido; si el
contenido trae `enlace` se comporta como enlace navegable, si no, como tarjeta
informativa sin foco.

> `enlace` y `seccion` son extensiones al objeto descrito en el briefing: la
> primera permite que la tarjeta dirija a un flujo, la segunda ubica el contenido
> en el bloque de acciones o en el de información. Ambas deben confirmarse con backend.

### Home
Hero con `h1` en serif ("Casilda: un espacio seguro de escucha y orientación"),
párrafo empático, CTA primario "Iniciar reporte seguro" y CTA crítico "Orientación
telefónica de emergencia" (fondo pastel, borde rojo de marca, texto rojo oscuro),
aviso de privacidad de baja carga con ícono de candado, y estados de carga y error
anunciados con `role="status"` / `aria-live="polite"`. Las tarjetas se listan con
semántica de lista dentro de secciones rotuladas por `aria-labelledby`.

### Login
Dos paneles en escritorio (institucional a la izquierda, formulario a la derecha)
que colapsan a una sola columna por debajo de 900 px. Etiquetas asociadas por
`for`/`id` vía `mat-form-field`, `autocomplete="username"` y `current-password`,
`aria-invalid` en error, mensajes de error descriptivos, toggle de contraseña con
`aria-label` dinámico y `aria-pressed`, botón "Ingresar de forma segura" con
spinner y región `aria-live` que anuncia la verificación, y enlace de recuperación
en turquesa `#0e7774` hacia el correo de soporte.

### Retiro del acceso público a "Consultar caso"
Se eliminó el ítem "Consultar caso" de la navegación pública y el enlace
"¿Eres un ciudadano? Consulta tu caso aquí" del pie del login. La ruta
`/seguimiento` permanece protegida por `featureCapabilityGuard`
(`publicTrackingPrototype`, apagado en producción) a la espera de reubicarse
dentro de una sesión autenticada. Hay pruebas que verifican que ninguna de las
dos vistas públicas vuelva a exponer ese enlace.

### Otros ajustes de accesibilidad
- Enlace "Ir al contenido principal" (`.skip-link`) y `<main id="contenido-principal">`
  en ambas ramas del layout.
- Navegación pública convertida a `<nav>` + lista, con área táctil de 44 px.
- Pie público con enlaces reales (`tel:`, `mailto:`, sitio UdeA), encabezado oculto
  para lectores de pantalla y aviso de apertura en pestaña nueva.
- Overlay global de carga con `role="status"` y texto alternativo.

## 4. Verificación

| Comprobación | Resultado |
|---|---|
| `npm run build` (producción) | ✅ Bundle generado. 4 advertencias de presupuesto SCSS **preexistentes** (`registro-caso`, `registro-atencion`, `formulario-acompanamiento`, `atencion-pr`), ninguna en los archivos intervenidos. |
| `npm run test:ci` | ✅ **94/94** pruebas en verde (línea base 69; se añadieron 25 casos: salida rápida, contenido del home, tarjeta, home, login y navegación pública). |
| `npm run lint` | ✅ 303 warnings = tope configurado. La línea base era 305 y **ya excedía** el tope; se redujeron dos warnings heredados (`inject()` en `HeaderComponent`, import sin uso en `custom-date-adapter.ts`). |
| Contraste | Verificado por cálculo de luminancia relativa en los pares texto/fondo introducidos (detalle en §1). |

**No ejecutado en este ciclo (Fase 4):** auditoría automática con axe/Lighthouse,
pruebas con lectores de pantalla reales y validación cruzada en navegadores y
dispositivos móviles.


---

## 5. Revisión del 3 de septiembre de 2026

### 5.1 Tipografía
Times New Roman se percibió poco actual en pantalla. Se sustituye por **Lora**
para `h1`–`h3` y el nombre "Casilda", y por **Inter** para cuerpo, formularios,
botones y el tema Material. Se conserva un serif en los encabezados para no
romper el "matrimonio tipográfico" clásico-moderno que pide el manual, y
`Times New Roman` queda como primer respaldo de `--font-serif`. Cambio
concentrado en dos tokens: ningún componente declara familias tipográficas.

### 5.2 Retorno al inicio
No existía forma de volver al home desde `/login` ni desde `/formulario-anonimo`.
Se resolvió en tres puntos, uno por cada contexto de navegación:

| Contexto | Solución |
|---|---|
| Rutas públicas y autenticadas con header | El bloque de marca (`distintivo + "Casilda"`) es un enlace a `/home`, con nombre accesible "Casilda — ir a la página de inicio" y foco visible sobre el verde institucional. |
| Navegación pública | Nuevo ítem "Inicio" como primer acceso; los tres ítems marcan la ruta activa con `routerLinkActive` y `aria-current="page"`. |
| Login (pantalla completa, sin header) | Enlace propio "Volver al inicio" con ícono de retroceso, en turquesa institucional. |

### 5.3 Distintivo de Casilda
Se restituye el distintivo (`assets/distintivo_casilda.svg`, ícono `logo-custom`)
acompañando al texto en el header y en el panel del login. Lectura del manual: lo
prohibido es **crear un logosímbolo propio que compita con el escudo o se integre a
él**; aquí opera como distintivo junto a un texto plano, mientras el logosímbolo
horizontal de la UdeA conserva la jerarquía institucional. Queda como decisión
pendiente de aval de Comunicaciones, aislada en dos plantillas.

### 5.4 Verificación de la revisión
- `npm run build`: ✅ (mismas 4 advertencias de presupuesto SCSS preexistentes).
- `npm run test:ci`: ✅ **96/96** (+2 casos: retorno al inicio en login y en la navegación pública).
- `npm run lint`: ✅ 303 = tope configurado.
