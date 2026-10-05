# Subfase 1 — Correcciones transversales sin cambiar la estructura

> **Fecha:** 4 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards`.
> **Diagnóstico de origen:** `docs/evidencias/dashboards/00-diagnostico-y-plan.md`.
> **IDs cubiertos:** DSH-01-01 · DSH-01-02 · DSH-02-04 · DSH-02-06 · DSH-04-05 · DSH-04-06 ·
> DSH-04-07 · DSH-05-02 · DSH-05-04 · DSH-05-05 (parcial) · ADD-02 · ADD-03 · ADD-04 · ADD-05.
>
> **Qué NO hace esta subfase:** no reorganiza el panel. Las zonas Z1–Z6, el retiro de la
> grilla de módulos, los estados de carga/vacío/error y los dashboards por rol son las
> Subfases 2 a 4. Aquí el panel sigue teniendo la misma estructura; lo que cambia es que
> está correcto en formato, color y tipografía.

---

## Resultado

| ID | Estado | Evidencia (archivo:línea) |
|----|--------|---------------------------|
| DSH-01-01 | **CUMPLE** | Insignia del saludo retirada (`dashboard-home.component.html:7-11`); píldora del encabezado retirada (`header.component.html:35-37`); título del catálogo sin rol (`…html:794`). Única aparición: `header.component.html:46`. |
| DSH-01-02 | **CUMPLE** | `text-transform: capitalize` eliminado (`dashboard-home.component.scss:118-126`); `fechaFormateada` sustituido por `hoy` + `DatePipe` (`…ts:196-201`, `…html:10`). |
| DSH-02-04 | **CUMPLE** | **0 literales de color** en `dashboard-home.component.scss` y en `header.component.scss` (antes 80 y 11). KPIs con superficie neutra única (`…scss:218-316`). |
| DSH-02-06 | **CUMPLE** | Mocks numéricos (`…ts:124-129, 146-181`); `DecimalPipe`/`PercentPipe` en plantilla (`…html:285-302`). |
| DSH-04-05 | **CUMPLE** | `grid-template-columns: repeat(5, 1fr)` y sin `text-overflow` (`…scss:617-621, 661-676`). |
| DSH-04-06 | **CUMPLE** | Bloque `.step-card*` + `.details-*` escrito (`…scss:712-845`); bloque muerto `.step-detail-card` eliminado. |
| DSH-04-07 | **CUMPLE** | `h1` y todos los `h2`/`h3` del panel en `--font-serif`; prueba que lo fija (`…spec.ts:231-247`). |
| DSH-05-02 | **CUMPLE** | Las tres líneas son enlaces `tel:` (`…html:845-861`), con estilo propio (`…scss` → `.protocol-card__tel`). |
| DSH-05-04 | **PARCIAL** | «Ley 1581 **de 2012**» corregido (`…html:878`). La Resolución Rectoral sigue pendiente de validación jurídica (**P-08**). |
| DSH-05-05 | **PARCIAL** | El aviso declara su audiencia: «Para el equipo de atención: …» (`…html:838`). La versión para el rol Usuario es Subfase 4. |
| ADD-02 | **CUMPLE** | `--color-danger` y `--color-info` apuntaban a variables inexistentes (`_tokens.scss:59,68`). |
| ADD-03 | **CUMPLE** | El porcentaje de la categoría «Disidencias / Otras» ya no usa el rojo de marca como texto (3,3:1). |
| ADD-04 | **CUMPLE** | Los tres tokens inexistentes con *fallback* literal se sustituyen por tokens vigentes. |
| ADD-05 | **CUMPLE** | Accesos rápidos con un tratamiento único (`…scss` → `.btn-quick-action`); sin superficies rojas. |

---

## Lo que se ve distinto

Esta subfase no rediseña, pero sí deja varios cambios visibles:

| Antes | Ahora |
|---|---|
| «Domingo, 4 De Octubre De 2026» | «domingo, 4 de octubre de 2026» |
| «30.8%» | «30,8%» |
| `h1` «Hola, …» en Inter y `h3` «Recepción y Radicación» en Lora | `h1`–`h3` en Lora, jerarquía coherente |
| «Recepción y Radic…», «Bandeja y Contact…» | Etiquetas completas en dos líneas |
| Tarjeta de etapa sin estilos: ícono descolgado, viñeta + ícono por ítem | Tarjeta con jerarquía, un solo marcador por ítem |
| El rol cuatro veces (encabezado, menú, saludo, título del catálogo) | Una sola vez, en el menú de usuario |
| Cinco accesos rápidos en verde, ámbar, cian, rojo e índigo | Un tratamiento único; el rojo vuelve a ser exclusivo de la salida rápida |
| KPIs en cuatro colores sin significado | Superficie neutra única; el color queda libre para marcar estados |
| Etiquetas de KPI en MAYÚSCULAS | Tipo oración |

---

## Decisiones que conviene revisar

**1. El color de las series de la distribución no es el definitivo.** Las categorías pasaron
de `colorClass: 'female' | 'male' | …` a `serie: 1 | 2 | 3 | 4`: el color ya **no se asigna
por categoría** sino por orden de aparición, lo que elimina de raíz el estereotipo
morado→mujeres / azul→hombres. Pero mientras no se apruebe la paleta `--color-data-*`
(**P-03**), las series usan los alias complementarios oficiales ya declarados
(`--color-primary`, `--color-comp-blue`, `--color-comp-purple`, `--color-comp-orange`).
La paleta definitiva, la tabla alternativa accesible y la revisión de las etiquetas
(**P-05**) son de la Subfase 3.

**2. La barra segmentada pasó a `aria-hidden`.** Llevaba `role="progressbar"` sin
`aria-valuenow`, lo que anuncia a los lectores de pantalla un control que no existe. El dato
lo porta la cuadrícula de abajo, que sí tiene etiqueta y cifra en texto. Es una mejora
inmediata, no la solución completa de DSH-03-03: la tabla alternativa llega en la Subfase 3.

**3. Tres tokens nuevos y dos corregidos en `_tokens.scss`.** Los cambios en el sistema de
diseño se reportan, no se improvisan:

| Token | Valor | Por qué |
|---|---|---|
| `--udea-green-349-rgb`, `--udea-blue-7718-rgb` | `2, 105, 55` / `14, 119, 116` | Permiten construir transparencias sin repetir el hexadecimal. Mismo patrón que la paleta complementaria ya existente. |
| `--color-primary-rgb`, `--color-primary-tint`, `--color-primary-border`, `--color-primary-ring`, `--color-secondary-rgb`, `--color-secondary-tint` | derivados | Sustituyen los `rgba(2, 105, 55, …)` repetidos por el panel. |
| `--font-mono` | `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace` | El panel invocaba `var(--font-mono, monospace)`, un token que no existía. Se usa en los códigos de radicado. |
| `--color-danger` | `var(--udea-pantone-032)` *(corregido)* | Apuntaba a `--udea-red-032`, inexistente. |
| `--color-info` | `var(--udea-pantone-633)` *(corregido)* | Apuntaba a `--udea-blue-633`, inexistente. |

Los dos últimos son **ADD-02** y afectan a más de 20 componentes fuera del panel: hasta hoy
`.casilda-alerta--peligro` y `.boton--emergencia` no pintaban el borde previsto.

**4. Las tarjetas de acción del rol Usuario se serenaron.** Tenían tres acentos saturados
distintos (verde, azul, morado). Ahora una sola acción principal en verde institucional y
las otras dos como acción secundaria. Es coherente con DSH-P5 y anticipa el tono del
enfoque informado en trauma, pero **toca una vista del rol Usuario**, cuyo rediseño
completo es la Subfase 4: si prefieren revisarlo todo junto allí, se revierte fácil.

**5. Hallazgo nuevo: el `LOCALE_ID` es-CO no llegaba a las pruebas.** Se provee en
`app.config.ts`, que no interviene en las pruebas unitarias, así que los pipes caían a
`en-US` y una aserción de formato regional no habría comprobado nada. Se registra
explícitamente en el spec (`dashboard-home.component.spec.ts:15-18, 33`). Conviene aplicar
lo mismo en cualquier spec futuro que verifique fechas o cifras.

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run build` | Pasa, sin errores. |
| `dashboard-home.component.spec.ts` | **20 casos en verde** (7 de Subfase 0 + 7 nuevos de Subfase 1 + 6 previos). |
| `npm run test:ci` | 190 de 191. El único fallo es `RegisterComponent`, **preexistente** (ver reporte 01). |
| `npm run a11y:audit` | Sin deuda nueva. **SCSS con colores literales: 31 → 29 archivos.** `font-size < 14px`: 5 → 4. |
| `npm run lint` | **302 warnings, los mismos de antes de empezar**: 0 nuevos (verificado con el informe por archivo). Sigue por encima del tope de 299 por la causa preexistente `d3066e0`. |
| Revisión en navegador | Roles ADMIN y PROFESIONAL a 1440 px. Fecha en minúscula, `h1` en Lora, porcentajes con coma, stepper sin truncar, tarjeta de etapa con estilos, accesos rápidos sin rojo. |

### Pruebas nuevas

| Prueba | Qué fija |
|---|---|
| «escribe la fecha en español y en minúscula» | DSH-01-02, incluido que ningún CSS reintroduzca `text-transform`. |
| «formatea los porcentajes con coma decimal» | DSH-02-06 en el render. |
| «entrega los porcentajes como número» | DSH-02-06 en el mock: impide volver a cadenas preformateadas. |
| «tiene un único h1 y lo escribe en la serif» | DSH-04-07 + regla 8 de `CLAUDE.md`. |
| «no fuerza la sans en ningún encabezado h2 o h3» | DSH-04-07; falla si alguien vuelve a sobrescribir la fuente. |
| «el saludo ya no repite el nombre del rol» | DSH-01-01. |
| «el catálogo de módulos no lleva el rol en su título» | DSH-01-01. |

---

## Pendientes para el equipo

- **[P-03]** Paleta `--color-data-*`. Hasta aprobarla, las series usan los alias
  complementarios existentes. Bloquea el cierre de DSH-03-01 en la Subfase 3.
- **[P-08]** Validación jurídica del número y denominación de la Resolución Rectoral
  («41986», sin año). Es lo único que falta de DSH-05-04.
- **[P-21]** Nombre corto de la persona usuaria: el encabezado sigue truncando
  «Super Administrador CASI…» (DSH-01-04, previsto para cuando exista el dato).
- **¿Se aceptan las tarjetas de acción del rol Usuario ya serenadas** (punto 4), o se
  revierten para revisarlas junto al resto de la vista en la Subfase 4?
- **[lint]** Sigue sin decidirse si se corrigen los tres warnings de `d3066e0` o se ajusta
  el tope. `npm run check` no puede pasar en verde hasta entonces.
