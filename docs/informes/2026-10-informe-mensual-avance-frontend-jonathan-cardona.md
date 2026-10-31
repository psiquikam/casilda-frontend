# INFORME MENSUAL DE AVANCE DE DESARROLLO FRONT-END

**Proyecto:** Sistema CASILDA — Capa Web de Vigilancia en Salud Pública para el Abordaje de las Discriminaciones y Violencias Basadas en Género (VBG)  
**Entidad:** Universidad de Antioquia (UdeA) — Facultad Nacional de Salud Pública (FNSP)  
**Responsable del informe y de las actividades reportadas:** **Jonathan Cardona Calderón** (`jcardonamde`)  
**Período:** **1 al 31 de octubre de 2026**  
**Repositorio:** `psiquikam/casilda-frontend`  
**Ramas reportadas:** `feature/04/010/casilda/optmizacion-dashboards` (PR #15 y #16), `chore/05/013/casilda/integracion-backend-aws` (PR #20), `feature/05/014/casilda/ui-perfil-contenidos` (PR #21) y `feature/05/015/casilda/ajuste-validacion-login` (PR #25)  

---

## 1. Objeto del informe

Este documento consolida las actividades realizadas por **Jonathan Cardona Calderón** entre el 1 y el 31 de octubre de 2026 en las ramas indicadas, más el apoyo a las pruebas de integración sobre el despliegue de Vercel y el reporte de errores del backend. La fuente de trazabilidad es el historial Git atribuido a su usuario, los PR integrados en `main`, el registro de despliegues del proyecto de Vercel y las verificaciones técnicas ejecutadas al cierre del período.

No se atribuyen a Jonathan funcionalidades desarrolladas por otros integrantes. Los merges de PR ajenos se identifican expresamente como actividad de integración y no como autoría del desarrollo.

---

## 2. Resumen ejecutivo

Durante octubre, Jonathan concentró su trabajo en siete frentes:

1. Optimización del panel de inicio por rol, con contenido de crisis seguro y una vista propia para la persona que solicita acompañamiento.
2. Estandarización del módulo Equipo de Atención contra la matriz VBG (subfases M1 a M5).
3. Conexión del frontend al backend QA desplegado en AWS y retiro de los datos simulados del entorno desplegado.
4. Módulo «Contenidos del inicio» para el nuevo rol `GESTOR_CONTENIDO`, con CRUD completo sobre la API y vista previa en vivo.
5. Corrección de la portada, que no mostraba las imágenes servidas por el backend, y del login, donde el error del correo se superponía a la ayuda del campo.
6. Publicación de la aplicación en el proyecto de Vercel y pruebas de integración contra QA.
7. Reporte de errores y huecos del backend detectados en esas pruebas.

La trazabilidad directa comprende **35 commits de desarrollo** en 5 PR, con **18.257 inserciones**, **6.287 eliminaciones** y **306 intervenciones de archivo**. En pruebas, Jonathan creó 17 archivos, modificó otros 10 y agregó **221 casos de prueba**. Además, integró 8 PR de otros integrantes y registró 10 publicaciones en el proyecto de Vercel durante el mes.

---

## 3. Actividades realizadas

### 3.1. Panel de inicio por rol (PR #15)

Contrato: `docs/contratos/DASHBOARDS_POR_ROL.md`. Diagnóstico, plan y un reporte por subfase en `docs/evidencias/dashboards/`.

- **Subfase 0 — Contenido de crisis y atajo.** El teléfono de orientación llevaba un número de relleno (`1234567890`), también en producción, y se mostraba sin condición en el banner del rol Usuario, en el pie público y en la portada. Se creó `esTelefonoPublicable()`, que rechaza vacíos, textos de relleno y secuencias, y los teléfonos quedaron vacíos a propósito mientras no haya dato confirmado. La Salida rápida (`Alt + Q`) se reconoce también en macOS sin dispararse con `AltGr + Q` del teclado latinoamericano.
- **Subfase 1 — Correcciones transversales.** Fechas y cifras en es-CO, 0 colores literales en el panel y el encabezado, y corrección de los tokens `--color-danger` y `--color-info`, que apuntaban a variables inexistentes y afectaban a más de 20 componentes.
- **Subfase 2 — Arquitectura común.** Panel por zonas (Z1 a Z6) con un registro único de widgets por rol (`DASHBOARD_POR_ROL`), catálogo central de navegación (`CATALOGO_MODULOS`), tarjeta de indicador, servicios con DTO y endpoint previsto, y estados de carga, vacío y error en cada zona.
- **Subfase 3 — Dashboards del personal.** Vista analítica con filtros de periodo, sede y dependencia, y **supresión de celdas pequeñas** aplicada en el servicio, con supresión secundaria para que el valor oculto no pueda recuperarse restando del total.
- **Subfase 4 — Rol Usuario.** Vista propia con enfoque informado en trauma: estado del proceso con siguiente paso, próxima sesión, acuerdos, canal de contacto y líneas de ayuda; sin cifras, sin relato de hechos y sin escribir nada en `localStorage`.

**Evidencia:** 10 commits del 04/10/2026.

### 3.2. Estandarización del módulo Equipo de Atención (PR #15 y #16)

Contrato: `docs/contratos/MATRIZ_MODULO_ATENCION_VBG.md`. Diagnóstico y un reporte por subfase en `docs/evidencias/estandarizacion-vbg/`.

- **M1 — Higiene y cimientos.** Modo de demostración del módulo (`MaestrosVbgService`, `RegistroVbgDatosService`, `CasosSimuladosService`) con datos evidentemente ficticios, para probarlo sin backend; respaldo tipado de catálogos si el backend falla.
- **M2 — Clasificación y documentación del hecho.** Filtro VBG como primer campo, ámbito y forma de ocurrencia obligatorios solo si VBG = Sí, y dos niveles de relación misional e institucional.
- **M3 — Identificación, presunto agresor y apreciaciones.** Componentes compartidos `SeccionPresuntoAgresorComponent` y `SeccionApreciacionesComponent` entre registro de caso y registro de atención; nuevo campo «¿Cuál?» cuando el vínculo es «Otro»; corrección del enrutamiento de guardado en registro de atención.
- **M4 — Acuerdos, seguimientos y cierre.** Rutas internas y externas como grupos independientes, seguimientos aislados por especialidad (`SeccionSeguimientosComponent`) y alerta al cerrar el seguimiento de la última profesional activa de una especialidad.
- **M5 — Terminología y grupo de atención.** «Grupo de atención» llegaba vacío a la interfaz por una pérdida de datos en tres capas; ahora es un campo de solo lectura. Se alineó la terminología del rol Usuario.
- **Documentación de contenido:** `GLOSARIO_VBG.md` y `DECISIONES_PROVISIONALES_VBG.md`, con 19 decisiones pendientes de validar con el equipo clínico y legal.

**Evidencia:** 6 commits del 04/10 y 05/10/2026.

### 3.3. Otras entregas de los PR #15 y #16

- Opción de registro en la navegación pública y en el login (`cca4048`).
- Corrección del selector de rol del modo de prueba, que no refrescaba el panel, y retiro de una entrada duplicada de «Auditoría de casos» en el menú (`25c8264`).
- Script de publicación en Vercel (`tools/deploy-vercel.mjs`, `npm run deploy:vercel`) (`f7ad1d1`).
- Incorporación al repositorio del documento de diseño `casilda-diseno-v1.md`, de `AGENTS.md`, de la matriz VBG y del contrato de contenidos del home (`e36d545`, `41c1d2a`).

### 3.4. Integración con el backend QA en AWS (PR #20)

Se conectó la aplicación al backend QA (`https://casildaqa.duckdns.org/api-casilda`) y se separó con claridad el modo de demostración del funcionamiento real:

- `apiBaseUrl` de desarrollo y de producción apuntando al backend QA;
- nueva bandera `environment.datosDemostracion`, en `false` en ambos entornos, que gobierna todo dato ficticio;
- cuentas de prueba deshabilitadas sin la bandera, ocultas en el login y en el encabezado, y descarte de sesiones de prueba guardadas;
- panel de inicio sin widgets que no tienen endpoint en el backend (`WIDGETS_SIN_BACKEND`);
- portada consultando `GET /contenidos/home` fuera del modo de demostración;
- encabezados de seguridad en `vercel.json`;
- registro en `CLAUDE.md` de los huecos detectados en el OpenAPI del backend.

**Evidencia:** 7 commits del 20/10/2026, 22 archivos, 389 inserciones y 102 eliminaciones. El merge del PR lo realizó Hinara Pastora Sánchez Mata (`9a99100`).

### 3.5. Módulo «Contenidos del inicio» para el rol `GESTOR_CONTENIDO` (PR #21)

Se construyó el módulo con el que el rol `GESTOR_CONTENIDO` (rol_id 6 del backend) administra las tarjetas de la portada pública:

- reconocimiento del rol en `AuthService`, que lo degradaba a `USUARIO` y **descartaba su sesión en cada recarga**;
- ruta `/gestion-contenidos` con listado, creación (`nuevo`) y edición (`:id`), protegida por rol (`GESTOR_CONTENIDO` y `ADMIN`);
- listado agrupado por sección, con estado calculado (publicado, programado o vencido) y filtro por estado;
- editor en cuatro bloques (qué dice, dónde va, cuándo se ve, con qué imagen) y **vista previa en vivo** con la misma tarjeta de la portada;
- selector de imagen reutilizable con arrastrar y soltar y validación de tipo (PNG, WEBP, SVG) y peso (400 KB);
- confirmación antes de abandonar un formulario con cambios sin guardar;
- entrada en menú lateral, menú horizontal, catálogo de navegación, accesos frecuentes y panel de inicio;
- actualización del contrato `contrato-contenidos-home.md` (§8.1) con la forma real del CRUD.

**Evidencia:** 6 commits del 27/10/2026, 50 archivos, 3.765 inserciones y 94 eliminaciones; merge `049dace`.

### 3.6. Correcciones de la portada y del panel (PR #21)

- Las imágenes subidas por el gestor llegan como rutas relativas a la API (`/contenidos/imagenes/<uuid>`), y el navegador las pedía al dominio del frontend: **ninguna se veía**. Ahora se resuelven contra `apiBaseUrl`, con imagen de respaldo si falta o falla, y un enlace que no es una ruta interna válida ya no navega (`f1e580a`).
- `ZonaPanelComponent` pintaba su acción con `href`, lo que recargaba la aplicación completa en cada clic del panel; se reemplazó por `routerLink` (`a6c7c33`).

### 3.7. Mensajes de validación del login (PR #25)

Con credenciales inválidas, el mensaje de error del correo, de dos líneas, se montaba sobre el texto de ayuda «Correo registrado en CASILDA.». Se movió la ayuda dentro del campo (`mat-hint`) y el espacio del mensaje pasó a crecer con su contenido (`subscriptSizing="dynamic"`). La corrección se verificó con capturas a 1280, 820 y 360 px y, después del despliegue, en el sitio web.

**Evidencia:** commit `360b64f`, 3 archivos, 29 inserciones y 8 eliminaciones; merge `4fd7aca`.

### 3.8. Despliegue y pruebas de integración en Vercel

En octubre se registraron 10 publicaciones en el proyecto `casilda-preview` (`https://browser-rho-two.vercel.app`). Las cinco primeras se hicieron con el script `npm run deploy:vercel`, que compila en local y sube la carpeta resultante. Las cinco últimas se compilaron en Vercel a partir de una copia limpia de cada commit de `main` (`git archive`).

| Fecha (hora Colombia) | Destino | Versión | Contenido principal |
|---|---|---|---|
| 06/10/2026 00:15 y 00:26 | Producción | Script local | Panel por rol y estandarización VBG (PR #15 y #16). |
| 12/10/2026 23:32 | Producción | Script local | `main` tras el merge del PR #18 (registro de usuario). |
| 20/10/2026 09:37 | Vista previa | Script local | Rama del PR #20 (integración con el backend QA), antes de su merge. |
| 20/10/2026 10:29 | Producción | Script local | Rama del PR #20, antes de su merge. |
| 27/10/2026 21:59 | Producción | `049dace` | Módulo de contenidos y corrección de la portada (PR #21). |
| 29/10/2026 01:15 | Producción | `3d9a2dd` | Formulario de acompañamiento y bandeja de reparto (PR #23). |
| 29/10/2026 18:06 | Producción | `4fd7aca` | Corrección del login (PR #25). |
| 29/10/2026 22:04 | Producción | `5034f3d` | Registro integrado con el backend (PR #26). |
| 30/10/2026 01:09 | Producción | `38c50e9` | Correcciones del equipo de atención en contacto (PR #27). |

En las publicaciones del 27 al 30 de octubre se verificó que el sitio sirviera la versión nueva y apuntara al backend QA. También se comprobó que el backend aceptara peticiones del dominio de Vercel (CORS), incluidas las peticiones autenticadas. La corrección del login y el flujo de registro se validaron manualmente en el sitio publicado.

Se pasó a compilar en Vercel desde una copia limpia porque la carpeta de trabajo incluye la caché local de Angular, con archivos que superan el límite de 100 MB de Vercel; así, además, solo se publica lo versionado.

### 3.9. Reporte de errores del backend

Las pruebas de integración permitieron detectar y reportar errores y huecos del backend QA:

- **Autenticación:** el login no devuelve la **especialidad** del usuario, de modo que nadie puede agregar seguimientos en el módulo del equipo de atención.
- **Catálogos inexistentes:** no existen `/maestros/ambito-ocurrencia`, `rutas-internas`, `rutas-externas`, `especialidades-seguimiento` ni `acciones-seguimiento`; el módulo del equipo de atención cae a un respaldo local.
- **Endpoints del panel:** no existen `/dashboard/*`, `/vigilancia/*` ni el de «mi proceso».
- **CORS:** el backend rechaza (`403`) las peticiones desde `http://localhost:4200` y solo acepta el dominio de Vercel, por lo que las pruebas solo pueden hacerse sobre el despliegue.
- **Datos de prueba:** en QA hay contenidos de prueba con valores inválidos (por ejemplo, un `enlace` que no es una ruta).

Jonathan también reportó errores de respuesta del backend en módulos internos del equipo de atención, a partir de las pruebas de frontend sobre el despliegue. Esos reportes se entregaron directamente al equipo de backend y su detalle no está versionado en este repositorio.

### 3.10. Integraciones realizadas

Jonathan revisó e integró en `main` los siguientes PR de otros integrantes. La autoría funcional corresponde a sus desarrolladores:

| Fecha | Merge | PR | Rama | Autoría |
|---|---|---|---|---|
| 03/10/2026 | `09de1bb` | #14 | `feature/03/009/casilda/registro-usuario` | Davidvgcode |
| 07/10/2026 | `3180725` | #17 | `feature/04/011/casilda/ajuste-nombres-apellidos-y-ambito` | Hinara Pastora Sánchez Mata |
| 12/10/2026 | `b50feb7` | #18 | `feature/03/009/casilda/registro-usuario` | Davidvgcode |
| 15/10/2026 | `a7a4a57` | #19 | `feature/04/012/casilda/unificar-voz-tercera-persona` | Hinara Pastora Sánchez Mata |
| 28/10/2026 | `3d9a2dd` | #23 | `feature/05/014/casilda/correcciones-equipo-atencion` | Hinara Pastora Sánchez Mata |
| 29/10/2026 | `4ac4826` | #24 | `feature/03/009/casilda/registro-usuario-bridge` | Davidvgcode |
| 29/10/2026 | `5034f3d` | #26 | `feature/03/009/casilda/registro-usuario-api` | Davidvgcode |
| 30/10/2026 | `38c50e9` | #27 | `feature/05/014/casilda/correcciones-equipo-atencion` | Hinara Pastora Sánchez Mata |

---

## 4. Procedimientos CRUD y flujos intervenidos

| Módulo intervenido por Jonathan | Operaciones | Trabajo realizado |
|---|---|---|
| Contenidos del inicio (`/gestion-contenidos`) | Create / Read / Update / Delete | Listado completo, creación y edición multipart con imagen, eliminación de imagen y borrado con confirmación. |
| Registro de caso y de atención VBG | Create / Update | Clasificación del hecho, presunto agresor, apreciaciones, acuerdos, seguimientos por especialidad, cierre y grupo de atención. |
| Panel de inicio por rol | Read | Zonas por rol, indicadores, vista analítica con supresión de celdas pequeñas y vista del rol Usuario. |
| Portada pública | Read | Consulta de `GET /contenidos/home`, vigencia, resolución de imágenes y enlaces internos. |
| Autenticación | Read | Rol `GESTOR_CONTENIDO`, validación de sesión y cuentas de prueba condicionadas. |
| Login | — | Presentación de mensajes de validación, sin cambio de lógica. |

No se reportan como trabajo propio de Jonathan los flujos de solicitudes, reparto, contacto ni el registro de usuario contra el backend, desarrollados por otros integrantes durante el mismo mes.

---

## 5. Componentes, servicios y documentación intervenidos

### Componentes nuevos

- Panel de inicio: `PanelInicioComponent`, `PanelUsuarioComponent`, `ZonaPanelComponent`, `KpiCardComponent` y los widgets del panel
- Equipo de Atención: `SeccionPresuntoAgresorComponent`, `SeccionApreciacionesComponent` y `SeccionSeguimientosComponent`
- Contenidos: `GestionContenidosComponent`, `EditorContenidoComponent`, `ContenidoItemComponent`, `EstadoVigenciaComponent` y `SelectorImagenComponent`

### Componentes modificados

- `RegistroCasoComponent`, `RegistroAtencionComponent`, `CitaComponent` y modales del módulo de atención
- `CasildaCardComponent`, `CasildaHomeComponent`, `PublicFooterComponent` y `QuickExitComponent`
- `LoginComponent`, `HeaderComponent`, `SidebarComponent` y `HorizontalNavComponent`

### Servicios, reglas y configuración

- Panel: `DashboardMetricasService`, `DashboardTrabajoService`, `VigilanciaService` y `MiProcesoService`
- Equipo de Atención: `MaestrosVbgService`, `RegistroVbgDatosService` y `CasosSimuladosService`
- Contenidos: `ContenidoAdminService` y `ContenidoHomeService`
- `AuthService`
- Reglas puras: `telefono-crisis.ts`, `supresion-celdas.ts`, `ultima-profesional-activa.ts`, `catalogo-vbg.ts` y `core/contenidos/`
- Registros únicos: `DASHBOARD_POR_ROL` y `CATALOGO_MODULOS`
- `cambiosSinGuardarGuard`, `app.routes.ts` y `src/styles/_tokens.scss`
- `environment.ts`, `environment.prod.ts`, `vercel.json` y `tools/deploy-vercel.mjs`

### Documentación

- Contratos: `DASHBOARDS_POR_ROL.md`, `MATRIZ_MODULO_ATENCION_VBG.md`, `GLOSARIO_VBG.md`, `DECISIONES_PROVISIONALES_VBG.md` y `contrato-contenidos-home.md`.
- Evidencias: `docs/evidencias/dashboards/` (6 reportes) y `docs/evidencias/estandarizacion-vbg/` (6 reportes).
- Contexto: `.agents/supports/casilda-diseno-v1.md`, `AGENTS.md`, `CLAUDE.md` y `README.md`.

---

## 6. Trazabilidad de commits propios

| Fecha | Commit | Actividad | Integración |
|---|---|---|---|
| 04/10/2026 | `6c7a9c0` | Líneas telefónicas ocultas sin dato real confirmado. | PR #15 |
| 04/10/2026 | `a1da3c1` | Salida rápida con `Alt + Q` en macOS, sin dispararse con `AltGr`. | PR #15 |
| 04/10/2026 | `876c3f6` | Sin llamado de orientación telefónica sin número real. | PR #15 |
| 04/10/2026 | `e1e9db3` | Contrato de dashboards, diagnóstico y reporte de la subfase 0. | PR #15 |
| 04/10/2026 | `5609a5d` | Retiro de imágenes obsoletas de la documentación de pruebas. | PR #15 |
| 04/10/2026 | `b775593` | Correcciones transversales del panel de inicio. | PR #15 |
| 04/10/2026 | `b09d09d` | Panel de inicio por zonas con registro por rol. | PR #15 |
| 04/10/2026 | `4f84707` | Vista analítica con filtros y supresión de celdas pequeñas. | PR #15 |
| 04/10/2026 | `a4ab1a0` | Panel del rol Usuario con enfoque informado en trauma. | PR #15 |
| 04/10/2026 | `93a7b6b` | Cierre documental de la optimización del panel. | PR #15 |
| 04/10/2026 | `be4ad35` | Modo de demostración y cimientos del módulo Equipo de Atención (M1). | PR #15 |
| 05/10/2026 | `add8c9b` | Clasificación y documentación del hecho (M2). | PR #15 |
| 05/10/2026 | `cca4048` | Opción de registro en la navegación pública y el login. | PR #15 |
| 05/10/2026 | `a18cfde` | Guardado de registro de atención y presunto agresor (M3). | PR #16 |
| 05/10/2026 | `44df23e` | Acuerdos, seguimientos por especialidad y cierre (M4). | PR #16 |
| 05/10/2026 | `5fc250d` | Grupo de atención de solo lectura y terminología (M5). | PR #16 |
| 05/10/2026 | `25c8264` | Refresco del rol de prueba y limpieza de la navegación. | PR #16 |
| 05/10/2026 | `41c1d2a` | Matriz VBG y contrato de contenidos del home versionados. | PR #16 |
| 05/10/2026 | `d13f778` | Cierre documental de la estandarización VBG. | PR #16 |
| 05/10/2026 | `f7ad1d1` | Script de publicación en Vercel. | PR #16 |
| 05/10/2026 | `e36d545` | Documento de diseño y `AGENTS.md` en el repositorio. | PR #16 |
| 20/10/2026 | `4765349` | `apiBaseUrl` de desarrollo apuntando al backend QA. | PR #20 |
| 20/10/2026 | `9923119` | Cuentas de prueba condicionadas a `datosDemostracion`. | PR #20 |
| 20/10/2026 | `255b279` | Widgets sin endpoint ocultos fuera del modo de demostración. | PR #20 |
| 20/10/2026 | `9f449ac` | Portada consultando `GET /contenidos/home`. | PR #20 |
| 20/10/2026 | `6047c6d` | `datosDemostracion` desactivado y documentado. | PR #20 |
| 20/10/2026 | `c75bc94` | Registro de la conexión a QA y de los huecos del OpenAPI. | PR #20 |
| 20/10/2026 | `49be70a` | Producción apuntando a QA y encabezados de seguridad en Vercel. | PR #20 |
| 27/10/2026 | `f1e580a` | Imágenes del backend en la portada y catálogo de contenidos. | PR #21 |
| 27/10/2026 | `9cf5a71` | Rol `GESTOR_CONTENIDO` y sesión conservada al recargar. | PR #21 |
| 27/10/2026 | `a6c7c33` | `routerLink` en la acción de `ZonaPanel`. | PR #21 |
| 27/10/2026 | `1038b4a` | Servicio CRUD multipart, selector de imagen y guard. | PR #21 |
| 27/10/2026 | `9f7050a` | Módulo «Contenidos del inicio». | PR #21 |
| 27/10/2026 | `464ea1e` | Documentación del módulo y del contrato CRUD. | PR #21 |
| 29/10/2026 | `360b64f` | Error del correo sin superponerse a la ayuda del campo. | PR #25 |

### Merges de sus propios PR

| Fecha | Commit | Actividad |
|---|---|---|
| 05/10/2026 | `9ccde48` | Merge del PR #15. |
| 06/10/2026 | `45172b0` | Merge del PR #16. |
| 27/10/2026 | `049dace` | Merge del PR #21. |
| 29/10/2026 | `4fd7aca` | Merge del PR #25. |

---

## 7. Corrección de errores e incidencias

| Incidencia atendida | Solución aplicada | Evidencia |
|---|---|---|
| Un número de relleno (`1234567890`) se mostraba como línea de orientación, también en producción. | Teléfonos vacíos mientras no haya dato real y `esTelefonoPublicable()` antes de mostrarlos. | `6c7a9c0`, `876c3f6` |
| `Alt + Q` no funcionaba en macOS y se disparaba con `AltGr + Q`. | Detección por la tecla física (`KeyQ`) y exclusión de `Ctrl + Alt`, que es como Windows reporta `AltGr`. | `a1da3c1` |
| `--color-danger` y `--color-info` apuntaban a variables inexistentes en más de 20 componentes. | Tokens corregidos. | `b775593` |
| Un valor suprimido podía recuperarse restando del total. | Supresión secundaria en el servicio. | `4f84707` |
| El registro de atención guardaba por una ruta equivocada. | Enrutamiento de guardado corregido. | `a18cfde` |
| «Grupo de atención» llegaba vacío a la interfaz. | Datos conservados en las tres capas y campo de solo lectura. | `5fc250d` |
| El selector de rol del modo de prueba no refrescaba el panel y había una entrada de menú duplicada. | Recarga completa al cambiar de rol y entrada duplicada retirada. | `25c8264` |
| El entorno desplegado mostraba cifras simuladas sin aviso y permitía entrar con cuentas de prueba. | Bandera `datosDemostracion` que gobierna todo dato ficticio, en `false` en ambos entornos. | `9923119`, `255b279`, `6047c6d` |
| La sesión del rol `GESTOR_CONTENIDO` se descartaba en cada recarga. | Validación de sesión por nombre y código de rol. | `9cf5a71` |
| Las imágenes de la portada no se veían. | Resolución de la URL contra `apiBaseUrl`, con imagen de respaldo. | `f1e580a` |
| El panel de inicio recargaba la aplicación en cada clic. | `routerLink` en lugar de `href`. | `a6c7c33` |
| El error del correo se superponía a la ayuda del campo en el login. | Ayuda dentro del campo y espacio del mensaje dinámico. | `360b64f` |
| La publicación en Vercel falló por un archivo de más de 100 MB. | Publicación desde una copia limpia del commit. | Despliegue del 27/10 |

---

## 8. Validación técnica al cierre

Las siguientes cifras corresponden a la **suite completa del repositorio**, ejecutada el 31/10/2026 sobre `main` (`f492062`) tras una instalación limpia con `npm ci`. No significan que todas las pruebas del proyecto hayan sido escritas por Jonathan.

| Control | Resultado del 31/10/2026 |
|---|---|
| Pruebas unitarias | 370/370 aprobadas. |
| Cobertura | 51,69 % líneas; 51,19 % declaraciones; 43,44 % funciones; 34,93 % ramas. |
| Build productivo | Exitoso; 1,01 MB bruto y 227,69 kB estimados de transferencia inicial. |
| ESLint | 0 errores y 267 advertencias. |
| Accesibilidad estática | 0 deuda P0 en 26 rutas; pendientes no bloqueantes de estilos. |
| Dependencias productivas | 0 vulnerabilidades reportadas. |

Jonathan creó **17 archivos de prueba** y modificó **10**, con **221 casos de prueba nuevos** en panel de inicio, seguridad de contenido de crisis, módulo de atención, contenidos, autenticación y navegación.

---

## 9. Estado y pendientes

- Los cinco PR reportados quedaron integrados en `main` y publicados en producción de Vercel.
- **Validar con el equipo de atención** los textos de la vista del rol Usuario y las 19 decisiones provisionales de `DECISIONES_PROVISIONALES_VBG.md`.
- **Prueba de punta a punta del módulo de contenidos con un usuario `GESTOR_CONTENIDO` real** (crear con imagen, editar, quitar imagen y eliminar): pendiente.
- **CORS de QA para `localhost:4200`:** pendiente con el equipo de backend; hoy solo se puede probar sobre Vercel.
- **Huecos del backend** (especialidad en el login, catálogos y endpoints del panel): pendientes con el equipo de backend.
- `SeccionSeguimientosComponent` y el modal del presunto agresor no tienen pruebas propias.
- El proyecto de Vercel no se publica automáticamente con cada merge; conectar el repositorio en Vercel evitaría las publicaciones manuales.
- Persisten 267 advertencias de ESLint y deuda no bloqueante de estilos y accesibilidad.
- Las actas de reuniones, demostraciones y validaciones con usuarios no se incluyen como ejecutadas sin su soporte documental.

---

## 10. Conclusión

Durante octubre de 2026, Jonathan reorganizó el panel de inicio por rol con contenido de crisis seguro y una vista informada en trauma, y estandarizó el módulo Equipo de Atención contra la matriz VBG. Además, conectó el frontend al backend QA, construyó el módulo de administración de contenidos de la portada para el rol `GESTOR_CONTENIDO`, corrigió la portada y el login, y llevó las versiones de `main` a producción en Vercel. Las pruebas sobre el despliegue sirvieron para validar los cambios del equipo y reportar errores del backend. El trabajo quedó respaldado por commits identificables, 221 casos de prueba nuevos y la ejecución satisfactoria de los controles técnicos del repositorio.
