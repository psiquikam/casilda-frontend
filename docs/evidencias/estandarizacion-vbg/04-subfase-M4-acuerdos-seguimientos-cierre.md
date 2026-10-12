# Subfase M4 — Acuerdos, compromisos, seguimientos y cierre

> **Fecha:** 5 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards`.
> **Diagnóstico de origen:** `docs/evidencias/estandarizacion-vbg/00-diagnostico-y-plan.md`.
> **Subfase anterior:** `03-subfase-M3-identificacion-agresor-apreciaciones.md`.
> **IDs cubiertos:** VBG-07-01…12 · VBG-08-01…13.
> **Regla transversal aplicada:** «Seguimientos» es una sección repetida entre
> `registro-caso` y `registro-atencion` — se extrajo a un componente compartido
> (`SeccionSeguimientosComponent`) en vez de duplicar la plantilla.

---

## El hallazgo que cambió el alcance de esta subfase

El diagnóstico (§ Sección 8) ya advertía que el único bloque «Seguimientos del Caso»
existente usaba un desplegable «Tipo de Seguimiento» con catálogo hardcodeado
(`['Presencial', 'Telefónico', 'Virtual', 'Visita Domiciliaria']`) — **modalidad de
contacto, no especialidad profesional**. Al investigar a fondo antes de tocar código,
confirmé que esto no era un error de nombre: son dos conceptos genuinamente distintos y
ninguno de los dos estaba mal — simplemente faltaba el segundo por completo. La matriz
pide **cuatro módulos independientes por especialidad** (VBG-08-01…04: Jurídico,
Psicojurídico, Psicológico, Psicoorientación), cada uno gestionado de forma aislada
(VBG-08-10). Eso no existía en absoluto; la modalidad de contacto (Presencial/Virtual/…)
es un campo legítimo y distinto que se conservó sin cambios.

Esto implicó restructurar la pestaña completa en vez de solo renombrar un campo, y crear
el modelo de especialidades de las cuentas de prueba PROFESIONAL (P-12) como requisito
previo, porque el aislamiento VBG-08-10 necesita saber «cuál es la especialidad de quien
tiene la sesión activa» antes de poder mostrar nada.

### Bug descubierto al conectar el modal de seguimiento al catálogo

`modal-seguimiento.component.ts` cargaba sus tres catálogos (`tipos-seguimiento`,
`acciones`, `actividades`) con `HttpClient` directo, sin pasar por `MaestrosVbgService`.
En modo de demostración (`environment.datosDemostracion = true`, el modo activo hoy) esto
significa que **los tres desplegables del modal estaban vacíos** — nunca se llamaba al
mock, y la llamada real al backend no tiene respaldo. No se detectó antes porque ninguna
prueba abre el modal end-to-end. Corregido: el modal ahora usa
`MaestrosVbgService.obtenerCatalogo()`, con los mismos tres catálogos servidos desde
`RESPALDO_MAESTROS_VBG` en modo de demostración (patrón ya establecido en M1-M3).

---

## Resultado

### Sección 7 — Acuerdos y Compromisos

| ID | Estado | Evidencia |
|----|--------|-----------|
| VBG-07-01 | **CUMPLE** | «¿Logró llegar a un acuerdo con la persona?» Sí/No, sin cambios. |
| VBG-07-02 / 07-03 (Rutas Internas / Externas como checkboxes) | **CUMPLE (nuevo)** | Antes era un único modal «Activación de ruta» (Tipo + ¿Cuál?); ahora dos grupos de `mat-checkbox` independientes, con las etiquetas literales de `RUTAS_INTERNAS`/`RUTAS_EXTERNAS` (`catalogo-vbg.ts`), servidos vía `MaestrosVbgService`. Verificado en navegador en ambos formularios. |
| VBG-07-04 / 07-05 (Compromisos en bloques separados) | **CUMPLE (preexistente, confirmado)** | `compromisosPersona` y `compromisosProfesional` ya eran arrays independientes (M1). |
| VBG-07-06 (Acuerdos = Sí habilita rutas y compromisos) | **CUMPLE** | `@if (casoForm.get('logroAcuerdo')?.value === 'SI')`. |
| VBG-07-07 («Protocolo de amenazas», no «Ruta de amenazas») | **CUMPLE** | Único nombre en `RUTAS_INTERNAS`, con comentario explícito en el catálogo. |
| VBG-07-08 (grupos separados) | **CUMPLE** | Dos bloques visuales distintos, «Rutas Internas» y «Rutas Externas». |
| VBG-07-09 («Fecha de Cumplimiento», no «Fecha») | **CUMPLE (corregido en esta subfase)** | Encabezado de la tabla de `compromisosPersona` y `compromisosProfesional` en ambos formularios. De paso, se corrigió un bug preexistente en la tabla de `compromisosProfesional`: la columna «Profesional» tenía literalmente el texto «Fecha» como encabezado, y el orden de `*matRowDef` no coincidía con `*matHeaderRowDef` (los datos de Profesional y Compromiso se mostraban intercambiados). |
| VBG-07-10 / 07-11 (múltiples compromisos, bloques separados) | **CUMPLE** | `FormArray`-like (push/splice) en ambos arrays. |
| VBG-07-12 (eliminar «Otros casos y medidas de protección») | **CUMPLE (nuevo)** | Pestaña retirada de ambos formularios. `medidasRegistradas`, `abrirModalMedida`, `eliminarMedida` **se conservan intactos** (regla transversal: no se borran datos), solo se retiró el `case` de guardado (ya no alcanzable por ninguna pestaña) y la plantilla. |

**Corrección adicional — EST-03 (hallazgo del diagnóstico, no un ID de la matriz):**
Antes, poner Acuerdos = `No` **vaciaba** `remisionesRegistrados`, `rutasInternasSel` y
`rutasExternasSel` sin avisar, si ya había datos cargados. Ahora pide confirmación con
`DialogoService.confirmar()`; si se cancela, Acuerdos vuelve a `Sí` y nada se pierde
(decisión provisional del pendiente 13).

### Sección 8 (UI: «Seguimientos») — Seguimientos por Rol

| ID | Estado | Evidencia |
|----|--------|-----------|
| VBG-08-01…04 (cuatro módulos por especialidad) | **CUMPLE (nuevo)** | `SeccionSeguimientosComponent` muestra Jurídico, Psicojurídico, Psicológico y Psicoorientación como bloques independientes (catálogo `ESPECIALIDADES_SEGUIMIENTO`), en ambos formularios. |
| VBG-08-05…08 (Fecha, Acción, Actividad, Descripción) | **CUMPLE** | `modal-seguimiento`, sin cambios de estructura; sí se corrigió su origen de datos (ver hallazgo). |
| VBG-08-09 (eliminar «Trabajo Social») | **CUMPLE (confirmado, sin cambios)** | Ya lo reportaba el diagnóstico: 0 coincidencias. |
| VBG-08-10 (cada especialidad gestiona sus registros de forma aislada) | **CUMPLE (nuevo)** | Solo el bloque cuya especialidad coincide con la de la cuenta activa (P-12) muestra «Agregar seguimiento» y las acciones «Cerrar»/«Eliminar»; los otros tres se marcan «Solo lectura» y no ofrecen ningún control de edición. Verificado en navegador con las 4 cuentas PROFESIONAL. |
| VBG-08-11 (Actividad depende de Acción, se limpia al cambiar) | **CUMPLE** | `seleccionarAccion()` limpia `idactividad`/`actividad` y recarga `actividades` contra `acciones-seguimiento/padre/<codigo>`. Verificado en navegador. |
| VBG-08-12 (cierre autónomo, estado Abierto/Cerrado con motivo) | **CUMPLE (nuevo)** | Botón «Cerrar seguimiento» por fila (solo en el bloque propio), con motivo en texto libre obligatorio (decisión provisional 16) en vez del desplegable catalogado que existía antes (`idestadoseguimiento`/`idmotivoestado`, retirados del modal de creación: esos dos campos exigían un valor desde el momento de crear el seguimiento, lo cual no tiene sentido — un seguimiento nuevo siempre nace «Abierto»). |
| VBG-08-13 (alerta de última activa) | **CUMPLE (nuevo)** | Al confirmar el cierre, si no queda ningún otro seguimiento «Abierto» en el caso (cualquier especialidad), se muestra `DialogoService.confirmar()` con «Eres la última profesional activa en este caso» y los botones «Cerrar el caso» / «Mantener el caso abierto». **En ambos casos el seguimiento individual queda cerrado** (decisión provisional 16); el botón solo decidiría si además se dispara el cierre general, que queda fuera de esta subfase (ver pendientes). |

---

## P-12: especialidades en las cuentas de prueba PROFESIONAL

Antes de implementar VBG-08-10 fue necesario resolver P-12 (decisión provisional ya
documentada, pendiente de ejecutar): el modelo de especialidades **solo en cuentas de
prueba**, nunca en el modelo de roles real.

- `MockUserProfile.especialidad?: 'Jurídico' | 'Psicojurídico' | 'Psicológico' | 'Psicoorientación'`
  en `auth.service.ts`.
- La cuenta `profesional` (Carlos Restrepo, ya usada en los datos de demostración de
  casos) recibe `especialidad: 'Psicojurídico'` — se mantiene su nombre, correo y casos
  asignados, solo se le agrega el campo nuevo.
- Tres cuentas nuevas, una por especialidad restante: `profesional.juridico@udea.edu.co`,
  `profesional.psicologico@udea.edu.co`, `profesional.psicoorientacion@udea.edu.co`
  (contraseña `Pro123*`, igual que la existente).
- `AuthService.getEspecialidadActual()`: resuelve la especialidad de la sesión activa
  buscando por correo en `MOCK_USERS`; devuelve `undefined` fuera de esas cuentas.

### Bug encontrado y corregido en el selector rápido de rol

Al agregar las tres cuentas, encontré que el menú «Cambiar Rol» del header y los botones
de acceso rápido del login invocaban `loginAsMock(mock.roles[0])` — pasando el **código de
rol** (`PROFESIONAL`), no la cuenta específica. Con una sola cuenta `PROFESIONAL` esto
nunca fue un problema; con cuatro, **las cuatro habrían iniciado sesión siempre como la
primera encontrada** (`MOCK_USERS['profesional']`, Carlos Restrepo), sin importar cuál
botón se pulsara. Corregido: ambos puntos ahora pasan `mock.email` (identificador único),
y el estado «activo» del menú se calcula comparando el correo de la sesión, no el rol.
También se agregó la especialidad a la etiqueta visible de cada botón/ítem
(«Profesional · Jurídico», etc.) para que las cuatro cuentas sean distinguibles en la UI,
no solo en el código.

---

## Secciones repetidas: un componente nuevo

- **`SeccionSeguimientosComponent`** (`src/app/components/seccion-seguimientos/`): recibe
  `seguimientos: SeguimientoVbg[]` y lo sincroniza con el padre vía
  `[(seguimientos)]="seguimientosRegistrados"` (two-way binding, mismo patrón de M3).
  Internamente agrupa por especialidad, resuelve el aislamiento contra
  `AuthService.getEspecialidadActual()`, abre `ModalSeguimientosComponent` para crear
  registros y gestiona el cierre con motivo y el aviso de última activa.
- **`ConfirmDialogComponent`** (existente, extendido): se agregaron dos campos opcionales
  a `ConfirmDialogData` — `textoCancelar` (antes fijo en «Cancelar») y `subtitulo` (antes
  fijo en «Esta acción no se puede deshacer», que no aplicaba al aviso de última activa).
  Cambio retrocompatible: ningún llamado existente se vio afectado, todos conservan su
  comportamiento por defecto.

---

## Archivos

**Nuevos**

| Archivo | Qué aporta |
|---|---|
| `components/seccion-seguimientos/*` | Sección compartida de seguimientos (aislamiento + cierre + alerta). |
| `docs/evidencias/estandarizacion-vbg/04-subfase-M4-*.md` | Este reporte. |

**Modificados**

| Archivo | Qué cambió |
|---|---|
| `core/catalogos/catalogo-vbg.ts` | `ESPECIALIDADES_SEGUIMIENTO` (nuevo, VBG-08-01…04). |
| `core/catalogos/respaldo-maestros-vbg.ts` | `especialidades-seguimiento`, `acciones-seguimiento` (raíz + 4 hijos por acción), `tipos-seguimiento` (modalidad, no gobernada por la matriz). |
| `services/auth.service.ts` | `MockUserProfile.especialidad`; 3 cuentas PROFESIONAL nuevas; `getEspecialidadActual()`. |
| `services/solicitud.service.ts` | `SeguimientoAtencionRequestDto`: agrega `especialidad`, `estado`, `motivoCierre`; `idEstadoSeguimiento`/`idMotivoEstadoSeguimiento` pasan a opcionales (decisión provisional 16). |
| `components/modal-seguimiento/*` | Usa `MaestrosVbgService` en vez de `HttpClient` directo; retira `idestadoseguimiento`/`idmotivoestado` y sus dos desplegables (el cierre se gestiona en el componente compartido, no al crear). |
| `components/confirm-dialog/*` | `textoCancelar`, `subtitulo` opcionales en `ConfirmDialogData`. |
| `components/registro-caso/*`, `components/registro-atencion/*` | Tarea #1 (EST-03), #2 (retiro de «Medidas de protección»), #3 (Rutas Internas/Externas), #4 (Fecha de Cumplimiento) y la pestaña «Seguimientos» migrada a `<app-seccion-seguimientos>`; `catalogoSeguimiento`, `tipoSeguimientoSeleccionado`, `abrirModalSeguimientos`, `eliminarSeguimientos` retirados (sin uso tras la migración); `SeguimientoVbg` sustituye a `any[]` en `seguimientosRegistrados` y en `mapearSeguimientoRequest`. |
| `components/layout/header/*` | `cambiarRolMock()` recibe la cuenta completa (antes, el código de rol); nuevo `esCuentaMockActiva()`. |
| `components/auth/login/*` | `loginRapidoMock()` pasa el correo, no el rol; etiqueta del botón incluye la especialidad cuando aplica. |

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run build` | Pasa, sin errores. |
| `npm run test:ci` | **255 de 256.** Único fallo: `PublicHeaderComponent`, preexistente (PR #14, independiente de esta fase). |
| `npm run a11y:audit` | Sin deuda nueva (0 P0, igual que antes de esta subfase). |
| `npm run lint` | **265 de 299** (bajó desde 269 al cierre de M3 — la limpieza de `catalogoSeguimiento`/métodos huérfanos redujo avisos). |
| `npm run check` | `lint` y `a11y:audit` y `build` pasan; `test:ci` detiene la cadena por el único fallo preexistente de `RegisterComponent` (`NG0201`, pendiente #9 de `CLAUDE.md`, de otro PR). `npm run build` por separado confirma que la compilación de producción es correcta. |
| Navegador, 4 cuentas PROFESIONAL, `registro-caso` | Rutas Internas/Externas: los 7+6 ítems literales (incl. «Protocolo de amenazas») renderizan; «Otras» revela «¿Cuál?»; EST-03 pide confirmación al pasar a «No» con datos cargados y revierte a «Sí» si se cancela. Seguimientos: como Jurídico (Andrés Zuluaga), solo esa especialidad permite «Agregar»; las otras tres muestran «Solo lectura»; se agrega un seguimiento (Sesión presencial → Sesión de orientación, catálogo dependiente correcto), se cierra con motivo obligatorio, y al ser el único seguimiento abierto del caso se dispara el aviso de última activa con los dos botones correctos; «Mantener el caso abierto» de todas formas deja el seguimiento en «Cerrado» con su motivo visible. Guardado exitoso en cada paso. |
| Navegador, `registro-atencion` | Mismo recorrido (más liviano, mismo componente compartido ya probado): Tipo de servicio/Lugar de la entrevista, aislamiento de Seguimientos verificado con el mismo resultado (Jurídico editable, las otras tres de solo lectura). |
| Navegador, selector de rol | Las 4 cuentas PROFESIONAL cambian de sesión correctamente de forma independiente (bug de `roles[0]` corregido); el menú «Cambiar Rol» marca como activa solo la cuenta real de la sesión. |

---

## Pendientes para el equipo

1. **Confirmar el alcance real del botón «Cerrar el caso»** del aviso de última activa
   (VBG-08-13). Hoy solo cierra el seguimiento individual, igual que «Mantener el caso
   abierto» (decisión provisional 16); no dispara ningún cierre general del caso porque
   el pendiente original de la matriz pregunta explícitamente «si la ventana emergente
   ejecuta el cierre general o solo lo sugiere» sin resolverlo. Implementar el cierre
   general real requiere decidir primero qué significa «cerrar el caso» en este módulo
   (¿el `idEstadoCaso` de la pestaña «Estado del Caso»? ¿algo más?).
2. **`especialidades-seguimiento`, `acciones-seguimiento` y `tipos-seguimiento` son
   catálogos de demostración** (decisión provisional 15 para Acción→Actividad; P-12 para
   especialidades). Sustituir por los catálogos reales del backend cuando existan,
   siguiendo el mismo patrón de `MaestrosVbgService`.
3. **Tarea de accesibilidad 2.4 (conectar `ResumenErroresComponent`) queda fuera de esta
   subfase.** Se investigó antes de empezar: el formulario usa un mecanismo propio
   (`tabFieldMap`, ~28 campos) para marcar pestañas con error, no `Validators` de
   Reactive Forms (solo 2 usos reales en todo `registro-caso.component.ts`, ambos
   condicionales). Conectar `recolectarErrores()` de forma fiel implicaría o
   re-arquitecturar la validación de esos ~28 campos en ambos formularios, o construir un
   adaptador paralelo — un trabajo del tamaño de una subfase propia, no de una tarea
   dentro de M4. Ya está registrado como pendiente independiente en `CLAUDE.md` §5
   (punto 1 de «Pendiente»); se recomienda tratarlo así, con su propio diagnóstico de
   alcance antes de estimarlo.
4. **Validar con el equipo los nombres de las 4 especialidades** y las 3 cuentas de
   prueba nuevas — son de demostración, con nombres ficticios (Andrés Zuluaga, Mariana
   Vélez, Daniel Ospina) siguiendo el patrón ya usado para los roles existentes.

---

Quedo a la espera de aprobación para continuar con **M5 — Alineación terminológica final,
grupo de atención de solo lectura y cierre de la estandarización**.
