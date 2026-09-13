# Plan de accesibilidad — Casilda (frontend)

> **Estado:** diagnóstico estático realizado el **6 de septiembre de 2026** sobre la rama `main`
> (commit `0c9aea3`). **Fases 0.3, 1, 2, 3 y 5 ejecutadas y Fase 4 en su mayor parte el
> 11 de septiembre de 2026** en la rama `feature/02/006/casilda/accessibility-improvements`;
> los tres hallazgos P0 quedaron en cero. El estado por tarea está en la columna «Estado» de
> las tablas del §4 y la medición en el §6; el detalle de la implementación, en
> `01-fases-1-5-correcciones.md`. Documento vivo: cada tarea cerrada se marca aquí con su evidencia.
>
> **Objetivo de conformidad:** **WCAG 2.2 nivel AA** en las tres áreas del producto
> (pública, back-office y administración).
>
> **Alcance del diagnóstico:** 60 componentes standalone, 20 rutas, 55 hojas SCSS.
> **Fuera del alcance por ahora:** validación con lectores de pantalla reales y auditoría
> automatizada en ejecución (axe / Lighthouse). Ambas son la Fase 0 de este plan — hasta
> ejecutarlas, los hallazgos aquí listados son los detectables por análisis estático del código.

---

## 1. Por qué esto no es opcional en Casilda

Hay tres razones que se refuerzan entre sí, y conviene tenerlas presentes al priorizar:

1. **Obligación legal.** La Universidad de Antioquia es una entidad pública colombiana. La
   **Resolución 1519 de 2020 del MinTIC** (Anexo 1, *Directrices de accesibilidad web*) exige
   a los sujetos obligados cumplir **NTC 5854 / WCAG 2.1 nivel AA**. WCAG 2.2 AA es un
   superconjunto compatible: cumplirlo satisface la norma y anticipa su próxima actualización.

2. **Obligación funcional.** Casilda atiende **violencias y discriminaciones basadas en género**.
   Su población usuaria incluye de forma desproporcionada a personas con discapacidad —la
   evidencia epidemiológica es consistente en que enfrentan tasas de VBG entre dos y tres veces
   mayores— y a personas que consultan **en crisis**, con la carga cognitiva reducida que eso
   implica. Una barrera de accesibilidad aquí no degrada una experiencia: **impide un reporte**.

3. **Obligación de contexto de uso.** Muchas personas usuarias acceden desde el celular, con
   conexiones limitadas, en tiempos cortos y a veces en entornos no seguros. Las mismas técnicas
   que sirven a la accesibilidad —jerarquía clara, foco visible, textos alternativos, tolerancia
   al error— sostienen ese escenario.

**Criterio rector del plan:** el flujo público (`/home` → `/formulario-anonimo` → confirmación)
y la **Salida rápida** son crítico de seguridad. Cualquier corrección se prioriza primero ahí,
y ninguna corrección puede degradarlos.

---

## 2. Línea base: lo que ya está resuelto

El rediseño de septiembre dejó cimientos sólidos que este plan **conserva y extiende**. Vale la
pena inventariarlos para no repetir trabajo ni romperlos por descuido:

| Criterio WCAG | Estado | Evidencia |
|---|---|---|
| 3.1.1 Idioma de la página (A) | ✅ | `src/index.html:2` → `<html lang="es">` |
| 2.4.2 Título de página *(nivel documento)* | ⚠️ parcial | `src/index.html:6` tiene título descriptivo, pero es **el mismo para las 20 rutas** → ver H-03 |
| 2.4.1 Evitar bloques (A) | ✅ | `.skip-link` en `src/app/app.component.html:1` + estilos en `src/styles/_base.scss:60` |
| 2.4.7 Foco visible (AA) | ✅ base / ⚠️ excepciones | anillo de foco global en `_base.scss:32-42`; anulado en 9 archivos → ver H-02 |
| 2.3.3 Animación por interacción (AAA) | ✅ | `prefers-reduced-motion` en `_base.scss:126` |
| 1.4.1 Uso del color (A) | ✅ en público / ❌ en back-office | `.casilda-alerta` combina color + ícono + texto (`_base.scss:85`); las tablas no → ver H-06 |
| 1.4.3 Contraste (AA) | ✅ en tokens | paleta documentada con ratios en `src/styles/_tokens.scss:40-62`; `#ef434d` correctamente restringido a gráficos |
| 2.5.5 / 2.5.8 Área táctil | ✅ en público | `--touch-target-min: 44px` aplicado en `.boton` y Salida rápida |
| 3.3.8 Autenticación accesible (AA) | ✅ | login permite pegar, `autocomplete` presente, sin acertijos |
| 4.1.3 Mensajes de estado (AA) | ✅ parcial | overlay de carga con `role="status"` + `aria-live` (`app.component.html:45`); falta en filtros y formularios |
| 2.4.4 Propósito del enlace (A) | ✅ | pie público con `(se abre en una pestaña nueva)`; header con complemento oculto |
| 3.2.3 Navegación consistente (AA) | ✅ | `aria-current="page"` en la navegación pública (`public-header.component.html`) |

**Lectura:** la capa pública construida en el rediseño está bien. **La deuda está concentrada
en el back-office**, que no pasó por ese rediseño y arrastra patrones del código heredado.

---

## 3. Hallazgos priorizados

Prioridad según impacto real sobre la persona usuaria, no según dificultad técnica:

- **P0 — Bloqueante:** impide completar una tarea con tecnología de apoyo o solo con teclado.
- **P1 — Serio:** degrada gravemente la comprensión u orientación; falla un criterio A/AA.
- **P2 — Moderado:** fricción significativa o incumplimiento en escenarios concretos.
- **P3 — Refuerzo:** robustece más allá del mínimo AA.

### Resumen

| ID | Hallazgo | WCAG | Nivel | Prio | Alcance medido |
|---|---|---|---|---|---|
| H-01 | Botones de ícono sin nombre accesible | 4.1.2, 2.4.4, 1.1.1 | A | **P0** | **99 de 100** botones |
| H-02 | Campos de filtro sin etiqueta y con el foco anulado | 3.3.2, 4.1.2, 2.4.7 | A/AA | **P0** | 43 campos, 9 archivos SCSS |
| H-03 | Todas las rutas comparten el mismo título de documento | 2.4.2 | A | **P0** | 20 rutas |
| H-04 | Sin gestión de foco ni anuncio al cambiar de ruta | 2.4.3, 4.1.3 | A/AA | **P1** | toda la SPA |
| H-05 | Falta `autocomplete` en campos de datos personales | 1.3.5 | AA | **P1** | 2 usos en toda la app |
| H-06 | El color como único portador de significado en tablas | 1.4.1 | A | **P1** | `.text-danger`, `.badge-soft` |
| H-07 | Filas expandibles: contenido oculto visualmente pero expuesto | 1.3.2, 4.1.2 | A | **P1** | 6 tablas |
| H-08 | Jerarquía de encabezados sin `h1` en 6 vistas | 1.3.1, 2.4.6 | A/AA | **P1** | 6 componentes |
| H-09 | Errores de formulario sin foco ni resumen al enviar | 3.3.1, 3.3.3 | A/AA | **P1** | formularios largos |
| H-10 | Menú lateral: estado activo solo por color, sin agrupación | 1.4.1, 1.3.1 | A | **P2** | `sidebar.component` |
| H-11 | Sidenav no responsive: `mode="side"` fijo | 1.4.10 | AA | **P2** | back-office en móvil |
| H-12 | Errores silenciosos: `console.error` sin retroalimentación | 3.3.1 | A | **P2** | 50 ocurrencias |
| H-13 | Tipografía de 9–13 px en tablas y tarjetas | 1.4.4, 1.4.12 | AA | **P2** | 110 declaraciones |
| H-14 | Deuda de tokens: paleta heredada y colores literales | 1.4.3 (riesgo) | AA | **P2** | 44/55 SCSS, 147 usos |
| H-15 | Tablas sin nombre accesible ni `scope` en encabezados | 1.3.1 | A | **P2** | 6 tablas |
| H-16 | `placeholder` usado como instrucción persistente | 3.3.2 | A | **P2** | 109 usos a revisar |
| H-17 | Sin `LOCALE_ID` es-CO: fechas y números en formato en-US | 3.1.1 (parcial) | A | **P3** | `app.config.ts` |
| H-18 | Diálogos y `Swal` sin retorno de foco verificado | 2.4.3, 2.1.2 | A | **P3** | 22 modales, 7 `Swal` |

---

### Fichas de los hallazgos bloqueantes y serios

#### H-01 · Botones de ícono sin nombre accesible — **P0**

**Criterios:** 4.1.2 Nombre, función, valor (A) · 2.4.4 Propósito del enlace (A) · 1.1.1 (A)

**Evidencia medida:** de **100** `mat-icon-button` en las plantillas, **99 no tienen
`aria-label` ni `aria-labelledby`**. El único correcto está en el header. Concentración:

| Archivo | Botones sin nombre |
|---|---|
| `registro-caso.component.html` | 26 |
| `registro-atencion.component.html` | 16 |
| `linea-alma/atencion-pr.component.html` | 10 |
| `formulario-acompanamiento.component.html` | 6 |
| `consulta`, `caso`, `modal-detalle-solicitud` | 5 c/u |
| otros 11 archivos | 1–4 c/u |

**Impacto.** Un lector de pantalla anuncia el contenido del `<mat-icon>`, es decir la
**ligadura del ícono**: «botón play_circle_outline», «botón delete». Quien navega por voz o con
lector no puede saber qué hace el control. En `tabla-casos.component.html:99` ese botón es
*iniciar la atención de un caso*: la acción central del flujo del equipo profesional.

**Por qué el linter no lo detecta.** `eslint.config.js:48-51` ya activa
`angular.configs.templateAccessibility`, pero la regla `elements-content` considera que el
botón **sí tiene contenido** (el texto de la ligadura del ícono). Es un falso negativo
estructural del patrón Material: **la deuda es invisible para la herramienta actual**.

**Corrección.**

```html
<!-- Antes -->
<button mat-icon-button (click)="iniciarAtencion(element)">
  <mat-icon>play_circle_outline</mat-icon>
</button>

<!-- Después: nombre accesible + ícono neutralizado + contexto de la fila -->
<button mat-icon-button
        [attr.aria-label]="'Iniciar la atención del caso ' + element.id"
        (click)="iniciarAtencion(element)">
  <mat-icon aria-hidden="true">play_circle_outline</mat-icon>
</button>
```

Dos reglas que deben acompañar siempre a la corrección:

1. **`aria-hidden="true"` en todo `<mat-icon>` decorativo**, para que la ligadura no se lea dos veces.
2. **Nombre contextual en tablas.** «Editar» repetido 20 veces no orienta; «Editar el caso 4821» sí.
   Usa interpolación con el identificador de la fila.

**Verificación:** el conteo de botones sin nombre debe llegar a 0 con el script de la Fase 0,
y la regla propia de ESLint (Fase 5) debe fallar ante una regresión.

---

#### H-02 · Campos de filtro sin etiqueta y con el foco anulado — **P0**

**Criterios:** 3.3.2 Etiquetas o instrucciones (A) · 4.1.2 (A) · 2.4.7 Foco visible (AA)

**Evidencia.** 43 campos `search-box` distribuidos en las cabeceras de las tablas. Patrón
representativo, `tabla-casos.component.html:23-24`:

```html
<div class="search-box-slim">
  <input (keyup)="applyFilter('id', $event)" placeholder="Filtrar">
</div>
```

Y su estilo, replicado en **9 archivos** (`caso.component.scss:90`, `cita:115`,
`consulta:93`, `gestion-contacto:109`, `registro-atencion.consulta:114`,
`registro-caso.consulta:114`, `tabla-casos:90`, `tabla-citas:90`, `tabla-otros-casos:84`):

```scss
input {
  border: none;
  background: transparent;
  font-size: 11px;
  outline: none;   /* ← anula el anillo de foco global de _base.scss */
}
```

**Tres fallas superpuestas en el mismo control:**

1. **Sin etiqueta.** El único texto es `placeholder`, que **desaparece al escribir** y no
   cuenta como etiqueta programática. Placeholders como `"..."`, `"N°"` o `"Filtrar"` no
   identifican la columna: quien usa lector de pantalla oye «campo de edición» sin más.
2. **Sin foco visible.** `outline: none` sin reemplazo deja al usuario de teclado **sin saber
   dónde está**, dentro de una cabecera con hasta 7 campos consecutivos. Contradice
   directamente la regla que `_base.scss:30` declara («nunca eliminar el outline sin reemplazo»).
3. **Sin anuncio de resultados.** Al filtrar, la tabla cambia sin que nada lo comunique (4.1.3).

**Corrección.**

```html
<div class="search-box-slim">
  <label class="visually-hidden" [for]="'filtro-id'">Filtrar por ID de caso</label>
  <input id="filtro-id" type="search" placeholder="Filtrar"
         (keyup)="applyFilter('id', $event)">
</div>
```

```scss
.search-box-slim input {
  border: none;
  background: transparent;
  font-size: var(--font-size-sm);   /* 14px, ver H-13 */

  &:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 1px;
    border-radius: var(--radius-sm);
  }
}
```

Y una región viva por tabla, actualizada tras filtrar:

```html
<p class="visually-hidden" role="status" aria-live="polite">
  {{ dataSource.filteredData.length }} resultados encontrados
</p>
```

> **Nota de diseño:** conviene extraer una sola directiva o componente
> `app-filtro-columna` en lugar de corregir 43 veces el mismo patrón. Reduce el trabajo y
> evita que la próxima tabla nazca con el defecto.

---

#### H-03 · Todas las rutas comparten el mismo título de documento — **P0**

**Criterio:** 2.4.2 Página titulada (A)

**Evidencia.** `src/app/app.routes.ts` define **20 rutas con componente y ninguna con `title`**.
No hay uso del servicio `Title` en ningún `.ts` del proyecto. Resultado: la pestaña, el
historial y el primer anuncio del lector de pantalla dicen siempre lo mismo —el título largo
de `index.html`— tanto en `/home` como en `/registro-caso` o `/gestion-usuarios`.

**Impacto agravado en Casilda.** Quien usa lector de pantalla se orienta principalmente por el
título al cambiar de página. Además, con varias pestañas abiertas es imposible distinguirlas, y
el **historial del navegador queda uniforme** — relevante para una persona que necesita
revisar o limpiar su rastro de navegación.

**Corrección.** Angular Router lo resuelve de forma declarativa, sin código en componentes:

```typescript
{
  path: 'formulario-anonimo',
  title: 'Reporte anónimo de VBG — Casilda',
  loadComponent: () => import('...').then(m => m.FormularioAnonimoComponent)
}
```

Para el sufijo institucional homogéneo, un `TitleStrategy` propio en `app.config.ts`:

```typescript
@Injectable()
export class CasildaTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pagina = this.buildTitle(snapshot);
    this.title.setTitle(pagina ? `${pagina} | Casilda — UdeA` : 'Casilda — UdeA');
  }
}
```

Títulos sugeridos por ruta (**cortos, con lo distintivo al inicio**, que es lo que el lector
anuncia primero):

| Ruta | Título |
|---|---|
| `/home` | Inicio |
| `/login` | Iniciar sesión |
| `/formulario-anonimo` | Reporte anónimo de VBG |
| `/seguimiento` | Seguimiento de trámite |
| `/consulta` | Consulta de solicitudes |
| `/registro-caso` | Registro de caso |
| `/registro-atencion` | Registro de atención |
| `/cita` | Agenda de citas |
| `/caso` | Casos |
| `/mis-asignaciones` | Mis asignaciones |
| `/dashboard-revisor` | Panel de indicadores |
| `/gestion-usuarios` | Gestión de usuarios |
| `/gestion-sistema` | Gestión de listas maestras |
| `/linea-alma/atencion-pr` | Atención de primer respondiente — Línea ALMA |
| `/solicitud-acompanamiento` | Solicitud de acompañamiento |
| `/nueva-queja` | Registro de queja |
| `/detalle-revisor/:id` | Detalle de la solicitud |
| `/detalle-acompanamiento/:id` | Gestión de contacto |
| `/acceso-denegado` | Acceso denegado |
| `/funcionalidad-no-disponible` | Funcionalidad no disponible |

---

#### H-04 · Sin gestión de foco ni anuncio al cambiar de ruta — **P1**

**Criterios:** 2.4.3 Orden del foco (A) · 4.1.3 Mensajes de estado (AA)

**Evidencia.** `app.component.ts` no se suscribe a los eventos del `Router`. Al navegar, el
DOM del `<router-outlet>` se reemplaza pero **el foco permanece en el elemento anterior** —o
se pierde hacia `<body>` si el elemento enfocado desapareció.

**Impacto.** Quien navega con teclado tiene que volver a recorrer todo el encabezado y el menú
después de cada navegación. Quien usa lector de pantalla no recibe ninguna señal de que la
página cambió: escucha silencio y sigue en el contexto viejo.

**Corrección.** Enfocar el contenedor principal tras cada `NavigationEnd`, combinado con
H-03 para que el título recién asignado sea lo que se anuncie:

```typescript
// app.component.ts
constructor() {
  this.iconRegistry.register();
  this.router.events
    .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
    .subscribe(() => {
      const principal = document.getElementById('contenido-principal');
      principal?.setAttribute('tabindex', '-1');
      principal?.focus({ preventScroll: false });
    });
}
```

**Detalle asociado a corregir:** el destino del enlace de salto (`#contenido-principal`)
**no existe en la ruta `/login`** — `app.component.html:22-25` renderiza el login a pantalla
completa sin el `<main id="contenido-principal">`. El enlace de salto queda roto justo ahí.

---

#### H-05 · Falta `autocomplete` en campos de datos personales — **P1**

**Criterio:** 1.3.5 Identificar el propósito de la entrada (AA)

**Evidencia.** Solo **2 atributos `autocomplete`** en toda la aplicación (ambos en el login).
Los formularios que recogen datos personales —reporte anónimo, solicitud de acompañamiento,
registro de caso, gestión de contacto— no declaran el propósito de ningún campo.

**Impacto.** El criterio existe para que personas con discapacidad cognitiva, motriz o de
memoria puedan **autocompletar** en lugar de teclear, y para que las extensiones de asistencia
puedan añadir iconografía al campo. En un formulario de 5 pasos como el reporte anónimo, la
diferencia es sustancial. Además reduce el tiempo de exposición ante la pantalla, algo
deseable en este contexto.

**Corrección.** Mapear cada campo a su token de la
[lista de propósitos de entrada](https://www.w3.org/TR/WCAG22/#input-purposes):

| Campo | `autocomplete` |
|---|---|
| Nombre | `given-name` |
| Apellidos | `family-name` |
| Correo electrónico | `email` |
| Teléfono / Celular | `tel` |
| Dirección | `street-address` |
| Ciudad / Municipio | `address-level2` |
| Fecha de nacimiento | `bday` |

> **Excepción deliberada y documentada:** en el **reporte anónimo**, el autocompletado del
> navegador puede filtrar datos de la persona en un dispositivo compartido o vigilado —
> exactamente el riesgo que la Salida rápida busca mitigar. Ahí se aplica
> `autocomplete="off"` **en los campos de la persona reportante**, y `autocomplete` semántico
> solo en los datos *de la víctima* que el reportante aporta voluntariamente. Esta decisión
> debe quedar escrita en el código como comentario, porque contradice el reflejo habitual.

---

#### H-06 · El color como único portador de significado en tablas — **P1**

**Criterio:** 1.4.1 Uso del color (A)

**Evidencia.** `tabla-casos.component.html:89`:

```html
<span [class.text-danger]="element.profesional === 'Sin asignar'">{{element.profesional}}</span>
```

El estado crítico «Sin asignar» se comunica **solo poniendo el texto en rojo**. Lo mismo con
`.badge-soft` (`caso.component.scss:100`), que usa fondo `#f1f5f9` a 11 px para distinguir
tipos de asignación.

**Impacto.** Invisible para daltonismo (≈8 % de los hombres), para monocromía, en modo de alto
contraste de Windows y para cualquier lector de pantalla. La regla ya está escrita en
`CLAUDE.md §6.5` y en `_base.scss:83`; simplemente **no se aplicó al back-office**.

**Corrección.** Ícono + texto acompañando al color, con el mismo patrón que `.casilda-alerta`:

```html
<span class="estado-asignacion" [class.estado-asignacion--pendiente]="!element.profesional">
  @if (element.profesional === 'Sin asignar') {
    <mat-icon aria-hidden="true">error_outline</mat-icon>
  }
  {{ element.profesional }}
</span>
```

---

#### H-07 · Filas expandibles: contenido oculto visualmente pero expuesto — **P1**

**Criterios:** 1.3.2 Secuencia significativa (A) · 4.1.2 (A)

**Evidencia.** `tabla-casos.component.html:107-127`. La fila de detalle se colapsa con una
animación de altura (`[@detailExpand]`), no con `display: none` ni `hidden`. El botón que la
controla (línea 10) **no expone `aria-expanded` ni `aria-controls`**.

**Impacto.** El contenido colapsado —que incluye documento, teléfono, correo personal e
identidad de género de la persona— **sigue siendo leído por el lector de pantalla y sigue
siendo alcanzable con Tab**, aunque visualmente no exista. Además de la confusión, es una
**consideración de privacidad**: datos sensibles que se creen ocultos se anuncian en voz alta.

**Corrección.**

```html
<button mat-icon-button
        [attr.aria-expanded]="expandedElement === element"
        [attr.aria-controls]="'detalle-' + element.id"
        [attr.aria-label]="'Ver el detalle del caso ' + element.id"
        (click)="alternarDetalle(element); $event.stopPropagation()">
  <mat-icon aria-hidden="true">{{ expandedElement === element ? 'remove_circle' : 'add_circle' }}</mat-icon>
</button>
...
<div [id]="'detalle-' + element.id" [attr.inert]="expandedElement !== element ? '' : null">
```

`inert` (soportado en todos los navegadores objetivo) retira el subárbol del orden de
tabulación **y** del árbol de accesibilidad en una sola declaración.

---

#### H-08 · Jerarquía de encabezados sin `h1` en 6 vistas — **P1**

**Criterios:** 1.3.1 Información y relaciones (A) · 2.4.6 Encabezados y etiquetas (AA)

**Evidencia.** Vistas completas cuyo encabezado de mayor rango no es `h1`:

| Componente | Encabezado más alto | Observación |
|---|---|---|
| `formulario-anonimo` | `h3` × 7 | flujo público crítico; salta de nada a `h3` |
| `registro-caso` | `h2` | |
| `registro-atencion` | `h2` | |
| `linea-alma/atencion-pr` | `h2` | |
| `seguimiento-tramite` | `h2` | |
| `formulario-queja` | `h3` × 2 | |

**Impacto.** El atajo «ir al encabezado principal» (tecla `1` en NVDA/JAWS) no encuentra
destino, y el índice de encabezados —principal método de exploración rápida— aparece
desordenado. En el formulario anónimo, con 5 pasos y decenas de campos, esto es la diferencia
entre orientarse y perderse.

**Corrección.** Un `h1` por vista que nombre la tarea, y descenso sin saltos.
En `formulario-anonimo`: `h1` «Reporte anónimo de VBG» → `h2` por paso → `h3` por sección.

---

#### H-09 · Errores de formulario sin foco ni resumen al enviar — **P1**

**Criterios:** 3.3.1 Identificación de errores (A) · 3.3.3 Sugerencia ante error (AA)

**Evidencia.** El trabajo previo dejó bien la mitad fácil: **276 `mat-form-field` y solo 2 sin
`<mat-label>`**, con 29 `<mat-error>` que Material asocia automáticamente por
`aria-describedby`. Lo que falta es el comportamiento **al enviar**:

- No se mueve el foco al primer campo inválido.
- No hay resumen de errores; en un formulario de 5 pasos, el campo con problema puede estar
  en un paso que ya no se ve.
- No se anuncia el error por región viva.

**Corrección.** Un resumen enfocable al inicio del formulario, más el salto al primer error:

```html
@if (mostrarResumenErrores) {
  <div class="casilda-alerta casilda-alerta--peligro" role="alert" tabindex="-1" #resumenErrores>
    <mat-icon aria-hidden="true">error_outline</mat-icon>
    <div>
      <strong>Revisa {{ errores.length }} campo(s) antes de continuar:</strong>
      <ul>
        @for (e of errores; track e.id) {
          <li><a [href]="'#' + e.id">{{ e.etiqueta }}: {{ e.mensaje }}</a></li>
        }
      </ul>
    </div>
  </div>
}
```

**Nota de trato sensible al trauma:** el texto del error debe ser **descriptivo y no punitivo**.
«Necesitamos el nombre para continuar» funciona mejor que «Campo obligatorio» cuando quien
escribe está en crisis. Es una decisión de contenido, no técnica, y conviene validarla con el
equipo de atención.

**Revisar también** el efecto de `soloLetras()` / `soloNumeros()`
(`formulario-anonimo.component.html:69,76`): sanitizar el valor mientras la persona escribe
**modifica su entrada sin avisar**. Con lector de pantalla, el carácter tecleado se anuncia y
luego desaparece del campo, sin explicación. Mejor validar al salir del campo (`blur`) y
explicar el formato esperado en un `mat-hint` persistente.

---

### Hallazgos moderados y refuerzos (P2 · P3)

**H-10 · Menú lateral.** `sidebar.component.html` marca la ruta activa solo con la clase
`active-item` (color) — falta `aria-current="page"` (1.4.1). Los `<div class="menu-label">`
(«ADMINISTRACIÓN», «EQUIPO DE ATENCIÓN»…) son **rótulos visuales sin valor semántico**: quien
usa lector oye una lista plana de 12 enlaces sin agrupación. Convertirlos en encabezados
(`h2`) o usar `role="group"` con `aria-labelledby` (1.3.1). Además, en mayúsculas por CSS
—no por contenido— para que el lector no deletree.

**H-11 · Sidenav no responsive.** `app.component.html:10` fija `mode="side"` con
`[opened]="!isHomeRoute()"`. En pantallas estrechas el menú ocupa el ancho de forma permanente
sin posibilidad de cerrarlo, comprimiendo el contenido y rompiendo el reflujo a 320 px (1.4.10).
Alternar a `mode="over"` bajo un punto de corte, con el botón `toggleSidenav` ya existente en
el header.

**H-12 · Errores silenciosos.** 50 `console.error` / `console.warn` sin retroalimentación
visible. Cuando una petición falla, la persona ve un spinner que se detiene y **nada más**:
no sabe si guardó, si debe reintentar o si perdió lo escrito (3.3.1). Centralizar en un
servicio de notificación con `role="alert"`, reutilizando `.casilda-alerta`.

**H-13 · Tipografía pequeña.** 110 declaraciones `font-size` entre 9 px y 13 px, concentradas
en celdas de tabla e insignias. No es una falla directa de 1.4.3, pero sí un riesgo de 1.4.4
(*Redimensionamiento del texto*) y 1.4.12 (*Espaciado del texto*): a 200 % de zoom estos
bloques suelen desbordar o solaparse. Migrar a `--font-size-sm` (14 px) como piso y verificar
el reflujo. Es también el punto donde accesibilidad y utilidad coinciden: el equipo profesional
lee estas tablas durante toda la jornada.

**H-14 · Deuda de tokens.** 44 de 55 hojas SCSS contienen colores literales y hay **147 usos**
de la paleta heredada (`#348F41` / `$purple-sys`). Mientras existan, **ningún contraste está
garantizado** y cada corrección puntual puede revertirse. Es trabajo de fondo con beneficio
compuesto: al migrar a `var(--token)`, el contraste queda validado de una vez para toda la app.

**H-15 · Semántica de tablas.** Las 6 tablas `mat-table` no tienen nombre accesible
(`aria-label` o `<caption>`) ni `scope` en los `<th>`. Con varias tablas por vista, el lector
las anuncia como «tabla» sin distinguirlas. Añadir
`<table mat-table aria-label="Casos pendientes de asignación">` y `scope="col"`.

**H-16 · `placeholder` como instrucción.** 109 usos por revisar uno a uno. El caso legítimo es
el ejemplo de formato (`usuario@correo.com`, `formulario-anonimo:94`). El caso a corregir es la
instrucción que debe permanecer visible: `placeholder="Solo números (5-15 dígitos)"`
(`formulario-anonimo:69`) **desaparece justo cuando la persona empieza a escribir**, que es
cuando la necesita. Mover a `<mat-hint>`.

**H-17 · Locale.** `app.config.ts` no provee `LOCALE_ID: 'es-CO'` ni `MAT_DATE_LOCALE`: los
pipes `date`, `number` y `currency` formatean en `en-US`. El paginador **sí** está traducido,
pero mediante `getSpanishPaginatorIntl()` **duplicado en 6 componentes** — cualquier tabla
nueva nacerá en inglés. Proveerlo una sola vez a nivel de aplicación.

**H-18 · Foco en diálogos.** 20 de 22 modales tienen `mat-dialog-title` (bien: Material lo
asocia con `aria-labelledby`); faltan 2. `MatDialog` gestiona la trampa de foco y su
devolución, pero los **7 `Swal.fire`** de SweetAlert2 son un mecanismo aparte que hay que
verificar manualmente: retorno del foco al cerrar, escape, y que los diálogos de
`auth.guard.ts` / `auth.interceptor.ts` (sesión expirada) se anuncien. Dado que ya existe
`ConfirmDialogComponent`, la ruta recomendable es **unificar en `MatDialog` y retirar
SweetAlert2** — un mecanismo menos que auditar y una dependencia menos.

---

## 4. Plan de trabajo por fases

Las fases están ordenadas por **impacto sobre la persona usuaria dividido por esfuerzo**, no
por comodidad de implementación. Las fases 1 y 2 son las que mueven la aguja.

### Fase 0 — Instrumentar antes de corregir · ~0,5 día

Sin medición, no se sabe si una corrección funciona ni si una regresión entró.

| # | Tarea | Entregable | Estado |
|---|---|---|---|
| 0.1 | Ejecutar axe-core sobre las 6 vistas representativas (`/home`, `/formulario-anonimo`, `/login`, `/consulta`, `/registro-caso`, `/gestion-usuarios`) | `docs/evidencias/accesibilidad/00-linea-base-axe.md` | ⏳ Abierta |
| 0.2 | Lighthouse (categoría accesibilidad) sobre las mismas vistas, escritorio y móvil | puntajes iniciales registrados | ⏳ Abierta |
| 0.3 | Script de conteo de la deuda (botones sin nombre, `outline:none`, rutas sin `title`, `font-size` < 14 px) | `tools/auditar-accesibilidad.mjs` | ✅ 2026-09-11 |
| 0.4 | Recorrido manual solo con teclado del flujo público completo | acta de hallazgos | ⏳ Abierta |

```powershell
npm run build
npx http-server dist/casilda-fnsp/browser -p 8080
npx @axe-core/cli http://localhost:8080/home --exit
npx lighthouse http://localhost:8080/home --only-categories=accessibility --view
```

**Criterio de salida:** línea base numérica publicada. Todo lo posterior se compara contra ella.

---

### Fase 1 — Desbloquear el uso con teclado y lector de pantalla · ~3 días

Resuelve los tres P0. Es la fase de mayor retorno del plan.

| # | Tarea | Hallazgo | Criterio de aceptación | Estado |
|---|---|---|---|---|
| 1.1 | `aria-label` contextual en los 99 botones de ícono + `aria-hidden` en sus íconos | H-01 | script de auditoría reporta 0; axe sin `button-name` | ✅ 2026-09-11 |
| 1.2 | Componente/directiva `app-filtro-columna` con etiqueta oculta, `type="search"` y foco visible; sustituir los 43 campos | H-02 | 0 `outline:none` sin reemplazo; axe sin `label` | ✅ 2026-09-11 |
| 1.3 | `title` en las 20 rutas + `CasildaTitleStrategy` | H-03 | cada ruta muestra su propio título | ✅ 2026-09-11 |
| 1.4 | Región viva con el número de resultados tras filtrar | H-02 | NVDA anuncia el conteo | ✅ 2026-09-11 |

---

### Fase 2 — Orientación y formularios · ~3 días

| # | Tarea | Hallazgo | Criterio de aceptación | Estado |
|---|---|---|---|---|
| 2.1 | Foco al `<main>` y anuncio en cada `NavigationEnd`; añadir `id="contenido-principal"` en la ruta `/login` | H-04 | el enlace de salto funciona en las 20 rutas | ✅ 2026-09-11 |
| 2.2 | Un `h1` por vista y jerarquía sin saltos en las 6 vistas afectadas | H-08 | axe sin `heading-order`; índice de encabezados coherente | ✅ 2026-09-11 |
| 2.3 | `autocomplete` semántico, con la excepción documentada del reporte anónimo | H-05 | axe sin `autocomplete-valid`; decisión escrita en el código | ✅ 2026-09-11 |
| 2.4 | Resumen de errores enfocable + salto al primer campo inválido en los 4 formularios largos | H-09 | al enviar con errores, el foco llega al resumen y se anuncia | 🔶 Parcial: reporte anónimo y acompañamiento; faltan registro-caso y registro-atencion |
| 2.5 | Migrar instrucciones de `placeholder` a `<mat-hint>` | H-16 | ninguna instrucción se pierde al escribir | ✅ 2026-09-11 |
| 2.6 | Revisar `soloLetras` / `soloNumeros`: validar al `blur` en vez de mutar al teclear | H-09 | la entrada no se modifica de forma silenciosa | ✅ 2026-09-11 |

---

### Fase 3 — Back-office: tablas, menú y estados · ~4 días

| # | Tarea | Hallazgo | Criterio de aceptación | Estado |
|---|---|---|---|---|
| 3.1 | Estado + ícono + texto en las insignias y estados de tabla | H-06 | legible en escala de grises | ✅ 2026-09-11 |
| 3.2 | `aria-expanded`/`aria-controls` + `inert` en las filas expandibles | H-07 | el detalle colapsado no es alcanzable con Tab ni por el lector | ✅ 2026-09-11 |
| 3.3 | `aria-label` y `scope="col"` en las 6 tablas | H-15 | axe sin `th-has-data-cells` | ✅ 2026-09-11 |
| 3.4 | `aria-current="page"` y agrupación semántica en el menú lateral | H-10 | los 5 grupos se anuncian como tales | ✅ 2026-09-11 |
| 3.5 | Sidenav `mode="over"` bajo el punto de corte móvil | H-11 | uso completo a 320 px sin desplazamiento horizontal | ✅ 2026-09-11 |
| 3.6 | Servicio de notificación con `role="alert"`; reemplazar los 50 `console.error` | H-12 | ningún fallo de red queda sin mensaje visible | ✅ 2026-09-11 |
| 3.7 | Unificar diálogos en `MatDialog`, retirar SweetAlert2; `mat-dialog-title` en los 2 modales faltantes | H-18 | foco atrapado y devuelto en los 22 modales | ✅ 2026-09-11 |

---

### Fase 4 — Contraste, tipografía y tokens · ~4 días

| # | Tarea | Hallazgo | Criterio de aceptación | Estado |
|---|---|---|---|---|
| 4.1 | Migrar los 147 usos de la paleta heredada a tokens | H-14 | 0 ocurrencias de `#348F41` / `$purple-sys` | ✅ 2026-09-11 |
| 4.2 | Reemplazar colores literales en los 44 SCSS restantes | H-14 | solo `var(--token)` fuera de `_tokens.scss` | 🔶 Parcial: 524 de 660; quedan 136 acentos sin token |
| 4.3 | Piso tipográfico de 14 px; revisar las 110 declaraciones pequeñas | H-13 | sin desbordes a 200 % de zoom | ✅ 2026-09-11 |
| 4.4 | Verificar reflujo a 320 px y texto a 200 % en las 6 vistas | 1.4.4, 1.4.10 | sin desplazamiento horizontal salvo en tablas de datos | ⏳ Abierta |
| 4.5 | Aplicar espaciado de texto de 1.4.12 y comprobar que nada se recorta | 1.4.12 | contenido íntegro con la hoja de prueba estándar | ⏳ Abierta |
| 4.6 | `LOCALE_ID: 'es-CO'` + `MAT_DATE_LOCALE` globales; `getSpanishPaginatorIntl` a un único proveedor | H-17 | fechas en formato colombiano; sin duplicación | ✅ 2026-09-11 |

---

### Fase 5 — Que no vuelva a ocurrir · ~2 días

La deuda actual nació porque nada la detectaba. Esta fase cierra esa puerta.

| # | Tarea | Entregable | Estado |
|---|---|---|---|
| 5.1 | Endurecer las 4 reglas de accesibilidad de ESLint de `warn` a `error` | `eslint.config.js` | ✅ 2026-09-11 |
| 5.2 | Regla propia que exija nombre accesible en `mat-icon-button` — el preset estándar **no lo detecta** (ver H-01) | regla local + prueba | ✅ 2026-09-11 |
| 5.3 | `jasmine-axe` en las pruebas unitarias de los componentes del flujo público | fallo del CI ante una regresión | ⏳ Abierta |
| 5.4 | Paso de axe en CI (`.github/workflows`) sobre las 6 vistas representativas | pipeline en verde | 🔶 Parcial: CI ejecuta la auditoría estática; axe depende de 0.1 |
| 5.5 | Bajar el tope de `--max-warnings` de 303 a la nueva línea base | `package.json` | ✅ 2026-09-11 |
| 5.6 | Lista de verificación de accesibilidad en la plantilla de PR | `.github/pull_request_template.md` | ❌ Descartada 2026-09-12: el equipo no la usará; la definición de terminado (§5) se aplica en revisión |
| 5.7 | Actualizar `CLAUDE.md §6` y `README.md` con las reglas nuevas | documentación | ✅ 2026-09-11 |

---

### Fase 6 — Validación con personas · ~2 días + coordinación

Lo automatizado detecta cerca del 30 % de las barreras reales. El resto necesita uso.

| # | Tarea | Entregable | Estado |
|---|---|---|---|
| 6.1 | Recorrido con NVDA (Windows) y VoiceOver (iOS) del flujo público completo | acta con hallazgos priorizados | ⏳ Abierta |
| 6.2 | Prueba en modo de alto contraste de Windows y con zoom al 400 % | evidencia en capturas | ⏳ Abierta |
| 6.3 | Sesión con personas usuarias con discapacidad, coordinada con Bienestar UdeA | informe de sesión | ⏳ Abierta |
| 6.4 | Declaración de accesibilidad publicada, con estado de conformidad y canal de reporte de barreras (exigida por la Res. 1519 de 2020) | página `/accesibilidad` | ⏳ Abierta |

> La tarea 6.3 requiere coordinación institucional y consentimiento informado; conviene
> iniciar la gestión al comenzar la Fase 1, no al llegar a la Fase 6.

---

## 5. Definición de terminado (para todo PR nuevo)

Lista corta, verificable en revisión, para que la deuda no vuelva a crecer. Se aplica al revisar
cada PR (no hay plantilla automática: la tarea 5.6 se descartó). Las reglas 7–9 de
`CLAUDE.md` §6 son su versión para el código.

- [ ] Todo control interactivo tiene **nombre accesible**; los íconos decorativos llevan `aria-hidden="true"`.
- [ ] Todo campo tiene **etiqueta programática** (`<mat-label>`, `<label>` o `aria-label`); el `placeholder` nunca es la única etiqueta.
- [ ] El **foco es visible** en cada elemento enfocable; ningún `outline: none` sin reemplazo.
- [ ] La vista tiene **un `h1`** y la jerarquía de encabezados no salta niveles.
- [ ] La ruta nueva declara su **`title`** en `app.routes.ts`.
- [ ] El **color no es el único portador** de significado: siempre con ícono o texto.
- [ ] Los **cambios asíncronos se anuncian** (`role="status"` / `role="alert"`).
- [ ] Sin colores, tamaños ni espaciados **literales**: solo `var(--token)`.
- [ ] Área táctil **≥ 44 px** en controles nuevos.
- [ ] Recorrido **solo con teclado** de la funcionalidad añadida (incluida la Salida rápida).
- [ ] `npm run lint` y `npm run a11y:audit` sin errores.

---

## 6. Cómo se mide el avance

Medición con `npm run a11y:audit` (`tools/auditar-accesibilidad.mjs`). Evidencias en
`docs/evidencias/accesibilidad/`.

| Indicador | Línea base (2026-09-11, `00-linea-base.json`) | Estado (2026-09-11, `01-tras-fases-1-5.json`) | Meta |
|---|---|---|---|
| Botones de ícono sin nombre accesible | 98 de 99 | **0** ✅ | 0 |
| `<mat-icon>` sin `aria-hidden` | 270 | **0** ✅ | 0 |
| Campos de filtro sin etiqueta | 42 | **0** ✅ | 0 |
| Rutas sin `title` | 21 de 21 | **0** ✅ | 0 |
| Archivos con `outline: none` sin reemplazo | 9 | **0** ✅ | 0 |
| Usos de la paleta heredada | 178 | **0** ✅ | 0 |
| SCSS con colores literales | 47 de 60 | 28 de 60 (136 literales) | 0 |
| `console.error` sin retroalimentación | 48 | **0** ✅ | 0 |
| Declaraciones `font-size` < 14 px (texto) | 103 | **0** ✅ | 0 |
| Violaciones de axe (6 vistas) | *pendiente Fase 0.1* | — | 0 críticas y serias |
| Lighthouse — accesibilidad | *pendiente Fase 0.2* | — | ≥ 95 |

**Tareas cerradas (2026-09-11):** 0.3 · 1.1–1.4 · 2.1–2.3 · 2.5 · 2.6 · 3.1–3.7 · 4.1 · 4.3 ·
4.6 · 5.1 · 5.2 · 5.5–5.7. Detalle por hallazgo en `01-fases-1-5-correcciones.md`.

**Abiertas, en orden sugerido:**

1. **0.1 / 0.2 / 0.4** — axe-core, Lighthouse y recorrido manual con teclado sobre las 6 vistas:
   requieren la aplicación en ejecución con backend disponible. Cierran también la parte de
   axe de **5.4** (hoy el CI solo ejecuta la auditoría estática).
2. **2.4 (resto)** — conectar `ResumenErroresComponent` a `registro-caso` y `registro-atencion`
   (formularios de pestañas; hoy solo marcan la pestaña con «(con errores)»).
3. **4.2 (resto)** — 136 colores literales en 28 SCSS: acentos ámbar (`#b45309`, `#92400e`),
   azules (`#2563eb`, `#1e40af`) y morados sin token equivalente; requieren decisión de diseño
   (`npm run a11y:audit -- --detalle` los lista).
4. **4.4 / 4.5** — verificación visual de reflujo a 320 px, texto a 200 % y espaciado 1.4.12; el
   piso de 14 px en cabeceras de tabla puede exigir ajustar anchos.
5. **5.3** — `jasmine-axe` en las pruebas unitarias del flujo público.
6. **Fase 6** — NVDA/VoiceOver, alto contraste y zoom 400 %, sesión con personas usuarias y
   declaración de accesibilidad en `/accesibilidad`.
7. Validar con el equipo de atención el tono de los mensajes de error y notificaciones
   (decisión de contenido, no de código).

---

## 7. Lo que ninguna herramienta va a medir

Casilda es un producto para personas que están atravesando violencia. Estas decisiones no
aparecen en axe ni en Lighthouse, y son las que determinan si alguien completa un reporte:

- **La Salida rápida es la función más importante de la interfaz.** No se degrada, no se oculta,
  no se mueve de lugar y no cambia de atajo. Debe seguir siendo alcanzable con teclado desde
  cualquier punto y no puede quedar tapada por ningún elemento fijo (criterio 2.4.11, *foco no
  oscurecido*). Verificar explícitamente en cada fase.
- **Carga cognitiva mínima.** Una persona en crisis no procesa formularios densos. Cada paso
  debe poder responderse sin releer. La accesibilidad cognitiva y la usabilidad son aquí lo mismo.
- **Nunca exigir dos veces el mismo dato** (criterio 3.3.7, *Entrada redundante*): revisar el
  formulario de 5 pasos con esa lente.
- **Sin límites de tiempo** ni cierres de sesión abruptos que hagan perder lo escrito
  (criterio 2.2.1). El `auth.interceptor` ya avisa la sesión expirada con `DialogoService`
  (MatDialog, con foco atrapado y devuelto) en lugar de SweetAlert2, pero sigue pendiente
  confirmar qué pasa con un formulario a medio llenar cuando el token caduca.
- **El lenguaje de los errores acompaña, no reprende.** Es una decisión de contenido que debe
  validarse con el equipo de atención, no resolverse en el código.
- **Salida sin rastro.** Las decisiones sobre `autocomplete` (H-05), historial y almacenamiento
  local tienen implicaciones de seguridad para quien usa un dispositivo compartido o vigilado.

---

## 8. Resumen ejecutivo

**Diagnóstico (6 de septiembre):** el flujo público estaba bien encaminado; el back-office no
había pasado por el rediseño y concentraba la deuda. Tres problemas bloqueaban el uso con
tecnología de apoyo: 99 botones sin nombre, 43 campos de filtro sin etiqueta y con el foco
anulado, y 20 rutas con el mismo título. La deuda había crecido porque **el linter configurado
no podía verla**: el preset de accesibilidad de Angular ESLint no detecta el patrón
`mat-icon-button`.

**Estado (11 de septiembre):** los tres P0 están en cero y el producto pasó de «inutilizable con
lector de pantalla» a «navegable». Se ejecutaron las fases 1, 2, 3 y 5 completas y la mayor
parte de la 4 (paleta heredada eliminada, piso tipográfico de 14 px, 524 de 660 literales a
tokens). Los frenos ya están puestos: reglas de accesibilidad como error, regla propia para
`mat-icon-button`, auditoría estática en CI y definición de terminado (§5) para la revisión de PR.

**Lo que falta** es, sobre todo, verificación con la aplicación en ejecución y con personas:
axe/Lighthouse y recorrido con teclado (Fase 0), reflujo y zoom (4.4/4.5), `jasmine-axe`
(5.3) y la Fase 6 completa (lectores de pantalla, sesión con personas usuarias y declaración
de accesibilidad). En código quedan 136 acentos de color sin token y conectar el resumen de
errores a `registro-caso` y `registro-atencion`. La Fase 6 necesita coordinación institucional
y conviene iniciar su gestión cuanto antes.

---

## 9. Referencias

- [WCAG 2.2 — Guía de referencia rápida (español)](https://www.w3.org/WAI/WCAG22/quickref/?currentsidebar=%23col_customize&lang=es)
- [Estándares y directrices de la W3C — WAI (español)](https://www.w3.org/WAI/standards-guidelines/wcag/es)
- [Prácticas de autoría WAI-ARIA (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [Resolución MinTIC 1519 de 2020 — Anexo 1, accesibilidad web](https://normograma.mintic.gov.co/mintic/docs/resolucion_mintic_1519_2020.htm)
- NTC 5854 — Accesibilidad a páginas web (ICONTEC)
- [Accesibilidad en Angular Material (CDK a11y)](https://material.angular.io/cdk/a11y/overview)
- [Reglas de axe (Deque University)](https://dequeuniversity.com/rules/axe/)
- Guías internas: `.agents/skills/accessibility/SKILL.md`, `.agents/supports/casilda-diseno-v1.md`, `CLAUDE.md §3` y `§6`
