# DECISIONES_PENDIENTES — Módulo UAD Equipos 3 y 4

Cada decisión registra: impacto, fuente, decisión provisional (reversible) y quién valida.
Abreviaturas de quién valida: **DEV** (desarrollo frontend/backend), **JUR** (UAD jurídica), **SEG** (seguridad y privacidad), **PROD** (producto o coordinación del proyecto).

Las fuentes usan siglas:
- **BIT:** bitácora maestra.
- **ROL:** catálogo de roles.
- **PANT:** pantallazos.
- **NLM:** consolidado de NotebookLM.
- **AUD:** `AUDITORIA_UAD.md`.

| ID | Tema | Impacto | Fuente | Decisión provisional reversible | Valida |
|---|---|---|---|---|---|
| **D-UAD-01** | **Backend UAD.** NLM afirmaba que no había controladores UAD. | Alto. | NLM §1; AUD §1; guías del backend | **Resuelta en lo principal (2026-11-19):** el backend implementó las Entregas 1 y 2 y la NDA pública (ver README). Todo está en `main` del backend. Queda: que Backend despliegue y, después, probar el frontend con `'http'`. | DEV |
| **D-UAD-02** | **Anonimato de la NDA.** NLM promete que el frontend "no captura tokens ni IP". | Alto (privacidad). | NLM P-UAD-02; BIT UAD-NOT-04, UAD-SEG-06 | No se promete anonimato técnico desde Angular. Controles esperados: (a) `POST /uad/noticias-anonimas` público, que **ignora** el JWT aunque llegue; (b) el formulario NDA no precarga datos de sesión (UAD-FOR-04); (c) política de retención de IP y logs en Tomcat, proxy y balanceador; (d) la bandeja nunca muestra identidad en NDA. El mock ya cumple (d). | SEG, DEV |
| **D-UAD-03** | **Rol de coordinación, acceso histórico y ADMIN.** NLM deriva visibilidad global para coordinación. | Alto (reserva de expedientes). | ROL §1 y §3 ("la jerarquía no implica acceso irrestricto"); NLM §3 | `UAD_COORDINACION` **sin equipo no ve ninguna bandeja** (contexto con `capacidades: []`, vista "Acceso restringido"). El acceso histórico se modela aparte. ADMIN entra a las rutas por la regla general de `roleGuard`; en mock usa un "equipo simulado". **Con backend real, ADMIN no debería ver expedientes UAD** salvo decisión expresa (ROL §1, nota aclaratoria). | JUR, SEG, PROD |
| **D-UAD-04** | **Datos del solicitante en solicitud directa.** El prototipo dice "todos los campos de esta sección son opcionales". | Medio. | PANT p. 1; BIT UAD-FOR-02/04 | No se asume que la solicitud directa autenticada tenga todo opcional. Directa, indirecta y anónima se tratan como flujos distintos. Queda para la Entrega 3 (formulario transversal). | JUR, PROD |
| **D-UAD-05** | **Vinculación del presunto responsable.** BIT exige una pregunta con 10 opciones al elegir UAD. El backend tiene `VinculoUdeAEnum` (14 valores distintos) y el frontend pregunta `remitirUad` (sí/no) solo si el agresor es de la comunidad. | Alto: de esto depende el reparto entre Equipo 3 y Equipo 4. | BIT UAD-FOR-10/11; AUD §2; `reporte-caso.service.ts` | El contrato usa el enum `VinculacionInvestigado` con los 10 valores de BIT. Pendiente: homologarlo con la tabla `vinculoudea`, decidir si es catálogo o enum y **si es obligatorio** (BIT pide la pregunta, pero no prueba que bloquee). "No tiene vínculo" y "No sé" nunca descartan la noticia. El formulario actual **no se tocó** (Entrega 3). **Backend (provisional):** `UadMapeoVinculacion` traduce `vinculoudea` (14) a la lista UAD (10); egresados, contratistas, jubilados y externos quedan como «No tiene vínculo», y «Otro» o sin dato como «No sé». Trabajador oficial y directivo solo se obtienen al clasificar. | JUR, DEV |
| **D-UAD-06** | **Historial y rectificaciones.** | Medio. | BIT UAD-HIS-02/08, §16 | Append-only lógico: nunca se reescribe un evento. Se reserva el tipo `RECTIFICACION` en `EventoHistorial` para una corrección auditada futura que preserve el original. No se interpreta "inmutable" como prohibición absoluta. | JUR, DEV |
| **D-UAD-07** | **Semántica del contrato.** | Medio. | NLM §5 (DTO JSON); AUD §1 | (a) `POST …/decisiones` responde **200** (acción sobre un recurso existente); solo la radicación NDA responde 201. (b) Se propone el campo `codigo` en `ErrorResponse` (extensión compatible). (c) Concurrencia con `version` en el cuerpo (como Línea Alma); ETag/If-Match es alternativa equivalente. (d) **No** se asume clave de idempotencia. (e) Se corrigieron nombres de NLM: `fechaAdmission` → `fechaAdmision`, enums en un solo idioma y ejemplos sin datos personales. | DEV |
| **D-UAD-08** | **Estados y cierres.** La máquina de NLM es parcial. | Medio. | BIT UAD-EVA-05, §16; PANT p. 2–3 | Estados del contrato: los 7 de PANT p. 2 más `PENDIENTE_CLASIFICACION` (aparece en PANT p. 3, no en BIT) y `EN_REEVALUACION` (BIT). Ninguna transición automática lleva a `EN_REEVALUACION` todavía. Reactivaciones, recursos, inhibitoria posterior a la apertura, terminación y mediación quedan fuera hasta validación. | JUR |
| **D-UAD-09** | **Remisión interna y carga de evidencias.** | Medio. | BIT §10, §12, UAD-RUT | Remisión interna: contrato en **borrador** (`x-estado: PENDIENTE DE VALIDACIÓN`), sin pantalla. Carga de evidencias: **deshabilitada** hasta definir tipos, tamaños, versiones, custodia y permisos; solo hay consulta y descarga autorizada. | JUR, SEG |
| **D-UAD-10** | **Notificaciones.** | Medio. | BIT §13, UAD-SEG-07 | Son un **efecto del servidor**, devuelto como `NotificacionEstado` (PENDIENTE, ENVIADA, FALLIDA o NO_APLICA). El cliente nunca envía un booleano tipo `notificarVictima`. El mock nunca marca ENVIADA. Pendiente: plantillas, contacto autorizado y reintentos. No hay servicio de correo en el backend. | JUR, DEV |
| **D-UAD-11** | **Prototipos frente a bitácora.** | Medio. | PANT p. 2, 3, 5, 6, 8, 11; BIT | Prevalece BIT: (a) `ND-2026-…` → `NDI-`/`NDA-`; (b) el expediente UAD aparece con `*` en p. 5 → **opcional** (UAD-ID-07); (c) p. 5 muestra el ID de caso "generado automáticamente" antes de guardar → el ID **lo asigna el servidor al registrar**; (d) p. 11 muestra a Equipo 3 decidiendo sobre un docente → la decisión sobre docentes es de Equipo 4 (UAD-CAS-05); (e) la columna "Origen" de p. 3 muestra la vinculación → se muestra el origen y la vinculación pasa a la fila expandible; (f) p. 8 dice que la inhibitoria "cierra el reporte en Casilda" → cierra la gestión UAD, **no** el caso institucional (UAD-ID-10). | PROD, JUR |
| **D-UAD-12** | **"No tiene vínculo"**: visibilidad y continuidad. | Medio. | BIT UAD-NOT-07 (solo menciona "No sé") | Se trata como "No sé": visible a ambos equipos. "Continuar trámite" exige una vinculación determinada (estamento concreto), porque de ella depende quién instruye. Con "No tiene vínculo" la UAD puede remitir o decidir inhibitoria. | JUR |
| **D-UAD-13** | **Justificación de la inhibitoria.** | Bajo. | PANT p. 8 (obligatoria); BIT §16 (pendiente) | Obligatoria por ahora (`JUSTIFICACION_INHIBITORIO_OBLIGATORIA = true`), con aviso de "pendiente de validación jurídica". Las causales del mock son las "sugeridas" del prototipo. | JUR |
| **D-UAD-14** | **Nombres y códigos de rol.** El login trae `rol` (nombre) y `roles` (códigos). El catálogo repite "Coordinador/a" en los cuatro actores. | Alto: un coordinador UAD podía recibir permisos del Equipo de Atención en el frontend. | ROL §2; `auth.service.ts` | Se corrigió `normalizarCodigoRol`: los códigos `UAD_*` y los nombres "Equipo 3/4" ya no se confunden con COORDINADOR/PROFESIONAL. Pendiente: que Backend use nombres de rol únicos por actor o que el frontend deje de leer `rol` (nombre) para autorizar. | DEV, SEG |
| **D-UAD-15** | **Formato del "ID de caso Casilda".** Hay dos generadores sin relación (`ReporteCaso` `CAS-XXXXXXXXXX` y `Caso` `EA…`). | Alto: vincular "mismos hechos" exige un ID transversal. | AUD §1 | El contrato trata `casoId` como cadena opaca del servidor y el frontend no valida su formato. El mock usa `CAS-2026-NNNNNN` solo como ejemplo. **Backend:** `CAS-` + 10 caracteres, único entre gestiones UAD; sigue sin existir un ID transversal. | DEV, PROD |
| **D-UAD-16** | **Privacidad en `/solicitudes`.** Un `USUARIO` lista todas las solicitudes. | **Alto, fuera del módulo UAD**, pero es base de "Mis reportes". | AUD §1 (`SolicitudAcompanamientoService`) | **Corregido en la rama del backend (2026-11-19), sin integrar a `main`:** quien no es del equipo de atención solo lee las solicitudes que radicó. Detalle en la sección «D-UAD-16 en detalle». | SEG, DEV |
| **D-UAD-17** | **Nacimiento de la NDI.** | Alto (Entrega 3). | BIT UAD-NOT-02/03; AUD §1 | Propuesta: al crear un reporte con `rutaActivacionId = UAD_3_4`, el servidor crea la noticia con consecutivo NDI propio y origen "Formulario web Casilda". Las remisiones de otros actores crean una NDI conservando su `casoId`. **Backend (más amplio que la propuesta):** crea la NDI si la ruta es `UAD_3_4` **o** si la persona marcó `remitirUad = true`. Validar si la segunda condición es la deseada. | DEV, PROD |
| **D-UAD-18** | **Criterio de "casos asociados".** | Medio. | BIT UAD-EVA-07/09 | El servidor decide la coincidencia (persona identificada) y devuelve datos mínimos. La UI nunca vincula sola; exige selección y confirmación de "mismos hechos". **Backend:** busca por documento de la persona afectada, solo en solicitud directa, entre casos del Equipo de Atención y otras gestiones UAD. | JUR, DEV |
| **D-UAD-19** | **Fecha de remisión.** | Bajo. | BIT UAD-REM-01 | No puede ser futura; por defecto, hoy. En evaluación la fase es siempre "Evaluación preliminar". | JUR |
| **D-UAD-20** | **Qué es "incompatible" en una confirmación.** | Medio. | BIT §8 ("no permitir registrar en una misma confirmación decisiones incompatibles") | Varias actuaciones **ordinarias** de la fase se pueden guardar juntas. Las **permanentes** van por su propia operación, una por vez, y nunca junto con ordinarias. Así la incompatibilidad no se puede dar por construcción. Pendiente: si alguna pareja de ordinarias es incompatible (p. ej. "Fallo" con "Reposición" en el mismo registro). | JUR |
| **D-UAD-21** | **Requisitos para "Finalizar etapa de instrucción".** | Medio. | BIT UAD-CAS-10 ("tras validación de paso a decisión") | Solo se exige fase `INSTRUCCION`, gestión activa, casilla "Confirmo que se validó el paso" y diálogo de confirmación. No se inventan requisitos previos (p. ej. pliego registrado). Si UAD jurídica los define, los valida el servidor y la UI muestra el motivo. | JUR, DEV |
| **D-UAD-22** | **Cierre de la gestión UAD.** | Medio. | BIT §7, §16; UAD-HIS-07 | Hoy solo la remisión por competencia finaliza la gestión (`motivoFinGestion = REMITIDA_POR_COMPETENCIA`). "Fallo" es ordinaria y **no** cierra; "Reposición y/o apelación" tampoco. Inhibitoria posterior, terminación y fallo en firme como motivos de cierre: pendientes. | JUR |
| **D-UAD-23** | **Consulta de casos trasladados o finalizados.** | Medio. | BIT UAD-CAS-12 ("sin impedir acceso histórico autorizado"); ROL §3 | La bandeja muestra solo gestión activa del equipo en su fase. El equipo responsable puede abrir en solo lectura un caso que finalizó con él. El instructor pierde el acceso tras el traslado. El acceso histórico autorizado es una capacidad aparte, por definir con la matriz de permisos. | JUR, SEG |
| **D-UAD-24** | **Mediación.** | Medio. | BIT §7 ("sujeto a procedencia"), §16 | Se muestra en el catálogo de decisión, deshabilitada, con el motivo "pendiente de validación jurídica" (VBG/VS). | JUR |
| **D-UAD-25** | **Corrección del expediente UAD.** | Bajo. | BIT UAD-ID-07, UAD-HIS-08 | Editable mientras la gestión está activa. Cada cambio deja un evento con valor anterior y nuevo; no hay sobrescritura silenciosa. | JUR, DEV |
| **D-UAD-26** | **Seguimiento de una NDA.** | Medio. | BIT UAD-NOT-02 (la consulta en "Mis reportes" es para el reportante identificado); §13 | La NDA no tiene dueño, así que no aparece en "Mis reportes". La confirmación entrega el consecutivo como referencia y dice que la UAD no podrá contactar ni informar el resultado. Una consulta pública por consecutivo exigiría otra decisión de seguridad (enumeración, fuerza bruta). | JUR, SEG |
| **D-UAD-27** | **Evidencias en la NDA.** | Medio. | BIT UAD-FOR-08 (adjuntos en el formulario general), §10 | El formulario NDA no recibe archivos por ahora y lo dice. Los archivos pueden revelar identidad (metadatos EXIF, autoría de PDF), así que antes hay que definir la política de carga y la limpieza de metadatos. | SEG, JUR |
| **D-UAD-28** | **Contacto voluntario en la NDA.** | Bajo. | BIT §13 ("una denuncia anónima sin contacto no permite aviso personal") | No se pide contacto. La frase de la bitácora sugiere que podría ofrecerse uno opcional; queda para decisión de la UAD, porque un contacto convierte la queja en parcialmente identificada. | JUR, PROD |
| **D-UAD-29** | **Abuso del canal público.** | Medio. | Seguridad del endpoint público | El contrato propone 429 por tasa de envíos sin guardar el origen en la noticia. No se agregó captcha: requiere un proveedor externo y su análisis de privacidad. | SEG, DEV |
| **D-UAD-30** | **Peticiones sin credenciales.** | Bajo. | `auth.interceptor.ts` | Nuevo `SIN_CREDENCIALES` (`HttpContextToken`): la petición marcada sale sin `Authorization` y un 401 no cierra la sesión. Es opt-in; el resto de peticiones no cambia. El servidor igual debe ignorar tokens en `POST /uad/noticias-anonimas` (lo hace con `UadSinIdentidad`). | DEV, SEG |
| **D-UAD-31** | **Aviso de revisión simultánea.** El contrato define `revisionConcurrente` (quién tiene abierta la evaluación). | Bajo. | BIT UAD-NOT-08; guía del backend E1 | El backend devuelve siempre `null`: saber quién tiene abierta una noticia exige presencia o bloqueo blando. La protección real es `version` + 409, que sí funciona. El chip «En revisión por otra persona» solo se ve con el mock. | DEV, PROD |
| **D-UAD-32** | **Qué ve el reportante en «Mis reportes».** | Medio (reserva del trámite). | BIT UAD-NOT-02, UAD-EVA-04; ROL §3.e | El backend devuelve código del reporte, consecutivo NDI, un estado en cinco textos («Recibido», «En revisión», «Información adicional solicitada», «En trámite», «Revisión finalizada») y la solicitud de información con su respuesta. No distingue inhibitoria de remisión ni muestra historial, equipo o decisiones. Solo incluye reportes que llegaron a la UAD. El frontend muestra esos datos tal cual y agrega la frase «El trámite es reservado: aquí solo ve su estado general». Pendiente: validar textos y campos, y cómo entran los demás actores de la Ruta. | JUR, PROD |

## D-UAD-16 en detalle

**El problema (verificado en `main` del backend el 2026-11-19):**

- `database/initial_data.sql` da al rol `USUARIO` el permiso `GET /solicitudes/**`.
- `SolicitudAcompanamientoService.listarTodas` y `listarPaginadas` devuelven todas las solicitudes, sin filtrar por quien las creó.
- Resultado: cualquier persona con cuenta puede listar las solicitudes de acompañamiento de las demás. Es un problema de privacidad ajeno a la UAD.

**Corrección hecha en la rama `feature/06/20/casilda/modulo-uad-back` (sin integrar a `main` ni desplegar):**

- Quien no tiene rol del equipo de atención (`ADMIN`, `COORDINADOR`, `PROFESIONAL`, `REVISOR`) solo lista las solicitudes que radicó (`usuarioCreacion`).
- El detalle y los contactos de una solicitud ajena responden 404, igual que una inexistente.
- Efecto a tener en cuenta: una solicitud que el equipo radicó a nombre de una persona no le aparece a esa persona, porque no la creó ella.
- Con pruebas unitarias. La prueba de integración quedó pendiente (requiere Docker).

**Por qué frena «Mis reportes»:** esa vista mostraría a la persona sus reportes y las solicitudes de información de la UAD, con respuesta de texto y evidencias. Si se construye sobre el mismo patrón de listado sin dueño, repite la fuga con datos disciplinarios.

**Lo que ya existe y sirve de base:**

- `ReporteCaso.usuario` guarda quién radicó el reporte (`ReporteCasoService` lo asigna desde la sesión).
- `UadNoticia.reporteCaso` enlaza la noticia con el reporte, y `uad_solicitud_informacion` guarda la solicitud vigente.

Es decir, el filtro por dueño de «Mis reportes» no depende técnicamente de `/solicitudes`: se puede hacer sobre `ReporteCaso.usuario`.

**De qué se depende para cerrar:**

| Qué | Quién | Resultado esperado |
|---|---|---|
| Revisar e integrar a `main` la corrección de `/solicitudes`, con visto bueno de SEG y del equipo de atención | DEV backend | Un `USUARIO` solo ve lo suyo, con prueba de integración. |
| Revisar e integrar «Mis reportes» y la respuesta a la subsanación (ya implementados en la rama) | DEV, PROD | Contrato sin la marca «pendiente de validación». |
| Validar qué ve el reportante de su noticia UAD (D-UAD-32) | JUR, SEG | Textos y campos aprobados. |
| ~~Construir la pantalla «Mis reportes» en el frontend~~ **Hecho con mock (2026-11-20)** | DEV frontend | Falta probarla con `'http'` cuando Backend despliegue, y encender el flag `uadMisReportes` en producción. |
| Política de evidencias en la respuesta (tipos, tamaños, custodia), ligada a D-UAD-09 | JUR, SEG | Límites aprobados; mientras tanto, respuesta solo de texto. |
| Reporte anónimo sin sesión: no tiene dueño y no entra a «Mis reportes» | PROD | Decisión documentada (misma lógica que D-UAD-26). |

## Supuestos reversibles adoptados en la UI (no bloqueantes)

- Pestañas NDI y NDA en la misma vista, con estado en `?tipo=` (sin datos sensibles en la URL).
- El `noticiaId` técnico va en la ruta (`/uad/noticias/:noticiaId`); el consecutivo no se usa como clave. Lo mismo con `casoUadId` en `/uad/casos/:casoUadId`.
- La queja anónima es una ruta pública aparte (`/uad/queja-anonima`), detrás del flag `uadQuejaAnonima`: apagada en producción hasta que exista el endpoint, encendida en desarrollo y en la demo.
- En "Gestionar caso" la fase se muestra, pero no se elige: solo cambia con "Finalizar etapa de instrucción". El prototipo (p. 10–11) la mostraba como lista desplegable.
- Los campos de fecha usan el calendario de Material, que se abre al hacer clic; el valor viaja como `YYYY-MM-DD` local (`fechaContrato()`).
- «Mis reportes» es una ruta propia (`/mis-reportes`), fuera de `/uad`, detrás del flag `uadMisReportes`: apagada en producción hasta que Backend despliegue la Entrega 3.
- En «Mis reportes» la respuesta pide confirmación antes de enviarse, porque no se puede editar después, y no ofrece campo de archivos mientras el servidor los rechace (D-UAD-09).
- Los textos de «Mis reportes» tratan de «usted», como la queja anónima. El estado lo redacta el servidor; la pantalla no lo traduce.
- No se guarda nada en `localStorage` ni `sessionStorage`. El mock vive en memoria y se reinicia al recargar.
- La interfaz deshabilita y explica las acciones según `accionesDisponibles` y `motivosNoDisponible` del servidor. **No es un control de seguridad.**
