# Contrato requerido para solicitudes y bandeja de reparto

Este documento describe el contrato que necesita el frontend de CASILDA para crear, consultar, editar y repartir solicitudes. Los nombres de los campos coinciden con los DTO que ya consume el frontend.

## Reglas funcionales

- Una solicitud nueva no tiene un tipo de reparto asignado.
- Mientras no exista una asignación, el frontend muestra `Esperando reparto`.
- `Esperando reparto` no pertenece al catálogo de tipos de reparto y no debe guardarse en `tipoasignacion`.
- Los tipos seleccionables son los retornados por `GET /maestros/tipos-asignacion`. Actualmente deben ser `Prioritaria`, `Ordinaria` y `Seguimiento`.
- La descripción de los hechos, al menos un correo y al menos un teléfono son obligatorios.
- La fecha de nacimiento y el lugar de ocurrencia son opcionales.
- Los datos de la presunta persona agresora y las evidencias son opcionales.
- Crear y editar deben persistir y devolver el mismo conjunto de datos.
- La respuesta del listado debe contener los datos necesarios para desplegar el detalle sin depender de `localStorage`.

## Crear una solicitud

`POST /solicitudes/acompanamiento`

Campos relevantes que debe aceptar, validar y persistir:

```json
{
  "tipoSolicitudId": 1,
  "medioSolicitudId": 1,
  "observacionesTelefono": null,
  "observacionesCorreo": null,
  "datosSolicitante": {
    "primerNombre": "Ana",
    "segundoNombre": null,
    "primerApellido": "Pérez",
    "segundoApellido": null,
    "tipoDocumentoId": 1,
    "numeroDocumento": "12345678",
    "fechaNacimiento": null,
    "identidadGeneroId": 1,
    "vinculoUniversidadId": 2,
    "correos": [
      { "tipoId": 1, "correo": "ana@udea.edu.co" }
    ],
    "telefonos": [
      { "tipoId": 1, "telefono": "3001234567" }
    ]
  },
  "datosRemitente": null,
  "descripcionHechos": "Descripción obligatoria de los hechos.",
  "lugarOcurrencia": null,
  "agresorIdentificacion": null,
  "agresorNombre": "Nombre conocido",
  "agresorVinculoUdeaId": 1,
  "agresorOtroVinculoUdea": null,
  "agresorVinculoVictimaId": 3,
  "agresorOtroVinculoVictima": null,
  "agresorCorreo": null,
  "agresorRemitirUad": "no",
  "evidenciasResumen": null
}
```

Validaciones esperadas:

- `datosSolicitante.fechaNacimiento`: opcional; eliminar `@NotNull` del DTO del backend.
- `datosSolicitante.vinculoUniversidadId`: opcional, pero debe existir en el DTO y persistirse.
- `datosSolicitante.correos`: obligatorio y con mínimo un elemento válido.
- `datosSolicitante.telefonos`: obligatorio y con mínimo un elemento válido.
- `descripcionHechos`: obligatoria y no puede contener solo espacios.
- Todos los campos `agresor*`, `lugarOcurrencia` y las evidencias: opcionales.
- `agresorVinculoUdeaId` debe referenciar el catálogo `vinculos-udea`.
- `agresorVinculoVictimaId` debe referenciar el catálogo `vinculos-agresor-victima`.
- Los campos `agresorOtroVinculo*` solo se persisten cuando la opción seleccionada corresponde a `Otro`.

El backend actual solo acepta persona y remitente. Debe ampliar `SolicitudAcompanamientoRequest`, la persistencia y `SolicitudAcompanamientoResponse`. No debe depender del campo auxiliar `datosCaso` ni del almacenamiento del navegador.

## Consultar solicitudes

Endpoints:

- `GET /solicitudes/acompanamiento/{id}`
- `GET /solicitudes/acompanamiento`
- `GET /solicitudes/acompanamiento/paginado?page=0&size=10`

Cada elemento debe devolver, además de los datos actuales:

```json
{
  "id": 4,
  "codigo": "SOL-4",
  "estado": "Sin asignar",
  "descripcionHechos": "Descripción obligatoria de los hechos.",
  "lugarOcurrencia": null,
  "vinculoUniversidadId": 2,
  "vinculoUniversidad": "Estudiante",
  "agresorIdentificacion": null,
  "agresorNombre": "Nombre conocido",
  "agresorVinculoUdeaId": 1,
  "agresorVinculoUdea": "Estudiante",
  "agresorOtroVinculoUdea": null,
  "agresorVinculoVictimaId": 3,
  "agresorVinculoVictima": "Compañero de clase",
  "agresorOtroVinculoVictima": null,
  "agresorCorreo": null,
  "agresorRemitirUad": "no",
  "evidenciasResumen": null,
  "tipoAsignacionId": null,
  "tipoAsignacion": null,
  "tipoServicioId": null,
  "tipoServicio": null,
  "grupoProfesionalId": null,
  "profesional": null,
  "fechaReparto": null,
  "observacionesReparto": null
}
```

Cuando `tipoAsignacion` y `profesional` sean `null`, el frontend mostrará `Esperando reparto`. El backend no debe devolver un tipo de catálogo ficticio con ese nombre.

## Editar una solicitud

`PUT /solicitudes/acompanamiento/{id}`

`UpdateSolicitudRequest` debe aceptar y persistir, además de los campos actuales:

```json
{
  "vinculoUniversidadId": 2,
  "descripcionHechos": "Descripción actualizada.",
  "lugarOcurrencia": null,
  "agresorIdentificacion": null,
  "agresorNombre": "Nombre actualizado",
  "agresorVinculoUdeaId": 2,
  "agresorOtroVinculoUdea": null,
  "agresorVinculoVictimaId": 4,
  "agresorOtroVinculoVictima": null,
  "agresorCorreo": null,
  "agresorRemitirUad": "no",
  "evidenciasResumen": null
}
```

También debe aplicar las mismas reglas de creación: descripción, correo y teléfono obligatorios; fecha de nacimiento y lugar opcionales; presunta persona agresora y evidencias opcionales.

La respuesta del `PUT` debe ser una `SolicitudAcompanamientoResponse` completa y actualizada, no una respuesta parcial.

## Repartir una solicitud

Catálogos necesarios:

- `GET /maestros/tipos-asignacion`
- `GET /maestros/tipos-servicio`
- `GET /solicitudes/grupos-profesionales`

`GET /solicitudes/grupos-profesionales` debe devolver todos los grupos activos que pueden recibir reparto, con este formato:

```json
[
  { "id": 7, "nombre": "Dupla psicosocial", "activo": true },
  { "id": 8, "nombre": "Profesional de trabajo social", "activo": true }
]
```

El backend debe crear o habilitar los registros iniciales y ofrecer su administración. Si responde `[]`, el filtro `Repartido a` solo puede mostrar `Todos` y `Esperando reparto`, y el modal de reparto debe quedar bloqueado. El frontend no inventará profesionales ni duplas.

No se deben usar valores de respaldo hardcodeados en el frontend. Si un catálogo falla, debe devolverse un error y bloquear la confirmación.

Endpoint de reparto:

`POST /solicitudes/acompanamiento/{id}/asignar`

Request:

```json
{
  "grupoProfesionalId": 7,
  "idTipoAsignacion": 1,
  "idTipoServicio": 1,
  "observaciones": "Reparto definido por el equipo gestor.",
  "fechaReparto": "2026-10-28"
}
```

El backend debe:

1. Validar como obligatorios los cinco campos.
2. Validar que los tres identificadores existan y estén activos.
3. Guardar grupo profesional, tipo de asignación, tipo de servicio, observaciones y fecha de reparto.
4. Cambiar la solicitud al estado asignado que el frontend presenta como `Repartida`.
5. Retornar la solicitud completa con los nombres e identificadores guardados.
6. Mantener el historial si se reparte nuevamente.
7. Resolver siempre la asignación vigente con un orden determinista, por ejemplo `fechaCreacion DESC, id DESC`; no usar el último elemento de una colección JPA sin `@OrderBy`.
8. Ejecutar toda la operación en una única transacción.

Respuesta mínima esperada:

```json
{
  "id": 4,
  "codigo": "SOL-4",
  "estado": "Asignada",
  "tipoAsignacionId": 1,
  "tipoAsignacion": "Prioritaria",
  "tipoServicioId": 1,
  "tipoServicio": "Psicología",
  "grupoProfesionalId": 7,
  "profesional": "Dupla psicosocial",
  "observacionesReparto": "Reparto definido por el equipo gestor.",
  "fechaReparto": "2026-10-28"
}
```

## Evidencias

Las evidencias no deben viajar como nombres de archivo dentro del JSON de creación. Después de crear la solicitud, el frontend enviará los archivos reales mediante `multipart/form-data`:

- `POST /solicitudes/acompanamiento/{id}/evidencias`: recibe una o más partes con nombre `archivos`.
- `GET /solicitudes/acompanamiento/{id}/evidencias`: lista identificador, nombre original, tipo MIME, tamaño y fecha de carga.
- `DELETE /solicitudes/acompanamiento/{id}/evidencias/{evidenciaId}`: elimina una evidencia de la solicitud.

La respuesta del `POST` debe incluir los metadatos de los archivos almacenados. Deben validarse tamaño, extensión y tipo MIME en el backend. Una falla al adjuntar archivos no debe eliminar una solicitud que ya fue creada; debe retornar un error claro para permitir reintentar únicamente la carga.

## Permisos requeridos

La bandeja está disponible para `ADMIN`, `COORDINADOR`, `PROFESIONAL` y `REVISOR`. Por eso los siguientes `GET` deben permitir esos cuatro roles:

- listado y detalle de solicitudes;
- tipos de asignación y tipos de servicio;
- grupos profesionales;
- catálogos de vínculos de la presunta persona agresora.

Las operaciones de gestión (`POST .../asignar`, `PUT` de solicitud, eliminación y cierre) deben autorizar como mínimo a `ADMIN` y `COORDINADOR`. Si el negocio decide que `PROFESIONAL` o `REVISOR` también pueden ejecutarlas, debe declararse explícitamente en la matriz de permisos y reflejarse igual en el frontend. No debe ocurrir que un rol pueda abrir la bandeja pero reciba `403` al cargar sus filtros básicos.

## Cambios de persistencia necesarios

El backend debe definir dónde se almacenan los datos de hechos y de la presunta persona agresora antes de que exista una cita o un caso. Actualmente `PresuntoAgresor` depende de `Caso`, mientras la solicitud de acompañamiento se crea antes del caso.

La solución debe garantizar que:

- los datos queden asociados a la solicitud desde su creación;
- puedan editarse mediante el `PUT` de solicitud;
- posteriormente puedan vincularse o copiarse al caso sin perder trazabilidad;
- los listados lean de base de datos, no de información temporal del frontend;
- `observaciones` y `fechaReparto` tengan columnas persistentes en la asignación o en una entidad de historial de reparto.

## Códigos HTTP

- `200`: consulta, edición o reparto exitosos.
- `201`: solicitud creada.
- `400`: validación de campos; devolver errores por campo.
- `401`: token ausente o vencido.
- `403`: rol sin permiso para la operación.
- `404`: solicitud o elemento de catálogo inexistente.
- `409`: conflicto de integridad o reparto concurrente.

Formato recomendado para errores de validación:

```json
{
  "codigo": "VALIDATION_ERROR",
  "mensaje": "Hay campos inválidos.",
  "errores": {
    "descripcionHechos": "La descripción de los hechos es obligatoria.",
    "datosSolicitante.correos": "Debe registrar al menos un correo electrónico."
  }
}
```

## Pruebas mínimas del backend

- Crear y consultar conserva descripción, vínculo universitario y presunta persona agresora.
- Crear acepta `fechaNacimiento = null` y `lugarOcurrencia = null`.
- Crear rechaza descripción vacía, correos vacíos o teléfonos vacíos.
- Editar actualiza y devuelve todos esos campos.
- Repartir persiste los cinco campos y cambia el estado.
- Repartir por segunda vez devuelve la asignación más reciente.
- Los listados paginados devuelven la asignación vigente.
- Un error de reparto no deja datos parciales persistidos.
