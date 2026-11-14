# Contrato de API — Consultar un reporte por código (`/seguimiento`)

> **Para:** equipo de Backend de CASILDA
> **De:** equipo de Frontend (`casilda-frontend`, Angular 21)
> **Fecha:** 11 de noviembre de 2026
> **Versión:** 1 (propuesta; nada de lo descrito existe hoy en el servidor)
> **Estado actual:** la vista «Seguimiento de trámite» (`/seguimiento`,
> `SeguimientoTramiteComponent`) está tras el flag `publicTrackingPrototype` y **simula** el
> resultado por prefijo del código (`CAS-`, `ACO-`). El diálogo de éxito del reporte
> autenticado promete «consultar el avance del caso desde Seguimiento de trámite», y el del
> reporte anónimo pide «iniciar sesión e ingresar este ID». Ninguna de las dos cosas tiene
> endpoint. En `casilda-backend` solo existe `POST /reportes`; `ReporteCasoRepository.findByCodigo`
> está declarado y no se usa. El `GET /seguimiento/{codigoCaso}` que lista el `README.md` del
> backend no tiene controlador.

Este documento sigue `ContratoEndpoints.md` del backend.

---

## 1. Información general

- **Nombre funcional:** Consultar estado de un reporte de caso por código.
- **Módulo:** Reportes.
- **Descripción:** Devuelve el estado de trámite de un reporte creado con `POST /reportes`
  a partir de su código público `CAS-…`, sin exponer el contenido del reporte.
- **Responsable frontend:** Jonathan Cardona.
- **Responsable backend:** por asignar.
- **Fecha de solicitud:** 2026-11-11.

## 2. Definición del endpoint

- **Método HTTP:** `GET`
- **Ruta:** `/reportes/{codigo}`
- **Content-Type de salida:** `application/json`
- **Cache:** `Cache-Control: no-store` (misma política que el `POST`).

## 3. Autenticación y permisos

- **Regla de acceso:** `AUTENTICADO`. **[Propuesta]**
- **Roles permitidos:** cualquier rol activo (`ADMIN`, `COORDINADOR`, `PROFESIONAL`,
  `REVISOR`, `USUARIO` y los que se creen). Condición OR.

Motivo: el código es el único secreto que une a la persona con su reporte anónimo. Pedir
sesión para consultarlo reduce la enumeración y cuadra con el texto del diálogo de éxito
(«inicie sesión e ingrese este ID»). Si el equipo prefiere consulta pública, aplicar límite
de tasa (`429`) y responder exactamente igual para «no existe» y «formato inválido».

## 4. Parámetros de entrada

| Nombre | Tipo | Obligatorio | Descripción | Validaciones |
|---|---|---:|---|---|
| `codigo` | String | Sí | Código público del reporte | `^CAS-[A-HJ-NP-Z2-9]{10}$` (alfabeto de `ReporteCasoService`); se normaliza a mayúsculas |

Sin parámetros de consulta ni body.

## 5. Respuesta exitosa `200 OK` — `ReporteEstadoResponse`

```json
{
  "codigo": "CAS-7Q4M2XABCD",
  "fechaRegistro": "2026-11-06T15:20:31Z",
  "fechaActualizacion": "2026-11-08T09:12:00Z",
  "rutaActivacion": { "id": 2, "codigo": "URC", "nombre": "URC (Unidad de resolución de conflictos)" },
  "estadoRuta": "SOLICITADA",
  "vinculadoAMiCuenta": false,
  "tieneEvidencias": true,
  "etapas": [
    { "codigo": "RECIBIDO", "nombre": "Recibido", "fecha": "2026-11-06T15:20:31Z", "actual": false },
    { "codigo": "EN_REVISION", "nombre": "En revisión", "fecha": "2026-11-08T09:12:00Z", "actual": true },
    { "codigo": "RUTA_ACTIVADA", "nombre": "Ruta activada", "fecha": null, "actual": false },
    { "codigo": "CERRADO", "nombre": "Cerrado", "fecha": null, "actual": false }
  ]
}
```

| Campo | Tipo | Acepta null | Descripción |
|---|---|---:|---|
| `codigo` | String | No | El mismo código consultado. |
| `fechaRegistro` | ISO-8601 con zona | No | `reportecaso.fecha_registro`. |
| `fechaActualizacion` | ISO-8601 con zona | Sí | Última actuación conocida; `null` si no hay ninguna. |
| `rutaActivacion` | objeto | No | `id`, `codigo`, `nombre` de la ruta solicitada. |
| `estadoRuta` | `SOLICITADA` \| `ACTIVA` \| … | No | `EstadoReporteRutaEnum`; nuevos valores son aditivos. |
| `vinculadoAMiCuenta` | boolean | No | `true` si `reportecaso.idusuario` es la persona autenticada. |
| `tieneEvidencias` | boolean | No | Solo el hecho; nunca nombres ni enlaces de archivos. |
| `etapas` | arreglo | No | Línea de tiempo que pinta `/seguimiento`. **[Propuesta]** Si Backend no modela etapas todavía, devolver solo las dos primeras a partir de `estadoRuta`. |

**Privacidad (OBJ-06):** la respuesta **no** incluye `descripcionHechos`, datos de la víctima,
del presunto agresor, de contacto ni de la persona que creó el reporte.

## 6. Errores esperados

| Código HTTP | Situación | Mensaje esperado |
|---|---|---|
| 400 | `codigo` con formato inválido | «El código del reporte no tiene un formato válido» |
| 401 | Token ausente, inválido o vencido | — |
| 404 | No existe un reporte con ese código | «No se encontró un reporte con ese código» |
| 429 | Límite de tasa (si se adopta consulta pública) | — |
| 500 | Error inesperado | — |

El `404` y el `400` deben tardar lo mismo y no revelar si el código «casi» existe.

## 7. Reglas de negocio

1. Cualquier persona autenticada con el código puede ver el estado; el código es la llave.
2. No se registra en logs el código consultado junto con la identidad de quien consulta.
3. Un reporte eliminado lógicamente (si llega a existir el borrado) responde `404`.
4. Fuera de alcance de este contrato, para una segunda versión: `POST /reportes/{codigo}/vincular`
   para asociar un reporte anónimo a la cuenta que inicia sesión (lo que promete el diálogo de
   éxito del canal anónimo).

## 8. Qué hará el frontend

1. `ReporteCasoService.consultarEstado(codigo)` → `GET /reportes/{codigo}`.
2. `SeguimientoTramiteComponent` deja de simular: valida el formato en el cliente, muestra las
   etapas recibidas y traduce `400/404/401` con `NotificacionService`. Los códigos `ACO-` siguen
   sin respaldo hasta que exista su contrato.
3. Se retira el flag `publicTrackingPrototype` cuando el endpoint esté en QA.

## 9. Criterios de aceptación

- [ ] `GET /reportes/{codigo}` con token válido responde `200` y la forma del §5.
- [ ] Sin token responde `401`; con código inexistente `404`; con formato inválido `400`.
- [ ] La respuesta nunca incluye relato, datos personales ni archivos.
- [ ] `Cache-Control: no-store` presente.
- [ ] OpenAPI actualizado y fila en la tabla `endpoint` (`/reportes/*`, `GET`, no público).
