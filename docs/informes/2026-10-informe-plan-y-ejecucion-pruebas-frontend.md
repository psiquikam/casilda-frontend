# INFORME DE PLAN Y EJECUCIÓN DE PRUEBAS FRONT-END

**Proyecto:** Sistema CASILDA  
**Responsable de las actividades reportadas:** **Hinara Pastora Sánchez Mata**  
**Período:** **1 al 30 de octubre de 2026**  
**Fecha de ejecución consolidada:** 30 de octubre de 2026  
**Entorno:** Angular 21.2.25, Karma 6.4.4, Jasmine 5.1, ChromeHeadless 156 y Node.js 24.18.0  

---

## 1. Objetivo y alcance

Este informe registra las pruebas modificadas o incorporadas por Hinara y la ejecución de los controles técnicos sobre la rama que contiene sus cambios de octubre.

La cifra de 370 pruebas corresponde a la suite completa del proyecto. Se utiliza como evidencia de regresión de los cambios de Hinara, pero no implica que ella haya escrito la totalidad de la suite.

---

## 2. Cambios de pruebas realizados por Hinara

Durante octubre, Hinara intervino **20 archivos de pruebas**:

### Formularios y atención VBG

- `formulario-anonimo.component.spec.ts`
- `formulario-queja.component.spec.ts`
- `registro-caso.component.spec.ts`
- `registro-atencion.component.spec.ts`
- `public-header.component.spec.ts`

### Solicitudes y reparto

- `formulario-acompanamiento.component.spec.ts`
- `consulta.component.spec.ts`
- `reparto-modal.component.spec.ts`
- `modal-correo.component.spec.ts`
- `modal-telefono.component.spec.ts`

### Contacto y asignaciones

- `gestion-contacto.component.spec.ts`
- `modal-gestion-contacto.component.spec.ts`
- `asignaciones.service.spec.ts`
- `registro-vbg-datos.service.spec.ts`
- retiro de `mis-asignaciones.component.spec.ts` al consolidarse esa funcionalidad en la bandeja de contacto.

### Autenticación y experiencia de usuario

- `auth.service.spec.ts`
- `auth.interceptor.spec.ts`
- `panel-inicio.component.spec.ts`
- `panel-usuario.component.spec.ts`
- `dashboard-revisor.component.spec.ts`

---

## 3. Casos y comportamientos verificados

| Área | Verificaciones relacionadas con el trabajo de Hinara |
|---|---|
| Formularios VBG | Campos de nombres/apellidos, ámbito, renderizado, validaciones y comportamiento de registro. |
| Solicitud de acompañamiento | Construcción del formulario, datos obligatorios, normalización y flujo de envío. |
| Bandeja de reparto | Carga, filtros, paginación, visualización y apertura de acciones. |
| Modales de reparto y contacto | Datos de entrada, confirmación, correo, teléfono y cierre del diálogo. |
| Gestión de contacto | Consolidación de asignaciones y acciones operativas del equipo de atención. |
| Servicios | Consultas de asignaciones, datos VBG, autenticación e interceptor HTTP. |
| Voz institucional | Actualización de expectativas de texto afectadas por la normalización en tercera persona. |

---

## 4. Ejecución de pruebas unitarias

Comando:

```powershell
npm run test:ci
```

Resultado:

| Indicador del repositorio completo | Valor |
|---|---:|
| Pruebas ejecutadas | 370 |
| Pruebas aprobadas | 370 |
| Pruebas fallidas | 0 |
| Tasa de aprobación | 100 % |
| Cobertura de declaraciones | 51,24 % (2.795/5.454) |
| Cobertura de ramas | 35,03 % (1.002/2.860) |
| Cobertura de funciones | 43,58 % (628/1.441) |
| Cobertura de líneas | 51,75 % (2.621/5.064) |

---

## 5. Controles técnicos ejecutados

| Control | Comando | Resultado |
|---|---|---|
| Linteo | `npm run lint` | 0 errores y 267 advertencias. |
| Accesibilidad estática | `npm run a11y:audit` | 0 deuda P0; 26 rutas con título. |
| Build productivo | `npm run build` | Exitoso; 1,01 MB bruto y 227,69 kB estimados. |
| Dependencias productivas | `npm run audit:prod` | 0 vulnerabilidades. |

La actualización a Angular 21.2.25 y la sincronización del lockfile realizadas por Hinara permitieron conservar la compilación y la instalación reproducible en CI.

---

## 6. Auditoría de accesibilidad

| Regla | Resultado del repositorio |
|---|---:|
| Botones de ícono sin nombre | 0 de 90 |
| Iconos expuestos sin nombre/ocultamiento | 0 |
| Filtros sin etiqueta | 0 |
| `outline: none` sin reemplazo | 0 |
| Rutas sin título | 0 de 26 |
| `console.error` / `console.warn` | 0 |
| Fuentes menores a 14 px | 12 pendientes no P0 |
| Archivos SCSS con colores literales | 30 de 72, pendiente no P0 |

---

## 7. Integración continua

El pipeline versionado ejecuta:

1. instalación limpia con `npm ci`;
2. lint;
3. auditoría de accesibilidad;
4. pruebas unitarias y cobertura;
5. build productivo;
6. auditoría de dependencias.

Hinara corrigió durante el período el fallo de instalación asociado a dependencias `emnapi` (`73824e7`) y actualizó Angular por seguridad (`a24b9a8`).

---

## 8. Hallazgos y pendientes

1. La cobertura de ramas, 35,03 %, debe continuar aumentando.
2. Permanecen 267 advertencias ESLint no bloqueantes.
3. Dos especificaciones de la suite completa emitieron advertencias por no contener expectativas explícitas.
4. Las pruebas de imágenes producen respuestas 404 controladas sobre un recurso ficticio; conviene utilizar un fixture local.
5. Quedan pendientes hallazgos no P0 de tipografía y colores SCSS.
6. Las validaciones de usabilidad y aceptación con usuarios requieren actas o soportes externos y no se presentan como ejecutadas en este informe.

---

## 9. Conclusión

Los cambios realizados por Hinara durante octubre quedaron cubiertos por actualizaciones en 20 archivos de prueba y fueron validados mediante la suite completa del proyecto. El resultado fue satisfactorio: 370/370 pruebas, build exitoso, 0 errores de lint, 0 deuda P0 de accesibilidad y 0 vulnerabilidades productivas.

