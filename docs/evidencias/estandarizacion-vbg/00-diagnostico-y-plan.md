# Estandarización del módulo Equipo de Atención — Diagnóstico y plan

> **Fase:** alineación del módulo Equipo de Atención con la Matriz Técnica VBG, y
> alineación terminológica en todo el aplicativo.
> **Fecha del diagnóstico:** 5 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards` (sobre `93a7b6b`).
> **Contrato principal:** `docs/contratos/MATRIZ_MODULO_ATENCION_VBG.md`.
> **Estado:** diagnóstico. **No se modificó ningún archivo de `src/`.**

---

## 0. Resumen ejecutivo

Tres hallazgos cambian el orden del plan respecto de la secuencia propuesta:

**1. El módulo no se puede ejercitar hoy.** `/registro-caso` y `/registro-atencion` cargan
**31 catálogos y la lista de citas desde el backend real**, que responde **403** a la sesión
de desarrollo. Resultado verificado en navegador: la pantalla se queda en «Consulta de
citas» con un aviso de error, **el formulario nunca se abre** y todos los desplegables
quedarían vacíos. No es un problema de red: el backend responde, pero rechaza el token
simulado (pendiente 6 de `CLAUDE.md`). Esto **bloquea la verificación de M2 a M5** y es
también la razón por la que no hay capturas de línea base (§7).

**2. Los catálogos de la matriz los posee el backend, no el frontend.** Las modalidades de
violencia, vínculos, formas y lugares de ocurrencia llegan de
`/maestros/...`. La matriz ordena que las etiquetas se tomen de ella «y **no** del
diccionario de datos desactualizado» (VBG-03-04), pero hoy el frontend no puede
garantizarlo: muestra lo que el backend le dé. El catálogo central con **código estable +
etiqueta visible** que pide el encargo es exactamente la pieza que resuelve esto, y pasa de
ser una mejora a ser un **requisito previo**.

**3. Las etiquetas correctas ya existen en el repositorio, en el lugar equivocado.**
`formulario-anonimo.component.ts` tiene `listaSexual`, `listaInformatica`,
`listaAmbitosOcurrencia` y `listaFormasOcurrencia` **ya alineadas con la matriz**
(«Explotación sexual» anidada, «Sexting sin consentimiento», los nueve ámbitos), quemadas
en el componente. El canal público cumple la matriz; el módulo del Equipo de Atención, no.
El catálogo central debe nacer de ahí.

**Estado general por sección:** de los 48 requisitos `VBG-XX-NN`, **9 CUMPLEN**,
**11 son PARCIAL**, **12 NO CUMPLEN** y **16 NO EXISTEN** en el módulo.

---

## 1. Inventario

### 1.1 Formularios del módulo

| Archivo | Líneas | Rol en la matriz |
|---|---|---|
| `components/registro-caso/registro-caso.component.ts` | 1669 | Contiene **13 secciones**. Es el formulario principal. |
| `components/registro-caso/registro-caso.component.html` | 1259 | — |
| `components/registro-atencion/registro-atencion.component.ts` | 1691 | Repite 7 de las 13 secciones de `registro-caso`. |
| `components/registro-atencion/registro-atencion.component.html` | 658 | — |
| `components/cita/cita.component.*` | 353 | Agendamiento (sección 0). |

### 1.2 Modales (un campo o bloque de la matriz cada uno)

| Modal | Sección de la matriz |
|---|---|
| `modal-hechos` | 1 — Documentación del hecho |
| `modal-presunto-agresor` | 5 — Presunto agresor |
| `modal-apreciacion-juridica` · `modal-apreciacion-psicologica` | 6 — Apreciaciones |
| `modal-activar-ruta` · `modal-remision` | 7 — Rutas internas / externas |
| `modal-compromisos-persona` · `modal-compromisos-profesionales` | 7 — Compromisos |
| `modal-seguimiento` | 8 — Seguimientos |
| `modal-medidas-proteccion` | **7 — a eliminar de la UI (VBG-07-12)** |

### 1.3 Secciones realmente presentes en `registro-caso` (verificado en plantilla)

| Línea | Encabezado actual | Sección de la matriz |
|---|---|---|
| 187 | Discapacidades | — (fuera de matriz) |
| 291 | Correos Electrónicos | — |
| 341 | Telefonos | — *(sin tilde)* |
| 454 | Agregar Hecho | **1** |
| 668 | Datos del presunto agresor | **5** ✅ |
| 791 | Apreciaciones jurídicas | **6** |
| 834 | Apreciaciones Psicológicas | **6** |
| 891 | Activación de ruta | **7** (rutas internas) |
| 934 | Remisiones | **7** (rutas externas) |
| 996 | **Medidas de protección** | **7 — eliminar (VBG-07-12)** |
| 1057 | Compromisos de la persona atendida | **7** ✅ |
| 1100 | Compromisos del profesional o dupla | **7** ✅ |
| 1156 | Seguimientos del Caso | **8** |

`registro-atencion` repite: Apreciaciones (×2), Activación de ruta, Remisiones, Medidas de
protección, Compromisos (×2) y Seguimientos. **Toda corrección de esas secciones debe
aplicarse en los dos formularios.**

### 1.4 Catálogos: de dónde vienen hoy

| Origen | Qué sirve | Respaldo sin backend |
|---|---|---|
| `registro-caso.component.ts:425-456` (`obtenerMaestro`) | **31 catálogos**, incluidos los de la matriz: `tipos-violencia`, `modalidades-violencia/tipo/1..7`, `vinculos-udea`, `vinculos-agresor-victima`, `formas-ocurrencia`, `lugares-ocurrencia`, `actividades-misionales`, `grupos-atencion` | ❌ **`of([])`** — el desplegable queda vacío (`:649-656`) |
| `services/listas.service.ts` | 8 catálogos de otro ámbito (campus, tipos de documento…) | ✅ `DEFAULT_MAESTROS` (`:32`) |
| `formulario-anonimo.component.ts:150-200` | Modalidades y ámbitos **ya alineados con la matriz** | — (quemados en el componente) |
| `constants/codigos-pais.constant.ts` | Códigos de país (VBG-04-04) | ✅ |

> Dos mecanismos distintos para lo mismo, con criterios de respaldo opuestos. El módulo
> usa el que **no** tiene respaldo.

### 1.5 Pruebas existentes

20 specs en el módulo. `registro-caso.component.spec.ts` ya ejercita el documento extranjero
(`VNZ1234567890`, `:45`), y `formulario-anonimo.component.spec.ts` ya fija
«Sexting sin consentimiento» (`:261`) y los ámbitos (`:266`).

---

## 2. Estado por requisito

Leyenda: **CUMPLE** · **PARCIAL** · **NO CUMPLE** (existe y contradice la matriz) ·
**NO EXISTE** (la matriz lo pide y no está).

### Sección 0 — Citas y consentimiento

| ID | Estado | Evidencia / causa |
|---|---|---|
| VBG-00-01 | **NO EXISTE** | No hay carga de PDF de consentimiento en `cita.component.*` ni en los formularios. |
| VBG-00-02 | **NO EXISTE** | Sin flujo de envío por correo ni de carga al iniciar la atención. |
| VBG-00-03 | **NO EXISTE** | Sin validación de formato. |

### Sección 1 — Clasificación VBG y documentación del hecho

| ID | Estado | Evidencia / causa |
|---|---|---|
| VBG-01-01 | **NO EXISTE** | No hay radio «Violencia Basada en Género» Sí/No en el módulo (grep sin resultados fuera de `formulario-anonimo`). |
| VBG-01-02 | **NO EXISTE** | Sin el campo, no hay filtro inicial. |
| VBG-01-03 / 01-04 | **NO EXISTE** | Sin lógica condicional asociada. Depende además del pendiente 2 (temporalidad) y 3. |
| VBG-01-05 | **PARCIAL** | Existe descripción del hecho en `modal-hechos`, sin la indicación «Describa los hechos en circunstancias de tiempo, modo y lugar». |
| VBG-01-06 | **NO EXISTE** | «Ámbito de Ocurrencia» solo existe en `formulario-anonimo.component.html:319`, no en el módulo. |
| VBG-01-07 | **PARCIAL** | `modal-hechos` usa «¿En qué forma ocurrió el hecho?» (`registro-caso.component.html:416`) con catálogo `formas-ocurrencia` del backend; etiqueta y opciones sin verificar contra la matriz. |
| VBG-01-08 | **PARCIAL** | «Lugar de Ocurrencia» existe (`modal-hechos.component.html:23`) con catálogo del backend; faltan las opciones `Dentro`/`Fuera`/`Mixto` verificadas. |
| VBG-01-09 | **PARCIAL** | Campo presente; falta confirmar que sea `textarea` amplio. |
| VBG-01-10 | **NO CUMPLE** | Sin texto de ayuda que aclare que se refiere a predios universitarios. |

### Sección 2 — Relación misional

| ID | Estado | Evidencia / causa |
|---|---|---|
| VBG-02-01 | **PARCIAL** | Existe «Actividad Misional» (`registro-caso.component.html:521`), catálogo `actividades-misionales` del backend. |
| VBG-02-02 | **NO EXISTE** | Sin despliegue condicional Docencia/Investigación/Extensión. Bloqueado por pendiente 7. |
| VBG-02-03 | **NO CUMPLE** | La etiqueta dice «Actividad Misional», no incorpora «Institucionales». |
| VBG-02-04 | **PARCIAL** | Por verificar si es selección múltiple. |

### Sección 3 — Modalidades de violencia

| ID | Estado | Evidencia / causa |
|---|---|---|
| VBG-03-01 | **NO CUMPLE** | El backend expone **7 tipos** (`modalidades-violencia/tipo/1..7`); la matriz define **6**. El tipo 6 (Informática) es de primer nivel en el backend y la matriz lo anida bajo Sexual. |
| VBG-03-02 | **PARCIAL** | Existe `sexualSel` con subcategorías del backend; sin verificar contra el árbol de la matriz. |
| VBG-03-03 | **NO CUMPLE** | `informaticaSel` es una modalidad **hermana** de Sexual, no anidada (`registro-caso.component.ts:219-225`). |
| VBG-03-04 | **NO CUMPLE** | Las etiquetas vienen del backend, no de la matriz. **El frontend no puede garantizarlo hoy.** |
| VBG-03-05 | **NO VERIFICABLE** | «Explotación sexual» no aparece en el módulo (sí en `formulario-anonimo.component.ts:154`, correctamente anidada). Depende del backend. |
| VBG-03-06 | **NO CUMPLE** | Ver VBG-03-03. |
| VBG-03-07 | **NO VERIFICABLE** en el módulo / **CUMPLE** en el canal público (`formulario-anonimo.component.ts:176`). |
| VBG-03-08 | **PARCIAL** | Hay selección por modalidad, sin el anidamiento de la matriz. |

### Sección 4 — Identificación territorial

| ID | Estado | Evidencia / causa |
|---|---|---|
| VBG-04-01 | **PARCIAL** | El spec ya usa `VNZ1234567890` (`registro-caso.component.spec.ts:45`); falta la etiqueta de ayuda en la UI. |
| VBG-04-02 / 04-05 | **PARCIAL** | Existe `custom-date-adapter.ts`; falta verificar DD/MM/AAAA **con ceros a la izquierda** (R-05). |
| VBG-04-03 / 04-06 | **CUMPLE** | Departamento y municipio son campos separados con catálogo propio. |
| VBG-04-04 | **CUMPLE** | `constants/codigos-pais.constant.ts` + `modal-codigos-pais`. |
| VBG-04-07 | **PARCIAL** | Por verificar la condición de «persona extranjera» (pendiente 11). |

### Sección 5 — Presunto agresor

| ID | Estado | Evidencia / causa |
|---|---|---|
| VBG-05-01 / 05-06 | **CUMPLE** | «Datos del presunto agresor» (`registro-caso.component.html:668`). Sin variantes en el código. |
| VBG-05-02 / 05-07 | **PARCIAL** | Por verificar los cuatro campos independientes en `modal-presunto-agresor`. |
| VBG-05-03 | **PARCIAL** | Catálogo `vinculos-udea` del backend; sin el árbol Estudiante/Docente de la matriz. |
| VBG-05-04 | **PARCIAL** | Catálogo `vinculos-agresor-victima` del backend. |
| VBG-05-05 / 05-09 | **PARCIAL** | Existe `otroVinculo` (`registro-caso.component.ts:1184`); falta verificar la obligatoriedad condicional y la limpieza al deseleccionar. |
| VBG-05-08 | **NO VERIFICABLE** | «Administrativos» no aparece en el frontend (0 coincidencias): la denominación la define el backend. |

### Sección 6 — Apreciaciones

| ID | Estado | Evidencia / causa |
|---|---|---|
| VBG-06-01 | **CUMPLE** | Campo narrativo presente en ambos modales. |
| VBG-06-02 | **NO CUMPLE** | «Tipo de Apreciación» sigue en `modal-apreciacion-juridica.component.html:9` y `modal-apreciacion-psicologica.component.html:9`. |
| VBG-06-03 | **CUMPLE** | «Observación» solo aparece en `modal-gestion-contacto` (otro contexto, fuera de apreciaciones). |
| VBG-06-04 | **NO CUMPLE** | Hay más de un campo mientras exista «Tipo de Apreciación». |

### Sección 7 — Acuerdos y compromisos

| ID | Estado | Evidencia / causa |
|---|---|---|
| VBG-07-01 | **PARCIAL** | Existe `logroAcuerdo` (`registro-caso.component.ts:1186`), por defecto `'NO'`. Falta la pregunta literal «¿Logró llegar a un acuerdo con la persona?». |
| VBG-07-02 | **PARCIAL** | «Activación de ruta» existe; opciones sin verificar contra las siete de la matriz. |
| VBG-07-03 | **PARCIAL** | «Remisiones» existe; opciones sin verificar contra las seis de la matriz. |
| VBG-07-04 | **NO CUMPLE** | El compromiso es un **desplegable** («Seleccione el Compromiso», `modal-compromisos-persona.component.html:18`); la matriz pide **descripción narrativa**. |
| VBG-07-05 | **NO CUMPLE** | Ídem en `modal-compromisos-profesionales.component.html:30`. |
| VBG-07-06 | **NO CUMPLE (y con pérdida de datos)** | Con `logroAcuerdo === 'NO'` se **vacían** `remisionesRegistrados` y `activarRutasRegistrados` sin confirmación (`registro-caso.component.ts:319-324`). Contradice R-04 y choca con el pendiente 13. |
| VBG-07-07 | **NO VERIFICABLE** | «Protocolo de amenazas» aparece en 1 archivo; «Ruta de amenazas» en 0. La lista la define el backend. |
| VBG-07-08 | **CUMPLE** | Rutas internas y externas en secciones separadas. |
| VBG-07-09 | **CUMPLE** | «Fecha de Cumplimiento» en ambos modales. *(Capitalización: la matriz escribe «Fecha de cumplimiento».)* |
| VBG-07-10 | **PARCIAL** | Hay tabla de compromisos; falta verificar que `FormArray` permita múltiples. |
| VBG-07-11 | **CUMPLE** | Bloques separados (`:1057` y `:1100`). |
| VBG-07-12 | **NO CUMPLE** | «Medidas de protección» sigue presente en **ambos** formularios (`registro-caso.component.html:996`) con su modal. |

### Sección 8 — Seguimientos

| ID | Estado | Evidencia / causa |
|---|---|---|
| VBG-08-01…04 | **NO EXISTE** | No hay subsecciones 7.1–7.4 por rol. Hay un único bloque «Seguimientos del Caso» (`:1156`) con un desplegable «Tipo de Seguimiento» cuyo catálogo es `['Presencial','Telefónico','Virtual','Visita Domiciliaria']` (`registro-caso.component.ts:104`) — **modalidad de contacto, no especialidad profesional**. |
| VBG-08-05 | **CUMPLE** | `modal-seguimiento.component.html:21`. |
| VBG-08-06 / 08-07 | **PARCIAL** | «Acción» y «Actividad» existen (`:30`, `:39`); el mapeo depende del pendiente 15. |
| VBG-08-08 | **CUMPLE** | `:50`. |
| VBG-08-09 | **CUMPLE** | «Trabajo Social» no aparece (0 coincidencias). |
| VBG-08-10 | **NO EXISTE** | Sin estructura por especialidad, no hay aislamiento. Bloqueado por **P-12**. |
| VBG-08-11 | **PARCIAL** | Por verificar el filtrado y la limpieza de Actividad al cambiar Acción. |
| VBG-08-12 | **PARCIAL** | Existen «Estado de seguimiento» y «Motivo del estado» (`:56`, `:65`); falta el cierre autónomo por profesional. |
| VBG-08-13 | **NO EXISTE** | Sin ventana emergente de última profesional activa. **El panel de inicio ya muestra ese aviso** (ver §5). |

### Sección 9 — Grupo de atención

| ID | Estado | Evidencia / causa |
|---|---|---|
| VBG-09-01 | **PARCIAL** | Existe `grupoAtencion` con catálogo `grupos-atencion`. |
| VBG-09-02 | **NO CUMPLE** | Es un **control editable** del formulario (`registro-caso.component.ts:1219`, `registro-atencion.component.ts:246`), no de solo lectura. |
| VBG-09-03 | **NO EXISTE** | Sin recálculo al guardar. Bloqueado por el **pendiente 17**. |

### Hallazgos adicionales

| ID | Severidad | Evidencia |
|---|---|---|
| **EST-01** | **Alta** | 31 catálogos y la lista de citas responden **403**; el formulario no se abre. Verificado en navegador el 2026-10-05. |
| **EST-02** | **Alta** | `obtenerMaestro` cae a `of([])` sin respaldo (`registro-caso.component.ts:649-656`), frente al `DEFAULT_MAESTROS` de `listas.service.ts`. Dos criterios opuestos para lo mismo. |
| **EST-03** | Media | Pérdida silenciosa de datos al poner Acuerdos = `NO` (ver VBG-07-06). |
| **EST-04** | Baja | 2 `console.log` en el módulo, incluido un manejador vacío (`registro-caso.component.ts:1151`: `editarAcuerdo` solo registra en consola). Contradice la regla 8 de `CLAUDE.md`. |
| **EST-05** | Baja | «Telefonos» sin tilde (`registro-caso.component.html:341`); capitalización inconsistente entre «Apreciaciones jurídicas» y «Apreciaciones Psicológicas». |

---

## 3. Glosario cruzado

| Término de la matriz | Hoy en el módulo | En paneles del personal | En vista del rol Usuario | En mocks y DTO | Acción propuesta |
|---|---|---|---|---|---|
| **Acuerdos Alcanzados** (Sí/No, VBG-07-01) | `logroAcuerdo`, sin la pregunta literal | — | **«Lo que acordamos»** (`panel-usuario.component.html:67`) | — | ⚠️ **Conflicto real**: ver nota abajo. |
| **Compromisos Atendida** (VBG-07-04) | Desplegable, no narrativo | KPI «Compromisos a 7 días» | Lista bajo «Lo que acordamos», clase CSS `.acuerdos` | `CompromisoDto` (`mi-proceso.service.ts:48`) | Renombrar el encabezado del rol Usuario; el DTO ya se llama bien. |
| **Compromisos Dupla / Profesional** (VBG-07-11) | Bloque separado ✅ | No distingue | **No distingue** | `MiProcesoDto.compromisos` sin distinción | Añadir el origen al DTO; la vista del Usuario debe mostrar solo los suyos. |
| **Fecha de cumplimiento** (VBG-07-09) | «Fecha de Cumplimiento» ✅ | — | «Lo pensamos para el…» | **`fechaAcordada`** | Renombrar el campo del DTO a `fechaCumplimiento`. |
| **Seguimiento** (sección 8) | «Tipo de Seguimiento» = modalidad de contacto | «Seguimiento sin registro en los últimos 15 días» | — | `PendienteDto` | Desambiguar: *modalidad* ≠ *registro de seguimiento por especialidad*. |
| **7.1–7.4 por especialidad** | **No existe** | — | — | — | Bloqueado por **P-12**. |
| **Cierre (general / de seguimiento)** | «Estado de seguimiento» | «Intervención y cierre» (`ayuda-protocolos.widget.ts:105`) | — | — | Distinguir cierre **de seguimiento** (VBG-08-12) de cierre **general del caso** (VBG-08-13). |
| **Última profesional activa** (VBG-08-13) | **No existe en el módulo** | «Eres la última profesional activa en este caso» (`pendientes.widget.ts:44`) | — | `PendienteDto.ultimaProfesionalActiva` | ⚠️ El panel ya lo anuncia y el cierre no lo implementa: **una regla, dos lugares**. |
| **VBG Sí/No** (VBG-01-01) | **No existe** | Indicadores no declaran si cuentan VBG=No | — | — | Declararlo en la definición de cada indicador. → P-VBG-03. |
| **Modalidades de violencia** | 7 tipos del backend | «Distribución por identidad de género» (no usa modalidades) | — | — | Catálogo central con el árbol de la matriz. |
| **Explotación sexual** | Del backend | — | — | Correcta en `formulario-anonimo.component.ts:154` | Anidar bajo Sexual (VBG-03-05). |
| **Sexting sin consentimiento** | Del backend | — | — | Correcta en `formulario-anonimo.component.ts:176` | Llevar al catálogo central. |
| **Vínculo con la Universidad** | `vinculos-udea` plano | — | — | — | Árbol Estudiante/Docente + **«Personal no docente»** (VBG-05-08). |
| **Personal no docente** | Lo define el backend | — | — | — | Mapear código → etiqueta de la matriz. |
| **Protocolo de amenazas** | Del backend | — | — | — | Ídem (VBG-07-07). |
| **Rutas internas / externas** | «Activación de ruta» / «Remisiones» | — | **Ausente** ✅ (DSH-10-10) | — | Unificar nombres con la matriz **solo en el módulo**. |
| **Grupo de atención** | Editable ❌ | — | **Ausente** ✅ | — | Solo lectura (VBG-09-02). |
| **Presunto agresor** | «Datos del presunto agresor» ✅ | — | **Ausente** ✅ | — | Sin cambios. |
| **Apreciaciones** | Con «Tipo de Apreciación» ❌ | — | **Ausente** ✅ | — | Eliminar el desplegable. |

### ⚠️ El conflicto que pediste verificar: acuerdos vs. compromisos

**Confirmado: la vista del rol Usuario los confunde.**

`panel-usuario.component.html:67` titula **«Lo que acordamos»** una lista de
`CompromisoDto`, y la clase CSS es `.acuerdos` (`panel-usuario.component.scss:158`). En la
matriz son cosas distintas:

- **«Acuerdos Alcanzados»** (VBG-07-01) es una **pregunta Sí/No** al profesional sobre si
  se llegó a un acuerdo con la persona. Habilita rutas y compromisos.
- **«Compromisos»** (VBG-07-04) son **acciones concretas con fecha de cumplimiento**.

La vista del rol Usuario **no debe adoptar el término técnico** «Compromisos Atendida»
—conserva su lenguaje de §5.3—, pero sí debe dejar de llamar «acuerdo» a un compromiso.
Propuesta: **«Lo que vas a hacer»** o **«Lo que decidiste hacer»**, que ya es el lenguaje
del cuerpo de la tarjeta («Esto es lo que decidiste hacer»).

Dos problemas asociados:

1. `CompromisoDto.fechaAcordada` contradice VBG-07-09, que exige explícitamente que la
   fecha sea la **de cumplimiento** y no la de registro o acuerdo. Renombrar a
   `fechaCumplimiento`.
2. El DTO **no distingue** compromisos de la persona de los de la dupla (VBG-07-11). Hoy la
   persona vería ambos mezclados. → **P-VBG-02**.

### Lo reservado al personal no se filtra ✅

Verificado por grep y por las pruebas de la Subfase 4: la vista del rol Usuario **no**
menciona presunto agresor, apreciaciones, grupo de atención ni rutas internas
(`mi-proceso.service.ts:10-11` lo documenta y
`panel-usuario.component.spec.ts` lo fija). **DSH-10-10 se cumple.**

---

## 4. Catálogo central

### El problema

Tres mecanismos conviven hoy: catálogos del backend sin respaldo (módulo), catálogos del
backend con respaldo (`listas.service.ts`) y listas quemadas en componentes
(`formulario-anonimo`). La matriz exige etiquetas literales suyas (VBG-03-04), pero el
módulo muestra las del backend. **Renombrar en el backend cambiaría los valores guardados**,
que es justo lo que el encargo pide evitar.

### El diseño

Un `CatalogoVbgService` con el patrón de `ContenidoHomeService`: mock tipado + endpoint
previsto. Cada opción separa **lo que se guarda** de **lo que se lee**:

```ts
export interface OpcionCatalogo {
  /** Código estable. Es lo que viaja al backend. NUNCA cambia con un renombre. */
  readonly codigo: string;
  /** Etiqueta visible, literal de la matriz. Cambiarla no afecta lo guardado. */
  readonly etiqueta: string;
  /** Código del padre, para los árboles (modalidades, vínculos). */
  readonly padre?: string;
  /** Texto de ayuda de la matriz, si lo tiene (va en <mat-hint>, R-06). */
  readonly ayuda?: string;
  readonly activo: boolean;
}
```

**Regla de convivencia con el backend:** el servicio toma la respuesta de `/maestros/...`
como **fuente de identidad** (los códigos) y el catálogo local como **fuente de
presentación** (las etiquetas de la matriz). Si llega un código sin traducción, se muestra
la etiqueta del backend y **se registra la discrepancia**, que es lo que la matriz pide
reportar (punto 3 de su §0). Si el backend no responde, el catálogo local actúa de
**respaldo** y el módulo sigue siendo usable — resolviendo EST-01 y EST-02.

### Qué cambiaría y qué no

| Elemento | ¿Cambia? |
|---|---|
| Valores ya guardados en base de datos | **No.** El código es la clave. |
| Payload enviado al backend | **No**, salvo que el equipo decida migrar códigos. |
| Etiquetas visibles | **Sí**, a las literales de la matriz. |
| `CompromisoDto.fechaAcordada` | **Sí** → `fechaCumplimiento` (DTO del panel, no persistido). |
| `catalogoSeguimiento` (`registro-caso.component.ts:104`) | **Sí**, sale del componente al catálogo. |
| `listaSexual` / `listaInformatica` / `listaAmbitosOcurrencia` / `listaFormasOcurrencia` | **Sí**, salen de `formulario-anonimo` al catálogo (son la semilla correcta). |

**Catálogos a cubrir:** ámbito, forma y lugar de ocurrencia · relación misional ·
modalidades y subcategorías (árbol) · vínculo con la Universidad (árbol) · vínculo con la
víctima · rutas internas · rutas externas · acciones y actividades de seguimiento
(pendiente 15) · grupos de atención.

---

## 5. Impacto en los paneles de inicio

| Elemento del panel | Depende de | Cambio propuesto |
|---|---|---|
| KPI «Compromisos a 7 días» (`dashboard-metricas.service.ts`) | VBG-07-09 | Su definición debe decir que cuenta por **fecha de cumplimiento**, no de registro. |
| KPI «Compromisos a 7 días» | VBG-07-11 | Declarar si cuenta solo los de la dupla/profesional o también los de la persona atendida. → **P-VBG-01**. |
| Aviso «última profesional activa» (`pendientes.widget.ts:44`) | VBG-08-12, VBG-08-13 | **Una sola regla en un solo lugar.** Hoy el panel lo anuncia y el cierre no lo implementa; al implementar VBG-08-13 ambos deben consultar el mismo predicado. |
| Pendiente «Seguimiento sin registro en los últimos 15 días» | Sección 8 | El umbral de 15 días no sale de la matriz: documentarlo o preguntarlo. |
| Indicadores «Casos activos», «En recepción», «Casos del equipo» | VBG-01-04 | **Su definición no dice si incluye eventos con VBG = `No`**, que la matriz permite guardar. → **P-VBG-03**. |
| «Distribución por identidad de género» y «Vigilancia» | Sección 3 | Hoy **no** desagregan por modalidad. Si se añade, debe respetar el árbol (Explotación sexual y Sexting anidados bajo Sexual). |
| Filtros de `VigilanciaService` (sede, dependencia) | Secciones 2 y 4 | Deben consumir el catálogo central, no sus listas propias. |
| `CATALOGO_MODULOS` | — | «Registro de caso», «Registro de atención», «Citas y agendamiento» ya coinciden con los títulos de ruta ✅. Sin cambios salvo P-07. |
| Vista del rol Usuario | VBG-07-01 vs. 07-04 | Renombrar «Lo que acordamos» (ver §3). |

---

## 6. Bloqueos

| Pendiente de la matriz | Bloquea | Gravedad |
|---|---|---|
| **17** Tabla de decisión del Grupo de Atención | VBG-09-03 completo. **M5 entrega solo lectura, sin cálculo.** | Bloqueante |
| **15** Catálogo Acción → Actividad | VBG-08-06, 08-07, 08-11 y su catálogo. | Bloqueante de M4 |
| **8** Subcategorías de las demás modalidades | El árbol completo de la sección 3. M2 entrega solo la rama Sexual. | Parcial M2 |
| **7** Estructura de la relación misional | VBG-02-02 y los valores persistidos. | Bloqueante de M2 |
| **2** Campos de temporalidad | VBG-01-03. **No crear campos por suposición.** | Parcial M2 |
| **3** Visibilidad de la descripción con VBG = `No` | Lógica condicional de M2. | Parcial M2 |
| **P-12** Modelo de especialidades | VBG-08-01…04, VBG-08-10 **y DSH-08-01**. Sin él, los seguimientos por rol **no son implementables**. | Bloqueante de M4 |
| **1** Numeración visible de secciones | Encabezados de M2 y M4. | Cosmético |
| **13** Rutas con Acuerdos = `No` | VBG-07-06 y la corrección de EST-03. | Bloqueante de M4 |
| **16** Motivo de cierre y alcance de la ventana emergente | VBG-08-12, 08-13. | Bloqueante de M4 |
| **18** Tamaño y obligatoriedad del consentimiento | VBG-00-01. | Bloqueante de M2 |
| 4, 5, 9, 10, 11, 12, 14 | Detalles de validación y obligatoriedad. | Parcial |

---

## 7. Línea base

**No hay capturas, y la razón es un hallazgo en sí misma.**

Verificado el 2026-10-05 con el rol PROFESIONAL en `http://127.0.0.1:4340`: al entrar a
`/registro-caso` la aplicación muestra la pantalla «Consulta de citas» con el aviso *«No fue
posible cargar las citas»*, **34 errores en consola** y **31 peticiones `403`** a
`/maestros/...` y a `/citas/paginado`. El formulario con las 13 secciones **no llega a
abrirse**, porque antes hay que seleccionar un caso de una lista que no carga.

Dos consecuencias:

1. **Sin backend accesible no hay línea base visual posible**, ni manual ni con Playwright.
2. **M2 a M5 serían inverificables** en esas condiciones. Por eso M1 incorpora un modo de
   datos de respaldo (§8).

> **Nota sobre dónde guardarlas.** El encargo pide
> `docs/evidencias/estandarizacion-vbg/capturas/linea-base/`, pero el `.gitignore` acordado
> en la fase anterior incluye `docs/evidencias/**/capturas/` (línea 39). Guardar ahí crearía
> archivos que Git ignora en silencio. Cuando el módulo sea ejecutable, propongo mantener el
> criterio vigente —describir lo observado en el reporte— salvo que prefieras una excepción
> para esta fase. → **P-VBG-05**.

---

## 8. Higiene previa: dejar `npm run check` en verde

| Problema | Causa | Propuesta |
|---|---|---|
| **302 warnings** frente a un tope de 299 (pendiente 8) | El salto ocurrió en `d3066e0` (PR #13), antes de estas fases. | **Corregir los tres avisos**, no subir el tope: bajar el techo es perder la red. Si el equipo prefiere lo contrario, ajustar `package.json` con un comentario que diga por qué. |
| Spec de `RegisterComponent` (pendiente 9) | Falta `provideRouter`/`ActivatedRoute` en el `TestBed`. | Añadir el proveedor. Es una línea. |
| `console.log` en el módulo (EST-04) | `editarAcuerdo` sin implementar. | Resolver o retirar el manejador muerto. |

Hecho esto, **`npm run check` en verde pasa a ser el criterio de cierre de cada subfase**.

---

## 9. Plan por subfases

> **Criterio común:** `npm run check` en verde · ningún literal visual · ningún `[PENDIENTE]`
> resuelto por suposición · reporte en `docs/evidencias/estandarizacion-vbg/NN-*.md` ·
> **toda corrección se aplica en `registro-caso` y en `registro-atencion`**.

### M1 — Higiene y cimientos ✅ **EJECUTADA (2026-10-05)**

> Resultado en `docs/evidencias/estandarizacion-vbg/01-subfase-M1-higiene-y-cimientos.md`.
> Contratos nuevos: `docs/contratos/GLOSARIO_VBG.md` y
> `docs/contratos/DECISIONES_PROVISIONALES_VBG.md`.
> **P-VBG-04 queda resuelta para efectos de esta fase**: el modo de demostración
> (`environment.datosDemostracion`) desbloquea la verificación de M2 a M5 sin backend.

| | |
|---|---|
| **IDs** | EST-01, EST-02, EST-04 · base de VBG-03-04 |
| **Archivos** | `package.json` o los 3 avisos de lint · `auth/register/register.component.spec.ts` · **nuevo** `core/catalogos/catalogo-vbg.ts` + `services/catalogo-vbg.service.ts` (+ specs) · **nuevo** `docs/contratos/GLOSARIO_VBG.md` · `CLAUDE.md` §2 |
| **Alcance** | `npm run check` en verde. Catálogo central con código estable + etiqueta, sembrado desde `formulario-anonimo` y desde la matriz, con **respaldo cuando el backend falle**. Glosario como contrato. Corregir `CLAUDE.md` §2, que aún lista **SweetAlert2** en el stack pese a que §4 y §6 dicen que fue retirado. |
| **Riesgos** | El respaldo local puede enmascarar un backend caído. Mitigación: cuando se use el respaldo, avisar con `NotificacionService` y marcarlo visiblemente, como la franja «Datos de demostración». |
| **Terminado** | `npm run check` en verde. El módulo abre sus desplegables sin backend. El glosario está publicado y es el que consultan las demás subfases. |

### M2 — Clasificación y documentación del hecho (secciones 0 a 3) ✅ **EJECUTADA (2026-10-05)**

> Resultado en `docs/evidencias/estandarizacion-vbg/02-subfase-M2-clasificacion-y-documentacion.md`.
> **Corrección al §2 de este diagnóstico**: VBG-01-01 (radio VBG) no estaba «NO EXISTE»
> — ya existía en `registro-caso.component.html`, solo mal posicionado (al final de la
> pestaña en vez de al inicio); el grep original no lo encontró por buscar fuera del
> archivo correcto. VBG-01-08 (Lugar de Ocurrencia) tampoco vivía en `modal-hechos`: ese
> modal tiene un campo de texto libre llamado igual, sin relación con la matriz —
> confusión de nombres ahora corregida (modal-hechos renombra su campo a «Lugar
> específico (opcional)»). El campo real, con las opciones Dentro/Fuera/Mixto, siempre
> estuvo en `registro-caso.component.html`, a nivel de caso.

| | |
|---|---|
| **IDs** | VBG-00-01…03 · VBG-01-01…10 · VBG-02-01…04 · VBG-03-01…08 |
| **Archivos** | `modal-hechos` · `registro-caso` y `registro-atencion` (TS + HTML) · `cita.component` · catálogo |
| **Alcance** | Radio VBG como primer campo, con su lógica condicional. Ámbito, forma y lugar con las opciones literales y sus textos de ayuda en `<mat-hint>`. Árbol de modalidades con Explotación sexual y Sexting anidados. Carga del consentimiento PDF. |
| **Bloqueos** | Pendientes **2** (temporalidad), **3**, **7** (misional), **8** (subcategorías), **18** (consentimiento). **Se entrega la rama Sexual completa y se dejan las demás como están.** |
| **Riesgos** | Es la subfase que más toca la lógica condicional. Mitigación: R-03 y R-04 (ocultar + deshabilitar + limpiar con confirmación), con prueba en ambos sentidos por cada fila de la tabla del §3 de la matriz. |
| **Terminado** | Cada fila de esa tabla probada al mostrar y al ocultar. Con VBG = `No` el formulario guarda. Ninguna etiqueta difiere de la matriz. |

### M3 — Identificación, presunto agresor y apreciaciones (secciones 4 a 6) ✅ **EJECUTADA (2026-10-05)**

> Resultado en
> `docs/evidencias/estandarizacion-vbg/03-subfase-M3-identificacion-agresor-apreciaciones.md`.
> **Hallazgo crítico, no estaba en el diagnóstico original**: `registro-atencion` guardaba
> el payload de la pestaña equivocada en 7 de sus 8 pestañas (ver detalle en el reporte).
> Corregido junto con la pestaña «Presunto agresor», que faltaba por completo en ese
> formulario pese a tener toda la lógica ya escrita.
> **Correcciones a este diagnóstico**: VBG-04-01 ya existía (el tooltip con el ejemplo de
> país sí estaba en `registro-caso.component.html:50`); VBG-05-05/05-09 citaba el control
> equivocado (`otroVinculo` es del vínculo de la persona atendida, no del agresor — el
> modal del agresor no tenía ningún «¿Cuál?»); VBG-05-08 sí es verificable y cumple
> («Personal no docente» aparece literal en el catálogo y en el tooltip del modal).

| | |
|---|---|
| **IDs** | VBG-04-01…07 · VBG-05-01…09 · VBG-06-01…04 |
| **Archivos** | `modal-presunto-agresor` · `modal-apreciacion-juridica` · `modal-apreciacion-psicologica` · `custom-date-adapter.ts` · ambos formularios |
| **Alcance** | **Eliminar «Tipo de Apreciación»** de los dos modales (VBG-06-02). Cuatro campos de nombre independientes. Árbol de vínculos con «Personal no docente». «¿Cuál?» obligatorio y con limpieza. DD/MM/AAAA con ceros a la izquierda. `autocomplete="off"` (R-12). |
| **Bloqueos** | Pendientes **10** (códigos de país), **11** (persona extranjera), **12** (obligatoriedad de nombres). |
| **Riesgos** | Eliminar «Tipo de Apreciación» puede dejar huérfano un campo persistido. **No se borra la columna**: solo sale de la interfaz (punto 5 del §0 de la matriz). |
| **Terminado** | Los modales tienen un único campo narrativo. Ningún formato de fecha fuera de DD/MM/AAAA. |

### M4 — Acuerdos, compromisos, seguimientos y cierre (secciones 7 y 8) ✅ **EJECUTADA (2026-10-05)**

> Resultado en
> `docs/evidencias/estandarizacion-vbg/04-subfase-M4-acuerdos-seguimientos-cierre.md`.
> **Hallazgo que amplió el alcance**: el único bloque «Seguimientos del Caso» existente
> usaba un catálogo de **modalidad de contacto** (Presencial/Virtual/…), no de
> **especialidad profesional** — las cuatro subsecciones de VBG-08-01…04 no existían en
> absoluto, no estaban mal nombradas. Se implementaron desde cero junto con P-12
> (especialidades de las cuentas de prueba PROFESIONAL), requisito previo del
> aislamiento VBG-08-10. De paso se encontró y corrigió que el modal de seguimiento
> cargaba sus tres catálogos con `HttpClient` directo (sin respaldo de demostración, los
> tres desplegables estaban vacíos en modo demo) y que el selector rápido de rol
> (header + login) no distinguía entre cuentas PROFESIONAL con el mismo código de rol —
> con una sola cuenta nunca fue un problema; con las tres nuevas de P-12, las cuatro
> habrían iniciado sesión siempre como la primera encontrada.

| | |
|---|---|
| **IDs** | VBG-07-01…12 · VBG-08-01…13 |
| **Archivos** | `seccion-seguimientos` (nuevo) · `modal-seguimiento` · `modal-activar-ruta` (retirado) · ambos formularios · `auth.service.ts` · `confirm-dialog` |
| **Alcance cumplido** | Rutas Internas/Externas como dos grupos de checkboxes. «Medidas de protección» retirado de la UI sin tocar datos. EST-03 corregido con `DialogoService.confirmar()`. «Fecha de Cumplimiento» + corrección de columnas intercambiadas en la tabla de compromisos del profesional. Cuatro módulos de Seguimientos por especialidad, aislados (VBG-08-10), con cierre autónomo de motivo libre (VBG-08-12) y aviso de última activa (VBG-08-13). P-12 (especialidades de cuentas de prueba) resuelto como requisito previo. |
| **Diferido, no resuelto en esta subfase** | **Tarea 2.4 del plan de accesibilidad** (conectar `ResumenErroresComponent`): investigada antes de empezar — el formulario usa un mecanismo propio (`tabFieldMap`, ~28 campos) en vez de `Validators` de Reactive Forms (solo 2 usos reales, condicionales). Conectar `recolectarErrores()` de forma fiel requiere re-arquitecturar esa validación o un adaptador paralelo — del tamaño de una subfase propia. Sigue como pendiente independiente (§10 y `CLAUDE.md`). El cierre general del caso que el botón «Cerrar el caso» del aviso de última activa podría disparar (VBG-08-13) tampoco se implementó: la propia matriz deja sin resolver si la ventana ejecuta el cierre general o solo lo sugiere. |
| **Riesgos materializados** | El intercambio de manejadores que R-09 advertía para «Rutas activadas»/«Remisiones» no se repitió aquí; el riesgo real resultó ser el de `HttpClient` sin respaldo en `modal-seguimiento` (ver hallazgo). |

### M5 — Alineación terminológica y grupo de atención (sección 9) ✅ **EJECUTADA (2026-10-05)**

> Resultado en
> `docs/evidencias/estandarizacion-vbg/05-subfase-M5-terminologia-y-cierre.md`.
> **Hallazgo que amplió el alcance**: `grupoAtencion` ya tenía datos de demostración
> desde M1 (`'Grupo 2'`, `null`, `'Grupo 5'`), pero se perdía en tres capas distintas
> (`aCitaDto()`/`aCasoDto()`, los mapeadores de fila de cada formulario, y la plantilla
> nunca tenía un campo que lo mostrara) y su tooltip estaba pegado al campo equivocado
> («Estado del caso» describía la fórmula del Grupo de Atención). Las tres pérdidas se
> corrigieron; el campo de solo lectura ya muestra «Grupo 2» / «Sin calcular» según el
> caso. **Cierra el plan M1–M5 completo.**

| | |
|---|---|
| **IDs** | VBG-09-01, 09-02 · P-VBG-01, 02, 03, 07 · glosario cruzado del §3 |
| **Archivos** | `panel-usuario.component.html` · `mi-proceso.service.ts` · `dashboard-metricas.service.ts` · `dashboard-trabajo.service.ts` · `registro-caso`/`registro-atencion` · `caso-simulado.model.ts` · `solicitud.service.ts` · `core/vbg/ultima-profesional-activa.ts` (nuevo) |
| **Alcance cumplido** | «Lo que acordamos» → «Lo que decidiste hacer» (P-VBG-02, texto final tomado de la decisión provisional, no del diagnóstico original — ver nota en el reporte). `fechaAcordada` → `fechaCumplimiento`. KPIs declaran origen (P-VBG-01) y alcance VBG (P-VBG-03) en su `definicion`. Umbral de 15 días documentado como constante provisional (P-VBG-07). Predicado único `esUltimaProfesionalActiva()`, usado por `SeccionSeguimientosComponent` (M4); el panel sigue con dato mock aparte, documentado como el mismo concepto. **Grupo de atención en solo lectura** (VBG-09-02), sin lógica de cálculo (pendiente 17 sigue bloqueando eso). Glosario cruzado del §3: confirmado sin ocurrencias fuera del módulo, nada que corregir. |
| **Fuera de alcance, reportado y no corregido** | `sidebar`/`horizontal-nav` no usan `CATALOGO_MODULOS`: tres nombres para «Nueva solicitud», dos entradas para `/consulta`, íconos repetidos. Es higiene de navegación general, no terminología de la matriz; se deja anotado para una tarea aparte. |
| **Terminado** | Ningún término de la matriz significa cosas distintas en dos pantallas. El grupo de atención no es editable. `npm run check` sin deuda nueva (255/256 tests, único fallo preexistente). |

---

## 10. Preguntas para el equipo

### Nuevas, surgidas de este diagnóstico

| # | Pregunta | Bloquea |
|---|---|---|
| ~~**P-VBG-01**~~ | **RESUELTA y EJECUTADA (2026-10-05, M5).** Cuenta ambos orígenes (persona + dupla/profesional), declarado en la `definicion` del indicador (`dashboard-metricas.service.ts`). | — |
| ~~**P-VBG-02**~~ | **RESUELTA y EJECUTADA (2026-10-05, M5).** Solo los propios, bajo «Lo que decidiste hacer» — ya era el comportamiento de hecho; se documentó como decisión deliberada. | — |
| ~~**P-VBG-03**~~ | **RESUELTA y EJECUTADA (2026-10-05, M5).** Los indicadores institucionales solo cuentan VBG = `Sí`, declarado en su `definicion`. | — |
| ~~**P-VBG-04**~~ | **RESUELTA (2026-10-05).** El equipo decide trabajar con modo de demostración (`environment.datosDemostracion`): el módulo no llama al backend mientras esté activo. Catálogos, citas, casos y guardado salen de implementaciones simuladas, sin perder el camino HTTP real. Ver `01-subfase-M1-higiene-y-cimientos.md`. | — |
| ~~**P-VBG-05**~~ | **RESUELTA (2026-10-05).** Se mantiene el `.gitignore`: las capturas se toman localmente para verificar y lo observado se describe en cada reporte de subfase. | — |
| ~~**P-VBG-06**~~ | **RESUELTA (2026-10-05).** Se resuelve con el mapeo del catálogo central (M1): el tipo 6 del backend («Informática») se trata como la «Violencia facilitada por nuevas tecnologías» de la matriz, anidada bajo Sexual. La discrepancia completa, incluida la del catálogo de vínculos, queda reportada al equipo de backend en `docs/contratos/GLOSARIO_VBG.md`. | — |
| ~~**P-VBG-07**~~ | **RESUELTA y EJECUTADA (2026-10-05, M5).** Sin respaldo normativo confirmado; queda en `UMBRAL_DIAS_SIN_REGISTRO = 15`, constante documentada como provisional en `dashboard-trabajo.service.ts`. | — |
| ~~**P-VBG-08**~~ | **RESUELTA y EJECUTADA (2026-10-05, M4).** Se retiró de la interfaz en ambos formularios, sin tocar datos ni contratos. | — |

### Pendientes de la matriz que bloquean esta fase

**Bloqueantes:** 17 (tabla del grupo de atención) · 15 (Acción→Actividad) · 7 (relación
misional) · 13 (rutas con Acuerdos = `No`) · 16 (motivo de cierre) · 18 (consentimiento) ·
**P-12** (modelo de especialidades, compartido con DSH-08-01).

**Parciales:** 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 14.

### Heredadas, todavía abiertas

**P-03** (paleta `--color-data-*`) · **P-05** (categorías de identidad de género) ·
**P-06** (umbral de supresión) · **P-07** (nombres oficiales de módulo) · **P-02** (catálogo
de roles) · validación de los textos del rol Usuario con el equipo de atención.
