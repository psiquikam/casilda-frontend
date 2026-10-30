# INFORME MENSUAL DE AVANCE DE DESARROLLO FRONT-END

**Proyecto:** Sistema CASILDA — Capa Web de Vigilancia en Salud Pública para el Abordaje de las Discriminaciones y Violencias Basadas en Género (VBG)  
**Entidad:** Universidad de Antioquia (UdeA) — Facultad Nacional de Salud Pública (FNSP)  
**Responsable del informe y de las actividades reportadas:** **Hinara Pastora Sánchez Mata**  
**Período:** **1 al 30 de octubre de 2026**  
**Repositorio:** `psiquikam/casilda-frontend`  
**Rama de cierre:** `feature/05/014/casilda/correcciones-equipo-atencion`  

---

## 1. Objeto del informe

Este documento consolida exclusivamente las actividades realizadas por **Hinara Pastora Sánchez Mata** entre el 1 y el 30 de octubre de 2026. La fuente de trazabilidad es el historial Git atribuido a su usuario, los archivos modificados y las verificaciones técnicas ejecutadas sobre la rama de cierre.

No se atribuyen a Hinara funcionalidades desarrolladas exclusivamente por otros integrantes. Cuando se menciona una integración de código de terceros, se identifica expresamente como actividad de merge y no como autoría del desarrollo.

---

## 2. Resumen ejecutivo

Durante octubre, Hinara concentró su trabajo en cinco frentes:

1. Corrección de campos, validaciones y pruebas de formularios de registro y atención VBG.
2. Actualización de seguridad de Angular 21 y estabilización de la instalación en CI.
3. Unificación de la voz institucional en tercera persona e impersonal.
4. Rediseño funcional y responsive del formulario de solicitudes de acompañamiento y la bandeja de reparto.
5. Conversión de “Mis asignaciones” en una bandeja de contacto para el equipo de atención, con servicios y pruebas asociados.

La trazabilidad directa comprende **7 commits de desarrollo**, con **6.329 inserciones**, **2.530 eliminaciones** y **183 intervenciones de archivo**. Adicionalmente, Hinara realizó dos integraciones: el merge del PR #20 y la sincronización de `main` en su rama de correcciones.

---

## 3. Actividades realizadas

### 3.1. Ajustes de formularios VBG, nombres, apellidos y ámbito

Se corrigieron y alinearon campos en los componentes de registro y atención:

- ajuste de nombres y apellidos en el formulario de registro;
- corrección del campo de ámbito en formularios VBG;
- actualización del formulario anónimo y del formulario de queja;
- ajustes en `RegistroCasoComponent` y `RegistroAtencionComponent`;
- corrección de errores de lint asociados;
- actualización de pruebas unitarias de los componentes afectados.

**Evidencia:** commit `5d8165d`, 15 archivos modificados, 208 inserciones y 176 eliminaciones.

### 3.2. Seguridad de Angular y estabilización del pipeline

Se actualizó el ecosistema Angular a la versión 21.2.25 para atender la vulnerabilidad `GHSA-ff3f-86qr-9cv3`. Posteriormente se sincronizó `package-lock.json` con las dependencias nativas `emnapi`, solucionando el fallo de `npm ci` en el runner de integración continua.

**Evidencias:** commits `a24b9a8` y `73824e7`.

### 3.3. Unificación de voz institucional

Se revisaron textos, mensajes, botones y ayudas de la aplicación para usar una voz consistente en tercera persona e impersonal. El ajuste cubrió autenticación, portada, dashboards, formularios, gestión de contacto, listas, usuarios, atención VBG, modales y servicios que exponen mensajes a la interfaz.

Este cambio fue textual y de experiencia de usuario; no modificó reglas de negocio.

**Evidencia:** commit `7e77dd6`, 43 archivos modificados.

### 3.4. Formulario de acompañamiento y bandeja de reparto

Se realizó un ajuste integral del flujo de solicitudes de acompañamiento:

- ampliación y reorganización del `FormularioAcompanamientoComponent`;
- captura de datos de solicitante, remitente, hechos, presunta persona agresora, contactos y evidencias;
- actualización de `ConsultaComponent` como bandeja de reparto con filtros y paginación;
- mejora del detalle de solicitud;
- ajuste del modal de reparto y asignación;
- actualización de modales de correo y teléfono;
- ampliación de `SolicitudService` y `LoadingService`;
- configuración de proxy para trabajo local;
- actualización del paginador en español y de la navegación;
- creación del contrato técnico `CONTRATO_SOLICITUDES_Y_REPARTO.md`;
- ampliación de pruebas unitarias del flujo.

**Evidencia:** commit `ac3b008`, integrado mediante PR #23; 47 archivos modificados, 4.302 inserciones y 1.191 eliminaciones.

### 3.5. Bandeja de contacto del equipo de atención

Se transformó la funcionalidad “Mis asignaciones” en una bandeja operativa de contacto:

- consolidación del flujo en `GestionContactoComponent`;
- actualización de rutas y opciones de navegación;
- ajustes responsive en la tabla y acciones de contacto;
- actualización de `ModalGestionContactoComponent`;
- ampliación de `SolicitudService` y de datos simulados;
- creación de `AsignacionesService` y sus pruebas;
- ajustes a `RegistroVbgDatosService`, autenticación e interceptor;
- correcciones transversales de visualización y terminología en el equipo de atención.

**Evidencias:** commits `8195178` y `8824153`. Al cierre del período se encontraban en la rama `feature/05/014/casilda/correcciones-equipo-atencion`, aún no integrados a `main`.

### 3.6. Integraciones realizadas

- Merge del PR #20 de integración con backend AWS/QA (`9a99100`). Esta actividad corresponde a integración del cambio; la autoría funcional del PR pertenece a sus desarrolladores originales.
- Integración de `main` en la rama de correcciones del equipo de atención para mantenerla actualizada (`51980da`).

---

## 4. Procedimientos CRUD y flujos intervenidos

| Módulo intervenido por Hinara | Operaciones | Trabajo realizado |
|---|---|---|
| Solicitudes de acompañamiento | Create / Read / Update | Formulario de creación, consulta paginada, detalle y preparación de datos para reparto. |
| Bandeja de reparto | Read / Update | Filtros, visualización de solicitudes, asignación y registro de interacciones. |
| Gestión de contacto | Read / Update | Consulta de asignaciones, bandeja operativa y registro de acciones de contacto. |
| Formularios VBG | Create / Update | Corrección de campos, obligatoriedad de ámbito, nombres, apellidos y mensajes. |

No se reportan como trabajo propio de Hinara los CRUD de contenidos del inicio ni otras funcionalidades creadas exclusivamente por integrantes diferentes durante el mismo mes.

---

## 5. Componentes, servicios y documentación intervenidos

### Componentes principales

- `FormularioAcompanamientoComponent`
- `ConsultaComponent`
- `GestionContactoComponent`
- `ModalDetalleSolicitudComponent`
- `ModalRepartoComponent`
- `ModalCorreoComponent`
- `ModalTelefonoComponent`
- `ModalGestionContactoComponent`
- `FormularioAnonimoComponent`
- `FormularioQuejaComponent`
- `RegistroCasoComponent`
- `RegistroAtencionComponent`
- componentes de autenticación, navegación y visualización ajustados por consistencia textual.

### Servicios y configuración

- `SolicitudService`
- `AsignacionesService`
- `RegistroVbgDatosService`
- `AuthService`
- `authInterceptor`
- `LoadingService`
- `CasosSimuladosService`
- `package.json` y `package-lock.json`
- `proxy.conf.js` y `proxy.conf.json`
- `angular.json`

### Documento técnico creado

- `docs/contratos/CONTRATO_SOLICITUDES_Y_REPARTO.md`.

---

## 6. Trazabilidad de commits propios

| Fecha | Commit | Actividad | Integración |
|---|---|---|---|
| 07/10/2026 | `5d8165d` | Ajuste de nombres, apellidos, ámbito VBG y errores lint. | PR #17 |
| 07/10/2026 | `a24b9a8` | Actualización de Angular 21.2.25 por vulnerabilidad de seguridad. | PR #17 |
| 07/10/2026 | `73824e7` | Sincronización de `package-lock.json` para corregir `npm ci`. | PR #17 |
| 14/10/2026 | `7e77dd6` | Unificación de voz en tercera persona e impersonal. | PR #19 |
| 28/10/2026 | `ac3b008` | Ajuste del formulario de acompañamiento y bandeja de reparto. | PR #23 |
| 29/10/2026 | `8195178` | Conversión de “Mis asignaciones” en bandeja de contacto. | Rama en curso |
| 29/10/2026 | `8824153` | Correcciones del equipo de atención y servicios asociados. | Rama en curso |

### Integraciones ejecutadas por Hinara

| Fecha | Commit | Actividad |
|---|---|---|
| 20/10/2026 | `9a99100` | Merge del PR #20 de integración con backend AWS/QA. |
| 29/10/2026 | `51980da` | Integración de `main` en la rama de correcciones del equipo de atención. |

---

## 7. Corrección de errores e incidencias

| Incidencia atendida | Solución aplicada | Evidencia |
|---|---|---|
| Campos de nombres, apellidos y ámbito inconsistentes. | Alineación de formularios, validaciones y pruebas. | `5d8165d` |
| Vulnerabilidad en dependencias Angular. | Actualización a Angular 21.2.25. | `a24b9a8` |
| Fallo de `npm ci` en el runner. | Sincronización de dependencias `emnapi` en el lockfile. | `73824e7` |
| Textos inconsistentes entre primera, segunda y tercera persona. | Normalización institucional de mensajes y ayudas. | `7e77dd6` |
| Flujo incompleto de solicitud y reparto. | Rediseño del formulario, bandeja, modales, servicios y contrato. | `ac3b008` |
| Duplicidad entre “Mis asignaciones” y gestión de contacto. | Consolidación en una única bandeja operativa. | `8195178` |
| Ajustes pendientes de autenticación, catálogos y datos de atención. | Correcciones transversales y nuevos servicios con pruebas. | `8824153` |

---

## 8. Validación técnica al cierre

Las siguientes cifras corresponden a la **suite completa del repositorio ejecutada sobre la rama que contiene los cambios de Hinara**. No significan que todas las pruebas del proyecto hayan sido escritas por ella.

| Control | Resultado del 30/10/2026 |
|---|---|
| Pruebas unitarias | 370/370 aprobadas. |
| Cobertura | 51,75 % líneas; 51,24 % declaraciones; 43,58 % funciones; 35,03 % ramas. |
| Build productivo | Exitoso; 1,01 MB bruto y 227,69 kB estimados de transferencia inicial. |
| ESLint | 0 errores y 267 advertencias. |
| Accesibilidad estática | 0 deuda P0 en 26 rutas; pendientes no bloqueantes de estilos. |
| Dependencias productivas | 0 vulnerabilidades reportadas. |

Hinara modificó o incorporó pruebas en **20 archivos `*.spec.ts`** relacionados con formularios, reparto, contacto, autenticación y servicios.

---

## 9. Estado y pendientes

- Los cambios de solicitudes y reparto quedaron integrados a `main` mediante el PR #23.
- Los commits de bandeja de contacto y correcciones del equipo de atención permanecían en la rama de trabajo al 30 de octubre.
- Persisten 267 advertencias de ESLint y deuda no bloqueante de estilos/accesibilidad.
- Las actas de reuniones, demostraciones, despliegues externos y validaciones con usuarios no se incluyen como ejecutadas sin su soporte documental.

---

## 10. Conclusión

Durante octubre de 2026, Hinara desarrolló y estabilizó flujos centrales de solicitudes, reparto y contacto; corrigió formularios VBG; atendió una vulnerabilidad de Angular; reparó la instalación del pipeline; y unificó la voz institucional de la aplicación. Los cambios fueron respaldados mediante commits identificables, pruebas actualizadas y ejecución satisfactoria de los controles técnicos del repositorio.

