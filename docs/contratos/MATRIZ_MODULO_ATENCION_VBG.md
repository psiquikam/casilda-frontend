# Matriz Técnica y Estandarización — Módulo de Atención VBG (Casilda)

> **Propósito de este documento:** servir como fuente de verdad para el agente de desarrollo (Claude Code) al implementar y **validar** la estandarización de campos, etiquetas, tooltips, validaciones, lógica condicional y jerarquía visual de los formularios del módulo **Equipo de Atención** del sistema Casilda (Angular).
>
> **Origen:** `Matriz_Técnica_y_Estandarización_del_Módulo_de_Atención_VBG.xlsx` (hoja `Table 1`, 29 registros). El contenido normativo de las secciones 1 a 10 se transcribe fielmente; las marcas numéricas de citación del Excel original se retiraron por no ser útiles en código.

---

## 0. Cómo debe usar este documento el agente

1. **Jerarquía de fuentes.** Lo marcado como **[MATRIZ]** es obligatorio y prevalece sobre el código actual, el diccionario de datos y cualquier convención previa **en cuanto a contenido y reglas de negocio** (campos, etiquetas, opciones, validaciones). En lo visual y técnico prevalecen `CLAUDE.md`, `casilda-diseno-v1.md` y los tokens del proyecto. Lo marcado como **[PROPUESTA]** es una convención técnica sugerida, aplicable solo si no contradice la matriz. Lo marcado como **[PENDIENTE]** no debe implementarse por suposición: se reporta al equipo.
2. **Literalidad de textos.** Etiquetas, opciones de lista, encabezados y textos de ayuda entre comillas o en las tablas de opciones se copian **exactamente** (mayúsculas, tildes, barras y orden). No se parafrasean.
3. **Diccionario de datos desactualizado.** La matriz indica explícitamente que las etiquetas y subcategorías de violencia se toman de la matriz y **no** del diccionario de datos. Si el código o la base de datos usan otras denominaciones, se reporta la discrepancia.
4. **Trazabilidad.** Cada requisito tiene un ID (`VBG-XX-NN`). Al validar, el agente debe reportar por ID: `CUMPLE`, `NO CUMPLE` (con archivo/línea) o `NO APLICA / PENDIENTE`.
5. **No borrar datos históricos.** Cuando la matriz ordena eliminar campos o secciones de la UI, el agente no debe eliminar columnas ni registros en base de datos sin confirmación explícita del equipo.

---

## 1. Mapa de secciones

| # Matriz | Sección / Módulo | Contenido principal |
|---|---|---|
| 0 | Gestión de Citas y Consentimiento | Carga del consentimiento firmado (PDF) |
| 1 | Clasificación VBG y Filtrado | Filtro inicial VBG Sí/No |
| 1 | Documentación del Hecho | Descripción, ámbito, forma y lugar de ocurrencia |
| 2 | Relación Misional e Institucional | Relación con actividades misionales/institucionales |
| 3 | Tipos y Modalidades de Violencia | Modalidades y subcategorías anidadas |
| 4 | Identificación Territorial | Documento, fecha de nacimiento, datos territoriales |
| 5 | Datos del Presunto Agresor | Nombres, vínculos y campo dinámico "Otro" |
| 6 | Apreciaciones Profesionales | Campo narrativo único |
| 7 | Acuerdos y Compromisos | Acuerdo, rutas internas/externas, compromisos |
| 8 | Seguimientos por Rol (en la UI: **Sección 7**) | Subsecciones 7.1 a 7.4, cierre autónomo |
| 9 | Clasificación Automática de Casos | Grupo de atención 1 a 6 (solo lectura) |

> **[PENDIENTE]** La numeración de la matriz no coincide con la de la UI: "1." se repite en dos secciones y la sección 8 de la matriz corresponde a la "Sección 7" de la interfaz (subsecciones 7.1–7.4), mientras "7. Acuerdos y Compromisos" también usa el 7. Confirmar con el equipo la numeración visible definitiva antes de renumerar encabezados.

---

## 2. Especificación por sección

### Sección 0 — Gestión de Citas y Consentimiento

| ID | Campo | Tipo / Formato | Contenido |
|---|---|---|---|
| VBG-00-01 | Consentimiento de Atención | Archivo adjunto (PDF) | Carga del archivo PDF devuelto por la persona. |

**Reglas [MATRIZ]**
- **VBG-00-02** El consentimiento se envía por correo al agendar por teléfono y se sube escaneado/firmado al sistema **al iniciar la atención**.
- **VBG-00-03** Solo se acepta formato PDF.

**Fuera de alcance actual**
- Integración del agendamiento con Google Calendar: la matriz la indica como "se contempla" (evolución futura). No implementar en esta iteración salvo instrucción expresa.

**[PENDIENTE]** Tamaño máximo del archivo y si la carga es obligatoria para poder guardar la atención.

---

### Sección 1 — Clasificación VBG y Filtrado

| ID | Campo | Tipo / Formato | Opciones |
|---|---|---|---|
| VBG-01-01 | Violencia Basada en Género | Radio button / Selección única | `Sí` · `No` |

**Reglas [MATRIZ]**
- **VBG-01-02 Posición:** es el filtro inicial; debe ubicarse **al inicio** de la documentación del hecho.
- **VBG-01-03 Si = `Sí`:** despliega los campos de temporalidad, descripción narrativa del hecho, modalidades y subcategorías de violencia.
- **VBG-01-04 Si = `No`:** oculta las modalidades VBG pero **permite guardar** el evento para registro institucional.

**[PENDIENTE]** La matriz menciona "campos de temporalidad" sin definirlos (¿fecha del hecho?, ¿hecho único/continuado?). No crear campos nuevos por suposición. Confirmar también si "Descripción de los Hechos" debe ocultarse cuando VBG = `No` (la regla VBG-01-03 la lista entre los campos que despliega el `Sí`).

---

### Sección 1 — Documentación del Hecho

| ID | Campo | Tipo / Formato | Opciones / Contenido | Obligatoriedad |
|---|---|---|---|---|
| VBG-01-05 | Descripción de los Hechos | Texto libre (campo amplio) | Indicación explicativa: **"Describa los hechos en circunstancias de tiempo, modo y lugar"** | Ver pendiente sección 1 |
| VBG-01-06 | Ámbito de Ocurrencia | Lista desplegable | `Pareja / expareja` · `Laboral` · `Académico` · `Sindical` · `Político` · `Público` · `Privado` · `Familiar` · `Otro` | **Obligatorio si VBG = `Sí`** |
| VBG-01-07 | Forma de Ocurrencia | Lista desplegable | `Presencial` · `Virtual` · `Mixta` | **Obligatorio si VBG = `Sí`** |
| VBG-01-08 | Lugar de Ocurrencia | Lista desplegable | `Dentro` · `Fuera` · `Mixto` | — |

**Reglas [MATRIZ]**
- **VBG-01-09** "Descripción de los Hechos" es un campo de redacción narrativa abierta (textarea amplio, no input de una línea).
- **VBG-01-10** "Lugar de Ocurrencia" se refiere a los **bienes inmuebles o predios universitarios** (dentro / fuera / mixto respecto a ellos). El tooltip o texto de ayuda debe dejar esto explícito.

**[PENDIENTE]**
- Si la opción `Otro` de "Ámbito de Ocurrencia" activa un campo "¿Cuál?" como en la sección 5 (la matriz solo lo exige para los vínculos del agresor).
- Obligatoriedad de "Lugar de Ocurrencia" (la matriz no la indica, pero alimenta la clasificación automática de la sección 9).

---

### Sección 2 — Relación Misional e Institucional

| ID | Campo | Tipo / Formato |
|---|---|---|
| VBG-02-01 | Relación Misional / Institucional | Selección múltiple / Desplegable condicional |

**Texto explicativo del protocolo [MATRIZ]** (mostrar como ayuda contextual del campo):
> "Ocurrió en el desarrollo de actividades misionales, institucionales, en representación de la universidad o en bienes inmuebles..."

**Opciones [MATRIZ]**
- `Misional Docencia`
- `Misional Investigación`
- `Misional Extensión`
- `Actividades Institucionales`
- `En representación de la U`
- `En bienes inmuebles`

**Reglas [MATRIZ]**
- **VBG-02-02** Si se selecciona "Misional", se despliegan **obligatoriamente** las tres subcategorías estatutarias: Docencia, Investigación, Extensión.
- **VBG-02-03** Se incorpora estratégicamente el término **"Institucionales"** en la denominación del campo y sus opciones.
- **VBG-02-04** Es de selección múltiple.

**[PENDIENTE]**
- El texto del protocolo termina en "..." en la matriz: solicitar el texto completo antes de publicarlo en la UI.
- Estructura de la selección: la matriz lista las tres opciones misionales como opciones planas pero también describe un "Misional" que despliega subcategorías. Interpretación sugerida: nivel 1 = `Misional` / `Actividades Institucionales` / `En representación de la U` / `En bienes inmuebles`; al marcar `Misional` aparece un nivel 2 con `Docencia` / `Investigación` / `Extensión`, exigiendo al menos una. Confirmar antes de implementar, y confirmar los valores persistidos (p. ej. `Misional Docencia`).

---

### Sección 3 — Tipos y Modalidades de Violencia

Visible solo si **VBG = `Sí`** (VBG-01-03 / VBG-01-04).

| ID | Campo | Tipo / Formato | Opciones |
|---|---|---|---|
| VBG-03-01 | Modalidades Principales | Casillas de verificación / Desplegable jerárquico | `Psicológica` · `Física` · `Sexual` · `Patrimonial` · `Por prejuicio` · `Institucional` |
| VBG-03-02 | Subcategorías de Violencia Sexual | Desplegable dependiente (anidado en V. Sexual) | Ver árbol |
| VBG-03-03 | Subcategorías de V. Tecnológica / Informática | Desplegable dependiente (anidado en V. Sexual) | Ver árbol |

**Árbol jerárquico [MATRIZ]**

```
Sexual
├── Acceso carnal violento
├── Acto sexual violento
├── Explotación sexual
│     (inducción a la prostitución, proxenetismo con menor de edad,
│      constreñimiento a la prostitución, trata de personas)
└── Violencia facilitada por nuevas tecnologías
      ├── Uso, explotación y trata mediante amenazas / extorsión
      ├── Grooming
      ├── Creación de contenido sin consentimiento
      └── Sexting sin consentimiento
```

Etiquetas exactas del nivel 2 de Sexual: `Acceso carnal violento` · `Acto sexual violento` · `Explotación sexual` · `Violencia facilitada por nuevas tecnologías`.

**Reglas [MATRIZ]**
- **VBG-03-04 Fuente oficial:** etiquetas y subcategorías se toman **estrictamente** de la matriz, no del diccionario de datos desactualizado.
- **VBG-03-05** "Explotación sexual" **no** es un tipo independiente: debe estar anidado bajo Violencia Sexual. Si existe como modalidad de primer nivel, retirarla de ese nivel.
- **VBG-03-06** Las subcategorías de violencia tecnológica/informática se anidan bajo Violencia Sexual (a través de "Violencia facilitada por nuevas tecnologías").
- **VBG-03-07** La etiqueta debe ser literalmente **"Sexting sin consentimiento"** (el sexting consentido no constituye violencia). No usar "Sexting" a secas.
- **VBG-03-08** Los desplegables dependientes solo se muestran cuando su padre está seleccionado.

**[PENDIENTE]**
- Subcategorías de las modalidades `Psicológica`, `Física`, `Patrimonial`, `Por prejuicio` e `Institucional`: la matriz las remite a "la Matriz en Excel" pero este archivo no las incluye.
- Si los elementos entre paréntesis de "Explotación sexual" son un tercer nivel seleccionable o solo texto descriptivo (tooltip).

---

### Sección 4 — Identificación Territorial

| ID | Campo | Tipo / Formato | Contenido / Etiqueta |
|---|---|---|---|
| VBG-04-01 | Documento de Identificación | Texto alfanumérico | Etiqueta de ayuda: **"En caso de documento extranjero, consignar la abreviatura del país antes del número (ej. VNZ123456)"** |
| VBG-04-02 | Fecha de Nacimiento | Campo fecha | Formato estricto **DD/MM/AAAA** (Día/Mes/Año) |
| VBG-04-03 | Datos Territoriales | Listas desplegables | `Municipio` · `Departamento` · `País de nacimiento` (si es persona extranjera) |

**Reglas [MATRIZ]**
- **VBG-04-04** Incluir un catálogo de códigos de país para el prefijo del documento extranjero.
- **VBG-04-05** La fecha de nacimiento se muestra y captura con formato DD/MM/AAAA en todos los formularios del módulo (estandarización).
- **VBG-04-06** Registro territorial desagregado (campos separados, no texto libre combinado).
- **VBG-04-07** "País de nacimiento" se muestra para persona extranjera.

**[PENDIENTE]**
- El ejemplo `VNZ` no corresponde al código ISO 3166-1 alfa-3 de Venezuela (`VEN`). Confirmar qué estándar de códigos se adopta para el catálogo y corregir el ejemplo si aplica.
- Qué condición determina "persona extranjera" (¿tipo de documento?, ¿campo nacionalidad?).
- Si Departamento → Municipio es una cascada dependiente (recomendado).

---

### Sección 5 — Datos del Presunto Agresor

| ID | Campo | Tipo / Formato | Opciones / Contenido |
|---|---|---|---|
| VBG-05-01 | Encabezado de sección | Etiqueta visible | **"Datos del presunto agresor"** |
| VBG-05-02 | Nombres y Apellidos | Campos de texto libre independientes | `Primer nombre` · `Segundo nombre` · `Primer apellido` · `Segundo apellido` |
| VBG-05-03 | Vínculo con la Universidad | Lista desplegable | Ver árbol |
| VBG-05-04 | Vínculo con la Víctima | Lista desplegable | `Pareja / Expareja` · `Familiar` · `Compañeros de estudio` · `Docente` · `Otro` |
| VBG-05-05 | Campo dinámico "Otro" | Texto libre | Etiqueta: **"¿Cuál?"** |

**Opciones de "Vínculo con la Universidad" [MATRIZ]**

```
Estudiante
├── Pregrado
├── Posgrado
├── Tecnología
└── Técnica
Docente
├── Vinculado
├── Ocasional
├── Cátedra
└── Cátedra 50
Personal no docente
Otro
```

**Reglas [MATRIZ]**
- **VBG-05-06** Encabezado unificado: en todo el módulo se usa "Datos del presunto agresor" (sin variantes como "Agresor", "Datos del agresor", etc.).
- **VBG-05-07** Cuatro campos de nombre independientes; no un único campo "Nombre completo".
- **VBG-05-08** Denominación obligatoria **"Personal no docente"** en lugar de "Administrativos".
- **VBG-05-09** Al seleccionar `Otro` en "Vínculo con la Universidad" **o** en "Vínculo con la Víctima", se activa el campo "¿Cuál?" y pasa a ser **obligatorio**. Al deseleccionar `Otro`, el campo se oculta (ver regla global R-04).

**[PENDIENTE]** Obligatoriedad de los campos de nombre (en la práctica el agresor puede ser desconocido).

---

### Sección 6 — Apreciaciones Profesionales

| ID | Campo | Tipo / Formato |
|---|---|---|
| VBG-06-01 | Apreciación Jurídica / Psicológica | Texto libre amplio (campo narrativo descriptivo abierto) |

**Reglas [MATRIZ]**
- **VBG-06-02** Eliminar de la UI la lista desplegable **"Tipo de apreciación"**.
- **VBG-06-03** Eliminar la etiqueta **"Observación"**.
- **VBG-06-04** Dejar **únicamente** un campo narrativo libre.

---

### Sección 7 — Acuerdos y Compromisos

| ID | Campo | Tipo / Formato | Opciones / Contenido |
|---|---|---|---|
| VBG-07-01 | Acuerdos Alcanzados | Radio button / Selección | Pregunta: **"¿Logró llegar a un acuerdo con la persona?"** — `Sí` / `No` |
| VBG-07-02 | Rutas Internas | Lista desplegable / Checkbox | `Asuntos disciplinarios` · `Resolución de conflictos` · `Medidas administrativas` · `Protocolo de amenazas` · `Medidas académicas` · `Medidas laborales` · `Otras` |
| VBG-07-03 | Rutas Externas | Lista desplegable / Checkbox | `Salud` · `Fiscalía` · `Comisaría de Familia` · `Inspección de Policía` · `Procuraduría General de la Nación` · `Otras` |
| VBG-07-04 | Compromisos Atendida | Bloque dinámico (texto libre + fecha) | Descripción narrativa del compromiso · Fecha de cumplimiento |
| VBG-07-05 | Compromisos Dupla / Profesional | Bloque dinámico (texto libre + fecha) | Descripción narrativa del compromiso · Fecha de cumplimiento |

**Reglas [MATRIZ]**
- **VBG-07-06** "Acuerdos Alcanzados" = `Sí` habilita las secciones de rutas y compromisos.
- **VBG-07-07** Renombrar **"Ruta de amenazas"** → **"Protocolo de amenazas"**.
- **VBG-07-08** Rutas internas y externas se presentan como grupos separados (separación clara de competencias).
- **VBG-07-09** La fecha de los compromisos es la **fecha en que la persona va a cumplir el compromiso**, no la fecha de registro. La etiqueta debe decir "Fecha de cumplimiento" (o equivalente aprobado) y no "Fecha".
- **VBG-07-10** "Compromisos Atendida" permite agregar **múltiples** compromisos.
- **VBG-07-11** "Compromisos Dupla / Profesional" es un bloque **separado** de los compromisos de la persona atendida (víctima).
- **VBG-07-12 ELIMINAR** del módulo la sección **"Otros casos y medidas de protección"** (estaba mal ubicada en el diseño anterior).

**[PENDIENTE]**
- Si con "Acuerdos Alcanzados" = `No` las rutas deben seguir disponibles (activar una ruta no siempre depende de un acuerdo).
- Si `Otras` (rutas) activa un campo "¿Cuál?".
- Si "Compromisos Dupla / Profesional" también admite múltiples registros (por simetría se asume que sí; confirmar).
- Si la fecha de cumplimiento debe validarse como igual o posterior a la fecha de la atención.

---

### Sección 8 (UI: Sección 7) — Seguimientos por Rol

**Estructura [MATRIZ]** — módulos independientes por rol:

| ID | Subsección |
|---|---|
| VBG-08-01 | 7.1 Jurídico |
| VBG-08-02 | 7.2 Psicojurídico |
| VBG-08-03 | 7.3 Psicológico |
| VBG-08-04 | 7.4 Psicoorientación |

**Campos por registro de seguimiento [MATRIZ]**

| ID | Campo | Tipo |
|---|---|---|
| VBG-08-05 | Fecha del seguimiento | Fecha (DD/MM/AAAA) |
| VBG-08-06 | Acción | Lista desplegable |
| VBG-08-07 | Actividad | Lista desplegable **dependiente** de la Acción |
| VBG-08-08 | Descripción | Texto narrativo |

**Reglas [MATRIZ]**
- **VBG-08-09 ELIMINAR** la subsección **Trabajo Social**.
- **VBG-08-10** Cada especialidad gestiona sus registros de forma aislada.
- **VBG-08-11** Las opciones de "Actividad" se cargan dinámicamente según la "Acción" seleccionada; al cambiar la Acción se limpia la Actividad.
- **VBG-08-12 Cierre autónomo:** cada profesional puede cerrar sus propios seguimientos. Estado individual del seguimiento: `Abierto` / `Cerrado` (con motivo).
- **VBG-08-13 Alerta de último activo:** cuando la última profesional con seguimiento activo hace clic en cerrar, se muestra una ventana emergente que le notifica que es la última activa, para que ejecute el **cierre general del caso**.

**[PENDIENTE]**
- Catálogo de Acciones y su mapeo Acción → Actividades (no está en la matriz).
- Si el motivo de cierre es lista cerrada o texto libre.
- Si la ventana emergente ejecuta el cierre general o solo lo sugiere (y qué ocurre si la profesional lo rechaza).
- Permisos: confirmar que un rol no puede editar ni cerrar seguimientos de otro rol.

---

### Sección 9 — Clasificación Automática de Casos

| ID | Campo | Tipo |
|---|---|---|
| VBG-09-01 | Grupo de Atención (Grupos 1 al 6) | Campo de cálculo automático, **solo lectura**. Valor numérico de 1 a 6 asignado por el sistema al guardar. |

**Variables de entrada [MATRIZ]** — se evalúan en segundo plano y se recalcula al guardar:
1. Vínculo de la víctima
2. Vínculo del agresor
3. Ocurrencia dentro/fuera de la Universidad
4. Relación con la misionalidad
5. Si es VBG

**Definición de grupos [MATRIZ]**

| Grupo | Criterio |
|---|---|
| 1, 2, 4 y 6 | Casos misionales con competencia disciplinaria o capacidad de actuación directa de la Universidad |
| 3 | Eventos totalmente externos, sin vínculo misional |
| 5 | Víctima universitaria en actividad misional, pero agresor externo sin competencia disciplinaria directa |
| 6 | Agresor universitario que comete el hecho contra persona externa dentro del campus o en misionalidad |

**Reglas [MATRIZ]**
- **VBG-09-02** El usuario no puede editar el campo.
- **VBG-09-03** El valor se recalcula cada vez que se guarda el caso.

**[PENDIENTE — bloqueante para la lógica]** La matriz no diferencia los criterios exactos de los Grupos 1, 2 y 4 entre sí. Se requiere la tabla de decisión completa (combinación de las cinco variables → grupo) antes de implementar o validar el cálculo. Tampoco se indica qué valor asignar si faltan variables de entrada.

---

## 3. Resumen de lógica condicional

| Disparador | Condición | Efecto | Ref. |
|---|---|---|---|
| Violencia Basada en Género | `Sí` | Muestra temporalidad, descripción, modalidades y subcategorías; Ámbito y Forma de Ocurrencia pasan a obligatorios | VBG-01-03, 01-06, 01-07 |
| Violencia Basada en Género | `No` | Oculta modalidades VBG; el evento se puede guardar | VBG-01-04 |
| Relación Misional / Institucional | Incluye "Misional" | Despliega Docencia / Investigación / Extensión | VBG-02-02 |
| Modalidades Principales | `Sexual` | Muestra subcategorías de V. Sexual | VBG-03-08 |
| Subcategorías V. Sexual | `Violencia facilitada por nuevas tecnologías` | Muestra subcategorías tecnológicas | VBG-03-06 |
| Vínculo con la Universidad | `Estudiante` / `Docente` | Muestra su subnivel | VBG-05-03 |
| Vínculo con la Universidad / con la Víctima | `Otro` | Muestra "¿Cuál?" obligatorio | VBG-05-09 |
| Acuerdos Alcanzados | `Sí` | Habilita rutas y compromisos | VBG-07-06 |
| Acción (seguimiento) | Cualquier valor | Filtra opciones de Actividad | VBG-08-11 |
| Cierre de seguimiento | Es el último activo del caso | Ventana emergente de cierre general | VBG-08-13 |
| Guardar caso | Siempre | Recalcula Grupo de Atención | VBG-09-03 |

---

## 4. Cambios de terminología y eliminaciones

| Tipo | Actual / anterior | Debe quedar | Ref. |
|---|---|---|---|
| Renombrar | Administrativos | **Personal no docente** | VBG-05-08 |
| Renombrar | Ruta de amenazas | **Protocolo de amenazas** | VBG-07-07 |
| Renombrar | Sexting | **Sexting sin consentimiento** | VBG-03-07 |
| Renombrar | Variantes del encabezado del agresor | **Datos del presunto agresor** | VBG-05-06 |
| Renombrar | Fecha (compromisos) | **Fecha de cumplimiento** | VBG-07-09 |
| Reubicar | "Explotación sexual" como tipo independiente | Anidada bajo **Sexual** | VBG-03-05 |
| Eliminar | Lista "Tipo de apreciación" | — | VBG-06-02 |
| Eliminar | Etiqueta "Observación" (apreciaciones) | — | VBG-06-03 |
| Eliminar | Sección "Otros casos y medidas de protección" | — | VBG-07-12 |
| Eliminar | Subsección "Trabajo Social" (seguimientos) | — | VBG-08-09 |

---

## 5. Convenciones de implementación transversales [PROPUESTA]

Estas reglas no provienen de la matriz; buscan que la estandarización sea homogénea en todo el módulo. Las reglas de `CLAUDE.md` §6, `.agents/skills/angular_frontend_guidelines/SKILL.md` y `.agents/skills/accessibility/SKILL.md` **prevalecen** sobre esta sección. Todo estilo usa los tokens de `src/styles/_tokens.scss`, sin valores literales.

**R-01 Catálogos fuera de los componentes.** Las listas de la sección 2 no se escriben en plantillas ni en componentes (regla 1 de `CLAUDE.md`). Se sirven desde un servicio de catálogos que hoy devuelve un mock tipado y documenta el endpoint previsto, siguiendo el patrón de `ContenidoHomeService`. Así las etiquetas se validan contra este documento en un solo lugar y el cambio al backend no toca los formularios.

**R-02 Formularios reactivos.** Usar Reactive Forms. La obligatoriedad condicional se aplica agregando/quitando validadores (`addValidators` / `removeValidators` / `clearValidators`) seguido de `updateValueAndValidity()`, suscrito al `valueChanges` del campo disparador, con limpieza de suscripciones al destruir el componente.

**R-03 Ocultar ≠ deshabilitar.** Un campo dependiente que no aplica se oculta con `@if` (control flow ya homogeneizado en el proyecto) y su control se deshabilita (`disable()`), para que no participe en la validación ni se envíe en `form.value`.

**R-04 Limpieza al ocultar.** Cuando un disparador cambia y oculta campos dependientes (p. ej. VBG pasa de `Sí` a `No`, o se deselecciona `Otro`), los valores dependientes se limpian (`reset()`), evitando persistir datos incoherentes. Si el cambio borra información ya diligenciada, se pide confirmación con `DialogoService.confirmar()`.

**R-05 Formato de fecha.** El proyecto ya provee `LOCALE_ID` `es-CO`. En los `mat-datepicker`, verificar que el adaptador de fechas configurado muestre y acepte `DD/MM/AAAA` **con ceros a la izquierda** (p. ej. `03/10/2026`); el adaptador nativo con `es-CO` puede producir `3/10/2026`, en cuyo caso se requieren formatos personalizados. El valor enviado al backend se mantiene en el formato que espera la API (típicamente ISO 8601).

**R-06 Textos de ayuda y tooltips.** Las instrucciones de diligenciamiento de la matriz (descripción de los hechos, documento extranjero, relación misional, lugar de ocurrencia) van en `<mat-hint>`, nunca en `placeholder`. `matTooltip` solo complementa (p. ej. una definición) y nunca es el único portador del texto ni el nombre accesible; si se usa un ícono de información, es un `mat-icon-button` con `aria-label` contextual y `<mat-icon aria-hidden="true">` (regla 7, exigida por el lint `casilda/mat-icon-button-accessible-name`).

**R-07 Jerarquía visual.** Orden de lectura: encabezado de sección → filtro o disparador → campos dependientes agrupados visualmente bajo su disparador, con los espaciados y bordes de los tokens. Los subniveles (subcategorías, "¿Cuál?", subcategorías misionales) deben verse claramente subordinados a su padre. Los encabezados de sección que sean `h2`/`h3` usan `--font-serif` (Lora); las etiquetas de campo, `--font-sans` (Inter). Marcar los obligatorios de forma consistente e incluir una leyenda. Campos de 48 px de alto, como en el formulario anónimo ya corregido.

**R-08 Mensajes de validación.** Un mensaje por tipo de error, en español, específico del campo (p. ej. "Seleccione el ámbito de ocurrencia"), en `<mat-error>`. Al intentar guardar un formulario inválido, usar `ResumenErroresComponent` + `recolectarErrores()` (resumen enfocable con salto al campo), con `id="<prefijo>-<control>"` en los inputs. Conectarlo a `registro-caso` y `registro-atencion` es además la tarea 2.4 pendiente del plan de accesibilidad, así que conviene resolver ambas en el mismo cambio.

**R-09 Bloques dinámicos.** Compromisos y seguimientos se implementan con `FormArray`, con botones explícitos "Agregar compromiso" / "Eliminar" (área táctil mínima de 44 px) y confirmación con `DialogoService.confirmar()` al eliminar un registro con contenido. Verificar que los manejadores de eliminación apunten al arreglo correcto: en `registro-caso` y `registro-atencion` ya hubo un intercambio entre "Rutas activadas" y "Remisiones".

**R-10 Cálculo del Grupo de Atención.** Debe residir en el backend (fuente única de verdad); el frontend solo lo muestra como campo de solo lectura tras guardar.

**R-11 Diálogos y notificaciones.** La ventana emergente de último seguimiento activo (VBG-08-13) y cualquier otra confirmación usan `DialogoService` (MatDialog). Los errores de red pasan por `NotificacionService`. Nunca `alert`, `confirm` ni SweetAlert2. Todo `subscribe()` maneja `next` y `error`.

**R-12 Autocompletado.** Según la regla 9 de `CLAUDE.md`, los formularios sobre terceras personas usan `autocomplete="off"`. Esto aplica a los datos del presunto agresor (sección 5) y a los datos de identificación de la persona atendida que registra el equipo (sección 4).

---

## 6. Lista de verificación para el agente

Ejecutar sobre todos los formularios del módulo Equipo de Atención y reportar por ID.

**Etiquetas y catálogos**
- [ ] Todas las opciones de lista coinciden literalmente (texto y orden) con las secciones 2.x de este documento.
- [ ] No quedan ocurrencias en la UI de "Administrativos", "Ruta de amenazas", "Sexting" sin "sin consentimiento", ni variantes del encabezado del agresor.
- [ ] "Explotación sexual" no aparece como modalidad de primer nivel.

**Estructura**
- [ ] El radio VBG es el primer campo de la documentación del hecho.
- [ ] No existen: lista "Tipo de apreciación", etiqueta "Observación" en apreciaciones, sección "Otros casos y medidas de protección", subsección "Trabajo Social".
- [ ] Seguimientos tiene exactamente 7.1 Jurídico, 7.2 Psicojurídico, 7.3 Psicológico, 7.4 Psicoorientación.
- [ ] Compromisos de la persona atendida y de la dupla/profesional están en bloques separados.

**Lógica condicional y validaciones**
- [ ] Cada fila de la tabla de la sección 3 está implementada y probada en ambos sentidos (mostrar y ocultar).
- [ ] Ámbito y Forma de Ocurrencia son obligatorios solo con VBG = `Sí`.
- [ ] Con VBG = `No` el formulario se puede guardar.
- [ ] "¿Cuál?" es obligatorio solo cuando el vínculo correspondiente es `Otro`.
- [ ] Actividad se filtra y se limpia al cambiar la Acción.
- [ ] Todas las fechas se muestran como DD/MM/AAAA.
- [ ] El consentimiento solo acepta PDF.
- [ ] El Grupo de Atención es de solo lectura y se actualiza al guardar.
- [ ] La ventana emergente aparece únicamente al cerrar el último seguimiento activo del caso.

**Pendientes**
- [ ] `npm run check` pasa sin agregar deuda nueva, y no hay colores, tipografías ni espaciados literales en los cambios.
- [ ] Ningún elemento marcado [PENDIENTE] fue implementado por suposición; todos quedan listados en el reporte final para el equipo.

---

## 7. Pendientes consolidados para el equipo

| # | Tema | Ref. |
|---|---|---|
| 1 | Numeración visible definitiva de secciones (duplicidad de "1." y "7.") | §1 |
| 2 | Definición de los "campos de temporalidad" | VBG-01-03 |
| 3 | Visibilidad de "Descripción de los Hechos" con VBG = `No` | VBG-01-03 |
| 4 | "¿Cuál?" para `Otro` en Ámbito de Ocurrencia y `Otras` en rutas | VBG-01-06, 07-02, 07-03 |
| 5 | Obligatoriedad de Lugar de Ocurrencia | VBG-01-08 |
| 6 | Texto completo del protocolo de relación misional | VBG-02-01 |
| 7 | Estructura exacta (niveles y valores persistidos) de Relación Misional | VBG-02-02 |
| 8 | Subcategorías de modalidades distintas a Sexual | VBG-03-01 |
| 9 | Tercer nivel de "Explotación sexual" (seleccionable o descriptivo) | VBG-03-02 |
| 10 | Estándar de códigos de país (ejemplo VNZ vs. ISO `VEN`) | VBG-04-01 |
| 11 | Criterio de "persona extranjera" y cascada Departamento → Municipio | VBG-04-03 |
| 12 | Obligatoriedad de nombres del presunto agresor | VBG-05-02 |
| 13 | Comportamiento de rutas con Acuerdos = `No` | VBG-07-06 |
| 14 | Múltiples compromisos en bloque Dupla/Profesional y validación de fecha | VBG-07-05, 07-09 |
| 15 | Catálogo Acción → Actividad de seguimientos | VBG-08-06, 08-07 |
| 16 | Motivo de cierre (lista o texto) y alcance de la ventana emergente | VBG-08-12, 08-13 |
| 17 | Tabla de decisión completa del Grupo de Atención 1–6 | VBG-09-01 |
| 18 | Tamaño máximo y obligatoriedad del consentimiento PDF | VBG-00-01 |
