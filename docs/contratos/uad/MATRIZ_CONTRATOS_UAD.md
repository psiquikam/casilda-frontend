# Matriz requisito → UI → contrato → endpoint — UAD Equipos 3 y 4

Estados: `REUTILIZABLE`, `ADAPTACIÓN`, `PARCIAL`, `NO ENCONTRADO`, `NO VERIFICABLE`, `PENDIENTE DE VALIDACIÓN`.
Cuando una fila dice **PROPUESTO**, el endpoint no existe en el backend (ver `AUDITORIA_UAD.md`).
**UI mock** significa que la pantalla funciona con el adaptador mock.

## Entrega 1 (implementada en el frontend)

| Requisito | UI (archivo) | Modelo TS / schema OpenAPI | Endpoint (operationId) | Estado |
|---|---|---|---|---|
| UAD-NOT-01 Bandejas NDI y NDA separadas | `paginas/bandeja-noticias` (pestañas) | `TipoNoticia` | `GET /uad/noticias?tipo=` (`listarNoticias`) | PROPUESTO, UI mock |
| UAD-NOT-02 Consecutivo NDI/NDA asignado por el servidor | Bandeja y cabecera de evaluación | `NoticiaResumen.consecutivo` | (lo genera la radicación, E3) | PROPUESTO |
| UAD-NOT-03 NDI remitida conserva su `casoId` | Escenario `NDI-2026-000144` | `OrigenNoticia.actorRemitente`, `casoId` | `listarNoticias` / `obtenerNoticia` | PROPUESTO, UI mock |
| UAD-NOT-04 NDA sin identidad | Bandeja (fila "No aplica"), evaluación ("Noticia anónima") | `DetalleExpandible`, `reportante: null` | `listarNoticias`, `obtenerNoticia` | PROPUESTO, UI mock |
| UAD-NOT-05/06 Reparto Equipo 3 / Equipo 4 | Filtrado por el servidor (mock) | `dominio/competencia.ts` (solo para simular) | `listarNoticias` | PROPUESTO, UI mock |
| UAD-NOT-07 "No sé" visible a ambos | Fila expandible "visible a ambos equipos" | `clasificada` | `listarNoticias` | PROPUESTO, UI mock |
| UAD-NOT-08 Reclasificación y aviso de revisión simultánea | Evaluación: "Guardar clasificación", chip "En revisión por otra persona", 409 | `ClasificacionRequest/Response`, `RevisionConcurrente`, `version` | `POST /uad/noticias/{id}/clasificacion` (`clasificarVinculacion`) | PROPUESTO, UI mock |
| UAD-NOT-09 NDA visibles a ambos | Pestaña NDA | — | `listarNoticias` | PROPUESTO, UI mock |
| UAD-NOT-10 Columnas de la bandeja | Tabla de la bandeja | `NoticiaResumen` | `listarNoticias` | PROPUESTO, UI mock |
| UAD-NOT-11 Fila expandible sin "Asunto" ni expediente | Fila con teléfono, correo y hechos | `DetalleExpandible` | `listarNoticias` | PROPUESTO, UI mock |
| UAD-NOT-12 Historial de ingreso, estados y responsables | Columna "Historial de actuaciones" | `EventoHistorial` | `GET /uad/noticias/{id}/historial` (`historialNoticia`) | PROPUESTO, UI mock |
| UAD-EVA-01 Detalle de la evaluación | `paginas/evaluacion-noticia` | `NoticiaDetalle` | `GET /uad/noticias/{id}` (`obtenerNoticia`) | PROPUESTO, UI mock |
| UAD-EVA-02 Cuatro decisiones según validaciones | Radios habilitados por `accionesDisponibles` | `TipoDecision`, `AccionNoticia`, `motivosNoDisponible` | `POST /uad/noticias/{id}/decisiones` (`registrarDecisionEvaluacion`) | PROPUESTO, UI mock |
| UAD-EVA-03 Evaluar no crea caso | GET seguro; prueba de página y de mock | — | `obtenerNoticia` | PROPUESTO, UI mock |
| UAD-EVA-04/05 Subsanación sin cierre automático | Subformulario "Solicitar información", tarjeta de solicitud vencida | `SolicitudInformacionDatos`, `SolicitudInformacionVigente` | `registrarDecisionEvaluacion`; respuesta en E3 | PROPUESTO, UI mock (respuesta: NO ENCONTRADO) |
| UAD-EVA-06/07 Casos asociados solo en evaluación | `componentes/casos-asociados` (dentro de "Continuar trámite") | `CasoAsociado` | `GET /uad/noticias/{id}/casos-asociados` (`consultarCasosAsociados`) | PROPUESTO, UI mock |
| UAD-EVA-08 Vincular conserva el ID y el consecutivo | Modo "Sí: vincular" con selección y confirmación | `ContinuarTramiteDatos.modoCaso = VINCULAR_EXISTENTE` | `registrarDecisionEvaluacion` | PROPUESTO, UI mock |
| UAD-EVA-09 No vincular por coincidencia de documento | Casilla obligatoria de "mismos hechos" | `confirmaMismosHechos` | `registrarDecisionEvaluacion` | PROPUESTO, UI mock |
| UAD-EVA-10 Registrar quién consultó o asoció | Evento `CASOS_ASOCIADOS_CONSULTADOS` | `EventoHistorial` | (efecto del servidor) | PROPUESTO, UI mock |
| UAD-EVA-11 Expediente opcional y aviso a la víctima | Campo "(opcional)", estado de notificación en el resultado | `expedienteUad`, `NotificacionEstado` | `registrarDecisionEvaluacion` | PROPUESTO / PENDIENTE DE VALIDACIÓN (correo) |
| UAD-EVA-12 Admisión operativa ≠ inicio jurídico | Textos de la decisión y de la confirmación | — | — | Hecho (UI) |
| UAD-ID-05/06/07 IDs nuevo o conservado; expediente opcional | Cabecera de identificadores; `CONSERVAR_ASIGNADO` | `ModoCaso` | `registrarDecisionEvaluacion` | PROPUESTO, UI mock |
| UAD-REM-01 a 06 Remisión por competencia | Subformulario sin radicado de salida y con justificación opcional | `RemisionCompetenciaDatos` | `registrarDecisionEvaluacion` | PROPUESTO, UI mock |
| Inhibitorio (BIT §8, §16) | Subformulario con aviso de pendiente jurídico | `InhibitorioDatos` | `registrarDecisionEvaluacion` | PENDIENTE DE VALIDACIÓN |
| UAD-PRU-03 / UAD-SEG-08 Descarga autorizada y registrada | Botón "Descargar" (mock entrega archivo sintético) | `EvidenciaMetadato` | `GET /uad/evidencias/{id}/descarga` (`descargarEvidencia`) | PROPUESTO, UI mock |
| Catálogos (causales, entidades, tipos de solicitud) | Selects de la evaluación | `MaestroUad` (= `MaestroDTO`) | `GET /maestros/uad-*` | PROPUESTO (forma REUTILIZABLE) |
| Contexto y competencias del usuario | Panel de simulación, "Acceso restringido" | `ContextoUsuarioUad` | `GET /uad/contexto` (`obtenerContextoUad`) | PROPUESTO, UI mock |

## Entrega 2 (implementada en el frontend)

| Requisito | UI (archivo) | Modelo TS / schema OpenAPI | Endpoint (operationId) | Estado |
|---|---|---|---|---|
| UAD-CAS-01/02 Tercera bandeja con columnas acordadas | `paginas/bandeja-casos` | `CasoUadResumen` | `GET /uad/casos` (`listarCasosUad`) | PROPUESTO, UI mock |
| UAD-CAS-03 Fecha de admisión | Columna y cabecera | `fechaAdmision` | `listarCasosUad`, `obtenerCasoUad` | PROPUESTO, UI mock |
| UAD-CAS-04 a 07 Competencia por fase y equipo | Bandeja filtrada por el servidor | `faseActual`, `equipoResponsable`, `equipoInstructor`, `equipoDecisor` | `listarCasosUad` | PROPUESTO, UI mock |
| UAD-CAS-08 a 10 Traslado instrucción → decisión | Acción permanente "Finalizar etapa de instrucción" con casilla y diálogo | `TrasladoRequest`, `ResultadoAccionCaso.visibleParaUsuario` | `POST /uad/casos/{id}/traslado-decision` (`finalizarInstruccion`) | PROPUESTO, UI mock |
| UAD-CAS-11 "Pliego de cargos" no traslada | Actuación ordinaria; prueba de mock | — | `registrarActuaciones` | PROPUESTO, UI mock |
| UAD-CAS-12 Solo bandejas activas por rol, equipo y fase | Bandeja de casos | `EstadoGestionUad` | `listarCasosUad` | PROPUESTO, UI mock (acceso histórico PENDIENTE) |
| Bitácora §7 Catálogo por fase y equipo | `paginas/gestionar-caso` (casillas) | `ActuacionDisponible`, `CodigoActuacion` | `GET …/actuaciones/catalogo` (`catalogoActuaciones`) | PROPUESTO, UI mock (Mediación PENDIENTE) |
| Bitácora §8 Acciones permanentes siempre visibles | Lista "Acciones permanentes" | `permanente`, `pendienteValidacion` | `catalogoActuaciones` | PROPUESTO, UI mock |
| Bitácora §8 Sin decisiones incompatibles en una confirmación | Ordinarias y permanentes en operaciones separadas | — | `registrarActuaciones` rechaza permanentes | PROPUESTO, UI mock |
| UAD-HIS-01 a 05 Guardar con confirmación; observaciones opcionales | Botón "Guardar actuación" + diálogo | `RegistrarActuacionesRequest` | `POST …/actuaciones` (`registrarActuaciones`) | PROPUESTO, UI mock |
| UAD-HIS-06/07 Traslado y recursos no borran ni cierran | Prueba de mock | — | `finalizarInstruccion`, `registrarActuaciones` | PROPUESTO, UI mock |
| UAD-HIS-08 Historial consultable y auditable | Tabla "Historial de actuaciones" | `EventoHistorial` (+ `RECTIFICACION` reservado) | `GET …/historial` (`historialCaso`) | PROPUESTO / PENDIENTE DE VALIDACIÓN (rectificación) |
| UAD-ID-07 Expediente registrable después | "Registrar" / "Corregir" en la cabecera | `ExpedienteRequest`, evento `EXPEDIENTE_ACTUALIZADO` | `PATCH …/expediente` (`registrarExpedienteUad`) | PROPUESTO, UI mock |
| UAD-PRU-01 a 05 Pruebas del caso | Tabla con descarga; "Cargar prueba" deshabilitado | `EvidenciaMetadato` | `GET …/evidencias` (`evidenciasCaso`), `descargarEvidencia` | PROPUESTO, UI mock; carga PENDIENTE DE VALIDACIÓN |
| UAD-REM-01 a 06 Remisión desde Gestionar caso | Acción permanente con formulario | `RemisionCompetenciaCasoRequest` | `POST …/remisiones-competencia` (`remitirCasoPorCompetencia`) | PROPUESTO, UI mock |
| Inhibitorio, Terminación, Remisión a la Ruta | Visibles y deshabilitadas con motivo | `pendienteValidacion` | — | PENDIENTE DE VALIDACIÓN |

## Entrega 3 (solo contrato inicial)

| Requisito | UI | Schema | Endpoint propuesto | Estado |
|---|---|---|---|---|
| UAD-RUT-01 a 05 Remisión a actor de la Ruta | — | (borrador) | `POST /uad/casos/{id}/remisiones-ruta` | PENDIENTE DE VALIDACIÓN |
| UAD-FOR-01 a 11 Formulario general | Formulario de reporte existente | `ReporteCasoRequest` (real) | `POST /reportes` (real) | ADAPTACIÓN (E3) |
| UAD-FOR-12, UAD-SEG-06 Queja anónima NDA | `/nueva-queja` (prototipo, no conectado) | — | `POST /uad/noticias-anonimas` | NO ENCONTRADO → PROPUESTO (E3) |
| UAD-EVA-04 Respuesta desde "Mis reportes" | No existe "Mis reportes" | — | `POST /reportes/{codigo}/solicitudes-informacion/{id}/respuesta` | NO ENCONTRADO → PROPUESTO (E3) |

## Mapeo contrato → TypeScript → puerto → adaptadores

| Schema OpenAPI | Tipo TS (`contratos/uad-api.types.ts`) | Método del puerto (`UadApiPort`) | HTTP (`UadHttpAdapter`) | Mock (`UadMockAdapter`) |
|---|---|---|---|---|
| `ContextoUsuarioUad` | `ContextoUsuarioUad` | `obtenerContexto()` | `GET /uad/contexto` | Deriva del rol (`AuthService`) o del equipo simulado. |
| `PaginaNoticiaResumen` | `Pagina<NoticiaResumen>` | `listarNoticias(filtro)` | `GET /uad/noticias` | Filtra por equipo, estado, fechas y consecutivo; pagina. |
| `NoticiaDetalle` | `NoticiaDetalle` | `obtenerNoticia(id)` | `GET /uad/noticias/{id}` | Calcula `accionesDisponibles`; 404 si no es visible. |
| `ClasificacionRequest/Response` | ídem | `clasificarVinculacion(id, cuerpo)` | `POST …/clasificacion` | Exige versión vigente; puede quitar la visibilidad. |
| `CasoAsociado[]` | `CasoAsociado[]` | `consultarCasosAsociados(id)` | `GET …/casos-asociados` | Por clave sintética de persona; registra la consulta. |
| `DecisionEvaluacionRequest/Response` | ídem | `registrarDecision(id, cuerpo)` | `POST …/decisiones` | `validarDecision` + efectos + 409. |
| `EventoHistorial[]` | ídem | `historialNoticia(id)` | `GET …/historial` | Append-only en memoria. |
| binario | `Blob` | `descargarEvidencia(id)` | `GET /uad/evidencias/{id}/descarga` | Archivo de texto sintético. |
| `MaestroDTO[]` | `MaestroUad[]` | `catalogo(nombre)` | `GET /maestros/{nombre}` | `CATALOGOS_MOCK`. |
| `PaginaCasoUadResumen` | `Pagina<CasoUadResumen>` | `listarCasos(filtro)` | `GET /uad/casos` | Casos activos del equipo en su fase. |
| `CasoUadDetalle` | `CasoUadDetalle` | `obtenerCaso(id)` | `GET /uad/casos/{id}` | 404 si no es del equipo y la fase del usuario. |
| `ActuacionDisponible[]` | ídem | `catalogoActuaciones(id)` | `GET …/actuaciones/catalogo` | `catalogoParaCaso()` (`dominio/catalogo-actuaciones.ts`). |
| `RegistrarActuacionesRequest` → `ResultadoAccionCaso` | ídem | `registrarActuaciones(id, cuerpo)` | `POST …/actuaciones` | `validarActuaciones()`; un evento por actuación; sin cambio de fase. |
| `EventoHistorial[]` | ídem | `historialCaso(id)` | `GET …/historial` | Append-only en memoria. |
| `EvidenciaMetadato[]` | ídem | `evidenciasCaso(id)` | `GET …/evidencias` | Pruebas copiadas de la noticia al admitir. |
| `ExpedienteRequest` → `ResultadoAccionCaso` | ídem | `registrarExpediente(id, cuerpo)` | `PATCH …/expediente` | Guarda valor anterior y nuevo en el historial. |
| `TrasladoRequest` → `ResultadoAccionCaso` | ídem | `finalizarInstruccion(id, cuerpo)` | `POST …/traslado-decision` | Cambia fase y equipo; `visibleParaUsuario: false` para el instructor. |
| `RemisionCompetenciaCasoRequest` → `ResultadoAccionCaso` | ídem | `remitirCasoPorCompetencia(id, cuerpo)` | `POST …/remisiones-competencia` | Gestión UAD `FINALIZADA`; no envía nada. |
| `ErrorResponse` / `ValidationErrorResponse` | `ErrorResponseUad` → `ErrorUad` | (errores de todos) | `interpretarErrorUad` | Mismo intérprete, desde `HttpErrorResponse` simulado. |
