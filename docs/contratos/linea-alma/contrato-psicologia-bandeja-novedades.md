# Contrato de API — Línea Alma · Psicología: bandeja, novedades, intentos y primer contacto

> **Para:** equipo de Backend de CASILDA (y desarrollo de APH en el front, por las fronteras F1/F2/F3/F5)
> **De:** equipo de Frontend (`casilda-frontend`) — submódulo Psicología (Jonathan)
> **Fecha:** 9 de noviembre de 2026
> **Estado:** propuesta v0. **Ningún endpoint de este documento ha sido verificado en el backend.** El front
> está construido y probado contra un mock fiel (`src/app/linea-alma/mocks/psicologia.handlers.ts`, grupos
> `bandejaPsicologia` y `novedades`; pruebas en `psicologia.handlers.spec.ts`). Convenciones, roles y
> decisiones `D-ALMA-*`: ver `README.md`. Decisiones propias: `D-PSI-*` (§2).

Rotulado: **[Front]** = verificado leyendo el archivo citado · **[Propuesta]** = pendiente de confirmar con Backend.

---

## 1. Contexto y qué se necesita

El psicólogo toma una novedad de la **cola compartida** respetando el SLA (RN-ALMA-01), ejecuta el protocolo de
hasta 9 intentos (RN-ALMA-03), consolida el caso en el primer contacto efectivo (nace el `CAS-…`, RF-ALMA-001)
y nunca pisa el trabajo de otra profesional (RNF-ALMA-001). Se necesitan la bandeja con SLA, la toma y
liberación con bloqueo optimista, el detalle de la novedad (con notas APH, sin nada clínico), los intentos y el
primer contacto.

### Archivos de referencia en el front

| Archivo | Rol |
|---|---|
| `src/app/linea-alma/shared/types/alma-psicologia-dto.ts` | DTO de Psicología **[Front]** |
| `src/app/linea-alma/shared/types/alma.types.ts` | Enums: estados de atención y de caso, protocolo, decisiones (J-0.1) **[Front]** |
| `src/app/linea-alma/psicologia/services/bandeja-psicologia.service.ts`, `novedades-psicologia.service.ts`, `notificaciones-psicologia.service.ts` | Llamadas **[Front]** |
| `src/app/linea-alma/psicologia/pages/bandeja-psicologia/`, `pages/novedad/` | Pantallas (J-1.1, J-1.2) **[Front]** |
| `src/app/linea-alma/psicologia/components/intentos-contacto/`, `components/primer-contacto/` | Intentos (J-1.3) y primer contacto (J-1.4) **[Front]** |
| `src/app/linea-alma/psicologia/dominio/protocolo-intentos.ts` | Reglas puras del protocolo, con pruebas **[Front]** |
| `src/app/linea-alma/shared/sla/sla.ts`, `reloj-servidor.service.ts`, `components/sla-badge/` | Semáforo SLA (J-0.3, F3) **[Front]** |
| `src/app/linea-alma/shared/concurrencia/bloqueo-optimista.ts` | `version` + 409 (J-0.4, F7) **[Front]** |
| `src/app/linea-alma/mocks/psicologia.handlers.ts`, `psicologia-mock-seed.ts` | Validaciones, códigos y seed que el front ya espera **[Front]** |

---

## 2. Decisiones que necesitamos de Backend (D-PSI-*)

| # | Decisión | Recomendación | Impacto en el front |
|---|---|---|---|
| **D-PSI-01** | **Entidad de la novedad antes del caso (Q2).** `atencion_psicologia.id_caso` es FK, pero intentos y toma ocurren antes de que exista el caso. El front identifica la novedad por `idAtencion` (`ALMA-…`) y espera que `atencion_psicologia` admita `id_caso` nulo (o que exista otra entidad de gestión) hasta el primer contacto. | `id_caso` nullable; se rellena en el primer contacto o en la resolución del recontacto. | Ninguno: todas las rutas usan `idAtencion` hasta `numeroCaso`. |
| **D-PSI-02** | **Estados (Q1).** Atención/novedad: `PENDIENTE_PSICOLOGIA` → `ABIERTO_ACTIVO` (primer contacto) → `EN_SEGUIMIENTO` (desde el primer seguimiento) → `CERRADO`. Caso (ER): `ABIERTO` (creación) → `ACTIVO` (primer seguimiento) → `EN_CIERRE` (la persona no desea continuar) → `CERRADO`. | Adoptar; `EN_CIERRE` es opcional (el front lo tolera ausente). | Un solo archivo (`alma.types.ts`). |
| **D-PSI-03** | **`tomadaPorMi`** lo calcula el servidor comparando con la sesión del JWT (el front no compara nombres). | Añadir el booleano en bandeja y detalle. | Sin él, el front no puede distinguir «mi» novedad de forma fiable. |
| **D-PSI-04** | **Toma y liberación.** `POST …/tomar` con `version`: `409 NOVEDAD_YA_TOMADA` si otra sesión la tiene; **re-tomar la propia es idempotente**. `POST …/liberar` solo por quien la tomó (`422 NOVEDAD_NO_TOMADA`). Las acciones (intentos, primer contacto) exigen tenerla tomada. ¿Debe haber liberación automática por inactividad? | Sin liberación automática en v1; coordinación la libera a mano si hace falta. | Si se agrega, basta con que `tomadaPor` vuelva a `null`. |
| **D-PSI-05** | **SLA (Q3).** El reloj arranca en `fechaDerivacion`, horas corridas; el servidor entrega `venceEn` y `ahoraServidor` en cada respuesta (F3). Umbrales del semáforo: verde > 50 %, amarillo 50–20 %, rojo < 20 % o vencido (configurables en `UMBRALES_SLA_POR_DEFECTO`). Al vencer **no pasa nada automático**: sigue en la cola marcada en rojo. El filtro `semaforo=` lo resuelve el servidor con los mismos umbrales. | Confirmar con Laura Murillo. | Cambiar los umbrales es una constante. |
| **D-PSI-06** | **Intentos (Q11).** Reglas duras del servidor: 1–9, resultado del catálogo, fecha no futura, nota mínima, justificación desde el 4.º. «Distinto día y horario» es **advertencia** en el front y no se rechaza en el servidor. Con el 9.º sin éxito el servidor cierra la atención (`CERRADO`, `cierre.motivo = NO_CONTACTO`). | Adoptar. | Si el servidor rechaza día/horario repetidos, el front ya muestra el `mensaje` del 400. |
| **D-PSI-07** | **Primer contacto y caso activo (RN-ALMA-06).** Si la persona tiene un caso activo y el request no trae `vincularA`, el servidor responde `422 CASO_ACTIVO_EXISTENTE` con el resumen del caso en `detalles`; el front pide la decisión y reenvía `vincularA = numeroCaso` (vincular, `201` con `vinculado: true`) o `vincularA = "CASO_NUEVO"` (hechos distintos). Si el recontacto ya se resolvió como `CASO_NUEVO` en `/recontactos`, no se exige. | Adoptar. Nunca vincular por defecto. | Es el único flujo del front. |
| **D-PSI-08** | **Borrador del primer contacto (RF-ALMA-005)** se guarda **en el navegador** (`sessionStorage`, `BorradorLocal`) hasta enviar; no hay endpoint de borrador. Alternativa: `PATCH /psicologia/novedades/{id}/borrador`. | Sin endpoint en v1. | Con endpoint, se conecta en `PrimerContactoComponent.guardarBorrador()`. |
| **D-PSI-09** | **Notificaciones (Q7).** `GET /psicologia/notificaciones` con contadores; el front hace **polling cada 30 s** detrás de `NotificacionesPsicologiaService`. Si Backend ofrece SSE/WebSocket, se cambia solo ese servicio. La notificación de recontacto (RF-ALMA-003) llega a la **bandeja compartida** (marca `recontacto` + contador), no a una profesional. | Polling en v1. | Ninguno. |
| **D-PSI-10** | **Caracterización en el primer contacto (Q5).** El request lleva `persona` con los campos de `caracterizacion-campos.ts` (los mismos de APH, F4); el servidor los actualiza en `persona`. El documento no cambia. | Adoptar. | Una fila por variable nueva (ver D-ALMA Q5). |
| **D-PSI-11** | **Permisos COORDINADOR.** El plan §11 da a COORD crear/consultar/editar en Psicología, pero J-3.2 dice «COORDINADOR y REVISOR en solo lectura». El front sigue la **matriz §11** (`alma-permisos.ts`): COORD puede tomar, registrar intentos, primer contacto y seguimientos; **no cierra** casos. | Confirmar con el equipo; Backend debe devolver `403` donde corresponda. | Cambiar una fila de `PERMISOS_POR_ROL`. |

---

## 3. Endpoints

Prefijo `{apiBaseUrl}/alma` (README §3). JWT en todos. Errores: README §3 y §6 de este documento.

### 3.1 `GET /bandeja/psicologia` — cola compartida con SLA (J-1.1, `RF-ALMA-PSI-001`)

- **Roles [Propuesta]:** PSI, COORD, ADMIN, REV.
- **Query:** `triaje` (`ALTO|MEDIO|BAJO`), `semaforo` (`VERDE|AMARILLO|ROJO`), `estado` (`PENDIENTE_PSICOLOGIA|CERRADO`;
  el front envía `PENDIENTE_PSICOLOGIA` por defecto; `CERRADO` = cerradas por «No contacto»), `documento`
  (contiene), `page`, `size` (el front usa 10).
- **Orden [Propuesta]:** pendientes primero por `venceEn` ascendente (**menor tiempo restante primero**); cerradas al final.
- **Respuesta `200`** (`PaginaAlma<BandejaPsicologiaItemDto>` **[Front]**):

```json
{
  "items": [
    {
      "idAtencion": "ALMA-2026-000123",
      "version": 3,
      "persona": { "tipoIdentificacion": "CC", "numeroIdentificacion": "1000000001", "nombreCompleto": "Persona de Prueba Uno" },
      "triaje": "ALTO",
      "canalIngreso": "LLAMADA",
      "estado": "PENDIENTE_PSICOLOGIA",
      "fechaDerivacion": "2026-11-06T09:15:00-05:00",
      "tomadaPor": null,
      "tomadaPorMi": false,
      "recontacto": false,
      "intentosRealizados": 0,
      "sla": { "horasLimite": 12, "venceEn": "2026-11-06T21:15:00-05:00", "ahoraServidor": "2026-11-06T14:30:00-05:00" }
    }
  ],
  "page": 0, "size": 10, "total": 1
}
```

- `sla.ahoraServidor` debe ser la hora **de la respuesta** (el front ancla su reloj a ese valor, R6).
- **Error `400`** si `triaje`/`estado` no son válidos (`detalles.triaje` / `detalles.estado`).

### 3.2 `GET /psicologia/notificaciones` — contadores (Q7, D-PSI-09)

- **Roles:** los de la bandeja. **Respuesta `200`:**
  `{ "novedadesPendientes": 5, "recontactosPendientes": 1, "slaVencidos": 1, "ahoraServidor": "2026-11-06T14:30:00-05:00" }`.

### 3.3 `POST /bandeja/psicologia/{idAtencion}/tomar` — tomar (J-1.2, `RNF-ALMA-001`)

- **Roles:** PSI, COORD, ADMIN. **Request:** `{ "version": 3 }`. **Respuesta `200`:** `NovedadPsicologiaDto` (§3.5) con `tomadaPor`, `tomadaPorMi: true` y `version + 1`.
- **Errores:** `409 NOVEDAD_YA_TOMADA` (`detalles: { tomadaPor, tomadaEn }`) · `409 CONFLICTO_VERSION` (`detalles.versionActual`) ·
  `422 NOVEDAD_CERRADA` · `404 NOVEDAD_NO_ENCONTRADA` (no existe o APH no la derivó).
- **Efecto colateral:** auditoría (`ACTUALIZACION`, «Novedad tomada»).

### 3.4 `POST /bandeja/psicologia/{idAtencion}/liberar` — liberar

- **Request:** `{ "version": 4 }`. **Respuesta `200`:** `NovedadPsicologiaDto` con `tomadaPor: null`.
- **Errores:** `422 NOVEDAD_NO_TOMADA` si no la tiene la sesión · `409 CONFLICTO_VERSION` · `404`.

### 3.5 `GET /psicologia/novedades/{idAtencion}` — detalle (J-1.2)

- **Roles:** PSI, COORD, ADMIN, REV. **Respuesta `200`** (`NovedadPsicologiaDto` **[Front]**):

```json
{
  "idAtencion": "ALMA-2026-000123",
  "version": 4,
  "estado": "PENDIENTE_PSICOLOGIA",
  "canalIngreso": "LLAMADA",
  "origenRemision": null,
  "persona": { "tipoIdentificacion": "CC", "numeroIdentificacion": "1000000001", "nombres": "Persona", "apellidos": "Uno", "telefonoPrincipal": null, "correoPersonal": null, "ciudad": "Medellín", "estrato": null },
  "motivoConsulta": "…",
  "triaje": "ALTO",
  "omisionTriaje": null,
  "consentimientoAph": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00", "versionTexto": "v0-provisional" },
  "fechaDerivacion": "2026-11-06T09:15:00-05:00",
  "sla": { "horasLimite": 12, "venceEn": "2026-11-06T21:15:00-05:00", "ahoraServidor": "2026-11-06T14:30:00-05:00" },
  "tomadaPor": "Nombre de la profesional",
  "tomadaPorMi": true,
  "recontacto": false,
  "casoActivo": null,
  "numeroCaso": null,
  "notasAph": [ { "idNota": "…", "tipoOrigen": "APH", "contenido": "…", "fechaRegistro": "…", "autor": "…" } ],
  "derivaciones": [], "rutasExternas": [],
  "intentos": [],
  "cierre": null,
  "gestionSimultanea": false,
  "fechaCreacion": "…", "fechaActualizacion": "…"
}
```

- `triaje` es el de APH y **no es editable** (RN-ALMA-04). `notasAph` solo `APH`/`POST_CIERRE`: las notas clínicas viven en el caso.
- `casoActivo` (`CasoActivoResumenDto`: `numeroCaso`, `estado`, `fechaApertura`, `profesional`, `numeroSeguimientos`, `proximoControl`) solo
  para roles con `alma.notasClinicas.consultar`; `recontacto: true` mientras haya caso activo y nadie haya decidido (RN-ALMA-06).
- `cierre` presente cuando se cerró por «No contacto» (`motivo: "NO_CONTACTO"`) o por contención puntual (`"CONTENCION_PUNTUAL"`).

### 3.6 `GET` / `POST /psicologia/novedades/{idAtencion}/intentos` — protocolo (J-1.3, `RN-ALMA-03`)

- **Roles:** PSI, COORD, ADMIN (GET también REV). `GET` → `IntentoContactoDto[]`.
- **`POST` request:** `{ "version": 4, "fechaHora": "2026-11-06T15:00:00-05:00", "resultado": "NO_CONTESTA", "nota": "…", "justificacion": null }`.
- **Respuesta `201`:** `NovedadPsicologiaDto` completa (así el front actualiza versión, contador y estado en una sola respuesta).
  Cada intento: `{ "idIntento", "numeroIntento": 1, "protocolo": "PROTOCOLO_1|PROTOCOLO_2|PROTOCOLO_3|ADICIONAL", "fechaHora", "resultado", "nota", "justificacion", "autor" }`.
- **Reglas:** `numeroIntento` = anteriores + 1; `protocolo` lo asigna el servidor (1→P1, 2→P2, 3→P3, 4…9→ADICIONAL); con el 9.º
  sin éxito → `estado: "CERRADO"`, `cierre.motivo: "NO_CONTACTO"`, auditoría `CAMBIO_ESTADO` (D-PSI-06). El historial es de solo agregar.
- **Errores:** `422 NOVEDAD_NO_TOMADA` · `422 NOVEDAD_CERRADA` · `422 INTENTOS_AGOTADOS` · `409 CONFLICTO_VERSION` ·
  `400 VALIDACION` con `detalles` en `resultado` (catálogo `resultados-intento`), `fechaHora` (inválida o futura), `nota` (mín. 5),
  `justificacion` (obligatoria desde el 4.º, mín. 10).

### 3.7 `POST /psicologia/novedades/{idAtencion}/primer-contacto` — consolida el caso (J-1.4, `RF-ALMA-PSI-003`)

- **Roles:** PSI, COORD, ADMIN. Consume **F4** (caracterización) y **F5** (consentimiento verbal).
- **Request** (`PrimerContactoRequestDto` **[Front]**):

```json
{
  "version": 4,
  "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T15:05:00-05:00", "versionTexto": "v0-provisional" },
  "persona": { "nombres": "Persona", "apellidos": "Uno", "telefonoPrincipal": "3000000000", "correoPersonal": "p@ejemplo.test", "ciudad": "Medellín", "estrato": 3 },
  "valoracionRiesgo": { "nivel": "MEDIO", "descripcion": "…" },
  "dimensiones": ["DIM_01", "DIM_04"],
  "presuntoAgresor": { "nombres": null, "apellidos": null, "vinculo": "EXPAREJA", "convivencia": false, "observaciones": null },
  "acuerdos": "…",
  "proximoControl": "2026-11-09T10:00:00-05:00",
  "vincularA": null
}
```

- **Respuesta `201`:** `{ "numeroCaso": "CAS-2026-000045", "idAtencion": "ALMA-2026-000123", "version": 5, "estadoAtencion": "ABIERTO_ACTIVO", "vinculado": false }`.
- **Efectos:** crea el caso (`ABIERTO`, `prioridad` = `PRIORIDAD_POR_TRIAJE[triaje]`, `ALTA` si el triaje se omitió, `profesional` = sesión,
  `triajeAph` y `valoracionRiesgo` por separado, nota `PSICO` del primer contacto); actualiza `persona`; la atención pasa a
  `ABIERTO_ACTIVO` con `numeroCaso`; la persona queda con **seguimiento activo** para la consulta de APH (F2); auditoría `CREACION` en el
  caso y `CAMBIO_ESTADO` en la atención. Con `vincularA = numeroCaso`: añade la atención al caso (`vinculado: true`, auditoría `VINCULACION`).
- **Errores:** `422 CONSENTIMIENTO_REQUERIDO` · `422 CASO_ACTIVO_EXISTENTE` (`detalles` = `CasoActivoResumenDto`, D-PSI-07) ·
  `422 NOVEDAD_NO_TOMADA` · `422 NOVEDAD_CERRADA` · `409 CONFLICTO_VERSION` · `400 VALIDACION` con `detalles` en
  `valoracionRiesgo.nivel`, `valoracionRiesgo.descripcion` (mín. 10), `acuerdos` (mín. 10), `proximoControl` (futura), `dimensiones`
  (códigos del catálogo), `presuntoAgresor.vinculo`, `vincularA` (debe ser el caso activo o `CASO_NUEVO`). **El presunto agresor nunca bloquea.**

---

## 4. Diccionario de campos

| Campo | Tipo | Obligatorio | Regla | Control del front |
|---|---|:-:|---|---|
| `version` | entero | sí | Bloqueo optimista (F7) | `BloqueoOptimista` |
| `sla.horasLimite` | 12 / 24 / 48 | sí | RN-ALMA-01 según triaje | `SlaBadge` |
| `sla.venceEn`, `sla.ahoraServidor` | ISO-8601 | sí | Hora del servidor | `RelojServidorService` |
| `tomadaPor` / `tomadaPorMi` | string \| null / boolean | sí | D-PSI-03 | bandeja, novedad |
| `recontacto` | boolean | sí | Caso activo sin decisión (RN-ALMA-06) | chip + bloque de decisión |
| `intentos[].numeroIntento` | 1–9 | sí | RN-ALMA-03 | `protocolo-intentos.ts` |
| `intentos[].justificacion` | string \| null | desde el 4.º | Q11 | `intentos-contacto` |
| `valoracionRiesgo.nivel` | `ALTO\|MEDIO\|BAJO` | sí | Campo propio; no modifica `triaje` (RN-ALMA-04) | paso 3 |
| `dimensiones` | `string[]` | no | Catálogo `dimensiones-salud-mental` (placeholder «Dimensión 1…15», Q6) | paso 4 |
| `presuntoAgresor` | objeto \| null | no | Opcional; `vinculo` del catálogo `vinculos-agresor` | paso 5 |
| `proximoControl` | ISO-8601 | sí | Futura | `fechaFuturaValidator` |
| `vincularA` | `numeroCaso` \| `"CASO_NUEVO"` \| null | condicional | D-PSI-07 | diálogo de confirmación |

## 5. Validaciones en servidor

Las de §3 son las que el mock aplica (`psicologia.handlers.ts`) y el front espera. El servidor es la autoridad: repite
también las de permisos (`403`) y de estado.

## 6. Errores

Formato `{ codigo, mensaje, detalles }` (README §3). Códigos nuevos que el front ya traduce (`alma-error.ts`):
`NOVEDAD_NO_TOMADA`, `NOVEDAD_CERRADA`, `INTENTOS_AGOTADOS`, `CASO_ACTIVO_EXISTENTE`, `NOVEDAD_NO_ENCONTRADA`
(además de `NOVEDAD_YA_TOMADA`, `CONFLICTO_VERSION`, `CONSENTIMIENTO_REQUERIDO`, ya previstos).

## 7. Maestros

`GET /catalogos/{nombre}`: `resultados-intento`, `dimensiones-salud-mental` (15 ítems), `vinculos-agresor`. Códigos
placeholder en `psicologia-mock-seed.ts` (D-ALMA-09 aplica: Backend define los oficiales, Q6).

## 8. Privacidad y seguridad

- El Técnico APH **no** accede a ninguna ruta de este documento (`RNF-ALMA-002`); `/personas/consulta` sigue sin dato clínico.
- `casoActivo`, `intentos` y `valoracionRiesgo` son datos clínicos: solo roles con `alma.notasClinicas.consultar`.
- El borrador del primer contacto vive en `sessionStorage` con prefijo `casilda_` y lo borra la Salida rápida (D-PSI-08).
- Datos de prueba ficticios (Anexo B); nunca cédulas reales.

## 9. Compatibilidad

Aditivo sobre los contratos de APH: no cambia `AtencionAphDto` ni `/bandeja/aph`. Comparte `SlaDto`, `ConsentimientoDto`,
`NotaAtencionDto`, `DerivacionInternaDto` y `RutaExternaDto`.

## 10. Criterios de aceptación

- [ ] La bandeja llega ordenada por `venceEn` y cada ítem trae `ahoraServidor` de la respuesta.
- [ ] Dos sesiones que toman la misma novedad: la segunda recibe `409 NOVEDAD_YA_TOMADA`.
- [ ] Un intento con la `version` anterior recibe `409 CONFLICTO_VERSION`.
- [ ] El 4.º intento sin `justificacion` recibe `400` con `detalles.justificacion`.
- [ ] El 9.º intento sin éxito deja la atención `CERRADO` con `cierre.motivo = NO_CONTACTO`.
- [ ] Primer contacto sin consentimiento → `422 CONSENTIMIENTO_REQUERIDO`.
- [ ] Primer contacto con caso activo y sin `vincularA` → `422 CASO_ACTIVO_EXISTENTE`; con `vincularA` correcto → `201 vinculado: true`.
- [ ] Tras el primer contacto, `/personas/consulta` de esa cédula devuelve `seguimientoActivo.activo = true` con `proximoSeguimiento`.
- [ ] `GET /psicologia/novedades/{id}` nunca trae notas `PSICO`/`SEGTO`.

## 11. Qué hará el frontend cuando el endpoint exista

Poner `environment.lineaAlma.mocks.bandejaPsicologia` y `novedades` en `false` (J-3.3). Nada más cambia: los componentes
consumen `psicologia/services/*`, que ya hablan este contrato.
