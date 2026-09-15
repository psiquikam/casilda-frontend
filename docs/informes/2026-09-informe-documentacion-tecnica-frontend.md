# INFORME DE DOCUMENTACIÓN TÉCNICA DEL SISTEMA
### Código Fuente, APIs, Configuraciones, Arquitectura y Procedimientos de Instalación

**Proyecto:** Sistema CASILDA — Capa Web de Vigilancia en Salud Pública para el Abordaje de las Discriminaciones y Violencias Basadas en Género (VBG)  
**Institución:** Universidad de Antioquia (UdeA) — Facultad Nacional de Salud Pública (FNSP)  
**Líder Técnico y SCRUM Master:** Profesor Juan David Correa (FNSP UdeA)  
**Responsable Técnica Front-End:** Hinara Pastora Sánchez Mata  
**Período:** 15 de agosto de 2026 – 15 de septiembre de 2026  
**Repositorio Oficial:** `psiquikam/casilda-frontend`  
**Tecnologías Base:** Angular 21.2.x, Angular Material 21, TypeScript 5.9, RxJS 7.8, Node.js 24.18.0  

---

## 1. Objetivo y Alcance

El presente informe consolida la actualización integral de la documentación técnica del repositorio `casilda-frontend`, garantizando la reproducibilidad del entorno de desarrollo, la comprensión arquitectónica del sistema, la configuración adecuada de entornos y el consumo estructurado de las APIs y servicios.

---

## 2. Arquitectura del Sistema Front-End

El frontend de CASILDA opera como una Single Page Application (SPA) modular construida sobre **Angular 21** con enfoque **100% Standalone** (sin `NgModule`):

```
src/app/
├── components/          ── Componentes standalone de interfaz
│   ├── dashboard-home/  ── Inicio operativo para orientadores y revisores
│   ├── dashboard-revisor/ ── Módulo analítico de visualización de métricas
│   ├── formulario-anonimo/ ── Stepper reactivo de reporte anónimo VBG
│   ├── layout/          ── Encabezados y navegación dual (horizontal y sidebar)
│   ├── login/           ── Acceso seguro institucional UdeA
│   └── quick-exit/      ── Componente global de salida rápida de emergencia
├── services/            ── Servicios de integración y lógica reactiva
│   ├── navigation-layout.service.ts ── Sincronización de menús y layout
│   ├── contenido-home.service.ts    ── Consumo de contenidos administrables
│   └── auth.service.ts              ── Sesión JWT e interceptores
├── core/                ── Núcleo técnico de accesibilidad y seguridad
│   ├── a11y/            ── Estrategia de títulos, diálogos y notificaciones
│   └── security/        ── Purgado seguro de sesión en memoria
├── environments/        ── Parametrización por entorno (dev / prod)
└── styles/              ── Tokens de diseño institucional UdeA (_tokens.scss)
```

### Características Arquitectónicas Clave:
* **Navegación Dual Coordinada:** Implementación de acceso rápido mediante menú superior horizontal (`HorizontalNavComponent`) complementado con un menú lateral colapsable (`SidebarComponent`), sincronizados a través del servicio `NavigationLayoutService`.
* **Detección de Cambios Optimizada:** Uso de `ChangeDetectionStrategy.OnPush` e inyección moderna mediante `inject()`.
* **Control de Flujo Moderno:** Uso de la sintaxis `@if` y `@for` en todas las plantillas HTML nuevas.

---

## 3. Configuraciones de Entorno y Compilación

### 3.1. Parámetros de Entorno (`environments`)
Las URLs base y las variables de negocio se parametrizan en `src/environments/`:

```typescript
// src/environments/environment.ts (Desarrollo local)
export const environment = {
  production: false,
  apiBaseUrl: 'http://35.208.251.66:8080/api-casilda',
  quickExitUrl: 'https://www.google.com',
  telefonoOrientacion: '018000 123 456'
};
```

### 3.2. Presupuestos de Compilación (`angular.json`)
Se actualizaron los límites de tamaño para hojas de estilo en `angular.json`, permitiendo la incorporación de los estilos extensos del Dashboard Home y Revisor sin advertencias bloqueantes de compilación:

```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "1.5mb",
    "maximumError": "2mb"
  },
  {
    "type": "anyComponentStyle",
    "maximumWarning": "100kb",
    "maximumError": "120kb"
  }
]
```

### 3.3. Tokens de Diseño Institucional (`src/styles/_tokens.scss`)
Se formalizó la paleta complementaria oficial de la Universidad de Antioquia (Manual de Identidad pág. 20):
* `--udea-pantone-7650`: `#70205b` (Morado / Magenta profundo).
* `--udea-pantone-633`: `#137598` (Azul petróleo).
* `--udea-pantone-032`: `#ef434d` (Rojo carmesí brillante).
* `--udea-pantone-137`: `#f9a12c` (Ámbar dorado / Naranja).

---

## 4. Documentación de APIs y Servicios

| Servicio | Archivo Fuente | Función Principal y Contratos de Datos |
|---|---|---|
| **`NavigationLayoutService`** | `src/app/services/navigation-layout.service.ts` | Administra reactivamente la visibilidad del menú lateral (`sidebarOpen$`) y la coordinación con el menú horizontal mediante métodos `toggleSidebar()`, `openSidebar()` y `closeSidebar()`. |
| **`AuthService` & Interceptor** | `src/app/services/auth.service.ts`<br>`auth.interceptor.ts` | Inyección automática del header `Authorization: Bearer <token>`, validación de expiración de sesión y discriminación de respuestas `401 Unauthorized` y `403 Forbidden`. |
| **`ContenidoHomeService`** | `src/app/services/contenido-home.service.ts` | Obtención de contenidos dinámicos del home (`GET /contenidos/home`) con filtrado por vigencia y sección (`ContenidoDestacadoDto`). |
| **`QuickExitService`** | `src/app/core/security/quick-exit.service.ts` | Purgado atómico de `sessionStorage`, llaves `casilda_*` y redirección inmediata mediante `window.location.replace()`. |

---

## 5. Procedimientos de Instalación, Arranque y Verificación

### 5.1. Requisitos Previos
* **Node.js:** Versión `24.18.0` (fijada en `.nvmrc`).
* **npm:** Versión `11.16.0` (fijada en `package.json`).
* **Git:** Cliente Git con acceso al repositorio oficial `psiquikam/casilda-frontend`.

### 5.2. Instalación Paso a Paso

```powershell
# 1. Clonar el repositorio
git clone https://github.com/psiquikam/casilda-frontend.git
cd casilda-frontend

# 2. Instalación limpia y exacta de dependencias
npm ci

# 3. Iniciar el servidor local de desarrollo
npm start
```
> La aplicación estará disponible en `http://localhost:4200/` con recarga en vivo ante cambios.

### 5.3. Comandos de Verificación y Compilación

| Comando | Acción Ejecutada | Criterio de Éxito |
|---|---|---|
| `npm run lint` | Ejecuta el análisis estático de código con Angular ESLint. | 0 errores. |
| `npm run test:ci` | Ejecuta la suite de pruebas unitarias headless con Karma/Jasmine. | 131 pruebas en verde. |
| `npm run build` | Genera el paquete optimizado de producción en `dist/casilda-fnsp`. | Compilación exitosa sin exceder presupuestos. |
| `npm run audit:prod` | Audita las dependencias instaladas para producción. | 0 vulnerabilidades. |

---

## 6. Mantenimiento y Control de Versiones

Toda la documentación técnica se encuentra sincronizada con el código fuente en:
* [`README.md`](file:///d:/Documentos/GitHub/casilda-frontend/README.md): Instrucciones generales de arranque, stack y scripts.
* [`CLAUDE.md`](file:///d:/Documentos/GitHub/casilda-frontend/CLAUDE.md): Bitácora técnica viva, convenciones obligatorias y sistema de diseño.
* Carpeta `docs/informes/`: Informes mensuales consolidados de avance, pruebas y documentación técnica.
