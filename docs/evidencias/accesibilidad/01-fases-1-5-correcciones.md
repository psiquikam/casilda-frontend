# Accesibilidad — Fases 0 a 5 del plan (11 de septiembre de 2026)

Rama: `feature/02/006/casilda/accessibility-improvements`. Plan de referencia:
`plan_accesibilidad.md` (misma carpeta). Este documento registra **cómo** se implementó cada
corrección; el **estado** de cada tarea y lo que queda abierto se mantiene únicamente en el
plan (§4 y §6).

## Línea base vs. resultado (auditoría estática `tools/auditar-accesibilidad.mjs`)

| Indicador | Línea base (`00-linea-base.json`) | Resultado (`01-tras-fases-1-5.json`) |
|---|---|---|
| H-01 Botones de ícono sin nombre accesible | 98 de 99 | **0** |
| H-01 `<mat-icon>` sin `aria-hidden` | 270 | **0** |
| H-02 Campos de filtro sin etiqueta | 42 | **0** |
| H-02 SCSS con `outline: none` sin reemplazo | 9 | **0** |
| H-03 Rutas sin `title` | 21 de 21 | **0** |
| H-12 `console.error` / `console.warn` sin retroalimentación | 48 | **0** |
| H-13 Declaraciones `font-size` < 14 px (texto) | 103 | **0** |
| H-14 Usos de la paleta heredada (`$purple-sys` / `#348F41`) | 178 | **0** |
| H-14 SCSS con colores literales | 47 de 60 | 28 de 60 (136 literales, ver pendientes) |

Verificación: `npm run lint` (0 errores), `npm run a11y:rules`, `npm run a11y:audit`,
`npm run test:ci` (131 pruebas) y `npm run build` en verde.

## Qué se corrigió, por hallazgo

- **H-01** · 98 `mat-icon-button` con `aria-label` contextual (con el identificador de la fila
  cuando aplica: «Eliminar el caso 4821») y 270 `<mat-icon>` decorativos con `aria-hidden`.
  Los tres patrones donde el ícono portaba estado recibieron texto oculto: pestañas con error
  («(con errores)») y líneas de tiempo («(completada)» / «(pendiente)»).
- **H-02** · Directiva `appFiltroColumna` (`core/a11y/filtro-columna.directive.ts`): nombre
  accesible «Filtrar por …», `type="search"`, `autocomplete="off"`, clase `filtro-columna`;
  aplicada a los 42 campos. Foco visible con `--focus-ring` en los 9 SCSS y piso de 14 px.
  Región viva `role="status"` con el conteo de resultados en las 7 tablas filtrables.
- **H-03** · `title` en las 21 rutas + `CasildaTitleStrategy` (`core/a11y/casilda-title.strategy.ts`)
  con sufijo «| Casilda — UdeA».
- **H-04** · `EnfoqueRutaService`: foco al `<main id="contenido-principal" tabindex="-1">` tras
  cada `NavigationEnd` (omite carga inicial y cambios de fragmento). El login ahora comparte el
  mismo `id`, con lo que el enlace de salto funciona en las 21 rutas.
- **H-05** · `autocomplete` semántico donde el dato es de la persona usuaria (login,
  remitente de acompañamiento, contacto en queja); `autocomplete="off"` a nivel de `<form>` en
  los 8 formularios del back-office que describen a terceras personas; en el reporte anónimo,
  decisión de privacidad documentada en la plantilla (semántico solo en datos de la víctima).
- **H-06** · Patrón `.estado-asignacion--pendiente` (ícono + texto + color) para «Sin asignar»
  en las 6 tablas; la clase `.text-danger` no tenía estilo definido.
- **H-07** · `aria-expanded`, `aria-controls` e `inert` en las 6 tablas con filas expandibles:
  el detalle colapsado deja de ser alcanzable con Tab y de leerse.
- **H-08** · `h1` en las 6 vistas (visible en los formularios públicos, oculto en el modo de
  atención de registro-caso/registro-atencion) y descenso sin saltos.
- **H-09** · `ResumenErroresComponent` + `recolectarErrores()` (`core/a11y/`): resumen enfocable
  con `role="alert"` y enlaces al campo; en formularios con pestañas la salida `campoSolicitado`
  permite revelar la pestaña. Conectado al paso «El Caso» del reporte anónimo y al envío de la
  solicitud de acompañamiento (cuyo botón dejó de estar deshabilitado con el formulario inválido).
  Mensajes en tono no punitivo, pendientes de validación con el equipo de atención.
- **2.6** · Retirados `soloLetras` / `soloNumeros`: la entrada ya no se muta al teclear; validan
  los `Validators.pattern` existentes y las instrucciones pasaron a `<mat-hint>` persistente con
  `inputmode="numeric"`.
- **H-10** · `ariaCurrentWhenActive="page"` en los 26 enlaces del menú lateral y horizontal;
  cada región del acordeón se etiqueta con su botón (`aria-labelledby`).
- **H-11** · Sidenav `mode="over"` y cerrado por defecto bajo 900 px (`BreakpointObserver`),
  con cierre automático al navegar y `max-width: 85vw`.
- **H-12** · `NotificacionService` (MatSnackBar, `role="alert"` para errores, 10 s, acción
  «Cerrar»); los 47 `console.error` de subscripciones pasaron a mensajes humanos.
- **H-15** · `aria-label` en las 41 tablas que no lo tenían y `scope="col"` en 190 cabeceras.
- **H-16** · Placeholders-instrucción migrados a `<mat-hint>` (identificación, WhatsApp, fecha,
  hora, información adicional del agresor, contraseña de usuario nuevo).
- **H-17** · `LOCALE_ID` y `MAT_DATE_LOCALE` `es-CO`; paginador en español provisto una sola vez
  (`core/i18n/paginador-es.ts`), retiradas las 6 copias.
- **H-18** · SweetAlert2 retirado. `DialogoService` (`aviso()` / `confirmar()`) sobre `MatDialog`
  con `AvisoDialogComponent` nuevo y `ConfirmDialogComponent` con `mat-dialog-title` y foco
  inicial en «Cancelar». Guards, interceptor y los dos confirmadores de borrado migrados.
- **Fase 4** · Paleta heredada eliminada (verde a 3.9:1 → `--color-primary` a 5.16:1); 524 de
  660 literales migrados a tokens (slate → neutros; rojos/verdes/ámbar claros → semánticos);
  nuevo token `--color-bg-subtle`; piso tipográfico de 14 px en 101 declaraciones.
- **Fase 5** · Reglas de accesibilidad de ESLint en `error`; regla propia
  `casilda/mat-icon-button-accessible-name` (`tools/eslint-rules/`, con prueba); paso de
  auditoría en CI; `--max-warnings` 303 → 299. La plantilla de PR (5.6) se descartó.

## Hallazgo colateral corregido

En `registro-caso` y `registro-atencion` los botones «Eliminar» de las tablas **Rutas
activadas** y **Remisiones** tenían los handlers intercambiados (`eliminarRemision` en la tabla
de rutas y viceversa). Al nombrar los botones por su tabla se hizo evidente y se corrigió.

## Fuera de esta entrega

Las tareas abiertas (Fase 0.1/0.2/0.4, resto de 2.4 y 4.2, 4.4/4.5, 5.3 y Fase 6) se
describen y priorizan en `plan_accesibilidad.md` §6.
