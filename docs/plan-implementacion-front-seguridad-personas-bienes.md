# Plan de Implementación Front-end — Módulo Seguridad a Personas y Bienes (SPyB)

| | |
| :--- | :--- |
| **Módulo** | Seguridad a Personas y Bienes (SPyB) — Proyecto CASILDA (Universidad de Antioquia) |
| **Capa** | Front-end (Angular 21 standalone components, Signals, Material 3, Reactive Forms) |
| **Rama** | `feature/07/020/casilda/seguridad-personas-y-bienes` |
| **Fuente de Requisitos** | `docs/Requisitos funcionales_SEG_PyB-ago2026 (1).docx` (RF-SPB-001 al 148) |
| **Contrato Backend de Referencia** | `docs/contratos/seguridad-personas-bienes/diseno-tecnico-y-contratos-backend-spyb.md` |
| **Fecha** | 13 de noviembre de 2026 |
| **Estado** | **Propuesta de Arquitectura y Plan de Ejecución v1.0** |

---

## 1. Resumen Ejecutivo y Principios de Diseño

1. **Estrategia Contract-First con Mocks Autónomos:**  
   Al igual que en Línea ALMA, el frontend construye sus componentes, estados y navegación contra un servicio mock (`SpybMockService`) que implementa con fidelidad absoluta los contratos de API acordados con backend. Esto permite desarrollar y probar toda la UX/UI de inmediato sin bloqueos de despliegue.
2. **Arquitectura Angular 21 Moderna:**  
   * Standalone components (`imports: [...]`).
   * Angular Signals (`signal()`, `computed()`) para reactividad de interfaz y estados de bandeja.
   * Angular Material 3 / CDK (`mat-table`, `mat-tabs`, `mat-dialog`, `mat-stepper`, etc.).
   * Formularios fuertemente tipados con `NonNullableFormBuilder` / `ReactiveFormsModule`.
3. **Control de Acceso y Vistas por Perfil (RBAC en UI):**  
   * **Central de Monitoreo:** recepción rápida de llamadas/turnos y consulta inmediata de medidas de protección vigentes por cédula.
   * **Supervisor / Vigilante (Acceso Restringido):** formulario sin menú institucional ni consulta de expedientes confidenciales (acceso limpio vía `/seguridad/reportar` o `/seguridad/orden/:token`).
   * **Analista de Riesgos (Yeison):** consola operativa integral con bandeja multidimensional por estados y pestañas.
4. **Reglas de Negocio en Frontend:**  
   * El consecutivo `SPB-YYYY-XXXXX` se muestra en badges destacados.
   * La vinculación a casos CASILDA siempre es asistida: el front lista sugerencias al digitar la cédula pero exige confirmación manual del analista con justificación obligatoria.

---

## 2. Estructura de Archivos Propuesta en Frontend

Ubicación: `src/app/features/seguridad-personas-bienes/`

```text
src/app/features/seguridad-personas-bienes/
├── models/
│   ├── spyb-models.ts             # Entidades de dominio (Actuacion, Orden, Evidencia, Remision)
│   ├── spyb-dtos.ts               # DTOs de petición y respuesta REST
│   └── spyb-catalogos.ts          # Tipos y catálogos maestros
├── services/
│   ├── spyb-api.service.ts        # Cliente HTTP que consume /api/v1/seguridad/*
│   ├── spyb-mock.service.ts       # Mock con datos semilla en memoria para desarrollo autónomo
│   └── spyb-state.service.ts      # Signals con estado de la bandeja y filtros activos
├── pages/
│   ├── central-monitoreo/
│   │   ├── consulta-medidas/      # Búsqueda por documento y visualización de medidas activas
│   │   └── registrar-llamada/     # Registro de solicitudes telefónicas (219-64-19) y presenciales
│   ├── vigilancia/
│   │   ├── reporte-novedad/       # Formulario simplificado para supervisores (con cédula)
│   │   └── ejecutar-orden/        # Vista restringida para diligenciar informe de acompañamiento vía token/QR
│   └── analista-riesgos/
│       ├── bandeja-central/       # Bandeja con tabs (Nuevos, Revisión, Vinculación, Acompañamientos, etc.)
│       ├── detalle-actuacion/     # Vista completa con trazabilidad histórica y auditoría
│       ├── modal-vincular-caso/   # Diálogo con sugerencias por cédula y justificación
│       ├── gestion-medidas/       # Solicitudes de medidas del EA y emisión de órdenes
│       ├── gestion-camaras/       # Solicitud y registro de custodia de grabaciones
│       ├── remisiones-uad/        # Remisiones a UAD y registro de citaciones a testigos
│       └── indicadores/           # Dashboard estadístico (persona ≠ caso ≠ actuación)
└── seguridad-personas-bienes.routes.ts # Rutas lazy-loaded con guards por rol
```

---

## 3. Plan de Fases de Implementación

### Fase 1: Cimientos, Tipado, Contratos y Mock (1-2 días)
- [ ] Definición de modelos (`spyb-models.ts`, `spyb-dtos.ts`, `spyb-catalogos.ts`).
- [ ] Implementación de `SpybMockService` con almacén en `localStorage`/memoria y datos de prueba realistas (PQRS, novedades, órdenes y medidas).
- [ ] Enrutamiento principal (`seguridad-personas-bienes.routes.ts`) e integración al menú lateral según rol.

### Fase 2: Central de Monitoreo y Reporte Ágil de Supervisores (2 días)
- [ ] Pantalla `consulta-medidas`: digitación de cédula y tarjeta con medidas activas y vigencia.
- [ ] Formulario de recepción `registrar-llamada` (Línea 219-64-19, correo, presencial) con consentimiento informado.
- [ ] Formulario ágil `reporte-novedad` para supervisores (identificación por cédula, sin expedientes confidenciales).

### Fase 3: Bandeja Central del Analista de Riesgos y Vinculación (3 días)
- [ ] Componente `bandeja-central`: tabs con conteos reactivos (`signal`), filtros por sede/fecha y tabla paginada.
- [ ] Detalle de actuación con visualizador de trazabilidad cronológica.
- [ ] Flujo de revisión: aprobación o solicitud de subsanación a vigilancia.
- [ ] `modal-vincular-caso`: sugerencia de casos existentes por documento y registro obligatorio de justificación.
- [ ] Acción de cierre como «Actuación Independiente».

### Fase 4: Órdenes de Acompañamiento, Ejecución y Cámaras (2 días)
- [ ] Recepción de medidas de protección solicitadas por Equipo de Atención y emisión de Órdenes.
- [ ] Generación de enlace/código QR con token de acceso seguro para supervisores.
- [ ] Pantalla `ejecutar-orden`: formulario de ejecución (identificación de agresor, incidentes de riesgo y novedades).
- [ ] Registro de solicitud de cámaras y seguimiento de custodia de evidencia audiovisual.

### Fase 5: Remisiones (UAD, EA, ALMA), Indicadores y QA (2 días)
- [ ] Modales de remisión a Equipo de Atención, Línea ALMA y UAD.
- [ ] Registro de consecutivo de recibido UAD, radicado disciplinario y requerimiento de citación de testigos.
- [ ] Pantalla de indicadores estadísticos (desacoplando personas, casos y actuaciones).
- [ ] Pruebas unitarias con Jasmine/Karma (cobertura ≥ 80 % en servicios y lógica de formulario).

---

## 4. Definición de Hecho (Definition of Done - DoD)
* Código TypeScript en modo estricto sin `any` injustificado.
* Standalone components limpios y responsivos.
* Compatibilidad total con la paleta y diseño institucional de CASILDA (UdeA).
* Mocks intercambiables por servicios HTTP mediante un único flag de configuración sin tocar componentes.
* 0 warnings críticos en consola.

