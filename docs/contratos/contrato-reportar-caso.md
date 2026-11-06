# Contrato de API — Creación de reportes de caso (`/reportar-caso` y reporte anónimo)

> **Para:** equipo de Backend de CASILDA
> **De:** equipo de Frontend (`casilda-frontend`, Angular 21)
> **Fecha:** 4 de noviembre de 2026
> **Estado actual:** el formulario **no consume ningún endpoint de creación**. Al finalizar,
> `enviarReporte()` genera un código `CAS-` con cuatro dígitos aleatorios en el navegador y
> abre el diálogo de éxito. Nada se persiste; la ruta de activación elegida solo queda en el
> borrador local (`localStorage`). Este documento define lo que Backend debe exponer para
> reemplazar ese comportamiento.
>
> **Convención de este documento:** lo marcado **[Front]** está verificado en el código
> citado. Lo marcado **[Propuesta]** es una recomendación del frontend que Backend debe
> aceptar o corregir. Ninguna propuesta describe algo que ya exista en el servidor.

---

## 1. Contexto y qué se necesita

Un mismo formulario multipaso atiende dos canales (**[Front]** `src/app/app.routes.ts`):

| Ruta | Quién | Modo |
|---|---|---|
| `/formulario-anonimo` (alias `/reporte-anonimo`) | Persona sin sesión | `anonimo` |
| `/reportar-caso` | Rol `USUARIO` autenticado (`roleGuard`) | `autenticado` |

Ambas rutas cargan `FormularioAnonimoComponent` (`src/app/components/formulario-anonimo/`) y
deben poder crear el reporte con **la misma operación**, que devuelva un **código CAS único
generado por el servidor**. Hoy la unicidad no está garantizada: 9 000 valores posibles,
generados en el cliente, sin consulta.

Archivos de referencia en el frontend:

| Archivo | Rol |
|---|---|
| `src/app/components/formulario-anonimo/formulario-anonimo.component.ts` | Formularios, validaciones y `enviarReporte()` (único punto a reemplazar). |
| `src/app/core/forms/documento-identidad.ts` | Longitudes y reglas de documento y TI/mayoría de edad. |
| `src/app/services/listas.service.ts` | Maestros (`/maestros/*`) y sus valores de respaldo. |
| `src/app/core/a11y/resumen-errores.component.ts` | Muestra errores por campo; necesita claves que coincidan con el DTO. |

---

## 2. Decisiones que necesitamos de Backend

Son las que bloquean escribir el servicio del frontend. Cada una trae recomendación.

| # | Decisión | Opciones | Recomendación | Si cambia, en el front… |
|---|---|---|---|---|
| D1 | **Qué hace `rutaActivacionId` al crear el reporte** | **A)** solo registra la ruta *solicitada*; una profesional la revisa y la activa. **B)** activa la ruta de inmediato. | **A.** En el canal anónimo no hay identidad ni canal de contacto garantizado; activar una ruta (remisiones, notificaciones) sin revisión humana es riesgoso en un caso de VBG. | El texto del diálogo de éxito ya asume A (§ `TEXTOS_REPORTE.exitoInstruccion`: «Para activar una ruta… inicie sesión e ingrese este ID»). Con B habría que reescribirlo. |
| D2 | **Ruta de la operación** | `POST /reportes` · `POST /casos/reporte` · otra | `POST /reportes` (no choca con `/solicitudes/acompanamiento`). | Una constante en el servicio. |
| D3 | **Mismo endpoint para anónimo y autenticado** | Uno solo, o dos. | Uno solo; el modo lo decide el servidor por la **presencia de un JWT válido**, nunca por un campo del cuerpo (el cliente no es de fiar). | El servicio no envía ningún campo `modo`. |
| D4 | **Formato del código CAS** | Libre, siempre con prefijo `CAS-`. | `CAS-` + secuencia o aleatorio de longitud suficiente, ≤ 20 caracteres, con restricción `UNIQUE` en base de datos y reintento ante colisión. Ver §7 sobre adivinabilidad. | Solo se muestra el valor recibido. |
| D5 | **Qué pasa con los demás datos que captura el formulario** | Ver §4.3. | Decidir ahora: incluirlos en el DTO de esta versión o retirarlos del formulario. | Si se incluyen, se amplía el mapeo; si no, se retiran pasos del formulario. |
| D6 | **Obligatoriedad por modo** | Ver §4.2. | La tabla del §4.2. | Validadores condicionados al modo. |
| D7 | **Límite de longitud de `descripcionHechos`** | — | 4 000 caracteres. **[Propuesta]** El front hoy no define máximo. | `maxlength` + contador en el campo. |

---

## 3. Endpoint requerido

### 3.1 Crear el reporte

```
POST {apiBaseUrl}/reportes        (ruta sujeta a D2)
```

| Aspecto | Requerimiento |
|---|---|
| **Autenticación** | **Público.** El canal anónimo existe antes del login: no debe exigir `Authorization` ni responder `401`. |
| **Token opcional** | `authInterceptor` adjunta `Authorization: Bearer <jwt>` a todas las peticiones cuando hay sesión. Con token válido, el servidor asocia el reporte a esa persona; sin él, el reporte es anónimo. Un token inválido o vencido no debe convertir el reporte en anónimo en silencio: responder `401` (el interceptor ya lo maneja). |
| **Content-Type** | `application/json; charset=utf-8`. |
| **CORS** | Permitir `POST` desde el origen del frontend con `Authorization` y `Content-Type`. |

**Petición** (los campos del pedido, con los nombres exactos del DTO):

```json
{
  "tipoDocumentoId": 1,
  "numeroDocumento": "1020304050",
  "fechaNacimiento": "1999-03-14",
  "tipoLugar": "interno",
  "campusId": 1,
  "facultad": "Facultad de Medicina",
  "bloque": "Bloque 12",
  "espacio": "Aula 201",
  "lugarDetalleExterno": null,
  "descripcionHechos": "Texto libre con el relato de los hechos.",
  "rutaActivacionId": 2
}
```

**Respuesta** `201 Created`:

```json
{
  "id": 481,
  "codigo": "CAS-7Q4M2X",
  "fechaRegistro": "2026-11-04T15:20:31-05:00",
  "rutaActivacion": { "id": 2, "codigo": "RUTA_X", "nombre": "Ruta de atención psicosocial", "estado": "SOLICITADA" }
}
```

- El frontend solo **necesita** `codigo` (lo muestra en el diálogo de éxito). `id`,
  `fechaRegistro` y `rutaActivacion.estado` se piden para poder mostrar el estado real de la
  ruta (D1) y para trazabilidad.
- `estado` de la ruta: `"SOLICITADA"` si se acepta D1-A; `"ACTIVA"` si D1-B. **[Propuesta]**

| Código | Cuándo |
|---|---|
| `201` | Reporte creado. |
| `400` | Validación (ver §5). |
| `401` | Token presente pero inválido o vencido. |
| `429` | Límite de tasa del canal público (ver §7). |
| `500` / `503` | Falla del servidor. Nunca devolver `200` con código no persistido. |

---

## 4. Diccionario de campos

### 4.1 Campos y mapeo con el formulario

| Campo del DTO | Tipo | Regla | Control del front **[Front]** |
|---|---|---|---|
| `tipoDocumentoId` | `number` (id de `/maestros/tipos-identificacion`) | Debe existir y estar activo. | `formPerfil.victima.tipoDocumento` |
| `numeroDocumento` | `string` | Solo caracteres válidos para el tipo; longitud según §5.2. Se envía ya limpio (mayúsculas, sin puntos ni espacios). | `formPerfil.victima.identificacion` |
| `fechaNacimiento` | `string` fecha **`YYYY-MM-DD`**, sin hora ni zona | Anterior a hoy (zona `America/Bogota`). | `formPerfil.victima.fechaNacimiento` (en el front es `Date`; se serializa solo la fecha para no desplazar el día por zona horaria). |
| `tipoLugar` | `string` enumerado: `"interno"` \| `"externo"` | Minúsculas, cerrado. | `formRelato.tipoLugar` |
| `campusId` | `number` (id de `/maestros/campus`) | Ver §5.3. | `formRelato.sedeCampus` (**el control se llama distinto del campo**). |
| `facultad` | `string` | Texto libre, ≤ 120. | `formRelato.facultad` |
| `bloque` | `string` | Texto libre, ≤ 60. | `formRelato.bloque` |
| `espacio` | `string` | Texto libre, ≤ 120. | `formRelato.espacio` |
| `lugarDetalleExterno` | `string` | Texto libre, ≤ 255. | `formRelato.lugarDetalleExterno` |
| `descripcionHechos` | `string` | No vacío ni solo espacios; ≤ 4 000 (D7). **Texto plano**, no se interpreta como HTML. | `formRelato.descripcionHechos` |
| `rutaActivacionId` | `number` (id de `/maestros/rutas-activacion`) | Debe existir y estar activa. | `formVictimario.rutaActivacion` |

Los campos opcionales que no se llenan se envían como `null` (no como `""`).

### 4.2 Obligatorio por modo — **[Propuesta]** a confirmar

Estado actual del front: **solo `descripcionHechos` y `rutaActivacion` son obligatorios**
(`formRelato`, `formVictimario`); documento y fecha de nacimiento son opcionales; ver §6.

| Campo | Anónimo | Autenticado | Nota |
|---|---|---|---|
| `descripcionHechos` | **Sí** | **Sí** | Es el reporte. |
| `rutaActivacionId` | **Sí** | **Sí** | Hoy es `Validators.required` en el front. |
| `tipoLugar` | Opcional | Opcional | Hoy `null` es válido. |
| `campusId` / `facultad` / `bloque` / `espacio` | Opcional | Opcional | Salvo la regla cruzada del §5.3. |
| `lugarDetalleExterno` | Opcional | Opcional | Salvo la regla cruzada del §5.3. |
| `tipoDocumentoId` + `numeroDocumento` | **Opcionales** (par: ambos o ninguno) | Opcionales (par) | En el canal anónimo no se debe forzar a identificarse. Con sesión, el documento ya consta en el perfil: se recomienda **no pedirlo en el cuerpo** y tomarlo del usuario. |
| `fechaNacimiento` | Opcional | Opcional | Si viene con TI, aplica §5.4. |

**Confirmar:** ¿en modo autenticado se toman los datos de la persona desde el perfil y el
cuerpo los ignora, o el cuerpo puede referirse a una tercera persona (el formulario permite
reportar «en representación de un tercero»)? Esto cambia si `tipoDocumentoId`,
`numeroDocumento` y `fechaNacimiento` describen **a quien reporta** o **a la víctima**.

### 4.3 Datos que el formulario captura y el DTO del pedido **no incluye**

**[Front]** El formulario hoy recoge, además de lo anterior: tipos de violencia
seleccionados (`tipoVbg` y siete listas de modalidades), datos de la víctima (nombres,
correo, género, cargo), medio de contacto (`correoContacto`, `whatsappContacto`), datos del
presunto agresor (`formVictimario`: documento, nombres, vínculos, `remitirUad`) y evidencias
(`formEvidencias.archivos`). Con el DTO del §3.1 **todo eso se perdería** al enviar.

Decisión **D5**: o se amplía el contrato (el frontend entrega el esquema campo a campo en
una segunda versión de este documento), o se retiran esos pasos del formulario. Mientras
tanto este contrato cubre únicamente lo pedido.

---

## 5. Validaciones en servidor

El front ya aplica las reglas de este apartado, pero **no es un control de seguridad**:
Backend debe repetirlas.

### 5.1 Generales

- Cuerpo JSON válido; campos desconocidos se ignoran (no fallan).
- Cadenas: recortar espacios; `""` equivale a `null`.
- `descripcionHechos`, `facultad`, `bloque`, `espacio`, `lugarDetalleExterno` se guardan
  como texto plano; no aceptar ni ejecutar marcado.

### 5.2 Documento — longitud y formato

**[Front]** `src/app/core/forms/documento-identidad.ts`. El código del tipo sale del
maestro (`codigo`); el backend usa `PAS` para pasaporte.

| Tipo (`codigo`) | Longitud máxima | Caracteres |
|---|---|---|
| `CC` | **10** | Solo dígitos |
| `TI` | **11** | Solo dígitos |
| `CE` | **6** | Letras y dígitos (A–Z, 0–9) |
| `PAS` | **16** | Letras y dígitos (A–Z, 0–9) |
| Cualquier otro | **20** (máximo genérico) | Solo dígitos |

El front además trata `RC` (11), `NUIP` (10) y `NIP` (11) con su propia longitud: **[Propuesta]**
mantenerlas igual en el servidor si esos tipos existen en el maestro; si no existen, se retiran
del front.

Errores: `numeroDocumento` → «El documento debe tener solo números y máximo 10 dígitos para
cédula de ciudadanía» (el mensaje nombra el tipo y el límite).

### 5.3 Lugar — reglas cruzadas

| Si `tipoLugar` es… | Entonces |
|---|---|
| `"interno"` | `campusId` **obligatorio**. `facultad`, `bloque`, `espacio` opcionales. `lugarDetalleExterno` debe ser `null` (se ignora o se rechaza; ver pregunta). |
| `"externo"` | `lugarDetalleExterno` **obligatorio**. `campusId`, `facultad`, `bloque`, `espacio` deben ser `null`. |
| `null` | Todos los campos de lugar deben ser `null`. |

Error de `campusId` obligatorio → clave `campusId`; error de lugar externo → clave
`lugarDetalleExterno`. **Confirmar:** ¿se ignoran los campos del lugar contrario o se
rechazan con `400`? **[Propuesta]** ignorarlos y guardarlos como `null`.

### 5.4 Tarjeta de identidad y mayoría de edad

**[Front]** `tarjetaIdentidadMenorEdadValidator` (`error: tiMayorEdad`).

- Si el tipo es `TI` y `fechaNacimiento` corresponde a una persona de **18 años cumplidos o
  más** al día de la solicitud (hora de `America/Bogota`), responder `400` con
  `validationErrors.tipoDocumentoId`: «La tarjeta de identidad solo aplica a menores de 18
  años. Seleccione otro tipo de documento.»
- Si no viene `fechaNacimiento`, la regla no se evalúa.
- `fechaNacimiento` igual o posterior a hoy → `400` con clave `fechaNacimiento`
  («La fecha de nacimiento debe ser anterior a hoy»). **[Front]** `fechaNacimientoPasadaValidator`.

### 5.5 Pares y existencia

- `tipoDocumentoId` y `numeroDocumento` van **juntos**: uno sin el otro → `400` en el campo
  que falta.
- `tipoDocumentoId`, `campusId` y `rutaActivacionId` que no existan o estén inactivos →
  `400` en su propio campo (no `404`).

---

## 6. Errores de validación por campo

Para que el formulario muestre cada error junto a su campo y en el resumen enfocable
(`ResumenErroresComponent`, WCAG 3.3.1), se pide el formato que el backend **ya** usa en
`/contenidos` (`docs/contratos/contrato-contenidos-home.md` §8.1):

```json
{
  "timestamp": "2026-11-04T15:20:31Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Datos inválidos",
  "path": "/api-casilda/reportes",
  "validationErrors": {
    "numeroDocumento": "El documento debe tener máximo 10 dígitos para cédula de ciudadanía",
    "tipoDocumentoId": "La tarjeta de identidad solo aplica a menores de 18 años. Seleccione otro tipo de documento.",
    "campusId": "Seleccione el campus donde ocurrieron los hechos"
  }
}
```

- Las **claves deben ser exactamente los nombres del DTO** (§4.1). Un error cruzado se
  asigna al campo que la persona debe corregir.
- Todos los errores de la petición van **juntos** en una sola respuesta (no uno por intento).
- Mensajes en español, dirigidos a la persona usuaria, sin culpabilizar ni exponer detalles
  técnicos o de base de datos.
- Validaciones que hoy llegan como `{ message }` suelto no se pueden asignar a un campo:
  evitarlas para este endpoint.

---

## 7. Privacidad y seguridad

Es el canal por el que una persona reporta violencia basada en género, a veces sin
identificarse.

- **Código CAS no adivinable.** En el canal anónimo el código es la única llave para que la
  persona vincule el caso después (diálogo de éxito). Un consecutivo corto permite enumerar
  reportes ajenos. **[Propuesta]** parte aleatoria no secuencial de al menos 6 caracteres; y
  la operación de vincular (fuera de este contrato) no debe revelar si un código existe ante
  intentos repetidos.
- **Reporte anónimo = sin rastro de identidad.** No guardar IP, user agent ni cabeceras que
  permitan re-identificar, salvo decisión explícita del equipo legal. No registrar en logs el
  cuerpo de la petición (`numeroDocumento`, `descripcionHechos`).
- **Límite de tasa (`429`)** sobre el endpoint público, para evitar spam y enumeración.
- **Cache:** respuesta con `Cache-Control: no-store`.
- **HTTPS** obligatorio.

---

## 8. Maestros

El front muestra el campo `nombre` **tal cual llega**. Hoy se consumen:

| Maestro | Ruta | Uso en este formulario |
|---|---|---|
| Tipos de documento | `GET /maestros/tipos-identificacion` | `tipoDocumentoId` |
| Campus | `GET /maestros/campus` | `campusId` |
| **Rutas de activación** | `GET /maestros/rutas-activacion` | `rutaActivacionId` |

**Forma requerida** (arreglo plano, igual que el resto de `/maestros/*`):

```json
[
  { "id": 1, "codigo": "RUTA_PSICO", "nombre": "Acompañamiento psicosocial" },
  { "id": 2, "codigo": "RUTA_JURID", "nombre": "Asesoría jurídica" }
]
```

- `rutas-activacion` devuelve **solo opciones activas**, con `id`, `codigo` y `nombre`.
  Las inactivas no deben aparecer; las que ya estén en reportes históricos conservan su `id`.
- **Redacción de `nombre` en *sentence case***: primera letra en mayúscula y el resto en
  minúscula, salvo nombres propios y siglas (UdeA, VBG, UAD, CE). Ejemplos: «Cédula de
  ciudadanía», «Asesoría jurídica»; **no** «Cédula De Ciudadanía» ni «ASESORÍA JURÍDICA».
  Revisar los tres maestros anteriores: el front muestra el texto sin transformarlo, así que
  el formato que llegue es el que se ve (se busca no reintroducir *Title Case*).
- Orden: el que deba verse en pantalla; el front no reordena.
- ⚠️ **Riesgo actual [Front]:** `ListasService.obtenerMaestro('rutas-activacion')` cae a `[]`
  si el endpoint falla o no existe, y `rutaActivacion` es obligatorio: **la persona no
  podría terminar el reporte**. **[Propuesta del front]** al integrar, mostrar un error con
  «Reintentar» en lugar de un selector vacío.

---

## 9. Compatibilidad y evolución

**No rompen el front (aditivos):** campos nuevos en la respuesta, nuevos valores en
maestros, ampliar longitudes.

**Rompen el front (acordar antes):** renombrar campos del §4.1; devolver `id` como `string`;
cambiar `tipoLugar` a mayúsculas; fechas con hora o epoch; cambiar el formato de
`validationErrors`; exigir autenticación en el endpoint; devolver `200` sin `codigo`.

---

## 10. Criterios de aceptación

- [ ] `POST {apiBaseUrl}/reportes` responde `201` **sin token** y también **con token**.
- [ ] La respuesta trae `codigo` generado por el servidor, con prefijo `CAS-`, único
      (restricción `UNIQUE`) y persistido antes de responder.
- [ ] Dos peticiones simultáneas nunca devuelven el mismo `codigo`.
- [ ] Con `tipoDocumentoId` = TI y `fechaNacimiento` que da ≥ 18 años → `400` con clave
      `tipoDocumentoId`.
- [ ] CC de 11 dígitos, TI de 12, CE de 7, pasaporte de 17 y cualquier otro de 21 → `400`
      con clave `numeroDocumento`.
- [ ] `tipoLugar: "interno"` sin `campusId` → `400` con clave `campusId`; `"externo"` sin
      `lugarDetalleExterno` → `400` con clave `lugarDetalleExterno`.
- [ ] Varios errores a la vez llegan juntos en `validationErrors`.
- [ ] `GET /maestros/rutas-activacion` devuelve solo activas con `id`, `codigo`, `nombre`.
- [ ] Los nombres de `tipos-identificacion`, `campus` y `rutas-activacion` están en *sentence case*.
- [ ] El reporte anónimo no guarda IP ni user agent; el cuerpo no aparece en logs.
- [ ] D1–D7 respondidas por escrito.

---

## 11. Qué hará el frontend cuando el endpoint exista

Un cambio acotado en `FormularioAnonimoComponent`:

1. Un `ReporteCasoService` (`src/app/services/`) con `crear(dto)`, que mapea el formulario al DTO
   del §4.1 (`sedeCampus` → `campusId`; `Date` → `YYYY-MM-DD`; vacíos → `null`).
2. `enviarReporte()` deja de generar el código: llama al servicio, deshabilita el botón
   mientras espera (evita duplicados) y abre `DialogoExitoComponent` con el `codigo` recibido.
3. Los `validationErrors` se asignan a los controles por clave y alimentan
   `ResumenErroresComponent`; cualquier otro error pasa por `NotificacionService`.
4. Se limpia el borrador local solo tras un `201`.
5. Pruebas del servicio y del mapeo (`.spec.ts`) y retiro del código aleatorio.

---

## 12. Contacto

Dudas o cambios: equipo de Frontend de CASILDA, antes de implementar.
