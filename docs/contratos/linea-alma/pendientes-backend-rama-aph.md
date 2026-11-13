# Lo que Frontend necesita de Backend — rama `feature/alma-aph/H-aph-linea-alma`

> **Para:** equipo de Backend de CASILDA
> **De:** equipo de Frontend (`casilda-frontend`, Angular 21)
> **Fecha:** 10 de noviembre de 2026
> **Cómo usar este documento:** es **autosuficiente**. No hace falta abrir otro archivo para implementar: aquí están
> los errores a corregir, las decisiones que necesitamos, cada endpoint con su JSON, los campos, las validaciones, los
> errores, los catálogos, las reglas de seguridad y los criterios de aceptación. Los contratos que esta consolidación
> reemplaza (`README.md`, `contrato-aph-atenciones.md`, `contrato-aph-derivaciones-bandeja-contencion.md`) siguen en
> la carpeta como historial; **si difieren de este, vale este** (el 10-nov se revisaron contra el código y se corrigió
> una diferencia, ver §0.3).
>
> **Rótulos:** **[Front]** = verificado leyendo el código del front (se cita el archivo) · **[Servidor]** = verificado
> en el OpenAPI de QA el 10-nov-2026 · **[Propuesta]** = el front lo recomienda; Backend acepta o corrige ·
> **[Por confirmar]** = no se pudo comprobar sin sesión en QA.

## Índice

0. Resumen · 1. Estado del servidor · 2. Errores en QA (A1, A2) · 3. Decisiones previas · 4. Convenciones y modelo ·
5. Endpoints (17 que el front consume + 1 nuevo, §5.18) · 6. Catálogos · 7. Estados, SLA y reglas · 8. Seguridad y privacidad · 9. Reporte anónimo ·
10. Transversales · 11. Decisiones abiertas · 12. Criterios de aceptación · 13. Cómo comprobar · 14. Qué hará el front

---

## 0. Resumen

### 0.1 Prioridades

| # | Tipo | Qué | Urgencia |
|---|---|---|---|
| A1 | **Corregir** | `POST /linea-alma/registros/pestana/3` responde `500` con un payload válido | Alta: bloquea el paso «Atención APH» en QA |
| A2 | **Confirmar/corregir** | `GET /maestros/instancias-remision?tipoRemisionId=` responde sin opciones útiles: la columna «¿Cuál?» queda vacía | Alta |
| B1 | **Decidir** | Prefijo (`/alma` o `/linea-alma`) y convivencia con los endpoints actuales | Alta: antes de construir B2 |
| B2 | **Crear** | Los 17 endpoints del submódulo APH (§5.1–5.17) **más `POST /remisiones-aph` (§5.18)**, que alimenta la bandeja: **ninguno existe en QA** | Alta |
| B3 | **Crear/confirmar** | Rol `TECNICO_APH` y qué devuelve el login | Alta |
| B4 | **Crear** | 8 catálogos con códigos oficiales (§6) | Media |
| C1 | **Decidir** | Reporte anónimo: `POST /reportes` pierde datos que el formulario captura (D5) | Media |
| D1 | **Confirmar** | Transversales: CORS, URL de producción, formato de error, límites de tasa, logs | Media |

### 0.2 Qué se hizo en la rama (para dimensionar)

Submódulo **APH** (Atención Primer Respondiente Humano) de Línea Alma, en `src/app/linea-alma/`: consulta previa por
documento, registro de atención por 4 pasos (identificación, caracterización, solicitud, triaje/derivación), triaje manual
u omisión por peligro inminente, consentimiento, derivación a Psicología con SLA, derivaciones internas y rutas externas,
bandeja de remisiones recibidas y «mis atenciones», cierre, contención post-cierre y auditoría. Todo terminado y probado
**contra un servidor simulado en el navegador** (`src/app/linea-alma/mocks/`) que replica los contratos de este
documento. La rama también trae, por el merge de `main`, el reporte anónimo conectado a `POST /reportes`.

### 0.3 Revisión contra el código (10-nov-2026)

Se contrastó cada afirmación de los contratos del 6-nov con el código actual. Resultado:

- **Coinciden:** los 17 endpoints (rutas, métodos, parámetros), los DTO, los enums, la matriz de permisos, los
  límites de longitud, el cálculo del flujo de estados, la regla de consentimiento y excepción por peligro.
- **Diferencia corregida:** los contratos decían que el front envía como `resultado` de una ruta externa el **texto**
  (etiqueta). **No es así:** envía el **`codigo`** del catálogo `resultados-ruta-externa`
  (`panel-derivaciones.component.html`, `[value]="res.codigo"`). Este documento ya lo refleja (§5.12).
- **Hallazgos nuevos (no estaban en los contratos):** la hora del consentimiento la pone el **navegador** (§8);
  `observacion` del cierre admite hasta 1000 caracteres (§5.7); el modal de remisión del módulo viejo traga el error de
  `instancias-remision` (A2); hay **dos** peticiones fallidas a `pestana/3` en la captura de QA, no una (A1).
- **No verificable sin sesión:** el contenido real de los `/maestros/*` y la causa del `500`.

---

## 1. Estado del servidor (OpenAPI de QA, 10-nov-2026) **[Servidor]**

Fuente: `https://casildaqa.duckdns.org/api-casilda/api-docs` (123 rutas).

- **No existe ninguna ruta `/alma/*`** ni `atenciones-aph`, `derivaciones`, `rutas-externas`, `bandeja`,
  `contenciones-post-cierre`, `auditoria` ni `personas/consulta`.
- **Sí existe Línea Alma «módulo vigente»:** `GET /linea-alma/registros`, `GET /linea-alma/registros/{id}`,
  `POST /linea-alma/registros/pestana/{0..5}`, `GET|POST /linea-alma/registros/{idRegistro}/contactos`. Usa ids
  numéricos, está dividido en «pestañas» y no tiene estados, `version` ni código `ALMA-…`. El front lo consume en
  `/linea-alma/atencion-pr` (`src/app/services/linea-alma.service.ts`) y **no se tocó**.
- **Maestros reutilizables que ya existen:** `/maestros/protocolos-aph`, `/maestros/resultados-triage`,
  `/maestros/tipos-remision`, `/maestros/instancias-remision`, `/maestros/tipos-identificacion`, `/maestros/roles`.
- **Búsqueda de persona que ya existe:** `GET /personas/documento/{numeroDocumento}?tipoDocumentoId=` →
  `PersonaSearchResponse` (el OpenAPI no detalla sus campos **[Por confirmar]**).
- **Errores del resto del backend:** `400 { message, validationErrors }` (p. ej. `/contenidos`, `/reportes`).
- Los `/maestros/*` exigen sesión (sin token responden `403`).

---

## 2. Errores reportados en la prueba de QA (módulo vigente `/linea-alma/atencion-pr`)

No los introdujo esta rama; vienen del módulo que ya existía (`src/app/services/linea-alma.service.ts`,
`src/app/components/linea-alma/atencion-pr/`, `src/app/components/modal-remision/`). Se reportaron en la misma prueba.

### A1. `POST /linea-alma/registros/pestana/3` → `500 Internal Server Error`

- **Reporte (9-nov-2026, QA):** al enviar el paso «Atención APH»:
  `{ "timestamp": "2026-11-09T23:05:39.833931653", "status": 500, "error": "Internal Server Error", "message": "Ha ocurrido un error interno en el servidor", "path": "/api-casilda/linea-alma/registros/pestana/3" }`.
  En la captura de la pestaña Network aparecen **dos** peticiones `3` en rojo (dos intentos).
- **Payload enviado** (datos de prueba; `notaAph` tiene ~1000 caracteres):

```json
{
  "id": 4,
  "atencionAph": {
    "fechaHora": "2026-11-09T11:30:00",
    "idProtocoloAph": 1,
    "practicoTriage": true,
    "idResultadoTriage": 1,
    "motivoNoTriage": null,
    "notaAph": "<texto de ~1000 caracteres>",
    "aceptaPsicologia": true,
    "requiereRemision": true
  }
}
```

- **El payload cumple el contrato publicado [Servidor]:** se comparó campo por campo con `Pestana3LineaAlmaRequest`
  (`id`, `atencionAph` obligatorios) y `AtencionAphRequest` (obligatorios: `aceptaPsicologia`, `fechaHora`,
  `idProtocoloAph`, `practicoTriage`, `requiereRemision`): mismos nombres y tipos. **Un payload válido no debe dar `500`.**
- **Qué necesitamos:** el log del servidor de esa petición y la causa. **Hipótesis a descartar** (ninguna verificada):
  1. `notaAph` (~1000 caracteres) contra una columna más corta (p. ej. `varchar(255)`). El front **no** limita hoy la
     longitud de ese campo en este formulario.
  2. `fechaHora` llega **sin zona** (`2026-11-09T11:30:00`) y el servidor espera `Instant`/`OffsetDateTime`.
  3. El registro `id: 4` ya tenía `atencionAph` (reenvío del paso: dos intentos) y choca con una restricción de unicidad.
  4. El registro `id: 4` no tiene las pestañas previas que el servicio da por supuestas.
  5. `idProtocoloAph: 1` o `idResultadoTriage: 1` no existen en su tabla de referencia (FK).
- **Criterios al corregirlo:**
  - [ ] Si es longitud: publicar `maxLength` en el OpenAPI y responder `400` con `validationErrors.atencionAph.notaAph`
    (no `500`). El front agrega el mismo límite.
  - [ ] Reenviar el paso con el mismo `id` **actualiza** o devuelve un `4xx` con mensaje claro, nunca `500`.
  - [ ] Todo `5xx` queda en el log con un identificador de correlación.

### A2. «Instancia a la que se remite» no deja seleccionar nada

- **Síntoma:** en el modal «Agregar Remisión» (paso Remisión de `atencion-pr`), al elegir tipo «Interna» el selector
  «Instancia a la que se remite» no ofrece nada; por eso `cual` viaja vacío a `POST /linea-alma/registros/pestana/5` y la
  columna «¿Cuál?» queda en blanco.
- **Lo que hace el front [Front]** (`ListasService.obtenerInstanciasRemision`, `modal-remision.component.ts`):
  `GET {apiBaseUrl}/maestros/instancias-remision?tipoRemisionId={id}` con el `id` del tipo elegido en
  `GET /maestros/tipos-remision`; cada opción se pinta como `instancia.nombre` y el valor guardado en `cual` es ese
  **nombre** (texto). Ruta y parámetro coinciden con el OpenAPI **[Servidor]** (`tipoRemisionId`, entero, opcional).
- **Evidencia de la captura de QA:** las peticiones `instancias-remision?tipoRe…` salen con el ícono de respuesta JSON
  (éxito), no en rojo. Es decir, **la petición no falla: devuelve una respuesta que no produce opciones.** Las dos causas
  posibles son del servidor o de los datos:
  - responde `[]` (no hay instancias cargadas para ese `tipoRemisionId`, o están asociadas a otro id); o
  - responde elementos **sin el campo `nombre`** (el front espera `MaestroDTO = { id, codigo, nombre }` **[Servidor]**) y
    las opciones salen en blanco.
- **Qué necesitamos [Por confirmar]:**
  - [ ] Pasarnos la respuesta real de `GET /maestros/tipos-remision` y de `GET /maestros/instancias-remision?tipoRemisionId=<id>`
    para «Interna» y para «Externa».
  - [ ] Cargar las instancias de cada tipo (Internas: dependencias de la universidad; Externas: entidades) con `id`,
    `codigo` y `nombre`.
  - [ ] Decidir el contrato de `cual`: hoy es **texto** (`RemisionRegistroAlmaRequest.cual: string`). Si Backend prefiere el
    `id` de la instancia, hay que cambiar el esquema; si prefiere texto, queda como está.
- **Se corrige aparte en el front (no depende de Backend):** el modal vacía la lista en silencio cuando falla la
  petición; pasará a mostrar un aviso con «Intentar de nuevo».

---

## 3. Decisiones previas (antes de construir los endpoints)

### B1. Prefijo y convivencia con el módulo vigente

- **Prefijo.** El front de APH antepone `{apiBaseUrl}/alma` **[Front]** (`AlmaApiClient.PREFIJO`,
  `src/app/linea-alma/shared/http/alma-api.client.ts`). El backend publica Línea Alma bajo `/linea-alma`. **Decidir uno.**
  Si es `/linea-alma/...`, cuidar que no choque con `/linea-alma/registros/*`. Para el front es cambiar una constante.
  Todas las rutas de §5 son **relativas a ese prefijo**.
- **Convivencia (D-ALMA-12).** El módulo vigente (`registros` por pestañas, ids numéricos, sin estados) y el nuevo
  (`atenciones-aph`, ids `ALMA-…`, estados, `version`) modelan casi lo mismo con formas distintas. Decidir si conviven
  hasta migrar datos, si el nuevo reemplaza al viejo o si se apoya en sus tablas. **Recomendación:** convivir sin
  reutilizar el consecutivo `ALMA-…` entre ambos. Define además qué hacer con `/linea-alma/atencion-pr` (el front no la retiró).
- **Pregunta de reutilización:** ¿`GET /personas/documento/{n}` sirve de base para `GET /personas/consulta` (§5.1)? Hoy
  no se sabe si devuelve `seguimientoActivo`, `tieneCasoCerrado` ni `ultimoCasoCerrado`.

### B3. Rol `TECNICO_APH` y login (D-ALMA-01)

- El front asume el código **`TECNICO_APH`** (nombre «Técnico APH») **[Front]**: `ROLES_CASILDA` y `normalizarCodigoRol` en
  `src/app/services/auth.service.ts` (reconoce cualquier texto de rol que contenga `APH`).
- El front lee del login: `nombre`, `email`, `rol`, `roles[]`, `authorities[]`, `foto`, `token`. Y decide el rol revisando
  **`roles` y `rol`** (con `GESTOR_CONTENIDO` el login trae en `rol` el *nombre* y en `roles` el *código*; un descuido
  ahí nos costó un bug de sesión).
- [ ] Crear el rol `TECNICO_APH` y devolverlo en `roles` del login.
- [ ] Confirmar que `GET /maestros/roles` lo lista.
- [ ] Un usuario `TECNICO_APH` de QA para la prueba de punta a punta (y uno por cada otro rol de §4.3).
- Si el código es otro: se cambia `ROLES_CASILDA` y la matriz de §4.3; una línea.

### Formato de error (D-ALMA-03)

El plan fija `{ "codigo", "mensaje", "detalles" }` para Línea Alma; el resto del backend usa
`{ "message", "validationErrors" }`. **El front acepta ambos** **[Front]** (`alma-error.ts` lee `codigo`, `mensaje`,
`message`, `detalles` y `validationErrors`). **Recomendación:** que Línea Alma use `{ codigo, mensaje, detalles }`. Si
Backend usa el otro, también funciona, pero entonces los códigos de negocio de §4.5 viajarían en `message`/otro campo y
el front **no podría traducirlos**: deben ir en `codigo`.

---

## 4. Convenciones y modelo de datos

### 4.1 Convenciones comunes **[Front]** (`alma-api.client.ts`, `alma-dto.ts`)

| Tema | Convención |
|---|---|
| Prefijo | `{apiBaseUrl}/alma` (decidible, B1). `{apiBaseUrl}` sale de `src/environments/`. |
| Autenticación | JWT en `Authorization: Bearer`. Ante `401` el front cierra la sesión; ante `403` solo falla la operación. |
| JSON | `camelCase` en todo el contrato. |
| Fechas | ISO-8601 **con zona** (`2026-11-06T14:30:00-05:00`; el navegador también envía `Z`). Excepción: `fechaActivacion` de rutas externas viaja `YYYY-MM-DD` (D-ALMA-10). |
| Listas paginadas | `?page=0&size=10` → `{ "items": [], "page": 0, "size": 10, "total": 0 }` (el front usa `size=10`; la página es base 0). |
| Listas por contexto | `derivaciones/internas`, `rutas-externas`, `auditoria` devuelven **arreglo simple** (sin paginar). |
| Concurrencia | Los recursos mutables exponen `version` (entero ≥ 1). `PATCH`/acciones la reciben; si no coincide → `409 CONFLICTO_VERSION`. Cada escritura exitosa la incrementa en 1. |
| Error estándar | `{ "codigo": "STRING", "mensaje": "texto en español", "detalles": {} }`. En `400`, `detalles` = `{ "<campoDelDTO>": "mensaje" }` (clave con punto para anidados: `persona.numeroIdentificacion`). |
| Catálogos | `GET /catalogos/{nombre}` → `[ { "codigo", "etiqueta", "activo" } ]`; el front solo muestra `activo: true`. |
| Reloj | El SLA lo calcula el servidor (`venceEn`, `ahoraServidor`). **El front no usa el reloj del navegador para decidir «vencido».** |
| Nulos | El front envía `null` en los campos vacíos opcionales y omite los que no aplican. Tolera `null` o ausencia en las respuestas de campos opcionales. |

### 4.2 Enums **[Front]** (`alma.types.ts`)

| Enum | Valores |
|---|---|
| `EstadoAtencion` | `BORRADOR`, `PENDIENTE_APH`, `EN_GESTION_APH`, `PENDIENTE_PSICOLOGIA`, `ABIERTO_ACTIVO`, `EN_SEGUIMIENTO`, `CERRADO` (son estados de la **atención**; los del **caso** son otro conjunto, Q1) |
| `CanalIngreso` | `LLAMADA`, `WHATSAPP`, `REMISION_EA`, `REMISION_SPYB`, `REMISION_UAD` (el front permite elegir solo `LLAMADA`/`WHATSAPP`; las `REMISION_*` llegan por la bandeja y no se editan) |
| `OrigenRemision` | `EA`, `SPYB`, `UAD` (solo con canal `REMISION_*`; si no, `null`) |
| `Triaje` | `ALTO`, `MEDIO`, `BAJO` (no confundir con `prioridad` del caso: ALTA/MEDIA/BAJA) |
| `MedioConsentimiento` | `DIGITAL`, `VERBAL` |
| `TipoContexto` | `ATENCION_APH`, `CASO` |
| `TipoNota` | `APH`, `PSICO`, `SEGTO`, `POST_CIERRE` |
| Estado de derivación interna | `ENVIADA`, `RECIBIDA`, `RECHAZADA` (al crear, `ENVIADA`) |
| Estado de ruta externa | `ACTIVADA`, `EN_SEGUIMIENTO`, `CERRADA` (al crear, `ACTIVADA`) |
| Acción de auditoría | `CREACION`, `ACTUALIZACION`, `CAMBIO_ESTADO`, `DERIVACION`, `VINCULACION`, `NOTA` |
| Formato de ids | `idAtencion` `^ALMA-\d{4}-\d{6}$` · `numeroCaso` `^CAS-\d{4}-\d{6}$` · `DER-0001`, `RUT-0001`, `CON-0001`, `NOTA-n`, `EVT-000001` (el front no valida estos últimos) |

### 4.3 Matriz de roles y permisos **[Front]** (`shared/permisos/alma-permisos.ts`)

La UI oculta la acción y protege la ruta, pero **el Backend es la autoridad: debe devolver `403`** a lo que la UI oculta.
«Eliminar» no existe (Q13). Roles: ADMIN, COORD (`COORDINADOR`), PROF (`PROFESIONAL`, psicólogo), TAPH (`TECNICO_APH`), REV
(`REVISOR`), USUARIO (`USUARIO`; sin permisos de Línea Alma). `GESTOR_CONTENIDO` tampoco tiene.

| Permiso | ADMIN | COORD | PROF | TAPH | REV | USUARIO |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `alma.aph.crear` | ✔ | ✔ | – | ✔ | – | – |
| `alma.aph.consultar` | ✔ | ✔ | ✔ (solo notas APH) | ✔ | ✔ | – |
| `alma.aph.editar` | ✔ | ✔ | – | ✔ | – | – |
| `alma.aph.cerrar` | ✔ | – | – | ✔ | – | – |
| `alma.aph.bandeja` | ✔ | ✔ | – | ✔ | ✔ | – |
| `alma.psicologia.crear/consultar/editar` | ✔ | ✔ | ✔ | – | solo consultar | – |
| `alma.psicologia.cerrar` | ✔ | – | ✔ | – | – | – |
| `alma.notasClinicas.consultar` | ✔ | ✔ | ✔ | **–** | ✔ | – |
| `alma.pdf.consultar` / `alma.pdf.exportar` | ✔ | ✔ | ✔ | **–** | solo consultar | – |
| `alma.alertaSeguimiento.consultar` | ✔ | ✔ | ✔ | ✔ | ✔ | – |

Rutas del front: `/linea-alma/aph/{nueva, remisiones, atenciones/:idAtencion}` (`aph/routes.ts`). El guard de ruta deja
pasar siempre a ADMIN.

### 4.4 Objetos del modelo (`shared/types/alma-dto.ts`)

```text
PersonaAtencion   { tipoIdentificacion: string(código), numeroIdentificacion: string,
                    nombres|null, apellidos|null, telefonoPrincipal|null, correoPersonal|null, ciudad|null,
                    estrato: number|null }
Solicitante       { esTercero: boolean, nombres|null, apellidos|null, telefono|null, parentesco|null(código) }
Consentimiento    { otorgado: boolean, medio: DIGITAL|VERBAL, fechaRegistro: datetime, versionTexto?: string }
Sla               { horasLimite: number, venceEn: datetime, ahoraServidor: datetime }
OmisionTriaje     { peligroInminente: true, justificacion: string }
Cierre            { motivo: string(código), observacion: string|null, fecha: datetime }
NotaAtencion      { idNota: string, tipoOrigen: APH|PSICO|SEGTO|POST_CIERRE, contenido, fechaRegistro, autor }
DerivacionInterna { idDerivacion, tipoContexto, idContexto, destino(código), motivo, estado, fechaEnvio,
                    peligroInminente: boolean, consentimiento: Consentimiento|null, resultado: string|null }
RutaExterna       { idRuta, version, tipoContexto, idContexto, entidad(código), motivo, fechaActivacion: YYYY-MM-DD,
                    estado, resultado: string(código)|null, peligroInminente: boolean, consentimiento|null }
```

**`AtencionAphDto`** (respuesta de crear/leer/actualizar/triaje/cierre/tomar):

| Campo | Tipo | Notas |
|---|---|---|
| `idAtencion` | string | `ALMA-AAAA-NNNNNN`, generado en el primer guardado |
| `version` | int | +1 por escritura |
| `estado` | `EstadoAtencion` | |
| `canalIngreso` | `CanalIngreso` | |
| `origenRemision` | `OrigenRemision`\|null | solo remisiones |
| `persona` | `PersonaAtencion` | |
| `solicitante` | `Solicitante`\|null | `null` si quien llama es la propia persona |
| `motivoConsulta`, `notaAph` | string\|null | máx. 2000 |
| `triaje` | `Triaje`\|null | |
| `omisionTriaje` | `OmisionTriaje`\|null | `triaje` es `null` cuando hay omisión |
| `aceptaPsicologia` | bool\|null | `null` = sin responder aún |
| `consentimiento` | `Consentimiento`\|null | |
| `fechaDerivacion`, `sla` | datetime\|null, `Sla`\|null | solo tras derivar |
| `tomadaPor` | string\|null | nombre visible del técnico |
| `cierre` | `Cierre`\|null | |
| `numeroCaso` | string\|null | `CAS-…` cuando Psicología lo genera |
| `gestionSimultanea` | bool | hay actuaciones activas del mismo caso en Equipo de Atención y Línea Alma (Q15) |
| `notas` | `NotaAtencion[]` | **reducido por rol** (§8) |
| `derivaciones`, `rutasExternas` | arreglos | embebidos |
| `fechaCreacion`, `fechaActualizacion` | datetime | |

### 4.5 Códigos de error que el front ya traduce **[Front]** (`alma-error.ts`)

Con estos `codigo` el front muestra un texto propio (no culpabilizante). Para cualquier otro `400`/`422` muestra el
`mensaje` del servidor (por eso **debe venir en español y sin culpar a quien llama ni a quien atiende**). Un `5xx` muestra
un texto genérico. Sin `codigo` usa un texto por número de estado.

| `codigo` | HTTP | Cuándo | `detalles` |
|---|---|---|---|
| `VALIDACION` | 400 | campo inválido o faltante | `{ "<campo>": "mensaje" }` |
| `ATENCION_NO_ENCONTRADA` | 404 | id inexistente | – |
| `RUTA_NO_ENCONTRADA` | 404 | `idRuta` inexistente | – |
| `CATALOGO_NO_ENCONTRADO` | 404 | catálogo inexistente | – |
| `CONFLICTO_VERSION` | 409 | `version` desfasada | `{ "versionActual": n }` |
| `REMISION_YA_TOMADA` | 409 | remisión ya tomada (APH) | `{ "tomadaEn": datetime }` |
| `NOVEDAD_YA_TOMADA` | 409 | ídem (Psicología; D-ALMA-13) | – |
| `ATENCION_NO_EDITABLE` | 422 | estado no editable | `{ "estado": "…" }` |
| `ATENCION_INCOMPLETA` | 422 | falta `motivoConsulta` al registrar triaje | `{ "motivoConsulta": "…" }` |
| `TRIAJE_REQUERIDO` | 422 | sin triaje ni omisión válida; derivar sin triaje | – |
| `CONSENTIMIENTO_REQUERIDO` | 422 | derivar/activar sin consentimiento | – |
| `PSICOLOGIA_PENDIENTE` | 422 | cerrar con la atención en cola de Psicología | – |
| `RUTAS_PENDIENTES` | 422 | cerrar con rutas externas sin cerrar | – |
| `PERSONA_SIN_CASO_CERRADO` | 422 | contención sobre un caso no cerrado o ajeno | – |
| `401` / `403` | | sin sesión / sin permiso | – |

Los códigos `VALIDACION`, `ATENCION_INCOMPLETA`, `ATENCION_NO_ENCONTRADA`, `RUTA_NO_ENCONTRADA` y
`CATALOGO_NO_ENCONTRADO` los usa el mock y se proponen como estándar; los demás vienen del plan.

---

## 5. Endpoints

Todos exigen JWT. Rutas relativas al prefijo (B1). Los JSON son ejemplos con datos ficticios.

### 5.1 `GET /personas/consulta` — consulta previa (frontera F2)

- **Roles:** TAPH, PSI, COORD, ADMIN, REV (REV recibe la alerta de seguimiento).
- **Query:** `tipoIdentificacion` (código de catálogo, p. ej. `CC`), `numeroIdentificacion`.
- **Para qué:** antes de registrar, el técnico consulta si la persona ya tiene seguimiento activo o un caso cerrado
  (RF-ALMA-003). Para TAPH **nunca información clínica** (RNF-ALMA-002): solo si existe, nombre, fecha del próximo
  seguimiento y nombre del profesional.
- **`200`:**

```json
{
  "existe": true,
  "persona": { "idPersona": 41, "nombres": "Persona", "apellidos": "De Prueba Dos" },
  "seguimientoActivo": { "activo": true, "proximoSeguimiento": "2026-11-09T10:00:00-05:00", "profesional": "Nombre del profesional a cargo" },
  "tieneCasoCerrado": true,
  "ultimoCasoCerrado": { "numeroCaso": "CAS-2026-000003", "fechaCierre": "2026-10-17T16:00:00-05:00" }
}
```

- Persona nueva: `{ "existe": false, "persona": null, "seguimientoActivo": { "activo": false, "proximoSeguimiento": null, "profesional": null }, "tieneCasoCerrado": false, "ultimoCasoCerrado": null }`.
- El front tolera `seguimientoActivo` en `null` o con `activo:false`. `ultimoCasoCerrado` es **adición propuesta (D-ALMA-05)**:
  sin él, la contención post-cierre (§5.15) queda deshabilitada.
- **`400`** si falta un parámetro: `detalles: { "tipoIdentificacion": "Seleccione el tipo de documento.", "numeroIdentificacion": "Escriba el número de documento." }`.
- **Efecto colateral [Propuesta]:** si hay seguimiento activo, el servidor notifica a la bandeja de Psicología. El front
  solo muestra el aviso «El sistema avisa a Psicología»; no confirma el envío.
- **RN-ALMA-06:** la consulta **no vincula nada**; una llamada nueva siempre genera una atención nueva.
- **Seguridad:** es un oráculo de existencia de personas: limitar tasa y auditar cada consulta (quién, cuándo, a quién).

### 5.2 `POST /atenciones-aph` — crear borrador

- **Roles:** TAPH, COORD, ADMIN. **`201`** con `AtencionAphDto`.
- Genera `idAtencion`, `estado: "BORRADOR"`, `version: 1`, `tomadaPor` = usuario autenticado. Un borrador consume consecutivo (Q4).
- **Request** (el front envía `null` en los vacíos y omite lo que no tiene):

```json
{
  "canalIngreso": "LLAMADA",
  "persona": {
    "tipoIdentificacion": "CC", "numeroIdentificacion": "1000000001",
    "nombres": "Persona", "apellidos": "De Prueba Uno",
    "telefonoPrincipal": null, "correoPersonal": null, "ciudad": "Medellín", "estrato": 3
  },
  "solicitante": null,
  "motivoConsulta": null,
  "notaAph": null
}
```

- **Obligatorios para crear:** `persona.tipoIdentificacion`, `persona.numeroIdentificacion`, `canalIngreso`. El resto es
  opcional: «Guardar borrador» no exige completar lo pendiente.
- **`400`:** `{ "codigo": "VALIDACION", "mensaje": "Revise los datos marcados e intente de nuevo.", "detalles": { "persona.tipoIdentificacion": "Seleccione el tipo de documento.", "persona.numeroIdentificacion": "Escriba el número de documento.", "canalIngreso": "Indique por qué canal llegó la solicitud." } }`.
- `canalIngreso` debe estar en el enum; las remisiones (`REMISION_*`) **no** se crean por aquí (las crea EA/SPyB/UAD con `POST /remisiones-aph`, §5.18).

### 5.3 `GET /atenciones-aph/{idAtencion}` — detalle

- **Roles:** TAPH, PSI, COORD, ADMIN, REV. `200` con `AtencionAphDto`; `404 ATENCION_NO_ENCONTRADA`.
- **DTO reducido por rol (R4/RNF-ALMA-002):** TAPH **y** PSI reciben en `notas` solo `tipoOrigen` `APH` y `POST_CIERRE`
  (el cliente además vuelve a filtrar). Las notas `PSICO`/`SEGTO` son clínicas.
- Ejemplo completo:

```json
{
  "idAtencion": "ALMA-2026-000123", "version": 3, "estado": "PENDIENTE_PSICOLOGIA",
  "canalIngreso": "LLAMADA", "origenRemision": null,
  "persona": { "tipoIdentificacion": "CC", "numeroIdentificacion": "1000000001", "nombres": "Persona", "apellidos": "De Prueba Uno", "telefonoPrincipal": null, "correoPersonal": null, "ciudad": "Medellín", "estrato": 3 },
  "solicitante": { "esTercero": true, "nombres": "Quien", "apellidos": "Llama", "telefono": "3000000000", "parentesco": "AMISTAD" },
  "motivoConsulta": "Motivo de consulta de prueba.", "notaAph": "Nota de valoración APH de prueba.",
  "triaje": "ALTO", "omisionTriaje": null, "aceptaPsicologia": true,
  "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00", "versionTexto": "v1" },
  "fechaDerivacion": "2026-11-06T09:15:00-05:00",
  "sla": { "horasLimite": 12, "venceEn": "2026-11-06T21:15:00-05:00", "ahoraServidor": "2026-11-06T14:30:00-05:00" },
  "tomadaPor": "Técnico APH de prueba", "cierre": null, "numeroCaso": null, "gestionSimultanea": false,
  "notas": [ { "idNota": "NOTA-1", "tipoOrigen": "APH", "contenido": "Nota de prueba.", "fechaRegistro": "2026-11-06T09:00:00-05:00", "autor": "Técnico APH de prueba" } ],
  "derivaciones": [], "rutasExternas": [],
  "fechaCreacion": "2026-11-06T08:50:00-05:00", "fechaActualizacion": "2026-11-06T09:15:00-05:00"
}
```

### 5.4 `PATCH /atenciones-aph/{idAtencion}` — actualización parcial

- **Roles:** TAPH, COORD, ADMIN. Exige `version`. `200` con la atención (versión +1).
- **Solo en estados editables:** `BORRADOR`, `EN_GESTION_APH`; otro estado → `422 ATENCION_NO_EDITABLE`.
- Versión desfasada → `409 CONFLICTO_VERSION` con `detalles.versionActual`. El front **no** pisa lo escrito: recarga la
  versión y pide repetir la acción.
- **Campos aceptados:** `canalIngreso`, `persona` (**sin** `tipoIdentificacion`/`numeroIdentificacion`, D-ALMA-08: el
  documento identifica la atención y el front los deshabilita), `solicitante`, `motivoConsulta`, `notaAph`, `aceptaPsicologia`.
- `notaAph` crea/actualiza **una sola nota `APH`** por atención (idNota estable); si llega vacío, la elimina de `notas`.
- «No desea Psicología» = `PATCH { "version": 4, "aceptaPsicologia": false }`; la atención sigue `EN_GESTION_APH`.
- Si llegan `tipoIdentificacion`/`numeroIdentificacion`: ignorarlos o `400` (D-ALMA-08).

```json
{ "version": 2, "motivoConsulta": "Texto con las palabras de la persona.", "persona": { "ciudad": "Medellín", "estrato": null } }
```

### 5.5 `PUT /atenciones-aph/{idAtencion}/triaje` — triaje u omisión

- **Roles:** TAPH. Estados editables. `200` con la atención; **mueve `BORRADOR → EN_GESTION_APH`** (D-ALMA-02).
- **El front no calcula ni sugiere el triaje** (el algoritmo es externo): solo registra la selección manual.
- **Exactamente una** de dos formas:

```json
{ "version": 2, "triaje": "MEDIO" }
```
```json
{ "version": 2, "peligroInminente": true, "justificacionOmision": "Describe la situación que obliga a actuar sin triaje." }
```

- Ni una ni otra, o ambas → `422 TRIAJE_REQUERIDO` («Indique el triaje o registre el motivo por el que se omite.»).
- Omisión con justificación de menos de 10 caracteres → `400` con `detalles.justificacionOmision` (el front: 10 a 1000).
- Sin `motivoConsulta` en la atención → `422 ATENCION_INCOMPLETA` con `detalles.motivoConsulta` (D-ALMA-02).
- La omisión se guarda como `omisionTriaje: { peligroInminente: true, justificacion }` y `triaje: null`; un `PUT`
  posterior con `triaje` la reemplaza (mientras la atención sea editable).

### 5.6 `POST /atenciones-aph/{idAtencion}/derivaciones/psicologia` — derivar (fronteras F1, F3, F5)

- **Roles:** TAPH. Estados editables. **`201`.** Consume: Psicología.
- **RN-ALMA-02:** sin consentimiento no se deriva.

```json
{ "version": 2, "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00", "versionTexto": "v1" } }
```

- **`201`** (`DerivacionPsicologiaDto`; el front vuelve a pedir `GET` después para refrescar):

```json
{
  "idAtencion": "ALMA-2026-000123", "version": 3, "estado": "PENDIENTE_PSICOLOGIA", "triaje": "ALTO",
  "fechaDerivacion": "2026-11-06T09:15:00-05:00",
  "sla": { "horasLimite": 12, "venceEn": "2026-11-06T21:15:00-05:00", "ahoraServidor": "2026-11-06T09:15:01-05:00" }
}
```

- **Efectos:** `estado = PENDIENTE_PSICOLOGIA`, `aceptaPsicologia = true`, guarda `consentimiento` y `fechaDerivacion`; la
  atención entra a la **cola compartida de Psicología** con SLA de **12 / 24 / 48 h** según triaje ALTO/MEDIO/BAJO
  (RN-ALMA-01). Auditoría `DERIVACION`.
- `422 TRIAJE_REQUERIDO` si no hay triaje (incluye `BORRADOR` y omisión, D-ALMA-04; la persona debe registrar el triaje
  después). `422 CONSENTIMIENTO_REQUERIDO` si `otorgado !== true` o falta `fechaRegistro`. `409 CONFLICTO_VERSION`.
  `422 ATENCION_NO_EDITABLE`.
- El front **no** calcula plazos: muestra `sla.venceEn` y compara con `ahoraServidor`.

### 5.7 `POST /atenciones-aph/{idAtencion}/cierre` — cierre APH

- **Roles:** TAPH, ADMIN (`alma.aph.cerrar`). `200` con la atención en `CERRADO` y `cierre` lleno.

```json
{ "version": 4, "motivo": "NO_ACEPTA_PSICOLOGIA", "observacion": null }
```

- `motivo` debe existir en el catálogo `motivos-cierre-aph`, si no `400` con `detalles.motivo` («Seleccione el motivo de
  cierre.»). `observacion`: opcional, **máx. 1000** caracteres en el front.
- `422 PSICOLOGIA_PENDIENTE` si está `PENDIENTE_PSICOLOGIA`; `422 RUTAS_PENDIENTES` si hay rutas externas con
  `estado != CERRADA`; `422 ATENCION_NO_EDITABLE`; `409 CONFLICTO_VERSION`.
- El front solo ofrece cerrar en `EN_GESTION_APH` con `aceptaPsicologia !== true`. El mock admite cerrar también un
  `BORRADOR`: **[Propuesta]** decidir si es válido. Efecto: auditoría `CAMBIO_ESTADO`.

### 5.8 `POST /derivaciones/internas` — derivación interna (frontera F6)

- **Roles:** TAPH, PSI, ADMIN. **`201`.** Efecto: auditoría `DERIVACION`; **[Propuesta]** notificar a la dependencia
  (sin datos personales en la notificación, solo `idAtencion`).

```json
{
  "tipoContexto": "ATENCION_APH", "idContexto": "ALMA-2026-000123", "destino": "EA",
  "motivo": "Requiere acompañamiento presencial.", "peligroInminente": false,
  "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00", "versionTexto": "v1" }
}
```

- **`201`:** `{ "idDerivacion": "DER-0001", "tipoContexto": "ATENCION_APH", "idContexto": "ALMA-2026-000123", "destino": "EA", "motivo": "…", "estado": "ENVIADA", "fechaEnvio": "2026-11-06T09:20:00-05:00", "peligroInminente": false, "consentimiento": { … }, "resultado": null }`.
- **Validaciones:** `tipoContexto ∈ {ATENCION_APH, CASO}`; `idContexto` presente y existente (`404 ATENCION_NO_ENCONTRADA`);
  `destino` en el catálogo `destinos-internos`; `motivo` obligatorio (front 5 a 500); consentimiento válido (`otorgado true`,
  `fechaRegistro`, `medio ∈ DIGITAL|VERBAL`) **salvo peligro inminente**; si falta → `422 CONSENTIMIENTO_REQUERIDO`.
  `400 VALIDACION` con `detalles.destino` / `detalles.motivo`.
- **Excepción por peligro inminente:** el front solo la ofrece hacia **`SPYB`** y entonces envía `peligroInminente: true`
  y `consentimiento: null`. **[Propuesta]** el servidor la acepta **solo para `SPYB`** (D-ALMA-09) y la **audita siempre**.
- **[Propuesta]** no permitir crear derivaciones sobre una atención `CERRADO` (el mock no lo valida; el front pone el panel
  en solo lectura).

### 5.9 `GET /derivaciones/internas?tipoContexto=&idContexto=` — historial

Roles: TAPH, PSI, COORD, ADMIN, REV. `200` **arreglo** de `DerivacionInterna`, sin paginar, **[Propuesta]** en orden
cronológico ascendente.

### 5.10 `POST /rutas-externas` — activar ruta externa (frontera F6)

- **Roles:** TAPH, PSI, ADMIN. **`201`.**

```json
{
  "tipoContexto": "ATENCION_APH", "idContexto": "ALMA-2026-000123",
  "entidad": "COMISARIA_FAMILIA", "motivo": "Orientación sobre medidas de protección.",
  "fechaActivacion": "2026-11-06", "peligroInminente": false,
  "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00" }
}
```

- **`201`:** `{ "idRuta": "RUT-0001", "version": 1, "tipoContexto": "ATENCION_APH", "idContexto": "ALMA-2026-000123", "entidad": "COMISARIA_FAMILIA", "motivo": "…", "fechaActivacion": "2026-11-06", "estado": "ACTIVADA", "resultado": null, "peligroInminente": false, "consentimiento": { … } }`.
- **Validaciones:** `entidad` en el catálogo `rutas-externas`; `motivo` obligatorio (5 a 500); `fechaActivacion` obligatoria,
  `YYYY-MM-DD` (D-ALMA-10; por defecto el front envía hoy en hora local del navegador); consentimiento como en §5.8, con
  excepción por peligro **solo para `LINEA_123`**. **El consentimiento se exige también a las rutas externas**
  (D-ALMA-11, RN-ALMA-02).

### 5.11 `GET /rutas-externas?tipoContexto=&idContexto=` — historial

`200` arreglo de `RutaExterna`.

### 5.12 `PATCH /rutas-externas/{idRuta}` — seguimiento de la ruta

- **Roles:** TAPH, PSI. Con `version`.

```json
{ "version": 1, "estado": "CERRADA", "resultado": "ATENDIDA" }
```

- `estado ∈ ACTIVADA | EN_SEGUIMIENTO | CERRADA`. El front ofrece cambiar a `EN_SEGUIMIENTO` o `CERRADA` (o mantener) y
  **no edita rutas ya `CERRADA`**.
- **`resultado` = el `codigo` del catálogo `resultados-ruta-externa`** **[Front]** (`ATENDIDA`, `SIN_RESPUESTA`, …), **no** el
  texto. `CERRADA` **exige** `resultado`; el front envía `null` si se deja «Sin resultado todavía». Si Backend prefiere
  texto libre, avisar: es un cambio de una línea en el front.
- `409 CONFLICTO_VERSION` (el front recarga la lista); `404 RUTA_NO_ENCONTRADA`; `400` con `detalles.estado` /
  `detalles.resultado`. Auditoría `ACTUALIZACION`. Una atención con rutas no `CERRADA` no puede cerrarse (§5.7).

### 5.13 `GET /bandeja/aph` — bandeja de remisiones y «mis atenciones»

- **Roles:** TAPH, COORD, ADMIN, REV (`alma.aph.bandeja`). Paginada (`page` base 0, `size`; el front usa 10).
- **Query:** `vista = remisiones | mias` (la añadió el front; el plan no la define), `origen = EA | SPYB | UAD` (solo
  `remisiones`), `estado` (solo `mias`; cualquier `EstadoAtencion` salvo `PENDIENTE_APH`).
- **`remisiones`:** atenciones con `canalIngreso` `REMISION_*` y `estado = PENDIENTE_APH`, **más antiguas primero**.
  **`mias`:** atenciones en cualquier otro estado (incluye `BORRADOR`, `EN_GESTION_APH`, `PENDIENTE_PSICOLOGIA`, `CERRADO`),
  **última actualización primero**. El mock devuelve **todas** las no pendientes; **[Propuesta]** definir si «mías» =
  `tomadaPor` el usuario autenticado (lo correcto).

```json
{
  "items": [ {
    "idAtencion": "ALMA-2026-000008", "version": 1,
    "persona": { "tipoIdentificacion": "CC", "numeroIdentificacion": "2000000001", "nombreCompleto": "Persona Remitida Uno" },
    "canalIngreso": "REMISION_EA", "origenRemision": "EA",
    "resumen": "Remitida por el Equipo de Atención.", "fechaRemision": "2026-11-06T09:00:00-05:00",
    "estado": "PENDIENTE_APH", "tomadaPor": null, "triaje": null, "sla": null
  } ],
  "page": 0, "size": 10, "total": 1
}
```

- `sla` solo en `mias` y solo si ya fue derivada a Psicología. El front marca «vencido» si `venceEn <= ahoraServidor` (nunca
  el reloj del navegador) y lo comunica con ícono y texto, no solo con color.
- `nombreCompleto` vacío → el front muestra «Sin nombre registrado».
- **Las remisiones las crean Equipo de Atención, SPyB y UAD** con `POST /remisiones-aph` (§5.18); nacen con
  `estado: PENDIENTE_APH`, `canalIngreso` `REMISION_*` y `origenRemision`. Sin ese endpoint la bandeja nunca tendrá datos.
- Límite de tasa si se expone fuera de red interna.

### 5.14 `POST /bandeja/aph/{idAtencion}/tomar` — tomar remisión (bloqueo optimista)

- **Roles:** TAPH. Cuerpo `{ "version": 1 }`. `200` con `AtencionAphDto` (estado `EN_GESTION_APH`, `tomadaPor` = usuario,
  versión +1). El front navega a `/linea-alma/aph/nueva?atencion=<id>` con los datos pre-llenados.
- Si ya fue tomada (otra persona, o `estado != PENDIENTE_APH`) → `409`:

```json
{ "codigo": "REMISION_YA_TOMADA", "mensaje": "La remisión ya fue tomada por otro técnico.", "detalles": { "tomadaEn": "2026-11-06T14:29:40-05:00" } }
```

- Versión desfasada → `409 CONFLICTO_VERSION`. En ambos el front refresca la lista. Auditoría `CAMBIO_ESTADO`.
- **Dos `tomar` simultáneos: uno `200`, otro `409 REMISION_YA_TOMADA`** (debe garantizarlo el servidor, p. ej. con bloqueo de fila).

### 5.15 `POST /contenciones-post-cierre` — contención sin reabrir el caso (frontera F6)

- **Roles:** TAPH, PSI. **`201`.** Consume: Psicología.

```json
{ "idAtencion": "ALMA-2026-000130", "numeroCaso": "CAS-2026-000003", "nota": "Se brindó contención emocional por teléfono; la persona quedó tranquila." }
```

```json
{
  "idContencion": "CON-0001", "idAtencion": "ALMA-2026-000130", "numeroCaso": "CAS-2026-000003",
  "tipoSeguimiento": "POST_CIERRE", "nota": "Se brindó contención…", "fechaRegistro": "2026-11-06T10:00:00-05:00", "autor": "Técnico APH de prueba"
}
```

- Se registra sobre la atención **nueva** `ALMA-…` (RN-ALMA-06). `numeroCaso` sale de `ultimoCasoCerrado` (§5.1).
- **No reabre el caso, no cambia el estado de la atención y no incrementa el contador de seguimientos** (Q8). Aparece como
  nota `POST_CIERRE` en `notas`.
- **Validaciones:** `idAtencion` existente; `nota` de 10 a 2000 (`400 detalles.nota`); `numeroCaso` presente; el caso debe
  ser un caso **cerrado de la misma persona** → si no, `422 PERSONA_SIN_CASO_CERRADO`. Auditoría `NOTA`.
- La nota es contenido sensible: no loguear.

### 5.16 `GET /auditoria?tipoContexto=&idContexto=` — historial inmutable (RNF-ALMA-003)

- **Roles:** por decidir (D-ALMA-07). Hoy el front la muestra a quien tenga `alma.aph.consultar` (ADMIN, COORD, PROF, TAPH, REV).
- `200` **arreglo**, **orden cronológico ascendente**, solo lectura (sin `PUT/PATCH/DELETE`). `400` si falta contexto.

```json
[
  { "idEvento": "EVT-000001", "fechaHora": "2026-11-06T09:00:00-05:00", "usuario": "Técnico APH de prueba", "accion": "CREACION", "detalle": "Se creó la atención en estado borrador." },
  { "idEvento": "EVT-000002", "fechaHora": "2026-11-06T09:15:00-05:00", "usuario": "Técnico APH de prueba", "accion": "DERIVACION", "detalle": "Derivada a Psicología (triaje ALTO)." }
]
```

- Debe registrar toda creación, cambio de estado, derivación y vinculación manual, con usuario, fecha, hora y detalle.
- **`detalle` no debe contener contenido clínico ni notas** (lo ven roles amplios): solo describir el cambio.
- Límite de tasa. Contiene nombres de usuarios internos.

### 5.17 `GET /catalogos/{nombre}`

Cualquier rol autenticado. `200` `[ { "codigo", "etiqueta", "activo" } ]`. `404 CATALOGO_NO_ENCONTRADO`. El front guarda la
respuesta en caché por sesión; si falla, **no inventa listas**: muestra error con «Intentar de nuevo». Contenido: §6.

### 5.18 `POST /remisiones-aph` — crear una remisión hacia la bandeja APH (**nuevo; el front aún no lo consume**)

Es el único endpoint de esta lista que **el front de APH no llama**: lo llaman Equipo de Atención, SPyB y UAD para enviar
una solicitud a Línea Alma. Sin él, la bandeja `remisiones` (§5.13) nunca tiene datos. Lo define el front a partir de lo que la
bandeja muestra y de lo que la pantalla «Nueva atención» pre-llena al tomar la remisión; **todo lo de esta sección es
[Propuesta]** hasta que Backend lo acepte.

**Quién llama [Propuesta].**
- **Equipo de Atención:** usuarios `PROFESIONAL` y `COORDINADOR` (roles que ya existen), `origenRemision = EA`.
- **SPyB y UAD:** hoy **no existe ningún rol** que los represente (el front solo conoce ADMIN, COORDINADOR, PROFESIONAL,
  REVISOR, USUARIO, GESTOR_CONTENIDO y TECNICO_APH). Decidir (D-ALMA-14): crear roles `REMITENTE_SPYB` y `REMITENTE_UAD`, o
  una integración de sistema a sistema con credenciales propias. Hasta entonces SPyB/UAD no pueden enviar.
- **ADMIN** puede enviar en nombre de cualquier origen (pruebas y soporte).
- **Regla de seguridad:** el servidor **debe validar que `origenRemision` coincida con el rol/dependencia de quien llama**
  (un `PROFESIONAL` de EA no puede enviar como `UAD`). No confiar en el valor que trae el cliente.

**Request:**

```json
{
  "origenRemision": "EA",
  "referenciaOrigen": "CAS-2026-000045",
  "persona": {
    "tipoIdentificacion": "CC", "numeroIdentificacion": "2000000001",
    "nombres": "Persona", "apellidos": "Remitida Uno",
    "telefonoPrincipal": "3000000000", "correoPersonal": null, "ciudad": "Medellín", "estrato": null
  },
  "solicitante": null,
  "motivo": "La persona requiere soporte telefónico 24/7 fuera del horario de atención.",
  "peligroInminente": false,
  "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00", "versionTexto": "v1" }
}
```

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `origenRemision` | `EA`\|`SPYB`\|`UAD` | Sí | debe corresponder al rol de quien llama |
| `referenciaOrigen` | string ≤ 50 \| null | No | identificador en el sistema de origen (p. ej. número de caso de EA) para trazabilidad; el front no lo muestra aún |
| `persona.tipoIdentificacion` | código del catálogo `tipos-identificacion` | Sí | |
| `persona.numeroIdentificacion` | string | Sí | mismas reglas que §5.2 (mín. 4; solo dígitos salvo `CE`/`PA`; longitud máx. por tipo: CC 10, TI 11, CE 6, PA 16, otros 20) |
| `persona.nombres`, `apellidos` | string ≤ 100 \| null | No | la bandeja muestra «Sin nombre registrado» si faltan |
| `persona.telefonoPrincipal` | `^\+?\d{7,15}$` \| null | No | sin teléfono APH no podrá devolver la llamada: **recomendado exigir al menos un medio de contacto** (teléfono o correo) |
| `persona.correoPersonal` | email ≤ 150 \| null | No | |
| `persona.ciudad` ≤ 80, `persona.estrato` 1–6 | | No | |
| `solicitante` | objeto de §4.4 \| null | No | si quien contactó fue un tercero |
| `motivo` | string 10–2000 | Sí | se guarda como `motivoConsulta` y es lo que la bandeja muestra como `resumen` |
| `peligroInminente` | bool | No (por defecto `false`) | solo informativo para priorizar; ver privacidad |
| `consentimiento` | `Consentimiento` \| null | Sí, salvo `peligroInminente` | RN-ALMA-02: compartir los datos de una víctima con otra dependencia exige su consentimiento; la dependencia que remite debe haberlo obtenido |

**`201`:** `AtencionAphDto` (§4.4) con `estado: "PENDIENTE_APH"`, `version: 1`, `canalIngreso: "REMISION_<origen>"`
(`REMISION_EA`, `REMISION_SPYB` o `REMISION_UAD`), `origenRemision`, `tomadaPor: null`, `triaje: null`, `idAtencion`
generado (`ALMA-AAAA-NNNNNN`), `fechaCreacion` = fecha de la remisión. Header `Location` opcional.

**Efectos:**
- La atención aparece en `GET /bandeja/aph?vista=remisiones` (más antiguas primero) para todos los TAPH, COORD, ADMIN y REV.
- Auditoría `CREACION` con usuario y origen («Remisión recibida de EA»).
- **[Propuesta]** notificar a la bandeja de APH (ver Q7: polling o SSE), sin datos personales en la notificación.
- Cuando un TAPH la toma (§5.14), el front navega a «Nueva atención» y **pre-llena** documento, nombres, apellidos, teléfono,
  correo, ciudad, estrato, solicitante y motivo con lo recibido; el canal queda fijo. Por eso estos campos deben viajar
  completos y sin recortar.

**Errores:**

| HTTP | `codigo` | Cuándo |
|---|---|---|
| 400 | `VALIDACION` | campo inválido o faltante (`detalles` por campo; `persona.numeroIdentificacion`, `motivo`, …) |
| 403 | – | el rol no puede remitir, o `origenRemision` no corresponde a quien llama |
| 422 | `CONSENTIMIENTO_REQUERIDO` | sin consentimiento y sin `peligroInminente` |
| 409 | `REMISION_DUPLICADA` **[Propuesta]** | ya existe una remisión **abierta** (`PENDIENTE_APH` o `EN_GESTION_APH`) del mismo origen para la misma persona; `detalles: { "idAtencion": "ALMA-…" }` para que el origen no la duplique al reintentar |

**Privacidad (crítico).**
- La remisión viaja entre dependencias con datos de una víctima de VBG. **Enviar solo lo necesario**: `motivo` es un resumen
  operativo (por qué se pide la atención de Línea Alma), **no** historia clínica, valoración de riesgo ni notas de EA.
  El TAPH nunca debe recibir información clínica (RNF-ALMA-002) y este campo se muestra al TAPH en la bandeja.
- No loguear `motivo`, documento ni nombres; no incluirlos en notificaciones o correos.
- Registrar bajo qué consentimiento se compartió (`consentimiento` + `versionTexto`) y auditar el uso de la excepción por
  `peligroInminente`.
- Limitar tasa por usuario/origen.

**Sentido contrario (APH → EA).** La remisión **saliente** de APH hacia EA, SPyB, UAD o Psicología ya está cubierta por
`POST /derivaciones/internas` (§5.8) y `POST …/derivaciones/psicologia` (§5.6); el lado receptor de esos envíos en EA/SPyB/UAD
queda fuera de este documento.

**Trabajo de frontend asociado (no es de Backend).** Hoy **ninguna pantalla** de Equipo de Atención, SPyB ni UAD envía
remisiones: hace falta, por ejemplo, un botón «Remitir a Línea Alma» en el registro de caso de EA. Hasta entonces la bandeja
se puede probar solo llamando a este endpoint con Postman. Decidir quién lo construye.

---

## 6. Catálogos **[Front]** (`catalogos-alma.service.ts`, `mocks/alma-mock-seed.ts`)

Los códigos de la columna derecha **los inventó el front** (D-ALMA-09): Backend define los oficiales.

| `nombre` | Lo usa | Códigos placeholder del front |
|---|---|---|
| `tipos-identificacion` | paso 1 | `CC`, `TI`, `CE`, `PPT`, `PA`. **Ojo:** `core/forms/documento-identidad.ts` usa `PAS` para pasaporte; homologar. ¿Se reutiliza `/maestros/tipos-identificacion`? |
| `estratos` | caracterización | `1` … `6` (etiqueta «Estrato n»; el DTO guarda **número**, el front hace `Number()`) |
| `parentescos-solicitante` | paso 3 | `MADRE_PADRE`, `PAREJA`, `AMISTAD`, `COMPANERIA_ACADEMICA`, `DOCENTE`, `OTRO` |
| `destinos-internos` | derivación interna | `SPYB`, `EA`, `DUPLA_PSICOJURIDICA`, `MASCULINIDADES`, `UAD` |
| `rutas-externas` | ruta externa | `LINEA_123`, `CODIGO_FUCSIA`, `FISCALIA`, `COMISARIA_FAMILIA`, `POLICIA_NACIONAL`, `ICBF`, `CAIVAS` |
| `resultados-ruta-externa` | seguimiento de ruta | `ATENDIDA`, `SIN_RESPUESTA`, `NO_ACEPTA`; **el front envía el `codigo`** |
| `motivos-cierre-aph` | cierre | `NO_ACEPTA_PSICOLOGIA`, `ORIENTACION_BRINDADA`, `REMITIDA_RUTA_EXTERNA`, `SIN_RESPUESTA` |
| `textos-consentimiento` | `ConsentimientoInformado` | un solo ítem vigente: `codigo` = versión (p. ej. `v1`), `etiqueta` = **texto oficial completo** |

**Reglas:**
- `etiqueta` en *sentence case* (el front la muestra tal cual), sin siglas sin explicar, lenguaje neutro.
- **`SPYB` y `LINEA_123` están referenciados en el código** (`DESTINOS_PELIGRO_INMINENTE`, `alma.types.ts`) por la excepción
  de consentimiento de RN-ALMA-02: conservar esos códigos o exponer un indicador «admite peligro inminente» en el ítem.
- El front lee solo el **primer** ítem activo de `textos-consentimiento`; ese `codigo` viaja como `consentimiento.versionTexto`.
  Si el catálogo falla o viene vacío, la casilla de consentimiento queda **deshabilitada**: sin texto no hay consentimiento
  informado que registrar. El texto del seed es **provisional**; el oficial lo aprueba el cliente (Q9).
- Un código histórico que ya no esté activo se muestra como el propio código (dato histórico).

---

## 7. Estados, SLA y reglas de negocio

```text
(crear) ──► BORRADOR ──[PUT triaje + motivoConsulta]──► EN_GESTION_APH ──[derivar a Psicología]──► PENDIENTE_PSICOLOGIA
                                                              │                                          │
(remisión EA/SPyB/UAD) ──► PENDIENTE_APH ──[tomar]────────────┘                          (Psicología: ABIERTO_ACTIVO → EN_SEGUIMIENTO → CERRADO)
                                                              │
                                                  [cerrar APH, sin Psicología pendiente]
                                                              ▼
                                                           CERRADO
```

- **Editable por APH:** solo `BORRADOR` y `EN_GESTION_APH`.
- **Quién mueve `EN_SEGUIMIENTO`/`ABIERTO_ACTIVO`:** Psicología, no APH (pregunta abierta; el front solo lee `estado` y `numeroCaso`).
- **RN-ALMA-01 (SLA de primer contacto por Psicología):** ALTO 12 h, MEDIO 24 h, BAJO 48 h desde `fechaDerivacion`.
- **RN-ALMA-02 (consentimiento):** toda derivación (a Psicología, interna o externa) lo exige, **salvo peligro inminente
  hacia `SPYB` (interna) o `LINEA_123` (externa)**, que se audita siempre con justificación.
- **RN-ALMA-06:** cada llamada genera una atención nueva; la consulta previa no vincula.
- **Q4:** el `ALMA-…` nace en el primer guardado; un borrador abandonado consume consecutivo. **Definir retención** de borradores.
- **Triaje:** manual; el front no lo calcula (algoritmo externo).

---

## 8. Seguridad y privacidad

- Se guardan datos personales y de crisis de víctimas de VBG. **No registrar en logs** documento, nombres, teléfonos,
  correos, motivo ni notas; loguear solo `idAtencion`/`idDerivacion`/… y el usuario.
- `ALMA-AAAA-NNNNNN`, `DER-…`, `RUT-…`, `CON-…` son **consecutivos y adivinables**: la defensa es la **autorización por rol y
  por recurso** (no confiar en que el id sea secreto). No exponer el consecutivo en URLs públicas ni en correos con datos.
- **Un TAPH jamás recibe notas clínicas** (`PSICO`, `SEGTO`), ni PDF, ni accede a `/psicologia/*` (`403`).
- **`consentimiento.fechaRegistro` la genera el navegador** **[Front]** (`new Date().toISOString()`, en UTC) en el momento
  en que se marca la casilla. **[Propuesta]** el servidor registra además su propia marca de tiempo al recibirlo y valida que
  la del cliente sea razonable (no futura ni muy antigua): es la evidencia de cuándo aceptó la persona.
- `GET /personas/consulta` es un oráculo de existencia: limitar tasa y auditar cada consulta, sin devolver nada clínico a TAPH.
- Derivar a SPyB/UAD/Fiscalía comparte datos de una víctima: **registrar qué se compartió y bajo qué consentimiento**
  (`consentimiento` + `versionTexto`) y no enviar a la dependencia más de lo necesario.
- Notificaciones y correos: sin datos personales ni contenido de notas; solo `idAtencion`.
- Límite de tasa también en `GET /auditoria` y `GET /bandeja/aph` si se expone fuera de red interna.
- Borradores abandonados: definir retención (contienen datos).

---

## 9. Reporte anónimo (`POST /reportes`, ya conectado; entra a la rama por el merge de `main`)

El endpoint **existe en QA [Servidor]** y el front lo usa (`src/app/services/reporte-caso.service.ts`). El diálogo de éxito
solo se abre con `201` y muestra el código `CAS-…` **generado por el servidor**; tras el envío el formulario se bloquea y se
borra el borrador local. Los errores `400` por campo se marcan en su control, `401`, `429` y «sin conexión» se traducen.

- **C1 (D5, abierta). El endpoint pierde datos que el formulario sí pide.** `POST /reportes` solo recibe documento y fecha
  de nacimiento de la víctima, lugar, relato y ruta. **Se pierden al enviar:** nombres, correo, género y cargo de la
  víctima; medio de contacto (`correoContacto`, `whatsappContacto`); datos del presunto agresor; tipos de violencia; y las
  evidencias (el `<input type="file">` ni siquiera está enlazado). **Decisión:** ampliar el contrato o que el equipo retire
  esos pasos del formulario. Hoy la persona escribe datos que nunca se guardan.
- **El selector de campus** ahora envía el `id` (`campusId`), no el `nombre`.
- [ ] Confirmar `201` con el código `CAS-…` único generado por el servidor (antes el front lo inventaba con 4 dígitos).
- [ ] Confirmar `429` (límite de tasa) para reportes anónimos: el front ya lo traduce.
- [ ] Confirmar los mensajes de `400`: el front muestra `validationErrors` por campo.

---

## 10. Transversales

- [ ] **CORS de QA.** El 27-oct-2026 el preflight `OPTIONS` respondía `403` desde `http://localhost:4200` (incluido
  `/auth/login`). Confirmar `app.cors.allowed-origins` en QA y el dominio de producción.
- [ ] **URL de producción.** `environment.prod.ts` sigue con la URL anterior. **Nunca desplegar con `datosDemostracion: true`
  ni con algún grupo de `lineaAlma.mocks` en `true`** (hoy en `false` en prod: por eso, sin endpoints reales, APH falla ahí).
- [ ] **Formato de error** unificado en los módulos nuevos (§3) y mensajes de `400`/`422` en español y sin culpar.
- [ ] **Logs sin datos personales** en todo Línea Alma.
- [ ] **Límites de tasa** en `GET /personas/consulta`, `GET /auditoria`, `GET /bandeja/aph`.
- [ ] **Un usuario de QA por rol** (`TECNICO_APH`, `PROFESIONAL`, `COORDINADOR`, `REVISOR`, `ADMIN`) para la prueba de punta a punta.
- [ ] **Endpoint de creación de remisiones** desde EA/SPyB/UAD hacia la bandeja APH: definido en §5.18; falta decidir quién
  puede llamarlo (roles de SPyB y UAD, D-ALMA-14).
- [ ] **Notificaciones (Q7):** hoy la bandeja no se refresca sola. Decidir polling cada 30 s o SSE.

---

## 11. Decisiones abiertas (D-ALMA-\*) — pregunta, recomendación e impacto en el front

| # | Pregunta para Backend | Recomendación del front | Impacto en el front |
|---|---|---|---|
| D-ALMA-01 | Código del rol Técnico APH | `TECNICO_APH`, en `roles` del login | `ROLES_CASILDA`: una línea |
| D-ALMA-02 | Estado `BORRADOR`; `PUT triaje` mueve a `EN_GESTION_APH` y exige `motivoConsulta` | Adoptar | Alternativa `POST …/finalizar` cambia el paso 4 |
| D-ALMA-03 | Formato de error de Línea Alma | `{codigo, mensaje, detalles}` | Ninguno (acepta ambos) si los códigos van en `codigo` |
| D-ALMA-04 | Derivar sin triaje (omisión) → `422 TRIAJE_REQUERIDO` | Aceptar | Alternativa (SLA de 12 h por defecto) quita un aviso |
| D-ALMA-05 | `ultimoCasoCerrado` en la consulta previa | Añadir | Sin él, la contención post-cierre queda deshabilitada |
| D-ALMA-06 | Persistir `consentimiento.versionTexto` | Sí | Opcional para el front |
| D-ALMA-07 | ¿Quién ve `GET /auditoria`? | Decidir (nombres de usuarios internos) | Una condición en `detalle-atencion.page.html` |
| D-ALMA-08 | Documento inmutable tras crear | Ignorar o `400` en `PATCH` | Ninguno |
| D-ALMA-09 | Códigos oficiales de catálogos; cómo marcar destinos con excepción por peligro | Backend define; indicador en el ítem | Constante `DESTINOS_PELIGRO_INMINENTE` |
| D-ALMA-10 | `fechaActivacion` como `YYYY-MM-DD` | Aceptar | Con datetime, el front construye el instante |
| D-ALMA-11 | Consentimiento también en rutas externas | Mantener (RN-ALMA-02); Backend repite la regla | Se quitaría un bloque |
| D-ALMA-12 | Convivencia con `/linea-alma/registros` | Convivir hasta migrar; no compartir `ALMA-…` | Ninguno ahora |
| D-ALMA-13 | `REMISION_YA_TOMADA` (APH) vs `NOVEDAD_YA_TOMADA` (Psicología) | Dos códigos, ambos `409` | Ya traducidos |
| Q4 | `ALMA-…` al primer guardado | Aceptar; definir retención de borradores | Si fuera al finalizar, el id no aparecería en el paso 1 |
| Q5 | Lista oficial de variables de caracterización (hoy solo campos de `persona`) | Entregar la lista | Una fila en `caracterizacion-campos.ts` + un campo por variable |
| Q6 / Q9 | Catálogos oficiales y texto de consentimiento | Backend/cliente | Ver §6 |
| Q7 | Refresco de bandeja | Polling 30 s o SSE | Añadir polling |
| Q15 | Origen de `gestionSimultanea` | Campo de la atención | Ninguno |
| — | ¿«Mías» = `tomadaPor` el usuario? ¿Cerrar un `BORRADOR` es válido? ¿Crear derivaciones sobre atención `CERRADO`? | Sí / No / No | Ninguno (el front ya limita) |
| — | `cual` de remisión (módulo vigente): ¿texto o `id`? | Lo que prefiera Backend | Una línea |
| — | `resultado` de ruta externa: ¿`codigo` o texto libre? | `codigo` | Una línea |
| — | ¿Quién dispara `EN_SEGUIMIENTO`/`ABIERTO_ACTIVO`? | Psicología | Ninguno |
| D-ALMA-14 | **Quién puede crear remisiones (§5.18):** no existen roles para SPyB ni UAD | Roles `REMITENTE_SPYB` y `REMITENTE_UAD` (o integración con credenciales propias); EA usa `PROFESIONAL`/`COORDINADOR` | Ninguno en APH; el front de cada origen necesitará su rol |
| D-ALMA-15 | **Consentimiento en la remisión entrante:** ¿lo exige el servidor a quien remite? | Sí, salvo peligro inminente (RN-ALMA-02) | Ninguno |
| D-ALMA-16 | **Duplicados:** ¿`409 REMISION_DUPLICADA` si ya hay una remisión abierta del mismo origen y persona? | Sí, con `idAtencion` en `detalles` | Ninguno (el front de APH no crea remisiones) |
| D-ALMA-17 | **Al menos un medio de contacto** (teléfono o correo) obligatorio en la remisión | Sí: sin él APH no puede devolver la llamada | Ninguno |

**Campos que el front no tiene y que el equipo clínico podría esperar** (se perderían): `fechaNacimiento`, sexo, vínculo con
la UdeA y demás variables de Equipo de Atención (Q5). Hoy `persona` solo trae documento, nombres, apellidos, teléfono, correo,
ciudad y estrato; el `solicitante` (nombres, apellidos, teléfono, parentesco) lo definió el front porque el levantamiento
pide «datos del solicitante» sin listar campos.

---

## 12. Criterios de aceptación (comprobables con curl o Postman)

**Consulta previa y atenciones**
- [ ] `GET /personas/consulta` devuelve §5.1 sin información clínica para TAPH; `400` si faltan parámetros.
- [ ] `POST /atenciones-aph` genera `ALMA-…`, `BORRADOR`, `version 1`; `400` con claves de campo del DTO.
- [ ] `PATCH` sin `version` o desfasada → `409 CONFLICTO_VERSION`; en estado no editable → `422 ATENCION_NO_EDITABLE`.
- [ ] `PATCH` con `tipoIdentificacion`/`numeroIdentificacion` no cambia el documento.
- [ ] `PUT triaje` acepta una sola forma; omisión exige justificación ≥ 10; sin `motivoConsulta` → `422 ATENCION_INCOMPLETA`; mueve a `EN_GESTION_APH`.
- [ ] Derivar sin consentimiento → `422 CONSENTIMIENTO_REQUERIDO`; con él → `201` con `sla.venceEn = fechaDerivacion + 12/24/48 h` y `ahoraServidor`.
- [ ] Derivar sin triaje (incluida omisión) → `422 TRIAJE_REQUERIDO`.
- [ ] La atención derivada aparece en la bandeja de Psicología con el mismo `sla` (F1/F3).
- [ ] Cierre con rutas abiertas → `422 RUTAS_PENDIENTES`; con Psicología pendiente → `422 PSICOLOGIA_PENDIENTE`.
- [ ] Un TAPH no recibe notas `PSICO`/`SEGTO` en `GET` y recibe `403` en `/psicologia/*`.

**Derivaciones, rutas, bandeja, contención, auditoría**
- [ ] Derivación interna sin consentimiento y sin peligro → `422`; con peligro hacia `SPYB` → `201`, `peligroInminente: true` y auditado.
- [ ] Peligro inminente hacia un destino distinto de `SPYB` (interna) o `LINEA_123` (externa) → `422 CONSENTIMIENTO_REQUERIDO`.
- [ ] Ruta externa `CERRADA` sin `resultado` → `400 detalles.resultado`.
- [ ] `GET /bandeja/aph?vista=remisiones` devuelve solo `PENDIENTE_APH` de origen EA/SPYB/UAD, paginado y filtrable por `origen`.
- [ ] Dos `tomar` simultáneos: uno `200`, otro `409 REMISION_YA_TOMADA`.
- [ ] `POST /remisiones-aph` con `origenRemision` válido → `201` con `PENDIENTE_APH`, `canalIngreso REMISION_<origen>`, `version 1`, `tomadaPor null`, y aparece en `GET /bandeja/aph?vista=remisiones`.
- [ ] `POST /remisiones-aph` con un `origenRemision` que no corresponde al rol de quien llama → `403`; con un TAPH como llamante → `403`.
- [ ] `POST /remisiones-aph` sin consentimiento y sin `peligroInminente` → `422 CONSENTIMIENTO_REQUERIDO`; con documento o motivo inválidos → `400` con `detalles` por campo.
- [ ] Un segundo `POST /remisiones-aph` idéntico mientras la primera sigue abierta → `409 REMISION_DUPLICADA` con el `idAtencion` existente (si se adopta D-ALMA-16).
- [ ] La remisión se audita (`CREACION`, con origen) y su `motivo` no aparece en logs ni notificaciones.
- [ ] Contención sobre un caso no cerrado o de otra persona → `422 PERSONA_SIN_CASO_CERRADO`; con éxito no cambia el estado del caso ni el contador de seguimientos.
- [ ] `GET /auditoria` devuelve eventos ordenados y no ofrece escritura; el `detalle` no contiene notas ni datos clínicos.
- [ ] Todos los catálogos de §6 responden con la forma indicada; `textos-consentimiento` trae el texto oficial.

**Rol, seguridad y errores**
- [ ] El login de un usuario `TECNICO_APH` devuelve `TECNICO_APH` en `roles`.
- [ ] Cada acción que la UI oculta (matriz §4.3) devuelve `403` al rol sin permiso.
- [ ] Los logs no contienen documentos, nombres, motivo ni notas.
- [ ] Los errores de negocio traen `codigo` de §4.5 y `mensaje` en español.

**Errores de QA y reporte**
- [ ] A1: el payload de §2 devuelve `200` o un `4xx` explicado; nunca `500`.
- [ ] A2: `GET /maestros/instancias-remision?tipoRemisionId=` devuelve instancias con `id` y `nombre` para «Interna» y «Externa».
- [ ] C1: decisión tomada sobre los datos que `POST /reportes` descarta.

---

## 13. Cómo comprobar rápido (con un token de QA)

```bash
BASE=https://casildaqa.duckdns.org/api-casilda
H="Authorization: Bearer $TOKEN"

# A2 — ¿hay instancias por tipo de remisión? ¿traen "nombre"?
curl -s -H "$H" $BASE/maestros/tipos-remision
curl -s -H "$H" "$BASE/maestros/instancias-remision?tipoRemisionId=<id>"

# A1 — reproducir el 500; repetir con notaAph corta y con fechaHora con zona
curl -s -H "$H" -H "Content-Type: application/json" -X POST $BASE/linea-alma/registros/pestana/3 \
  -d '{"id":4,"atencionAph":{"fechaHora":"2026-11-09T11:30:00-05:00","idProtocoloAph":1,"practicoTriage":true,"idResultadoTriage":1,"notaAph":"Prueba corta","aceptaPsicologia":true,"requiereRemision":false}}'

# B2 — hoy da 404; cuando exista, 200/401/403 según el rol
curl -s -o /dev/null -w "%{http_code}\n" -H "$H" "$BASE/alma/personas/consulta?tipoIdentificacion=CC&numeroIdentificacion=1000000001"
```

**Datos de prueba que usa el mock** (ficticios; sirven como escenarios para el servicio real): documentos `CC` `1000000001`
… `1000000010`. `1000000002` y `1000000008` tienen **seguimiento activo**; `1000000003` tiene un **caso cerrado**
(`CAS-2026-000003`); `1000000001` es persona nueva. Remisiones pendientes: `2000000001`, `2000000002`; **`2000000003`** simula
una toma concurrente (siempre `409 REMISION_YA_TOMADA`).

---

## 14. Qué hará el frontend cuando exista cada endpoint

El front tiene un interruptor por grupo en `environment.lineaAlma.mocks` (`true` en desarrollo, `false` en producción). Al
publicarse un grupo se pone en `false` **sin tocar componentes**; las llamadas ya apuntan a estas rutas y `AlmaApiClient`
traduce los errores.

| Grupo | Endpoints |
|---|---|
| `catalogos` | `GET /catalogos/{nombre}` |
| `personas` | `GET /personas/consulta` |
| `atencionesAph` | `/atenciones-aph` y sus acciones |
| `derivaciones` | `/derivaciones/internas`, `/rutas-externas` |
| `bandejaAph` | `/bandeja/aph`, `…/tomar` |
| `contenciones` | `/contenciones-post-cierre` |
| `auditoria` | `GET /auditoria` |
| *(sin grupo)* | `POST /remisiones-aph`: el front de APH no lo llama; lo consumirán las pantallas de EA, SPyB y UAD cuando se construyan |

- Cambiar el nombre de un campo implica ajustar `aph/services/*` (un archivo por grupo). Cambiar códigos de catálogo: solo
  `DESTINOS_PELIGRO_INMINENTE`.
- **Cambios compatibles (aditivos):** campos opcionales nuevos en respuestas (p. ej. `ultimoCasoCerrado`, `versionTexto`),
  catálogos o códigos nuevos activos, nuevos valores de estado de derivación (el front mostraría el valor crudo).
- **Cambios que rompen el front:** renombrar campos o estados; cambiar `estrato` a texto; devolver notas clínicas a TAPH;
  cambiar el significado de `version`; convertir arreglos en paginados; renombrar `vista`/`origen`; cambiar el código de un
  error que el front traduce (§4.5).
- Con el servicio real se verifican los escenarios del plan (cédulas ficticias de §13). Los componentes compartidos
  (`PanelDerivaciones`, `ContencionPostCierreForm`, `AuditTrail`, `ConsentimientoInformado`) los reutiliza Psicología sin cambios.
