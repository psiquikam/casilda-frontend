# Contrato de Integración: Registro de Usuario (Casilda Frontend -> Spring Boot)

Este documento define la estructura de datos en formato JSON que el Frontend enviará al Backend para registrar un nuevo usuario en el sistema.

## Endpoint Propuesto
- **URL**: `/api/v1/usuarios/registro` (o `/api/v1/auth/register`)
- **Método HTTP**: `POST`
- **Content-Type**: `application/json`

## Payload (Request Body)

```json
{
  "nombre": "string",
  "apellidos": "string",
  "tipoDocumento": "string", // Opciones: "CC", "TI", "CE", "PA", "OT"
  "documento": "string", // Alfanumérico
  "relacionUniversidad": "string", // Opciones: "Estudiante", "Docente", "Administrativo", "Egresado", "Contratista", "Otro"
  "email": "string", // Formato correo electrónico válido
  "telefono": "string", // (Opcional) Numérico
  "password": "string", // Mínimo 8 caracteres
  "confirmPassword": "string", // Usado internamente en frontend, pero puede ser omitido al enviar al backend
  "habeasData": true // Siempre será true al enviarse
}
```

### Tipos de Datos (Java / Spring Boot Reference)
Para facilitar la creación del DTO (`UsuarioRegistroDTO.java`) en Spring Boot, los tipos de datos mapean de la siguiente manera:

```java
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UsuarioRegistroDTO {

    @NotBlank
    @Size(min = 2)
    private String nombre;

    @NotBlank
    @Size(min = 2)
    private String apellidos;

    @NotBlank
    private String tipoDocumento;

    @NotBlank
    private String documento;

    @NotBlank
    private String relacionUniversidad;

    @NotBlank
    @Email
    private String email;

    private String telefono; // Puede ser null

    @NotBlank
    @Size(min = 8)
    private String password;

    @NotNull
    private Boolean habeasData;
    
    // Getters y Setters
}
```

## Respuestas Esperadas (Response)

### 201 Created
- **Descripción**: Usuario creado exitosamente.
- **Body sugerido**:
```json
{
  "mensaje": "Usuario creado exitosamente.",
  "usuarioId": "uuid-o-id"
}
```

### 400 Bad Request
- **Descripción**: Datos inválidos, documento ya existe, o el correo ya se encuentra registrado.
- **Body sugerido**:
```json
{
  "error": "El correo ingresado ya se encuentra registrado."
}
```
