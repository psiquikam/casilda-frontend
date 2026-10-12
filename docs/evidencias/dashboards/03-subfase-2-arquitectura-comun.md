# Subfase 2 — Arquitectura común del panel (zonas Z1–Z6)

> **Fecha:** 4 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards`.
> **Diagnóstico de origen:** `docs/evidencias/dashboards/00-diagnostico-y-plan.md`.
> **IDs cubiertos:** DSH-01-03 · DSH-01-05 · DSH-04-01 · DSH-04-02 · DSH-04-03 · DSH-04-04 ·
> DSH-07-01…05 · DSH-11-01…05 · DSH-11-09 · DSH-11-11 · DSH-12-01…10.
>
> **Alcance:** el panel del **personal** (Admin, Coordinación, Profesional, Revisión).
> La vista del rol Usuario queda intacta: se rediseña completa en la Subfase 4 con enfoque
> informado en trauma, y hacerla a medias ahora sería peor que dejarla como está.

---

## Resultado

| ID | Estado | Evidencia |
|----|--------|-----------|
| DSH-04-01 | **CUMPLE** | El panel ya no duplica la navegación: fuera la grilla de 13 módulos, las tarjetas «Gestión del Sistema», las tres pestañas y el buscador. Prueba: `dashboard-home.component.spec.ts` → «el personal ya no ve la grilla de módulos ni las pestañas». |
| DSH-01-03 | **CUMPLE** | El conmutador de disposición sale del área principal; ya existía en el menú de usuario. Prueba: «ninguna vista conserva el buscador ni el conmutador». |
| DSH-01-05 | **CUMPLE** | El buscador se retira. No se sustituye por una paleta de comandos: habría tenido que escuchar `Escape`, que es disparador de la salida rápida (DSH-06-01). Ver «Decisiones». |
| DSH-01-04 | **CUMPLE** | El saludo usa nombre de pila (`panel-inicio.component.ts` → `calcularNombreCorto`). |
| DSH-04-02 | **CUMPLE** | Los textos «¿Qué es? / ¿Cuándo usarlo?» salen del inicio y pasan a Z6. |
| DSH-04-03 | **CUMPLE** | `core/navegacion/catalogo-navegacion.ts`: un nombre, un ícono y una ruta por módulo. Pruebas que impiden que vuelvan a divergir. |
| DSH-04-04 | **CUMPLE** | Ícono único por módulo, verificado por prueba. «Reportar caso» vuelve a ser exclusivo del rol Usuario. |
| DSH-07-01 | **CUMPLE** | Z2 antes que Z3 en el registro; prueba sobre los cuatro roles de personal. |
| DSH-07-02 | **CUMPLE** | Estado vacío con mensaje propio por zona («No tienes pendientes para hoy»). |
| DSH-07-03 | **CUMPLE** | «Ruta del caso» y protocolos pasan a Z6 colapsable, recordada en `casilda_panel_ayuda_abierta`. |
| DSH-07-04 | **CUMPLE** | `ZonaPanelComponent` aporta carga (esqueleto), vacío y error con reintento a **todas** las zonas. |
| DSH-07-05 | **CUMPLE** | En móvil las zonas se apilan en el mismo orden; las tablas desplazan dentro de su contenedor. |
| DSH-11-01 | **CUMPLE** | Botón ⓘ con `aria-label` contextual, `mat-icon` con `aria-hidden`, y la definición también en texto `.visually-hidden`: `matTooltip` no es nombre accesible. |
| DSH-11-02 | **CUMPLE** | Los porcentajes declaran denominador (`IndicadorDto.denominador`). |
| DSH-11-03 | **CUMPLE** | La tarjeta es clicable **solo** si tiene `ruta`. |
| DSH-11-04 | **CUMPLE** | Etiquetas en tipo oración; prueba sobre el catálogo. |
| DSH-11-05 | **CUMPLE** | `KpiCardComponent` nuevo, con los tokens de superficie, borde, radio y sombra de las tarjetas existentes. |
| DSH-11-09 | **CUMPLE** | Un `h1` por vista, un `h2` por zona. Probado. |
| DSH-11-11 | **CUMPLE** | Z6 con `aria-expanded` + `inert` en el contenido oculto. |
| DSH-12-01 | **CUMPLE** | El registro se indexa por los **cinco roles reales** de `AuthService`, no por las secciones del menú. |
| DSH-12-02 | **CUMPLE** | `core/dashboard/dashboard-por-rol.ts`: un solo lugar decide qué ve cada rol; el orden del registro es el orden visual. |
| DSH-12-03 | **CUMPLE** | Cada widget es standalone y pide sus datos a un servicio, no por `@Input`. |
| DSH-12-04 | **CUMPLE** | `DashboardMetricasService` y `DashboardTrabajoService`, con DTO tipado y endpoint previsto documentado, siguiendo `ContenidoHomeService`. |
| DSH-12-05 | **CUMPLE** | Todo `subscribe()` maneja `next` y `error`; los errores pasan por `NotificacionService`. |
| DSH-12-06 | **CUMPLE** | Los mocks cuadran (88+36+24+8 = 156) y las fechas son relativas a hoy (`diasDesdeHoy`). |
| DSH-12-07 | **CUMPLE** | Sin datos personales: radicado e iniciales. Probado con expresión regular sobre las iniciales. |
| DSH-12-08 | **CUMPLE** | Franja «Datos de demostración» tras `environment.datosDemostracion`. |
| DSH-12-09 | **CUMPLE** | Latencia simulada y error forzable (`window.casildaForzarErrorPanel`). |
| DSH-12-10 | **CUMPLE** | No se introdujo ningún `alert`/`confirm`. |
| DSH-04-08 | **NO EJECUTADO** | Ver «Decisiones», punto 4. |

---

## Qué cambia en pantalla

El panel del personal pasa de **una pantalla saturada con cinco vías de navegación** a seis
zonas con una jerarquía explícita:

```
Franja «Datos de demostración»
Z1  Hola, Elena · domingo, 4 de octubre de 2026
Z2  Atención requerida      ← lo accionable primero
Z3  Indicadores clave       ← máx. 4, con periodo, corte y denominador
Z4  Vista principal del rol ← distribución · agenda · carga del equipo
Z5  Accesos frecuentes      ← máx. 4, desde el catálogo
Z6  Ayuda y protocolos      ← colapsable
```

Lo que desapareció del inicio: la grilla de 13 módulos, las tres pestañas, el buscador de
ancho completo, el conmutador de disposición y las tarjetas «Gestión del Sistema». El menú
lateral vuelve a ser la única navegación primaria (DSH-P4).

Cada rol ve ahora su propia vista principal: Admin y Revisión la distribución por identidad
de género, Profesional su agenda del día, Coordinación la carga del equipo.

---

## Decisiones que conviene revisar

**1. El buscador se retiró y no se sustituyó por una paleta de comandos.** El contrato
ofrecía ambas opciones (DSH-01-05). Una paleta de comandos tendría que escuchar `Escape`
para cerrarse, y **el doble `Escape` es un disparador de la salida rápida**
(DSH-06-01). Antes que arriesgar la función más crítica de la interfaz por un atajo de
conveniencia, se retiró el buscador: el menú lateral ya lleva a los mismos destinos. Si el
equipo quiere la paleta, hay que resolver antes cómo convive con el doble `Escape`.

**2. Los nombres del catálogo son provisionales.** **[PENDIENTE P-07]** sigue abierto. Se
sembró el catálogo con los nombres del **menú lateral**, por ser la navegación primaria y
por tanto la referencia más autorizada hoy. Lo que esta subfase sí resuelve es que ahora
hay **un solo lugar** donde cambiarlos: cuando el equipo confirme los oficiales, solo se
toca `catalogo-navegacion.ts`.

**3. El rol se resuelve al construir el componente, no con señales.**
`AuthService.currentUser` es una propiedad plana, así que un `computed()` sobre ella nunca
se recalcularía — un `computed` ahí habría dado falsa sensación de reactividad. Y no hace
falta: cambiar de rol pasa por `loginAsMock()`, que navega a `/inicio` y vuelve a crear el
componente. Queda documentado en el código y fijado por prueba.

**4. DSH-04-08 (scroll anidado) no se ejecutó.** El plan ya lo marcaba como evaluable
aparte. Pasar el scroll del shell al documento toca `app.component.scss` y afecta a las 23
rutas y a la salida rápida fija. El riesgo no se justifica dentro de una subfase que ya
reescribe el panel entero. **Queda documentado y pendiente de decisión**, no olvidado.

**5. El SCSS del panel antiguo se podó.** Al mover el personal al panel nuevo, 53 de 67
bloques quedaron sin uso: `dashboard-home.component.scss` pasa de **2184 a 527 líneas**,
conservando solo lo que la vista del rol Usuario necesita.

**6. Hallazgo nuevo: el saludo decía «Hola, Dra.».** El nombre de pila se tomaba como el
primer token del nombre completo, y los nombres del equipo empiezan por el tratamiento
(«Dra. Elena Ramos»). Corregido saltando tratamientos conocidos, con prueba.

---

## Archivos

**Nuevos**

| Archivo | Qué aporta |
|---|---|
| `core/navegacion/catalogo-navegacion.ts` (+ spec) | Un nombre, ícono y ruta por módulo (DSH-04-03). |
| `core/dashboard/dashboard-por-rol.ts` (+ spec) | Registro de widgets por rol (DSH-12-02). |
| `services/dashboard-mock.ts` | Latencia, error forzable y fechas relativas (DSH-12-09). |
| `services/dashboard-metricas.service.ts` | Indicadores, distribución y carga del equipo. |
| `services/dashboard-trabajo.service.ts` | Pendientes y agenda del día. |
| `components/dashboard/panel-inicio.component.*` (+ spec) | Contenedor Z1–Z6. |
| `components/dashboard/zona-panel/*` | Zona con carga, vacío y error (DSH-07-04). |
| `components/dashboard/kpi-card/*` | Tarjeta de indicador (DSH-11-01…05). |
| `components/dashboard/widgets/*.widget.ts` + `widgets.scss` | Siete widgets standalone. |

**Modificados:** `dashboard-home.component.{ts,html,scss,spec.ts}` (pasa a repartir entre
las dos vistas), `environment.ts` y `environment.prod.ts` (`datosDemostracion`).

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run build` | Pasa, sin errores. |
| `npm run test:ci` | **206 de 207.** El único fallo es `RegisterComponent`, **preexistente** (ver reporte 01). Se añadieron **38 casos nuevos**. |
| `npm run a11y:audit` | Sin deuda nueva: **0 literales de color** en los 4 SCSS nuevos (29 de 66 archivos, frente a 29 de 62 antes). |
| `npm run lint` | **302 warnings, los mismos de siempre**: 0 nuevos. Sigue por encima del tope de 299 por la causa preexistente `d3066e0`. |
| Revisión en navegador | Rol Coordinación a 1440 px: franja de demostración, Z1–Z4 visibles, radicado e iniciales en los pendientes, corte en cada indicador. |

### Pruebas nuevas destacadas

- El catálogo **no repite nombres ni íconos** y escribe en tipo oración.
- Todo rol de personal pone `pendientes` **antes** que `kpis`.
- Cada rol tiene **una sola** vista principal.
- Nunca más de 4 indicadores ni más de 5 pendientes.
- La zona muestra esqueleto con `aria-busy`, estado vacío amable y estado de error con
  reintento.
- Las iniciales cumplen el formato `X. Y.`: ningún nombre completo en vistas de resumen.

---

## Pendientes para el equipo

- **[P-07]** Nombres oficiales de módulo. El catálogo ya existe; falta confirmar su contenido.
- **[P-03]** Paleta `--color-data-*`. Las series siguen con los alias complementarios.
- **[P-05]** Categorías de identidad de género, hoy provisionales en el servicio.
- **[P-06]** Umbral de supresión de celdas pequeñas: la distribución aún muestra una
  categoría con 8 casos, y en cuanto se añadan filtros habrá riesgo de reidentificación
  (DSH-03-04).
- **[P-11]** ¿El Admin accede al contenido de los casos o solo a agregados? Determina si su
  Z2 puede listar radicados.
- **[DSH-04-08]** Decidir si se aborda el scroll del shell en una tarea propia.
- **[DSH-01-05]** ¿Se quiere paleta de comandos? Requiere resolver antes su convivencia con
  el doble `Escape` de la salida rápida.
- **[lint]** Sigue sin decidirse si se corrigen los tres warnings de `d3066e0` o se ajusta
  el tope. `npm run check` no pasa en verde por esto.
