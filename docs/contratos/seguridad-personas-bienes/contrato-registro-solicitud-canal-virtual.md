# Contrato — Registro de solicitud desde Seguridad a personas y bienes

> **Para:** equipo de Backend (`casilda-backend`)
> **De:** equipo Frontend (`casilda-frontend`)
> **Fecha:** 24 de noviembre de 2026
> **Estado:** PROPUESTO — NO IMPLEMENTADO. La pantalla ya existe en el front.
> **Backend revisado:** `origin/main`, commit `89f11ea` (23 de noviembre de 2026), solo código y
> scripts de `database/`. **No se probó contra QA**: los permisos efectivos son los de la base desplegada.

## 1. Contexto y qué se necesita

El analista de riesgos (`SPB_ANALISTA`), la central de monitoreo (`SPB_CENTRAL`) y la coordinación de
Seguridad (`SPB_COORDINACION`) registran solicitudes en `/seguridad/registro-solicitud`. Es una **copia** de «Nueva solicitud» del Equipo de Atención y usa
el mismo `POST /solicitudes/acompanamiento`; agrega el canal virtual y el contacto del remitente.

| Qué bloquea hoy | Efecto | Sección |
|---|---|---|
| Permisos de los roles SPyB | Esos roles no pueden radicar. | §3 |
| Tres campos nuevos sin declarar | La solicitud se crea, pero **el canal y el contacto se pierden**. | §4 |
| Endpoint de evidencias inexistente | La solicitud se crea y los archivos no se guardan. | §3.2 |

Archivos del front:
`src/app/seguridad-personas-bienes/pages/registro-solicitud/registro-solicitud-spyb.component.{ts,html}`,
`src/app/seguridad-personas-bienes/seguridad-personas-bienes.routes.ts`,
`src/app/services/solicitud.service.ts`, `src/app/services/listas.service.ts`.

## 2. Decisiones que necesitamos de Backend

| # | Decisión | Recomendación | Impacto en el front |
|---|---|---|---|
| D1 | Nombres de los campos nuevos. | `canalVirtual`, `contactoVirtualCorreo`, `contactoVirtualTelefono`: ya se envían así. | Otros nombres obligan a cambiar el servicio y el componente. |
| D2 | Código del rol de la central y del analista. | `SPB_CENTRAL` y `SPB_ANALISTA`. El segundo ya aparece en los scripts; el diseño previo (`README.md` de esta carpeta) proponía `CENTRAL_MONITOREO` y `ANALISTA_RIESGOS`, y conviene un solo catálogo. | El front reconoce ambas variantes por contener «CENTRAL» o «ANALISTA». |
| D3 | ¿Cómo distinguir las solicitudes que llegan desde SPyB? | Derivarlo en el servidor del rol de quien crea (`usuarioCreacion`) y exponer `origen` en la respuesta; no confiar en un campo enviado por el cliente. | Ninguno para radicar. Permitiría filtrarlas en la bandeja de reparto. |
| D4 | ¿El canal virtual es obligatorio en el servidor? | No: el Equipo de Atención envía «Virtual» sin canal. Exigirlo solo si `origen` es SPyB (D3). | Ninguno: el front ya lo exige en SPyB. |
| D5 | Roles SPyB y datos que devuelve la búsqueda de personas (`/personas/**`). | Permitirla, dejando traza de quién consultó qué documento. Si no se autoriza, retirar la búsqueda en la copia de SPyB. | Hoy el botón de lupa mostraría error. |
| D6 | ¿Qué consulta SPyB después de radicar? | Definir si necesita ver sus propias solicitudes. Hoy no se pide `GET /solicitudes/**` para estos roles. | Tras enviar, el front vuelve a la consola del rol y no vuelve a consultar la solicitud. |

## 3. Endpoints que usa la pantalla

Rutas relativas a `{apiBaseUrl}`. Autenticación: JWT. La autorización es dinámica por tabla
`endpoint` / `endpointrole` (`DynamicEndpointAuthorizationManager`).

### 3.1. Permisos

«Hoy» sale de los scripts de `database/` del backend.

| Método y ruta | Para qué | `SPB_ANALISTA` hoy | `SPB_CENTRAL` hoy | `SPB_COORDINACION` hoy | Se pide |
|---|---|---|---|---|---|
| `GET /maestros/**` | Listas del formulario | Sí (`initial_data.sql`) | No se encontró | Sí (`initial_data.sql`) | Los tres |
| `GET /personas/documento/{numeroDocumento}?tipoDocumentoId=` | Autocompletar remitente y solicitante | No se encontró | No se encontró | No se encontró | Los tres (D5) |
| `POST /solicitudes/acompanamiento` | Radicar | No se encontró | No se encontró | No se encontró | Los tres |
| `POST /solicitudes/acompanamiento/{id}/evidencias` | Adjuntos | El endpoint no existe | El endpoint no existe | El endpoint no existe | Los tres |

`SPB_CENTRAL` no aparece en el código ni en los scripts revisados: hay que **crear el rol**
(ver `casilda-backend/docs/GUIA_CREACION_ROLES.md`) y confirmar que `SPB_ANALISTA` exista en la tabla
`rol` del entorno. Los permisos deben ser los de la tabla anterior, sin extenderlos a `/solicitudes/**`.

Si un maestro responde `403`, el front **no muestra error**: usa una lista de respaldo propia
(`ListasService`), cuyos `id` pueden no coincidir con los de la base. Por eso los maestros son
requisito para radicar datos correctos.

### 3.2. Evidencias (falta el endpoint; afecta también al Equipo de Atención)

El front llama, después de crear la solicitud:

```
POST /solicitudes/acompanamiento/{id}/evidencias
Content-Type: multipart/form-data
Parte repetida: archivos
```

`SolicitudController` no lo declara. Hoy la persona ve el aviso «La solicitud se creó, pero no fue
posible adjuntar las evidencias».

Propuesta: respuesta `201` con un arreglo `[{ "id", "nombre", "tamano", "tipo" }]`; mismos límites que
`POST /reportes` (máximo 5 archivos, 10 MB cada uno, 25 MB en total; PDF, JPG, PNG, MP4, MOV, 3GP).
`application.yml` ya fija 10 MB y 25 MB. **El front de esta pantalla todavía no valida tipo ni
cantidad**, y su texto sugiere 20 MB y audios: hay que alinearlo cuando se definan los límites.

## 4. Crear la solicitud con canal virtual

`POST /solicitudes/acompanamiento` · `application/json` · `201`.

### 4.1. Campos nuevos de `SolicitudAcompanamientoRequest`

Solo se envían desde SPyB y con medio **Virtual**. En los demás casos no vienen en el JSON.

| Campo | Tipo | Obligatorio en el front | Regla | Control del front |
|---|---|---|---|---|
| `canalVirtual` | enum `CORREO` \| `WHATSAPP` | Sí | Solo con medio Virtual. | `canalVirtual` |
| `contactoVirtualCorreo` | string \| null | No | Correo válido, máx. 150. | `contactoVirtualCorreo` |
| `contactoVirtualTelefono` | string \| null | No | `^[0-9]{7,12}$`. | `contactoVirtualTelefono` |

- El contacto es el de **quien envió el mensaje**. No reemplaza `datosRemitente` (funcionario de una
  solicitud indirecta) ni los correos y teléfonos del solicitante.
- El contacto no depende del canal: puede llegar el teléfono con canal `CORREO`, y viceversa.
- El front asume `medioSolicitudId` `1` = Presencial y `2` = Virtual (fijo en el código). Confirmar
  que coincide con el maestro `medio-solicitud` de cada entorno.

### 4.2. Petición de ejemplo (datos ficticios)

```json
{
  "tipoSolicitudId": 1,
  "medioSolicitudId": 2,
  "canalVirtual": "WHATSAPP",
  "contactoVirtualCorreo": null,
  "contactoVirtualTelefono": "3000000000",
  "datosSolicitante": {
    "primerNombre": "Persona",
    "primerApellido": "De Prueba",
    "tipoDocumentoId": 1,
    "numeroDocumento": "1000000000",
    "fechaNacimiento": null,
    "identidadGeneroId": 1,
    "correos": [{ "tipoId": 1, "correo": "persona@ejemplo.invalid" }],
    "telefonos": [{ "tipoId": 1, "telefono": "3000000000" }]
  },
  "datosRemitente": null,
  "descripcionHechos": "Descripción ficticia para pruebas."
}
```

El front envía además otros campos que el DTO actual no declara (`datosCaso`, `agresorNombre`
compuesto, etc.). No se encontró configuración que rechace propiedades desconocidas, por lo que hoy se
ignoran. El resto del contrato base no cambia.

### 4.3. Respuesta

`SolicitudAcompanamientoResponse` ya devuelve `medioSolicitudId` y `medioSolicitud`. Agregar:

```json
{
  "id": 120,
  "codigo": "SOL-120",
  "medioSolicitudId": 2,
  "medioSolicitud": "Virtual",
  "canalVirtual": "WHATSAPP",
  "contactoVirtualCorreo": null,
  "contactoVirtualTelefono": "3000000000"
}
```

Deben venir en `GET /solicitudes/acompanamiento/{id}`. En listados no se necesitan y no conviene
exponer el contacto.

### 4.4. Edición

`PUT /solicitudes/acompanamiento/{id}` lo usa hoy el Equipo de Atención y **no envía** estos campos:
si faltan, el servidor debe conservar lo guardado. Limpiarlos solo si el medio cambia a Presencial.

### 4.5. Errores

```json
{
  "message": "Datos inválidos",
  "validationErrors": {
    "canalVirtual": "Indique si llegó por correo o por WhatsApp.",
    "contactoVirtualCorreo": "Verifique que el correo tenga el formato nombre@dominio.com.",
    "contactoVirtualTelefono": "Escriba solo números (de 7 a 12 dígitos)."
  }
}
```

| Código | Cuándo |
|---|---|
| `400` | Validación, o campos del canal con medio Presencial. Claves iguales a las del DTO. |
| `401` | Sin sesión. El front cierra la sesión. |
| `403` | Rol sin permiso. |

## 5. Persistencia

Propuesta, sobre la entidad de la solicitud (`SolicitudAtencion`); columnas anulables, sin migrar datos:

| Columna | Tipo |
|---|---|
| `canal_virtual` | `VARCHAR(10)`, `CHECK (canal_virtual IN ('CORREO','WHATSAPP'))` |
| `contacto_virtual_correo` | `VARCHAR(150)` |
| `contacto_virtual_telefono` | `VARCHAR(12)` |

## 6. Maestros

Todos por `GET /maestros/{nombre}`: `tipos-solicitud`, `medio-solicitud`, `campus`,
`unidades-administrativas`, `unidades-academicas`, `tipos-identificacion`, `identidades-genero`,
`cargos`, `vinculos-udea`, `vinculos-agresor-victima`, y los tipos de correo y teléfono de los modales.
No se piden maestros nuevos: el canal es un enum fijo.

## 7. Privacidad y seguridad

- El contacto virtual es un dato personal de quien reporta VBG: **no registrarlo en logs** ni en
  mensajes de error, y exigir autenticación y rol.
- Los roles SPyB radican, pero **no deben ganar acceso** a notas de atención, expedientes ni listados
  de solicitudes (regla Persona ≠ Caso ≠ Actuación de seguridad).
- La búsqueda por documento (D5) entrega datos personales: dejar auditoría y limitar la tasa.
- `usuarioCreacion` debe tomarse del token, nunca del cuerpo.

## 8. Compatibilidad

Todo es aditivo: campos opcionales, columnas anulables y permisos nuevos. El Equipo de Atención no
cambia. Pasar `canalVirtual` a obligatorio para todos **rompería** su formulario (D4).

## 9. Criterios de aceptación

- [ ] Un usuario `SPB_CENTRAL`, uno `SPB_ANALISTA` y uno `SPB_COORDINACION` reciben `200` en los maestros de §6.
- [ ] Los tres crean una solicitud (`201`) y reciben `403` en `GET /solicitudes/acompanamiento`.
- [ ] Con medio Virtual, los tres campos se guardan y vuelven en el `GET` por id.
- [ ] Sin los campos (Equipo de Atención), la creación sigue respondiendo `201`.
- [ ] `canalVirtual` distinto de `CORREO`/`WHATSAPP`, correo mal formado o teléfono con letras → `400` con la clave del campo.
- [ ] Campos del canal con medio Presencial → `400`.
- [ ] Un `PUT` sin los campos conserva lo guardado.
- [ ] La carga de evidencias responde `201` y rechaza tipos y tamaños fuera de límite.
- [ ] Los logs no contienen el correo ni el teléfono de contacto.

## 10. Qué hará el front

En desarrollo y demostración la pantalla está simulada (`environment.seguridadPyB.mocks.solicitudes`);
al publicarse el backend se pone en `false`. Ya envía los tres campos. Cuando el backend responda: mostrar los `validationErrors` junto a cada
campo (hoy muestra un aviso general), enseñar canal y contacto en el detalle de la solicitud y alinear
los límites y el texto de las evidencias (§3.2).
