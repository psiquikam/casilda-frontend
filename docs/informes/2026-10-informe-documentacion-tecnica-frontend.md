# INFORME DE DOCUMENTACIÓN TÉCNICA FRONT-END

**Proyecto:** Sistema CASILDA  
**Responsable de las actividades documentadas:** **Hinara Pastora Sánchez Mata**  
**Período:** **1 al 30 de octubre de 2026**  
**Repositorio:** `psiquikam/casilda-frontend`  
**Stack verificado:** Angular 21.2.25, Angular Material 21.2.14, TypeScript 5.9.3, RxJS 7.8 y Node.js 24.18.0  

---

## 1. Objetivo y alcance

Este informe documenta exclusivamente los cambios técnicos realizados por Hinara durante octubre de 2026. Incluye componentes, servicios, contratos, configuración, dependencias, pruebas y procedimientos de verificación intervenidos directamente por ella.

Las funcionalidades desarrolladas exclusivamente por otros integrantes no se presentan como autoría de Hinara. El merge del PR #20 se registra únicamente como actividad de integración.

---

## 2. Arquitectura intervenida

Los cambios conservaron la arquitectura Angular existente: componentes standalone, Angular Material, formularios reactivos, servicios con `HttpClient`, RxJS y configuración centralizada de ambientes.

```text
src/app/
├── components/
│   ├── formulario-acompanamiento/   Captura de solicitudes
│   ├── consulta/                     Bandeja de reparto
│   ├── gestion-contacto/             Bandeja del equipo de atención
│   ├── modal-detalle-solicitud/      Detalle de solicitud
│   ├── modal-reparto/                Asignación y reparto
│   ├── modal-correo/                  Registro de contacto por correo
│   ├── modal-telefono/                Registro de contacto telefónico
│   ├── registro-caso/                 Ajustes VBG
│   └── registro-atencion/             Ajustes VBG
├── services/
│   ├── solicitud.service.ts
│   ├── asignaciones.service.ts
│   ├── registro-vbg-datos.service.ts
│   ├── auth.service.ts
│   └── auth.interceptor.ts
└── app.routes.ts
```

---

## 3. Formulario de acompañamiento y reparto

El commit `ac3b008` concentró el principal cambio funcional del período.

### Formulario

- reorganización de la captura de información de la persona solicitante;
- manejo de remitente institucional;
- relato obligatorio y datos relacionados con los hechos;
- datos opcionales de la presunta persona agresora;
- teléfonos y correos de contacto;
- carga y representación de evidencias;
- ajustes responsive y de accesibilidad visual;
- actualización de validaciones y pruebas.

### Bandeja de reparto

- tabla paginada en `ConsultaComponent`;
- filtros y estados de solicitudes;
- modal de detalle ampliado;
- modal de reparto y asignación;
- modales de contacto por correo y teléfono;
- integración con `SolicitudService`;
- actualización del paginador y navegación.

### Configuración asociada

- `proxy.conf.js` y `proxy.conf.json` para consumo local de API;
- ajustes de presupuesto en `angular.json`;
- uso de `environment.apiBaseUrl`;
- estilos globales y configuración de entorno.

---

## 4. Bandeja de contacto y servicios de atención

Los commits `8195178` y `8824153` consolidaron el trabajo de contacto del equipo de atención.

### Cambios de interfaz

- reemplazo de la vista separada “Mis asignaciones” por `GestionContactoComponent`;
- adaptación de tabla, filtros y acciones;
- actualización del menú horizontal, lateral y catálogo de navegación;
- ajuste de `ModalGestionContactoComponent`;
- correcciones responsive y terminológicas en pantallas relacionadas.

### Servicios

| Servicio | Intervención de Hinara |
|---|---|
| `AsignacionesService` | Creación del servicio para consultar y normalizar asignaciones. |
| `RegistroVbgDatosService` | Ampliación de datos disponibles para atención y pruebas asociadas. |
| `SolicitudService` | Ajustes para reparto y gestión de contacto. |
| `CasosSimuladosService` | Alineación de datos de demostración con el nuevo flujo. |
| `AuthService` | Ajustes de sesión y comportamiento requerido por el flujo. |
| `authInterceptor` | Correcciones de manejo de autenticación y pruebas. |

Al cierre del 30 de octubre, estos cambios permanecían en la rama `feature/05/014/casilda/correcciones-equipo-atencion`.

---

## 5. Formularios VBG y lenguaje institucional

### Correcciones funcionales

El commit `5d8165d` ajustó:

- nombres y apellidos del registro;
- campo de ámbito en formularios VBG;
- formulario anónimo y formulario de queja;
- registro de caso y registro de atención;
- pruebas unitarias y errores lint relacionados.

### Voz institucional

El commit `7e77dd6` normalizó la interfaz a tercera persona e impersonal en 43 archivos. Se modificaron etiquetas y mensajes, sin cambiar reglas de negocio, DTO ni contratos HTTP.

---

## 6. Seguridad, dependencias e integración continua

### Actualización de seguridad

Hinara actualizó los paquetes Angular a 21.2.25 mediante el commit `a24b9a8`, atendiendo la vulnerabilidad `GHSA-ff3f-86qr-9cv3`.

### Reproducibilidad de instalación

El commit `73824e7` sincronizó `package-lock.json` con dependencias `emnapi`, corrigiendo el fallo de `npm ci` en el runner.

### Verificación disponible

```powershell
npm ci
npm run lint
npm run a11y:audit
npm run test:ci
npm run build
npm run audit:prod
```

---

## 7. Contrato técnico creado

### `CONTRATO_SOLICITUDES_Y_REPARTO.md`

Hinara creó y versionó este documento dentro del commit `ac3b008`. El contrato especifica:

- alcance del formulario de acompañamiento;
- estructura esperada de solicitudes y respuestas;
- estados de reparto;
- consulta paginada;
- detalle y asignación;
- datos de contacto;
- hechos, presunta persona agresora y evidencias;
- restricciones sobre persistencia local;
- puntos que requieren coordinación con backend.

---

## 8. Trazabilidad técnica

| Commit | Alcance técnico |
|---|---|
| `5d8165d` | Formularios, ámbito VBG, nombres/apellidos y pruebas. |
| `a24b9a8` | Actualización segura de Angular 21.2.25. |
| `73824e7` | Estabilización de `npm ci`. |
| `7e77dd6` | Voz institucional en tercera persona e impersonal. |
| `ac3b008` | Solicitudes, reparto, modales, servicios, proxy y contrato. |
| `8195178` | Bandeja de contacto y consolidación de “Mis asignaciones”. |
| `8824153` | Correcciones transversales y servicios del equipo de atención. |
| `9a99100` | Integración del PR #20; no se presenta como autoría funcional. |
| `51980da` | Sincronización de `main` en la rama de trabajo. |

---

## 9. Resultado de verificación

Resultados de la rama con los cambios de Hinara al 30 de octubre:

| Control | Resultado |
|---|---|
| Suite completa | 370/370 pruebas aprobadas. |
| Build | Exitoso. |
| ESLint | 0 errores y 267 advertencias. |
| Accesibilidad P0 | 0 hallazgos bloqueantes. |
| Auditoría de producción | 0 vulnerabilidades. |

Estas cifras validan el estado del repositorio completo; no se atribuye a Hinara la autoría de la totalidad de la suite.

---

## 10. Pendientes

1. Integrar a `main` la bandeja de contacto y las correcciones del equipo de atención.
2. Reducir las advertencias ESLint y deuda no bloqueante de estilos.
3. Mantener sincronizados los DTO del frontend con los contratos reales del backend.
4. Adjuntar evidencias externas de despliegue, actas y validaciones humanas cuando correspondan.

---

## 11. Conclusión

La documentación técnica de octubre acredita el trabajo directo de Hinara en formularios VBG, seguridad de dependencias, CI, lenguaje institucional, solicitudes, reparto y contacto. Los cambios respetaron la arquitectura standalone del proyecto y quedaron respaldados por contrato técnico, pruebas actualizadas y controles de calidad ejecutados satisfactoriamente.

