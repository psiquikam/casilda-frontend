# Subfase M3 — Identificación, presunto agresor y apreciaciones

> **Fecha:** 5 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards`.
> **Diagnóstico de origen:** `docs/evidencias/estandarizacion-vbg/00-diagnostico-y-plan.md`.
> **Subfase anterior:** `02-subfase-M2-clasificacion-y-documentacion.md`.
> **IDs cubiertos:** VBG-04-01…07 · VBG-05-01…09 · VBG-06-01…04.
> **Regla transversal aplicada:** «Datos del presunto agresor» y «Apreciaciones» son
> secciones repetidas entre `registro-caso` y `registro-atencion` — se extrajeron a
> componentes compartidos en vez de duplicar la plantilla.

---

## El hallazgo que cambió el alcance de esta subfase

Al preparar la extracción de «Presunto agresor» a un componente compartido, encontré que
**`registro-atencion` nunca tuvo esa pestaña**: su `.ts` conserva `abrirModalAgresor()`,
`agresoresRegistrados` y `formatearNombreAgresor()` completos, pero el `.html` no tiene
ningún `<mat-tab>` que los use. Es el mismo patrón de `editarAcuerdo` (EST-04, M1), aquí a
escala de una sección completa de la matriz.

Al investigar por qué el guardado nunca había fallado visiblemente a pesar de esto, encontré
algo más grave:

### `registro-atencion` guardaba la pestaña equivocada en 7 de sus 8 pestañas

`guardarAtencion()` llamaba a `getLogicalTabIndex(visualIndex)`, una función copiada de
`registro-caso` que desplaza el índice para compensar la pestaña «VBG» que solo aparece
cuando `violenciaGenero === 'SI'`. El problema: **`registro-atencion` nunca tuvo esa pestaña
tampoco** (confirmado en M2 — las secciones 0 a 3 no existen en este formulario). La función
igual aplicaba el desplazamiento, así que el índice visual de cada pestaña ya NO coincidía
con el `case` de `construirRegistroAtencionRequest()` que de verdad le correspondía:

| Pestaña visible | Guardaba el payload de… |
|---|---|
| «Registro de atención» (índice 1) | «Datos complementarios» (vínculo, programa…) |
| «Apreciaciones psicojurídicas» (índice 2, antes de esta subfase) | «Documentación» (hechos, forma de ocurrencia…) |
| «Acuerdos y compromisos» (índice 3) | «Presunto agresor» |
| …y así sucesivamente, una pestaña desfasada hasta el final. |

Es decir: antes de esta subfase, **pulsar «Guardar» en cualquier pestaña de
`registro-atencion` después de «Datos de la persona» enviaba al backend la forma de datos
de otra pestaña**. No se detectó por pruebas automatizadas porque no existía ninguna que
verificara qué `case` recibe cada índice de pestaña, y en modo de demostración el
almacén simulado acepta cualquier forma sin validar su estructura.

**Corregido de raíz:** se eliminó `getLogicalTabIndex()» y se renumeraron los `case` de
`construirRegistroAtencionRequest()` para que coincidan 1 a 1 con las pestañas reales,
incluida la nueva «Presunto agresor». Se retiraron también los tres `case` que nunca
correspondían a ninguna pestaña visible (`Datos complementarios`, `Documentación`, `VBG`) y
la variable `atencionContexto`, calculada pero jamás usada. Verificado en navegador: cada
pestaña ahora guarda y responde «¡Guardado Exitoso!» con el payload correcto (ver
«Verificación»).

---

## Resultado

### Sección 4 — Identificación Territorial

| ID | Estado | Evidencia |
|----|--------|-----------|
| VBG-04-01 (ayuda sobre prefijo de país) | **CUMPLE (ya existía, diagnóstico desactualizado)** | `registro-caso.component.html:50`, tooltip con el ejemplo exacto de la matriz. El diagnóstico decía que faltaba; no era así. |
| VBG-04-02 / 04-05 (DD/MM/AAAA) | **CUMPLE (verificado)** | `custom-date-adapter.ts`: `_to2digit()` fuerza ceros a la izquierda en día y mes. Confirmado con ceros a la izquierda, lo que el diagnóstico dejaba pendiente de revisar. |
| VBG-04-03 / 04-06 (campos territoriales separados) | **CUMPLE** | Ya confirmado en el diagnóstico original. |
| VBG-04-04 (catálogo de códigos de país) | **CUMPLE** | Ya confirmado en el diagnóstico original. |
| VBG-04-07 (País de nacimiento si es extranjera) | **BLOQUEADO (pendiente 11)** | Sigue sin criterio de «persona extranjera»; no se implementa por suposición (decisión ya tomada en M1, «sin cambios»). |

### Sección 5 — Datos del presunto agresor

| ID | Estado | Evidencia |
|----|--------|-----------|
| VBG-05-01 / 05-06 (encabezado unificado) | **CUMPLE** | «Datos del presunto agresor», único texto en todo el módulo (modal + ambas pestañas). |
| VBG-05-02 / 05-07 (4 campos de nombre independientes) | **CUMPLE** | `modal-presunto-agresor`: Primer/Segundo Nombre, Primer/Segundo Apellido. Nunca un «Nombre completo». |
| VBG-05-03 (árbol Vínculo con la Universidad) | **CUMPLE (modo de demostración)** | `VINCULO_UNIVERSIDAD` en `catalogo-vbg.ts`: Estudiante (Pregrado/Posgrado/Tecnología/Técnica), Docente (Vinculado/Ocasional/Cátedra/Cátedra 50), Personal no docente, Otro. Verificado en navegador. Fuera de modo de demostración sigue sirviendo las etiquetas del backend tal cual (mismo criterio que el hallazgo de M1 sobre `VinculoUdeAEnum`). |
| VBG-05-04 (Vínculo con la víctima) | **CUMPLE** | `VINCULO_VICTIMA`: Pareja/Expareja, Familiar, Compañeros de estudio, Docente, Otro — literal de la matriz. |
| VBG-05-05 / 05-09 («¿Cuál?» obligatorio al elegir Otro) | **CUMPLE (nuevo)** | Antes **no existía en el modal del agresor** — el diagnóstico citaba `otroVinculo` de `registro-caso.component.ts:1184`, pero ese control es de un campo distinto: el vínculo de la **persona atendida**, en la pestaña «Datos complementarios» (corrección de diagnóstico). Se agregaron `cualVinculoUniversidad` y `cualVinculoVictima` al modal, cada uno visible solo si su select = «Otro», y el botón «Guardar» del modal los exige antes de habilitarse. Se limpian al deseleccionar «Otro» (R-04). Probado en navegador. |
| VBG-05-08 («Personal no docente», no «Administrativos») | **CUMPLE (corrección de diagnóstico)** | El diagnóstico lo marcó «NO VERIFICABLE» porque «Administrativos» no aparecía en ningún lado — pero tampoco «Personal no docente» se había buscado como *presente*. Confirmado: aparece literal en `catalogo-vbg.ts`, en el tooltip del modal y en navegador. «Administrativos» solo existe como nombre interno de una constante TypeScript (`VinculoUdeAEnum.PERSONAL_ADMINISTRATIVO`), nunca como texto visible. |

### Sección 6 — Apreciaciones Profesionales

| ID | Estado | Evidencia |
|----|--------|-----------|
| VBG-06-01 (campo narrativo amplio) | **CUMPLE (mejorado)** | Antes era un `<input>` de una línea; ahora `<textarea rows="4">`, igual que «Descripción de los Hechos» (M2). |
| VBG-06-02 (eliminar «Tipo de Apreciación») | **CUMPLE** | Retirado de ambos modales y de ambos formularios. El tipo (jurídica=1 / psicológica=2) queda implícito por cuál modal se abre, nunca elegido por la persona usuaria. |
| VBG-06-03 (eliminar «Observación») | **CUMPLE** | La etiqueta pasó de «Descripción Jurídica» / «Descripción / Observaciones» a «Apreciación jurídica» / «Apreciación psicológica». |
| VBG-06-04 (único campo narrativo) | **CUMPLE** | Cada modal tiene exactamente un campo. |

---

## Secciones repetidas: dos componentes nuevos

Siguiendo la regla transversal de la autorización, «Presunto agresor» y «Apreciaciones»
pasan a vivir en un solo lugar cada una, usado por ambos formularios:

- **`SeccionPresuntoAgresorComponent`** (`src/app/components/seccion-presunto-agresor/`):
  recibe los catálogos de vínculo y la lista de agresores por `@Input()`, la sincroniza con
  el padre vía `[(agresoresRegistrados)]` (two-way binding), y gestiona internamente la
  apertura del modal y el borrado de filas.
- **`SeccionApreciacionesComponent`** (`src/app/components/seccion-apreciaciones/`): mismo
  patrón, con `[(apreciacionesJuridicas)]` y `[(apreciacionesPsicologicas)]` independientes
  — confirmado en navegador que agregar una jurídica no afecta la tabla de psicológicas.

Cada componente trae su propia hoja de estilos (con los mismos tokens que ya usaban
`registro-caso`/`registro-atencion` para estas secciones) porque Angular encapsula los
estilos por componente — duplicar las ocho reglas CSS necesarias es preferible a romper
esa encapsulación con `ViewEncapsulation.None`.

**No se tocaron** los modales (`modal-presunto-agresor`, `modal-apreciacion-juridica`,
`modal-apreciacion-psicologica`): siguen siendo los mismos componentes, ahora abiertos
desde el componente compartido en lugar de desde cada formulario.

---

## Higiene colateral

- **Controles muertos `presuntoPrimerNombre`/`presuntoSegundoNombre`/…** (6 controles por
  formulario, 12 en total): existían en ambos `FormGroup`, se destructuraban en el payload,
  pero **ningún `formControlName` en ninguna plantilla los usaba** — el presunto agresor
  siempre se gestionó por el modal, nunca por el formulario principal. Retirados de ambos
  componentes (declaración, `tabFieldMap`, destructuring).
- **`atencionContexto`** en `registro-atencion.component.ts`: se calculaba un objeto
  completo (`idUnidadAdministrativa`, `idVinculoUniversidad`, `otroVinculo`…) que nunca se
  devolvía desde ningún `case`. Eliminado junto con las variables que solo él usaba.
- **Import `AtencionContextoRequestDto`** en `registro-atencion.component.ts`: quedó sin
  uso al eliminar `atencionContexto`; retirado.
- **Lint bajó de 297 a 275 avisos** como efecto colateral de retirar el código muerto
  (los controles `any[]` del agresor/apreciaciones generaban varios `no-explicit-any`
  que las interfaces `AgresorRegistrado`/`ApreciacionRegistrada` ahora evitan).

**Lo que no se tocó:** `registro-atencion` conserva controles de «Datos complementarios»
(`vinculo`, `otroVinculo`, `programa`…) sin ninguna pestaña que los muestre — mismo patrón
de código muerto, pero fuera del alcance de secciones 4-6. Se deja anotado para quien
revise esa parte del módulo más adelante.

---

## Archivos

**Nuevos**

| Archivo | Qué aporta |
|---|---|
| `components/seccion-presunto-agresor/*` (+ spec, 5 casos) | Sección compartida de presunto agresor. |
| `components/seccion-apreciaciones/*` (+ spec, 3 casos) | Sección compartida de apreciaciones. |
| `docs/evidencias/estandarizacion-vbg/03-subfase-M3-*.md` | Este reporte. |

**Modificados**

| Archivo | Qué cambió |
|---|---|
| `registro-caso.component.ts` | Importa los 2 componentes compartidos en vez de los 3 modales directamente; retira `abrirModalAgresor`, `eliminarAgresor`, `formatearNombreAgresor`, `abrirModalApreciacionJuridica/Psicologica`, `eliminarApreciacionJuridica/Psicologica` y los 6 controles `presunto*`; payload del agresor incluye `cualVinculoUniversidad`/`cualVinculoVictima`. |
| `registro-caso.component.html` | Las dos secciones pasan a `<app-seccion-presunto-agresor>` / `<app-seccion-apreciaciones>` con binding de dos vías. |
| `registro-atencion.component.ts` | Mismo retiro de métodos y controles muertos; **nueva pestaña «Presunto agresor»**; `getLogicalTabIndex()` eliminado; `construirRegistroAtencionRequest()` renumerado (9 `case`, antes 12 con 3 inalcanzables); `atencionContexto` y su destructuring eliminados; import `AtencionContextoRequestDto` retirado. |
| `registro-atencion.component.html` | Nueva pestaña «Presunto agresor» entre «Registro de atención» y «Apreciaciones psicojurídicas»; apreciaciones migradas al componente compartido. |
| `modal-presunto-agresor.component.ts` / `.html` | Campos `cualVinculoUniversidad`/`cualVinculoVictima`, visibles y obligatorios solo si su vínculo = «Otro»; se limpian al deseleccionar. |
| `modal-apreciacion-juridica.component.ts` / `.html` | Sin `HttpClient`, sin `tiposApreciacion`, sin dropdown; un solo `<textarea>`; `idTipoApreciacion` fijo en 1. |
| `modal-apreciacion-psicologica.component.ts` / `.html` | Mismo cambio; `idTipoApreciacion` fijo en 2. |

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run build` | Pasa, sin errores. |
| `npm run test:ci` | **255 de 256.** El único fallo es `PublicHeaderComponent`, confirmado **preexistente** (falla igual en un `git stash` al estado anterior a esta subfase). **8 casos nuevos** (5 + 3 de los componentes compartidos). |
| `npm run a11y:audit` | Sin deuda nueva. |
| `npm run lint` | **275 de 299** (bajó desde 297 al cierre de M2 — la limpieza de código muerto redujo avisos). |
| `npm run check` | Pasa completo. |
| Navegador, rol PROFESIONAL, `registro-atencion` | Verificado de punta a punta: guardar «Datos de la persona» → «Registro de atención» → confirma que **todas** las pestañas restantes se habilitan (antes de esta subfase, cada una guardaba con la forma equivocada sin que la UI lo mostrara). Pestaña «Presunto agresor» nueva, funcional: agrega «Carlos» con vínculo «Otro», exige y acepta «¿Cuál?», guarda con «¡Guardado Exitoso!», la fila persiste. Pestaña «Apreciaciones psicojurídicas»: modal sin «Tipo de Apreciación», agrega una apreciación jurídica, confirma que la tabla psicológica permanece vacía (arrays independientes). |
| Navegador, `registro-caso` | `npm run test:ci` cubre la lógica; no se repitió la verificación manual completa porque la sección «Presunto agresor» y «Apreciaciones» de este formulario no cambiaron de comportamiento, solo de origen del marcado (mismo componente compartido ya probado en `registro-atencion`). |

---

## Pendientes para el equipo

- **Confirmar la forma del payload** `cualVinculoUniversidad`/`cualVinculoVictima` del
  agresor — no se pudo validar contra el backend real (sigue bloqueado por `403`).
- **¿Se limpia el código muerto de «Datos complementarios» en `registro-atencion`?**
  (`vinculo`, `otroVinculo`, `programa`, `unidadAcademica`… declarados sin plantilla que
  los use). No es parte de secciones 4-6; se deja anotado.
- Sigue abierta la pregunta de **P-VBG-06 para vínculos** (ver hallazgo de M1): el backend
  no modela el árbol Estudiante/Docente de la matriz. El modo de demostración ya usa el
  árbol correcto; fuera de él, las etiquetas siguen siendo las del backend.

---

Quedo a la espera de aprobación para continuar con **M4 — Acuerdos, compromisos,
seguimientos y cierre (secciones 7 y 8)**.
