# CLAUDE.md — Contexto y trazabilidad del frontend de Casilda

> Archivo vivo. Se actualiza al cerrar cada fase de trabajo para que cualquier
> sesión posterior (humana o asistida) retome sin repetir el análisis.
>
> **Última actualización:** 3 de septiembre de 2026

---

## 1. Qué es este repositorio

`casilda-frontend` (proyecto Angular `Casilda-FNSP`) es la capa web de **Casilda**, el
sistema de vigilancia en salud pública de la Universidad de Antioquia para el abordaje
de las violencias y discriminaciones basadas en género (VBG).

Documentos de referencia, en orden de precedencia para decisiones de diseño:

| Documento | Para qué sirve |
|-----------|----------------|
| `casilda-diseno-v1.md` | **Fuente de verdad de UI/UX**: marca UdeA, tokens, accesibilidad y hoja de ruta por fases. |
| `ANALISIS_ARQUITECTURA_Y_MIGRACION.md` | Arquitectura, rutas, servicios y deuda técnica detectada. |
| `AGENTS.md` | Prompt/rol de la migración Angular 17 → 21 (ya completada). |
| `.agents/skills/angular_frontend_guidelines/SKILL.md` | Convenciones obligatorias de código Angular del equipo. |
| `.agents/skills/accessibility/SKILL.md` | Criterios WCAG 2.2 aplicados. |

## 2. Stack y comandos

- Angular **21.2** standalone (sin `NgModule`), TypeScript **5.9 strict**, Angular Material 21 (tema M2 compat), RxJS 7.8, SweetAlert2, Karma/Jasmine.
- Rutas con `loadComponent` (lazy) y guards `authGuard` / `roleGuard` / `featureCapabilityGuard`.

```powershell
npm start        # ng serve → http://localhost:4200
npm run build    # build de producción → dist/casilda-fnsp
npm run test:ci  # pruebas headless con cobertura
npm run lint     # ESLint (tope actual: 303 warnings heredados)
npm run check    # lint + tests + build
```

## 3. Sistema de diseño (obligatorio para toda UI nueva)

Los tokens viven en **`src/styles/_tokens.scss`** y se cargan globalmente desde
`src/styles.scss`. **Ningún componente debe declarar colores, tipografías,
espaciados ni radios literales**: siempre `var(--token)`.

- **Color primario:** verde institucional UdeA `#026937` (Pantone 349 C, 5.16:1 sobre blanco).
- **Secundario / enlaces:** turquesa oscuro `#0e7774`.
- **Tipografía:** `Lora` (`--font-serif`) exclusivamente para `h1`–`h3` y para el
  nombre "Casilda"; `Inter` (`--font-sans`) para todo lo demás, incluido el tema
  Material. Ambas se cargan en `src/index.html`. `Times New Roman` queda como
  primer respaldo del serif para no perder el carácter institucional si Lora no carga.
- **Rojo de marca `#ef434d`:** solo bordes y elementos gráficos (3.76:1 con blanco,
  válido para componentes pero **no** para texto). Para superficies rojas con texto
  blanco se usan `--color-danger-surface` (#c62828) y `--color-danger-surface-hover`.
- **Utilidades globales** en `src/styles/_base.scss`: `.boton` (`--primario`,
  `--secundario`, `--emergencia`), `.casilda-alerta` (+ `--peligro`, `--precaucion`,
  `--exito`), `.visually-hidden`, `.skip-link`, foco visible y `prefers-reduced-motion`.
- **Marca UdeA:** la jerarquía institucional la sostiene el logosímbolo horizontal
  de la UdeA (ancho mínimo 130 px, token `--udea-logo-min-width`) con el nombre de
  la dependencia en serif bold. "Casilda" se presenta como texto estilizado
  acompañado del distintivo `logo-custom`, **nunca** integrado al escudo: el manual
  prohíbe crear un logosímbolo propio para iniciativas. El uso del distintivo está
  pendiente de aval de Comunicaciones; si se niega, se retira de
  `header.component.html` y `login.component.html`.

## 4. Componentes transversales

| Componente / servicio | Ubicación | Nota |
|---|---|---|
| `QuickExitComponent` | `src/app/components/quick-exit/` | Botón flotante de **Salida rápida**, montado globalmente en `app.component.html`. |
| `QuickExitService` | `src/app/core/security/quick-exit.service.ts` | Limpia `sessionStorage` + llaves `casilda_*` y `userSession`, y redirige con `location.replace()` a `environment.quickExitUrl`. |
| `ContenidoHomeService` | `src/app/services/contenido-home.service.ts` | Contenido editable del home (`imagen`, `titulo`, `contenido`, vigencia, sección). Hoy devuelve un **mock**; el endpoint previsto es `GET {apiBaseUrl}/contenidos/home`. |
| `CasildaCardComponent` | `src/app/components/casilda-card/` | Tarjeta puramente presentacional alimentada por `ContenidoDestacadoDto`. |

## 5. Bitácora de avances

### 2026-08 — Migración Angular 17 → 21 y estabilización
Cuatro fases incrementales con `ng update`, control flow homogeneizado a `@if`/`@for`,
lazy loading por ruta, feature flags por entorno y suite de tests reparada.
Evidencias en `docs/evidencias/auditoria-angular21/`.

### 2026-09-02 — Fases 1 a 3 del sistema de diseño UdeA (este cambio)
Detalle completo en `docs/evidencias/rediseno-udea/01-fases-1-3-sistema-diseno.md`.

- **Fase 1 — Cimientos:** `src/styles/_tokens.scss` y `src/styles/_base.scss`; tema
  Material repaletizado al verde UdeA (antes morado `#814ea5`/`#348F41`);
  `index.html` con `lang="es"`, título descriptivo, `meta description` y fuente Lato.
- **Fase 2 — Salida rápida:** componente flotante + servicio, con clic, `Alt + Q` y
  doble `Escape` (< 1 s), `aria-keyshortcuts`, colapso a botón circular de 44 px
  en pantallas ≤ 900 px y reserva de espacio en el header para no solaparlo.
- **Fase 3 — Landing y login:** home con hero serif, CTAs (reporte seguro /
  orientación telefónica), aviso de privacidad de baja carga y tarjetas servidas
  por el gestor de contenidos; login en dos paneles (institucional + formulario)
  con etiquetas asociadas, `autocomplete`, toggle de contraseña anunciado,
  estado `aria-live` y recuperación de contraseña por correo de soporte.
- **Retiro de acceso público a "Consultar caso"** en la navegación pública y en el
  login (la ruta `/seguimiento` queda tras feature flag, para uso autenticado).

### 2026-09-03 — Ajustes de la primera revisión
- **Tipografía modernizada:** `Lora` + `Inter` en reemplazo de `Times New Roman` + `Lato`
  (decisión del equipo; se conserva un serif para no romper el tono institucional).
- **Retorno al inicio:** el bloque de marca del header es ahora un enlace a `/home`
  (con el distintivo de Casilda restituido a su izquierda), la navegación pública
  abre con "Inicio" y marca la ruta activa con `aria-current="page"`, y el login
  —que se renderiza a pantalla completa, sin header— tiene su propio
  "Volver al inicio".
- **Distintivo de Casilda:** se mantiene acompañando al texto en el header y en el
  panel del login, documentado como pendiente de aval de marca.

### Pendiente (Fase 4 y siguientes)
1. Auditoría automática con axe/Lighthouse y validación cruzada en navegadores y móviles reales.
2. Sustituir el mock de `ContenidoHomeService` por el endpoint real del gestor de contenidos.
3. Confirmar con Comunicaciones UdeA: dependencia exacta del logosímbolo y uso del
   distintivo de Casilda como favicon.
4. Datos reales de contacto: `environment.telefonoOrientacion` y los del pie público.
5. Deuda heredada: `aria-label` en los ~99 `mat-icon-button` del back-office,
   `console.error` sin feedback visual, sidenav no responsive, spinner global.

## 6. Reglas que no se deben romper

1. Nada de listas, URLs, colores ni textos de negocio quemados en componentes:
   backend, `environment` o tokens.
2. Todo `subscribe()` maneja `next` **y** `error`.
3. Componentes standalone; se importa solo el módulo Material que se usa.
4. Área táctil mínima 44 px, contraste mínimo 4.5:1 en texto y foco siempre visible.
5. El color nunca es el único portador de significado: acompáñalo de ícono y texto.
6. La Salida rápida es funcionalidad crítica de seguridad: no se degrada ni se oculta.
