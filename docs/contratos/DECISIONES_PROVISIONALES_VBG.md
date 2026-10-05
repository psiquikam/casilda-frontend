# Decisiones provisionales — Estandarización VBG

> **Propósito:** cada pendiente de `MATRIZ_MODULO_ATENCION_VBG.md` §7 que no tiene
> definición oficial recibió una decisión provisional para poder implementar y demostrar
> el módulo de punta a punta mientras el equipo confirma la versión definitiva. Ninguna
> decisión aquí reemplaza a la matriz: en cuanto el equipo responda, **se actualiza esta
> tabla y el código correspondiente**, nunca al revés.
>
> Todas están implementadas de forma aislada (catálogo o configuración, nunca quemadas en
> plantilla), precisamente para que revertirlas sea acotado.
>
> **Este documento se entrega al equipo para validación.** Mientras no se confirme cada
> fila, el comportamiento que describe es el vigente en el aplicativo.

---

| # Matriz | Pendiente | Decisión provisional | Dónde está implementada | Cómo se revierte |
|---|---|---|---|---|
| 1 | Numeración de secciones | Encabezados sin número de sección; solo el nombre. | Encabezados de `registro-caso`/`registro-atencion` (M2–M4). | Anteponer el número confirmado a cada `<h2>`/`<h3>` de sección. |
| 2 | Campos de temporalidad | No se crean campos: la matriz no los define. | — (ausencia deliberada, M2). | Añadir los campos cuando la matriz los especifique. |
| 3 | Descripción con VBG = `No` | «Descripción de los Hechos» visible siempre, también con VBG = `No`, para que el registro institucional conserve el relato. | `modal-hechos`: el botón «Agregar Hecho» vive fuera del bloque condicional de VBG en `registro-caso.component.html` (sección «Documentación»), nunca estuvo oculto al elegir `No`; verificado en M2. | Envolver el bloque «Agregar Hecho» en `@if (violenciaGenero === 'SI')` si el equipo decide lo contrario. |
| 4 | «¿Cuál?» en Ámbito y en rutas `Otras` | Campo «¿Cuál?» **opcional** (no obligatorio) al elegir `Otro`/`Otras`. | Ámbito: `ambitoOcurrenciaOtro` en `registro-caso.component.ts`/`.html` (M2, campo de caso, no de `modal-hechos`). Rutas `Otras`: `modal-activar-ruta`, `modal-remision` (M4, pendiente). | Añadir `Validators.required` condicional, como ya existe para el vínculo del agresor (VBG-05-09). |
| 5 | Lugar de Ocurrencia obligatorio | **No obligatorio.** | `lugarHechos` en `registro-caso.component.ts` (campo de caso, Dentro/Fuera/Mixto); nunca llevó `Validators.required`, confirmado en M2. | Añadir `Validators.required` cuando VBG = `Sí`. |
| 7 | Estructura de la relación misional | Dos niveles. Nivel 1 (múltiple): `Misional` · `Actividades Institucionales` · `En representación de la U` · `En bienes inmuebles`. Al marcar `Misional`, nivel 2 **obligatorio** (al menos uno): `Docencia` · `Investigación` · `Extensión`. Códigos persistidos: `misional-docencia`, `misional-investigacion`, `misional-extension`. Etiqueta del campo incluye «Institucionales» (VBG-02-03). | `core/catalogos/catalogo-vbg.ts` → `RELACION_MISIONAL`. Texto del protocolo (incompleto en la matriz) se muestra tal cual, marcado como pendiente de texto completo. | Ajustar la estructura del árbol y los códigos en `RELACION_MISIONAL` si el equipo define otros niveles o valores. |
| 8 | Subcategorías de modalidades distintas a Sexual | Solo **Sexual** tiene subcategorías; Psicológica, Física, Patrimonial, Por prejuicio e Institucional quedan sin subnivel. | `catalogo-vbg.ts` → `MODALIDADES_VIOLENCIA` (sin hijos para esas 5 raíces); `respaldo-maestros-vbg.ts` las deja en `[]`. | Añadir hijos con `padre` apuntando a la raíz correspondiente, cuando la matriz los defina. |
| 9 | Tercer nivel de «Explotación sexual» | Los elementos entre paréntesis son **texto de ayuda**, no opciones seleccionables. | `catalogo-vbg.ts` → campo `ayuda` de la opción `explotacion-sexual`. | Convertir el texto en hijos del árbol (`padre: 'explotacion-sexual'`) si pasan a ser seleccionables. |
| 12 | Obligatoriedad de nombres del agresor | **No obligatorios**: el presunto agresor puede ser desconocido. | Validadores de `modal-presunto-agresor` (M3). | Añadir `Validators.required` a los cuatro campos de nombre. |
| 13 | Rutas con Acuerdos = `No` | Acuerdos = `No` **oculta** rutas y compromisos. Si ya hay registros cargados, se pide confirmación con `DialogoService.confirmar()` antes de limpiarlos; si se cancela, el valor de Acuerdos vuelve a `Sí` (corrige EST-03 del diagnóstico, que los vaciaba sin aviso). | `valueChanges` de `logroAcuerdo` en `registro-caso`/`registro-atencion` (M4). | Cambiar la condición para que las rutas permanezcan visibles con Acuerdos = `No`, si el equipo confirma que no dependen entre sí. |
| 14 | Compromisos de la dupla: ¿múltiples? ¿validación de fecha? | Admite **múltiples** compromisos, igual que el bloque de la persona atendida (por simetría). **Sin** validación de fecha mínima. | `FormArray` de `modal-compromisos-profesionales` (M4). | Añadir `Validators.min`/validador personalizado contra la fecha de la atención, si el equipo confirma la regla. |
| 15 | Catálogo Acción → Actividad | Catálogo simulado mínimo, explícitamente provisional: 4 acciones (`llamada-telefonica`, `sesion-presencial`, `sesion-virtual`, `gestion-documental`) con 2–3 actividades dependientes cada una. | `catalogo-vbg.ts` → `ACCIONES_SEGUIMIENTO`. | Sustituir el arreglo completo cuando el equipo entregue el catálogo oficial; los códigos de acción quedan como claves para no romper lo ya guardado si coinciden. |
| 16 | Motivo de cierre; alcance de la ventana de última activa | Motivo de cierre en **texto libre, obligatorio** al cerrar. La ventana de última profesional activa usa `DialogoService.confirmar()` con las opciones «Cerrar el caso» / «Mantener el caso abierto»; **en ambos casos el seguimiento individual queda cerrado** (la decisión solo afecta si se dispara además el cierre general). | Lógica de cierre de `modal-seguimiento` y del caso (M4). | Cambiar el campo a lista cerrada si el equipo define las opciones; ajustar el efecto de cada botón del diálogo según se confirme el alcance real. |
| 17 | Tabla de decisión del Grupo de Atención | **Solo lectura** (VBG-09-02), **sin cálculo**. Muestra el valor ya asignado al caso simulado, o «Sin calcular» si no tiene uno. | `CasoSimuladoVbg.grupoAtencion: string \| null`; UI de solo lectura en M5. | Implementar la función de cálculo (`variables de entrada → grupo`) en cuanto exista la tabla de decisión completa; seguirá en el backend (R-10 de la matriz), el frontend solo la mostrará. |
| 18 | Tamaño y obligatoriedad del consentimiento | Solo PDF (ya exigido por VBG-00-03), **máximo 10 MB**, **no obligatorio** para guardar. Estado visible: «Consentimiento pendiente» / «Consentimiento cargado». En modo de demostración el archivo queda en memoria, no se envía a ningún lado. | `CasoSimuladoVbg.consentimiento`; validación de tamaño en el control de carga (M2). | Ajustar el límite de tamaño o la obligatoriedad si el equipo confirma otro criterio. |
| P-12 | Modelo de especialidades (Jurídico, Psicojurídico, Psicológico, Psicoorientación) | Modelo provisional **solo en las cuentas de prueba**: cada cuenta `PROFESIONAL` simulada lleva una especialidad asignada. Con eso se implementan las subsecciones 7.1–7.4 y el aislamiento VBG-08-10 (cada profesional opera solo en la suya y ve las demás en solo lectura); el panel aplica el mismo predicado para DSH-08-01. **No se toca el modelo de roles real** fuera de las cuentas de prueba. | `MOCK_USERS` (`auth.service.ts`, M4) + lógica de aislamiento en `modal-seguimiento` y en `AccesosFrecuentesWidget`. | Sustituir el campo de especialidad simulado por el real cuando el backend lo exponga; la lógica de aislamiento no cambia, solo su fuente de datos. |
| P-VBG-01 | ¿El KPI «Compromisos a 7 días» cuenta ambos orígenes? | **Sí**: cuenta compromisos de la persona y de la dupla/profesional por fecha de cumplimiento. Declarado en la definición del indicador. | `DashboardMetricasService` (M5). | Filtrar por `origen` si el equipo pide separarlos. |
| P-VBG-02 | ¿Qué compromisos ve el rol Usuario? | Solo los **de la persona**, bajo el título «Lo que decidiste hacer». | `MiProcesoService` (M5). | Incluir los de la dupla si el equipo decide que aporta transparencia sin confundir. |
| P-VBG-03 | ¿Los indicadores institucionales cuentan VBG = `No`? | **No**: solo cuentan eventos con VBG = `Sí`. Declarado en la definición del indicador. | `DashboardMetricasService` (M5). | Añadir el conteo de VBG = `No` como indicador separado si el equipo lo pide (nunca mezclado con el de VBG = `Sí`). |
| P-VBG-07 | Umbral de «sin registro en los últimos N días» | **15 días**, en una constante documentada como provisional, fuera del widget. | `DashboardTrabajoService` (M5). | Cambiar la constante; no requiere tocar el widget. |

---

## Sin cambios (conservan el comportamiento actual)

| # Matriz | Pendiente | Motivo |
|---|---|---|
| 10 | Estándar de códigos de país (`VNZ` vs. ISO `VEN`) | Se conserva el comportamiento y el ejemplo actuales del catálogo de códigos de país; no se asume un estándar nuevo. |
| 11 | Criterio de «persona extranjera»; cascada Departamento → Municipio | Se conserva el comportamiento actual (sin criterio explícito de extranjería; la cascada ya existente no se modifica). |
