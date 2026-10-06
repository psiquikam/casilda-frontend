# Contrato de API — Contenido dinámico del Home (gestor de contenidos)

> **Para:** equipo de Backend de CASILDA
> **De:** equipo de Frontend (`casilda-frontend`, Angular 21)
> **Fecha:** 21 de septiembre de 2026
> **Estado actual en frontend:** implementado contra un **mock en memoria**; el consumo HTTP
> real está pendiente de que este endpoint exista.

---

## 1. Contexto y qué se necesita

La landing pública del sistema (`/home`) no tiene textos ni imágenes quemados en el código.
Todas las tarjetas que se ven bajo los títulos **«¿Qué necesitas hacer hoy?»** e
**«Información de interés general»** se pintan a partir de una lista de *contenidos
destacados* que debe administrar el perfil **gestor de contenidos** desde su panel, sin
requerir un despliegue del frontend.

Hoy esa lista la entrega un mock local. Se necesita que el backend exponga el endpoint real
**con exactamente la misma forma de respuesta**, para poder eliminar el mock sin tocar los
componentes.

### Archivos de referencia en el frontend

| Archivo | Rol |
|---|---|
| `src/app/services/contenido-home.service.ts` | Servicio + DTO + mock (**único punto a eliminar**). |
| `src/app/components/casilda-home/casilda-home.component.ts/.html` | Consume el servicio y separa por sección. |
| `src/app/components/casilda-card/casilda-card.component.ts/.html` | Pinta cada tarjeta. |
| `src/app/services/contenido-home.service.spec.ts` | Pruebas del contrato (vigencia y endpoint). |

---

## 2. Endpoint requerido (consumo público)

```
GET {apiBaseUrl}/contenidos/home
```

Lo que este contrato fija es **la ruta relativa**: `/contenidos/home`, colgada del mismo
prefijo de la API (`/api-casilda`) que ya usan el resto de endpoints del sistema.

- `{apiBaseUrl}` es el host base de la API. Se configura **por ambiente** en el frontend, en
  `src/environments/environment.ts` (desarrollo) y `src/environments/environment.prod.ts`
  (producción). **Esos archivos son la única fuente de verdad de la URL; este documento no
  fija ninguna**, precisamente para no quedar desactualizado.
- ⚠️ **El host que apuntan hoy ambos ambientes es provisional** —y, de hecho, es el mismo en
  los dos— y será reemplazado por el nuevo servidor donde se expondrá el backend. Cuando ese
  host se confirme se actualiza únicamente `environment*.ts`: **este contrato no cambia**,
  porque solo depende de la ruta relativa.

**Pendiente de confirmar con el equipo de Backend** (no bloquea implementar el endpoint, pero
sí bloquea consumirlo desde el frontend):

1. Host y puerto definitivos del nuevo servidor, y si habrá hosts distintos para desarrollo,
   pruebas y producción.
2. Si se conserva el prefijo `/api-casilda`. Si cambia, cambia para toda la API, no solo para
   este endpoint.
3. **Que se exponga por HTTPS.** Es requisito, no preferencia: el Home es la cara pública de
   un sistema sobre VBG, y una página servida por HTTPS no puede consumir una API HTTP (el
   navegador bloquea el contenido mixto). También condiciona las URLs de imagen (§5.1).

### 2.1 Características obligatorias

| Aspecto | Requerimiento |
|---|---|
| **Método** | `GET` (idempotente, sin cuerpo de petición). |
| **Autenticación** | **Público / anónimo.** El Home se renderiza antes del login. El endpoint **no debe exigir** `Authorization` ni devolver `401`. |
| **Token opcional** | Si la persona usuaria ya inició sesión, el interceptor `authInterceptor` adjunta `Authorization: Bearer <jwt>` automáticamente a **todas** las peticiones. El backend debe **aceptar e ignorar** ese header sin fallar. |
| **CORS** | Debe permitir `GET` desde el origen del frontend: `http://localhost:4200` (servidor de desarrollo de Angular, `npm start`) y el dominio donde se despliegue el frontend. Debe incluir `Authorization` en `Access-Control-Allow-Headers`. |
| **Content-Type** | `application/json; charset=utf-8` (los textos llevan tildes y `ñ`). |

### 2.2 Petición

No se envían parámetros de query, headers personalizados ni cuerpo.

```http
GET /api-casilda/contenidos/home HTTP/1.1
Host: <host-de-la-api>
Accept: application/json
Authorization: Bearer <jwt>        # solo si hay sesión activa; opcional e ignorable
```

> **Nota sobre vigencia:** el frontend **no** envía la fecha de consulta. El filtrado por
> vigencia lo debe hacer el backend con su propio reloj (ver §4). El parámetro `referencia`
> que existe en el método del servicio es solo un apoyo para pruebas unitarias.

---

## 3. Respuesta esperada

### 3.1 Forma: arreglo plano, **sin envoltorio**

La respuesta debe ser un **arreglo JSON de objetos** en la raíz del cuerpo.

> ⚠️ **Importante:** este endpoint **no** usa el envoltorio paginado
> `{ content, totalElements, totalPages, size, number }` que sí emplean otros endpoints del
> sistema (`/solicitudes/acompanamiento/paginado`, etc.). El Home consume la lista completa
> de contenidos vigentes, que por diseño es corta (entre 4 y 12 elementos).

`HTTP 200 OK`

```json
[
  {
    "id": 1,
    "imagen": "assets/uad_equipo_3_y_4.svg",
    "titulo": "Registrar queja disciplinaria (UAD 3 y 4)",
    "contenido": "Registra formalmente una queja ante la Unidad de Asuntos Disciplinarios. Tu relato se maneja bajo reserva.",
    "vigenciaInicio": "2026-01-01T00:00:00Z",
    "vigenciaFin": null,
    "enlace": "/formulario-anonimo",
    "seccion": "acciones"
  },
  {
    "id": 2,
    "imagen": "assets/equipo_atencion.svg",
    "titulo": "Solicitud al equipo de atención VBG",
    "contenido": "Contacta al equipo especializado para recibir orientación y acompañamiento psicosocial y jurídico.",
    "vigenciaInicio": "2026-01-01T00:00:00Z",
    "vigenciaFin": null,
    "enlace": "/formulario-anonimo",
    "seccion": "acciones"
  },
  {
    "id": 3,
    "imagen": "assets/linea_alma.svg",
    "titulo": "Atención por Línea Alma",
    "contenido": "Línea de escucha y apoyo psicológico inmediato de la Universidad de Antioquia.",
    "vigenciaInicio": "2026-01-01T00:00:00Z",
    "vigenciaFin": null,
    "enlace": null,
    "seccion": "acciones"
  },
  {
    "id": 4,
    "imagen": "assets/seguridad_bienes_y_servicios.svg",
    "titulo": "Atención por seguridad a personas y bienes",
    "contenido": "Reporta incidentes que requieran respuesta de seguridad inmediata dentro del campus.",
    "vigenciaInicio": "2026-01-01T00:00:00Z",
    "vigenciaFin": null,
    "enlace": null,
    "seccion": "acciones"
  },
  {
    "id": 5,
    "imagen": "assets/reportes_informes_indicadores.svg",
    "titulo": "Indicadores internos",
    "contenido": "Consulta los datos y métricas que el sistema CASILDA consolida sobre la atención institucional.",
    "vigenciaInicio": "2026-01-01T00:00:00Z",
    "vigenciaFin": null,
    "enlace": null,
    "seccion": "informacion"
  },
  {
    "id": 6,
    "imagen": "assets/estadisticas-vbg.svg",
    "titulo": "Estadísticas en VBG",
    "contenido": "Informes sobre la situación de las violencias basadas en género en la Universidad.",
    "vigenciaInicio": "2026-01-01T00:00:00Z",
    "vigenciaFin": null,
    "enlace": null,
    "seccion": "informacion"
  },
  {
    "id": 7,
    "imagen": "assets/distintivo_casilda_morado.svg",
    "titulo": "¿Quién es CASILDA?",
    "contenido": "Es el sistema de vigilancia en salud pública de la UdeA para el abordaje de las discriminaciones y violencias basadas en género. Centraliza la información para prevenir, atender y proteger.",
    "vigenciaInicio": "2026-01-01T00:00:00Z",
    "vigenciaFin": null,
    "enlace": null,
    "seccion": "informacion"
  }
]
```

> Este JSON es **la traducción literal del mock que hoy usa el frontend**. Sirve como dato
> semilla: si el backend arranca devolviendo exactamente estos 7 registros, el Home se ve
> igual que hoy.

### 3.2 Diccionario de campos

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `id` | `number` (entero > 0) | Sí | Identificador único y **estable** del contenido. El frontend lo usa como `track` de la iteración (`@for ... track item.id`); si cambia entre respuestas, Angular vuelve a crear el nodo del DOM. No se debe reutilizar un `id` liberado por un borrado. |
| `imagen` | `string` | Sí | URL de la imagen de la tarjeta. Se enlaza directo a `<img [src]>`. Admite ruta relativa al frontend (`assets/archivo.svg`) o **URL absoluta HTTPS** servida por el backend/CDN. Ver §5.1. |
| `titulo` | `string` | Sí | Título visible. Se renderiza en un `<h3>`. Recomendado ≤ 80 caracteres. **Texto plano, sin HTML.** |
| `contenido` | `string` | Sí | Párrafo descriptivo. Recomendado ≤ 300 caracteres. **Texto plano, sin HTML.** |
| `vigenciaInicio` | `string` ISO 8601 con zona | Sí | Instante desde el cual el contenido se publica. Formato `YYYY-MM-DDTHH:mm:ssZ` (UTC) o con offset explícito (`-05:00`). **No enviar fechas sin zona horaria.** |
| `vigenciaFin` | `string` ISO 8601 con zona, o `null` | Sí (la clave debe venir) | Instante en que el contenido deja de publicarse. `null` = sin expiración. Debe ser posterior a `vigenciaInicio`. |
| `enlace` | `string`, `null`, o ausente | No | Ruta **interna** de la aplicación a la que navega la tarjeta. Ver §5.2. Si es `null`, vacío o no viene, la tarjeta se pinta como informativa (no navegable, sin foco). |
| `seccion` | `string` enumerado | Sí | Bloque del Home donde se ubica. **Solo dos valores válidos:** `"acciones"` o `"informacion"` (minúsculas, sin tilde en `informacion`). Ver §5.3. |

### 3.3 Interfaz TypeScript que el frontend ya tiene implementada

El backend debe producir JSON que satisfaga esta interfaz **sin cambios**:

```ts
export interface ContenidoDestacadoDto {
  id: number;
  imagen: string;
  titulo: string;
  contenido: string;
  vigenciaInicio: string;          // ISO 8601
  vigenciaFin: string | null;      // ISO 8601 | null
  enlace?: string | null;
  seccion: 'acciones' | 'informacion';
}
```

### 3.4 Orden de los elementos

El frontend **respeta el orden del arreglo tal como llega** y no reordena. El backend debe
devolver los elementos ya ordenados como deben verse en pantalla.

- Orden sugerido: por un campo `orden` (entero) que administre el gestor de contenidos,
  ascendente, y `id` ascendente como desempate.
- Ese campo `orden` **no necesita viajar en la respuesta pública**. Si el backend decide
  incluirlo, el frontend simplemente lo ignora (ver §6.1).

### 3.5 Lista vacía

Si no hay contenidos vigentes, la respuesta correcta es `HTTP 200` con `[]`.
**No devolver `204 No Content`, ni `404`, ni `null`.** El frontend interpreta `[]` como
«sin tarjetas» y oculta ambas secciones sin mostrar error.

---

## 4. Regla de vigencia (quién filtra)

Un contenido está **vigente** en el instante `T` cuando:

```
vigenciaInicio <= T  Y  (vigenciaFin == null  O  vigenciaFin >= T)
```

**El filtrado es responsabilidad del backend.** `GET /contenidos/home` debe devolver
**únicamente los contenidos vigentes al momento de la petición**, evaluados con el reloj del
servidor en zona `America/Bogota` (UTC-5).

El frontend conserva la función `estaVigente()` como red de seguridad y la aplica de nuevo
sobre lo recibido, pero **no debe usarse como el filtro principal**: publicar todo el catálogo
y filtrar en el navegador expondría contenidos despublicados a cualquiera que inspeccione la
red.

Por la misma razón, el endpoint público **no debe exponer** contenidos en estado borrador,
archivados o eliminados lógicamente.

---

## 5. Reglas de validación en el panel del gestor de contenidos

Estas validaciones deben aplicarse **al guardar** desde el panel de gestión, para que el
endpoint público nunca entregue datos que rompan la vista.

### 5.1 `imagen`

- Se renderiza como `<img [src]="item.imagen" alt="" aria-hidden="true">`: la imagen es
  **decorativa** y el significado lo cargan `titulo` y `contenido`. Por eso **no se requiere**
  un campo de texto alternativo.
- Formatos recomendados: **SVG** (las 7 imágenes actuales lo son) o PNG/WEBP.
- Proporción de referencia de las tarjetas actuales: imagen cuadrada o apaisada suave; peso
  sugerido ≤ 150 KB.
- Si se permite **carga de archivos** por parte del gestor de contenidos:
  - servir los archivos por **HTTPS** desde un dominio propio (un `src` mixto HTTP en una
    página HTTPS es bloqueado por el navegador);
  - **sanear los SVG subidos** antes de almacenarlos (eliminar `<script>`, `on*`,
    `xlink:href` externos): un SVG es un documento activo;
  - validar `content-type` y extensión, y limitar el tamaño.
- Mientras el módulo de carga de archivos no exista, es válido que `imagen` siga apuntando a
  las rutas relativas `assets/*.svg` que ya están versionadas en el frontend.

### 5.2 `enlace`

Se pasa a `routerLink` de Angular, por lo que **solo admite rutas internas de la SPA**, con
`/` inicial. Una URL externa (`https://...`) **no funcionará**.

Rutas públicas válidas hoy (whitelist sugerida para el selector del panel):

| Ruta | Destino |
|---|---|
| `/home` | Inicio |
| `/formulario-anonimo` | Reporte anónimo (usada por 2 tarjetas actuales) |
| `/reporte-anonimo` | Alias que redirige a `/formulario-anonimo` |
| `/login` | Iniciar sesión |
| `null` | Tarjeta informativa, sin navegación |

> No ofrecer rutas protegidas (`/inicio`, `/solicitud-acompanamiento`, `/gestion-usuarios`,
> `/registro-caso`, …) como destino de tarjetas del Home público: la persona anónima sería
> rebotada por los guards. Si a futuro se requieren enlaces externos, se debe acordar primero
> un cambio de contrato (p. ej. un campo `tipoEnlace: 'interno' | 'externo'`), porque hoy el
> componente asume navegación interna.

### 5.3 `seccion`

- `"acciones"` → bloque **«¿Qué necesitas hacer hoy?»**. Son las rutas de atención; se espera
  que la mayoría tenga `enlace`.
- `"informacion"` → bloque **«Información de interés general»**. Contenido divulgativo; hoy
  todas son tarjetas informativas sin enlace.
- Un valor distinto a esos dos hace que la tarjeta **no se pinte en ninguna sección**
  (se pierde silenciosamente). Debe validarse como enumerado cerrado en backend y ofrecerse
  como lista desplegable en el panel, nunca como texto libre.

### 5.4 Textos

- `titulo` y `contenido` se interpolan como **texto plano** (`{{ }}`), no como HTML: cualquier
  etiqueta enviada se mostrará escapada, literal. No enviar marcado.
- Deben venir en **español**, con tildes y `ñ` correctamente codificados en UTF-8.
- Ambos son obligatorios y no pueden ser cadena vacía ni solo espacios: una tarjeta sin
  título se ve rota.

---

## 6. Compatibilidad y evolución del contrato

### 6.1 Cambios que **no** rompen el frontend (aditivos, se pueden hacer sin coordinar)

- Agregar campos nuevos al objeto (`orden`, `estado`, `fechaCreacion`, `creadoPor`, …):
  el frontend los ignora.
- Cambiar el número de elementos devueltos.
- Cambiar el contenido de los textos, imágenes y enlaces.
- Cambiar el host de la API (solo implica actualizar `environment*.ts`).

### 6.2 Cambios que **sí** rompen el frontend (requieren acordarse antes)

- Envolver el arreglo en un objeto (`{ "data": [...] }`, `{ "content": [...] }`).
- Renombrar cualquiera de los campos del §3.2 (p. ej. `descripcion` en vez de `contenido`,
  `urlImagen` en vez de `imagen`, `seccion` con valores en mayúsculas o con tilde).
- Devolver `id` como `string`.
- Cambiar el formato de fechas (epoch en milisegundos, `dd/MM/yyyy`, fechas sin zona horaria).
- Exigir autenticación en el endpoint público.
- Cambiar la **ruta relativa** `/contenidos/home` o el prefijo `/api-casilda`.

---

## 7. Manejo de errores

El frontend ya implementa los tres estados de la vista: **cargando**, **error** y **datos**.

- Ante cualquier respuesta distinta de `2xx`, o ante fallo de red/CORS, el Home muestra un
  aviso accesible («No pudimos cargar las opciones de atención en este momento. Tu información
  sigue protegida.») con un botón **Reintentar** que repite la petición. El resto de la
  página —hero, CTAs de reporte y orientación telefónica, Salida rápida— sigue operativo.
- Por eso **es preferible un error HTTP claro a un `200` con datos incompletos**.

Cuerpo de error sugerido (consistente con el resto de la API):

```json
{
  "timestamp": "2026-09-21T14:32:10Z",
  "status": 500,
  "error": "Internal Server Error",
  "message": "No fue posible consultar los contenidos del home",
  "path": "/api-casilda/contenidos/home"
}
```

| Código | Cuándo |
|---|---|
| `200` | Éxito, incluso si la lista va vacía (`[]`). |
| `500` | Falla del servidor o de base de datos. |
| `503` | Servicio temporalmente no disponible. |

**No usar:** `401`/`403` (el endpoint es público), `404` (si no hay contenidos, es `200 []`),
`204` (el frontend espera cuerpo JSON).

### 7.1 Caché (opcional, recomendado)

El contenido cambia con poca frecuencia y lo consulta cada visitante anónimo:

```
Cache-Control: public, max-age=300
```

Cinco minutos es un buen punto de partida. Si se implementa `ETag` + `If-None-Match`, el
frontend lo aprovecha de forma transparente vía navegador. Lo que **no** debe hacerse es una
caché tan larga que un contenido despublicado siga visible: la caché debe ser menor que la
granularidad con que se espera que actúe la vigencia.

---

## 8. Endpoints de administración (panel del gestor de contenidos)

El endpoint del §2 es solo la cara pública de lectura. Para que el rol **gestor de
contenidos** pueda administrar, se requiere adicionalmente un CRUD protegido. Propuesta a
validar con el equipo, aún **no consumida por el frontend**:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `{apiBaseUrl}/contenidos` | Lista **todos** los contenidos (vigentes, futuros y expirados), para la tabla de administración. Admite paginación con el envoltorio `PagedResponseDto` estándar del sistema. |
| `GET` | `{apiBaseUrl}/contenidos/{id}` | Detalle de un contenido. |
| `POST` | `{apiBaseUrl}/contenidos` | Crea un contenido. Devuelve `201` + el recurso creado con su `id`. |
| `PUT` | `{apiBaseUrl}/contenidos/{id}` | Actualiza un contenido. Devuelve `200` + el recurso actualizado. |
| `DELETE` | `{apiBaseUrl}/contenidos/{id}` | Borrado **lógico** (nunca físico, por trazabilidad). |
| `POST` | `{apiBaseUrl}/contenidos/orden` | Opcional: persiste el reordenamiento (`[{ "id": 1, "orden": 0 }, …]`). |

Requisitos de estos endpoints:

- **Protegidos por JWT** y restringidos al rol del gestor de contenidos (y `ADMIN`).
  El `authInterceptor` ya adjunta el token y maneja `401` (cierra sesión y pide reingresar)
  y `403` (redirige a `/acceso-denegado`).
- El **código de rol** debe acordarse; el frontend ya normaliza tanto `ROL` como `ROLE_ROL`
  (ver `AuthService.hasRole`). Roles existentes hoy: `ADMIN`, `COORDINADOR`, `PROFESIONAL`,
  `REVISOR`, `USUARIO`. Se sugiere `GESTOR_CONTENIDO`.
- Cuerpo de creación/actualización: los mismos campos del §3.2 **sin `id`**, más los campos
  internos que se definan (`orden`, `estado`).
- Validaciones del §5 aplicadas en servidor, con `400` y detalle por campo:

```json
{
  "timestamp": "2026-09-21T14:32:10Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Datos inválidos",
  "path": "/api-casilda/contenidos",
  "errores": [
    { "campo": "seccion", "mensaje": "Debe ser 'acciones' o 'informacion'" },
    { "campo": "vigenciaFin", "mensaje": "Debe ser posterior a vigenciaInicio" }
  ]
}
```

- **Auditoría:** registrar quién creó/modificó/despublicó cada contenido y cuándo. El Home es
  la cara pública de un sistema de VBG; un cambio de texto no trazable es un riesgo
  institucional.

---

## 9. Criterios de aceptación (lista de verificación)

Se considera cumplido el contrato cuando:

- [ ] `GET {apiBaseUrl}/contenidos/home` responde `200` **sin token** y también **con token**.
- [ ] El cuerpo es un **arreglo JSON en la raíz**, no un objeto envoltorio.
- [ ] Cada elemento trae las 7 claves obligatorias con los tipos del §3.2.
- [ ] `seccion` solo toma los valores `"acciones"` o `"informacion"`.
- [ ] Las fechas están en ISO 8601 **con zona horaria**.
- [ ] Solo se devuelven contenidos **vigentes al momento de la petición** (§4).
- [ ] Los elementos llegan **en el orden de presentación** definitivo.
- [ ] Sin contenidos vigentes ⇒ `200` con `[]` (no `204`, no `404`, no `null`).
- [ ] Los acentos y la `ñ` se ven correctamente (UTF-8 declarado en `Content-Type`).
- [ ] CORS permite `GET` desde el origen del frontend con el header `Authorization`.
- [ ] Con los 7 registros semilla del §3.1 cargados, el Home se ve idéntico al actual.

---

## 10. Qué hará el frontend cuando el endpoint exista

Un único cambio, ya previsto y anotado con `TODO(backend)` en el código:

```ts
// src/app/services/contenido-home.service.ts
@Injectable({ providedIn: 'root' })
export class ContenidoHomeService {
  private readonly http = inject(HttpClient);
  readonly endpoint = `${environment.apiBaseUrl}/contenidos/home`;

  listarContenidoVigente(referencia: Date = new Date()): Observable<ContenidoDestacadoDto[]> {
    return this.http
      .get<ContenidoDestacadoDto[]>(this.endpoint)
      // Red de seguridad: el filtro autoritativo es del backend.
      .pipe(map((contenidos) => contenidos.filter((c) => estaVigente(c, referencia))));
  }
}
```

Se elimina la constante `CONTENIDO_MOCK`. **La firma del método, el DTO
`ContenidoDestacadoDto` y los componentes no cambian.** Por eso el backend debe ajustarse a
la forma descrita aquí y no al revés: cualquier desviación obliga a tocar el servicio, sus
pruebas y potencialmente las plantillas.

---

## 11. Contacto

Dudas sobre este contrato o propuestas de cambio: equipo de Frontend de CASILDA, antes de
implementar. Un cambio acordado aquí cuesta minutos; descubierto en integración, cuesta un
ciclo de despliegue en ambos lados.

