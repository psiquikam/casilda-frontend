# Integración del registro de usuario

El formulario consume el contrato publicado por el backend en Swagger. La URL base se toma de `environment.apiBaseUrl`.

## Endpoints

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/auth/vinculos-udea` | Cargar las opciones de vínculo institucional (`id`, `codigo`, `nombre`). |
| `POST` | `/auth/register` | Crear la cuenta con el vínculo seleccionado por su identificador. |

## Solicitud de registro

```json
{
  "primerNombre": "Ana",
  "segundoNombre": "María",
  "primerApellido": "Pérez",
  "segundoApellido": "Gómez",
  "tipoDocumento": "CC",
  "documento": "123ABC",
  "vinculoUdeaId": 8,
  "email": "ana@udea.edu.co",
  "telefono": "3001234567",
  "password": "no-incluir-credenciales-reales",
  "habeasData": true
}
```

`segundoNombre` y `segundoApellido` se omiten si no se diligencian. `confirmPassword` solo se utiliza para validar el formulario y nunca se envía. `habeasData` se envía como `true` únicamente después de que la persona acepta la política.

## Validaciones

- `primerNombre` y `primerApellido`: requeridos, entre 2 y 50 caracteres.
- `segundoNombre`: opcional, máximo 50 caracteres.
- `segundoApellido`: opcional; si se diligencia, debe tener entre 2 y 50 caracteres.
- `tipoDocumento`: requerido; opciones del formulario: `CC`, `TI`, `CE`, `PA`, `OT`.
- `documento`: requerido, alfanumérico, máximo 50 caracteres.
- `vinculoUdeaId`: se envía como el `id` numérico de una opción obtenida del catálogo; el formulario requiere seleccionar una.
- `email`: requerido y validado como correo electrónico; se normaliza a minúsculas antes del envío.
- `telefono`: requerido, solo dígitos, entre 7 y 15 caracteres.
- `password`: entre 8 y 72 caracteres. No se registra en consola ni se incluye en mensajes de error.

## Respuesta y errores

La respuesta exitosa contiene `mensaje`, `usuarioId` y `email`. Tras el éxito, el formulario muestra la confirmación y un enlace para iniciar sesión; el registro no inicia una sesión automáticamente.

El formulario muestra el mensaje de backend cuando está disponible (`mensaje` o `message`), incluidos los detalles de validación en `errores`. Si no hay detalle, presenta mensajes para validación (`400`), duplicidad (`409`) o vínculo/tipo de documento inexistente (`404`).

Las pruebas automatizadas usan respuestas simuladas y no crean cuentas. El `POST` contra QA crea una cuenta persistente; no debe probarse con datos ficticios sin autorización.
