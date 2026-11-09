# Contratos de API — Módulo Línea Alma (submódulo APH): guía, convenciones y decisiones

> **Para:** equipo de Backend de CASILDA (y, por las fronteras, el desarrollo de Psicología en el front)
> **De:** equipo de Frontend (`casilda-frontend`, Angular 21) — submódulo APH
> **Fecha:** 6 de noviembre de 2026
> **Estado:** **propuesta v0**. Backend **no ha publicado ningún endpoint de Línea Alma** que el front haya
> verificado (no se consultó su OpenAPI ni su repositorio). Todo lo que sigue sobre el servidor es **propuesta
> pendiente de confirmar**. El front ya construyó las pantallas contra un mock que replica estos contratos
> (`src/app/linea-alma/mocks/`).
>
> Nota de existencia previa: el front ya consume `{apiBaseUrl}/linea-alma/registros…` (`src/app/services/linea-alma.service.ts`,
> pantalla heredada `/linea-alma/atencion-pr`). **Es otro recurso y este contrato no lo toca**; ver D-ALMA-12.

## Documentos de este paquete

| Archivo | Contenido |
|---|---|
| `README.md` (este) | Guía para proponer contratos (H-0.4), plantilla, convenciones, permisos, interruptores, decisiones. |
| `contrato-aph-atenciones.md` | `GET /personas/consulta` (F2), `/atenciones-aph` (crear, leer, actualizar, triaje, derivar a Psicología F1/F3, cierre). |
| `contrato-aph-derivaciones-bandeja-contencion.md` | Derivaciones internas, rutas externas (F6), bandeja APH, tomar remisión, contención post-cierre, auditoría, catálogos. |

Fuentes: `docs/plan-implementacion-front-linea-alma.md` (plan, Anexo A) y
`docs/levantamiento-requerimientos-linea-alma.md`. Skill aplicado: `.claude/skills/contrato-backend/SKILL.md`.

---

## 1. Cómo proponer un contrato a Backend (H-0.4)

1. Copie la plantilla (§2) a `docs/contratos/linea-alma/contrato-<tema>.md`.
2. Todo lo que afirme del front se verifica leyendo el archivo y se cita su ruta. Todo lo que afirme del
   backend sin haberlo visto se rotula **Propuesta / pendiente**.
3. Cumpla la **Definición de Listo** del plan §10.3: método y ruta · roles (§4 de este README) · request y
   response con **ejemplo JSON** · validaciones y reglas `RN-ALMA-*` · códigos de error · paginación/filtros ·
   enums · efectos colaterales (notificaciones, correos, auditoría).
4. Abra un PR con la etiqueta `contrato`. Lo revisa Backend y, si toca una frontera (F1–F7), también la otra
   persona del front (cambios en `contracts/frontera` solo por PR con ambos revisores; plan §10.1).
5. Mientras Backend responde, el front sigue contra el mock (§5). Al publicarse el servicio se apaga el
   interruptor de su grupo **sin tocar componentes**.

## 2. Plantilla

```markdown
# Contrato de API — <tema>
> **Para / De / Fecha / Estado** (qué existe hoy y qué falta, con fecha absoluta)
## 1. Contexto y qué se necesita (+ archivos de referencia del front)
## 2. Decisiones que necesitamos de Backend   (decisión · opciones · recomendación · impacto en el front)
## 3. Endpoint(s)    (método, ruta relativa, roles, request/response JSON, códigos de estado)
## 4. Diccionario de campos   (campo · tipo · obligatorio · regla · control del front)
## 5. Validaciones en servidor
## 6. Errores   ({ codigo, mensaje, detalles })
## 7. Maestros
## 8. Privacidad y seguridad
## 9. Compatibilidad
## 10. Criterios de aceptación   (casillas comprobables con curl/Postman)
## 11. Qué hará el frontend cuando el endpoint exista
```

## 3. Convenciones comunes (propuesta)

Verificado en el front: `shared/http/alma-api.client.ts`, `shared/http/alma-error.ts`, `shared/types/alma-dto.ts`.

| Tema | Convención |
|---|---|
| Prefijo | `{apiBaseUrl}/alma` (`AlmaApiClient.PREFIJO`). Las rutas de los contratos son relativas a él. `{apiBaseUrl}` sale de `src/environments/`. |
| Autenticación | JWT en `Authorization: Bearer` (lo pone `authInterceptor`). `401` cierra sesión en el front; `403` solo falla la operación. |
| JSON | `camelCase` (el ER usa `snake_case`; el front adapta en `aph/services/*`). Ver Q14. |
| Fechas | ISO-8601 **con zona** (`2026-11-06T14:30:00-05:00`; el front también envía `Z`). Excepción: `fechaActivacion` de rutas externas viaja `YYYY-MM-DD` (D-ALMA-10). |
| Listas paginadas | `?page=0&size=20` → `{ "items": [], "page": 0, "size": 20, "total": 0 }`. El front usa `size=10`. |
| Listas por contexto | `derivaciones/internas`, `rutas-externas`, `auditoria` devuelven **arreglo simple** (no paginado). |
| Concurrencia | Recursos mutables exponen `version` (entero). `PATCH`/acciones la reciben; si no coincide → `409 CONFLICTO_VERSION`. Cada escritura exitosa la incrementa. |
| Error estándar | `{ "codigo": "STRING", "mensaje": "texto en español", "detalles": {} }`. Para `400`, `detalles` es `{ "<campoDelDTO>": "mensaje" }` (clave con punto para anidados: `persona.numeroIdentificacion`). Ver D-ALMA-03. |
| Catálogos | `GET /catalogos/{nombre}` → `[ { "codigo", "etiqueta", "activo" } ]`. El front solo muestra `activo: true`. |
| Zona horaria / reloj | El SLA se calcula con `ahoraServidor` y `venceEn`; el front **no** usa el reloj del navegador para decidir «vencido» (R6). |

### Códigos de error que el front ya traduce a mensajes

Verificado en `shared/http/alma-error.ts` (`MENSAJES_POR_CODIGO`): `CONSENTIMIENTO_REQUERIDO`,
`REMISION_YA_TOMADA`, `NOVEDAD_YA_TOMADA`, `CONFLICTO_VERSION`, `ATENCION_NO_EDITABLE`, `TRIAJE_REQUERIDO`,
`RUTAS_PENDIENTES`, `PSICOLOGIA_PENDIENTE`, `PERSONA_SIN_CASO_CERRADO`. Para `400`/`422` con otro código se muestra el
`mensaje` del servidor (por eso debe estar en español y no culpabilizar). `5xx` muestra un texto genérico.
**Los códigos `VALIDACION`, `ATENCION_INCOMPLETA`, `ATENCION_NO_ENCONTRADA`, `RUTA_NO_ENCONTRADA`,
`CATALOGO_NO_ENCONTRADO` los usa el mock** (`mocks/aph.handlers.ts`) y se proponen como estándar.

## 4. Matriz de roles y permisos (verificado en `shared/permisos/alma-permisos.ts`)

Los permisos los aplica la UI (acción oculta + `almaPermisoGuard`); **el Backend es la autoridad y debe devolver
`403`** a lo que la UI oculta. «Eliminar» no existe (Q13).

| Permiso (clave) | ADMIN | COORD | PROF (psicólogo) | TAPH | REV | USUARIO |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `alma.aph.crear` | ✔ | ✔ | – | ✔ | – | – |
| `alma.aph.consultar` | ✔ | ✔ | ✔ (solo notas APH) | ✔ | ✔ | – |
| `alma.aph.editar` | ✔ | ✔ | – | ✔ | – | – |
| `alma.aph.cerrar` | ✔ | – | – | ✔ | – | – |
| `alma.aph.bandeja` *(clave añadida al plan)* | ✔ | ✔ | – | ✔ | ✔ | – |
| `alma.psicologia.crear/consultar/editar` | ✔ | ✔ | ✔ | – | consultar | – |
| `alma.psicologia.cerrar` | ✔ | – | ✔ | – | – | – |
| `alma.notasClinicas.consultar` | ✔ | ✔ | ✔ | **–** | ✔ | – |
| `alma.pdf.consultar` / `alma.pdf.exportar` | ✔ | ✔ | ✔ | **–** | consultar | – |
| `alma.alertaSeguimiento.consultar` | ✔ | ✔ | ✔ | ✔ | ✔ | – |

Rutas del front: `/linea-alma/aph/{nueva, remisiones, atenciones/:idAtencion}` (`aph/routes.ts`).

## 5. Interruptores mock/real (verificado en `src/environments/environment*.ts` y `mocks/alma-mock.interceptor.ts`)

`environment.lineaAlma.mocks` (hoy `true` en desarrollo, `false` en `environment.prod.ts`). Poner un grupo en
`false` hace que sus peticiones salgan a red; no se cambia ningún componente.

| Grupo | Endpoints que cubre | Contrato |
|---|---|---|
| `catalogos` | `GET /catalogos/{nombre}` | derivaciones-bandeja-contencion |
| `personas` | `GET /personas/consulta` | atenciones |
| `atencionesAph` | `/atenciones-aph` y sus acciones | atenciones |
| `derivaciones` | `/derivaciones/internas`, `/rutas-externas` | derivaciones-bandeja-contencion |
| `bandejaAph` | `/bandeja/aph`, `…/tomar` | derivaciones-bandeja-contencion |
| `contenciones` | `/contenciones-post-cierre` | derivaciones-bandeja-contencion |
| `auditoria` | `GET /auditoria` | derivaciones-bandeja-contencion |

## 6. Fronteras con Psicología

| ID | Frontera | Contrato donde vive |
|---|---|---|
| F1 | Derivación APH → Psicología (`idAtencion`, triaje, nota, consentimiento, canal, `fechaDerivacion`, `sla`) | atenciones §3.6 |
| F2 | Recontacto (`seguimientoActivo`, `tieneCasoCerrado`; **+ `ultimoCasoCerrado`**) | atenciones §3.1 |
| F3 | SLA (`horasLimite`, `venceEn`, `ahoraServidor`) | atenciones §3.6 y bandeja |
| F5 | Consentimiento (`otorgado`, `medio`, `fechaRegistro`; **+ `versionTexto`**) | atenciones §4, derivaciones |
| F6 | Derivaciones/rutas y contención reutilizables con `contexto = { tipo, id }` | derivaciones-bandeja-contencion |
| F7 | Concurrencia y errores (`version`, 409) | este README §3 |

## 7. Registro de decisiones y pendientes (D-ALMA-*)

Cada una tiene un supuesto con el que el front ya funciona. «Impacto» = qué cambia en el front según la respuesta.

| # | Decisión | Recomendación | Impacto en el front | Relacionada |
|---|---|---|---|---|
| **D-ALMA-01** | **Rol del Técnico APH:** el front asume el código `TECNICO_APH` (en `auth.service.ts`: `ROLES_CASILDA`, normalizador que reconoce cualquier rol que contenga `APH`). ¿Existe en `rol.codigo`? ¿Qué trae el login en `rol`/`roles`? | Crear el rol `TECNICO_APH` (nombre «Técnico APH») y devolverlo en `roles` del login. | Si el código difiere, se cambia `ROLES_CASILDA` y la tabla de §4: una línea. | P-02 |
| **D-ALMA-02** | **Estado `BORRADOR`** (no está en el levantamiento). `POST /atenciones-aph` crea en `BORRADOR` y genera `ALMA-…`; **`PUT …/triaje` mueve `BORRADOR → EN_GESTION_APH`** y exige `motivoConsulta` no vacío (si falta: `422 ATENCION_INCOMPLETA` con `detalles.motivoConsulta`). Tomar una remisión la pasa a `EN_GESTION_APH` directamente. | Adoptar así. Alternativa: endpoint `POST …/finalizar`. | Con alternativa, el paso 4 del stepper llamaría `finalizar` antes del triaje. | Q1, Q4 |
| **D-ALMA-03** | **Formato de error:** el plan (A.1) fija `{ codigo, mensaje, detalles }`; el resto del backend (p. ej. `/contenidos`) responde `400 { message, validationErrors }`. El front de Alma acepta **ambos** (`alma-error.ts` lee `detalles`, `validationErrors`, `mensaje` y `message`). | Un solo formato por módulo: el de A.1 para Alma. | Ninguno si Backend usa cualquiera de los dos; solo cambia qué se documenta. | Q14 |
| **D-ALMA-04** | **Derivar a Psicología sin triaje:** si el triaje se omitió por peligro inminente no hay `horasLimite`. Supuesto del front: `422 TRIAJE_REQUERIDO` también con omisión; la persona debe registrar el triaje después (un `PUT triaje` posterior es válido mientras la atención sea editable). | Aceptar. Alternativa: SLA por defecto del nivel más exigente (12 h). | Con alternativa se quita el aviso en `paso-derivacion`. | Q3 |
| **D-ALMA-05** | **Adición a F2:** `ultimoCasoCerrado: { numeroCaso, fechaCierre } \| null` además de `tieneCasoCerrado`. Sin él la contención post-cierre no sabe sobre qué caso registrarse. | Añadir (aditivo). Es dato no clínico. | Sin él, H-1.7 queda deshabilitado. | Q8 |
| **D-ALMA-06** | **Adición a F5:** `consentimiento.versionTexto` (código de versión del texto aceptado). | Añadir y guardarlo: sin versión no se puede demostrar qué texto aceptó la persona. | Opcional para el front (`versionTexto?`). | Q9 |
| **D-ALMA-07** | **Acceso a auditoría por rol:** el front muestra `GET /auditoria` a quien tenga `alma.aph.consultar` (ADMIN, COORD, PROF, TAPH, REV). La matriz del levantamiento no lo define. | Decidir; la auditoría contiene nombres de usuarios internos. | Se cambia la condición en `detalle-atencion.page.html`. | RNF-ALMA-003 |
| **D-ALMA-08** | **Documento inmutable en PATCH:** `persona.tipoIdentificacion`/`numeroIdentificacion` solo se envían al crear; el front los deshabilita después (`nueva-atencion.page.ts`, `construirDto`). | Ignorar o rechazar (`400`) si llegan en PATCH. | Ninguno. | – |
| **D-ALMA-09** | **Catálogos placeholder:** los códigos de `alma-mock-seed.ts` (p. ej. `NO_ACEPTA_PSICOLOGIA`, `LINEA_123`) son inventados por el front; los oficiales no se han entregado. | Backend define los códigos. Excepción: **`SPYB` y `LINEA_123` están en el código** (`DESTINOS_PELIGRO_INMINENTE`, `alma.types.ts`) por la excepción de RN-ALMA-02: o se conservan o se expone un indicador en el catálogo. | Si cambian, se actualiza esa constante. | Q6 |
| **D-ALMA-10** | **`fechaActivacion` de rutas externas** viaja como fecha `YYYY-MM-DD` (campo `type="date"`), no datetime. | Aceptar fecha; Backend la interpreta en zona del servidor. | Con datetime, se construye el instante en el front. | – |
| **D-ALMA-11** | **Consentimiento en rutas externas:** el plan H-1.5 solo lo exige a las internas; RN-ALMA-02 lo exige a «rutas externas/internas». El front lo exige a **ambas**, salvo `peligroInminente` hacia `SPYB` (interna) o `LINEA_123` (externa). | Mantener (RN-ALMA-02 prevalece). Backend debe repetir la regla. | Si solo internas, se quita el bloque en la rama externa del panel. | RN-ALMA-02 |
| **D-ALMA-12** | **Convivencia con `/linea-alma/registros`** (módulo heredado, `LineaAlmaService`). ¿Se reemplaza, se migra o conviven? | Convivir hasta migrar datos; no reutilizar `ALMA-…` entre ambos. | Ninguno ahora. | – |
| **D-ALMA-13** | **Código de «ya tomada»:** APH usa `REMISION_YA_TOMADA` (409); Psicología, `NOVEDAD_YA_TOMADA` (plan A.3-3). | Dos códigos, mismo `409`. | El front ya traduce ambos. | RNF-ALMA-001 |

### Pendientes del plan (§12.1) que afectan a APH

| Q | Cómo afecta a APH | Supuesto del front |
|---|---|---|
| Q1 estados | Etiquetas, filtros y contratos de estado | `alma.types.ts` es el único lugar; estados del flujo para la atención |
| Q2 `id_caso` FK | Derivaciones/rutas/contención se asocian por `contexto = { tipo, id }` | `ATENCION_APH` + `ALMA-…` |
| Q3 SLA | Qué se muestra en bandeja «mis atenciones» y detalle | Reloj desde `fechaDerivacion`; Backend entrega `venceEn` y `ahoraServidor` |
| Q4 momento del `ALMA-…` | Se genera al primer guardado (borrador) | Sí; un borrador consume consecutivo |
| Q5 variables de caracterización | Campos de `persona` solo | `caracterizacion-campos.ts` único punto de extensión |
| Q6 catálogos | Todos los de APH | Placeholders (D-ALMA-09) |
| Q8 contención puntual | Contención post-cierre no suma seguimientos | Nota `POST_CIERRE` |
| Q9 consentimiento digital | Texto, versión, archivo | Texto desde catálogo; casilla + marca de tiempo; sin archivo |
| Q13 «Eliminar» | No se construye | – |
| Q14 camelCase | Todo el contrato | `camelCase` |
| Q15 gestión simultánea | Alerta en detalle | Campo `gestionSimultanea` en la atención |
