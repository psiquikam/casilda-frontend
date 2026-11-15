# Auditoría UAD Equipos 3 y 4: frontend y backend

**Fecha:** 2026-11-14. **Alcance:** módulo UAD Equipos 3 y 4. El backend se revisó **solo en lectura**.

| Repositorio | Rama | HEAD | Estado al auditar |
|---|---|---|---|
| `casilda-frontend` | `feature/06/20/casilda/modulo-uad` | `fb1070d` | Sin cambios rastreados. Había archivos sin rastrear previos (`.vercel/`, `docs/contratos/contrato-reportar-caso-v2.md`, `perfil_contenidos.md`); no se tocaron. |
| `casilda-backend` | `feature/06/20/casilda/modulo-uad-back` | `08d83a6` | Árbol limpio. No se modificó nada. |

## Fuentes usadas y jerarquía

1. `Bitacora_Maestra_Requisitos_UAD_Casilda.pdf`: requisitos `UAD-*`. Es la fuente de mayor rango.
2. `Catalogo Roles CASILDA.pdf` (propuesta del 11/11/2026): competencias y restricciones, sujeto a validación.
3. `PANTALLAZOS UAD -REQUISITOS.pdf` (11 páginas): prototipos ilustrativos.
4. `requerimientos-frontend-uad-casilda.md` (NotebookLM): material de trabajo, sin rango normativo.

Los cuatro estaban en `Downloads`, no en el workspace. Se leyeron desde allí y no se copiaron a ningún repositorio.

## 1. Backend: conclusión

**No hay módulo UAD.** No existen controladores, servicios, entidades, tablas, enums, migraciones, roles ni rutas UAD. La afirmación de NotebookLM ("no hay controladores UAD") queda **verificada contra el código**.

Lo único relacionado con UAD:

| Hallazgo | Evidencia | Uso posible |
|---|---|---|
| Flag `remitirUad` en el reporte (Boolean + fecha + versión) | `ReporteCaso` (`agresor_remitir_uad*`), `ReporteCasoService`, `ReportePresuntoAgresorRequest.remitirUad` | Es un consentimiento sí/no. **No es** la pregunta de vinculación de UAD-FOR-10 (D-UAD-05). |
| Catálogo `rutaactivacion` con `UAD_3_4` (id 1) | `database/insert_datos_maestros.sql:761` | Punto de entrada natural para crear una NDI al radicar (D-UAD-17). |
| Actividad "Unidad de Asuntos Disciplinarios - UAD" | `update_accion_actividad_dependencia.sql` | Catálogo del Equipo de Atención; no sirve de bandeja. |

### Convenciones reales que adopta el contrato

- **Base:** `/api/v1` (`application.yml`). Spring Boot 3.2.1, Java 21, empaquetado `war`.
- **Sin wrapper:** el DTO va directo en el cuerpo.
- **Errores:** `GlobalExceptionHandler` devuelve `ErrorResponse {timestamp, status, error, message, path}`. Validación = **400** con `validationErrors` (no se usa 422). 409 solo con `DuplicateResourceException`. Sin `ProblemDetail`.
- **Paginación:** `Page<T>` de Spring con `page`/`size`.
- **Concurrencia:** sin `@Version`, sin ETag. Auditoría de columnas vía `Auditable`.
- **OpenAPI:** springdoc genera la spec en tiempo de ejecución (`/api/v1/api-docs`). No hay un archivo de spec versionado.
- **Seguridad:**
  - El JWT solo lleva `sub` (email).
  - Las authorities `ROLE_<CODIGO>` se recargan desde la BD en cada request.
  - La autorización es dinámica: tablas `endpoint` / `endpointrole` (`DynamicEndpointAuthorizationManager`). **Toda ruta no registrada se deniega**, incluso a ADMIN. No hay `@PreAuthorize`.
- **Roles existentes:** 1 ADMIN, 2 COORDINADOR, 3 PROFESIONAL, 4 REVISOR, 5 USUARIO, 6 GESTOR_CONTENIDO (`database/initial_data.sql`). Se crean por SQL (`docs/GUIA_CREACION_ROLES.md`, `crear_rol_con_permisos`).

### Inventario de endpoints para UAD

| Endpoint real | Controlador | Clasificación | Prioridad | Nota |
|---|---|---|---|---|
| `POST /auth/login` | `AuthController` | REUTILIZABLE | Alta | Devuelve `roles` (códigos) y `authorities`. El frontend debe basarse en `roles`, no en el nombre (D-UAD-14). |
| `POST /reportes` (JSON y multipart) | `ReporteCasoController` | ADAPTACIÓN | Alta (E3) | Entrada de la NDI. Falta: crear la noticia cuando `rutaActivacionId = UAD_3_4`, pregunta de vinculación (10 valores), consecutivo NDI y origen "Formulario web Casilda". |
| `GET /maestros/*` (`MaestroDTO`) | `MaestroController` | REUTILIZABLE (patrón) | Media | Los catálogos UAD propuestos siguen esta forma (`/maestros/uad-*`). |
| `GET /maestros/vinculos-udea` | `MaestroController` | ADAPTACIÓN | Alta | 14 valores; no incluye trabajador oficial, directivo, "no tiene vínculo" ni "no sé" (D-UAD-05). |
| `GET /personas/documento/{n}` | `PersonaController` | NO SE DEBE USAR desde la UI UAD | — | La búsqueda de casos asociados la hace el servidor; la UI no compara documentos (UAD-EVA-09). |
| `GET /casos/paginado` | `CasoController` | NO REUTILIZABLE | — | Casos del Equipo de Atención (código `EA…`); no tiene `GET /casos/{id}` ni filtro por persona. |
| `/solicitudes/acompanamiento/**` | `SolicitudController` | NO REUTILIZABLE | — | ⚠️ **Riesgo material:** `USUARIO` lista todas las solicitudes, sin filtrar por dueño (`SolicitudAcompanamientoService.listarTodas/listarPaginadas`). Afecta la base de "Mis reportes" (D-UAD-16). |
| `GET /reportes`, "Mis reportes", descarga de evidencias | — | NO ENCONTRADO | Alta (E3) | No existen. La subsanación (UAD-EVA-04) depende de esto. |
| Notificaciones / correo | — | NO ENCONTRADO | Media | No hay `JavaMailSender` ni servicio de notificación. |
| Historial / auditoría de eventos | — | NO ENCONTRADO | Alta | Solo columnas `Auditable`; no hay tabla de eventos. |
| Todo `/uad/**` | — | **PROPUESTO — NO IMPLEMENTADO** | Alta | Ver `openapi-uad.yaml`. |

### Generación de IDs (D-UAD-15)

- `ReporteCaso.codigo`: `CAS-` + 10 caracteres aleatorios (`ReporteCasoService.generarCodigoDisponible`).
- `Caso.codigo`: `EA` + año + secuencial decreciente sin secuencia de BD (`CasoService.generarCodigoCaso`). Prefijo de actor fijo en "EA" y con riesgo de colisión bajo concurrencia.
- `ReporteCaso` **no está vinculado** a `Caso` ni a `Solicitud`.

Hoy no hay un único "ID de caso Casilda" transversal. El contrato UAD trata `casoId` como una cadena opaca definida por el servidor.

## 2. Frontend: conclusión

- Angular **21.2** standalone, TypeScript **5.9** strict, Material 21, RxJS 7.8, Karma/Jasmine. Node 24.18 según `engines`.
- Patrones reutilizados:
  - `roleGuard`.
  - `DialogoService` y `NotificacionService`.
  - `ResumenErroresComponent` y `cambiosSinGuardarGuard`.
  - Tokens de `_tokens.scss` y utilidades `.boton` / `.casilda-alerta`.
  - El patrón de bandeja de Línea Alma Psicología y el modelo de error y 409 de `alma-error.ts` / `BloqueoOptimista`.

### UAD existente antes de este cambio

| Elemento | Evidencia | Estado |
|---|---|---|
| Sección de menú "UAD Equipos 3 y 4" | `sidebar.component.html`, `horizontal-nav.component.html` | Solo tenía "Registrar queja" (prototipo) y "Seguimiento", detrás de feature flags. |
| `/nueva-queja` | `formulario-queja.component.*`, flag `complaintIntakePrototype` | Prototipo sin backend. No es la NDA de la bitácora (P-UAD-02 sigue NO ENCONTRADO). |
| Pregunta UAD en el reporte | `formulario-anonimo.component.ts`, `reporte-caso.service.ts` (`remitirUad`, `esVinculoComunidadUdea`) | Pregunta sí/no "remitir a UAD", **solo** si el agresor es de la comunidad. Contradice UAD-FOR-10/11: debería ser la pregunta de vinculación con 10 opciones, sin descartar "No sé" (D-UAD-05). |
| Roles UAD en `AuthService` | — | No existían. Además, `normalizarCodigoRol('UAD_COORDINACION')` devolvía `COORDINADOR` por contener "COORD". **Corregido** en este cambio. |
| "Mis reportes" | — | No existe. Hay "Mis solicitudes" (rol USUARIO). |
| Bandejas, evaluación, casos UAD | — | No existían. |

## 3. Tabla de diagnóstico

| Requisito / capacidad | UI existente | Endpoint real | Evidencia | Ajuste / contrato propuesto | Estado |
|---|---|---|---|---|---|
| Roles UAD (catálogo) | No | No | `initial_data.sql` (roles 1–6) | Crear `UAD_COORDINACION/EQUIPO_3/EQUIPO_4` por SQL y registrar rutas en `endpoint` | NO ENCONTRADO |
| P-UAD-01 Activación general → UAD (UAD-FOR-01 a 11) | Formulario de reporte con `remitirUad`; desde la E3, enlace a la queja anónima | `POST /reportes` | `ReporteCasoController`, `reporte-caso.service.ts` | Reemplazar `remitirUad` por vinculación (10 valores) y crear NDI al radicar con ruta UAD | ADAPTACIÓN |
| P-UAD-02 Queja anónima NDA (UAD-FOR-12, SEG-06) | **Sí (E3, mock):** `/uad/queja-anonima`. El prototipo `/nueva-queja` sigue aparte, sin tocar | No | `paginas/queja-anonima/` | `POST /uad/noticias-anonimas` (público, ignora JWT; el front envía sin credenciales) | PROPUESTO + UI MOCK |
| P-UAD-03 Bandejas NDI/NDA (UAD-NOT-01 a 12) | **Sí (nuevo, mock)** | No | `src/app/uad/paginas/bandeja-noticias/` | `GET /uad/noticias` | PROPUESTO + UI MOCK |
| P-UAD-04 Evaluación preliminar (UAD-EVA-01 a 12) | **Sí (nuevo, mock)** | No | `src/app/uad/paginas/evaluacion-noticia/` | `GET /uad/noticias/{id}`, `POST …/decisiones`, `GET …/historial` | PROPUESTO + UI MOCK |
| P-UAD-05 Casos asociados (UAD-EVA-06 a 09) | **Sí (nuevo, mock)** | No | `componentes/casos-asociados/` | `GET /uad/noticias/{id}/casos-asociados` | PROPUESTO + UI MOCK |
| Reclasificación y concurrencia (UAD-NOT-07/08) | **Sí (nuevo, mock)** | No | `POST …/clasificacion`, `version` + 409 | Requiere `@Version` o equivalente en backend | PROPUESTO + UI MOCK |
| Subsanación desde "Mis reportes" (UAD-EVA-04/05) | No ("Mis reportes" no existe) | No | — | `GET /mis-reportes` (borrador) y `POST /reportes/{codigo}/solicitudes-informacion/{id}/respuesta` | NO ENCONTRADO; bloqueado por D-UAD-16 |
| P-UAD-06 Bandeja de casos (UAD-CAS-01 a 12) | **Sí (E2, mock)** | No | `paginas/bandeja-casos/` | `GET /uad/casos` | PROPUESTO + UI MOCK |
| P-UAD-07 Gestionar caso (bitácora §7–8) | **Sí (E2, mock)** | No | `paginas/gestionar-caso/` | `…/actuaciones/catalogo`, `POST …/actuaciones`, `…/traslado-decision`, `…/remisiones-competencia` | PROPUESTO + UI MOCK |
| P-UAD-08 Historial (UAD-HIS-01 a 08) | **Sí (noticia y caso, mock)** | No | `paginas/gestionar-caso/` | `GET /uad/casos/{id}/historial`; rectificación pendiente | PROPUESTO + UI MOCK / PENDIENTE DE VALIDACIÓN (rectificación) |
| P-UAD-09 Pruebas del caso (UAD-PRU-01 a 05) | **Sí (E2, mock): consulta y descarga** | No | `paginas/gestionar-caso/` | `GET /uad/casos/{id}/evidencias`, `GET /uad/evidencias/{id}/descarga`; carga deshabilitada | PROPUESTO + UI MOCK / PENDIENTE DE VALIDACIÓN (carga) |
| P-UAD-10 Remisión por competencia (UAD-REM-01 a 06) | **Sí, en evaluación (mock)** | No | `decisiones` tipo `REMISION_COMPETENCIA` | Sin radicado de salida; sin envío externo | PROPUESTO + UI MOCK |
| P-UAD-11 Remisión a actor de la Ruta (UAD-RUT-01 a 05) | No | No | — | `POST /uad/casos/{id}/remisiones-ruta` (borrador) | PENDIENTE DE VALIDACIÓN |
| Notificaciones (bitácora §13) | Estado simulado en el resultado | No | — | `NotificacionEstado` como efecto del servidor | PENDIENTE DE VALIDACIÓN |
| Auditoría de acciones (UAD-SEG-03) | Historial mock | No | `Auditable` (solo columnas) | Tabla de eventos append-only | NO ENCONTRADO |

## 4. Lo que no se pudo verificar

- **Comportamiento real del QA** (`casildaqa.duckdns.org`): no se hicieron peticiones. La auditoría es de código fuente.
- **Formato exacto de fechas** de los DTO que devuelven `String`, que depende de mappers no revisados: NO VERIFICABLE.
- **Pruebas de integración del backend:** requieren Docker (Testcontainers); no se ejecutaron porque el backend es solo lectura en esta iteración.
