# Módulo UAD Equipos 3 y 4: contratos y guía técnica

**Estado (2026-11-19):**

- **Frontend:** las Entregas 1 (bandejas NDI/NDA y evaluación) y 2 (bandeja de casos, Gestionar caso, historial, pruebas y traslado) y la queja anónima de la Entrega 3 funcionan con el adaptador mock.
- **Backend:** las Entregas 1 y 2 y la radicación pública de la NDA están en `main` (PR #21 y #23). Guías: `casilda-backend/docs/UAD_BACKEND_ENTREGA1.md` y `UAD_BACKEND_ENTREGA2.md`.
- **Paso a HTTP, aplazado:** el equipo de Backend tiene pendiente desplegar varios cambios en el servidor. Hasta que lo haga, el módulo sigue con `'mock'` en desarrollo y demo, y el adaptador HTTP queda sin probar contra el servidor real.
- **Entrega 3 en el backend (rama `feature/06/20/casilda/modulo-uad-back`, sin integrar a `main`):** «Mis reportes» (`GET /mis-reportes`, `GET /mis-reportes/{codigo}`), respuesta a la subsanación solo con texto y corrección de la privacidad de `/solicitudes` (D-UAD-16). Guía: `casilda-backend/docs/UAD_BACKEND_ENTREGA3.md`.
- **«Mis reportes» en el frontend (mock):** listado y detalle con respuesta a la solicitud de información, en `/mis-reportes`, detrás del flag `uadMisReportes` (apagado en producción).
- **Sin implementar:** remisión a la Ruta, carga de evidencias y acceso histórico.

| Documento | Para qué |
|---|---|
| [`openapi-uad.yaml`](openapi-uad.yaml) | **Fuente de verdad** de los contratos (OpenAPI 3.0.3). Cada operación lleva `x-estado` y `x-entrega`. |
| [`AUDITORIA_UAD.md`](AUDITORIA_UAD.md) | Diagnóstico de los dos repositorios al 2026-11-14 (antes del backend UAD), con evidencia, inventario de endpoints y tabla requisito → estado. Lleva una nota de actualización al inicio. |
| [`MATRIZ_CONTRATOS_UAD.md`](MATRIZ_CONTRATOS_UAD.md) | Requisito → UI → tipo/schema → endpoint → estado, y mapeo contrato → TS → puerto → adaptadores. |
| [`DECISIONES_PENDIENTES_UAD.md`](DECISIONES_PENDIENTES_UAD.md) | D-UAD-01…32: impacto, fuente, decisión provisional y quién valida. |

## 1. Arquitectura

```text
Página / componentes (src/app/uad/paginas, componentes)
  → UadFacade (servicios/uad.facade.ts)            orquesta; sin reglas de negocio
  → UadApiPort (contratos/uad-api.port.ts)         una función por operationId
      ├─ UadHttpAdapter (infraestructura/uad-http.adapter.ts)   {apiBaseUrl}/uad/...
      └─ UadMockAdapter (infraestructura/mock/)                 servidor simulado en memoria
```

Fuera de las rutas `/uad` hay dos puertos más, cada uno con su adaptador HTTP y mock y su propio proveedor:

| Puerto | Ruta | Quién lo usa | Proveedor |
|---|---|---|---|
| `UadRadicacionPort` | `/uad/queja-anonima` (pública) | Cualquier persona, sin sesión | `provideUadRadicacion()` |
| `UadMisReportesPort` | `/mis-reportes` | Quien radicó un reporte (rol USUARIO) | `provideUadMisReportes()` |

Los tres mocks comparten `UadMockStore`: la queja anónima llega a la bandeja NDA, y la solicitud de información y su respuesta viajan entre la evaluación y «Mis reportes».

- `contratos/uad-api.types.ts` es el espejo del OpenAPI. Si cambia uno, cambia el otro en el mismo commit.
- `dominio/` tiene reglas puras: competencia por equipo y validación de la decisión. Las usan la UI y el mock. **El servidor las aplica por su cuenta** (`UadCompetencia`, `UadDecisionValidator`, `UadCatalogoActuaciones`); si cambia una regla, cambia en los dos lados.
- Ambos adaptadores entregan los errores como `ErrorUad` (`infraestructura/uad-error.ts`), leído del `ErrorResponse` real del backend.
- El puerto se provee en las rutas `/uad` (`provideUadApi()` en `routes.ts`), no en la raíz.

## 2. Ejecutar la interfaz

```powershell
npm start          # http://localhost:4200
```

1. Inicie sesión con un usuario **ADMIN** (QA) o, en modo demostración, con la cuenta de prueba ADMIN.
   Los roles `UAD_*` los crea `database/uad_modulo_entrega1.sql` en el backend, pero el script no los asigna a nadie: cada usuario real se asigna aparte en `usuariorol`.
2. Abra el menú **UAD Equipos 3 y 4 → Noticias disciplinarias** (`/uad/noticias`).
3. En la franja **"Datos de demostración"**:
   - Elija el **equipo simulado** (3 o 4). Así se comprueba qué ve cada equipo.
   - **Simular fallo del servidor** fuerza un error 500 en la próxima consulta.
4. Escenarios sembrados (todos ficticios):

| Consecutivo | Escenario |
|---|---|
| `NDI-2026-000141` | Docente (Equipo 3). Tiene casos en otros actores: sirve para probar la vinculación. |
| `NDI-2026-000142` | Estudiante (Equipo 4). |
| `NDI-2026-000143` | "No sé": visible a ambos equipos. Clasifíquela para ver cómo sale de la bandeja del otro equipo. |
| `NDI-2026-000144` | Remitida por el Equipo de Atención con ID de caso: se conserva. |
| `NDI-2026-000145` | Subsanación vencida: no se cierra sola. Pruebe "Simular respuesta del reportante". |
| `NDI-2026-000146` | Revisión concurrente. |
| `NDI-2026-000147` | "No tiene vínculo". |
| `NDI-2026-000140` | Inhibitoria (solo lectura). |
| `NDI-2026-000139` | Admitida. |
| `NDA-2026-000020` a `000022` | Anónimas, visibles a ambos equipos. |

5. En la evaluación, **"Simular que otra persona modifica la noticia"** hace que la siguiente acción reciba el aviso de conflicto (409).
6. Casos sembrados (menú **Casos UAD**, `/uad/casos`):

| ID de caso | Escenario |
|---|---|
| `CAS-2026-000301` | Docente, instrucción con Equipo 3, sin expediente UAD: pruebe registrarlo, guardar actuaciones y "Finalizar etapa de instrucción". |
| `CAS-2026-000248` | Estudiante, instrucción con Equipo 4. |
| `CAS-2026-000302` | Administrativo, ya trasladado: decisión con Equipo 4. Su historial conserva lo hecho por Equipo 3. |
| `CAS-2026-000303` | Estudiante, ya trasladado: decisión con Equipo 3. |
| `CAS-2026-000304` | Gestión finalizada por remisión: no aparece en la bandeja activa. |

   Para ver el traslado completo: con Equipo 3 finalice la instrucción de `CAS-2026-000301`, que sale de su bandeja; cambie el equipo simulado a Equipo 4 y aparece en decisión.
7. «Mis reportes» (`/mis-reportes`, rol USUARIO; un ADMIN entra por la URL). En el menú aparece en «Mis solicitudes» para el rol USUARIO.
   - El mock trata como propias las NDI del formulario web con reportante; las NDA y `NDI-2026-000144` (remitida) no aparecen.
   - `CAS-DEMO-000145` tiene una solicitud de información vencida: se puede responder igual.
   - Para ver el ciclo completo: en la evaluación de una NDI use «Solicitar información adicional»; abra «Responder como reportante en "Mis reportes"» en la franja de demostración, responda y vuelva a la evaluación: la respuesta aparece en la tarjeta de la solicitud.
8. Queja anónima (`/uad/queja-anonima`, **sin iniciar sesión**). También se llega desde el formulario general, paso del presunto agresor, junto a la selección de ruta. Al enviarla aparece un consecutivo `NDA-…`; inicie sesión como ADMIN y la verá en la pestaña NDA de la bandeja. El store del mock es único en la aplicación para que esto funcione. Se reinicia al recargar.

## 3. Alternar mock ↔ HTTP

En `src/environments/environment*.ts`:

```ts
uad: { adaptador: 'mock' }   // desarrollo: datos sintéticos, sin red
uad: { adaptador: 'http' }   // producción: {apiBaseUrl}/uad/... según openapi-uad.yaml
```

**Vista previa de demostración en Vercel:** `npm run deploy:vercel:demo` compila con `--configuration production,demo`
(`environment.demo.ts`, que hereda de producción y solo simula la UAD y Línea Alma) y sube una vista previa al proyecto
`casilda-preview`. Se entra con un usuario ADMIN real de QA. `npm run build`, `deploy:vercel:preview` y `deploy:vercel` no cambian.

No hay que tocar componentes. **Nunca desplegar con `'mock'`** (`environment.prod.ts` ya tiene `'http'`).

Para que `'http'` responda, el servidor de ese entorno necesita:

1. El WAR con el módulo UAD (Entregas 1 y 2, ya en `main` del backend) desplegado.
2. `database/uad_modulo_entrega1.sql` y, para casos, `uad_modulo_entrega2.sql`: crean los roles y registran las rutas en `endpoint` / `endpointrole`.
3. Un usuario con `UAD_EQUIPO_3` o `UAD_EQUIPO_4`. **ADMIN y `UAD_COORDINACION` solo alcanzan `GET /uad/contexto`, que les devuelve `capacidades: []`** (D-UAD-03): con `'http'` un ADMIN ve «Acceso restringido», no las bandejas.

Si falta alguno, el servidor responde 403 o 404 y la UI muestra sus estados de error. La franja «Datos de demostración» y el equipo simulado solo existen con `'mock'`.

## 4. Generación de tipos desde OpenAPI

El proyecto no genera clientes. Cuando Backend publique la spec real (springdoc, `/api/v1/api-docs`):

1. `npx openapi-typescript <url-o-archivo> -o src/app/uad/contratos/uad-api.generated.ts`. Es una dependencia de desarrollo; agregarla solo con aprobación.
2. `uad-api.types.ts` pasa a reexportar alias de los tipos generados. El puerto y los componentes no cambian.
3. Se compara la spec generada con `openapi-uad.yaml` y cada diferencia se registra en `DECISIONES_PENDIENTES_UAD.md`.

## 5. Pruebas

```powershell
npm run test:ci                      # suite completa
npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/uad/**/*.spec.ts'
npm run lint
npm run a11y:audit
```

Qué cubren:
- `dominio/*.spec.ts`: competencia y reglas de la decisión.
- `infraestructura/mock/uad-mock.adapter.spec.ts`: visibilidad por equipo, NDA, coordinación sin acceso, identificadores, decisiones, 409, reclasificación e historial append-only.
- `infraestructura/uad-http.adapter.spec.ts`: rutas, verbos y traducción de errores contra el contrato.
- `uad.providers.spec.ts`: selección de adaptador y protección de rutas.
- Páginas: bandeja, evaluación, casos, queja anónima y «Mis reportes» (listado y detalle).
- `dominio/mis-reportes.spec.ts` e `infraestructura/uad-mis-reportes.adapters.spec.ts`: reglas de la respuesta, textos para la persona usuaria, rutas HTTP y reglas del mock (dueño, 404, doble respuesta).
- `services/auth.service.spec.ts`: roles UAD.

**Pruebas del servidor:** el filtro por equipo, fase y recurso se prueba en el backend (`UadIntegrationTest`, que requiere Docker): por ejemplo, Equipo 4 pide `GET /uad/noticias/{id}` de una NDI docente y recibe 404. Ocultar algo en el frontend no es un control de seguridad.

**Pendiente:** prueba de punta a punta del frontend con `'http'` contra un servidor con el módulo UAD. Las pruebas de `uad-http.adapter.spec.ts` validan el contrato escrito, no el servidor.

## 6. Campos de fecha

Los campos de fecha del módulo usan el calendario de Material (`matDatepicker`), que se abre al hacer clic en el campo o en su ícono. Quien navega con teclado puede escribir la fecha como `dd/mm/aaaa`.

| Campo | Página | Límite |
|---|---|---|
| Recibida desde / Recibida hasta | `bandeja-noticias` | Cada uno acota al otro. |
| Fecha límite para responder | `evaluacion-noticia` (Solicitar información) | Desde mañana. |
| Fecha de remisión | `evaluacion-noticia` y `gestionar-caso` | Hasta hoy. |

- El calendario entrega un `Date`. `fechaContrato()` (`dominio/decision-evaluacion.ts`) lo convierte al `YYYY-MM-DD` local del contrato, sin corrimiento de zona horaria. Los límites salen de `inicioDelDia()`.
- El formato visible (`dd/mm/aaaa`) y el idioma vienen de `CustomDateAdapter` y `MAT_DATE_LOCALE`, provistos en `app.config.ts`. Las pruebas de página usan `provideNativeDateAdapter()`.
- El módulo UAD no tiene campos de hora. Si se agrega uno, usar `mat-timepicker` de Material con el mismo patrón.

## 7. Plan de las siguientes entregas

**Entregas 1 y 2: hechas en el frontend (mock) y en el backend.** Falta que Backend despliegue, ejecute los dos scripts SQL y asigne roles; después se prueba el frontend con `'http'`.

**Entrega 3: transversal.**
- **Hecho en el frontend (mock) y en el backend:** queja anónima NDA con envío sin credenciales y acceso desde el formulario general. `POST /uad/noticias-anonimas` ya existe; el flag `uadQuejaAnonima` sigue apagado en producción hasta probarlo de punta a punta.
- **Hecho en el frontend (mock) y en el backend (rama, sin integrar):** "Mis reportes" y la respuesta a la subsanación, solo con texto. La evaluación muestra a la UAD la respuesta del reportante. Falta validar con UAD jurídica los textos de estado y de las pantallas (D-UAD-32).
- **Contrato en borrador, sin interfaz:** remisión a otro actor de la Ruta (campos sin aprobar).
- **Bloqueado por decisiones:** pregunta de vinculación de 10 opciones en el formulario general (D-UAD-05). El nacimiento de la NDI al radicar (D-UAD-17) ya lo hace el backend con una regla provisional.
- **Pendiente de Backend:** integrar y desplegar la Entrega 3, evidencias en la respuesta (D-UAD-09), acceso histórico y servicio de notificaciones.
