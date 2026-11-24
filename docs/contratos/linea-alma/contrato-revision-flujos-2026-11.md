# Contrato de API — Revisión de flujos de Línea Alma (unificación APH + primer respondiente)

> **Estado:** PROPUESTO — el frontend ya lo consume con mocks (`environment.lineaAlma.mocks`).
> **Origen:** documento «Revisión de Flujos Línea Alma y revisión para ajustes» y formulario de referencia
> «Violeta Te Orienta (ahora Línea Alma)», noviembre de 2026.
> **Prefijo:** `{apiBaseUrl}/alma` (igual que el resto del módulo). Errores en el formato estándar `{ codigo, mensaje, detalles }`.
> **No sustituye** a `contrato-aph-*.md`: lo extiende. Donde diga «cambia», este documento prevalece.

## 1. Qué cambió en la pantalla (resumen para Backend)

| Pantalla | Cambio |
|---|---|
| «Registrar nueva atención» (antes «Nueva atención») | Dos pasos: **Registrar atención** y **Triaje y derivación**. Solicitud directa o indirecta, canal solo WhatsApp/Telefónico, información de los hechos, evidencias opcionales, APH y fecha asignados por el sistema. **Sin presunto agresor.** |
| Triaje y derivación | Triaje → nota de valoración APH → remisión a Psicología → panel de remisiones internas y externas con novedades. |
| Bandeja de remisiones | «Tomar remisión» abre la misma pantalla con todos los campos. |
| «Pendientes atención por psicología» (antes «Bandeja de Psicología») | Solo cambia el nombre. |
| Novedad de Psicología | Nuevo bloque **Datos de la persona** entre los intentos de contacto y las remisiones; precargado y editable salvo nombres y documento. |

## 2. Cambios en `AtencionAphDto` (`GET/POST/PATCH /atenciones-aph`)

| Campo | Tipo | Regla |
|---|---|---|
| `lugarOcurrencia` | `DENTRO_UDEA` \| `FUERA_UDEA` \| `null` | Opcional. |
| `evidencias[]` | `{ idEvidencia, nombre, tipo, tamanoBytes, fechaRegistro }` | Solo lectura; se llenan con el endpoint de §3. |
| `persona.fechaNacimiento` | `YYYY-MM-DD` \| `null` | Opcional; no futura, no anterior a 1900. |
| `persona.identidadGenero` | código de `identidades-genero` \| `null` | Opcional. |
| `persona.vinculoUniversidad` | código de `vinculos-udea` \| `null` | Opcional. |
| `solicitante.correo` | string \| `null` | Opcional; es el del tercero que solicita. |
| `solicitante.parentescoOtro` | string \| `null` | Obligatorio solo cuando `parentesco = OTRO`. |

- **Solicitud directa / indirecta:** sigue siendo `solicitante.esTercero` (`false` = directa). En indirecta, `parentesco` es obligatorio;
  `telefono` y `correo` son opcionales y corresponden a quien solicita, no a la persona afectada.
- **«APH que atiende» y «Fecha y hora de atención»:** no se envían. El front muestra `tomadaPor` y `fechaCreacion`, que asigna el servidor.
- **`canalIngreso`:** los códigos no cambian (`LLAMADA`, `WHATSAPP`, `REMISION_*`). Solo cambian las etiquetas: `LLAMADA` = «Telefónico».
  APH ya no ofrece «Presencial» ni «Virtual».
- **«Descripción de los hechos» → «Motivo de consulta»:** es el mismo campo `motivoConsulta`.

## 3. Evidencias de la atención (nuevo)

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `POST /atenciones-aph/{id}/evidencias` | `multipart/form-data`, parte `evidencias` (1…n archivos) | `201` con la `AtencionAphDto` actualizada |
| `DELETE /atenciones-aph/{id}/evidencias/{idEvidencia}` | — | `200` con la `AtencionAphDto` actualizada |

- Mismas reglas que las evidencias del reporte de caso: máx. 5 archivos por atención, 10 MB c/u, 25 MB en total, PDF/JPG/PNG/MP4/MOV/3GP.
- Solo con la atención editable por APH (`BORRADOR` o `EN_GESTION_APH`); si no, `422 ATENCION_NO_EDITABLE`.
- Pregunta abierta: ¿el archivo se descarga por un endpoint propio? El front hoy solo lista nombre y peso.

## 4. Remisiones: listados, «no acepta» y novedades

### 4.1 Catálogos (`GET /catalogos/{nombre}`)

| Catálogo | Uso | Contenido |
|---|---|---|
| `destinos-internos-aph` (nuevo) | Panel de remisiones de APH | `SPYB`, `MASCULINIDADES`, `BIENESTAR_FACULTAD` |
| `rutas-externas-aph` (nuevo) | Panel de remisiones de APH | `COMISARIA_FAMILIA`, `FISCALIA`, `INSPECCION_POLICIA`, `PROCURADURIA`, `RUTA_SALUD`, `OTRA` |
| `destinos-internos` (**cambia**) | Panel de Psicología | `EA`, `SPYB`, `UAD`, `PSICOORIENTACION_GENERO`, `MASCULINIDADES`, `SIN_DECISION`, `NO_APLICA` |
| `rutas-externas` (**cambia**) | Panel de Psicología | 15 opciones del formulario Violeta Te Orienta §6, incl. `LINEA_123_AGENCIA_MUJER`, `LINEA_123_MUJER_ANTIOQUIA`, `OTRA`, `SIN_DECISION` |
| `parentescos-solicitante` (**cambia**) | Relación del solicitante | 16 opciones de la revisión de flujos (`OTRO` habilita «¿Cuál?») |
| `identidades-genero` (nuevo) | Caracterización | **Placeholder**: lo oficial lo entrega el Equipo de Atención |
| `vinculos-udea` (nuevo) | Caracterización | 18 opciones del formulario Violeta Te Orienta §3 |

El front agrupa en `DESTINOS_PELIGRO_INMINENTE` los códigos que admiten activarse **sin consentimiento por peligro inminente**:
`SPYB`, `LINEA_123_AGENCIA_MUJER`, `LINEA_123_MUJER_ANTIOQUIA` (antes `LINEA_123`).
`ICBF`, `CAIVAS`, `POLICIA_NACIONAL` y `DUPLA_PSICOJURIDICA` como destino interno **salen** de los catálogos.

### 4.2 «No acepta / No toma ninguna decisión» y «No aplica»

`SIN_DECISION` y `NO_APLICA` se registran con `POST /derivaciones/internas` o `POST /rutas-externas` **sin `consentimiento` ni `motivo`**.
Dejan constancia; no llegan a ninguna bandeja. El servidor debe aceptarlos aunque `motivo` venga vacío.

### 4.3 Novedades por remisión (nuevo)

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `POST /derivaciones/internas/{idDerivacion}/seguimientos` | `{ novedad, fechaHora }` | `201` con la `DerivacionInternaDto` |
| `POST /rutas-externas/{idRuta}/seguimientos` | `{ novedad, fechaHora }` | `201` con la `RutaExternaDto` |

- `DerivacionInternaDto` y `RutaExternaDto` ganan `seguimientos[]`: `{ idSeguimiento, fechaHora, novedad, autor }` (vacío si no hay).
- `novedad`: 5…500 caracteres. `fechaHora`: ISO-8601, **no futura** (tolerancia de 1 minuto). Es el momento en que APH captó la novedad
  al volver a comunicarse con la persona, no el de registro. Se pueden agregar tantas como haga falta.
- Pendiente: el estado de la ruta externa (`ACTIVADA`/`EN_SEGUIMIENTO`/`CERRADA`) sigue siendo un `PATCH` aparte.
- Errores: `404 DERIVACION_NO_ENCONTRADA`, `404 RUTA_NO_ENCONTRADA`, `400 VALIDACION` por campo.

## 5. Datos de la persona desde Psicología (nuevo)

`PATCH /psicologia/novedades/{idAtencion}/persona` — cuerpo `{ version, persona: { fechaNacimiento?, identidadGenero?, vinculoUniversidad?,
telefonoPrincipal?, correoPersonal?, ciudad?, estrato? } }`. Responde `200` con la `NovedadPsicologiaDto`.

- **Nunca** modifica `nombres`, `apellidos`, `tipoIdentificacion` ni `numeroIdentificacion`: el servidor los ignora.
- Exige la novedad tomada por quien llama (`422 NOVEDAD_NO_TOMADA`) y la `version` vigente (`409 CONFLICTO_VERSION`).
- `400 VALIDACION` con `persona.telefonoPrincipal`, `persona.correoPersonal` o `persona.fechaNacimiento`.

## 6. Pendientes con el equipo (no son de Backend)

1. Catálogo oficial de **identidades de género** (hoy placeholder) y confirmar si `vinculos-udea` de Línea Alma es el mismo de Equipo de Atención.
2. **Correos y teléfonos múltiples** con «Tipo» y observaciones (como en el formulario del Equipo de Atención): el front aún usa un solo
   teléfono y un solo correo por persona.
3. **Primer y segundo nombre / apellido** por separado: el contrato sigue en `nombres` y `apellidos`.
4. De la revisión de flujos queda por definir el **«Anexo documento de seguimiento»** de Psicología y qué variables del formulario Violeta Te
   Orienta (tipología de violencias, componentes de atención, diagnóstico CIE-10) entran en el expediente.
5. Textos de ayuda y nombres de las opciones: validarlos con el equipo de atención.
