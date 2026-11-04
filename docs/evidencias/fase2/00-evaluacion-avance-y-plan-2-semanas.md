# CASILDA Fase 2 — Evaluación de avance (backend y frontend) y plan de 2 semanas

> **Fecha de corte:** 4 de noviembre de 2026
> **Fuentes de requisitos:** `PLANIFICACIÓN COMPLETA FASE 2` (UI, EA, RF-APH, RF-PSI, LA, HU-01…33) y
> `Requisitos funcionales_SEG_PyB-ago2026` (RF-SPB-001…148, incluye la remisión a la UAD).
> **Código evaluado:** frontend `casilda-frontend` (rama `feature/05/014/casilda/correcciones-equipo-atencion`)
> y backend `casilda-backend` en **`origin/main` (commit `edef9a5`, 4-nov-2026)**.
>
> **Corrección (4-nov):** la primera versión de este documento se hizo sobre el `main` *local* del backend
> (`cc24cec`, 25-oct), que estaba **7 commits atrás**. Se hizo `git fetch` y se revisó lo nuevo: registro de
> usuarios (PRs #9 y #10) y ampliación de solicitudes y reparto (PR #11). Las secciones afectadas están ajustadas.
> **Verificado de nuevo el 4-nov, con ambos repositorios al día:** backend local = `origin/main` (`edef9a5`);
> frontend = `origin/main` (`2ad9d5d`, que solo fusiona el PR #30 de esta misma rama, sin cambios de contenido
> frente a lo evaluado). Los 7 commits nuevos del backend no tocan Línea Alma, Seguridad, UAD, Casos ni Atenciones
> (revisado por la lista de archivos modificados). Este documento refleja ese estado.
> **Método:** lectura de código, rutas, entidades, controladores y scripts SQL de ambos repositorios, contrastada
> con cada requisito. No se ejecutó la aplicación ni se consultó el servidor de QA: *«completo»* significa
> «existe en el código», no «validado por usuarios».
>
> **Estados:** ✅ completo · 🟡 parcial · 🔴 ausente · 🧪 solo maqueta/mock en el frontend.
> **Nota de nombre:** en los requisitos UAD es **Unidad de Asuntos Disciplinarios**, no «Académicos».

---

## 1. Resumen ejecutivo

| Módulo | Backend | Frontend | Lectura general |
|---|---|---|---|
| **Equipo de Atención** | Núcleo completo (solicitudes con hechos/agresor/reparto, citas, casos VBG, atenciones, medidas, maestros) y **registro de usuarios con aceptación de habeas data** (nuevo). Faltan correo, términos versionados, consentimiento con fecha/versión, creación de reportes con código CAS y «mis casos». | Núcleo completo y probado (~35 specs). El **reporte de caso no guarda nada**; faltan consulta de casos en el perfil, «Volver al inicio» global y Home del usuario. | **~70 %.** Lo que falta son los requisitos nuevos de la Fase 2 (UI-01…04, EA-04…06). |
| **Línea Alma** (APH + Psicología) | Un único `RegistroLineaAlma` con atención APH (triage, contactos, remisiones). Sin estados, bandejas, cierre, psicología ni PDF. | Una sola pantalla (`atencion-pr`) con 6 pestañas y 1 spec. | **~20 %.** Existe el registro y el triage; no existe el flujo. |
| **Seguridad a Personas y Bienes** | **Nada.** Solo dos filas de catálogo con ese nombre. | **Nada.** Sin roles, rutas, menú ni servicios. | **0 %.** 148 requisitos sin empezar. |
| **UAD** | **Nada** como módulo (solo catálogos «UAD 3 y 4»). | Menú «UAD Equipos 3 y 4» y un prototipo de queja con datos simulados. | **~5 %.** Solo navegación y captura de la autorización de remisión. |

> Los porcentajes de la última columna son una **estimación cualitativa** del evaluador sobre lo que existe en el
> código frente a los requisitos; no se calcularon con una métrica.

**Tres hallazgos que cambian las prioridades:**

1. 🚨 **Fuga de datos en `GET /solicitudes/acompanamiento` (vigente en `origin/main` del 4-nov).** El rol
   `USUARIO` sigue teniendo permiso `GET /solicitudes/**` (`database/initial_data.sql`, commit `fe1b8d7` solo le
   quitó los demás `POST`), y `SolicitudAcompanamientoService.listarTodas/listarPaginadas` usan `findAll()` /
   consultas por estado, **sin filtrar por quien creó la solicitud**. La entidad sí guarda `usuarioCreacion`, así
   que el dato existe; falta usarlo. En un sistema de VBG es crítico y bloquea la «consulta de casos en el
   perfil». Se verificó leyendo el código, no ejecutando QA: confirmar con una llamada real el día 1.
2. **El reporte de caso no persiste.** `enviarReporte()` genera `CAS-` + 4 dígitos en el navegador y no llama al
   backend. Lo nuevo del PR #11 acerca el backend: `POST /solicitudes/acompanamiento` ya acepta
   `descripcionHechos`, `lugarOcurrencia` y datos del presunto agresor. Pero su código es `SOL-<id>`, no `CAS-`, y
   no recibe lugar interno/externo, campus ni ruta de activación. Hay que decidir si el reporte **reutiliza** ese
   endpoint o crea `POST /reportes` (contrato en `docs/contratos/contrato-reportar-caso.md`, decisión D2).
3. **Sin correo no hay nada de notificaciones.** El backend no tiene `spring-boot-starter-mail`, ni colas, ni
   tabla de notificaciones. Eso bloquea EA-04 y la mitad de Seguridad (alertas al Analista, correos a la víctima
   y al Equipo) y las derivaciones de Línea Alma.

---

## 2. Equipo de Atención

### 2.1 Lo que ya existe

| Capacidad | Backend | Frontend |
|---|---|---|
| Solicitudes de acompañamiento (CRUD, asignar, contactos) | ✅ `SolicitudController` (`/solicitudes/acompanamiento`, `/asignar`, `/contacto`) | ✅ `formulario-acompanamiento`, `consulta`, `gestion-contacto` |
| Citas (listar, reprogramar, cancelar) | ✅ `CitaController` | ✅ `components/cita` |
| Registro de caso VBG (pestañas 0-4) | ✅ `POST /casos/pestana/{0-4}` | ✅ `registro-caso` |
| Registro de atención (pestañas 5-11) | ✅ `POST /atenciones/pestana/{5-11}` | ✅ `registro-atencion` |
| Acuerdos, compromisos, medidas de protección | ✅ `/compromisos`, pestaña 8 | ✅ `modal-compromisos-*`, `modal-remision`, `modal-activar-ruta` |
| Seguimientos aislados por especialidad | 🟡 se borran y recrean en cada guardado | ✅ `seccion-seguimientos` |
| Maestros (~70 GET, CRUD en 5 catálogos) | ✅ `MaestroController` | ✅ `ListasService` + respaldo tipado |
| Contenido del Home (gestor + público) | ✅ `/contenidos`, `/contenidos/home` | ✅ módulo `/gestion-contenidos` |

### 2.2 Requisitos de la Fase 2

| ID | Requisito | Backend | Frontend | Qué falta |
|---|---|---|---|---|
| UI-01 / HU-01 | Home del usuario no funcionario | n/a | 🟡 `panel-usuario` con datos de `/mi-proceso` (mock); no está el trío «Reportar / Consultar / Mi perfil» | Rediseñar el Home con esas tres opciones y datos reales. |
| UI-02 / HU-02 | Reporte de caso autodiligenciable | 🟡 `POST /solicitudes/acompanamiento` (solo `POST` permitido a `USUARIO` desde `fe1b8d7`) acepta hechos, lugar y agresor, pero con código `SOL-<id>` y sin lugar interno/externo, campus ni ruta de activación | 🧪 `enviarReporte()` genera el código en el navegador | Decidir reutilizar ese endpoint o crear `POST /reportes`; código CAS de servidor; integración (ver contrato). |
| UI-03 / HU-03 | Botón «Volver al inicio» en todas las pestañas | n/a | 🟡 solo en login y página «no disponible»; el logo del header lleva a `/inicio` o `/home` | Componente reutilizable en todas las vistas, que lleve al Home según el rol. |
| UI-04 / HU-04 | Consulta de casos en el perfil | 🔴 sin «mis casos»; **el listado no filtra por quien creó la solicitud** (ver hallazgo 1) | 🔴 sin perfil ni lista de casos; `seguimiento-tramite` es mock | Endpoint propio filtrado por la persona autenticada (usando `usuarioCreacion`) + lista y detalle. |
| EA-04 / HU-06, HU-07 | Notificaciones por correo (nuevo caso, recordatorio de cita) | 🔴 sin starter de correo, colas, `@Async`, `@Scheduled` ni tabla `notificacion` | 🔴 | Servicio de correo con cola/reintentos, plantillas, tabla de trazabilidad. |
| EA-05 / HU-08 | Consentimiento informado en el momento de los acuerdos | 🟡 se guarda el PDF (`bytea`) pero **sin fecha, hora ni versión**, sin endpoint de descarga; un base64 inválido se ignora sin error | 🟡 se carga en `registro-caso` (PDF ≤ 10 MB), no en el momento de los acuerdos | Metadatos (fecha/hora/versión/quién), descarga, error explícito ante archivo inválido, carga en el paso de acuerdos. |
| EA-06 / HU-09 | Términos y condiciones con registro de aceptación | 🟡 **nuevo en `main`:** `POST /auth/register` exige `habeasData = true` y guarda `usuario.habeasdata` + `fechahabeasdata` (`AuthService`). **No guarda versión de los términos ni IP**, y el texto no lo sirve la API | 🟡 checkbox `habeasData` en el registro, sin versión | Tablas `terminos` y `aceptacion` (versión, fecha, IP), texto servido por la API; reutilizar el flag ya existente. |
| LA-10 / HU-32 | Etiqueta «Acuerdos y Remisiones» con lista | n/a | 🔴 dice «Remisiones» en los tres módulos | Cambio de etiqueta y lista desplegable acordada. |
| LA-11 / HU-33 | Homologar etiquetas entre Línea Alma y Equipo | 🟡 modelos distintos (`remisionregistroalma` vs `remisionatencion`/`rutaatencion`) | 🟡 comparten maestros y modales; sin verificación de etiquetas | Inventario de etiquetas y unificación. |
| HU-05 | Responsividad | n/a | ⚪ no evaluado | Revisar en la semana de QA. |

### 2.3 Deuda técnica del backend que afecta a este módulo

| Hallazgo | Riesgo | Referencia |
|---|---|---|
| Seguimientos, rutas, remisiones y contactos se **borran y recrean** en cada guardado. | Se pierde el historial: choca con RNF-06 (trazabilidad) y con el principio de auditoría de la matriz. | `AtencionService` |
| Código de caso `EA2026…` con secuencia decreciente calculada leyendo todos los códigos del año. | Condición de carrera y lentitud; además el requisito habla de `CAS-`. Decidir el formato oficial. | `CasoService` |
| No hay `GET` de detalle de caso, ni de seguimientos, rutas o remisiones. | El frontend no puede reconstruir lo guardado sin el listado paginado. | `CasoController`, `AtencionController` |
| Archivos en base64 inválidos se descartan con un `log.warn` y el guardado «tiene éxito». | Pérdida silenciosa de consentimientos. | `AtencionService` |
| Esquema con `ddl-auto: update` + SQL manual; sin Flyway/Liquibase. | Las nuevas tablas de esta fase no quedan versionadas. | `application.yml`, `database/` |
| ~~Ramas sin integrar~~ **Corregido:** registro de usuarios, multirol y auditoría **ya están en `origin/main`**. Solo `fix/clean-gitignore` y `test/pruebasfront` siguen sin integrar. | El único riesgo real es que el `main` local estaba desactualizado. | `git branch -r --no-merged origin/main` |
| El frontend de registro (`auth/register`) llama a `POST /auth/register` y `GET /auth/vinculos-udea`; el backend ahora los tiene. | Falta probar la integración de punta a punta en QA. | `AuthController` |

---

## 3. Línea Alma

El backend tiene `RegistroLineaAlma` + `AtencionAph` (1 a 1), `ContactoLineaAlma`, `RemisionRegistroAlma`,
`ResultadoTriage` y `ProtocoloAph`. El frontend, una sola pantalla `linea-alma/atencion-pr` (6 pestañas).
No existen **estado del registro**, **bandejas**, **cierre**, ni nada de **Psicología**.

| ID | Requisito | Backend | Frontend |
|---|---|---|---|
| RF-APH-01 | Atención de primera respuesta | 🟡 registro de contacto, sin flujo propio | 🟡 pestañas «Registro» y «Datos» |
| RF-APH-02 | Caso con identificador único | 🟡 `id` serial, sin código legible | 🟡 muestra el `id` |
| RF-APH-03 | Bandeja «Entrada pendientes ingreso por remisión» | 🔴 sin estado ni filtros (`GET` devuelve todo) | 🔴 `listarRegistros()` existe en el servicio, sin vista |
| RF-APH-04 | Triage y nota de valoración | ✅ `AtencionAph` (`practicoTriage`, resultado, `notaAph`, `motivoNoTriage`) | ✅ pestaña «Atención APH» (falta «solo lectura para otros roles») |
| RF-APH-05 | Derivación a actores internos | 🟡 solo bandera `requiereRemision`; sin destino, motivo, medio ni estado | 🟡 pestaña «Remision» (tipo, cuál, fecha) |
| RF-APH-06/07 | Rutas externas y su seguimiento | 🔴 `RutaAtencion` pertenece al Equipo de Atención | 🔴 `modal-activar-ruta` solo se usa en Atención |
| RF-APH-08 | Derivar a Psicología | 🟡 solo `aceptaPsicologia`; sin cambio de estado ni bandeja destino | 🟡 campo en la pestaña APH |
| RF-APH-09 | Cierre simple con motivo | 🔴 | 🔴 |
| RF-APH-10/11 | Contención post-cierre y derivación | 🔴 | 🔴 |
| RF-PSI-01 | Bandeja «Pendiente seguimiento psicología» (semáforo, SLA, contador 0/3) | 🔴 | 🔴 |
| RF-PSI-02 | Intentos de contacto (hasta 9, nota independiente, cierre automático) | 🟡 `ContactoLineaAlma` (fecha y resultado); **sin tope de 9** (el tope de 2 es de otro módulo) | 🟡 pestaña «Contacto»; sin teléfono, nota ni cierre automático |
| RF-PSI-03…08 | Primer contacto efectivo, consentimiento verbal, valoración de riesgo, agresor, derivaciones, rutas | 🔴 | 🔴 |
| RF-PSI-09 | Seguimientos (3 o más) con contador y fecha próxima | 🔴 (`SeguimientoAtencion` cuelga de la atención del Equipo) | 🔴 |
| RF-PSI-10/11 | Contención post-cierre y cierre del caso | 🔴 | 🔴 |
| RF-PSI-12 | PDF de la atención | 🔴 sin librería PDF ni almacenamiento externo | 🔴 |
| LA-09 | «Guardar» como borrador | 🟡 cada pestaña persiste por separado; sin estado de borrador | 🟡 botón «Guardar» por pestaña |
| LA-10, LA-11 | Etiqueta «Acuerdos y Remisiones»; homologación de variables | ver §2.2 | ver §2.2 |

**Decisión de modelo pendiente (bloquea el diseño):** los requisitos esperan roles `APH` y `PSICOLOGO`. Hoy
existen 6 roles y ninguno lo es. Opciones: **(a)** roles nuevos (el backend permite crearlos por datos:
`docs/GUIA_CREACION_ROLES.md`) o **(b)** reutilizar `PROFESIONAL` con especialidad. El login **no devuelve la
especialidad** (pendiente 13 de `CLAUDE.md`), por lo que (a) es más simple.

---

## 4. Seguridad a Personas y Bienes (RF-SPB)

**Estado: no iniciado en ninguna capa.** Búsquedas de `seguridad`, `vigilan`, `monitoreo`, `analista`, `camara`,
`qr`, `novedad`, `consecutivo` y `orden de acompañamiento` solo encuentran dos filas de catálogo
(`rutaactivacion` id 5 y `actividad` id 4). No hay roles, entidades, endpoints, rutas, menú ni specs.

| Grupo | Requisitos | Backend | Frontend | Dependencias externas al módulo |
|---|---|---|---|---|
| Roles y acceso restringido (QR/enlace, identificación del supervisor) | 001-009 | 🔴 | 🔴 | Roles nuevos; mecanismo de token por orden |
| Recepción y tipos de registro (PQRS, alertas, novedades, informes), consecutivo propio | 010-024 | 🔴 | 🔴 | — |
| Consentimiento y voluntad de la víctima | 025-029 | 🔴 | 🔴 | Reusa el patrón de consentimiento de EA-05 |
| Informes de supervisores, clasificación, vinculación y reparto del Analista | 030-046 | 🔴 | 🔴 | **`GET` de detalle de caso** (hoy no existe) para vincular |
| Relación con el Equipo de Atención y medidas de protección | 047-056 | 🔴 | 🔴 | Correo, bandeja |
| Orden de acompañamiento e informe de acompañamiento | 057-078 | 🔴 | 🔴 | QR/enlace restringido |
| Cámaras y evidencia audiovisual (solo trazabilidad) | 079-084, 101-105 | 🔴 | 🔴 | — |
| Remisión a la UAD y requerimientos posteriores | 085-095 | 🔴 | 🔴 | **Módulo UAD** (§5) |
| Remisiones y orientaciones externas | 096-100 | 🔴 (las rutas de EA no sirven: son de la atención) | 🔴 | — |
| Bandeja del Analista | 106-110 | 🔴 | 🔴 | — |
| Alertas y notificaciones (Analista, Equipo, víctima) | 111-129 | 🔴 | 🔴 | **Servicio de correo + tabla de notificaciones** |
| Trazabilidad, confidencialidad e indicadores | 130-148 | 🟡 solo `Auditable` genérico; sin historial de cambios | 🔴 | Historial/versionado; el `/vigilancia/*` actual es otro tema |

**Reglas de negocio que condicionan el diseño** (del propio documento): persona ≠ caso ≠ actuación; no vincular
automáticamente por cédula (RF-039); el vigilante **no consulta** expedientes (RF-008, 137); el correo no lleva
información sensible (RF-114, 124, 138); CASILDA **no almacena** los videos (RF-082, 105).

---

## 5. UAD — Unidad de Asuntos Disciplinarios

| Elemento | Backend | Frontend |
|---|---|---|
| Módulo propio (recibido, radicado, estado, requerimientos, citación de testigos) | 🔴 solo catálogos («UAD 3 y 4»; actividad «UAD») | 🔴 |
| Rol UAD | 🔴 | 🔴 (`ROLES_CASILDA` no lo conoce; el panel lo deja «fuera a propósito») |
| Menú «UAD Equipos 3 y 4» / «Ruta Violeta» | n/a | 🧪 agrupaciones de menú; «Ruta Violeta» enlaza a `/seguimiento` |
| «Registrar queja» (`/nueva-queja`) | 🔴 (`QuejaRequest` sin controlador) | 🧪 `formulario-queja`, sin llamada HTTP, tras flag |
| «Seguimiento» (`/seguimiento`) | 🔴 | 🧪 `simularResultado()` |
| Captura de «Autorizo remitir a la UAD» | 🟡 | 🟡 en `formulario-acompanamiento` y `modal-detalle-solicitud` |
| Remisión desde Seguridad (RF-SPB-085…095) | 🔴 | 🔴 |

Nota: el documento de Seguridad dice «cuando se implemente el módulo de la UAD». **No existe un documento de
requisitos de la UAD** entre los dos entregados; los de Seguridad solo definen la interfaz (consecutivo de recibido,
radicado, requerimientos). El módulo UAD completo necesita su propio levantamiento.

---

## 6. Transversales

| Aspecto | Estado | Comentario |
|---|---|---|
| Correo / notificaciones | 🔴 | Bloquea EA-04, derivaciones de APH/Psicología y RF-SPB-111…129. **Es la primera pieza de infraestructura.** |
| PDF de notas | 🔴 | Solo RF-PSI-12 / HU-30. Sin librería ni almacenamiento externo (existe un script de sync a S3, sin cliente Java). |
| Roles de la Fase 2 | 🔴 | Faltan APH, Psicólogo, Analista de Riesgos, Central de Monitoreo, Supervisor/Vigilante, UAD. Crear roles es por datos (`endpoint` + `endpointrole`). |
| Auditoría (RNF-06) | 🟡 | Campos `createdAt/By`, `modifiedAt/By` en 102 entidades; **sin historial** de cambios ni lecturas. |
| Pruebas | 🟡 | Backend (`origin/main`, conteo de `@Test` del 4-nov): 82 métodos en 25 clases, con pruebas nuevas de registro de usuarios y de actualización/reparto de solicitudes; **sin tests de servicio** de Caso/Atención/Línea Alma. Frontend: ~85 specs, pero Línea Alma 1, Seguridad 0, UAD 1. La DoD pide cobertura ≥ 80 %. |
| Migraciones | 🔴 | Sin Flyway/Liquibase. |
| Documento de planificación vs. realidad | ⚠️ | La planificación asume **React + Node/Spring + S3 + RabbitMQ**; el proyecto real es **Angular 21 + Spring Boot + PostgreSQL**, sin colas ni S3. Conviene actualizar la arquitectura del documento. |

---

## 7. Cuánto falta, en números

Con los *story points* del propio documento de planificación (solo historias cuyo estado es ausente o parcial; los
parciales cuentan completos, así que es una cota superior):

| Bloque | Historias | SP aprox. |
|---|---|---|
| Equipo de Atención / experiencia de usuario | HU-01…04, 06…09, 32, 33 | **≈ 56** |
| Línea Alma — APH | HU-10…18 | ≈ 58 |
| Línea Alma — Psicología | HU-19…30 | ≈ 62 |
| Seguridad PyB (148 RF) y UAD | sin estimar en la planificación | sin dato |

La velocidad estimada del propio plan es **42,5 SP por sprint** de 2 semanas (capacidad real 56 SP con 4 personas).
**Conclusión: en 2 semanas cabe un sprint, y solo Equipo de Atención ya lo llena.** Cerrar *todo* lo anterior en
ese plazo no es realista con ese equipo; el plan de abajo es el máximo defendible y deja explícito qué se
queda fuera. Los puntos son los del documento original, no una reestimación.

---

## 8. Plan de 2 semanas (10 días hábiles)

**Supuestos:** equipo de 4 desarrollos (1 frontend, 1 backend, 1 full stack, 1 UX/UI) según la planificación; si
el equipo real es otro, los días se escalan. Prioridad: **1) cerrar Equipo de Atención**, 2) base de Línea Alma,
3) cimientos de Seguridad/UAD. Las tareas de infraestructura (correo, roles) se hacen **una sola vez** y
las usan los tres módulos.

### Día 0-1 — Desbloqueos (medio día, todo el equipo)

| # | Acción | Por qué |
|---|---|---|
| 0.1 | **Confirmar con una llamada real y cerrar la fuga** de `GET /solicitudes/acompanamiento` (y `/{id}`, `/paginado`) para `USUARIO`: filtrar por `usuarioCreacion` del usuario autenticado. | Seguridad de datos de VBG; precondición de UI-04. |
| 0.2 | Responder **D1…D7** del contrato `contrato-reportar-caso.md`, incluida la nueva opción de reutilizar `POST /solicitudes/acompanamiento`. | Sin esto no se puede integrar el reporte. |
| 0.3 | Hacer `git pull` del backend local (7 commits atrás) y desplegar `origin/main` en QA; ejecutar `update_schema_registro_usuario.sql` y `update_schema_solicitudes_reparto.sql` donde falten. | Las pruebas del día 2 en adelante dependen de lo nuevo. |
| 0.4 | Decidir roles nuevos (APH, Psicólogo, Analista de Riesgos, Central de Monitoreo, Supervisor, UAD) y formato del código de caso (`EA…` vs `CAS-`). | Todos los módulos los usan. |

### Semana 1 — Equipo de Atención completo

| Día | Backend | Frontend | Resultado |
|---|---|---|---|
| **1-2** | Creación de reportes con código CAS de servidor (único, `UNIQUE`, no adivinable) según D2 + `GET /maestros/rutas-activacion`; filtro por `usuarioCreacion` y «mis casos»; `GET /casos/{id}` | `ReporteCasoService` y mapeo del formulario → DTO; manejo de `validationErrors` por campo; componente **«Volver al inicio»** reutilizable (HU-03) en todas las vistas | UI-02 y UI-03 cerrados |
| **2-3** | Tablas `terminos_condiciones` + `aceptacion_terminos` (versión, fecha, IP; migrar el flag `habeasdata` existente); metadatos del consentimiento (fecha, hora, versión, quién) y `GET` de descarga; error explícito ante base64 inválido | Texto de términos servido por la API en el registro; carga de consentimiento en el paso de acuerdos | EA-05 y EA-06 cerrados |
| **3-4** | `spring-boot-starter-mail`, servicio de correo **asíncrono** con reintentos y tabla `notificacion` (destinatario, tipo, evento, estado); plantillas «caso creado» (usuario + funcionario) | Home del usuario con «Reportar caso / Consultar caso / Mi perfil» (UI-01) | EA-04 (nuevo caso) cerrado; infraestructura de correo lista para todos los módulos |
| **4-5** | `@Scheduled` de recordatorio de cita 24 h antes (HU-07); dejar de borrar y recrear seguimientos (actualizar por `id` y conservar historial) | **Consulta de casos en el perfil** (lista + detalle) (UI-04); etiqueta «Acuerdos y Remisiones» con lista (LA-10); inventario de etiquetas Línea Alma ↔ Equipo (LA-11) | UI-01, UI-04, LA-10/11 y HU-07 cerrados |
| **5** | Pruebas de servicio de Caso/Atención/Solicitud; documentar en OpenAPI | Specs de `ReporteCasoService`, perfil, términos; barrido de accesibilidad de las vistas nuevas | **Hito 1: Equipo de Atención en QA** |

### Semana 2 — Línea Alma (flujo base) + cimientos de Seguridad/UAD

| Día | Backend | Frontend | Resultado |
|---|---|---|---|
| **6** | **Estado** del registro de Línea Alma (borrador, abierto, derivado, cerrado) y código legible; roles APH y Psicólogo; `GET` filtrable por estado | Guardar como **borrador** (LA-09); etiquetas homologadas | LA-09, RF-APH-02 |
| **7** | Bandeja APH «pendientes por remisión» (RF-APH-03); **cierre simple con motivo** (RF-APH-09); derivación a Psicología con cambio de estado (RF-APH-08) | Bandeja APH; acción «Cerrar caso» y «Derivar a Psicología» | HU-11, HU-15, HU-16 |
| **8** | Bandeja de Psicología con semáforo por triage y contador 0/3 (RF-PSI-01); **tope de 9 intentos** y cierre automático «No contacto» (RF-PSI-02) | Bandeja Psicología; intentos con teléfono y nota | HU-19, HU-20 |
| **9** | **Seguridad — cimientos:** roles (Analista, Central, Supervisor, UAD) y permisos; entidad base de reporte de Seguridad con **consecutivo propio**; `POST` de informe/novedad y **bandeja del Analista** (listar y ver) con alerta por correo (reusa la infraestructura del día 3-4) | Rutas y menú por rol; formulario de informe/novedad; bandeja del Analista (solo lectura y estados) | RF-SPB-001/002/017-020/032/106-108 y 111-113 en versión mínima |
| **10** | Regresión, corrección de errores, datos semilla en QA, **UAT con el equipo de atención**; actualizar `CLAUDE.md` y contratos | Mismo | **Hito 2: Línea Alma base + cimientos de Seguridad en QA** |

### Qué queda dentro y fuera de las 2 semanas

| Dentro (comprometible) | Fuera (siguiente sprint en adelante) |
|---|---|
| Equipo de Atención: UI-01…04, EA-04 (caso nuevo y recordatorio), EA-05, EA-06, LA-10, LA-11, corrección de seguridad y de historial | EA-04 para las demás notificaciones (derivaciones, rutas) |
| Línea Alma: estados, borrador, bandejas APH/Psicología, cierre simple, derivación a Psicología, intentos (tope 9) | Derivación interna completa, rutas externas y su seguimiento (RF-APH-05…07), post-cierre (RF-APH-10/11, RF-PSI-10), primer contacto, consentimiento verbal, valoración de riesgo, agresor, seguimientos con contador, cierre de Psicología, **PDF** (RF-PSI-03…12) |
| Seguridad: roles, consecutivo, informe/novedad, bandeja del Analista con alerta | Vinculación a casos, órdenes y QR, medidas de protección, cámaras, plantillas de correo a la víctima, indicadores (casi todo RF-SPB) |
| UAD: rol y permisos | Todo el módulo (recibido, radicado, requerimientos, testigos) — requiere levantamiento propio |

**Orden recomendado de los siguientes sprints** (para que el equipo vea el camino completo): Sprint 2 →
Psicología completa + PDF; Sprint 3 → Seguridad (vinculación, órdenes con QR, medidas, notificaciones); Sprint 4 →
UAD + requerimientos + indicadores y UAT final.

---

## 9. Riesgos del plan y cómo mitigarlos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El equipo real es menor al supuesto | Alto: el plan de la semana 2 es el primero en caer | Mantener intactas las prioridades 1-2 (Equipo de Atención y base de Línea Alma); Seguridad es la que se recorta. |
| Las decisiones D1…D7 y de roles no llegan el día 1 | Alto: bloquean reporte, bandejas y Seguridad | Reunión de 1 hora el día 1 con el Product Owner; registrar las respuestas por escrito. |
| El servicio de correo (SMTP/SES) no está disponible en QA | Medio: bloquea EA-04 y alertas | Pedir credenciales el día 0; trabajar con un servidor SMTP de pruebas y la tabla de trazabilidad en estado `PENDIENTE`. |
| La fuga de datos es real y hay solicitudes ya expuestas | Alto | Corregir primero; evaluar con el equipo de privacidad si corresponde un aviso. |
| Repositorios locales desactualizados respecto a `origin/main` | Medio: se evalúa y se trabaja sobre código viejo (ya pasó con este documento) | `git fetch` + `pull` al inicio de cada día; el plan se rehace si `main` cambia. |
| Esquema con `ddl-auto: update` sin migraciones | Medio: tablas nuevas sin versionar y sin reversa | Entregar cada tabla nueva como script SQL en `database/` desde esta fase. |
| Cobertura de pruebas baja en Línea Alma y Seguridad | Medio | Cada historia cierra con su spec; Seguridad/UAD no se promueven a producción sin ello. |

---

## 10. Decisiones que necesitamos del equipo / Product Owner

1. ¿Roles nuevos (APH, Psicólogo, etc.) o `PROFESIONAL` con especialidad? (§3)
2. ¿Formato oficial del código de caso: `CAS-…` o el actual `EA…`? (§2.3)
3. ¿Quién proporciona el levantamiento de requisitos de la UAD? (§5)
4. ¿El equipo real coincide con los 4 perfiles de la planificación?
5. Respuestas D1…D7 de `docs/contratos/contrato-reportar-caso.md`.
6. ¿Se descartan o se integran las dos ramas del backend que siguen fuera de `main` (`fix/clean-gitignore`, `test/pruebasfront`)?
7. ¿Qué proveedor de correo se usará en QA y producción?
