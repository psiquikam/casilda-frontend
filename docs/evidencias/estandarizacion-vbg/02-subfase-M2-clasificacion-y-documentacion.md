# Subfase M2 — Clasificación y documentación del hecho

> **Fecha:** 5 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards`.
> **Diagnóstico de origen:** `docs/evidencias/estandarizacion-vbg/00-diagnostico-y-plan.md`.
> **Subfase anterior:** `01-subfase-M1-higiene-y-cimientos.md`.
> **IDs cubiertos:** VBG-00-01…03 · VBG-01-01…10 · VBG-02-01…04 · VBG-03-01…08.
> **Contrato actualizado:** `docs/contratos/DECISIONES_PROVISIONALES_VBG.md` (filas 3, 4 y 5
> corregidas — ver «Hallazgo que corrige el diagnóstico original»).

---

## Alcance real frente al previsto

El diagnóstico original asumía que gran parte de esta sección **no existía**. La
investigación de esta subfase encontró que la mayoría de los campos **ya estaban
implementados**, solo que mal posicionados, sin lógica condicional o con el árbol de
modalidades aplanado. El trabajo de M2 fue entonces menos «crear campos» y más
«reordenar, conectar y corregir el árbol» — con una sola adición genuina: **Ámbito de
Ocurrencia** (VBG-01-06), que no existía en ninguna forma.

**Alcance confirmado:** las secciones 0 a 3 de la matriz existen **únicamente en
`registro-caso`** (grep exhaustivo sobre `registro-atencion.component.html`: cero
coincidencias de «Agregar Hecho», «violenciaGenero», «violenciaMisional» o
«pregunta-container»). No aplica la regla de «secciones repetidas» — no hay nada que
extraer a un componente compartido porque no hay duplicación.

**Hallazgo colateral, no corregido en esta subfase:** `registro-atencion.component.ts`
sí declara los controles `violenciaMisional`/`actividadMisional` (FormGroup, validadores,
payload), pero **ningún elemento de su plantilla los usa** — es código muerto heredado,
de la misma familia que `editarAcuerdo` (EST-04, ya corregido en M1). No se tocó porque
cae fuera de «secciones 0 a 3» (no hay nada que mostrar u ocultar) y retirarlo es una
limpieza de higiene, no de contenido VBG; queda anotado para quien revise
`registro-atencion` en M3/M4.

---

## Hallazgo que corrige el diagnóstico original

El diagnóstico (`00-diagnostico-y-plan.md` §2) marcó VBG-01-01 como **NO EXISTE** y
atribuyó VBG-01-08 a `modal-hechos`. Ambas conclusiones eran incorrectas:

- **VBG-01-01 (radio VBG):** ya existía en `registro-caso.component.html`, dentro de la
  pestaña «Documentación» — el grep original no lo encontró. Lo que sí faltaba era su
  **posición**: la matriz exige que sea «el filtro inicial» (VBG-01-02) y estaba al final
  de la pestaña, después de Lugar de Ocurrencia y «Agregar Hecho».
- **VBG-01-08 (Lugar de Ocurrencia):** el diagnóstico lo citó como viviendo en
  `modal-hechos.component.html:23`. Ese modal tiene un campo de texto libre también
  llamado «Lugar» (ayuda: «Aula 204, Oficina, Virtual…»), pero es un dato **distinto**:
  el detalle de un hecho puntual, no la clasificación Dentro/Fuera/Mixto respecto a
  bienes inmuebles de la matriz. El campo real, con esas tres opciones, siempre estuvo
  en `registro-caso.component.html`, a nivel de caso. Para que la confusión no se
  repita, el campo de `modal-hechos` se renombró a «Lugar específico (opcional)» con un
  `mat-hint` que remite explícitamente al otro.

`DECISIONES_PROVISIONALES_VBG.md` (filas 3, 4 y 5) quedó corregido con esta ubicación
real — ver el registro de cambios al final de este documento.

---

## Resultado

| ID | Estado | Evidencia |
|----|--------|-----------|
| VBG-00-01 (Consentimiento, carga PDF) | **CUMPLE (ya existía)** | Botón «Consentimiento de Atención» en la pestaña «Registro de atención», `registro-caso.component.html`. No se movió de pestaña (ver «Decisión no tomada» más abajo). |
| VBG-00-02 (envío por correo al agendar / carga al iniciar atención) | **PARCIAL** | La carga manual existe; el envío automático por correo al agendar por teléfono depende de una integración de correo saliente que no existe en este módulo — fuera de alcance de frontend. |
| VBG-00-03 (solo PDF) | **CUMPLE** | `subirArchivo()` valida `file.type === 'application/pdf'`; prueba `rechaza un archivo que no sea PDF`. |
| Pendiente 18 (tamaño máx. 10 MB, no obligatorio, estado visible) | **CUMPLE (decisión provisional)** | `TAMANO_MAXIMO_CONSENTIMIENTO_BYTES`; `estadoConsentimiento()` muestra «Consentimiento pendiente» / «Consentimiento cargado»; pruebas dedicadas. |
| VBG-01-01 (radio VBG Sí/No) | **CUMPLE (ya existía, reposicionado)** | `registro-caso.component.html`, ahora primer campo de la pestaña «Documentación». |
| VBG-01-02 (posición: filtro inicial) | **CORREGIDO** | Antes al final de la pestaña; ahora es el primer elemento. |
| VBG-01-03 (Sí → temporalidad, descripción, modalidades, subcategorías) | **CUMPLE** | Temporalidad (`tiempoOcurridoValor`/`Unidad`) dentro de `@if (violenciaGenero === 'SI')`; modalidades (pestaña «VBG») ya estaban condicionadas (sin cambios, ya cumplía). Descripción: ver pendiente 3. |
| VBG-01-04 (No → oculta modalidades, permite guardar) | **CUMPLE (ya existía)** | La pestaña «VBG» completa está en `@if (violenciaGenero === 'SI')`; con `No` el caso guarda igual (probado en navegador). |
| VBG-01-05 (Descripción de los Hechos, texto libre amplio) | **CUMPLE (ya existía)** | `modal-hechos.component.html`, `textarea rows="4"`. |
| VBG-01-06 (Ámbito de Ocurrencia) | **CUMPLE (nuevo)** | Select con las 9 opciones literales de la matriz (`AMBITO_OCURRENCIA`); obligatorio solo si VBG = `Sí`. |
| VBG-01-07 (Forma de Ocurrencia) | **CUMPLE (ya existía, ahora obligatorio si Sí)** | `queForma`; validador condicional nuevo. |
| VBG-01-08 (Lugar de Ocurrencia) | **CUMPLE (ya existía, aclarado)** | Ver «Hallazgo» arriba. Sin obligatoriedad (pendiente 5). |
| VBG-01-09 (Descripción = textarea amplio, no una línea) | **CUMPLE (ya existía)** | `modal-hechos`, confirmado. |
| VBG-01-10 (Lugar de Ocurrencia = bienes inmuebles, texto explícito) | **CUMPLE** | Antes solo en `matTooltip`; ahora también en `<mat-hint>` (R-06). |
| VBG-02-01 (Relación Misional / Institucional) | **CUMPLE (restructurado)** | Ver siguiente fila — nivel 1 + nivel 2. |
| VBG-02-02 (Misional → Docencia/Investigación/Extensión obligatorias) | **CUMPLE (decisión provisional del pendiente 7)** | Checkboxes de nivel 2 visibles solo si «Misional» está marcado; `validarFormulario()` bloquea el guardado si no hay ninguna seleccionada. Probado en navegador y en spec. |
| VBG-02-03 («Institucionales» en la denominación) | **CUMPLE** | Opción «Actividades Institucionales» (ya existía en el catálogo de M1). |
| VBG-02-04 (selección múltiple) | **CUMPLE** | Checkboxes (antes era un `mat-select` de una sola opción). |
| VBG-03-01 (6 modalidades principales) | **CUMPLE** | La pestaña «VBG» pasó de 7 tarjetas a 6; «Informática» dejó de ser tarjeta propia. |
| VBG-03-02 (subcategorías de Sexual) | **CUMPLE** | `listaSexual` ahora expone solo las 3 hojas directas (Acceso carnal violento, Acto sexual violento, Explotación sexual). |
| VBG-03-03 (subcategorías tecnológicas anidadas en Sexual) | **CUMPLE** | Sub-tarjeta «Violencia facilitada por nuevas tecnologías» dentro de la tarjeta de Sexual, visible solo si Sexual = `Sí`. |
| VBG-03-04 (etiquetas literales de la matriz) | **CUMPLE** | Confirmado en navegador: las 6 tarjetas y las 11 opciones visibles coinciden con el texto de la matriz. |
| VBG-03-05 (Explotación sexual anidada, no independiente) | **CUMPLE** | Nunca fue tarjeta de primer nivel en este módulo; ayuda contextual (`?`) con el texto entre paréntesis de la matriz. |
| VBG-03-06 (subcategorías tecnológicas vía «Violencia facilitada…») | **CUMPLE** | Ver VBG-03-03. |
| VBG-03-07 (etiqueta literal «Sexting sin consentimiento») | **CUMPLE (ya existía)** | Confirmado en el catálogo de M1 y en navegador. |
| VBG-03-08 (desplegables dependientes solo si el padre está marcado) | **CUMPLE** | Probado en navegador: subcategorías de Sexual y de la rama tecnológica aparecen/desaparecen con su radio padre. |

---

## Lógica condicional probada (§3 de la matriz)

Cada fila se probó mostrando y ocultando, en navegador (Playwright, rol PROFESIONAL,
1440 px) y en `registro-caso.component.spec.ts`. «Ambos formularios» no aplica: la
sección no existe en `registro-atencion` (ver «Alcance real»).

| Regla | Mostrar | Ocultar |
|---|---|---|
| VBG = `Sí` → temporalidad visible | Verificado: aparece «¿Hace cuánto ocurrió…» + Unidad. | Verificado: con `No`, el bloque no se renderiza. |
| VBG = `Sí` → Ámbito y Forma obligatorios | Verificado: aparece `*` en ambas etiquetas (lo añade Angular Material al activar `Validators.required`, sin asterisco duplicado) y el guardado falla si están vacíos. | Verificado: con `No`, ambos campos quedan opcionales y el caso guarda vacío. |
| VBG = `Sí` → pestaña «VBG» (modalidades) visible | Verificado: la pestaña aparece en el `tablist`. | Verificado (ya existía): con `No`, la pestaña no se renderiza. |
| VBG = `No` → el evento se puede guardar | Verificado en navegador: «Guardar» completa con «¡Guardado Exitoso!» con VBG en `No`. | — |
| Relación Misional incluye «Misional» → nivel 2 visible y obligatorio | Verificado en navegador y en spec: al marcar «Misional» aparecen Docencia/Investigación/Extensión con el texto «Selecciona al menos una…»; `validarFormulario()` bloquea sin selección. | Verificado: al desmarcar «Misional», el bloque de nivel 2 desaparece. |
| Modalidad `Sexual` = `Sí` → subcategorías visibles | Verificado en navegador: aparecen los 3 checkboxes directos + la sub-tarjeta tecnológica. | Verificado (ya existía): con `No`, nada se renderiza. |
| «Violencia facilitada por nuevas tecnologías» = `Sí` → sus 4 subcategorías visibles | Verificado en navegador: aparecen Uso/explotación/trata, Grooming, Creación de contenido, Sexting sin consentimiento. | Verificado: con `No`, el bloque no se renderiza. |
| Ámbito = `Otro` → «¿Cuál?» visible (pendiente 4, opcional) | Verificado en navegador: campo «¿Cuál? (Ámbito)» aparece al elegir «Otro». | Verificado: con cualquier otra opción, el campo no se renderiza. |

---

## Decisión no tomada: posición de la pestaña de Consentimiento

VBG-00-02 sugiere que el consentimiento se carga «al iniciar la atención», lo que
podría leerse como que su pestaña debería ir **antes** que Documentación/VBG/Presunto
agresor. Hoy vive en «Registro de atención», la sexta pestaña, detrás de ellas.

**No se movió.** Reordenar pestañas en este componente significa renumerar el `switch`
completo de `construirRegistroAtencionRequest(tabIndex)` (11 `case` dependientes del
índice actual) y las condiciones `[disabled]="!casoId"` / `!atencionId"` que cada pestaña
usa — un cambio estructural grande, de alto riesgo, sin poder probarlo contra un backend
real (sigue bloqueado por `403`, ver M1). La ganancia de UX de adelantar una pestaña no
justifica ese riesgo dentro de esta subfase. Se deja como pregunta para el equipo abajo.

---

## Payload: campos nuevos, pendientes de confirmación del backend

`construirRegistroAtencionRequest()`, `case 2` (pestaña Documentación), payload nuevo:

```ts
idambitoocurrencia: number | null,          // VBG-01-06, nuevo
idsRelacionMisionalNivel1: number[],        // reemplaza a idactivadmisional (singular)
idsRelacionMisionalNivel2: number[]
```

Los tres son **provisionales**: no hay backend alcanzable para confirmar su forma real
(sigue bloqueado por `403`, documentado en M1). `idactivadmisional` (singular) se
retiró del payload porque la estructura pasó de una selección única a dos niveles
multi-selección — enviar un solo id habría sido inventar cuál de los seleccionados es
«el» valor. Si el equipo de backend confirma otra forma (por ejemplo, un único array
combinado), el ajuste es solo en este `case`.

---

## Archivos

**Nuevos:** ninguno (todo el trabajo fue sobre archivos existentes).

**Modificados**

| Archivo | Qué cambió |
|---|---|
| `registro-caso.component.ts` | Controles `ambitoOcurrencia`/`ambitoOcurrenciaOtro` nuevos; `violenciaMisional`/`actividadMisional` reemplazados por `relacionMisionalNivel1Sel`/`relacionMisionalNivel2Sel`; `configurarValidacionDocumentacionVbg()` (reemplaza a `configurarValidacionActividadMisional()`); `esRelacionMisionalSeleccionada()`, `esAmbitoOtro()`, `estadoConsentimiento()` nuevos; `subirArchivo()` valida PDF y 10 MB; `validarFormulario()` bloquea Misional sin nivel 2; `tabFieldMap` y payload (`case 2`) actualizados. |
| `registro-caso.component.html` | VBG reposicionado al inicio de «Documentación»; Ámbito de Ocurrencia + «¿Cuál?» nuevos; Relación Misional restructurada a dos niveles de checkboxes; tarjeta «Tipo de violencia sexual informática» absorbida dentro de la tarjeta de Sexual; tooltips de Lugar de Ocurrencia y protocolo misional migrados/complementados a `<mat-hint>`; estado de consentimiento visible. |
| `registro-caso.component.scss` | `.vbg-subcard` (anidamiento visual de la rama tecnológica) y `.mat-hint-inline`, ambos con tokens. |
| `registro-caso.component.spec.ts` | 11 pruebas nuevas: lógica condicional VBG-01, Ámbito «Otro», Relación Misional (2 niveles), árbol Sexual/tecnológica, validación de consentimiento (tipo y tamaño). |
| `modal-hechos.component.html` | Campo «Lugar» renombrado a «Lugar específico (opcional)» con `mat-hint` aclaratorio; ayuda de «Descripción» migrada de `matTooltip` a `mat-hint` (R-06); «Lugar» deja de ser obligatorio para el botón «Agregar». |
| `core/catalogos/respaldo-maestros-vbg.ts` | Nuevas claves `ambito-ocurrencia`, `relacion-misional/nivel-1`, `relacion-misional/nivel-2`; `modalidades-violencia/tipo/3` ahora expone solo los 3 hijos directos de Sexual (antes incluía también los 4 de la rama tecnológica, duplicados con `tipo/6`); se retiró el helper `descendientes()`, que quedó sin uso. |
| `docs/contratos/DECISIONES_PROVISIONALES_VBG.md` | Filas 3, 4 y 5 corregidas con la ubicación real de los campos (ver «Hallazgo»). |
| `docs/evidencias/estandarizacion-vbg/00-diagnostico-y-plan.md` | M2 marcada ejecutada; nota de corrección sobre VBG-01-01 y VBG-01-08. |

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run build` | Pasa, sin errores. |
| `npm run test:ci` | **248 de 248.** 11 casos nuevos (lógica condicional VBG-01/02/03, consentimiento). |
| `npm run a11y:audit` | Sin deuda nueva. |
| `npm run lint` | **297 de 299** (mismo nivel que al cierre de M1; cero avisos nuevos). |
| `npm run check` | **Pasa completo.** |
| Navegador, rol PROFESIONAL, 1440 px | Verificado end-to-end: VBG primero en «Documentación», Ámbito con sus 9 opciones y «¿Cuál?» condicional, Forma/Ámbito con `*` solo cuando corresponde (sin duplicado), Relación Misional con sus dos niveles, pestaña «VBG» con 6 tarjetas (Sexual con la rama tecnológica anidada y sus 4 subcategorías), guardado exitoso de principio a fin. |
| Navegador, 375 px | Verificado: una columna, formulario legible, cabecera de pestañas se desplaza en horizontal (comportamiento documentado desde el rediseño del 2026-09-03, sin cambios). |
| Paneles de rol (DSH) | **No aplica.** Esta subfase no modificó catálogos ni términos consumidos por los paneles de inicio (`dashboard-por-rol.ts`, `MiProcesoService`, `VigilanciaService` intactos). |

### Bug encontrado y corregido durante la propia verificación

Al marcar VBG = `Sí`, las etiquetas «Ámbito de Ocurrencia» y «¿En qué forma ocurrió el
hecho?» mostraban **dos asteriscos** (`Ámbito de Ocurrencia **`): uno que yo agregaba a
mano en el texto del `mat-label` y otro que Angular Material añade automáticamente
cuando el control tiene `Validators.required`. Se corrigió quitando el asterisco manual
— Material ya refleja correctamente el estado del validador, sin intervención adicional.

---

## Pendientes para el equipo

- **Confirmar la forma del payload** `idambitoocurrencia` / `idsRelacionMisionalNivel1` /
  `idsRelacionMisionalNivel2` — no se pudo validar contra el backend real (sigue
  bloqueado por `403`).
- **¿Se mueve la pestaña de Consentimiento?** VBG-00-02 sugiere que debería ir antes de
  Documentación; hoy es la sexta pestaña. No se movió por el riesgo de renumerar todo el
  `switch` de guardado sin poder probarlo contra un backend real — ver «Decisión no
  tomada» arriba.
- **Limpieza de código muerto en `registro-atencion`:** los controles
  `violenciaMisional`/`actividadMisional` siguen declarados en el `.ts` sin ningún campo
  en la plantilla que los use. No se tocó por estar fuera de «secciones 0 a 3»; queda
  para quien revise `registro-atencion` en M3 o M4.
- Todos los pendientes de `DECISIONES_PROVISIONALES_VBG.md` siguen abiertos para
  validación del equipo — las filas 3, 4, 5 y 18 son las que esta subfase implementó o
  corrigió.

---

Quedo a la espera de aprobación para continuar con **M3 — Identificación, presunto
agresor y apreciaciones (secciones 4 a 6)**.
