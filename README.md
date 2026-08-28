# CASILDA — Frontend (casilda-fnsp)

![Angular](https://img.shields.io/badge/Angular-21.2-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Angular Material](https://img.shields.io/badge/Angular%20Material-21.2-757575?logo=angularmaterial&logoColor=white)
![Node](https://img.shields.io/badge/Node-%5E20.19%20%7C%20%5E22.12%20%7C%20%3E%3D24-339933?logo=node.js&logoColor=white)

Frontend web de **CASILDA**, el sistema de vigilancia en salud pública para el abordaje de las violencias y discriminaciones basadas en género de la **Universidad de Antioquia**. Gestiona el flujo completo de atención: solicitud, contacto telefónico, cita, caso, atención y de seguimiento para quejas y solicitudes de acompañamiento psicosocial y jurídico, incluida la Línea ALMA de primer respondiente.

## Tabla de contenido

- [Acerca del proyecto](#acerca-del-proyecto)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación y arranque rápido](#instalación-y-arranque-rápido)
- [Configuración de entorno](#configuración-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Rutas y control de acceso](#rutas-y-control-de-acceso)
- [Convenciones de desarrollo](#convenciones-de-desarrollo)
- [Pruebas](#pruebas)
- [Build y despliegue](#build-y-despliegue)
- [Documentación adicional](#documentación-adicional)

## Acerca del proyecto

La aplicación está construida **100% con componentes standalone de Angular** (sin `NgModule`), consumiendo una API REST propia (`environment.apiBaseUrl`) y usando Angular Material como sistema de UI. Contiene tres grandes áreas funcionales:

- **Público**: home, seguimiento de trámite, formulario de queja y solicitud de acompañamiento.
- **Back-office**: dashboard del revisor, gestión de contacto, casos, citas, atenciones y asignaciones, con control de acceso por rol.
- **Administración**: gestión de usuarios y de listas/catálogos maestros.

Los roles disponibles son `Admin`, `Revisor` y `Usuario`, aplicados mediante guards (`authGuard`, `roleGuard`) sobre las rutas.

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework | Angular (standalone, sin NgModule) | 21.2.x |
| UI | Angular Material + CDK | 21.2.x |
| Formularios | Reactive Forms (`FormBuilder`, `Validators`) | — |
| Reactividad | RxJS | 7.8.x |
| Alertas / confirmaciones | SweetAlert2 | 11.x |
| HTTP | `HttpClient` con interceptores funcionales (auth + loading) | — |
| Lenguaje | TypeScript (modo `strict`) | ~5.9.3 |
| Build | `@angular-devkit/build-angular:application` (esbuild) | 21.2.x |
| Tests | Karma + Jasmine | 6.4 / 5.1 |
| Runtime | Node.js | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` |
| Despliegue | Vercel (SPA con rewrites) | — |


## Requisitos previos

- **Node.js** `^20.19.0`, `^22.12.0` o `>=24.0.0` (ver `engines` en `package.json`).
- **npm** (incluido con Node).
- Acceso a la API backend de CASILDA (ver [Configuración de entorno](#configuración-de-entorno)).

## Instalación y arranque rápido

```powershell
git clone <url-del-repositorio>
cd casilda-frontend
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200/` con recarga automática ante cambios en el código fuente.

## Configuración de entorno

La URL base de la API se define en los archivos de entorno de Angular:

```typescript
// src/environments/environment.ts (desarrollo)
export const environment = {
  production: false,
  apiBaseUrl: 'http://35.208.251.66:8080/api-casilda'
};
```

```typescript
// src/environments/environment.prod.ts (producción)
export const environment = {
  production: true,
  apiBaseUrl: 'http://35.208.251.66:8080/api-casilda'
};
```

**Nunca** se deben hardcodear URLs de API en componentes o servicios: siempre se consume `environment.apiBaseUrl`.

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Levanta el servidor de desarrollo (`ng serve`) en `http://localhost:4200`. |
| `npm run build` | Genera el build de producción en `dist/casilda-fnsp`. |
| `npm run watch` | Build en modo `development` con recompilación continua. |
| `npm test` | Ejecuta la suite de pruebas unitarias con Karma/Jasmine. |

## Estructura del proyecto

```
src/
├── main.ts                 → bootstrapApplication(AppComponent, appConfig)
├── styles.scss             → tema global de Angular Material
├── environments/           → configuración por entorno (apiBaseUrl)
├── assets/                 → íconos y recursos de marca
└── app/
    ├── app.config.ts       → providers globales (router, HTTP, interceptores, DateAdapter)
    ├── app.routes.ts       → definición de rutas
    ├── app.component.*     → layout raíz (autenticado / público / login)
    ├── enums/
    ├── services/           → servicios, DTOs, guards e interceptores HTTP
    └── components/         → componentes standalone organizados por dominio
```

Cada componente vive en su propia carpeta con archivos `.component.ts`, `.html`, `.scss` (y `.spec.ts` para sus pruebas), siguiendo la convención estándar de Angular CLI.

## Rutas y control de acceso

Las rutas se definen en [`src/app/app.routes.ts`](./src/app/app.routes.ts). Resumen por área:

| Área | Ejemplos de ruta | Acceso |
|------|-------------------|--------|
| Pública | `/home`, `/login`, `/seguimiento` | Sin autenticación |
| Solicitudes | `/nueva-queja`, `/solicitud-acompanamiento` | `Admin`, `Revisor`, `Usuario` |
| Back-office | `/dashboard-revisor`, `/consulta`, `/caso`, `/cita`, `/mis-asignaciones` | `Admin`, `Revisor` |
| Línea ALMA | `/linea-alma/atencion-pr` | `Admin`, `Revisor` |
| Administración | `/gestion-usuarios`, `/gestion-sistema` | `Admin` |


## Convenciones de desarrollo

Antes de aportar código, revisa las guías del equipo:

- [`.agents/skills/angular_frontend_guidelines/SKILL.md`](./.agents/skills/angular_frontend_guidelines/SKILL.md)
- [`.github/copilot-instructions.md`](./.github/copilot-instructions.md)

Reglas esenciales:

1. Componentes **standalone**, declarando explícitamente sus `imports`.
2. **Nunca hardcodear** listas, estados o URLs — siempre consumir el backend y `environment.apiBaseUrl`.
3. Formularios con **Reactive Forms** (`FormBuilder` + `Validators`).
4. Todo `subscribe()` debe manejar **`next`** y **`error`**.
5. Interfaces/DTOs exportadas desde el mismo archivo del servicio que las usa.
6. Tablas con `MatTableDataSource` (filtrado y paginación).
7. Mostrar indicadores de carga (`cargando` / `guardando`) en operaciones asíncronas.
8. Control de flujo de plantillas con la sintaxis moderna `@if` / `@for`.

## Pruebas

```powershell
npm test
```

Ejecuta la suite de pruebas unitarias (Karma + Jasmine) sobre los archivos `*.spec.ts` del proyecto.

## Build y despliegue

```powershell
npm run build
```

El resultado se genera en `dist/casilda-fnsp`. El despliegue se realiza en **Vercel**, configurado como SPA mediante `vercel.json` (rewrites a `index.html`).

