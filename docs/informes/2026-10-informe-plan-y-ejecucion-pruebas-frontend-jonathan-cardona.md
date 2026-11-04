# INFORME DE PLAN Y EJECUCIÓN DE PRUEBAS FRONT-END

**Proyecto:** Sistema CASILDA  
**Responsable de las actividades reportadas:** **Jonathan Cardona Calderón** (`jcardonamde`)  
**Período:** **1 al 31 de octubre de 2026**  
**Fecha de ejecución consolidada:** 31 de octubre de 2026  
**Entorno:** Angular 21.2.25, Karma 6.4.4, Jasmine 5.1.2, ChromeHeadless 155 y Node.js 20.19.1  
**Entorno de integración:** `https://browser-rho-two.vercel.app` (Vercel) contra el backend QA `https://casildaqa.duckdns.org/api-casilda`  

---

## 1. Objetivo y alcance

Este informe registra las pruebas que Jonathan creó o modificó en los PR #15, #16, #20, #21 y #25, la ejecución de los controles técnicos al cierre del período y las pruebas de integración que realizó sobre la aplicación desplegada en Vercel contra el backend QA.

La cifra de 370 pruebas corresponde a la suite completa del proyecto. Se utiliza como evidencia de regresión de los cambios de Jonathan, pero no implica que él haya escrito la totalidad de la suite.

---

## 2. Plan de pruebas

| Nivel | Objetivo | Herramienta | Momento |
|---|---|---|---|
| Unitarias de reglas | Teléfono publicable, supresión de celdas, vigencia, URL de imagen, enlace interno y validadores, sin depender de Angular. | Jasmine | Cada commit. |
| Unitarias de servicios | Forma exacta de las peticiones HTTP (multipart, parámetros), sesión y traducción de errores. | `HttpTestingController` | Cada commit. |
| Unitarias de componentes | Renderizado por rol, estados de carga, vacío y error, accesibilidad y formularios. | `TestBed` | Cada commit. |
| Verificación visual | Superposición de textos y diseño adaptable. | Capturas de Chrome sin interfaz a 1280, 820 y 360 px | Corrección del login. |
| Controles del repositorio | Lint, accesibilidad estática, build y dependencias. | Scripts de `package.json` | Antes de cada grupo de commits y al cierre. |
| Integración | Comportamiento real contra el backend QA. | Sitio publicado en Vercel | Después de cada publicación. |

Criterio transversal: el contenido sensible (teléfonos de crisis, conteos pequeños, datos del rol Usuario) se prueba con casos que **deben fallar** si vuelve a aparecer un dato de relleno o un valor identificable.

---

## 3. Cambios de pruebas realizados por Jonathan

Durante octubre, Jonathan intervino **27 archivos de pruebas**: creó 17 y modificó 10, con **221 casos de prueba nuevos**.

### Panel de inicio y contenido de crisis (PR #15 y #20) — 117 casos

| Archivo | Tipo | Casos nuevos |
|---|---|---:|
| `dashboard-home.component.spec.ts` | Modificado | 23 |
| `panel-usuario.component.spec.ts` | Nuevo | 19 |
| `panel-inicio.component.spec.ts` | Nuevo | 16 |
| `telefono-crisis.spec.ts` | Nuevo | 11 |
| `dashboard-por-rol.spec.ts` | Nuevo | 10 |
| `vigilancia.widget.spec.ts` | Nuevo | 9 |
| `catalogo-navegacion.spec.ts` | Nuevo | 9 |
| `quick-exit.component.spec.ts` | Modificado | 9 |
| `supresion-celdas.spec.ts` | Nuevo | 7 |
| `public-footer.component.spec.ts` | Modificado | 4 |

### Módulo Equipo de Atención (PR #15 y #16) — 19 casos

| Archivo | Tipo | Casos nuevos |
|---|---|---:|
| `registro-caso.component.spec.ts` | Modificado | 11 |
| `seccion-presunto-agresor.component.spec.ts` | Nuevo | 5 |
| `seccion-apreciaciones.component.spec.ts` | Nuevo | 3 |

### Módulo de contenidos (PR #21) — 66 casos

| Archivo | Tipo | Casos nuevos |
|---|---|---:|
| `editor-contenido.component.spec.ts` | Nuevo | 15 |
| `reglas-contenido.spec.ts` | Nuevo | 14 |
| `contenido-admin.service.spec.ts` | Nuevo | 13 |
| `gestion-contenidos.component.spec.ts` | Nuevo | 7 |
| `selector-imagen.component.spec.ts` | Nuevo | 6 |
| `validadores-contenido.spec.ts` | Nuevo | 5 |
| `contenido-item.component.spec.ts` | Nuevo | 4 |
| `cambios-sin-guardar.guard.spec.ts` | Nuevo | 2 |

### Portada, autenticación y login (PR #15, #20, #21 y #25) — 19 casos

| Archivo | Tipo | Casos nuevos |
|---|---|---:|
| `auth.service.spec.ts` | Modificado | 7 |
| `casilda-home.component.spec.ts` | Modificado | 5 |
| `casilda-card.component.spec.ts` | Modificado | 4 |
| `contenido-home.service.spec.ts` | Modificado | 2 |
| `login.component.spec.ts` | Modificado | 1 |
| `register.component.spec.ts` | Modificado | Corrección del error `NG0201` (router de pruebas). |

---

## 4. Casos y comportamientos verificados

| Área | Verificaciones relacionadas con el trabajo de Jonathan |
|---|---|
| Contenido de crisis | Teléfonos vacíos, de relleno, repetidos o con rachas consecutivas no se publican; ninguna vista muestra un número no publicable. |
| Salida rápida | `Alt + Q` en Windows, `Option + Q` en macOS («œ»), doble `Escape`, y que `AltGr + Q` no la active. |
| Panel por rol | Widgets y orden por rol, zonas con estados de carga, vacío y error, y ausencia de duplicados con el menú. |
| Supresión de celdas | Ningún conteo bajo el umbral llega al DOM, y la supresión secundaria impide recuperarlo restando del total. |
| Rol Usuario | Sin cifras ni relato de hechos, sin escrituras en `localStorage` y sin `MiProcesoService` fuera del modo de demostración. |
| Equipo de Atención | Validación condicional de ámbito, secciones compartidas del presunto agresor y de apreciaciones, y grupo de atención de solo lectura. |
| Modo de demostración | Sin la bandera no se inicia sesión con cuentas de prueba, se descarta una sesión de prueba guardada y no se muestran widgets sin endpoint. |
| Rol `GESTOR_CONTENIDO` | Reconocimiento por nombre y por código, sesión conservada al recargar, panel solo con accesos y entrada en el catálogo de navegación. |
| Reglas de contenido | Estados publicado, programado y vencido en los límites del día; URL de imagen relativa, absoluta y nula; rechazo de enlaces externos o con `//`. |
| Servicio CRUD | Parte `contenido` como JSON con su tipo, imagen opcional, `eliminarImagen` solo sin archivo, listado de varias páginas y traducción de errores `0`, `400`, `403`, `404` y `413`. |
| Gestión de contenidos | Agrupación por sección, filtro por estado, borrado con confirmación, sugerencia de posición, fechas por día, errores del servidor por campo y aviso de cambios sin guardar. |
| Selector de imagen | Rechazo por tipo y peso, arrastrar y soltar, quitar imagen y error asociado al control. |
| Portada | Resolución de imágenes contra la API, imagen de respaldo y enlaces no navegables. |
| Login | Ayuda dentro del campo, reemplazo por el error y espacio del mensaje dinámico. |

---

## 5. Ejecución de pruebas unitarias

Comando, ejecutado sobre `main` (`f492062`) después de `npm ci`:

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
| Cobertura de declaraciones | 51,19 % (2.792/5.454) |
| Cobertura de ramas | 34,93 % (999/2.860) |
| Cobertura de funciones | 43,44 % (626/1.441) |
| Cobertura de líneas | 51,69 % (2.618/5.064) |

### Cobertura de los módulos creados por Jonathan

| Módulo | Declaraciones | Ramas | Funciones | Líneas |
|---|---:|---:|---:|---:|
| `core/dashboard/` | 100 % | 100 % | 100 % | 100 % |
| `core/vigilancia/` | 100 % | 100 % | 100 % | 100 % |
| `core/security/` | 95,91 % | 92,85 % | 90,9 % | 97,36 % |
| `core/navegacion/` | 90,9 % | 85,71 % | 100 % | 100 % |
| `core/contenidos/` | 100 % | 97,72 % | 100 % | 100 % |
| `core/vbg/` | 55,55 % | 0 % | 40 % | 62,5 % |
| `dashboard/` (panel) | 100 % | 40 % | 100 % | 100 % |
| `dashboard/widgets/` | 88,97 % | 66,66 % | 88,09 % | 88,37 % |
| `dashboard/zona-panel/` | 100 % | 100 % | 100 % | 100 % |
| `dashboard/kpi-card/` | 100 % | 100 % | 100 % | 100 % |
| `dashboard-usuario/` | 88,46 % | 60 % | 85,71 % | 87,5 % |
| `seccion-presunto-agresor/` | 95,65 % | 83,33 % | 100 % | 100 % |
| `seccion-apreciaciones/` | 65,38 % | 50 % | 57,14 % | 65,38 % |
| `seccion-seguimientos/` | 2 % | 0 % | 0 % | 2,08 % |
| `gestion-contenidos/` (listado) | 100 % | 100 % | 100 % | 100 % |
| `gestion-contenidos/editor-contenido/` | 90,71 % | 71,07 % | 94,73 % | 95,09 % |
| `gestion-contenidos/contenido-item/` | 93,75 % | 90 % | 83,33 % | 93,33 % |
| `selector-imagen/` | 73,46 % | 66,66 % | 69,23 % | 74,41 % |
| `contenido-admin.service.ts` | 100 % | 87,09 % | 100 % | 100 % |

### Cobertura de módulos existentes que Jonathan modificó

| Módulo | Declaraciones | Ramas | Funciones | Líneas |
|---|---:|---:|---:|---:|
| `quick-exit/` | 100 % | 100 % | 100 % | 100 % |
| `casilda-card/` | 100 % | 100 % | 100 % | 100 % |
| `contenido-home.service.ts` | 100 % | 66,66 % | 100 % | 100 % |
| `maestros-vbg.service.ts` | 75 % | 50 % | 66,66 % | 72,72 % |
| `auth.service.ts` | 76,11 % | 56,04 % | 81,57 % | 77,19 % |
| `auth/login/` | 52,77 % | 83,33 % | 50 % | 52,77 % |

Las reglas puras de seguridad del contenido (`core/dashboard`, `core/vigilancia`, `core/security` y `core/contenidos`) tienen cobertura de líneas de 97 % a 100 %. Las coberturas bajas se recogen como hallazgos en la sección 9. `auth.service.ts` y `auth/login/` incluyen lógica anterior a octubre que no hacía parte del alcance de estos cambios.

---

## 6. Controles técnicos ejecutados

| Control | Comando | Resultado |
|---|---|---|
| Linteo | `npm run lint` | 0 errores y 267 advertencias. |
| Accesibilidad estática | `npm run a11y:audit` | 0 deuda P0; 26 rutas con título. |
| Build productivo | `npm run build` | Exitoso; 1,01 MB bruto y 227,69 kB estimados. |
| Dependencias productivas | `npm run audit:prod` | 0 vulnerabilidades. |

Los cambios de Jonathan no agregaron errores de lint ni deuda P0 de accesibilidad. Las rutas nuevas declaran título, y los botones nuevos tienen nombre accesible y área táctil de 44 px.

---

## 7. Auditoría de accesibilidad

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

El panel de inicio, la vista del rol Usuario y el módulo de contenidos no tienen colores literales ni fuentes menores a 14 px. En el login, la corrección retiró un texto de 12 px.

---

## 8. Pruebas de integración en Vercel

Jonathan publicó las versiones de la aplicación en `https://browser-rho-two.vercel.app` y las probó contra el backend QA.

### Verificaciones técnicas por publicación (27 al 30 de octubre)

| Fecha (hora Colombia) | Versión | Bundle nuevo | Apunta a QA | CORS desde Vercel |
|---|---|:---:|:---:|:---:|
| 27/10/2026 21:59 | `049dace` (PR #21) | Sí | Sí | Sí (`/auth/login` y `PUT` con `Authorization`) |
| 29/10/2026 01:15 | `3d9a2dd` (PR #23) | Sí | Sí | Sí |
| 29/10/2026 18:06 | `4fd7aca` (PR #25) | Sí | Sí | Sí |
| 29/10/2026 22:04 | `5034f3d` (PR #26) | Sí | Sí | Sí (`POST /auth/register`) |
| 30/10/2026 01:09 | `38c50e9` (PR #27) | Sí | Sí | Sí |

Las publicaciones anteriores del mes (6, 12 y 20 de octubre) se hicieron con el script `npm run deploy:vercel`; para ellas no se conservaron registros de verificación.

### Validaciones funcionales en el sitio publicado

| Caso | Resultado |
|---|---|
| Login con correo inválido: el error no se superpone a la ayuda del campo. | Aprobado por Jonathan el 29/10/2026. |
| Registro de usuario contra `POST /auth/register` (desarrollo de otro integrante). | Aprobado por Jonathan el 30/10/2026. |
| `GET /contenidos/home` y `GET /auth/vinculos-udea` desde el dominio de Vercel. | `200`. |
| Ciclo completo del módulo de contenidos con un usuario `GESTOR_CONTENIDO` real. | Pendiente. |

### Errores del backend reportados

| Hallazgo | Impacto en el frontend |
|---|---|
| El login no devuelve la especialidad del usuario. | Nadie puede agregar seguimientos en el módulo del equipo de atención. |
| Faltan cinco catálogos `/maestros/*` del equipo de atención. | El módulo usa un respaldo local y avisa al usuario. |
| Faltan `/dashboard/*`, `/vigilancia/*` y «mi proceso». | Los widgets correspondientes no se muestran. |
| El preflight CORS desde `http://localhost:4200` responde `403`. | Las pruebas contra QA solo pueden hacerse sobre Vercel. |
| Contenidos de prueba con valores inválidos en QA. | Deben depurarse antes de mostrar la portada. |

Jonathan también reportó al equipo de backend errores de respuesta detectados al probar módulos internos del equipo de atención sobre el despliegue. Esos reportes no están versionados en este repositorio; su soporte está en los canales del equipo.

---

## 9. Hallazgos y pendientes

1. **`SeccionSeguimientosComponent`** (2 % de líneas) y **`ModalPresuntoAgresorComponent`** (5,55 %) no tienen pruebas propias, y `esUltimaProfesionalActiva()` (`core/vbg/`, 0 % de ramas) no tiene especificación. Son la prioridad de cobertura del módulo de atención, porque deciden la alerta de cierre de seguimientos.
2. Dos pruebas verifican sus peticiones o su DOM sin una aserción que Jasmine reconozca, y la suite las marca «sin expectativas»: `ContenidoAdminService › obtenerPorId() y eliminar() usan la ruta del recurso` y `VigilanciaWidget › supresión de celdas pequeñas`. Conviene agregar una aserción explícita.
3. `SelectorImagenComponent` (66,66 % de ramas) y `SeccionApreciacionesComponent` (50 %) necesitan casos adicionales.
4. Falta la prueba de punta a punta del módulo de contenidos con un usuario `GESTOR_CONTENIDO` real de QA.
5. No hay pruebas automatizadas de punta a punta; las pruebas de integración de este período fueron manuales.
6. Permanecen 267 advertencias ESLint no bloqueantes en el repositorio.
7. Los textos del rol Usuario y las decisiones provisionales VBG requieren validación con el equipo de atención; las validaciones de usabilidad y aceptación con usuarios requieren actas o soportes externos y no se presentan como ejecutadas en este informe.

---

## 10. Conclusión

Los cambios realizados por Jonathan durante octubre quedaron cubiertos por 221 casos de prueba nuevos en 27 archivos. Las reglas sensibles (teléfonos de crisis, supresión de celdas pequeñas y vigencia de contenidos) tienen cobertura de líneas de 97 % a 100 %. Los cambios se validaron con la suite completa del proyecto: 370/370 pruebas, build exitoso, 0 errores de lint, 0 deuda P0 de accesibilidad y 0 vulnerabilidades productivas. Las pruebas de integración sobre el despliegue en Vercel confirmaron el funcionamiento contra el backend QA y permitieron reportar los errores del backend que hoy bloquean parte del módulo del equipo de atención.
