# Subfase M5 — Alineación terminológica y grupo de atención (sección 9)

> **Fecha:** 5 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards`.
> **Diagnóstico de origen:** `docs/evidencias/estandarizacion-vbg/00-diagnostico-y-plan.md`.
> **Subfase anterior:** `04-subfase-M4-acuerdos-seguimientos-cierre.md`.
> **IDs cubiertos:** VBG-09-01, 09-02 · P-VBG-01, 02, 03, 07 · glosario cruzado del §3.
> **Cierra el plan M1–M5 de estandarización del módulo Equipo de Atención** contra
> `docs/contratos/MATRIZ_MODULO_ATENCION_VBG.md`.

---

## El hallazgo que amplió el alcance: «Grupo de atención» no llegaba a ningún lado

El modelo de datos (`CasoSimuladoVbg.grupoAtencion`) ya estaba preparado desde M1 para la
decisión provisional del pendiente 17 («solo lectura, sin cálculo»), con valores de
demostración ya puestos (`'Grupo 2'`, `null`, `'Grupo 5'` en los tres casos `CAS-DEMO-*`).
Pero al investigar antes de tocar código, encontré que ese valor **nunca llegaba a la
plantilla**, por una cadena de tres pérdidas distintas:

1. **`aCitaDto()` y `aCasoDto()`** (`core/vbg/caso-simulado.model.ts`), los mapeadores que
   convierten el modelo interno en los DTOs que de verdad consume el resto de la
   aplicación, no copiaban `grupoAtencion` en absoluto.
2. **`mapearCitaATabla()`** (`registro-caso.component.ts`) y **`mapearCasoATabla()`**
   (`registro-atencion.component.ts`) — los mapeadores de fila de tabla de cada
   formulario — tampoco lo copiaban.
3. Y aun si lo hubieran copiado, la plantilla **no tenía ningún campo que lo mostrara**:
   existía un `FormControl` `grupoAtencion: ['']` editable, pero ningún
   `formControlName="grupoAtencion"` en ningún `.html` — código muerto puro, nunca
   renderizado.

El tooltip de «Estado del caso» agravaba la confusión: describía literalmente la
definición de Grupo de Atención («Clasificación automática... Grupos 1 al 6»), pegado al
campo equivocado.

Corregidas las tres pérdidas y el tooltip, verificado en navegador con los tres casos de
demostración: `CAS-DEMO-0001` muestra «Grupo 2», `CAS-DEMO-0002` muestra «Sin calcular»
(su valor es `null`), ambos de solo lectura.

---

## Resultado

### Sección 9 — Clasificación Automática de Casos

| ID | Estado | Evidencia |
|----|--------|-----------|
| VBG-09-01 (campo de cálculo automático) | **CUMPLE (nuevo)** | Visible en la pestaña «Estado del Caso» de ambos formularios, con su propio campo y tooltip; ya no comparte tooltip con «Estado del caso». |
| VBG-09-02 (no editable) | **CUMPLE (nuevo)** | `<input readonly disabled>`, sin `formControlName`. El `FormControl` editable, su entrada en `tabFieldMap` y la carga del catálogo `grupos-atencion` (nunca usado para nada más) se retiraron de ambos componentes. |

El cálculo en sí sigue bloqueado por el pendiente 17 (tabla de decisión incompleta, ver
`CLAUDE.md` §5 «Pendiente» y la propia decisión provisional): esta subfase solo entrega la
lectura de solo lectura que la matriz exige mientras no exista esa tabla.

### Terminología del rol Usuario (P-VBG-02)

| Punto | Estado | Evidencia |
|---|---|---|
| Título «Lo que acordamos» → «Lo que decidiste hacer» | **CUMPLE** | `panel-usuario.component.html`. El párrafo de apoyo ya decía «decidiste hacer» desde antes de esta subfase; ahora el título coincide. |
| `fechaAcordada` → `fechaCumplimiento` | **CUMPLE** | `CompromisoDto` (`mi-proceso.service.ts`) y su binding en la plantilla. Única ocurrencia de `fechaAcordada` en todo el código; confirmado con búsqueda global antes y después del cambio. |
| Estado vacío de compromisos | **Ajustado** | «Por ahora no hay nada acordado» → «Por ahora no tienes nada pendiente por hacer», mismo tono. |
| Solo compromisos de la persona | **Documentado, sin cambio de comportamiento** | `MiProcesoService` nunca modeló compromisos de la dupla (decisión ya vigente de hecho); se agregó el comentario que declara que es deliberado, por P-VBG-02. |

**No se tocó** «Nos vemos en la próxima sesión que acordamos contigo» (estado del proceso)
ni «Aquí verás tu próxima sesión cuando la acordemos contigo» (próxima cita): ambos usan
«acordar» en el sentido de **programar una cita**, un concepto distinto de la sección 7
de la matriz («Acuerdos y Compromisos»). Cambiarlos no estaba en el alcance de esta
decisión y habría sido una sustitución mecánica de palabra sin sentido semántico.

### KPIs: orígenes y VBG declarados (P-VBG-01 / P-VBG-03)

| Indicador | Decisión | Evidencia |
|---|---|---|
| «Compromisos a 7 días» | P-VBG-01: cuenta persona + dupla/profesional | `dashboard-metricas.service.ts`, `definicion` ahora lo declara explícitamente. |
| «Casos activos», «En recepción», «Casos del equipo» | P-VBG-03: solo VBG = `Sí` | Mismo archivo, cada `definicion` lo declara. |

Ningún valor (`valor: n`) cambió: siguen siendo mock fijo: esta subfase solo documenta la
regla de negocio que ya rige esos números, tal como pide la decisión provisional
(«declarado en la definición del indicador»).

### Umbral de última actividad (P-VBG-07) y unificación del predicado (VBG-08-13)

- **`UMBRAL_DIAS_SIN_REGISTRO = 15`** en `dashboard-trabajo.service.ts`, documentada como
  provisional y sin respaldo normativo confirmado, interpolada en el texto del mock en vez
  de quedar como un «15» suelto.
- **`esUltimaProfesionalActiva()`** (nueva, `core/vbg/ultima-profesional-activa.ts`): única
  función que decide si, al cerrar un seguimiento, queda alguno «Abierto» de cualquier
  especialidad. `SeccionSeguimientosComponent.confirmarCierre()` (M4) la usa en vez de su
  cálculo propio en línea.
- **No se unificó con el dato del panel** (`PendienteDto.ultimaProfesionalActiva`): ese
  campo sigue siendo un valor de mock agregado entre varios casos de demostración
  (`CAS-2026-*`), no calculado desde seguimientos reales — el panel no tiene hoy acceso a
  los seguimientos de un caso concreto. El comentario de la interfaz ahora señala
  explícitamente que es el mismo concepto que `esUltimaProfesionalActiva()`, para que
  quien conecte datos reales en el panel sepa qué función reutilizar en vez de escribir
  una nueva.

### Glosario cruzado del §3 (VBG-05-08, 07-07, 03-07)

**CUMPLE, confirmado sin cambios.** Los tres términos superados por la matriz
(«Administrativos», «Ruta de amenazas», «Sexting» sin calificar) se buscaron en todo
`src/app/` fuera del módulo de atención (navegación, paneles, reportes): **cero
coincidencias** fuera de los comentarios que documentan la propia corrección en
`catalogo-vbg.ts`. No había nada que corregir en esta subfase.

---

## Hallazgo fuera de alcance, reportado y no corregido

Al revisar la navegación para el punto anterior, encontré que `sidebar` y
`horizontal-nav` **no usan `CATALOGO_MODULOS` en absoluto**: duplican a mano cada nombre,
ícono y ruta, y ya no coinciden entre sí ni con `app.routes.ts`:

- «Nueva solicitud» (catálogo) / «Solicitud de acompañamiento» (`title` de la ruta) /
  «Nueva Solicitud» (ambos menús): tres formulaciones para el mismo destino.
- El `sidebar` tiene **dos entradas con el mismo `routerLink="/consulta"`** y el mismo
  ícono (`search`): «Consulta Solicitudes» (sección Equipo de Atención) y «Auditoría de
  Casos» (sección Reportes), esta última sin ninguna entrada en el catálogo.
- «Agenda de citas» (`title` de la ruta) vs. «Citas y Agendamiento» (catálogo y menús).
- El ícono de «Consulta» en ambos menús es `search`; el catálogo documenta
  `manage_search` y declara como regla que dos módulos nunca comparten ícono — regla que
  solo se cumple si algo consume el catálogo.

Esto **no es** el glosario cruzado de términos de la matriz que pedía esta subfase (ese
ya cumplía, ver arriba): es una inconsistencia de navegación general, preexistente,
ajena a la matriz VBG. Corregirla implica decidir cuál de las fuentes (catálogo, rutas,
menús) es la correcta para cada caso, y tocar dos componentes de layout que ningún punto
del plan M1–M5 cubre. Se reporta para que el equipo decida si abrir una tarea aparte.

---

## Archivos

**Nuevos**

| Archivo | Qué aporta |
|---|---|
| `core/vbg/ultima-profesional-activa.ts` | Predicado único de última profesional activa (VBG-08-13), usado por `SeccionSeguimientosComponent`. |
| `docs/evidencias/estandarizacion-vbg/05-subfase-M5-*.md` | Este reporte. |

**Modificados**

| Archivo | Qué cambió |
|---|---|
| `registro-caso.component.ts` / `.html` | Retira `FormControl` `grupoAtencion`, su entrada en `tabFieldMap` y la carga del catálogo `grupos-atencion`; agrega el campo de solo lectura en «Estado del Caso»; corrige el tooltip de «Estado del caso»; `mapearCitaATabla()` ahora copia `grupoAtencion`. |
| `registro-atencion.component.ts` / `.html` | Mismos cuatro cambios; `mapearCasoATabla()` ahora copia `grupoAtencion`. |
| `services/solicitud.service.ts` | `CitaDto.grupoAtencion` y `CasoDto.grupoAtencion` (nuevos, opcionales, documentados). |
| `core/vbg/caso-simulado.model.ts` | `aCitaDto()` y `aCasoDto()` ahora copian `grupoAtencion` del modelo interno al DTO. |
| `services/dashboard-metricas.service.ts` | `definicion` de «Compromisos a 7 días» (P-VBG-01), «Casos activos», «En recepción» y «Casos del equipo» (P-VBG-03) declaran la regla que ya aplicaban. |
| `services/dashboard-trabajo.service.ts` | `UMBRAL_DIAS_SIN_REGISTRO` (P-VBG-07); comentario de `ultimaProfesionalActiva` referencia el predicado único. |
| `services/mi-proceso.service.ts` | `CompromisoDto.fechaAcordada` → `fechaCumplimiento`; comentario sobre P-VBG-02. |
| `components/dashboard-usuario/panel-usuario.component.html` | Título, binding de fecha y estado vacío de la sección de compromisos. |
| `components/dashboard-usuario/panel-usuario.component.spec.ts` | Actualiza la aserción del título al nuevo texto. |
| `components/seccion-seguimientos/seccion-seguimientos.component.ts` | `confirmarCierre()` usa `esUltimaProfesionalActiva()` en vez de su cálculo en línea. |

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run build` | Pasa, sin errores. |
| `npm run test:ci` | **255 de 256.** Único fallo: `PublicHeaderComponent`, preexistente (PR #14, independiente de todo el plan M1–M5). Se corrigió una aserción (`panel-usuario.component.spec.ts`) que esperaba el texto literal anterior. |
| `npm run a11y:audit` | Sin deuda nueva (0 P0). |
| `npm run lint` | **265 de 299**, igual que al cierre de M4. |
| Navegador, `registro-caso`, `CAS-DEMO-0001` (`grupoAtencion: 'Grupo 2'` en el mock) | «Estado del Caso» muestra «Grupo 2» en un campo de solo lectura, separado de «Estado del caso» (editable); guarda sin incluir `grupoAtencion` en el payload (nunca se envió, tampoco antes). |
| Navegador, rol Usuario (Valentina) | «Lo que decidiste hacer» como título; «Lo pensamos para el 10 de octubre» con el campo renombrado; sin cifras, sin jerga. |
| Navegador, panel del rol Profesional | «Compromisos a 7 días» muestra la nueva `definicion` con el origen declarado. |

---

## Pendientes para el equipo

Cierran aquí los pendientes específicos de M5; se mantienen vigentes los que ya
`CLAUDE.md` §5 «Pendiente» venía acumulando de M1 a M4 (en particular: validar con el
equipo de atención los textos del rol Usuario, **P-01** la ausencia de
`casilda-diseno-v1.md`, el pendiente 17 bloqueando el cálculo real de Grupo de Atención,
y el punto 6 de seguridad antes de cualquier despliegue). Se agrega uno nuevo:

1. **Decidir qué hacer con la inconsistencia de navegación** (`sidebar`/`horizontal-nav`
   sin usar `CATALOGO_MODULOS`, tres nombres para «Nueva solicitud», dos entradas para
   `/consulta`) — ver sección de hallazgo fuera de alcance arriba. No es parte de la
   matriz VBG; es una tarea de higiene de navegación aparte.

---

Con esta subfase se cierra el plan **M1–M5** de estandarización del módulo Equipo de
Atención contra la matriz. Queda pendiente, fuera de este plan y ya registrada como tal en
`CLAUDE.md` §5, la tarea 2.4 de accesibilidad (conectar `ResumenErroresComponent`),
diferida en M4 por su tamaño.
