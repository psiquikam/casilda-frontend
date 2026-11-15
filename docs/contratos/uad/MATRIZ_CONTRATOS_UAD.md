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

## Entregas 2 y 3 (solo contrato inicial)

| Requisito | UI | Schema | Endpoint propuesto | Estado |
|---|---|---|---|---|
| UAD-CAS-01 a 03 Bandeja de casos | `paginas/bandeja-casos` (solo lectura) | `CasoUadResumen` | `GET /uad/casos` | PROPUESTO (E2), UI mock solo lectura |
| UAD-CAS-04 a 12 Competencia por fase y traslado | — | `FaseUad`, `EquipoUad` | `POST /uad/casos/{id}/traslado-decision` | PROPUESTO (E2) |
| Bitácora §7–8 Gestionar caso | — | `ActuacionDisponible` | `GET …/actuaciones/catalogo`, `POST …/actuaciones` | PROPUESTO (E2) |
| UAD-HIS-01 a 08 Historial del caso | — | `EventoHistorial` (+ `RECTIFICACION`) | `GET /uad/casos/{id}/historial` | PROPUESTO / PENDIENTE DE VALIDACIÓN (rectificación) |
| UAD-ID-07 Expediente registrable después | — | — | `PATCH /uad/casos/{id}/expediente` | PROPUESTO (E2) |
| UAD-PRU-01 a 05 Pruebas del caso | — | `EvidenciaMetadato` | `GET /uad/casos/{id}/evidencias` | PROPUESTO (E2); carga PENDIENTE DE VALIDACIÓN |
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
| `PaginaCasoUadResumen` | `Pagina<CasoUadResumen>` | `listarCasos(filtro)` | `GET /uad/casos` | Casos admitidos en memoria. |
| `ErrorResponse` / `ValidationErrorResponse` | `ErrorResponseUad` → `ErrorUad` | (errores de todos) | `interpretarErrorUad` | Mismo intérprete, desde `HttpErrorResponse` simulado. |
