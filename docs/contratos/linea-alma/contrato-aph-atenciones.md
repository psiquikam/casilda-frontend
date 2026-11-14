# Contrato de API — Línea Alma · APH: consulta previa y atenciones

> **Para:** equipo de Backend de CASILDA (y desarrollo de Psicología en el front, que consume F1/F2/F3)
> **De:** equipo de Frontend (`casilda-frontend`) — submódulo APH
> **Fecha:** 6 de noviembre de 2026
> **Estado:** propuesta v0. **Ningún endpoint de este documento ha sido verificado en el backend.** El front
> está construido y probado contra un mock fiel (`mocks/aph.handlers.ts`, grupos `personas` y `atencionesAph`).
> Convenciones, roles y decisiones `D-ALMA-*`: ver `README.md`.

Rotulado: **[Front]** = verificado leyendo el archivo citado · **[Propuesta]** = pendiente de confirmar con Backend.

---

## 1. Contexto y qué se necesita

El Técnico APH recibe llamadas/WhatsApp 24/7: consulta si la persona ya tiene seguimiento, registra la atención,
asigna triaje a mano, obtiene consentimiento y deriva a Psicología o gestiona rutas. Se necesita el recurso
`atenciones-aph` y la consulta previa por documento. Mientras no exista, el front usa el mock.

### Archivos de referencia en el front

| Archivo | Rol |
|---|---|
| `src/app/linea-alma/shared/types/alma-dto.ts`, `alma.types.ts` | DTO y enums **[Front]** |
| `src/app/linea-alma/aph/services/personas-alma.service.ts`, `atenciones-aph.service.ts` | Llamadas **[Front]** |
| `src/app/linea-alma/aph/pages/nueva-atencion/nueva-atencion.page.ts/.html` | Formulario (stepper de 4 pasos) **[Front]** |
| `src/app/linea-alma/shared/components/caracterizacion-form/caracterizacion-campos.ts` | Variables de caracterización **[Front]** |
| `src/app/linea-alma/aph/components/paso-triaje/`, `paso-derivacion/`, `cierre-atencion/` | Triaje, derivación, cierre **[Front]** |
| `src/app/linea-alma/mocks/aph.handlers.ts` | Validaciones y códigos de error que el front ya espera **[Front]** |

---

## 2. Decisiones que necesitamos de Backend

| # | Decisión | Recomendación | Impacto en el front |
|---|---|---|---|
| D-ALMA-01 | Código del rol Técnico APH (`TECNICO_APH` asumido) | Crearlo y devolverlo en `roles` del login | `ROLES_CASILDA` en `auth.service.ts` |
| D-ALMA-02 | Estado `BORRADOR`; `PUT triaje` mueve `BORRADOR→EN_GESTION_APH` y exige `motivoConsulta` | Adoptar | Alternativa `POST …/finalizar` cambia el paso 4 |
| D-ALMA-04 | Derivar sin triaje (omisión por peligro) → `422 TRIAJE_REQUERIDO` | Aceptar | Quitar un aviso |
| D-ALMA-05 | `ultimoCasoCerrado` en F2 | Añadir | Sin él, no hay contención post-cierre |
| D-ALMA-06 | `consentimiento.versionTexto` | Añadir y persistir | Opcional |
| D-ALMA-08 | Documento inmutable tras crear | Ignorar/rechazar en PATCH | Ninguno |
| Q4 | `ALMA-…` al primer guardado; un borrador consume consecutivo | Aceptar | Si fuera al finalizar, el ID no aparecería en el paso 1 |
| Q5 | Lista oficial de variables de caracterización | Hoy solo campos de `persona` | Una fila en `caracterizacion-campos.ts` + campo en el DTO por variable |

Pendiente adicional: **¿la transición a `EN_SEGUIMIENTO`/`ABIERTO_ACTIVO` la dispara Psicología?** (no la toca APH; el
front solo lee `estado` y `numeroCaso`).

---

## 3. Endpoints

Prefijo `{apiBaseUrl}/alma` (README §3). JWT en todos. Errores: README §3 y §6 de este documento.

### 3.1 `GET /personas/consulta` — consulta previa (frontera **F2**, H-1.1)

- **Roles [Propuesta]:** TAPH, PSI, COORD, ADMIN (+ REV si se quiere la alerta; el front da `alertaSeguimiento` a REV).
- **Query:** `tipoIdentificacion` (código de catálogo, p. ej. `CC`), `numeroIdentificacion`.
- **Respuesta `200`** (`ConsultaPersonaDto` **[Front]**; para TAPH **nunca información clínica**, RNF-ALMA-002):

```json
{
  "existe": true,
  "persona": { "idPersona": 41, "nombres": "Persona", "apellidos": "De Prueba Dos" },
  "seguimientoActivo": {
    "activo": true,
    "proximoSeguimiento": "2026-11-09T10:00:00-05:00",
    "profesional": "Nombre del profesional a cargo"
  },
  "tieneCasoCerrado": true,
  "ultimoCasoCerrado": { "numeroCaso": "CAS-2026-000003", "fechaCierre": "2026-10-17T16:00:00-05:00" }
}
```

- Persona nueva: `{ "existe": false, "persona": null, "seguimientoActivo": { "activo": false, "proximoSeguimiento": null, "profesional": null }, "tieneCasoCerrado": false, "ultimoCasoCerrado": null }`.
- El front tolera `seguimientoActivo` `null` o con `activo:false` (`aVistaConsulta`, `personas-alma.service.ts`).
- **Efecto colateral [Propuesta, RF-ALMA-003]:** si hay seguimiento activo, el servidor notifica a la bandeja de
  Psicología. **El front solo muestra un aviso** («El sistema avisa a Psicología»); no confirma el envío.
- **Error `400`** si falta algún parámetro: `detalles: { "tipoIdentificacion": "Seleccione el tipo de documento.", "numeroIdentificacion": "Escriba el número de documento." }`.
- **RN-ALMA-06:** la consulta **no vincula nada**; una llamada nueva siempre genera una atención nueva.

### 3.2 `POST /atenciones-aph` — crear borrador (H-1.2)

- **Roles:** TAPH, COORD, ADMIN. **`201`** con `AtencionAphDto` (§4.1).
- Genera `idAtencion` (`ALMA-YYYY-NNNNNN`), `estado: "BORRADOR"`, `version: 1`, `tomadaPor` = usuario. **[Front: el mock lo hace así]**

Petición (el front envía `null` en los vacíos y omite lo que no tiene):

```json
{
  "canalIngreso": "LLAMADA",
  "persona": {
    "tipoIdentificacion": "CC",
    "numeroIdentificacion": "1000000001",
    "nombres": "Persona",
    "apellidos": "De Prueba Uno",
    "telefonoPrincipal": null,
    "correoPersonal": null,
    "ciudad": "Medellín",
    "estrato": 3
  },
  "solicitante": null,
  "motivoConsulta": null,
  "notaAph": null
}
```

Error `400`: `{ "codigo": "VALIDACION", "mensaje": "Revise los datos marcados e intente de nuevo.", "detalles": { "persona.tipoIdentificacion": "Seleccione el tipo de documento.", "persona.numeroIdentificacion": "Escriba el número de documento.", "canalIngreso": "Indique por qué canal llegó la solicitud." } }`.

### 3.3 `GET /atenciones-aph/{idAtencion}` — detalle (H-1.2, H-2.1)

- **Roles:** TAPH, PSI, COORD, ADMIN, REV. `200` `AtencionAphDto`; `404 ATENCION_NO_ENCONTRADA`.
- **DTO reducido por rol [Propuesta, R4]:** `notas` solo con `tipoOrigen` `APH` y `POST_CIERRE` para TAPH **y** PSI
  (el mock filtra así: `aVista` en `aph.handlers.ts`; `notas-timeline` filtra otra vez en el cliente).

```json
{
  "idAtencion": "ALMA-2026-000123",
  "version": 3,
  "estado": "PENDIENTE_PSICOLOGIA",
  "canalIngreso": "LLAMADA",
  "origenRemision": null,
  "persona": { "tipoIdentificacion": "CC", "numeroIdentificacion": "1000000001", "nombres": "Persona", "apellidos": "De Prueba Uno", "telefonoPrincipal": null, "correoPersonal": null, "ciudad": "Medellín", "estrato": 3 },
  "solicitante": { "esTercero": true, "nombres": "Quien", "apellidos": "Llama", "telefono": "3000000000", "parentesco": "AMISTAD" },
  "motivoConsulta": "Motivo de consulta de prueba.",
  "notaAph": "Nota de valoración APH de prueba.",
  "triaje": "ALTO",
  "omisionTriaje": null,
  "aceptaPsicologia": true,
  "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00", "versionTexto": "v1" },
  "fechaDerivacion": "2026-11-06T09:15:00-05:00",
  "sla": { "horasLimite": 12, "venceEn": "2026-11-06T21:15:00-05:00", "ahoraServidor": "2026-11-06T14:30:00-05:00" },
  "tomadaPor": "Técnico APH de prueba",
  "cierre": null,
  "numeroCaso": null,
  "gestionSimultanea": false,
  "notas": [ { "idNota": "NOTA-1", "tipoOrigen": "APH", "contenido": "Nota de prueba.", "fechaRegistro": "2026-11-06T09:00:00-05:00", "autor": "Técnico APH de prueba" } ],
  "derivaciones": [],
  "rutasExternas": [],
  "fechaCreacion": "2026-11-06T08:50:00-05:00",
  "fechaActualizacion": "2026-11-06T09:15:00-05:00"
}
```

`derivaciones` y `rutasExternas` van embebidas (forma en el otro contrato). `gestionSimultanea` (Q15): origen por definir.

### 3.4 `PATCH /atenciones-aph/{idAtencion}` — actualización parcial (H-1.2)

- **Roles:** TAPH, COORD, ADMIN. Exige `version` leída. `200` con la atención (versión +1).
- Solo en estados **editables**: `BORRADOR`, `EN_GESTION_APH` (`ESTADOS_EDITABLES_APH`). Otro estado → `422 ATENCION_NO_EDITABLE`.
- Versión desfasada → `409 CONFLICTO_VERSION` con `detalles.versionActual`. El front **no** pisa lo escrito: recarga la versión y pide repetir.
- Campos aceptados: `canalIngreso`, `persona` (sin documento, D-ALMA-08), `solicitante`, `motivoConsulta`, `notaAph`, `aceptaPsicologia`.
- `notaAph` crea/actualiza **una sola nota `APH`** de la atención (el mock usa `idNota = NOTA-APH-<idAtencion>`); vacío la elimina de la lista.
- «No desea Psicología» = `PATCH { "version": 4, "aceptaPsicologia": false }` (`paso-derivacion.component.ts`); la atención sigue `EN_GESTION_APH`.

```json
{ "version": 2, "motivoConsulta": "Texto con las palabras de la persona.", "persona": { "ciudad": "Medellín", "estrato": null } }
```

### 3.5 `PUT /atenciones-aph/{idAtencion}/triaje` — triaje u omisión (H-1.3)

- **Roles:** TAPH. Estados editables. `200` con la atención; mueve `BORRADOR → EN_GESTION_APH` (D-ALMA-02).
- **El front no calcula ni sugiere el triaje** (algoritmo externo): solo registra la selección manual.
- Exactamente **una** de dos formas:

```json
{ "version": 2, "triaje": "MEDIO" }
```
```json
{ "version": 2, "peligroInminente": true, "justificacionOmision": "Describe la situación que obliga a actuar sin triaje." }
```

- Ni una ni otra (o ambas) → `422 TRIAJE_REQUERIDO` («Indique el triaje o registre el motivo por el que se omite.»).
- Omisión sin justificación de ≥ 10 caracteres → `400` con `detalles.justificacionOmision`. (Front: 10–1000.)
- Sin `motivoConsulta` → `422 ATENCION_INCOMPLETA` con `detalles.motivoConsulta` (D-ALMA-02).
- La omisión se guarda como `omisionTriaje: { peligroInminente: true, justificacion }` y `triaje: null`; un `PUT` posterior con `triaje` la reemplaza.

### 3.6 `POST /atenciones-aph/{idAtencion}/derivaciones/psicologia` — derivar (frontera **F1** + **F3**, H-1.4)

- **Roles:** TAPH. Estados editables. **`201`.** Consume: Psicología (J-1.1, J-1.2).
- **RN-ALMA-02:** sin consentimiento no se deriva.

```json
{ "version": 2, "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00", "versionTexto": "v1" } }
```

Respuesta `201` (`DerivacionPsicologiaDto`; el front vuelve a pedir `GET` después para refrescar):

```json
{
  "idAtencion": "ALMA-2026-000123", "version": 3, "estado": "PENDIENTE_PSICOLOGIA", "triaje": "ALTO",
  "fechaDerivacion": "2026-11-06T09:15:00-05:00",
  "sla": { "horasLimite": 12, "venceEn": "2026-11-06T21:15:00-05:00", "ahoraServidor": "2026-11-06T09:15:01-05:00" }
}
```

- Efectos: `estado = PENDIENTE_PSICOLOGIA`, `aceptaPsicologia = true`, guarda `consentimiento` y `fechaDerivacion`; la atención entra a la cola compartida de Psicología con SLA **12 / 24 / 48 h** según triaje (RN-ALMA-01; `HORAS_LIMITE_PRIMER_CONTACTO` en `alma.types.ts`). Auditoría `DERIVACION`.
- `422 TRIAJE_REQUERIDO` si no hay triaje (incluye `BORRADOR` y omisión, D-ALMA-04). `422 CONSENTIMIENTO_REQUERIDO` si `otorgado !== true` o falta `fechaRegistro`. `409 CONFLICTO_VERSION`. `422 ATENCION_NO_EDITABLE`.
- El front **no** calcula plazos: muestra `sla.venceEn` y compara con `ahoraServidor`.

### 3.7 `POST /atenciones-aph/{idAtencion}/cierre` — cierre APH (H-1.7)

- **Roles:** TAPH, ADMIN (`alma.aph.cerrar`). `200` con la atención en `CERRADO` y `cierre`.

```json
{ "version": 4, "motivo": "NO_ACEPTA_PSICOLOGIA", "observacion": null }
```

- `motivo` debe existir en el catálogo `motivos-cierre-aph`, si no `400 detalles.motivo` («Seleccione el motivo de cierre.»).
- `422 PSICOLOGIA_PENDIENTE` si está en `PENDIENTE_PSICOLOGIA`; `422 RUTAS_PENDIENTES` si hay rutas externas con `estado != CERRADA`; `422 ATENCION_NO_EDITABLE`; `409`.
- El front solo ofrece cerrar en `EN_GESTION_APH` con `aceptaPsicologia !== true` (`detalle-atencion.page.ts`). El mock admite cerrar también un `BORRADOR` (editable): **[Propuesta]** decidir si es válido.
- Efecto: auditoría `CAMBIO_ESTADO`.

---

## 4. Diccionario de campos

### 4.1 `AtencionAphDto` (respuesta)

| Campo | Tipo | Notas |
|---|---|---|
| `idAtencion` | string | `ALMA-YYYY-NNNNNN` (`ID_ATENCION_REGEX`) |
| `version` | int | +1 en cada escritura |
| `estado` | enum | `BORRADOR`, `PENDIENTE_APH`, `EN_GESTION_APH`, `PENDIENTE_PSICOLOGIA`, `ABIERTO_ACTIVO`, `EN_SEGUIMIENTO`, `CERRADO` (`ESTADOS_ATENCION`). Estados del caso son otro conjunto (Q1) |
| `canalIngreso` | enum | `LLAMADA`, `WHATSAPP`, `REMISION_EA`, `REMISION_SPYB`, `REMISION_UAD` |
| `origenRemision` | `EA`\|`SPYB`\|`UAD`\|null | solo remisiones |
| `persona` | objeto | ver §4.3 |
| `solicitante` | objeto\|null | ver §4.3 |
| `motivoConsulta`, `notaAph` | string\|null | máx. 2000 en el front |
| `triaje` | `ALTO`\|`MEDIO`\|`BAJO`\|null | `triage` del ER; ojo con `prioridad` del caso (ALTA/MEDIA/BAJA) |
| `omisionTriaje` | `{ peligroInminente: true, justificacion }`\|null | |
| `aceptaPsicologia` | bool\|null | |
| `consentimiento` | `{ otorgado, medio: DIGITAL\|VERBAL, fechaRegistro, versionTexto? }`\|null | F5 |
| `fechaDerivacion`, `sla` | datetime / `{ horasLimite, venceEn, ahoraServidor }` \| null | F1/F3 |
| `tomadaPor` | string\|null | nombre visible |
| `cierre` | `{ motivo, observacion, fecha }`\|null | |
| `numeroCaso` | string\|null | `CAS-YYYY-NNNNNN` cuando Psicología lo genera |
| `gestionSimultanea` | bool | Q15 |
| `notas` | `NotaAtencionDto[]` | `{ idNota, tipoOrigen: APH\|PSICO\|SEGTO\|POST_CIERRE, contenido, fechaRegistro, autor }`; **reducido por rol** |
| `derivaciones`, `rutasExternas` | arreglos | ver contrato 3 |
| `fechaCreacion`, `fechaActualizacion` | datetime | |

### 4.2 Mapa formulario → DTO (`nueva-atencion.page.ts`, `construirDto`)

| Control del front (grupo.control) | Campo del DTO | Tipo | Obligatoriedad en el front | Regla en el front |
|---|---|---|---|---|
| `identificacion.tipoIdentificacion` | `persona.tipoIdentificacion` | string (código) | Sí (para crear) | catálogo `tipos-identificacion`; solo al crear |
| `identificacion.numeroIdentificacion` | `persona.numeroIdentificacion` | string | Sí; mín. 4 | solo dígitos para CC/TI…, alfanumérico para CE/PA; longitud máx. por tipo (`longitudMaximaDocumento`: CC 10, TI 11, CE 6, PA 16; otro 20); solo al crear |
| `identificacion.canalIngreso` | `canalIngreso` | enum | Sí | el front ofrece solo `LLAMADA`/`WHATSAPP`; las remisiones llegan por la bandeja y no se cambian |
| `caracterizacion.nombres` | `persona.nombres` | string\|null | No | máx. 100; vacío → `null` |
| `caracterizacion.apellidos` | `persona.apellidos` | string\|null | No | máx. 100 |
| `caracterizacion.telefonoPrincipal` | `persona.telefonoPrincipal` | string\|null | No | `^\+?\d{7,15}$` |
| `caracterizacion.correoPersonal` | `persona.correoPersonal` | string\|null | No | email, máx. 150 |
| `caracterizacion.ciudad` | `persona.ciudad` | string\|null | No | máx. 80 |
| `caracterizacion.estrato` | `persona.estrato` | **string en el control** (`'1'…'6'`), **`number\|null` en el DTO** | No | catálogo `estratos` (código `'1'`…`'6'`); el front hace `Number()` |
| `solicitud.esTercero` | `solicitante.esTercero` | bool | – | si `false`, `solicitante: null` |
| `solicitud.solNombres` / `solApellidos` | `solicitante.nombres` / `apellidos` | string\|null | No | máx. 100 |
| `solicitud.solTelefono` | `solicitante.telefono` | string\|null | No | `^\+?\d{7,15}$` |
| `solicitud.solParentesco` | `solicitante.parentesco` | string (código)\|null | No | catálogo `parentescos-solicitante` |
| `solicitud.motivoConsulta` | `motivoConsulta` | string\|null | **Sí para avanzar del paso 3** (guardar borrador no lo exige) | máx. 2000 |
| `solicitud.notaAph` | `notaAph` | string\|null | No | máx. 2000 |

Diferencias de nombre/formato: el control `identificacion.*` se aplana a `persona.*`; `sol*` del control → `solicitante.*`.

**Huecos detectados:** (a) el ER (`persona`) no trae `solicitante`; se propone dentro de la atención. (b) El
levantamiento exige «datos del solicitante/tercero» pero no los campos: los del front son `nombres`, `apellidos`,
`telefono`, `parentesco` (decisión abierta). (c) `fechaNacimiento`, sexo, vínculo con UdeA (variables de EA, Q5) **no**
están: se perderían si el equipo clínico las espera; se añaden como filas de `caracterizacion-campos.ts`.

### 4.3 `persona` y `solicitante`

`persona`: `tipoIdentificacion`, `numeroIdentificacion` (no nulos), el resto `string|null` y `estrato: number|null`.
`solicitante`: `{ esTercero: bool, nombres, apellidos, telefono, parentesco }` (todos `string|null` salvo el primero).

---

## 5. Validaciones en servidor

Las del front **deben repetirse** (el front no es control de seguridad):

- Por campo: obligatoriedad al crear (documento, tipo, canal), longitudes y patrones de §4.2, `canalIngreso ∈ enum`.
- Cruzadas: `PUT triaje` exactamente una de dos formas; omisión → justificación ≥ 10; `motivoConsulta` presente para salir de `BORRADOR`; derivación con triaje y consentimiento; cierre con motivo de catálogo, sin psicología pendiente ni rutas abiertas.
- Estado y versión: edición solo en `BORRADOR`/`EN_GESTION_APH`; `version` obligatoria en PATCH, triaje, derivación, cierre y tomar.
- Autorización: matriz del README §4; DTO sin notas clínicas para TAPH (probar `403`/filtrado).

## 6. Errores

Formato `{ "codigo", "mensaje", "detalles" }` (D-ALMA-03). Mensajes en español, sin culpar a quien llama ni a quien atiende.

| HTTP | `codigo` | Cuándo | `detalles` |
|---|---|---|---|
| 400 | `VALIDACION` | campo inválido/faltante | `{ "<campo>": "mensaje" }` |
| 404 | `ATENCION_NO_ENCONTRADA` | id inexistente | – |
| 409 | `CONFLICTO_VERSION` | `version` desfasada | `{ "versionActual": n }` |
| 422 | `ATENCION_NO_EDITABLE` | estado no editable | `{ "estado": "…" }` |
| 422 | `ATENCION_INCOMPLETA` | falta `motivoConsulta` al triaje | `{ "motivoConsulta": "…" }` |
| 422 | `TRIAJE_REQUERIDO` | sin triaje/omisión válida, o derivar sin triaje | – |
| 422 | `CONSENTIMIENTO_REQUERIDO` | derivar sin consentimiento | – |
| 422 | `PSICOLOGIA_PENDIENTE` / `RUTAS_PENDIENTES` | cierre bloqueado | – |
| 401 / 403 / 5xx | según el caso | | |

Ejemplo `422`: `{ "codigo": "CONSENTIMIENTO_REQUERIDO", "mensaje": "No se puede derivar sin consentimiento informado.", "detalles": {} }`.

## 7. Maestros

Catálogos que lee este contrato: `tipos-identificacion`, `estratos`, `parentescos-solicitante`, `motivos-cierre-aph`,
`textos-consentimiento` (formas y códigos placeholder en el contrato 3 §3.8).

## 8. Privacidad y seguridad

- Se guardan datos personales y de crisis. **No registrar en logs** documento, nombres, teléfonos, correos, motivo ni notas; loguear solo `idAtencion` y el usuario.
- `ALMA-YYYY-NNNNNN` es **consecutivo anual y por tanto adivinable**: la autorización por rol y por recurso debe ser la defensa (no confiar en que el id sea secreto). No exponer el consecutivo en URLs públicas ni correos con datos.
- `GET /personas/consulta` es un oráculo de existencia de personas: **limitar tasa** y auditar cada consulta (quién, cuándo, a quién), sin devolver nada clínico a TAPH.
- La consulta con seguimiento activo avisa a Psicología; no revelar a TAPH contenido clínico, solo fecha y profesional (RNF-ALMA-002).
- Borradores abandonados: definir retención (consumen consecutivo y contienen datos).

## 9. Compatibilidad

Añadir campos opcionales a respuestas (p. ej. `ultimoCasoCerrado`, `versionTexto`) es aditivo y el front lo tolera.
**Rompen el front:** renombrar campos o estados, cambiar `estrato` a string, devolver notas clínicas, cambiar el
significado de `version`, cambiar el código de un error que el front traduce (README §3).

## 10. Criterios de aceptación

- [ ] `GET /personas/consulta` devuelve F2 sin información clínica para TAPH; `400` si faltan parámetros.
- [ ] `POST /atenciones-aph` genera `ALMA-…`, estado `BORRADOR`, `version 1`; `400` con claves de campo del DTO.
- [ ] `PATCH` sin `version` o desfasada → `409 CONFLICTO_VERSION`; en estado no editable → `422`.
- [ ] `PUT triaje` acepta una sola forma; omisión exige justificación; mueve a `EN_GESTION_APH`.
- [ ] Derivar sin consentimiento → `422 CONSENTIMIENTO_REQUERIDO`; con él → `201` con `sla.venceEn = fechaDerivacion + 12/24/48 h` y `ahoraServidor`.
- [ ] La atención derivada aparece en la bandeja de Psicología con el mismo `sla` (F1/F3).
- [ ] Cierre con rutas abiertas → `422 RUTAS_PENDIENTES`.
- [ ] Un usuario TAPH no recibe notas `PSICO`/`SEGTO` en `GET` y recibe `403` en `/psicologia/*`.
- [ ] Los logs no contienen documentos ni nombres.

## 11. Qué hará el frontend cuando el endpoint exista

Poner `lineaAlma.mocks.personas` y `.atencionesAph` en `false` en `environment*.ts`. Los servicios ya apuntan a estas
rutas; `AlmaApiClient` traduce los errores. Si cambia un nombre de campo, se ajusta `aph/services/*` (y `aAtencion`).
Se verifican con el servicio real los escenarios del Anexo B (cédulas ficticias `1000000001…10`).
