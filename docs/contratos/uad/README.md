# Módulo UAD Equipos 3 y 4: contratos y guía técnica

**Estado (2026-11-14):** la Entrega 1 del frontend funciona con el adaptador mock. **El backend no tiene ninguna operación UAD**: todos los contratos están propuestos y ninguno implementado.

| Documento | Para qué |
|---|---|
| [`openapi-uad.yaml`](openapi-uad.yaml) | **Fuente de verdad** de los contratos (OpenAPI 3.0.3). Cada operación lleva `x-estado` y `x-entrega`. |
| [`AUDITORIA_UAD.md`](AUDITORIA_UAD.md) | Diagnóstico de los dos repositorios con evidencia, inventario de endpoints y tabla requisito → estado. |
| [`MATRIZ_CONTRATOS_UAD.md`](MATRIZ_CONTRATOS_UAD.md) | Requisito → UI → tipo/schema → endpoint → estado, y mapeo contrato → TS → puerto → adaptadores. |
| [`DECISIONES_PENDIENTES_UAD.md`](DECISIONES_PENDIENTES_UAD.md) | D-UAD-01…19: impacto, fuente, decisión provisional y quién valida. |

## 1. Arquitectura

```text
Página / componentes (src/app/uad/paginas, componentes)
  → UadFacade (servicios/uad.facade.ts)            orquesta; sin reglas de negocio
  → UadApiPort (contratos/uad-api.port.ts)         una función por operationId
      ├─ UadHttpAdapter (infraestructura/uad-http.adapter.ts)   {apiBaseUrl}/uad/...
      └─ UadMockAdapter (infraestructura/mock/)                 servidor simulado en memoria
```

- `contratos/uad-api.types.ts` es el espejo del OpenAPI. Si cambia uno, cambia el otro en el mismo commit.
- `dominio/` tiene reglas puras: competencia por equipo y validación de la decisión. Las usan la UI y el mock. **El servidor debe aplicarlas por su cuenta.**
- Ambos adaptadores entregan los errores como `ErrorUad` (`infraestructura/uad-error.ts`), leído del `ErrorResponse` real del backend.
- El puerto se provee en las rutas `/uad` (`provideUadApi()` en `routes.ts`), no en la raíz.

## 2. Ejecutar la interfaz

```powershell
npm start          # http://localhost:4200
```

1. Inicie sesión con un usuario **ADMIN** (QA) o, en modo demostración, con la cuenta de prueba ADMIN.
   Hoy ningún usuario real tiene roles `UAD_*`, porque no existen en el backend.
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

## 3. Alternar mock ↔ HTTP

En `src/environments/environment*.ts`:

```ts
uad: { adaptador: 'mock' }   // desarrollo: datos sintéticos, sin red
uad: { adaptador: 'http' }   // producción: {apiBaseUrl}/uad/... según openapi-uad.yaml
```

**Vista previa de demostración en Vercel:** `npm run deploy:vercel:demo` compila con `--configuration production,demo`
(`environment.demo.ts`, que hereda de producción y solo pone la UAD en `'mock'`) y sube una vista previa al proyecto
`casilda-preview`. Se entra con un usuario ADMIN real de QA. `npm run build`, `deploy:vercel:preview` y `deploy:vercel` no cambian.

No hay que tocar componentes. Con `'http'`, hasta que Backend implemente el contrato y registre las rutas en `endpoint` / `endpointrole`, el servidor responderá 403 o 404 y la UI mostrará sus estados de error.
**Nunca desplegar con `'mock'`** (`environment.prod.ts` ya tiene `'http'`).

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
- Páginas: bandeja y evaluación.
- `services/auth.service.spec.ts`: roles UAD.

**Prueba de integración futura (Backend):** el filtro por equipo, fase y recurso debe probarse en el servidor. Por ejemplo: Equipo 4 pide `GET /uad/noticias/{id}` de una NDI docente y debe recibir 404. Ocultar algo en el frontend no es un control de seguridad.

## 6. Plan de las siguientes entregas

**Entrega 2: casos.** Depende de que Backend implemente la Entrega 1 y de D-UAD-15.
- Gestionar caso con catálogo por fase y equipo (bitácora §7).
- Acciones permanentes con confirmación.
- Observaciones opcionales.
- Historial del caso.
- Pruebas del caso (solo consulta).
- Traslado instrucción → decisión con confirmación explícita.
- Pruebas: catálogo, acciones permanentes, traslado y conservación del historial.

**Entrega 3: transversal.** Depende de D-UAD-02, 04, 05, 16 y 17.
- Pregunta de vinculación en el formulario general.
- Queja anónima NDA.
- "Mis reportes" con respuesta a la subsanación.
- Remisión interna (cuando se aprueben sus campos) y notificaciones.
- Cambio a HTTP real.
