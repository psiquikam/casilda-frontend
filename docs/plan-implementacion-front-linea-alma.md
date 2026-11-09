# Plan de Implementación Front-end — Módulo Línea Alma (CASILDA)

| | |
| :--- | :--- |
| **Módulo** | Línea Alma — Proyecto CASILDA (Universidad de Antioquia) |
| **Capa** | Front-end, con definición anticipada de contratos de servicios para Backend |
| **Desarrollo** | **Hinara** → Submódulo APH · **Jonathan** → Submódulo Psicología |
| **Fuente** | `levantamiento-requerimientos-linea-alma.md` (en adelante, "el levantamiento") |
| **Fecha** | 6 de noviembre de 2026 |
| **Estado** | Propuesta v1 para validación del equipo |

> **Convenciones del documento.** Los identificadores `RF-ALMA-*`, `RN-ALMA-*` y `RNF-ALMA-*` son los del levantamiento. Se usan tres etiquetas: **Supuesto** (decisión de trabajo para no bloquear mientras se confirma), **Sugerencia** (mejora técnica propuesta) y **Pendiente** (requiere respuesta de Backend o Cliente; ver §12). Tamaños de tarea: **S** ≈ 1 día · **M** ≈ 2–3 días · **L** ≈ 4–5 días.

---

## 1. Resumen ejecutivo

1. **Reparto por submódulo.** Hinara toma **APH** y Jonathan toma **Psicología**. Es el corte natural: cada submódulo tiene su propio conjunto de requerimientos (`RF-ALMA-APH-*` vs `RF-ALMA-PSI-*`), sus propias pantallas y un perfil de acceso distinto (el Técnico APH nunca ve notas clínicas, `RNF-ALMA-002`).
2. **Los dos submódulos se tocan en pocos puntos y están identificados** (§8): derivación APH→Psicología, recontacto, semáforo SLA, caracterización homologada y reutilización de componentes de consentimiento/rutas. Esos "contratos de frontera" se acuerdan **juntos** en el arranque, no por separado.
3. **Estrategia contract-first con mocks.** Cada quien redacta el contrato de sus servicios *antes* de construir la pantalla, lo entrega a Backend para revisión y construye contra un mock fiel al contrato. Así el Front avanza sin esperar y Backend recibe contratos concretos.
4. **Los componentes compartidos tienen un único dueño** (§4.3). Quien consume no modifica; solicita el cambio al dueño. Esto elimina la principal fuente de conflictos.
5. **Se detectaron inconsistencias adicionales en el levantamiento** que afectan contratos (§12). Las tres más críticas: dos modelos de estados incompatibles, la FK `atencion_psicologia.id_caso` frente a que el caso nace después de los intentos de contacto, y la falta de definición de cuándo arranca el reloj del SLA. Cada una tiene un **supuesto de trabajo** para que nadie quede bloqueado.

---

## 2. Alcance

**Dentro del plan**

- Submódulo **APH**: consulta por documento, registro de atención, triaje, consentimiento, derivación a Psicología, rutas internas/externas, bandeja de remisiones recibidas, cierre y contención post-cierre.
- Submódulo **Psicología**: bandeja compartida con semáforo SLA, toma de novedad, protocolo de hasta 9 intentos, primer contacto efectivo (nace el `CAS-...`), valoración de riesgo, presunto agresor, seguimientos, cierre, PDF y resolución de recontactos.
- Componentes transversales del módulo (RBAC en UI, borrador, bloqueo optimista, catálogos, auditoría).
- **Propuesta de contratos de servicios** para Backend (Anexo A).

**Fuera del plan (se mockea o se difiere)**

| Elemento | Tratamiento |
| :--- | :--- |
| Portal de Usuario / Víctima | Fuera de alcance (módulo distinto). |
| Telepsiquiatría | Sin definición en las fuentes; no se construye. |
| Pantallas de EA, SPyB y UAD | Solo puntos de integración (remisión entrante/saliente) con mock. |
| Administración de maestros (catálogos, usuarios) | Backlog; en este plan los catálogos solo se **consumen**. |
| Cálculo automático del triaje | No existe; APH selecciona manualmente `ALTO/MEDIO/BAJO` (algoritmo externo del LivingLab). |
| Envío de correos, generación de PDF, almacenamiento de archivos | Responsabilidad de Backend; el Front dispara la acción y muestra el estado. |

---

## 3. Estrategia de trabajo

### 3.1 Contract-first

1. Antes de construir una pantalla, su dueño redacta el contrato (endpoint, roles, request/response con ejemplo, validaciones y errores) en `contracts/`.
2. Se abre un PR con etiqueta `contrato`. Lo revisa Backend y, si es de frontera, también la otra persona del Front.
3. Se construye contra un **mock que respeta exactamente el contrato**.
4. Cuando Backend publica el servicio, se cambia mock por real **sin tocar componentes**.

**Sugerencia — capa de servicios con adaptadores.** Los componentes nunca llaman HTTP directamente ni conocen el DTO crudo del backend: pasan por `services/*` que mapean DTO → modelo de vista. Si un contrato cambia, el impacto queda en un archivo.

### 3.2 Mocks

- Servidor mock (p. ej. MSW o equivalente del proyecto) con un **interruptor mock/real por servicio**.
- **Seed compartido** de personas de prueba que cubre los escenarios clave (Anexo B). Ambos desarrolladores prueban con las mismas cédulas ficticias. No usar datos reales: el módulo maneja información sensible.
- **Store en memoria compartido** para que, en la integración (Sprint 4), lo que Hinara deriva aparezca en la bandeja de Jonathan.

### 3.3 Estructura de carpetas propuesta

> Adaptar a la convención real del proyecto (framework, alias, nombres). Lo importante es **la propiedad por carpeta**.

```
src/modules/linea-alma/
├── aph/                  ← dueña: Hinara
│   ├── pages/  components/  hooks/  services/  routes.ts
├── psicologia/           ← dueño: Jonathan
│   ├── pages/  components/  hooks/  services/  routes.ts
├── shared/               ← dueño por subcarpeta/componente (ver §4.3)
│   ├── components/  hooks/  types/  catalogos/  utils/
├── contracts/            ← subcarpetas aph/ psicologia/ frontera/
└── mocks/                ← handlers por dueño + seed y store compartidos
```

### 3.4 Rutas propuestas

| Ruta | Pantalla | Dueño |
| :--- | :--- | :--- |
| `/linea-alma/aph/nueva` | Consulta por documento + registro de atención | Hinara |
| `/linea-alma/aph/remisiones` | Bandeja de remisiones recibidas (EA/SPyB/UAD) | Hinara |
| `/linea-alma/aph/atenciones/:idAtencion` | Detalle de atención APH | Hinara |
| `/linea-alma/psicologia/bandeja` | Bandeja compartida con semáforo SLA | Jonathan |
| `/linea-alma/psicologia/novedades/:idAtencion` | Gestión de la novedad (intentos, primer contacto) | Jonathan |
| `/linea-alma/psicologia/casos/:numeroCaso` | Expediente del caso (seguimientos, cierre, PDF) | Jonathan |

**Supuesto:** mientras no exista `CAS-...`, la novedad se identifica por `idAtencion` (`ALMA-...`). Al generarse el caso, se redirige a `/casos/:numeroCaso` (ver Q2 en §12).

---

## 4. Reparto de responsabilidades

### 4.1 Vista general

| | **Hinara — APH** | **Jonathan — Psicología** |
| :--- | :--- | :--- |
| **Requerimientos propios** | `RF-ALMA-APH-001…005` | `RF-ALMA-PSI-001…005`, `RF-ALMA-007` |
| **Pasos del flujo** | 1 (recepción) y 2 (triaje y derivación) | 3 (contacto), 4 (primer contacto y caso), 5 (seguimiento y cierre) |
| **Procesos derivados** | Rutas internas/externas (registro desde APH), contención post-cierre | Resolución de recontacto, gestión en simultáneo con EA |
| **Rol "plataforma" transversal** | Estructura del módulo, RBAC en UI, cliente HTTP, infraestructura de mocks, auditoría | Dominio: tipos/enums, catálogos, SLA, borrador, bloqueo optimista |
| **Componentes reutilizables que entrega** | Caracterización, Consentimiento, Panel de derivaciones, Contención post-cierre, Auditoría | `SlaBadge`, `useBorrador`, `useBloqueoOptimista`, `NotasTimeline`, Alerta de gestión simultánea |

### 4.2 Balance de carga

Psicología concentra más complejidad funcional (protocolo de intentos, contador de seguimientos, valoración clínica, PDF). APH concentra más trabajo de plataforma y de componentes reutilizables. El total es comparable (17 tareas por persona, más la sesión conjunta K-0). Si Jonathan se retrasa, las tareas candidatas a pasar a Hinara son **J-1.8** y **J-2.1** (ver riesgo R5).

### 4.3 Componentes compartidos y su dueño

| Componente / pieza | Dueño | Lo consume | Descripción |
| :--- | :--- | :--- | :--- |
| Estructura de módulo, rutas, menú, guards RBAC | Hinara | Ambos | `usePermissions`, `RequirePermission`, stubs de rutas por submódulo |
| Cliente HTTP y modelo de error estándar | Hinara | Ambos | JWT, interceptores, manejo 401/403/404/409/422 |
| Infraestructura de mocks, seed y store | Hinara | Ambos | Cada quien agrega handlers solo en su carpeta |
| `CaracterizacionForm` (homologación, `RF-ALMA-006`) | Hinara | Jonathan (J-1.4) | Variables sociodemográficas alineadas con EA |
| `ConsentimientoInformado` (variantes digital/verbal) | Hinara | Jonathan (J-1.4) | `RF-ALMA-004`, `RN-ALMA-02` |
| `PanelDerivaciones` (rutas internas y externas) | Hinara | Jonathan (J-1.6) | Registro de activación y seguimiento de rutas |
| `ContencionPostCierreForm` | Hinara | Jonathan (J-1.7) | Atención post-cierre sin reabrir el caso |
| `AuditTrail` (historial inmutable, `RNF-ALMA-003`) | Hinara | Jonathan | Solo lectura |
| Tipos de dominio, enums, validadores de `ALMA-`/`CAS-` | Jonathan | Ambos | Archivo único de estados y enums (aísla el cambio de Q1) |
| `useCatalogo` y catálogos semilla | Jonathan | Ambos | Incluye placeholder "Dimensión 1…15" |
| `SlaBadge` + `useCuentaRegresiva` | Jonathan | Hinara (listas APH) | Semáforo y reloj decreciente (`RN-ALMA-01`) |
| `useBorrador` (Guardar progreso, `RF-ALMA-005`) | Jonathan | Hinara (H-1.2) | Guardado parcial sin cerrar la atención |
| `useBloqueoOptimista` (`RNF-ALMA-001`) | Jonathan | Ambos | Manejo de `version` y respuestas 409 |
| `NotasTimeline` (notas APH / PSICO / SEGTO) | Jonathan | Hinara (detalle APH) | El Técnico APH solo recibe notas APH |
| `AlertaGestionSimultanea` | Jonathan | Ambos | Caso con actuación activa en EA y Línea Alma |

**Regla:** el consumidor nunca edita un componente ajeno. Si necesita un cambio, abre un issue/PR pequeño dirigido al dueño. La API pública del componente (props, eventos) se considera estable una vez mergeada.

---

## 5. Fase 0 — Fundaciones (en paralelo, ≈ 4 días)

Objetivo: dejar el terreno listo para que, desde el Sprint 1, cada persona trabaje en su carpeta sin depender de la otra.

| ID | Tarea | Dueño | Tam. | Depende de | Entregable |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **K-0** | **Sesión de arranque conjunta (2 h):** convenciones (§10), enums/estados (Q1), formato de contratos (Anexo A.1) y fronteras F1–F3 (§8) | Ambos | S | — | Acuerdos escritos y fronteras F1–F3 en borrador v0 |
| **H-0.1** | Esqueleto del módulo: carpetas, stubs de rutas por submódulo, entradas de menú "Línea Alma", guards RBAC según §11 | Hinara | M | K-0 | Navegar a ambas secciones con roles distintos; acceso denegado correcto |
| **H-0.2** | Capa HTTP: cliente con JWT, interceptores, manejo estándar de errores (401/403/404/409/422/5xx) | Hinara | S | K-0 | Cliente reutilizable y modelo de error tipado |
| **H-0.3** | Infraestructura de mocks: servidor mock, seed de personas (Anexo B), store en memoria, interruptor mock/real por servicio | Hinara | M | H-0.2 | Mock levantable con escenarios de prueba |
| **H-0.4** | Plantilla de contrato y carpeta `contracts/` + guía breve de cómo proponer un contrato a Backend | Hinara | S | K-0 | Plantilla usada por ambos desde el Sprint 1 |
| **J-0.1** | Tipos de dominio: enums (triaje, estados, canal, tipo de seguimiento), validadores/formatters de `ALMA-YYYY-NNNNNN` y `CAS-YYYY-NNNNNN` | Jonathan | S | K-0 | Archivo único `shared/types` |
| **J-0.2** | `useCatalogo(nombre)` con caché y catálogos semilla (incl. "Dimensión 1…15") | Jonathan | S | J-0.1 | Catálogos consumibles por nombre |
| **J-0.3** | `SlaBadge` + `useCuentaRegresiva`: semáforo desde `venceEn` y `ahoraServidor` (evita depender del reloj del navegador), umbrales configurables | Jonathan | M | J-0.1 | Componente con pruebas unitarias de umbrales |
| **J-0.4** | `useBorrador` (`RF-ALMA-005`) y `useBloqueoOptimista` (`version` + 409, `RNF-ALMA-001`) | Jonathan | M | J-0.1, H-0.2 | Hooks documentados con ejemplo de uso |

**Checkpoint CP0 (fin de Sprint 0):** demo de 15 min — navegación por rol, lista mock con `SlaBadge`, guards y manejo de un 409 simulado.

---

## 6. Plan de Hinara — Submódulo APH

**Misión:** que el Técnico APH pueda recibir una solicitud 24/7, identificar si la persona ya tiene seguimiento, registrar la atención, asignar triaje, obtener consentimiento y derivar (a Psicología o a rutas), sin acceder nunca a información clínica.

**Contratos que propone a Backend:** `personas/consulta`, `atenciones-aph` (CRUD + triaje + cierre), `derivaciones/psicologia`, `derivaciones/internas`, `rutas-externas`, `bandeja/aph`, `contenciones-post-cierre` (Anexo A).

### Sprint 1 — Entrada de la solicitud

**H-1.1 — Consulta por documento y alerta de seguimiento activo** · `RF-ALMA-003`, `RN-ALMA-06` · Paso 1 · **M** · Depende de: H-0.1, H-0.3, J-0.1
- *Alcance:* captura de tipo y número de documento y consulta previa a la atención. Si la persona tiene seguimiento psicológico activo, banner informativo con **fecha del próximo seguimiento y profesional a cargo**. El Backend notifica a Psicología; el Front solo informa que se envió la notificación. Si existe un caso cerrado, habilita el camino de contención post-cierre (H-1.7).
- *Aceptación:* el Técnico APH **no ve notas clínicas** (`RNF-ALMA-002`). La alerta no permite vincular nada: una llamada nueva siempre genera una nueva atención `ALMA-...` (`RN-ALMA-06`). Cubre estados: persona nueva, persona con historial, cargando, error.
- *Contrato:* `GET /personas/consulta` → frontera **F2**.

**H-1.2 — Registro de atención APH** · `RF-ALMA-APH-001`, `RF-ALMA-001`, `RF-ALMA-005`, `RF-ALMA-006` · Paso 1 · **L** · Depende de: H-0.1, H-0.3, J-0.1, J-0.4 *(hasta que J-0.4 esté, usar botón Guardar simple)*
- *Alcance:* formulario de atención. **Sugerencia:** stepper *Identificación → Caracterización → Motivo y solicitante → Triaje y derivación*. Canal de origen (llamada, WhatsApp Opción 2, remisión de EA/SPyB/UAD), datos del solicitante/tercero, motivo de consulta, caracterización mínima mediante `CaracterizacionForm`. Botón **Guardar** (borrador) y retomar borrador. Al primer guardado se muestra el ID `ALMA-YYYY-NNNNNN` (ver Q4).
- *Aceptación:* validaciones por campo; el borrador no pierde datos; ID visible y copiable; pre-llenado cuando proviene de una remisión; etiquetas homologadas con EA (`RF-ALMA-006`, ver Q5).
- *Contrato:* `POST /atenciones-aph`, `PATCH /atenciones-aph/{id}`, `GET /atenciones-aph/{id}`.

**H-1.3 — Triaje y omisión por peligro inminente** · `RF-ALMA-APH-002`, `RN-ALMA-01` · Paso 2 · **M** · Depende de: H-1.2
- *Alcance:* selector manual `ALTO / MEDIO / BAJO` (el algoritmo es externo al sistema). Opción **"Peligro inminente para la vida"**: permite omitir el triaje exigiendo **justificación narrativa** y ofrece activación directa de SPyB (Central de Monitoreo) o Línea 123 mediante `PanelDerivaciones`.
- *Aceptación:* no se puede continuar sin triaje **o** sin justificación de omisión. Se muestra, como ayuda informativa, el tiempo máximo de primer contacto por nivel (12 h / 24 h / 48 h). El front no calcula ni sugiere el triaje.
- *Contrato:* `PUT /atenciones-aph/{id}/triaje`.

### Sprint 2 — Derivar

**H-1.4 — Consentimiento y derivación a Psicología** · `RF-ALMA-004`, `RF-ALMA-APH-003`, `RN-ALMA-02` · Paso 2 · **M** · Depende de: H-1.3
- *Alcance:* pregunta obligatoria **"¿Desea remisión a Psicología?"**. Si **sí**: `ConsentimientoInformado` (lectura + aceptación registrada) y solo entonces se habilita **Derivar**. Si **no**: la atención sigue en `EN_GESTION_APH` y se pueden gestionar rutas o cerrar. Excepción de `RN-ALMA-02`: peligro inminente.
- *Aceptación:* sin consentimiento no hay derivación (el 422 `CONSENTIMIENTO_REQUERIDO` del Backend también se muestra). Tras derivar se muestra estado `PENDIENTE_PSICOLOGIA`, SLA y confirmación.
- *Contrato:* `POST /atenciones-aph/{id}/derivaciones/psicologia` → frontera **F1**. Entrega además el componente `ConsentimientoInformado` (frontera **F5**).

**H-1.5 — Panel de rutas internas y externas** · `RF-ALMA-APH-003`, `RF-ALMA-APH-004`, `RN-ALMA-02` · §1 y §10 · **L** · Depende de: H-1.2, J-0.2
- *Alcance:* **internas** → SPyB, Equipo de Atención, Dupla Psicojurídica, Programa de Masculinidades, UAD (exigen consentimiento, salvo peligro inminente hacia SPyB). **Externas** → Línea 123, Código Fucsia/Sector Salud, Fiscalía, Comisarías de Familia, Policía Nacional, ICBF, CAIVAS (registro de activación y de seguimiento: resultado/estado). Historial de derivaciones del contexto.
- *Aceptación:* **componente reutilizable** (recibe `contexto = { tipo: ATENCION_APH | CASO, id }`) para que Jonathan lo use sin cambios (F6). Destinos desde `useCatalogo`.
- *Contrato:* `POST/GET /derivaciones/internas`, `POST/PATCH/GET /rutas-externas`.

**H-1.6 — Bandeja de remisiones recibidas** · `RF-ALMA-002`, `RF-ALMA-APH-001` · §10 · **M** · Depende de: H-0.3, J-0.3, J-0.4
- *Alcance:* lista de remisiones desde EA, SPyB y UAD (estado `PENDIENTE_APH`) con origen, fecha, resumen y estado; filtros por origen y estado. Abrir una remisión pre-llena H-1.2 con canal "remisión". **Sugerencia (S, opcional):** pestaña "Mis atenciones" con estado de derivación y `SlaBadge` para las derivadas a Psicología (`RN-ALMA-01` aplica también a APH).
- *Aceptación:* paginación y estado vacío; al tomar una remisión se usa `useBloqueoOptimista` para evitar que dos técnicos tomen la misma (**Sugerencia**, análoga a `RNF-ALMA-001`).
- *Contrato:* `GET /bandeja/aph`, `POST /bandeja/aph/{id}/tomar`.

### Sprint 3 — Cerrar y consultar

**H-1.7 — Cierre APH y contención post-cierre** · `RF-ALMA-APH-005` · Excepciones del flujo · **M** · Depende de: H-1.1, H-1.5
- *Alcance:* cierre de la atención cuando la persona no acepta Psicología y no quedan rutas pendientes (motivo desde catálogo). `ContencionPostCierreForm`: si la persona tiene un caso cerrado y vuelve a comunicarse, se registra una nota de contención.
- *Aceptación:* la interfaz deja explícito que **no reabre el caso ni incrementa el contador de seguimientos**; el registro aparece en la línea de tiempo como tipo `POST_CIERRE`. Componente reutilizable (F6).
- *Contrato:* `POST /atenciones-aph/{id}/cierre`, `POST /contenciones-post-cierre`.

**H-2.1 — Detalle de atención APH** · **M** · Depende de: H-1.2, H-1.5, J-0.1
- *Alcance:* vista de una atención: datos, triaje, derivaciones y rutas, notas APH (`NotasTimeline`), estado, SLA y alerta de gestión simultánea si aplica.
- *Aceptación:* solo notas APH; ningún dato clínico de Psicología.

**H-3.1 — Vista de auditoría `AuditTrail`** · `RNF-ALMA-003` · **M** · Depende de: H-0.4
- *Alcance:* componente de solo lectura con historial inmutable (usuario, fecha, hora, detalle del cambio) de creaciones, cambios de estado, derivaciones y vinculaciones manuales. Se reutiliza en Psicología.
- *Contrato:* `GET /auditoria?contexto=…` (Anexo A). Se mueve al Sprint 3 para tener el contrato revisado a tiempo.

### Sprint 4 — Integración y endurecimiento

| ID | Tarea | Refs | Tam. | Depende de | Aceptación |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **H-2.2** | Integración E2E con Jonathan (store compartido): *registrar → derivar → aparece en bandeja con SLA* y *cédula con seguimiento activo → alerta en APH + marca en bandeja* | F1, F2 | M | H-1.4, J-1.1, J-1.7 | Escenarios demostrables sin intervención manual |
| **H-3.2** | Pruebas de permisos según matriz §11, incluyendo casos negativos (Técnico APH sin acceso a notas clínicas ni a `/psicologia/*`) | `RNF-ALMA-002` | M | H-0.1 | Suite de pruebas por rol en verde |
| **H-3.3** | Homologación de nombre y textos ("Línea Alma", no "Línea Violeta"), mensajes de error en lenguaje neutro y no revictimizante, accesibilidad por teclado | Brecha de denominación | S | H-1.x | Revisión de textos validada |
| **H-3.4** | Reemplazo de mocks por servicios reales conforme Backend los publique | — | M | Contratos aprobados | Interruptor mock/real en "real" para APH |

---

## 7. Plan de Jonathan — Submódulo Psicología

**Misión:** que el psicólogo pueda tomar una novedad de la cola compartida respetando el SLA, ejecutar el protocolo de contacto, consolidar el caso en el primer contacto efectivo, hacer seguimientos y cerrar, sin pisar el trabajo de otro psicólogo.

**Contratos que propone a Backend:** `bandeja/psicologia` (+ tomar/liberar), `psicologia/novedades` (detalle, intentos, primer contacto), `casos` (seguimientos, cierre, PDF), `psicologia/recontactos`, `psicologia/agenda` (Anexo A).

### Sprint 1 — Cola y toma de novedades

**J-1.1 — Bandeja compartida con semáforo SLA** · `RF-ALMA-PSI-001`, `RF-ALMA-002`, `RN-ALMA-01` · **L** · Depende de: J-0.3, H-0.3
- *Alcance:* lista con ID `ALMA-...`, persona, triaje, canal, fecha de derivación, `SlaBadge` (tiempo restante o "vencido hace X"), estado, indicador de recontacto y "tomada por". Orden por defecto: **menor tiempo restante primero**. Filtros por triaje, semáforo, estado y documento. Paginación. Refresco periódico (ver Q7).
- *Aceptación:* SLA de 12 / 24 / 48 h según triaje, calculado a partir de `venceEn` del servidor; el contador se actualiza sin recargar; es una **cola compartida sin asignación individual**.
- *Contrato:* `GET /bandeja/psicologia` → consume **F1** y **F3**.

**J-1.2 — Tomar novedad y detalle** · `RF-ALMA-PSI-001`, `RNF-ALMA-001`, `RN-ALMA-04` · Paso 3 · **M** · Depende de: J-1.1, J-0.4
- *Alcance:* acción **Tomar** enviando `version`; si otro psicólogo ya la tomó, el Backend responde 409 `NOVEDAD_YA_TOMADA` y la UI muestra mensaje claro y refresca. Acción **Liberar**. Detalle con notas APH (solo lectura), triaje, consentimiento de APH, derivaciones previas y marca de recontacto.
- *Aceptación:* no hay edición simultánea de la misma novedad; el **triaje APH se muestra y no es editable** (`RN-ALMA-04`).
- *Contrato:* `POST /bandeja/psicologia/{id}/tomar`, `POST …/liberar`, `GET /psicologia/novedades/{id}`.

**J-1.8 — Alerta de gestión en simultáneo** · §10 (EA) · **S** · Depende de: J-0.1
- *Alcance:* `AlertaGestionSimultanea` visible cuando el caso tiene actuaciones activas en EA y en Línea Alma. Mock hasta que exista el módulo EA (ver Q15).

### Sprint 2 — Contactar y consolidar el caso

**J-1.3 — Protocolo de intentos de contacto** · `RF-ALMA-PSI-002`, `RN-ALMA-03` · Paso 3 · **L** · Depende de: J-1.2, J-0.2
- *Alcance:* registro de hasta **9 intentos**: fecha, hora, resultado (catálogo), protocolo (1: primer intento; 2 y 3: distinto día/horario; 4–9 adicionales) y **nota independiente por intento**. Contador `n/9`. Desde el 4.º intento exige **justificación**. Advertencia si repite día u horario del intento anterior. Con 9 intentos sin éxito la UI refleja el **cierre automático por "No contacto"** (lo ejecuta Backend). CTA "Contacto efectivo" → J-1.4.
- *Aceptación:* lógica del protocolo en funciones puras con pruebas unitarias; historial de intentos de solo agregar; con la novedad cerrada no se permiten nuevos intentos.
- *Contrato:* `POST/GET /psicologia/novedades/{idAtencion}/intentos`.

**J-1.4 — Primer contacto efectivo y creación del caso** · `RF-ALMA-PSI-003`, `RF-ALMA-001`, `RF-ALMA-004`, `RN-ALMA-02`, `RN-ALMA-04`, `RN-ALMA-06` · Paso 4 · **L** · Depende de: J-1.3, H-1.2, H-1.4
- *Alcance (flujo por pasos):* consentimiento verbal (`ConsentimientoInformado`, variante verbal) → caracterización (`CaracterizacionForm`) → **valoración clínica de riesgo** (campo propio; muestra el triaje APH al lado sin modificarlo) → clasificación por las **15 dimensiones** (catálogo placeholder) → **presunto agresor** opcional (nombres, apellidos, vínculo, convivencia, observaciones) → acuerdos y fecha/hora del próximo control. Al guardar se muestra `CAS-YYYY-NNNNNN`. Si la persona ya tiene un caso, diálogo de confirmación explícita para vincular.
- *Aceptación:* no avanza sin consentimiento verbal; Guardar borrador en cada paso; el agresor nunca bloquea el guardado; redirección a `/casos/:numeroCaso`.
- *Contrato:* `POST /psicologia/novedades/{idAtencion}/primer-contacto` → consume **F4** y **F5**.

### Sprint 3 — Seguir, cerrar y resolver recontactos

**J-1.5 — Seguimientos** · `RF-ALMA-PSI-004`, `RN-ALMA-05`, `RNF-ALMA-004` · Paso 5 · **L** · Depende de: J-1.4
- *Alcance:* registro de cada seguimiento con nota y la pregunta **"¿Desea continuar con el seguimiento?"**. *Sí* → programa el próximo control y confirma el recordatorio por correo (lo envía Backend; la UI muestra el estado). *No* → CTA a cierre. Contador **X/3** informativo que **no bloquea** al superar 3. **Sugerencia:** vista "Mi agenda" con controles próximos (resuelve la falla de agenda del proceso actual).
- *Aceptación:* el contador es correcto con más de 3; la fecha del próximo control no puede ser pasada; se ve el estado del recordatorio.
- *Contrato:* `POST/GET /casos/{numeroCaso}/seguimientos`, `GET /psicologia/agenda`.

**J-1.6 — Cierre del caso y PDF** · `RF-ALMA-PSI-005`, `RF-ALMA-007` · Paso 5 · **M** · Depende de: J-1.5, H-1.5
- *Alcance:* modal de cierre con **motivo predefinido** (catálogo) y opción de generar PDF; descarga del PDF con historial de atenciones y seguimientos solo para roles con permiso de exportar (ADMIN, COORDINADOR, PROFESIONAL). Incluye `PanelDerivaciones` para derivaciones al cierre.
- *Aceptación:* botón oculto sin permiso; estados de carga y error de generación; tras el cierre el caso queda de solo lectura (salvo contención post-cierre).
- *Contrato:* `POST /casos/{numeroCaso}/cierre`, `GET /casos/{numeroCaso}/pdf`.

**J-1.7 — Resolución de recontacto** · `RF-ALMA-003`, `RN-ALMA-06` · §1 dinámica 4 · **M** · Depende de: J-1.1, J-2.1 *(puede avanzar con mock)*, H-1.7
- *Alcance:* vista comparativa de la nueva atención `ALMA-...` frente al caso activo y tres decisiones: **vincular al caso existente**, **abrir caso nuevo** (hechos distintos) o **contención puntual** (ver Q8).
- *Aceptación:* nunca hay vinculación automática; la decisión es exclusiva de Psicología, pide confirmación y queda auditada; la atención sale de la lista de recontactos pendientes.
- *Contrato:* `GET /psicologia/recontactos`, `POST /psicologia/recontactos/{idAtencion}/resolucion` → consume **F2**.

### Sprint 4 — Integración y endurecimiento

| ID | Tarea | Refs | Tam. | Depende de | Aceptación |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **J-2.1** | Expediente del caso: datos, atenciones APH vinculadas (1:N), línea de tiempo (`NotasTimeline`), agresor, seguimientos, derivaciones, alertas y `AuditTrail` | `RF-ALMA-001` | M | J-1.4, J-1.5, H-3.1 | Vista consolidada sin llamadas redundantes |
| **J-2.2** | Integración E2E con Hinara (mismos escenarios que H-2.2) | F1, F2 | M | H-2.2 | Escenarios demostrables |
| **J-3.1** | Pruebas del núcleo: SLA y umbrales, protocolo de intentos, contador de seguimientos, bloqueo optimista; manejo de zona horaria y desfase de reloj | `RN-ALMA-01/03/05`, `RNF-ALMA-001` | M | J-1.x | Cobertura de la lógica de negocio crítica |
| **J-3.2** | Permisos por rol en vistas de Psicología (COORDINADOR y REVISOR en solo lectura; Técnico APH sin acceso) y estados vacíos/errores | §11 | S | H-0.1 | Coincide con la matriz |
| **J-3.3** | Reemplazo de mocks por servicios reales conforme Backend los publique | — | M | Contratos aprobados | Interruptor mock/real en "real" para Psicología |

---

## 8. Puntos de contacto entre submódulos (contratos de frontera)

Son lo único que puede romper el trabajo en paralelo. Se acuerdan en **K-0**, se congelan en **v1** en el **CP1** (mitad del Sprint 1) y desde ahí cambian solo por PR con ambos como revisores.

| ID | Frontera | Productor → Consumidor | Contenido clave | Contrato |
| :--- | :--- | :--- | :--- | :--- |
| **F1** | Derivación APH → Psicología | H-1.4 → J-1.1, J-1.2 | `idAtencion`, triaje, nota APH, consentimiento, canal, `fechaDerivacion`, `sla` | Anexo A.3-1 |
| **F2** | Recontacto | H-1.1 → J-1.1, J-1.7 | `seguimientoActivo`, marca `recontacto`, decisión de resolución | Anexo A.3-2 |
| **F3** | SLA | J-0.3 → H-1.3, H-1.6 | `horasLimite`, `venceEn`, `ahoraServidor` | Anexo A.3-1 |
| **F4** | Caracterización homologada | H-1.2 → J-1.4 | Campos de `persona` y variables de EA (Q5) | `CaracterizacionForm` |
| **F5** | Consentimiento | H-1.4 → J-1.4 | `otorgado`, `medio` (`DIGITAL`/`VERBAL`), `fechaRegistro` | `ConsentimientoInformado` |
| **F6** | Derivaciones/rutas y contención post-cierre reutilizables | H-1.5, H-1.7 → J-1.6, J-1.7 | `contexto = { tipo, id }` | `PanelDerivaciones`, `ContencionPostCierreForm` |
| **F7** | Concurrencia y errores | H-0.2, J-0.4 → ambos | `version`, 409 `NOVEDAD_YA_TOMADA` / `CONFLICTO_VERSION` | Anexo A.1 y A.3-3 |

---

## 9. Cronograma sugerido

> Referencial, con sprints de 2 semanas. Ajustar con la velocidad real del equipo.

| Sprint | Hinara | Jonathan | Hitos |
| :--- | :--- | :--- | :--- |
| **0** (≈ 4 días) | H-0.1 … H-0.4 | J-0.1 … J-0.4 | **K-0** y **CP0** |
| **1** | H-1.1, H-1.2, H-1.3 | J-1.1, J-1.2, J-1.8 | Contratos v0 de APH y bandeja enviados a Backend · **CP1:** fronteras F1–F3 congeladas en v1 |
| **2** | H-1.4, H-1.5, H-1.6 | J-1.3, J-1.4 | Demo: registrar y derivar / gestionar contactos y crear caso. **H-1.4 se programa primero**: J-1.4 consume su componente de consentimiento |
| **3** | H-1.7, H-2.1, H-3.1 | J-1.5, J-1.6, J-1.7 | Demo: ciclo completo del caso con mocks |
| **4** | H-2.2, H-3.2, H-3.3, H-3.4 | J-2.1, J-2.2, J-3.1, J-3.2, J-3.3 | Demo integrada de extremo a extremo · reemplazo de mocks |

**Ritmo de demos:** cierre de cada sprint con demo corta conjunta (15–20 min) usando el store compartido, aunque cada quien solo haya completado su mitad.

---

## 10. Convenciones para trabajar separados sin pisarse

### 10.1 Propiedad, ramas y revisión

- **Propiedad por carpeta** (`CODEOWNERS`): `aph/` → Hinara · `psicologia/` → Jonathan · `shared/` y `contracts/` → dueño según §4.3.
- **Ramas:** `feature/alma-aph/H-1.2-registro-atencion`, `feature/alma-psi/J-1.3-intentos`, `feature/alma-shared/J-0.3-sla-badge`. Incluir el ID de tarea en la rama y en los commits (`[H-1.2] …`) para trazabilidad.
- **PR pequeños** (referencia: ≤ 400 líneas), rebase diario sobre la rama de integración, merge por *squash*.
- **Revisión cruzada obligatoria:** Hinara revisa a Jonathan y viceversa. Detecta incompatibilidades en fronteras y reparte el conocimiento del módulo.
- **Cambios en fronteras (F1–F7):** solo por PR en `contracts/frontera/` con ambos como revisores. Un cambio que rompe compatibilidad se acuerda antes en la daily.

### 10.2 Zonas calientes de conflicto

| Zona | Riesgo | Regla |
| :--- | :--- | :--- |
| Router principal y menú | Dos personas editan el mismo archivo | Los stubs se crean en H-0.1; cada quien edita **solo** su `routes.ts` |
| `shared/types` (enums, estados) | Cambios simultáneos | Solo Jonathan edita; Hinara solicita el cambio |
| `mocks/shared` (seed, store) | Pisarse datos de prueba | Hinara mantiene el núcleo; cada quien agrega handlers y datos en su carpeta |
| Catálogos | Valores distintos para el mismo catálogo | Solo `useCatalogo` (Jonathan) lee y expone catálogos |
| `package.json` y lockfile | Conflictos de dependencias | Avisar antes de agregar; PR dedicado y pequeño |
| Textos y etiquetas | Variantes del mismo concepto | Textos comunes en `shared`; los propios, en cada módulo |

### 10.3 Definición de Listo (DoR) para entregar un contrato a Backend

Método y ruta · roles autorizados (según §11) · request y response con **ejemplo JSON** · validaciones y reglas de negocio aplicables (`RN-ALMA-*`) · códigos de error previstos · paginación y filtros si es lista · enums involucrados · efectos colaterales (notificaciones, correos, auditoría).

### 10.4 Definición de Hecho (DoD) de una tarea

- Contrato v0 en `contracts/` y handler mock fiel al contrato.
- Estados de **cargando, vacío, error, 403 y 409** resueltos.
- Permisos aplicados (acción oculta + guard de ruta); el Backend sigue siendo la autoridad.
- Validaciones de las reglas de negocio correspondientes; Guardar borrador donde aplique.
- Sin datos clínicos visibles para el Técnico APH.
- Navegable por teclado; textos "Línea Alma"; mensajes en lenguaje neutro y no revictimizante.
- Pruebas unitarias de la lógica crítica (SLA, protocolo, contador, vinculación).
- Revisión cruzada aprobada y demo en la daily o en la demo del sprint.

### 10.5 Comunicación

Daily de 10 min · canal único del módulo · tablero con los IDs de este plan · bloqueos de frontera se escalan el mismo día, no al final del sprint.

---

## 11. Matriz de permisos aplicada a la interfaz

Derivada de la matriz del levantamiento (`RNF-ALMA-002`). **Claves de permiso sugeridas:** `alma.aph.{crear,consultar,editar,cerrar}`, `alma.psicologia.{crear,consultar,editar,cerrar}`, `alma.notasClinicas.consultar`, `alma.pdf.{consultar,exportar}`, `alma.alertaSeguimiento.consultar`.

| Rol | En pantallas APH | En pantallas Psicología | PDF / notas clínicas |
| :--- | :--- | :--- | :--- |
| **ADMIN** | Todo | Todo | Consultar, exportar |
| **COORDINADOR** | Crear, consultar, editar | Crear, consultar, editar | Consultar, exportar |
| **PROFESIONAL (Psicólogo)** | Solo consulta de **notas APH** (en el detalle de la novedad) | Crear, consultar, editar, cerrar | Crear, consultar, exportar PDF |
| **TÉCNICO APH** | Crear, consultar, editar, cerrar | **Solo alerta informativa** de seguimiento (fecha próxima y profesional) | **Sin acceso a notas clínicas** |
| **REVISOR** | Solo consulta | Solo consulta | Solo consulta |
| **USUARIO (Víctima)** | Sin acceso | Sin acceso | Fuera de alcance de este plan |

**Supuesto:** no se construye la acción "Eliminar" (la matriz la lista para ADMIN, pero ningún requerimiento la describe; ver Q13).

---

## 12. Pendientes, supuestos de trabajo y riesgos

### 12.1 Pendientes que afectan contratos

Prioridad **Alta** = resolver antes del CP1 (mitad del Sprint 1); **Media** = antes del Sprint 3; **Baja** = ajustable sin rehacer.

| # | Pendiente (detectado en el levantamiento) | Afecta | Supuesto de trabajo mientras se responde | Consultar a | Prio. |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Q1** | **Dos modelos de estados incompatibles.** El flujo define `PENDIENTE_APH`, `EN_GESTION_APH`, `PENDIENTE_PSICOLOGIA`, `ABIERTO_ACTIVO`/`EN_SEGUIMIENTO`, `CERRADO`; el ER define `caso.estado` = `ABIERTO`, `ACTIVO`, `EN_CIERRE`, `CERRADO`. Además `prioridad` usa `ALTA/MEDIA/BAJA` y `triage` usa `ALTO/MEDIO/BAJO`. | Todas las etiquetas, filtros y contratos | Estados del flujo para la **atención/novedad**; estados del ER para el **caso**; todo centralizado en `shared/types` (cambio en un solo archivo) | Arquitecto de Software / Backend | Alta |
| **Q2** | **`atencion_psicologia.id_caso` es FK, pero el caso nace en el primer contacto efectivo**, y los intentos (hasta 9) ocurren antes. ¿A qué entidad se asocian intentos y derivaciones previos al caso? Lo mismo aplica a derivaciones registradas por Psicología (`id_atencion`). | J-1.2, J-1.3, F6 | La novedad se identifica por `idAtencion` (`ALMA-...`) hasta que existe `numeroCaso`; derivaciones con `contexto = { tipo, id }` | Arquitecto de Software / Backend | Alta |
| **Q3** | **SLA sin definir por completo:** ¿cuándo arranca el reloj (registro APH, derivación o aceptación)? ¿horas corridas u horario del equipo de Psicología? ¿umbrales del semáforo? ¿qué ocurre al vencer? | J-0.3, J-1.1 | Reloj desde `fechaDerivacion`, horas corridas; Backend entrega `venceEn` y `ahoraServidor`. **Sugerencia de umbrales (a validar):** verde > 50 % del tiempo restante, amarillo 50–20 %, rojo < 20 % o vencido | Cliente / Laura Murillo | Alta |
| **Q4** | ¿El `ALMA-...` se genera al primer guardado (borrador) o al finalizar? ¿Un borrador consume consecutivo? | H-1.2 | Se genera al primer guardado con estado `BORRADOR` | Backend | Alta |
| **Q5** | **Caracterización sin lista de variables.** `persona` solo trae identificación y contacto (nombres, teléfono, correo, ciudad, estrato); `RF-ALMA-006` exige homologar con EA pero no hay lista (p. ej. sexo, edad, vínculo con UdeA). | H-1.2, J-1.4, F4 | Formulario con los campos de `persona`; definición de campos centralizada en un solo archivo para extenderla | Laura Murillo / equipo de EA | Alta |
| **Q6** | **Catálogos no entregados:** 15 dimensiones de salud mental, motivos de cierre (APH y Psicología), resultados de intento de contacto, vínculos con el presunto agresor, canales de ingreso. | J-0.2, H-1.7, J-1.3, J-1.4, J-1.6 | Catálogos placeholder servidos por `GET /catalogos/{nombre}` ("Dimensión 1…15"); el reemplazo es transparente | Equipo LivingLab / Laura Murillo | Media |
| **Q7** | **Notificación de recontacto ambigua:** el levantamiento dice "bandeja de Psicología" (cola compartida sin asignación) y "bandeja del psicólogo asignado". ¿A quién llega? ¿Con qué mecanismo (polling, SSE, WebSocket)? | J-1.1, J-1.7, F2 | Marca visible en la bandeja compartida + contador de notificaciones; polling cada 30 s detrás de una abstracción `useNotificaciones` intercambiable | Backend / Arquitecto | Media |
| **Q8** | **Contención puntual en un caso activo:** ¿cuenta como seguimiento? `tipo_seguimiento` solo tiene `REGULAR` y `POST_CIERRE` (este último para casos cerrados). | J-1.7 | Se registra como nota de contención **sin** incrementar el contador | Laura Murillo / Backend | Media |
| **Q9** | **Consentimiento digital:** el ER guarda booleanos, pero el esquema original tiene `archivoconsentimiento` (`bytea`). ¿Se requiere archivo, firma o solo aceptación en pantalla? ¿Quién provee el texto oficial y su versión? | H-1.4, F5 | Texto configurable + casilla de aceptación con marca de tiempo; sin archivo | Cliente / Backend | Media |
| **Q10** | **PDF:** ¿generación síncrona o asíncrona? ¿entrega como flujo o URL prefirmada (S3/MinIO)? ¿contenido: caso completo o una atención? | J-1.6 | `GET` que devuelve el archivo, con indicador de carga y tolerancia de hasta 30 s | Backend | Baja |
| **Q11** | **Reglas de intentos:** ¿"días y horarios diferentes" se valida o solo se advierte? ¿Cada intento del 4.º al 9.º exige justificación propia? | J-1.3 | Advertencia suave en el Front + validación dura en Backend; justificación obligatoria desde el 4.º | Laura Murillo / Backend | Baja |
| **Q12** | **Cierre antes del 3.er seguimiento:** el Paso 5 lo permite si la persona no desea continuar. ¿Se exige un motivo específico? | J-1.6 | Permitido, con motivo del catálogo | Laura Murillo | Baja |
| **Q13** | **Administración de maestros y acción "Eliminar" (ADMIN):** la matriz los lista, pero ningún RF los describe. | Fuera de alcance | No se construyen | Cliente | Baja |
| **Q14** | **Convención de nombres:** el ER usa `snake_case`; el JSON propuesto usa `camelCase`. | Anexo A | `camelCase` en JSON, con adaptadores en `services/*` | Backend | Media |
| **Q15** | **Gestión en simultáneo con EA:** ¿qué fuente indica actuaciones activas en EA? | J-1.8 | Campo `gestionSimultanea` en el detalle del caso; mock hasta que exista | Backend / equipo de EA | Baja |

### 12.2 Riesgos

| # | Riesgo | Mitigación |
| :--- | :--- | :--- |
| **R1** | Cambios de contrato que rompen pantallas | Contratos versionados en repo, adaptadores en `services/*`, mocks fieles al contrato |
| **R2** | Dependencia cruzada en componentes compartidos | Dueño único, Fase 0 dedicada, API estable una vez mergeado |
| **R3** | Inconsistencias del levantamiento se descubren tarde | §12.1 con prioridades y supuestos; los Q de prioridad Alta se resuelven antes del CP1 |
| **R4** | Exposición accidental de datos clínicos al Técnico APH | Contratos con DTO reducido para ese rol, pruebas negativas (H-3.2) y validación en Backend |
| **R5** | Sobrecarga de Jonathan por complejidad funcional | Revisión de carga en cada demo; tareas candidatas a reasignar: J-1.8 y J-2.1 |
| **R6** | Desfase de reloj o zona horaria en el semáforo SLA | Siempre calcular con `ahoraServidor` y `venceEn`; pruebas en J-3.1 |

---

## Anexo A — Propuesta inicial de contratos (v0)

> Borrador que el Front entrega a Backend para revisión. Rutas con prefijo `/api/alma` (omitido en las tablas). Roles: **TAPH** = Técnico APH · **PSI** = Profesional · **COORD** · **ADMIN** · **REV** = Revisor.

### A.1 Convenciones

- **JSON** en `camelCase` (ver Q14). Fechas en ISO-8601 con zona horaria (`2026-11-06T14:30:00-05:00`).
- **Listas paginadas:** `?page=0&size=20` → `{ "items": [], "page": 0, "size": 20, "total": 0 }`.
- **Error estándar:** `{ "codigo": "STRING", "mensaje": "texto", "detalles": {} }`. HTTP: 400, 401, 403, 404, **409** (conflicto), **422** (regla de negocio).
- **Concurrencia (`RNF-ALMA-001`):** los recursos mutables exponen `version`; las acciones y actualizaciones la reciben. Un 409 indica conflicto de versión o novedad ya tomada.
- **Catálogos:** `GET /catalogos/{nombre}` → `[ { "codigo": "…", "etiqueta": "…", "activo": true } ]`.

### A.2 Endpoints propuestos

**Transversales y de frontera**

| Método | Ruta | Propósito | Roles | Tarea |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/catalogos/{nombre}` | Catálogos (dimensiones, motivos de cierre, canales, resultados de intento…) | Todos | J-0.2 |
| GET | `/personas/consulta?tipoIdentificacion=&numeroIdentificacion=` | Consulta previa; devuelve **solo** el resumen de seguimiento activo para TAPH | TAPH, PSI, COORD, ADMIN | H-1.1 |
| GET | `/auditoria?tipoContexto=&idContexto=` | Historial inmutable (`RNF-ALMA-003`) | Según matriz (a confirmar) | H-3.1 |

**APH (Hinara)**

| Método | Ruta | Propósito | Roles | Tarea |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/atenciones-aph` | Crea la atención y genera `ALMA-...`; admite borrador | TAPH, COORD, ADMIN | H-1.2 |
| GET | `/atenciones-aph/{idAtencion}` | Detalle (para PSI, solo notas APH) | TAPH, PSI, COORD, ADMIN, REV | H-1.2, H-2.1 |
| PATCH | `/atenciones-aph/{idAtencion}` | Actualización parcial con `version` | TAPH, COORD, ADMIN | H-1.2 |
| PUT | `/atenciones-aph/{idAtencion}/triaje` | Triaje, u omisión con justificación | TAPH | H-1.3 |
| POST | `/atenciones-aph/{idAtencion}/derivaciones/psicologia` | **F1** — deriva con consentimiento | TAPH | H-1.4 |
| POST | `/atenciones-aph/{idAtencion}/cierre` | Cierre de la atención APH con motivo | TAPH | H-1.7 |
| POST / GET | `/derivaciones/internas` (`?tipoContexto=&idContexto=`) | Derivación interna (SPyB, EA, Dupla, Masculinidades, UAD) | TAPH, PSI | H-1.5 |
| POST / PATCH / GET | `/rutas-externas` (`/{idRuta}`) | Activación y seguimiento de rutas externas | TAPH, PSI | H-1.5 |
| GET | `/bandeja/aph` | Remisiones recibidas (EA, SPyB, UAD) | TAPH, COORD, ADMIN, REV | H-1.6 |
| POST | `/bandeja/aph/{idAtencion}/tomar` | Tomar remisión (con `version`) | TAPH | H-1.6 |
| POST | `/contenciones-post-cierre` | Registra contención sin reabrir el caso | TAPH, PSI | H-1.7 |

**Psicología (Jonathan)**

| Método | Ruta | Propósito | Roles | Tarea |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/bandeja/psicologia?triaje=&semaforo=&estado=&documento=&page=&size=` | Cola compartida con SLA | PSI, COORD, ADMIN, REV | J-1.1 |
| POST | `/bandeja/psicologia/{idAtencion}/tomar` | Tomar novedad (409 si ya fue tomada) | PSI | J-1.2 |
| POST | `/bandeja/psicologia/{idAtencion}/liberar` | Liberar novedad | PSI | J-1.2 |
| GET | `/psicologia/novedades/{idAtencion}` | Detalle de la novedad con notas APH | PSI, COORD, ADMIN, REV | J-1.2 |
| POST / GET | `/psicologia/novedades/{idAtencion}/intentos` | Registro y listado de intentos (1–9) | PSI | J-1.3 |
| POST | `/psicologia/novedades/{idAtencion}/primer-contacto` | Consolida el caso y devuelve `numeroCaso` (`CAS-...`) | PSI | J-1.4 |
| GET | `/casos/{numeroCaso}` | Expediente del caso | PSI, COORD, ADMIN, REV | J-2.1 |
| POST / GET | `/casos/{numeroCaso}/seguimientos` | Registro y listado de seguimientos | PSI | J-1.5 |
| GET | `/psicologia/agenda?desde=&hasta=` | Controles programados | PSI | J-1.5 |
| POST | `/casos/{numeroCaso}/cierre` | Cierre por motivo predefinido | PSI | J-1.6 |
| GET | `/casos/{numeroCaso}/pdf` | PDF del historial | PSI, COORD, ADMIN | J-1.6 |
| GET | `/psicologia/recontactos` | Recontactos pendientes de resolver | PSI | J-1.7 |
| POST | `/psicologia/recontactos/{idAtencion}/resolucion` | **F2** — vincular, caso nuevo o contención puntual | PSI | J-1.7 |

### A.3 Ejemplos de los contratos de frontera

**1. Derivación (F1) e ítem de bandeja con SLA (F3)** — respuesta de `POST /atenciones-aph/{id}/derivaciones/psicologia` (request: `{ "version": 2, "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "2026-11-06T09:14:00-05:00" } }`):

```json
{
  "idAtencion": "ALMA-2026-000123",
  "version": 3,
  "estado": "PENDIENTE_PSICOLOGIA",
  "triaje": "ALTO",
  "fechaDerivacion": "2026-11-06T09:15:00-05:00",
  "sla": {
    "horasLimite": 12,
    "venceEn": "2026-11-06T21:15:00-05:00",
    "ahoraServidor": "2026-11-06T09:15:01-05:00"
  }
}
```

Ítem de `GET /bandeja/psicologia`:

```json
{
  "idAtencion": "ALMA-2026-000123",
  "version": 3,
  "persona": { "tipoIdentificacion": "CC", "numeroIdentificacion": "1000000001", "nombreCompleto": "Persona de Prueba Uno" },
  "triaje": "ALTO",
  "canalIngreso": "LLAMADA",
  "estado": "PENDIENTE_PSICOLOGIA",
  "tomadaPor": null,
  "recontacto": false,
  "sla": { "horasLimite": 12, "venceEn": "2026-11-06T21:15:00-05:00", "ahoraServidor": "2026-11-06T14:30:00-05:00" }
}
```

**2. Recontacto (F2)** — respuesta de `GET /personas/consulta` para un Técnico APH (sin información clínica):

```json
{
  "existe": true,
  "persona": { "idPersona": 45, "nombres": "Persona", "apellidos": "De Prueba Dos" },
  "seguimientoActivo": {
    "activo": true,
    "proximoSeguimiento": "2026-11-09T10:00:00-05:00",
    "profesional": "Nombre del profesional a cargo"
  },
  "tieneCasoCerrado": false
}
```

Request de `POST /psicologia/recontactos/{idAtencion}/resolucion`:

```json
{
  "version": 1,
  "decision": "VINCULAR_A_CASO",
  "numeroCaso": "CAS-2026-000045",
  "nota": "Mismos hechos; se vincula al caso activo."
}
```

`decision` ∈ `VINCULAR_A_CASO` · `CASO_NUEVO` · `CONTENCION_PUNTUAL`.

**3. Errores estándar (F7)**

```json
{
  "codigo": "NOVEDAD_YA_TOMADA",
  "mensaje": "La novedad ya fue tomada por otro profesional.",
  "detalles": { "tomadaEn": "2026-11-06T14:29:40-05:00" }
}
```

```json
{
  "codigo": "CONSENTIMIENTO_REQUERIDO",
  "mensaje": "No se puede derivar sin consentimiento informado.",
  "detalles": {}
}
```

---

## Anexo B — Personas semilla para los mocks

Datos **ficticios** para que ambos prueben con los mismos escenarios (documentos de prueba, nunca reales).

| Documento (ficticio) | Escenario | Pantallas que ejercita |
| :--- | :--- | :--- |
| `CC 1000000001` | Sin historial | H-1.1, H-1.2 |
| `CC 1000000002` | **Seguimiento activo** (próximo control en 3 días) | H-1.1 (alerta), J-1.7 |
| `CC 1000000003` | **Caso cerrado** | H-1.7 (contención post-cierre) |
| `CC 1000000004` | Varias atenciones APH sin caso (no aceptó Psicología) | H-2.1, J-2.1 |
| `CC 1000000005` | Novedad con **SLA vencido** (rojo) | J-1.1, H-1.6 |
| `CC 1000000006` | Novedad con **3 intentos** fallidos | J-1.3 |
| `CC 1000000007` | Novedad con **8 intentos** fallidos (límite del 9.º) | J-1.3 |
| `CC 1000000008` | Caso con **más de 3 seguimientos** | J-1.5 |
| `CC 1000000009` | Novedad **tomada por otro** profesional (409) | J-1.2 |
| `CC 1000000010` | Caso con **gestión simultánea** en EA | J-1.8 |

---

## Anexo C — Trazabilidad requerimiento → tarea

| Requerimiento / referencia | Tareas | Dueño(s) |
| :--- | :--- | :--- |
| `RF-ALMA-001` Identificadores únicos | J-0.1, H-1.2 (`ALMA-`), J-1.4 (`CAS-`), J-2.1 | Jonathan · Hinara |
| `RF-ALMA-002` Bandeja de remisiones | H-1.6, J-1.1 | Hinara · Jonathan |
| `RF-ALMA-003` Notificación por recontacto | H-1.1, J-1.1, J-1.7, H-2.2 | Hinara · Jonathan |
| `RF-ALMA-004` Consentimiento informado | H-1.4, J-1.4 | Hinara · Jonathan |
| `RF-ALMA-005` Guardar progreso | J-0.4, H-1.2, J-1.4 | Jonathan · Hinara |
| `RF-ALMA-006` Homologación de variables | H-1.2 (`CaracterizacionForm`), J-1.4 | Hinara · Jonathan |
| `RF-ALMA-007` PDF de atención | J-1.6 | Jonathan |
| `RF-ALMA-APH-001` Registro de atención | H-1.2, H-1.6 | Hinara |
| `RF-ALMA-APH-002` Triaje | H-1.3 | Hinara |
| `RF-ALMA-APH-003` Derivación a Psicología y rutas internas | H-1.4, H-1.5 | Hinara |
| `RF-ALMA-APH-004` Rutas externas | H-1.5 | Hinara |
| `RF-ALMA-APH-005` Contención post-cierre | H-1.7 | Hinara |
| `RF-ALMA-PSI-001` Bandeja con semáforo SLA | J-1.1, J-1.2 | Jonathan |
| `RF-ALMA-PSI-002` Intentos de contacto | J-1.3 | Jonathan |
| `RF-ALMA-PSI-003` Primer contacto y caso | J-1.4 | Jonathan |
| `RF-ALMA-PSI-004` Seguimientos | J-1.5 | Jonathan |
| `RF-ALMA-PSI-005` Cierre y PDF | J-1.6 | Jonathan |
| `RN-ALMA-01` SLA por triaje | J-0.3, J-1.1, H-1.3, H-1.6 | Jonathan · Hinara |
| `RN-ALMA-02` Voluntariedad y consentimiento | H-1.4, H-1.5, J-1.4 | Hinara · Jonathan |
| `RN-ALMA-03` Protocolo de 9 intentos | J-1.3 | Jonathan |
| `RN-ALMA-04` Autonomía de valoración de riesgo | J-1.2, J-1.4 | Jonathan |
| `RN-ALMA-05` Seguimientos flexibles | J-1.5 | Jonathan |
| `RN-ALMA-06` No autovinculación por recontacto | H-1.1, J-1.4, J-1.7 | Hinara · Jonathan |
| `RNF-ALMA-001` Bloqueo optimista | J-0.4, J-1.2, H-1.6 | Jonathan · Hinara |
| `RNF-ALMA-002` JWT/RBAC y restricción de notas clínicas | H-0.1, H-1.1, H-3.2, J-3.2 | Hinara · Jonathan |
| `RNF-ALMA-003` Auditoría | H-3.1, J-2.1 | Hinara · Jonathan |
| `RNF-ALMA-004` Correos y PDF | J-1.5, J-1.6 | Jonathan |
| §10 Remisión entrante (EA/SPyB/UAD) | H-1.6 | Hinara |
| §10 Remisión saliente y rutas | H-1.5 | Hinara |
| §10 Gestión en simultáneo con EA | J-1.8 | Jonathan |
| Brecha: denominación Línea Alma/Violeta | H-3.3 | Hinara |
| Brecha: catálogo de 15 dimensiones | J-0.2, J-1.4 | Jonathan |
| Brecha: cantidad de seguimientos | J-1.5 | Jonathan |
| Brecha: momento de creación del ID de caso | J-0.1, J-1.4 | Jonathan |
| Brecha: algoritmo de triaje externo | H-1.3 | Hinara |
