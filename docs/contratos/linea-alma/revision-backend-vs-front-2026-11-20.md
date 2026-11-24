# Línea Alma — Backend vs. Frontend: qué falta y qué hay que corregir

> **Para:** equipo de Backend de CASILDA (con copia al equipo de Frontend)
> **De:** equipo de Frontend (`casilda-frontend`)
> **Fecha:** 20 de noviembre de 2026 · **Actualizada el 24 de noviembre de 2026** (ver §0; lo que debe hacer Backend, en el §0.5)
> **Base de la revisión:** `origin/main` del backend (`a419262`, incluye `feature/linea-alma-aph-backend`) contra
> `src/app/linea-alma/` del front. Revisión **estática** (código y SQL); no se ejecutó nada contra QA.
> **Contratos de referencia:** `docs/contratos/linea-alma/` (APH y Psicología, decisiones D-ALMA-01…13 y D-PSI-01…19).

Esta revisión se repite cuando cambia el backend. **La del 24 de noviembre está en el §0**; los §1 a §4 conservan el texto del 20 de noviembre
y el estado vigente de cada ítem está en el §5.

---

## 0. Actualización del 24 de noviembre de 2026

**Qué se revisó** (estático, nada se ejecutó contra QA):

| Fuente | Estado | Qué trae para Línea Alma |
|---|---|---|
| `origin/main` (`89f11ea`, 23 nov.) | Integrado | Desde `a419262` solo suma UAD Entrega 3 y el filtro de `/solicitudes` por rol. **Línea Alma no cambió en `main`**: B-1…B-6 siguen como el 20 de nov. |
| `origin/feat/psicologia-bandeja-novedades` (`d8ae962`, 23 nov., Yonatan Sierra) | **Sin PR a `main`** | Psicología: bandeja con datos reales, tomar y liberar, detalle de la novedad, intentos de contacto, notificaciones y **primer contacto**. Además **separa nombres y apellidos** en la atención. 6 commits, con pruebas de integración. |
| `origin/feature/equipo-atencion-persistencia` | Fuera de alcance | Reparto de solicitudes y citas del Equipo de Atención; no toca `/alma`. |

### 0.1 Lo que la rama de Psicología resuelve (respecto del §3)

| # | Estado el 24 nov. | Detalle verificado en el código |
|---|---|---|
| P-1 tomar y liberar | **Hecho en la rama** | `POST /alma/bandeja/psicologia/{id}/tomar` y `/liberar`. Roles `ADMIN`, `COORDINADOR`, `PROFESIONAL`. La bandeja ya devuelve `tomadaPor`, `tomadaPorMi` e `intentosRealizados` reales. |
| P-2 detalle de la novedad | **Hecho en la rama** | `GET /alma/psicologia/novedades/{id}`; lectura también para `REVISOR`. Devuelve `gestionSimultanea: false`. |
| P-3 intentos de contacto | **Hecho en la rama** | `GET`/`POST .../intentos`. Máximo 9 (`422 INTENTOS_AGOTADOS`), nota mínima de 5 y justificación mínima de 10 desde el 4.º; cierra por `NO_CONTACTO` al agotar. Errores `NOVEDAD_NO_ENCONTRADA`, `NOVEDAD_CERRADA`, `NOVEDAD_NO_TOMADA`, `CONFLICTO_VERSION`. |
| P-4 primer contacto | **Hecho en la rama** | `POST .../novedades/{id}/primer-contacto` → `201 { numeroCaso, idAtencion, version, estadoAtencion, vinculado }`, igual que el DTO del front. Valida `valoracionRiesgo {nivel, descripcion}`, `acuerdos` (10–2000), `proximoControl` futuro y dimensiones activas. Detecta caso activo (`vincularA`). |
| P-10 notificaciones | **Hecho en la rama** | `GET /alma/psicologia/notificaciones`. |
| P-12 catálogos | **Parcial** | Nuevos: `resultados-intento` (7), `dimensiones-salud-mental` (provisional `DIM_01…DIM_15`, «Dimensión 1…15») y `vinculos-agresor` (8). **Falta** `motivos-cierre-psicologia`. |
| P-5, P-6, P-7, P-8, P-9, P-11 | **Sin empezar** | No hay en la rama: expediente del caso, seguimientos, cierre y PDF, agenda, recontactos ni telepsiquiatría. |

Además, en esa rama `numeroCaso` **ya se calcula** en la respuesta de la atención (cuando está `ABIERTO_ACTIVO` o `EN_SEGUIMIENTO`): la mitad de **B-3**.
`gestionSimultanea` sigue en `null` en `AtencionAlmaService` (en la novedad de Psicología es `false` fijo).

### 0.2 Lo que cambió y **rompe** el contrato con el front

El backend valida cada cuerpo con una lista cerrada de campos: cualquier campo que no conozca responde `400` con «Campo no permitido» (`comprobarObjeto`).
Eso convierte en errores varias cosas que hoy el front envía:

| # | Hallazgo | Efecto con el backend real | Quién actúa |
|---|---|---|---|
| N-1 | ✅ **Resuelto en el front (24 nov.).** **Nombres separados.** La atención y la consulta previa usan `persona.primerNombre`, `segundoNombre`, `primerApellido`, `segundoApellido`; `nombres` y `apellidos` **ya no existen** en `persona` (la respuesta de `GET /alma/personas/consulta` también). | El front manda y espera `nombres`/`apellidos`: respuesta `400 «Campo no permitido»` al crear o editar. | **Hecho:** `almaContratoInterceptor` envía los cuatro campos y reconstruye `nombres`/`apellidos` al recibir (ver §0.4). |
| N-2 | ✅ **Contenido en el front; falta Backend.** **Campos que el front envía y el backend no admite** en `persona`: `fechaNacimiento`, `identidadGenero`, `vinculoUniversidad`; en la atención: `lugarOcurrencia`; en `solicitante`: `correo`, `parentescoOtro`. | `400 «Campo no permitido»` en `POST`/`PATCH /atenciones-aph` y también en el primer contacto (la lista de `persona` es la misma). | **Backend:** aceptarlos (contrato en `contrato-revision-flujos-2026-11.md`). **Front (hecho):** con `environment.lineaAlma.extensiones = false` (producción) los oculta y no los envía, así que hoy se puede guardar una atención contra el backend real. |
| N-3 | **Endpoints de la revisión de flujos que no existen**: `POST`/`DELETE /atenciones-aph/{id}/evidencias`, `POST .../seguimientos` en derivaciones internas y rutas externas, `PATCH /alma/psicologia/novedades/{id}/persona`. | `404` o `405`. | Backend (ver `contrato-revision-flujos-2026-11.md`). |
| N-4 | **Catálogos nuevos del front sin respaldo**: `destinos-internos-aph`, `rutas-externas-aph`, `identidades-genero`, `vinculos-udea`, y las 16 opciones de `parentescos-solicitante` y las 15 de `rutas-externas`. | `404` (`CatalogoAlmaService` solo acepta los nombres que conoce). | Backend + equipo (el listado de identidades de género es placeholder). |
| N-5 | **Teléfono.** El backend sigue con `^\+?\d{7,15}$` en `persona` y `solicitante`. El §C-3 pedía `^[0-9]{7,12}$` y obligatorio al pasar a triaje. | Sin cambio en el backend: acepta `+` y hasta 15 dígitos. | Backend (C-3 sigue abierto). |

Con la capa de compatibilidad del §0.4, **ya se puede apagar el servidor simulado de APH** (F-2) contra el backend real; lo que dependa de N-2 a N-4 queda oculto hasta que Backend lo habilite.

### 0.3 Estado de los pedidos del 20 de noviembre

B-1 (texto de consentimiento), B-2 (`REGISTRADA`), B-4 (roles), B-5 (notas) y B-6 (rendimiento de la bandeja APH) **no cambiaron**: el texto de
consentimiento sigue sin cargarse («No se carga texto de consentimiento hasta recibir una versión oficial»), así que **todavía no se puede derivar
a Psicología en QA**. C-1 (notas y cierre de rutas), C-2 (valoración en cada seguimiento) y C-3 siguen sin implementarse. B-3 queda a medias (ver §0.1).

### 0.4 Qué quedó conectado en el front (24 de noviembre)

| Qué | Cómo quedó |
|---|---|
| **Nombres separados** (N-1) | `src/app/linea-alma/shared/http/alma-contrato.interceptor.ts`, registrado **después** de los interceptores del servidor simulado: solo toca lo que sale a la red. Al enviar quita `persona.nombres`/`apellidos` y manda `primerNombre`, `segundoNombre`, `primerApellido`, `segundoApellido`; al recibir recompone `nombres`/`apellidos` donde el backend manda los cuatro (atención, consulta previa, novedad, bandejas). Con pruebas. |
| **Bandera de extensiones** | `environment.lineaAlma.extensiones`: `true` en desarrollo y demo (servidor simulado), **`false` en producción**. Con `false` el interceptor retira de lo que se envía `persona.fechaNacimiento`, `identidadGenero`, `vinculoUniversidad`, `lugarOcurrencia`, `solicitante.correo` y `solicitante.parentescoOtro`, y la interfaz oculta esos controles, las evidencias, las novedades y el cierre de remisiones, y el bloque «Datos de la persona» de Psicología. Una prueba de entorno impide que producción la deje en `true`. |
| **Catálogos con extensiones apagadas** | El panel de remisiones de APH pide `destinos-internos` y `rutas-externas` (los que el backend ya tiene) en lugar de `destinos-internos-aph` y `rutas-externas-aph`. |
| **Respuestas del backend real** | `DerivacionInternaDto` acepta `estado: 'REGISTRADA'`, `fechaEnvio: null` (usa `fechaRegistro`) y la ausencia de `seguimientos`; `AtencionAphDto`, la ausencia de `evidencias` y `lugarOcurrencia`. |
| **Psicología** | Los DTO y rutas coinciden con lo implementado en `feat/psicologia-bandeja-novedades` (tomar, liberar, novedad, intentos, notificaciones, primer contacto): mismos nombres de campo (`version`, `fechaHora`, `resultado`, `nota`, `justificacion`, `valoracionRiesgo {nivel, descripcion}`, `presuntoAgresor {nombres, apellidos, vinculo, convivencia, observaciones}`). El primer contacto envía `persona` solo con los campos que el backend admite. |
| **Servidor simulado** | Sigue activo en desarrollo y en la demo; ahora se apaga grupo por grupo con `environment.lineaAlma.mocks`. Producción ya lo tiene todo en `false`. |

**Para probar contra QA:** en `environment.ts` poner en `false` los grupos de APH (`catalogos`, `personas`, `atencionesAph`, `derivaciones`, `bandejaAph`, `contenciones`, `auditoria`) y dejar `extensiones: false`. Los grupos de Psicología solo funcionan contra QA cuando la rama de Yonatan llegue a `main` y se despliegue.

### 0.5 Qué debe cambiar en Backend — lista para el equipo

**Bloqueantes para probar APH de punta a punta en QA**

| # | Cambio en Backend | Dónde | Detalle |
|---|---|---|---|
| **BE-1** | **Cargar el texto de consentimiento** (B-1) | `database/insert_catalogos_aph.sql`, catálogo `textos-consentimiento` | Hoy no hay ninguno; sin él no se puede derivar a Psicología. Código = versión (`V1`), etiqueta = texto completo, `activo = true`. Si el oficial no llega, cargar uno provisional **solo en QA**. |
| **BE-2** | **`DerivacionInternaAlmaResponse`** (B-2) | `dto/response/DerivacionInternaAlmaResponse.java` | Devolver `estado: "ENVIADA"` y `fechaEnvio = fechaRegistro` (hoy `REGISTRADA` y `null`). El front ya tolera lo actual, pero la tabla de estados del contrato es `ENVIADA/RECIBIDA/RECHAZADA/CERRADA`. |
| **BE-3** | **`gestionSimultanea` y `numeroCaso`** (B-3) | `AtencionAlmaService.respuesta()` | `numeroCaso` ya se calcula en la rama de Psicología; falta que `gestionSimultanea` deje de ser `null` (mínimo `false`). |
| **BE-4** | **Teléfono** (C-3) | `AtencionAlmaDatos.Persona` y `.Solicitante` | Patrón `^[0-9]{7,12}$` (hoy `^\+?\d{7,15}$`) y **obligatorio** en `persona.telefonoPrincipal` al pasar a triaje o derivar (error `400` por campo). El front ya lo exige y lo valida así. |
| **BE-5** | **Matriz de roles** (B-4) | `initial_data.sql` | Confirmar `ALMA_COORDINACION` frente a `COORDINADOR` en atenciones, bandeja y auditoría. |

**Campos nuevos que hoy el backend rechaza con `400 «Campo no permitido»`** (el front los envía solo si `extensiones = true`)

| # | Campo | Dónde | Regla |
|---|---|---|---|
| **BE-6** | `persona.fechaNacimiento` | atención y primer contacto | `YYYY-MM-DD`, no futura, no anterior a 1900. Opcional. |
| **BE-7** | `persona.identidadGenero` | ídem | Código del catálogo `identidades-genero`. Opcional. |
| **BE-8** | `persona.vinculoUniversidad` | ídem | Código del catálogo `vinculos-udea`. Opcional. |
| **BE-9** | `lugarOcurrencia` | atención | `DENTRO_UDEA` \| `FUERA_UDEA` \| `null`. Opcional. |
| **BE-10** | `solicitante.correo` y `solicitante.parentescoOtro` | atención | `parentescoOtro` obligatorio solo si `parentesco = OTRO`. |

**Catálogos** (`GET /alma/catalogos/{nombre}`; hoy responden `404` los nuevos)

| # | Catálogo | Contenido |
|---|---|---|
| **BE-11** | `destinos-internos-aph` (nuevo) | `SPYB`, `MASCULINIDADES`, `BIENESTAR_FACULTAD` |
| **BE-12** | `rutas-externas-aph` (nuevo) | `COMISARIA_FAMILIA`, `FISCALIA`, `INSPECCION_POLICIA`, `PROCURADURIA`, `RUTA_SALUD`, `OTRA` |
| **BE-13** | `destinos-internos` (cambia, 7) y `rutas-externas` (cambia, 15) | Incluyen `SIN_DECISION` y `NO_APLICA`; `LINEA_123` pasa a `LINEA_123_AGENCIA_MUJER` y `LINEA_123_MUJER_ANTIOQUIA`. Detalle en `contrato-revision-flujos-2026-11.md` §4.1. |
| **BE-14** | `parentescos-solicitante` (cambia, 16) | Con `OTRO` que habilita «¿Cuál?». |
| **BE-15** | `identidades-genero` (nuevo, **placeholder**) y `vinculos-udea` (nuevo, 18) | La lista oficial de identidades la define el Equipo de Atención. |
| **BE-16** | Sin derivación | `SIN_DECISION` y `NO_APLICA` se aceptan en `POST /derivaciones/internas` y `/rutas-externas` **sin consentimiento ni motivo**. |

**Endpoints nuevos** (contrato completo en `contrato-revision-flujos-2026-11.md`)

| # | Endpoint | Para qué |
|---|---|---|
| **BE-17** | `POST` / `DELETE /alma/atenciones-aph/{id}/evidencias[/{idEvidencia}]` | Evidencias de la atención (multipart; máx. 5 archivos, 10 MB c/u, 25 MB total). |
| **BE-18** | `POST /alma/derivaciones/internas/{id}/seguimientos` y `POST /alma/rutas-externas/{id}/seguimientos` | Novedades con fecha y hora de cada remisión (`novedad` 5–500, `fechaHora` no futura). Devuelven la remisión con `seguimientos[]`, que también debe venir en los `GET`. |
| **BE-19** | `PATCH /alma/derivaciones/internas/{id}` | Cerrar con `{ version, estado: "CERRADA", resultado }` (`resultado` obligatorio, hasta 500). Requiere `version` y el estado `CERRADA` en la derivación. |
| **BE-20** | `PATCH /alma/psicologia/novedades/{id}/persona` | Completar datos de la persona desde Psicología (nunca cambia nombres ni documento). |

**Psicología** (rama `feat/psicologia-bandeja-novedades`)

| # | Cambio | Detalle |
|---|---|---|
| **BE-21** | **Abrir PR a `main` y desplegar** | Sin eso, los endpoints de Psicología no existen en QA. |
| **BE-22** | Seguimientos con valoración de riesgo (C-2) | `POST /alma/casos/{numeroCaso}/seguimientos` exige `valoracionRiesgo ∈ {ALTO, MEDIO, BAJO}`. |
| **BE-23** | Lo que falta de la rama | Expediente (`GET /alma/casos/{numeroCaso}`), seguimientos, cierre y PDF, agenda, recontactos, telepsiquiatría y el catálogo `motivos-cierre-psicologia` (P-5 a P-9, P-11, P-12). |

**Nota sobre C-1 (observaciones de ruta).** El front **ya no consume** `POST .../notas`: las observaciones de cada remisión son las novedades con fecha y hora de BE-18, que cubren lo mismo. Si Backend ya implementó `/notas`, no hace falta quitarlo, pero el front no lo usa. El cierre de una **ruta externa** sigue siendo el `PATCH` que ya existe, con `resultado`; el de la derivación interna es BE-19.

---

## 1. Resumen

| Área | Estado en el backend | Qué falta |
|---|---|---|
| **APH** (`/alma/...`) | Implementado: atenciones, triaje, derivación a Psicología, cierre, bandeja, remisiones, derivaciones internas, rutas externas, contención post-cierre, auditoría, consulta previa, catálogos | 5 ajustes (§2) |
| **Psicología** | En `main`: solo `GET /alma/bandeja/psicologia`, con datos fijos. En la rama `feat/psicologia-bandeja-novedades` (sin PR): bandeja real, tomar y liberar, novedad, intentos, notificaciones y primer contacto | Expediente, seguimientos, cierre, agenda y recontactos (§0.1) |
| **Frontend** | Consume APH con mocks activos en desarrollo | 4 ajustes (§4) y los de nombres y campos nuevos (§0.2) |

Coinciden con el contrato: prefijo `/alma`, los 8 catálogos APH, el error `{codigo, mensaje, detalles}`, el `409 CONFLICTO_VERSION`
con `versionActual`, el SLA con `ahoraServidor`, el código `ALMA-AAAA-NNNNNN` y los campos de las respuestas de atención,
bandeja, consulta previa, rutas externas, auditoría y contención.

---

## 2. Backend — APH: lo que hay que corregir o decidir

### B-1 · Texto de consentimiento sin cargar (bloqueante)
`database/insert_catalogos_aph.sql` declara: «No se carga texto de consentimiento hasta recibir una versión oficial».
Consecuencias:
- El front lee `GET /alma/catalogos/textos-consentimiento`; con el catálogo vacío muestra error y no deja otorgar consentimiento.
- `POST /alma/atenciones-aph/{id}/derivaciones/psicologia` (y `POST /remisiones-aph` con consentimiento) responde `400` si `versionTexto`
  no existe y está activo en ese catálogo.

**Resultado: hoy no se puede derivar a Psicología en QA.**
**Pedido:** cargar el texto oficial (código = versión, p. ej. `V1`; etiqueta = texto completo, `activo = true`). Si el oficial aún no llega,
cargar uno **provisional marcado como tal** solo en QA.

### B-2 · `DerivacionInternaAlmaResponse` no coincide con el contrato
El backend devuelve `estado: "REGISTRADA"`, `fechaEnvio: null` y `resultado: null`. El contrato (y el front) esperan
`estado ∈ {ENVIADA, RECIBIDA, RECHAZADA}` y `fechaEnvio` con la fecha. La respuesta ya trae `fechaRegistro`.
**Pedido:** decidir una de dos y avisar: (a) Backend devuelve `ENVIADA` y `fechaEnvio = fechaRegistro`; o (b) se acepta `REGISTRADA`
y Frontend ajusta el tipo. Recomendación: (a), es el cambio más pequeño.

### B-3 · `numeroCaso` y `gestionSimultanea` siempre `null`
En `AtencionAlmaService.respuesta()` ambos se emiten con `putNull`. El contrato define `gestionSimultanea` como booleano
(actuaciones activas del mismo caso en Equipo de Atención **y** Línea Alma, Q15) y `numeroCaso` como el caso asociado.
Efecto: la alerta de gestión simultánea no aparece nunca.
**Pedido:** calcular `gestionSimultanea` (`false` como mínimo, nunca `null`) y devolver `numeroCaso` cuando exista.

### B-4 · Roles de Línea Alma
- `/alma/auditoria` exige `ADMIN` o `ALMA_COORDINACION`; las atenciones permiten `COORDINADOR` (el de Equipo de Atención).
  El contrato habla de «COORD» de Línea Alma sin distinguir.
- Las remisiones desde Equipo de Atención aceptan `EA_COORDINACION`, `PROFESIONAL` y `COORDINADOR`.

**Pedido:** confirmar la matriz final operación × rol (en el front vive en `shared/permisos/alma-permisos.ts`) y si `ALMA_COORDINACION`
sustituye a `COORDINADOR` en atenciones, bandeja y auditoría. Frontend alineará la suya.

### B-5 · Visibilidad de notas para Psicología (RNF-ALMA-002)
`GET /atenciones-aph/{id}` devuelve también notas `POST_CIERRE` a cualquier rol permitido (`PROFESIONAL`, `REVISOR`…). El front asume que
Psicología solo ve notas `APH`. **Pedido:** confirmar la regla; si debe filtrarse, hacerlo en el servidor.

### B-6 · Rendimiento de `GET /alma/bandeja/aph` (recomendación)
`BandejaAphService.listar()` ejecuta, por cada fila, `findByCodigo` y `respuesta()` (que a su vez consulta contenciones, derivaciones y
rutas). Con `size` hasta 100 son cientos de consultas por petición, y la pantalla refresca. **Pedido:** resolver la lista con una consulta
(o con las columnas ya existentes) y proyectar solo los campos de la bandeja.

---

## 3. Backend — Psicología: lo que no existe

Solo existe `GET /alma/bandeja/psicologia`, y devuelve fijos `tomadaPor = null`, `tomadaPorMi = false`, `intentosRealizados = 0`.
Todo lo siguiente lo consume el front hoy (contra mocks) y **no está en el backend**. Contratos completos en
`contrato-psicologia-bandeja-novedades.md` y `contrato-psicologia-casos-seguimientos-recontactos.md`.

| # | Endpoint que consume el front | Para qué |
|---|---|---|
| P-1 | `POST /alma/bandeja/psicologia/{id}/tomar` y `/liberar` | Tomar y liberar una novedad (409 si ya fue tomada) |
| P-2 | `GET /alma/psicologia/novedades/{id}` | Novedad con notas APH y triaje de solo lectura |
| P-3 | `GET`/`POST /alma/psicologia/novedades/{id}/intentos` | Protocolo de hasta 9 intentos (RN-ALMA-03) |
| P-4 | `POST /alma/psicologia/novedades/{id}/primer-contacto` | Crea el caso; decisión ante caso activo (RN-ALMA-06) |
| P-5 | `GET /alma/casos/{numeroCaso}` | Expediente consolidado |
| P-6 | `GET`/`POST /alma/casos/{numeroCaso}/seguimientos` | Seguimientos; contador que no bloquea (RN-ALMA-05); recordatorio por correo |
| P-7 | `POST /alma/casos/{numeroCaso}/cierre` y `GET .../pdf` | Cierre por motivo y PDF |
| P-8 | `GET /alma/psicologia/agenda` | «Mi agenda» |
| P-9 | `GET /alma/psicologia/recontactos` y `POST .../recontactos/{id}/resolucion` | Vincular / caso nuevo / contención puntual |
| P-10 | `GET /alma/psicologia/notificaciones` | Polling cada 30 s |
| P-11 | `GET /alma/psicologia/telepsiquiatria` | Consulta usada por el front |
| P-12 | Catálogos `dimensiones-salud-mental`, `resultados-intento`, `motivos-cierre-psicologia`, `vinculos-agresor` | `CatalogoAlmaService` solo acepta 8 nombres y responde 404 a estos |

También: la bandeja debe devolver `tomadaPor`, `tomadaPorMi` e `intentosRealizados` reales, y se deben revisar las decisiones
D-PSI-01…19 (entidad de la novedad antes del caso, SLA, PDF síncrono, contención puntual).

---

## 3 bis. Backend — cambios que pidió el cliente (reunión de revisión, noviembre 2026)

El front ya los implementó contra el servidor simulado (mocks); Backend debe crearlos para que funcionen contra QA.

### C-1 · Seguimiento de rutas internas y externas desde el detalle de la atención
Decisión: no hay módulo aparte. En el detalle de la atención, APH podrá **agregar observaciones y cerrar** cada ruta o derivación.
**Remitir no cierra la atención**, y cerrar una ruta tampoco: son decisiones independientes.

| Operación | Endpoint propuesto | Cuerpo | Reglas |
|---|---|---|---|
| Observación en ruta externa | `POST /alma/rutas-externas/{idRuta}/notas` | `{ version, contenido }` | `contenido` 5–1000 caracteres; 409 `CONFLICTO_VERSION`; 422 `RUTA_CERRADA` si ya está cerrada. La primera observación pasa `ACTIVADA` → `EN_SEGUIMIENTO`. Devuelve la ruta con `notas[]` (`201`). |
| Cierre de ruta externa | `PATCH /alma/rutas-externas/{idRuta}` (ya existe) | `{ version, estado: "CERRADA", resultado }` | `resultado` obligatorio, código del catálogo `resultados-ruta-externa`. |
| Observación en derivación interna | `POST /alma/derivaciones/internas/{idDerivacion}/notas` | `{ version, contenido }` | Igual que arriba. |
| Cierre de derivación interna | `PATCH /alma/derivaciones/internas/{idDerivacion}` | `{ version, estado: "CERRADA", resultado }` | `resultado` obligatorio, hasta 500 caracteres. |

Cambios en las respuestas: `RutaExternaAlmaResponse` y `DerivacionInternaAlmaResponse` deben incluir `notas: [{ idNota, contenido, fechaRegistro, autor }]`,
y la derivación interna debe incluir `version` y admitir el estado `CERRADA` (ver también B-2). Cada operación debe registrar un evento en la auditoría.
El cierre de la atención sigue validando `RUTAS_PENDIENTES` solo para rutas **externas** no cerradas (comportamiento actual).

### C-2 · Valoración del riesgo en cada seguimiento de Psicología
`POST /alma/casos/{numeroCaso}/seguimientos` pasa a exigir `valoracionRiesgo ∈ {ALTO, MEDIO, BAJO}` (obligatorio, `400` por campo si falta).
`SeguimientoDto` devuelve `valoracionRiesgo`. Es independiente del triaje de APH (RN-ALMA-04): nunca lo modifica. Entra al contrato Psicología (§3).

### C-3 · Nombres y teléfono de la persona atendida
- El front ahora captura **primer y segundo nombre / primer y segundo apellido** por separado (igual que el resto de la plataforma) y los envía
  unidos en `persona.nombres` y `persona.apellidos` (`"Juan Carlos"`, `"Pérez Gómez"`). **Actualización del 24 de nov.: Backend ya los recibe separados** (`primerNombre`, `segundoNombre`, `primerApellido`, `segundoApellido`) y rechaza `nombres`/`apellidos` en `persona`; ver N-1 en el §0.2. El front debe enviarlos separados.
- El **celular o teléfono** pasa a ser obligatorio en el front al guardar la caracterización, con el formato de toda la plataforma: solo dígitos, 7 a 12.
  Hoy `PATCH /atenciones-aph/{id}` lo acepta vacío y admite `+` y hasta 15 dígitos. **Pedido:** exigir `persona.telefonoPrincipal` con el mismo patrón
  (`^[0-9]{7,12}$`) cuando la atención pasa a triaje o derivación (error `400` por campo `persona.telefonoPrincipal`), como ya se exige en las remisiones.

### C-4 · Visibilidad de remisiones para todo perfil APH
Decisión: cualquier usuario con rol `TECNICO_APH` puede **ver** las remisiones recibidas (rotación de turnos). El backend ya lo cumple en
`GET /alma/bandeja/aph?vista=remisiones` (no filtra por usuario) y solo restringe **tomar**. **Sin cambio**; se deja constancia para que no se
restrinja por error. La vista «Mis atenciones» (`vista=mias`) sigue siendo por persona.

### C-5 · Cierre de la atención sin caso
Cuando la persona rechaza la remisión a Psicología, APH puede cerrar la atención y **no se genera `numeroCaso`**: el caso solo nace cuando Psicología
atiende (primer contacto efectivo). Comportamiento actual del backend (`numeroCaso` es `null` en la atención); se confirma que debe mantenerse así.
Una persona puede tener varias atenciones y recibir contención continua (RN-ALMA-06).

---

## 4. Frontend — lo que nos toca

| # | Qué | Detalle |
|---|---|---|
| F-1 | **Reconocer `ALMA_COORDINACION`** | `normalizarCodigoRol` (`auth.service.ts`) lo convierte en `COORDINADOR` porque contiene «COORD» (mismo error que ya corregimos con UAD). Un usuario de coordinación Alma vería opciones que el backend rechaza. Depende de B-4 para fijar la matriz. |
| F-2 | **Apagar mocks de APH** | En `environment.lineaAlma.mocks`: `catalogos`, `personas`, `atencionesAph`, `derivaciones`, `bandejaAph`, `contenciones`, `auditoria`. Los de Psicología siguen encendidos hasta que existan (§3). Probar de punta a punta con un `TECNICO_APH` real. |
| F-3 | **Adaptar `DerivacionInternaDto`** | Solo si se acepta `REGISTRADA` (B-2 opción b). |
| F-4 | **Documentación** | `pendientes-backend-rama-aph.md` y `CLAUDE.md` §5 aún dicen que ningún endpoint `/alma` existe. Actualizar. Revisar si los errores A1/A2 de ese documento (módulo viejo `/linea-alma/atencion-pr`) siguen vigentes. |

---

## 5. Orden sugerido y estado

Estado a **24 de noviembre de 2026**.

| Orden | Ítem | Responsable | Estado |
|---|---|---|---|
| 1 | B-1 texto de consentimiento | Backend (+ equipo clínico/legal) | Pendiente (sin cambios) |
| 2 | **N-1** nombres separados en el contrato de la atención | Frontend | **Nuevo — bloquea guardar con backend real** |
| 3 | **N-2** campos nuevos de la revisión de flujos (`fechaNacimiento`, `identidadGenero`, `vinculoUniversidad`, `lugarOcurrencia`, `solicitante.correo`, `parentescoOtro`) | Backend decide; Frontend ajusta | **Nuevo** |
| 4 | B-4 matriz de roles | Backend + Frontend | Pendiente |
| 5 | B-2 / B-3 forma de las respuestas | Backend | B-2 pendiente; B-3 `numeroCaso` hecho en la rama de Psicología, `gestionSimultanea` pendiente |
| 6 | N-3, N-4 endpoints y catálogos de la revisión de flujos | Backend | **Nuevo** — contrato en `contrato-revision-flujos-2026-11.md` |
| 7 | F-1, F-2 | Frontend | F-2 **hecho** para el contrato actual (§0.4); F-1 pendiente de la matriz de roles (BE-5) |
| 8 | B-5, B-6 | Backend | Pendiente |
| 9 | P-1…P-4, P-10, P-12 (parcial) Psicología | Backend | **Hechos en `feat/psicologia-bandeja-novedades`**, falta PR a `main` y probar contra el front |
| 10 | P-5…P-9, P-11, `motivos-cierre-psicologia` | Backend | Pendiente |
| 11 | C-1, C-2, C-3 | Backend | Pendiente |
| 12 | F-3, F-4 | Frontend | Pendiente |

## 6. Criterios de aceptación mínimos para dar APH por integrado

1. Un `TECNICO_APH` crea una atención, registra triaje, otorga consentimiento con un texto real del catálogo y deriva a Psicología;
   la respuesta trae `sla.ahoraServidor`.
2. Dos técnicos intentan tomar la misma remisión: el segundo recibe `409 REMISION_YA_TOMADA`.
3. Editar con una `version` vieja devuelve `409 CONFLICTO_VERSION` con `versionActual`.
4. Una derivación interna se muestra con estado y fecha coherentes (B-2).
5. Un usuario con rol de coordinación Alma ve en el front exactamente lo que el backend le permite (B-4, F-1).
