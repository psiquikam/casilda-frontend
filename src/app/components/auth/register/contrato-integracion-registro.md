# Contrato de Integración: Registro de Usuario (Casilda Frontend -> Spring Boot)

Este documento define la estructura de datos en formato JSON que el Frontend enviará al Backend para registrar un nuevo usuario en el sistema.

## Endpoint Propuesto
- **URL**: `/api/v1/usuarios/registro` (o `/api/v1/auth/register`)
- **Método HTTP**: `POST`
- **Content-Type**: `application/json`

---

## Payload (Request Body)

```json
{
  "primerNombre": "string", // Requerido (mínimo 2 caracteres)
  "segundoNombre": "string", // Opcional (puede ser null o vacío)
  "primerApellido": "string", // Requerido (mínimo 2 caracteres)
  "segundoApellido": "string", // Opcional (si se diligencia, entre 2 y 50 caracteres)
  "tipoDocumento": "string", // Requerido. Opciones: "CC", "TI", "CE", "PA", "OT"
  "documento": "string", // Requerido. Alfanumérico
  "relacionUniversidad": "string", // Requerido. Opciones: "Estudiante", "Docente", "Administrativo", "Egresado", "Contratista", "Otro"
  "email": "string", // Requerido. Formato correo electrónico válido
  "telefono": "string", // Requerido. Solo dígitos (7 a 15 caracteres) para futura verificación
  "password": "string", // Requerido (mínimo 8 caracteres)
  "habeasData": true // Requerido. Siempre debe ser true
}
```

> **Nota sobre `confirmPassword`:** Es un campo de validación de interfaz (UI). El Frontend valida que coincida con `password` antes del envío y no requiere ser persistido en el Backend.

---

### Mapeo de Campos y Reglas de Validación

| Campo | Tipo | Obligatorio | Reglas / Restricciones | Descripción |
|---|---|:---:|---|---|
| `primerNombre` | String | Sí | Min 2 caracteres, solo texto | Primer nombre del usuario |
| `segundoNombre` | String | No | Opcional | Segundo nombre |
| `primerApellido` | String | Sí | Min 2 caracteres, solo texto | Primer apellido |
| `segundoApellido` | String | No | Opcional; si se diligencia, entre 2 y 50 caracteres | Segundo apellido |
| `tipoDocumento` | String | Sí | `CC`, `TI`, `CE`, `PA`, `OT` | Tipo de identificación |
| `documento` | String | Sí | Alfanumérico | Número de documento |
| `relacionUniversidad` | String | Sí | `Estudiante`, `Docente`, `Administrativo`, `Egresado`, `Contratista`, `Otro` | Vínculo institucional con la UdeA |
| `email` | String | Sí | Formato RFC 5322 (email) | Correo electrónico institucional o personal seguro |
| `telefono` | String | Sí | Numérico, 7 a 15 dígitos | Número de celular para verificación de cuenta |
| `password` | String | Sí | Min 8 caracteres | Contraseña (se debe almacenar hasheada con BCrypt/Argon2) |
| `habeasData` | Boolean | Sí | Debe ser `true` | Autorización expresa de política y tratamiento de datos |

---

### Referencia DTO (Java / Spring Boot)

Para facilitar la implementación en Spring Boot (`UsuarioRegistroDTO.java`):

```java
package co.edu.udea.casilda.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UsuarioRegistroDTO {

    @NotBlank(message = "El primer nombre es obligatorio")
    @Size(min = 2, max = 50, message = "El primer nombre debe tener entre 2 y 50 caracteres")
    private String primerNombre;

    @Size(max = 50, message = "El segundo nombre no puede exceder 50 caracteres")
    private String segundoNombre; // Opcional

    @NotBlank(message = "El primer apellido es obligatorio")
    @Size(min = 2, max = 50, message = "El primer apellido debe tener entre 2 y 50 caracteres")
    private String primerApellido;

    @Pattern(regexp = "^$|^.{2,50}$", message = "El segundo apellido, si se ingresa, debe tener entre 2 y 50 caracteres")
    private String segundoApellido;

    @NotBlank(message = "El tipo de documento es obligatorio")
    private String tipoDocumento;

    @NotBlank(message = "El número de documento es obligatorio")
    @Pattern(regexp = "^[0-9A-Za-z]+$", message = "El documento debe ser alfanumérico")
    private String documento;

    @NotBlank(message = "La relación con la universidad es obligatoria")
    private String relacionUniversidad;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato de correo electrónico no es válido")
    private String email;

    @NotBlank(message = "El número de celular es obligatorio para verificación")
    @Pattern(regexp = "^[0-9]{7,15}$", message = "El teléfono debe contener entre 7 y 15 dígitos")
    private String telefono;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener mínimo 8 caracteres")
    private String password;

    @NotNull(message = "Debe aceptar el tratamiento de datos personales")
    @AssertTrue(message = "Debe aceptar la política de tratamiento de datos (Habeas Data)")
    private Boolean habeasData;

    // Getters, Setters y Constructor
}
```

---

## Respuestas Esperadas (Response)

### 201 Created
- **Descripción**: Usuario registrado exitosamente.
- **Body sugerido**:
```json
{
  "mensaje": "Usuario creado exitosamente.",
  "usuarioId": "uuid-o-id",
  "email": "usuario@udea.edu.co"
}
```

### 400 Bad Request (Validación o Duplicado)
- **Descripción**: Datos faltantes, formato inválido, o documento/correo ya registrado.
- **Body sugerido**:
```json
{
  "timestamp": "2026-10-13T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "mensaje": "El correo ingresado ya se encuentra registrado en el sistema.",
  "errores": [
    {
      "campo": "email",
      "mensaje": "El correo ingresado ya se encuentra registrado"
    }
  ]
}
```

### 409 Conflict
- **Descripción**: Conflicto por duplicidad de documento de identidad.
- **Body sugerido**:
```json
{
  "status": 409,
  "error": "Conflict",
  "mensaje": "Ya existe un usuario con el documento de identidad ingresado."
}
```
