# INFORME DE DOCUMENTACIÓN TÉCNICA FRONT-END

**Proyecto:** Sistema CASILDA  
**Responsable de las actividades documentadas:** **Jonathan Cardona Calderón** (`jcardonamde`)  
**Período:** **1 al 31 de octubre de 2026**  
**Repositorio:** `psiquikam/casilda-frontend`  
**Stack verificado:** Angular 21.2.25, Angular Material 21.2.14, TypeScript 5.9.3, RxJS 7.8.2 y Node.js 20.19.1  

---

## 1. Objetivo y alcance

Este informe documenta los cambios técnicos realizados por Jonathan durante octubre de 2026 en las ramas `feature/04/010/casilda/optmizacion-dashboards` (PR #15 y #16), `chore/05/013/casilda/integracion-backend-aws` (PR #20), `feature/05/014/casilda/ui-perfil-contenidos` (PR #21) y `feature/05/015/casilda/ajuste-validacion-login` (PR #25). Incluye componentes, servicios, reglas, contratos, configuración de entornos y de despliegue, pruebas y procedimientos de verificación.

También documenta el procedimiento de publicación en Vercel y la configuración del backend QA verificada durante las pruebas de integración. Las funcionalidades de otros integrantes que Jonathan integró o publicó no se presentan como autoría suya.

---

## 2. Arquitectura intervenida

Los cambios conservaron la arquitectura del proyecto: componentes standalone con `ChangeDetectionStrategy.OnPush`, señales y `computed`, formularios reactivos tipados, servicios con `HttpClient`, rutas con carga diferida (`loadComponent`) y tokens de diseño en `src/styles/_tokens.scss`. Las reglas de negocio sensibles quedaron como funciones puras en `core/`, separadas de las vistas, para poder probarlas sin Angular.

```text
src/app/
├── core/
│   ├── contenidos/                   (nuevo) Reglas compartidas de portada y gestión
│   ├── dashboard/dashboard-por-rol.ts (nuevo) Único registro de widgets por rol
│   ├── navegacion/
│   │   ├── catalogo-navegacion.ts     (nuevo) Único nombre, ícono y ruta por módulo
│   │   └── cambios-sin-guardar.guard.ts  (nuevo) canDeactivate reutilizable
│   ├── security/telefono-crisis.ts    (nuevo) Teléfonos de crisis publicables
│   ├── vigilancia/supresion-celdas.ts (nuevo) Supresión de conteos identificables
│   ├── vbg/ultima-profesional-activa.ts (nuevo) Alerta de cierre de seguimiento
│   └── catalogos/catalogo-vbg.ts      Códigos y etiquetas de la matriz VBG
├── components/
│   ├── dashboard/                     (nuevo) Panel por zonas, KPI y widgets
│   ├── dashboard-usuario/             (nuevo) Vista del rol Usuario
│   ├── seccion-presunto-agresor/      (nuevo) Compartido entre registro de caso y de atención
│   ├── seccion-apreciaciones/         (nuevo) Compartido entre registro de caso y de atención
│   ├── seccion-seguimientos/          (nuevo) Seguimientos por especialidad
│   ├── gestion-contenidos/            (nuevo) Módulo /gestion-contenidos
│   ├── selector-imagen/               (nuevo) Carga de imagen reutilizable
│   ├── registro-caso/ · registro-atencion/  Estandarización VBG
│   ├── casilda-card/ · casilda-home/  Portada pública
│   ├── quick-exit/                    Salida rápida
│   └── auth/login/                    Mensajes de validación
├── services/
│   ├── dashboard-metricas · dashboard-trabajo · vigilancia · mi-proceso  (nuevos)
│   ├── maestros-vbg · registro-vbg-datos · casos-simulados               (nuevos)
│   ├── contenido-admin.service.ts     (nuevo) CRUD multipart
│   ├── contenido-home.service.ts      Consulta pública de la portada
│   └── auth.service.ts                Rol GESTOR_CONTENIDO, sesión y cuentas de prueba
└── app.routes.ts
```

---

## 3. Panel de inicio por rol (PR #15)

Contrato: `docs/contratos/DASHBOARDS_POR_ROL.md`. Diagnóstico y reportes por subfase: `docs/evidencias/dashboards/00` a `05`.

### Arquitectura por zonas

`PanelInicioComponent` arma el panel en zonas Z1 a Z6 a partir de `DASHBOARD_POR_ROL`, el **único lugar** donde se decide qué widgets ve cada rol; el orden del registro es el orden visual. Cada zona usa `ZonaPanelComponent`, que aporta el encabezado `h2` y los estados de carga, vacío y error con reintento. `CATALOGO_MODULOS` centraliza nombre, ícono y ruta de cada módulo para el menú, el panel y los títulos de ruta.

| Pieza | Responsabilidad |
|---|---|
| `KpiCardComponent` | Indicador con etiqueta, definición accesible, periodo, denominador y fecha de corte. |
| `DashboardMetricasService` · `DashboardTrabajoService` · `VigilanciaService` · `MiProcesoService` | Fuentes de datos con DTO tipado, endpoint previsto, y latencia y error simulables. |
| `PanelUsuarioComponent` | Vista del rol Usuario: estado del proceso, próxima sesión, acuerdos, contacto y líneas de ayuda, sin cifras ni relato de hechos y sin escribir en `localStorage`. |

### Reglas de seguridad del contenido

| Regla | Archivo | Comportamiento |
|---|---|---|
| Teléfono publicable | `core/security/telefono-crisis.ts` | `esTelefonoPublicable()` rechaza vacíos, textos de relleno, repeticiones y rachas consecutivas de 7 o más dígitos. Si el teléfono no es publicable, la línea no se muestra. |
| Supresión de celdas pequeñas | `core/vigilancia/supresion-celdas.ts` | Oculta conteos por debajo del umbral (5) en vistas filtradas y aplica supresión secundaria. Se aplica **en el servicio**, no en la vista. |
| Salida rápida | `QuickExitComponent` | `Alt + Q` por la tecla física (`KeyQ`), de modo que funciona en macOS (donde `Option + Q` produce «œ»), y se excluye `Ctrl + Alt`, que es como Windows reporta `AltGr`. |

### Tokens corregidos

`--color-danger` y `--color-info` apuntaban a variables inexistentes, lo que afectaba a más de 20 componentes fuera del panel. Se corrigieron en `_tokens.scss`, y el panel y el encabezado quedaron con 0 colores literales.

---

## 4. Estandarización del módulo Equipo de Atención (PR #15 y #16)

Contrato: `docs/contratos/MATRIZ_MODULO_ATENCION_VBG.md`, con `GLOSARIO_VBG.md` y `DECISIONES_PROVISIONALES_VBG.md`. Reportes por subfase: `docs/evidencias/estandarizacion-vbg/00` a `05`.

| Subfase | Cambio técnico |
|---|---|
| M1 | `MaestrosVbgService` (catálogos con respaldo tipado y aviso si el backend falla), `RegistroVbgDatosService` (citas y casos paginados) y `CasosSimuladosService` (datos ficticios del modo de demostración). Catálogo único `catalogo-vbg.ts`. |
| M2 | Filtro VBG como primer campo; validación condicional de ámbito y forma de ocurrencia; relación misional e institucional en dos niveles con al menos una opción marcada. |
| M3 | `SeccionPresuntoAgresorComponent` y `SeccionApreciacionesComponent`, compartidos entre `RegistroCasoComponent` y `RegistroAtencionComponent` en lugar de duplicar la plantilla; campo «¿Cuál?» para vínculo «Otro»; corrección del enrutamiento de guardado en registro de atención. |
| M4 | Rutas internas y externas como dos grupos de casillas; `SeccionSeguimientosComponent` aísla los seguimientos por especialidad; `esUltimaProfesionalActiva()` alerta antes de dejar una especialidad sin profesional activa; confirmación antes de vaciar rutas o remisiones. |
| M5 | «Grupo de atención» se perdía en `aCitaDto()`, `aCasoDto()` y los mapeadores de tabla; ahora llega a la interfaz como campo de solo lectura, sin `FormControl`. Terminología del rol Usuario alineada con las decisiones provisionales. |

Corrección colateral de navegación (`25c8264`): `router.navigate(['/inicio'])` no tiene efecto cuando ya se está en `/inicio`, de modo que cambiar de rol en el modo de prueba no refrescaba el panel. Se reemplazó por una recarga completa. También se retiró una entrada duplicada de «Auditoría de casos» en el menú.

---

## 5. Integración con el backend QA (PR #20)

### Entornos

| Archivo | `apiBaseUrl` | `datosDemostracion` |
|---|---|---|
| `environment.ts` | `https://casildaqa.duckdns.org/api-casilda` | `false` |
| `environment.prod.ts` | `https://casildaqa.duckdns.org/api-casilda` | `false` |

El PR #23 (de otra integrante) cambió después el `apiBaseUrl` de desarrollo a `/api-casilda` para usar un proxy local. El entorno de producción, que es el que usa Vercel, conserva la URL de QA.

### Bandera `datosDemostracion`

Antes de este cambio, con la bandera en `false` solo se ocultaba la franja «Datos de demostración»: el panel seguía mostrando cifras simuladas sin aviso y las cuentas de prueba seguían activas en producción. Ahora la bandera gobierna todo dato ficticio:

- `AuthService`: sin la bandera, las cuentas de prueba no inician sesión y una sesión de prueba guardada se descarta;
- `LoginComponent` y `HeaderComponent`: ocultan el acceso rápido y el selector de rol de prueba;
- `DASHBOARD_POR_ROL`: la lista `WIDGETS_SIN_BACKEND` reúne los widgets cuyo endpoint no existe, que no se muestran sin la bandera;
- `PanelUsuarioComponent`: no consulta `MiProcesoService`, que no tiene endpoint;
- `ContenidoHomeService`: consulta `GET /contenidos/home` en lugar del mock.

### Encabezados de seguridad

`vercel.json` define la compilación (`npm ci` y `npm run build`), la salida `dist/casilda-fnsp/browser`, la redirección de todas las rutas a `index.html` y cuatro encabezados:

| Encabezado | Valor |
|---|---|
| `Referrer-Policy` | `no-referrer` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

`Referrer-Policy: no-referrer` evita que la dirección visitada, que puede revelar que alguien consulta un sistema de atención de VBG, viaje a otros sitios.

---

## 6. Módulo «Contenidos del inicio» (PR #21)

### Rol y acceso

El backend define el rol `GESTOR_CONTENIDO` (rol_id 6). El login devuelve el **nombre** del rol en `rol` («Gestor de contenidos») y el **código** en `roles` (`GESTOR_CONTENIDO`). `AuthService` solo revisaba `rol`, por lo que degradaba al gestor a `USUARIO` y descartaba su sesión en cada recarga.

| Cambio en `AuthService` | Propósito |
|---|---|
| Constante `ROLES_CASILDA` | Lista única de los seis roles válidos. |
| Normalización del rol (hoy `normalizarCodigoRol()`) | Traduce el nombre o el código que envía el backend al código interno, sin distinguir mayúsculas. |
| `isValidSession()` | Revisa `rol` y `roles` contra `ROLES_CASILDA`. |
| `isGestorContenido()` | Visibilidad del módulo en menús y panel. |

### Rutas

| Ruta | Título | Protección |
|---|---|---|
| `/gestion-contenidos` | Contenidos del inicio | `roleGuard` (`GESTOR_CONTENIDO`; `ADMIN` también accede) |
| `/gestion-contenidos/nuevo` | Nuevo contenido del inicio | `roleGuard` y `cambiosSinGuardarGuard` |
| `/gestion-contenidos/:id` | Editar contenido del inicio | `roleGuard` y `cambiosSinGuardarGuard` |

### Contrato consumido

| Método | Ruta | Uso en el frontend |
|---|---|---|
| `GET` | `/contenidos?page&size` | Listado completo: primera página de 100 y, si hay más, las demás en paralelo (`forkJoin`). |
| `GET` | `/contenidos/{id}` | Carga del editor. |
| `POST` | `/contenidos` | Creación: `multipart/form-data` con la parte `contenido` (JSON con `Content-Type: application/json`) y la parte opcional `imagen`. |
| `PUT` | `/contenidos/{id}?eliminarImagen=` | Edición. Sin archivo ni `eliminarImagen=true`, la imagen actual se conserva. |
| `DELETE` | `/contenidos/{id}` | Borrado lógico, con confirmación. |
| `GET` | `/contenidos/home` | Portada pública. |

### Manejo de errores

El backend responde los errores `400` en dos formatos: `{ message, validationErrors: { campo: mensaje } }` para la validación de anotaciones y `{ message }` para las reglas de vigencia e imagen. `interpretarErrorContenido()` los traduce a un mensaje general y a mensajes por campo, que el editor muestra junto a cada control y en el resumen de errores accesible. También interpreta los estados `0` (sin conexión), `403`, `404` y `413`.

### Reglas de negocio

- **Vigencia:** el estado se calcula con la misma regla de la portada (publicado, programado o vencido). Las fechas se piden por día: el inicio queda a las 00:00 y el fin a las 23:59:59, hora local. Si el día no cambia, se conserva el instante original.
- **Imagen:** PNG, WEBP o SVG de máximo 400 KB, validado en el cliente antes de enviar; el SVG lo sanea el backend.
- **Enlace:** solo rutas públicas de la aplicación (`DESTINOS_ENLACE`).
- **Posición:** el editor sugiere la siguiente posición libre de la sección.
- **Caché:** `GET /contenidos/home` responde `Cache-Control: max-age=300, public`, así que un cambio puede tardar hasta 5 minutos en verse en la portada. El listado lo advierte.

### Componentes

| Componente | Responsabilidad |
|---|---|
| `GestionContenidosComponent` | Listado por sección con `ZonaPanelComponent`, filtro por estado (`aria-pressed`) y estados de carga, vacío y error. |
| `ContenidoItemComponent` | Fila presentacional: estado, fechas, destino, posición y última edición. |
| `EstadoVigenciaComponent` | Insignia con ícono y texto; el color nunca es el único portador de significado. |
| `EditorContenidoComponent` | Formulario en cuatro bloques, vista previa en vivo con `CasildaCardComponent` y protección de cambios sin guardar. |
| `SelectorImagenComponent` | Componente controlado: el padre es dueño del archivo y de la URL temporal, que se libera al destruirse. |

---

## 7. Portada pública y panel (PR #21)

| Problema | Causa | Solución |
|---|---|---|
| Ninguna imagen subida por el gestor se veía. | El backend devuelve rutas relativas a la API y el navegador las pedía al dominio del frontend. | `resolverImagenContenido()` las resuelve contra `apiBaseUrl`; si falta o falla, usa el distintivo de Casilda. |
| Un `enlace` inválido navegaba a una ruta inexistente. | No se validaba el enlace. | `esEnlaceInterno()` solo acepta rutas internas. |
| Títulos de sección duplicados entre portada y gestión. | Textos sueltos en cada componente. | Catálogo único `SECCIONES_CONTENIDO`. |
| Cada clic en una acción del panel recargaba la aplicación. | `ZonaPanelComponent` usaba `href`. | `routerLink` con parámetros de consulta. |

La imagen de la tarjeta declara `width`, `height`, `loading="lazy"` y `decoding="async"`, para no desplazar el contenido mientras carga.

---

## 8. Corrección del login (PR #25)

La ayuda «Correo registrado en CASILDA.» estaba en un párrafo fuera del campo con margen negativo, que la subía al espacio del mensaje de error. Material reserva para ese espacio el alto de una sola línea, y el error del correo ocupa dos, por lo que ambos textos se superponían.

| Cambio | Efecto |
|---|---|
| Ayuda en `<mat-hint>` dentro del campo | Material la asocia al input (`aria-describedby`) y la reemplaza por el error mientras este se muestra. |
| `subscriptSizing="dynamic"` en correo y contraseña | El espacio del mensaje crece con su contenido y empuja lo que sigue. |
| Margen entre campos en el SCSS del componente | Conserva la separación, ya que el modo dinámico no reserva alto. |

---

## 9. Publicación en Vercel

| Dato | Valor |
|---|---|
| Proyecto | `casilda-preview` |
| Dominio de producción | `https://browser-rho-two.vercel.app` |
| Publicación automática por Git | No configurada; la publicación es manual. |

### Script de publicación (PR #16)

`tools/deploy-vercel.mjs`, con los scripts `npm run deploy:vercel:preview` y `npm run deploy:vercel`, compila en local y sube la carpeta compilada. Como `ng build` borra `dist/` en cada compilación, el script restituye el enlace `.vercel` y copia `vercel.json` a la carpeta de salida, para conservar la redirección de la aplicación de una sola página. Con este script se publicó entre el 6 y el 20 de octubre.

### Publicación desde una copia limpia

Del 27 al 30 de octubre se compiló en Vercel a partir de una copia limpia de cada commit de `main`:

```bash
git fetch origin
# Copia limpia del commit de main, sin caché ni archivos locales
git archive <commit-de-main> | tar -x -C <carpeta-temporal>
cp -r .vercel <carpeta-temporal>/
cd <carpeta-temporal>
vercel --prod --yes
```

Se adoptó este procedimiento porque la carpeta de trabajo incluye la caché de Angular (`.angular/`, con archivos de hasta 294 MB), y Vercel rechaza archivos de más de 100 MB. Además, garantiza que solo se publique lo versionado.

Después de cada publicación se verifica:

1. que el sitio sirva un bundle nuevo;
2. que el código publicado apunte a `https://casildaqa.duckdns.org/api-casilda`;
3. que el backend acepte el dominio de Vercel en el preflight CORS, incluidas las peticiones con `Authorization`.

---

## 10. Configuración del backend QA verificada

| Verificación | Resultado |
|---|---|
| Preflight desde `https://browser-rho-two.vercel.app` (`/auth/login`, `PUT /contenidos/{id}` con `Authorization`, `/auth/register`) | `200` con `Access-Control-Allow-Origin` del dominio. |
| Preflight desde `http://localhost:4200` | `403`; no se puede probar contra QA desde el servidor local. |
| `GET /contenidos/home` | `200` con `Cache-Control: max-age=300, public`; la respuesta no trae indicios de caché intermedia (`Age`, `X-Cache`). |
| `GET /auth/vinculos-udea` | `200`. |

Huecos del backend registrados en `CLAUDE.md` (pendiente 13) y reportados al equipo de backend:

- el login no devuelve la especialidad del usuario, requisito del aislamiento por especialidad de `SeccionSeguimientosComponent`;
- no existen los catálogos `/maestros/ambito-ocurrencia`, `rutas-internas`, `rutas-externas`, `especialidades-seguimiento` ni `acciones-seguimiento`, de modo que `MaestrosVbgService` cae a su respaldo;
- no existen `/dashboard/*`, `/vigilancia/*` ni el endpoint de «mi proceso», por lo que esos widgets están en `WIDGETS_SIN_BACKEND`.

---

## 11. Trazabilidad técnica

| Commit | Alcance técnico |
|---|---|
| `6c7a9c0` · `876c3f6` | `telefono-crisis.ts`; teléfonos vacíos en los entornos; pie público, portada y panel. |
| `a1da3c1` | `Alt + Q` por tecla física y exclusión de `AltGr` en `QuickExitComponent`. |
| `e1e9db3` · `93a7b6b` | Contrato de dashboards, diagnóstico, reportes de subfase y `CLAUDE.md`. |
| `5609a5d` | Retiro de imágenes obsoletas de la documentación de pruebas. |
| `b775593` | Tokens de color, fechas es-CO y encabezado. |
| `b09d09d` | Zonas Z1–Z6, `DASHBOARD_POR_ROL`, `CATALOGO_MODULOS`, `KpiCardComponent` y servicios del panel. |
| `4f84707` | `VigilanciaService`, vista analítica y `supresion-celdas.ts`. |
| `a4ab1a0` | `PanelUsuarioComponent` y `MiProcesoService`. |
| `be4ad35` · `add8c9b` | M1 y M2: servicios del modo de demostración, catálogo VBG y clasificación del hecho. |
| `a18cfde` · `44df23e` · `5fc250d` | M3 a M5: secciones compartidas, seguimientos por especialidad, `ultima-profesional-activa.ts` y grupo de atención. |
| `d13f778` · `41c1d2a` · `e36d545` | Matriz VBG, glosario, decisiones provisionales, contrato del home, documento de diseño y `AGENTS.md`. |
| `cca4048` | Opción de registro en la navegación pública y el login. |
| `25c8264` | Refresco del rol de prueba y entrada duplicada del menú. |
| `f7ad1d1` | `tools/deploy-vercel.mjs` y scripts de `package.json`. |
| `4765349` | `apiBaseUrl` de desarrollo hacia QA. |
| `9923119` | Cuentas de prueba condicionadas en `AuthService`, login y encabezado. |
| `255b279` | `WIDGETS_SIN_BACKEND` y panel del rol Usuario sin `MiProcesoService`. |
| `9f449ac` | `ContenidoHomeService` sobre `GET /contenidos/home`. |
| `6047c6d` | `datosDemostracion` en `false` y documentado. |
| `c75bc94` | Conexión a QA y huecos del OpenAPI en `CLAUDE.md`. |
| `49be70a` | Producción hacia QA, encabezados de seguridad y script de despliegue. |
| `f1e580a` | `core/contenidos`, imágenes de la portada y enlaces internos. |
| `9cf5a71` | Rol `GESTOR_CONTENIDO` en `AuthService`. |
| `a6c7c33` | `routerLink` en `ZonaPanelComponent`. |
| `1038b4a` | `ContenidoAdminService`, `SelectorImagenComponent` y `cambiosSinGuardarGuard`. |
| `9f7050a` | Módulo `/gestion-contenidos`, rutas y menús. |
| `464ea1e` | Contrato §8.1 y `CLAUDE.md`. |
| `360b64f` | Mensajes de validación del login. |
| `9ccde48` · `45172b0` · `049dace` · `4fd7aca` | Merges de los PR #15, #16, #21 y #25. |

---

## 12. Resultado de verificación

Resultados de `main` (`f492062`) al 31 de octubre, después de `npm ci`:

| Control | Resultado |
|---|---|
| Suite completa | 370/370 pruebas aprobadas. |
| Build | Exitoso; 1,01 MB bruto y 227,69 kB estimados. |
| ESLint | 0 errores y 267 advertencias. |
| Accesibilidad P0 | 0 hallazgos bloqueantes. |
| Auditoría de producción | 0 vulnerabilidades. |

Estas cifras validan el estado del repositorio completo; no se atribuye a Jonathan la autoría de la totalidad de la suite.

---

## 13. Pendientes

1. Validar con el equipo de atención los textos de la vista del rol Usuario y las 19 decisiones de `DECISIONES_PROVISIONALES_VBG.md`.
2. Definir la paleta de datos (`--color-data-*`), el umbral oficial de supresión (hoy 5) y los nombres oficiales de módulo del catálogo de navegación.
3. Probar de punta a punta el módulo de contenidos con un usuario `GESTOR_CONTENIDO` real de QA.
4. Habilitar en QA el origen `http://localhost:4200` para poder probar desde el entorno local.
5. Resolver con backend la especialidad en el login, los catálogos faltantes y los endpoints del panel.
6. Unificar `PagedResponseDto<T>`, hoy declarado en tres servicios.
7. Decidir si `SidebarComponent` y `HorizontalNavComponent` deben consumir `CATALOGO_MODULOS`.
8. Conectar el repositorio al proyecto de Vercel para publicar automáticamente cada merge en `main`.

---

## 14. Conclusión

La documentación técnica de octubre acredita el trabajo directo de Jonathan en el panel de inicio por rol, la estandarización del módulo Equipo de Atención, la integración con el backend QA, el módulo de administración de contenidos de la portada, las correcciones de la portada y del login, y la publicación en Vercel. Los cambios respetaron la arquitectura standalone del proyecto, aislaron las reglas sensibles en funciones puras probadas y quedaron respaldados por contratos versionados y la ejecución satisfactoria de los controles de calidad.
