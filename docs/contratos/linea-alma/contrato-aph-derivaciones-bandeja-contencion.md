# Contrato de API — Línea Alma · APH: derivaciones, rutas, bandeja, contención, auditoría y catálogos

> **Para:** equipo de Backend de CASILDA (y desarrollo de Psicología en el front, que reutiliza F6)
> **De:** equipo de Frontend (`casilda-frontend`) — submódulo APH
> **Fecha:** 6 de noviembre de 2026
> **Estado:** propuesta v0. **Nada de esto se ha verificado en el backend.** El front funciona contra el mock
> (`mocks/aph.handlers.ts`; grupos `derivaciones`, `bandejaAph`, `contenciones`, `auditoria`, `catalogos`).
> Convenciones, roles y decisiones `D-ALMA-*`: ver `README.md`.

**[Front]** = verificado leyendo el archivo · **[Propuesta]** = pendiente de confirmar.

---

## 1. Contexto y qué se necesita

APH deriva a dependencias internas (SPyB, Equipo de Atención, Dupla Psicojurídica, Masculinidades, UAD), activa y
sigue rutas externas (Línea 123, Código Fucsia, Fiscalía, Comisarías, Policía, ICBF, CAIVAS), atiende una bandeja de
remisiones recibidas, registra contenciones tras el cierre de un caso y consulta el historial de auditoría.

| Archivo del front | Rol |
|---|---|
| `src/app/linea-alma/aph/services/derivaciones-alma.service.ts`, `bandeja-aph.service.ts`, `contenciones-alma.service.ts`, `auditoria-alma.service.ts` | Llamadas **[Front]** |
| `shared/components/panel-derivaciones/` | `PanelDerivaciones`, reutilizable con `contexto = { tipo, id }` (**F6**) |
| `shared/components/contencion-post-cierre-form/` | `ContencionPostCierreForm` (**F6**) |
| `shared/components/audit-trail/`, `consentimiento-informado/` | Auditoría; consentimiento (**F5**) |
| `aph/pages/bandeja-remisiones/`, `detalle-atencion/` | Bandeja y detalle |
| `shared/catalogos/catalogos-alma.service.ts`, `mocks/alma-mock-seed.ts` | Catálogos y códigos placeholder |
| `shared/types/alma-dto.ts` | DTO |

## 2. Decisiones que necesitamos de Backend

| # | Decisión | Recomendación | Impacto en el front |
|---|---|---|---|
| D-ALMA-11 | Consentimiento también en rutas externas, salvo `peligroInminente` hacia `SPYB`/`LINEA_123` | Mantener (RN-ALMA-02) | Quitar el bloque en la rama externa |
| D-ALMA-09 | Códigos de catálogo (los de §3.8 son del front) y cómo identificar los destinos con excepción de peligro | Backend define códigos; indicador en el ítem | Constante `DESTINOS_PELIGRO_INMINENTE` |
| D-ALMA-10 | `fechaActivacion` como `YYYY-MM-DD` | Aceptar | Construir datetime |
| D-ALMA-07 | Quién ve `GET /auditoria` | Decidir | Condición en el detalle |
| D-ALMA-13 | `REMISION_YA_TOMADA` (APH) vs `NOVEDAD_YA_TOMADA` (Psicología) | Dos códigos, `409` | Ya traducidos ambos |
| D-ALMA-02 | Tomar remisión → `EN_GESTION_APH` y `tomadaPor` | Adoptar | Si fuera `BORRADOR`, cambia el filtro de «mis atenciones» |
| Nueva | **`resultado` de una ruta externa:** el front envía el **texto** (etiqueta) del catálogo `resultados-ruta-externa`, no el `codigo` (`panel-derivaciones.component.html`, `mat-option [value]="res.etiqueta"`). | Recomendado: texto libre ≤ 500 **o** cambiar a `codigo` | Con `codigo`, se cambia el `[value]` y la lectura |
| Nueva | **Contención sobre caso cerrado:** el servidor valida que `numeroCaso` sea un caso cerrado de la persona de la atención | Sí | Ninguno |
| Nueva | **Notificación de recontacto/bandeja en tiempo real (Q7):** el front no refresca la bandeja sola | Polling 30 s o SSE, decidir | Añadir `useNotificaciones` |

---

## 3. Endpoints

### 3.1 `POST /derivaciones/internas` — derivación interna (H-1.5, **F6**)

- **Roles:** TAPH, PSI (+ ADMIN). `201` `DerivacionInternaDto`. Efecto: auditoría `DERIVACION`; notificar a la dependencia **[Propuesta]**.

```json
{
  "tipoContexto": "ATENCION_APH",
  "idContexto": "ALMA-2026-000123",
  "destino": "EA",
  "motivo": "Requiere acompañamiento presencial.",
  "peligroInminente": false,
  "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00", "versionTexto": "v1" }
}
```

Respuesta `201`:

```json
{
  "idDerivacion": "DER-0001", "tipoContexto": "ATENCION_APH", "idContexto": "ALMA-2026-000123",
  "destino": "EA", "motivo": "Requiere acompañamiento presencial.", "estado": "ENVIADA",
  "fechaEnvio": "2026-11-06T09:20:00-05:00", "peligroInminente": false,
  "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00", "versionTexto": "v1" },
  "resultado": null
}
```

- `estado ∈ ENVIADA | RECIBIDA | RECHAZADA` (`DerivacionInternaDto`); al crear, `ENVIADA`.
- Con `peligroInminente: true` el front envía `consentimiento: null` y **solo** lo ofrece para `SPYB`. El mock no limita el destino: **[Propuesta]** el servidor debe aceptar la excepción solo para `SPYB` (D-ALMA-09).
- Validaciones: `tipoContexto ∈ {ATENCION_APH, CASO}`; `idContexto` presente y existente (`404 ATENCION_NO_ENCONTRADA`); `destino` en catálogo `destinos-internos`; `motivo` obligatorio (front 5–500); consentimiento válido (`otorgado true`, `fechaRegistro`, `medio ∈ DIGITAL|VERBAL`) salvo peligro → si no, `422 CONSENTIMIENTO_REQUERIDO`. `400 VALIDACION` con `detalles.destino` / `detalles.motivo`.

### 3.2 `GET /derivaciones/internas?tipoContexto=&idContexto=` — historial

Roles TAPH, PSI, COORD, ADMIN, REV. `200` **arreglo** de `DerivacionInternaDto` (sin paginar; **[Propuesta]** orden cronológico ascendente).

### 3.3 `POST /rutas-externas` — activar ruta externa (H-1.5, **F6**)

- Roles TAPH, PSI (+ ADMIN). `201` `RutaExternaDto`.

```json
{
  "tipoContexto": "ATENCION_APH", "idContexto": "ALMA-2026-000123",
  "entidad": "COMISARIA_FAMILIA", "motivo": "Orientación sobre medidas de protección.",
  "fechaActivacion": "2026-11-06", "peligroInminente": false,
  "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00" }
}
```

Respuesta: `{ "idRuta": "RUT-0001", "version": 1, "tipoContexto": "ATENCION_APH", "idContexto": "ALMA-2026-000123", "entidad": "COMISARIA_FAMILIA", "motivo": "…", "fechaActivacion": "2026-11-06", "estado": "ACTIVADA", "resultado": null, "peligroInminente": false, "consentimiento": { … } }`.

- Validaciones: `entidad` en catálogo `rutas-externas`; `motivo` obligatorio (front 5–500); `fechaActivacion` obligatoria (D-ALMA-10); consentimiento como en 3.1, con excepción de peligro **solo** para `LINEA_123` (D-ALMA-11/09).

### 3.4 `GET /rutas-externas?tipoContexto=&idContexto=`

`200` arreglo de `RutaExternaDto`.

### 3.5 `PATCH /rutas-externas/{idRuta}` — seguimiento de la ruta

Roles TAPH, PSI. Con `version`.

```json
{ "version": 1, "estado": "CERRADA", "resultado": "La entidad atendió el caso." }
```

- `estado ∈ ACTIVADA | EN_SEGUIMIENTO | CERRADA`. `CERRADA` exige `resultado` (mock ≥ 3 caracteres; front máx. 500). El front ofrece cambiar solo a `EN_SEGUIMIENTO` o `CERRADA` (o mantener), y no edita rutas ya `CERRADA`.
- `409 CONFLICTO_VERSION` (el front recarga la lista); `404 RUTA_NO_ENCONTRADA`; `400` con `detalles.estado` / `detalles.resultado`.
- Auditoría `ACTUALIZACION`. Una atención con rutas no `CERRADA` no puede cerrarse (`422 RUTAS_PENDIENTES`, contrato 2 §3.7).

### 3.6 `GET /bandeja/aph` — bandeja (H-1.6, `RF-ALMA-002`)

- **Roles:** TAPH, COORD, ADMIN, REV (`alma.aph.bandeja`). Paginada (`page`, `size`; el front usa 10).
- **Query:** `vista = remisiones | mias` (**el plan no la define; la añadió el front**), `origen = EA | SPYB | UAD` (solo `remisiones`), `estado` (solo `mias`; cualquier valor de `EstadoAtencion` salvo `PENDIENTE_APH`).
- **`remisiones`:** atenciones con `canalIngreso` `REMISION_*` y `estado = PENDIENTE_APH`, **más antiguas primero** (mock). **`mias`:** atenciones del usuario en cualquier otro estado (incluye `BORRADOR`, `EN_GESTION_APH`, `PENDIENTE_PSICOLOGIA`, `CERRADO`), **última actualización primero**. **[Propuesta]** definir si «mías» = `tomadaPor` el usuario (el mock devuelve todas las no pendientes).

```json
{
  "items": [
    {
      "idAtencion": "ALMA-2026-000008", "version": 1,
      "persona": { "tipoIdentificacion": "CC", "numeroIdentificacion": "2000000001", "nombreCompleto": "Persona Remitida Uno" },
      "canalIngreso": "REMISION_EA", "origenRemision": "EA",
      "resumen": "Remitida por el Equipo de Atención.", "fechaRemision": "2026-11-06T09:00:00-05:00",
      "estado": "PENDIENTE_APH", "tomadaPor": null, "triaje": null, "sla": null
    }
  ],
  "page": 0, "size": 10, "total": 1
}
```

- `sla` solo en `mias` y solo si fue derivada: `{ horasLimite, venceEn, ahoraServidor }` (F3). El front marca «vencido» si `venceEn <= ahoraServidor` (nunca el reloj del navegador) y lo comunica con ícono y texto, no solo color.
- `nombreCompleto` vacío → el front muestra «Sin nombre registrado».
- Las remisiones **las crean EA/SPyB/UAD** (otro contrato, fuera de alcance): deben nacer con `estado: PENDIENTE_APH`, `canalIngreso` `REMISION_*` y `origenRemision`.

### 3.7 `POST /bandeja/aph/{idAtencion}/tomar` — tomar remisión (bloqueo optimista)

- **Roles:** TAPH. Cuerpo `{ "version": 1 }`. `200` con `AtencionAphDto` (estado `EN_GESTION_APH`, `tomadaPor` = usuario, versión +1). El front navega a `/linea-alma/aph/nueva?atencion=<id>` con los datos pre-llenados.
- Si ya fue tomada (otra persona, o `estado != PENDIENTE_APH`) → `409`:

```json
{ "codigo": "REMISION_YA_TOMADA", "mensaje": "La remisión ya fue tomada por otro técnico.", "detalles": { "tomadaEn": "2026-11-06T14:29:40-05:00" } }
```

- Versión desfasada → `409 CONFLICTO_VERSION`. En ambos el front refresca la lista. Auditoría `CAMBIO_ESTADO`.
- El mock usa la cédula ficticia `2000000003` para simular una toma concurrente (siempre devuelve `REMISION_YA_TOMADA`).

### 3.8 `POST /contenciones-post-cierre` — contención sin reabrir (H-1.7, **F6**)

- **Roles:** TAPH, PSI. `201`. Consume Psicología (J-1.7).

```json
{ "idAtencion": "ALMA-2026-000130", "numeroCaso": "CAS-2026-000003", "nota": "Se brindó contención emocional por teléfono; la persona quedó tranquila." }
```

```json
{
  "idContencion": "CON-0001", "idAtencion": "ALMA-2026-000130", "numeroCaso": "CAS-2026-000003",
  "tipoSeguimiento": "POST_CIERRE", "nota": "Se brindó contención…", "fechaRegistro": "2026-11-06T10:00:00-05:00", "autor": "Técnico APH de prueba"
}
```

- Se registra sobre la atención **nueva** `ALMA-…` (RN-ALMA-06: una llamada posterior siempre crea una). `numeroCaso` viene de F2 `ultimoCasoCerrado` (D-ALMA-05).
- **No reabre el caso, no cambia el estado de la atención y no incrementa el contador de seguimientos** (Q8). Aparece como nota `POST_CIERRE` en `notas` de la atención.
- Validaciones: `idAtencion` existente; `nota` 10–2000 (`400 detalles.nota`); `numeroCaso` presente; el caso debe ser un caso **cerrado de la misma persona** → si no, `422 PERSONA_SIN_CASO_CERRADO`. Auditoría `NOTA`.
- Privacidad: la nota es contenido sensible; no loguear.

### 3.9 `GET /auditoria?tipoContexto=&idContexto=` — historial inmutable (H-3.1, `RNF-ALMA-003`)

- Roles: ver D-ALMA-07. `200` **arreglo**, **orden cronológico ascendente**, solo lectura (sin `PUT/PATCH/DELETE`). `400` si falta contexto.

```json
[
  { "idEvento": "EVT-000001", "fechaHora": "2026-11-06T09:00:00-05:00", "usuario": "Técnico APH de prueba", "accion": "CREACION", "detalle": "Se creó la atención en estado borrador." },
  { "idEvento": "EVT-000002", "fechaHora": "2026-11-06T09:15:00-05:00", "usuario": "Técnico APH de prueba", "accion": "DERIVACION", "detalle": "Derivada a Psicología (triaje ALTO)." }
]
```

- `accion ∈ CREACION | ACTUALIZACION | CAMBIO_ESTADO | DERIVACION | VINCULACION | NOTA`. Debe registrar toda creación, cambio de estado, derivación y vinculación manual, con `id_usuario`, fecha, hora y detalle (RNF-ALMA-003).
- `detalle` **no debe contener contenido clínico ni notas** (lo ven roles amplios): solo describir el cambio.

### 3.10 `GET /catalogos/{nombre}` — catálogos de APH

Cualquier rol autenticado. `200` `[ { "codigo", "etiqueta", "activo" } ]` (solo la forma; el front filtra `activo`). `404 CATALOGO_NO_ENCONTRADO`.
Si falla, el front **no inventa listas**: muestra error con «Intentar de nuevo».

| `nombre` | Consumido por | Códigos placeholder del front (`mocks/alma-mock-seed.ts`) |
|---|---|---|
| `tipos-identificacion` | paso 1 | `CC`, `TI`, `CE`, `PPT`, `PA` (ojo: `core/forms/documento-identidad.ts` usa `PAS` para pasaporte; **homologar**) |
| `estratos` | caracterización | `1`…`6` (etiqueta «Estrato n»; el DTO guarda número) |
| `parentescos-solicitante` | paso 3 | `MADRE_PADRE`, `PAREJA`, `AMISTAD`, `COMPANERIA_ACADEMICA`, `DOCENTE`, `OTRO` |
| `destinos-internos` | derivación interna | `SPYB`, `EA`, `DUPLA_PSICOJURIDICA`, `MASCULINIDADES`, `UAD` |
| `rutas-externas` | ruta externa | `LINEA_123`, `CODIGO_FUCSIA`, `FISCALIA`, `COMISARIA_FAMILIA`, `POLICIA_NACIONAL`, `ICBF`, `CAIVAS` |
| `resultados-ruta-externa` | seguimiento de ruta | `ATENDIDA`, `SIN_RESPUESTA`, `NO_ACEPTA` (ver decisión del texto vs código) |
| `motivos-cierre-aph` | cierre | `NO_ACEPTA_PSICOLOGIA`, `ORIENTACION_BRINDADA`, `REMITIDA_RUTA_EXTERNA`, `SIN_RESPUESTA` |
| `textos-consentimiento` | `ConsentimientoInformado` | un solo ítem vigente: `codigo` = versión (p. ej. `v1`), `etiqueta` = **texto oficial completo** (Q9) |

**Regla de redacción:** `etiqueta` en *sentence case* (el front la muestra tal cual), sin siglas sin explicar, en
lenguaje neutro. El front lee solo el **primer** ítem activo de `textos-consentimiento`; ese `codigo` viaja como
`versionTexto`. El texto del seed del front es **provisional**: el oficial lo aprueba el cliente (Q9).
Los códigos `SPYB` y `LINEA_123` están referenciados en el código (`DESTINOS_PELIGRO_INMINENTE`): ver D-ALMA-09.

---

## 4. Diccionario de campos

| Campo | Tipo | Obligatorio | Regla | Control del front |
|---|---|---|---|---|
| `tipoContexto` | `ATENCION_APH`\|`CASO` | Sí | Q2 | `PanelDerivaciones.contexto().tipo` |
| `idContexto` | string | Sí | `ALMA-…` o `CAS-…` | `contexto().id` |
| `destino` / `entidad` | código de catálogo | Sí | activo | `formInterna.destino` / `formExterna.entidad` |
| `motivo` | string | Sí | 5–500 | `motivo` |
| `fechaActivacion` | `YYYY-MM-DD` | Sí (externa) | D-ALMA-10 | `formExterna.fechaActivacion` (por defecto hoy, hora local del navegador) |
| `peligroInminente` | bool | No | solo `SPYB`/`LINEA_123` | checkbox `peligro` |
| `consentimiento` | `ConsentimientoDto` | Sí salvo peligro | RN-ALMA-02 | `ConsentimientoInformado` |
| `estado` (ruta) | enum | Sí | | `formRuta.estado` |
| `resultado` (ruta) | string | Sí si `CERRADA` | ≤ 500 | `formRuta.resultado` |
| `nota` (contención) | string | Sí | 10–2000 | `ContencionPostCierreForm.nota` |
| `version` | int | Sí en PATCH/tomar | | — |

## 5. Validaciones en servidor

Repetir todo lo de §3 y §4. Cruzadas: consentimiento vs `peligroInminente` según destino; `RUTAS_PENDIENTES` al cerrar;
contención solo sobre caso cerrado de la misma persona; no permitir crear derivaciones/rutas sobre una atención `CERRADO`
(**[Propuesta]**: el mock no lo valida; el front pone el panel en solo lectura).

## 6. Errores

Formato `{ codigo, mensaje, detalles }` (D-ALMA-03). Códigos de este contrato: `VALIDACION`, `ATENCION_NO_ENCONTRADA`,
`RUTA_NO_ENCONTRADA`, `CATALOGO_NO_ENCONTRADO`, `CONSENTIMIENTO_REQUERIDO` (422), `CONFLICTO_VERSION` (409),
`REMISION_YA_TOMADA` (409), `PERSONA_SIN_CASO_CERRADO` (422), `RUTAS_PENDIENTES` (422). Ejemplo `400`:
`{ "codigo": "VALIDACION", "mensaje": "Revise los datos marcados e intente de nuevo.", "detalles": { "destino": "Seleccione a qué dependencia se deriva.", "motivo": "Escriba el motivo de la derivación." } }`.

## 7. Maestros

Ver §3.10.

## 8. Privacidad y seguridad

- Derivar a SPyB/UAD/Fiscalía comparte datos de una víctima de VBG: **registrar qué se compartió y bajo qué consentimiento** (`consentimiento` + `versionTexto`) y no enviar a la dependencia más de lo necesario.
- El `motivo` y la `nota` son texto libre sensible: **no loguearlos** ni incluirlos en correos o notificaciones; usar solo `idAtencion`.
- `idDerivacion`, `idRuta`, `idContencion` son consecutivos y adivinables (`DER-0001`…): autorizar por rol y por pertenencia al contexto.
- Límite de tasa en `GET /auditoria` y en `GET /bandeja/aph` si se expone fuera de red interna.
- La excepción por peligro inminente permite actuar sin consentimiento: **auditarla siempre** con justificación.

## 9. Compatibilidad

Aditivo: nuevos campos opcionales, nuevos catálogos/códigos activos, nuevos valores de `estado` de derivación (el front mostraría el valor crudo). Rompe: renombrar `vista`/`origen`, cambiar el orden esperado, convertir arreglos en paginados, cambiar códigos de error traducidos.

## 10. Criterios de aceptación

- [ ] Derivación interna sin consentimiento y sin peligro → `422 CONSENTIMIENTO_REQUERIDO`; con peligro hacia `SPYB` → `201` y `peligroInminente: true` auditado.
- [ ] Ruta externa `CERRADA` sin `resultado` → `400 detalles.resultado`; con atención con ruta abierta, el cierre da `422 RUTAS_PENDIENTES`.
- [ ] `GET /bandeja/aph?vista=remisiones` devuelve solo `PENDIENTE_APH` de origen EA/SPYB/UAD, paginado y filtrable por `origen`.
- [ ] Dos `tomar` simultáneos: uno `200`, otro `409 REMISION_YA_TOMADA`.
- [ ] Contención sobre un caso no cerrado o de otra persona → `422 PERSONA_SIN_CASO_CERRADO`; con éxito no cambia el estado del caso ni el contador de seguimientos.
- [ ] `GET /auditoria` devuelve eventos ordenados y no ofrece escritura.
- [ ] Todos los catálogos de §3.10 responden con la forma indicada; `textos-consentimiento` trae el texto oficial.
- [ ] Los logs no contienen `motivo`, `nota` ni documentos.

## 11. Qué hará el frontend cuando el endpoint exista

Poner en `false` los grupos `derivaciones`, `bandejaAph`, `contenciones`, `auditoria` y `catalogos` de
`environment.lineaAlma.mocks`. Si Backend cambia los códigos de catálogo, solo se actualiza `DESTINOS_PELIGRO_INMINENTE`
(`alma.types.ts`). Los componentes compartidos (`PanelDerivaciones`, `ContencionPostCierreForm`, `AuditTrail`) los usa Psicología sin cambios (F6).
