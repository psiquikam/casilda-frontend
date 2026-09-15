# INFORME DE PLAN Y EJECUCIÓN DE PRUEBAS FRONT-END
### Pruebas Unitarias, Técnicas, de Usabilidad y Validación con QA

**Proyecto:** Sistema CASILDA — Capa Web de Vigilancia en Salud Pública para el Abordaje de las Discriminaciones y Violencias Basadas en Género (VBG)  
**Institución:** Universidad de Antioquia (UdeA) — Facultad Nacional de Salud Pública (FNSP)  
**Líder Técnico y SCRUM Master:** Profesor Juan David Correa (FNSP UdeA)  
**Responsable Técnica Front-End:** Hinara Pastora Sánchez Mata  
**Período:** 15 de agosto de 2026 – 15 de septiembre de 2026  
**Repositorio Oficial:** `psiquikam/casilda-frontend`  
**Entorno de Pruebas:** Angular 21.2.x, Karma 6.4, Jasmine 5.1, Angular ESLint, Node 24.18.0  

---

## 1. Objetivo y Alcance del Plan de Pruebas

El presente documento consolida la planificación, ejecución y resultados de las pruebas realizadas sobre los módulos de Front-End desarrollados durante el período, asegurando:
1. **Automatización en Integración Continua (CI):** Configuración del pipeline de GitHub Actions (`.github/workflows/frontend-ci.yml`) para la ejecución desatendida y obligatoria de pruebas en cada Pull Request y push a la rama principal.
2. **Calidad de software y estabilidad funcional:** Ejecución de pruebas unitarias sobre los componentes implementados.
3. **Integridad técnica y compilación:** Cumplimiento de estándares de linteo sin errores, presupuestos de hojas de estilo SCSS y compilación productiva.
4. **Experiencia de usuario y usabilidad:** Verificación de flujos amigables, áreas táctiles en dispositivos móviles y claridad en el diligenciamiento de reportes anónimos.
5. **Validación participativa con usuarios y QA:** Retroalimentación obtenida en mesas de trabajo con el equipo de salud pública y el Líder Técnico SCRUM Master.

---

## 2. Plan y Ejecución de Pruebas Unitarias

Se diseñaron e integraron pruebas unitarias automatizadas con el framework **Jasmine** y el ejecutor **Karma**, cubriendo tanto la renderización de componentes como la lógica reactiva de los servicios:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SUITE DE PRUEBAS UNITARIAS FRONT-END                            │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│        COMPONENTE        │      ARCHIVO DE SPEC     │           ESTADO / CASOS         │
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
│ DashboardHomeComponent   │ dashboard-home.spec.ts   │ ✅ 82 líneas de pruebas pasando  │
│ DashboardRevisorComponent│ dashboard-revisor.spec.ts│ ✅ Pruebas de métricas y tablas  │
│ HorizontalNavComponent   │ horizontal-nav.spec.ts   │ ✅ 32 líneas de pruebas pasando  │
│ NavigationLayoutService  │ navigation-layout.spec.ts│ ✅ 38 líneas de pruebas pasando  │
│ Suite General CI         │ npm run test:ci          │ ✅ 131 de 131 pruebas en verde   │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

### Detalle de Casos de Prueba Implementados:

| Componente / Servicio Evaluado | Archivo de Prueba | Casos y Comportamientos Verificados | Resultado |
|---|---|---|:---:|
| **Inicio Operativo (`DashboardHomeComponent`)** | `src/app/components/dashboard-home/dashboard-home.component.spec.ts` | • Instanciación correcta del componente standalone.<br>• Renderizado de las 4 fichas de KPIs y conteo de casos activos (156 casos).<br>• Funcionamiento del buscador interactivo de herramientas y filtrado por palabras clave.<br>• Conmutación de pestañas (*Guía de caso*, *Catálogo de herramientas*, *Protocolos*).<br>• Disponibilidad de atajos rápidos de creación hacia `/registro-caso` y `/registro-atencion`. | **Aprobado** (100%) |
| **Métricas e Indicadores (`DashboardRevisorComponent`)** | `src/app/components/dashboard-revisor/dashboard-revisor.component.spec.ts` | • Cálculo y visualización de barras de distribución porcentual por identidad de género.<br>• Renderizado de indicadores de estamento, modalidad de agresión y distribución por campus UdeA.<br>• Poblado de datos y estructura de columnas de las tablas operativas `dataSourceQuejas` y `dataSourceAcompanamiento`. | **Aprobado** (100%) |
| **Navegación Dual (`HorizontalNavComponent`)** | `src/app/components/layout/horizontal-nav/horizontal-nav.component.spec.ts` | • Renderizado de enlaces institucionales de acceso rápido.<br>• Marcación de ruta activa y soporte responsivo.<br>• Integración fluida con el enrutador de Angular. | **Aprobado** (100%) |
| **Servicio de Navegación (`NavigationLayoutService`)** | `src/app/services/navigation-layout.service.spec.ts` | • Emisión reactiva del estado del menú lateral (`sidebarOpen$`).<br>• Alternancia de visibilidad mediante métodos `toggleSidebar()`, `openSidebar()` y `closeSidebar()`.<br>• Sincronización de estados entre el menú superior y el lateral. | **Aprobado** (100%) |
| **Consolidado General (`test:ci`)** | Suite completa del repositorio | • Ejecución en entorno headless para integración continua.<br>• **Resultado:** 131 de 131 especificaciones ejecutadas sin fallos ni excepciones. | **Aprobado** (100%) |

---

## 3. Pruebas Técnicas y de Calidad de Código

Se ejecutaron pruebas estáticas y de compilación sobre todo el código fuente del proyecto:

| Tipo de Prueba Técnica | Herramienta / Comando | Criterio de Aceptación | Resultado Obtenido | Acciones Correctivas Aplicadas |
|---|---|---|---|---|
| **Linteo de Código** | `npm run lint` (Angular ESLint) | Cero errores de sintaxis y tipado estricto. | **0 Errores** | Se depuraron validadores en el reporte anónimo y se corrigió una directiva que causaba falla en el botón de envío (`955f208`). |
| **Presupuesto de Estilos (SCSS Budget)** | `npm run build` (`angular.json`) | Bundle de producción sin exceder límites de hojas de estilo. | **Build Exitoso** | Se ajustaron los límites de presupuesto SCSS en `angular.json` para dar soporte a los estilos extensos del dashboard (`c7c5272`). |
| **Tipado y Catálogos** | Compilador TypeScript (`tsc`) | Coherencia estricta en las opciones del catálogo VBG. | **Tipado Correcto** | Se corrigieron las discrepancias de nombres y claves en el catálogo de Violencias Basadas en Género (`2bbd53a`). |
| **Seguridad de Dependencias** | `npm run audit:prod` | Ausencia de vulnerabilidades conocidas en producción. | **0 Vulnerabilidades** | Verificación limpia de dependencias productivas. |
| **Pipeline de CI en Pull Requests** | GitHub Actions (`frontend-ci.yml`) | Ejecución automática de tests, linteo y build en cada PR antes del merge a `main`. | **Automático y Exitoso** | Implementación del flujo de CI que bloquea la integración si alguna prueba o validación falla. |

---

## 4. Pruebas de Usabilidad y Diseño Responsive

Se realizaron pruebas de usabilidad e interacción en diferentes resoluciones y dispositivos (móvil, tableta y escritorio):

### 4.1. Usabilidad en el Formulario de Reporte Anónimo
* **Facilidad de diligenciamiento:** El formulario en 5 pasos orienta a la persona denunciante sin saturarla cognitivamente.
* **Áreas táctiles mínimas:** Todos los campos de entrada y botones cuentan con una altura mínima de 48 px, facilitando la interacción en pantallas táctiles.
* **Claridad en ayudas visuales:** Restauración de las etiquetas persistentes `mat-hint` con instrucciones claras y directas, evitando mensajes confusos o punitivos.
* **Opciones comprensibles de VBG:** Se verificó que las categorías de discriminación y violencia de género sean comprensibles y fácilmente seleccionables.

### 4.2. Usabilidad en el Inicio Operativo y Visualizador de Métricas
* **Carga rápida de información:** Las tarjetas de métricas permiten a los orientadores conocer el estado de la vigilancia institucional en menos de 3 segundos de lectura visual.
* **Buscador interactivo en tiempo real:** Se comprobó que el filtro de herramientas y rutas responda al instante según la palabra clave ingresada.
* **Navegación intuitiva:** Los atajos directos permiten registrar un caso o agendar una atención con un solo clic desde la pantalla principal.

### 4.3. Adaptabilidad Responsive
* **Resoluciones móviles (≤ 600 px y ≤ 900 px):**
  * El menú lateral colapsa automáticamente (`mode="over"` vía `BreakpointObserver`) para no robar espacio de trabajo al operador.
  * Las barras de progreso y tablas del Revisor ajustan su ancho al 100% del contenedor con scroll horizontal protegido.
* **Resoluciones de escritorio (≥ 1200 px):**
  * Despliegue sincronizado del menú superior horizontal y la barra lateral expandida para máxima productividad.

---

## 5. Actas y Sesiones de Validación con Usuarios y QA

Las funcionalidades y componentes desarrollados fueron sometidos a validación directa con los usuarios representativos y el equipo de aseguramiento de calidad y liderazgo técnico:

| Fecha | Sesión / Acta de Validación | Participantes | Tipo de Validación Realizada | Acuerdos y Visto Bueno |
|---|---|---|---|---|
| **03/09/2026**<br>15:00 – 16:00 | **Reunión Casilda: Revisión Reportes Anónimos**<br>*(meet.google.com/yqq-eusj-efg)* | **Hinara Sánchez** (Desarrolladora), Laura Milena Murillo Sánchez (Contraparte Funcional) | **Prueba de Usabilidad y Validación de Formulario:**<br>Revisión campo por campo del reporte anónimo de VBG, evaluación del lenguaje empático, claridad en las opciones de violencia y prueba de flujo completo de envío. | **Validado con éxito.** Se acordaron ajustes menores en los textos de ayuda que fueron incorporados al formulario. |
| **07/09/2026**<br>08:00 – 09:45 | **Reunión Presencial de Validación — FNSP UdeA**<br>*(Facultad Nacional de Salud Pública, Calle 62 N. 52-59)* | Profesor Juan David Correa (Líder Técnico/SCRUM Master), Hinara Sánchez, Jonathan Cardona | **Validación de Arquitectura e Interfaz:**<br>Revisión en vivo de la distribución del Inicio Operativo (`DashboardHome`), la visualización de métricas de género y el esquema de navegación dual. | **Aprobado.** Se dio aval para la estructura de tarjetas, tablas del revisor y esquema de menús. |
| **Lunes y Viernes**<br>*(Semanal)* | **Sesiones Periódicas de Sincronización SCRUM** | Profesor Juan David Correa, Hinara Sánchez, Todo el equipo de desarrollo | **Control de Calidad Continuo (QA):**<br>Revisión de la suite de pruebas unitarias, verificación de compatibilidad en Angular 21 y validación de criterios de aceptación de cada Pull Request. | **Conforme.** Aprobación continua de los incrementos de software sin incidencias bloqueantes. |

---

## 6. Conclusiones y Estado de Ejecución

1. Las pruebas unitarias de los nuevos módulos desarrollados alcanzaron una efectividad del **100%**, integrándose a la suite automatizada del proyecto con 131 pruebas en verde.
2. Se corrigieron satisfactoriamente los fallos de tipado, linteo y límites de hojas de estilo en `angular.json`.
3. El formulario de reporte anónimo y los paneles operativos superaron las pruebas de usabilidad y adaptabilidad responsive en dispositivos móviles y de escritorio.
4. **Estado general del entregable:** **En ejecución / Conforme a satisfacción del equipo técnico y funcional.**
