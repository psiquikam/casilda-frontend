# Subfase 0 — Contenido de crisis y atajo de la salida rápida

> **Fecha:** 4 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards`.
> **Base:** `09de1bb`. **Commits:** `6c7a9c0`, `a1da3c1`, `876c3f6`.
> **Diagnóstico de origen:** `docs/evidencias/dashboards/00-diagnostico-y-plan.md`.
> **IDs cubiertos:** DSH-05-01 (crítico) · DSH-06-02.
> **Autorización:** decisiones del equipo del 2026-10-04 (bloques a, b y c).

---

## Resultado

| ID | Estado | Evidencia (archivo:línea o captura) |
|----|--------|-------------------------------------|
| DSH-05-01 | **CUMPLE** | `src/environments/environment.ts:13` · `environment.prod.ts:13` → `telefonoOrientacion: ''` |
| DSH-05-01 | **CUMPLE** | `src/app/core/security/telefono-crisis.ts:68-83` → `esTelefonoPublicable()` |
| DSH-05-01 | **CUMPLE** | `dashboard-home.component.ts:49-57` → `hayLineaOrientacion` |
| DSH-05-01 | **CUMPLE** | `dashboard-home.component.html:132` (banner rol Usuario) y `:845` (pestaña Protocolos) tras `@if` |
| DSH-05-01 | **CUMPLE** | `telefono-crisis.spec.ts` (16 casos) · `dashboard-home.component.spec.ts:90-168` (7 casos) |
| DSH-05-01 | **CUMPLE** | Capturas `capturas/subfase-0/usuario-1440.png`, `usuario-375.png`, `admin-1440-protocolos.png` |
| DSH-05-01 *(alcance añadido)* | **CUMPLE** | `public-footer.component.ts:15-24` + `.html:5-12` + 4 casos de prueba |
| DSH-05-01 *(alcance añadido)* | **CUMPLE** | `casilda-home.component.ts:27-34` + `.html:15-22` + 5 casos de prueba · captura `portada-publica-1440.png` |
| DSH-06-02 | **CUMPLE** | `quick-exit.component.ts:60-72` → `esAtajoDeSalida()` |
| DSH-06-02 | **CUMPLE** | `quick-exit.component.spec.ts:46-131` (10 casos, incluido el recorrido real por el `@HostListener`) |
| ADD-01 | **ACEPTADO — deuda conocida** | Decisión del equipo. Registrado en `CLAUDE.md` §5 pendiente 6 y en el §3.7 del diagnóstico. |

---

## (a) DSH-05-01 — Líneas telefónicas de crisis

### Qué se hizo

`telefonoOrientacion` queda **vacío a propósito** en `environment.ts` y en
`environment.prod.ts`. El dato ya no se renderiza sin condición: pasa por
`esTelefonoPublicable()`, y donde no haya número real publicable, el bloque no se dibuja.

El predicado vive en `src/app/core/security/telefono-crisis.ts` como función pura, no en
el componente: lo consumen ya cuatro puntos y lo necesitará el widget `lineas-ayuda` de la
Subfase 4. Rechaza, en este orden: vacíos y espacios, textos de relleno
(`pendiente`, `por confirmar`, `TODO`, `N/A`, `xxx`…), valores con menos de 3 dígitos,
repeticiones de un mismo dígito (`0000000000`) y **rachas consecutivas de 7 o más
dígitos en cualquier posición**.

### Una decisión que conviene explicar

La detección de secuencias busca la racha **dentro** del número, no sobre el total. La
primera versión comparaba el número completo y dejaba pasar `+57 123 456 7890`: el prefijo
de país rompía la secuencia y el marcador se colaba. Buscando la racha interna, ese valor
se rechaza igual que `1234567890`.

El umbral de 7 dígitos no es arbitrario: por debajo de esa longitud se descartarían
**las líneas 155 y 123**, que son reales y que el panel sigue publicando. Hay una prueba
que fija precisamente eso.

### Alcance añadido respecto de lo aprobado

Al verificar el criterio «`grep` sin números de relleno en `src/`» aparecieron **dos
consumidores más** que el diagnóstico no había registrado, porque acoté la búsqueda al
panel de inicio. Ambos son contenido de crisis y ambos se corrigieron con el mismo
predicado:

1. **`public-footer.component.html:6`** — mostraba `<a href="tel:1234567890">1234567890</a>`
   a cualquier visitante **anónimo**, como número de contacto de Casilda. Pasa a
   `environment.telefonoContactoPublico` (nuevo, vacío) con el mismo criterio. El pie
   conserva correo y sitio web.
2. **`casilda-home.component.html:16`** — el llamado a la acción
   «Orientación telefónica de emergencia» del hero de la portada pública. Este caso además
   era una **regresión que introduje al vaciar la variable**: el enlace quedaba como `tel:`
   sin destino, en un botón rotulado «de emergencia». Ahora no se ofrece el canal si no hay
   número; el hero conserva «Iniciar reporte seguro».

> Ambos puntos quedan fuera del alcance nominal de la fase (portada pública). Se corrigieron
> porque son el mismo hallazgo crítico y porque el criterio de cierre aprobado los
> alcanzaba. **Si el equipo prefiere revertirlos, los commits `6c7a9c0` (parte del pie) y
> `876c3f6` (portada) son independientes del resto.**

### Cuando llegue el número real

Basta rellenar `telefonoOrientacion` y `telefonoContactoPublico` en los dos entornos.
Los cuatro puntos de render vuelven solos; no hay que tocar plantillas ni componentes.

---

## (b) DSH-06-02 — Atajo `Alt + Q` de la salida rápida

### El problema que se corrigió

La condición anterior era `evento.altKey && evento.key.toLowerCase() === 'q'`. En macOS,
`Option + Q` se traduce a `œ`, de modo que `event.key` nunca valía `'q'` y **el atajo
documentado no disparaba**. El botón y el doble `Escape` sí funcionaban, pero el atajo que
anuncia el propio `aria-keyshortcuts` no.

### La corrección y por qué no reintroduce el falso positivo

```ts
if (!evento.altKey || evento.ctrlKey || evento.metaKey) return false;
return evento.key.toLowerCase() === 'q' || evento.code === 'KeyQ';
```

Aceptar `event.code` por sí solo sería peligroso: en teclado latinoamericano `AltGr + Q`
escribe `@`, con `code === 'KeyQ'`. Lo que separa un `Alt + Q` real de un `AltGr + Q` es
que **en Windows AltGr se reporta como `Ctrl + Alt`**. Por eso la guarda exige `altKey`
y excluye `ctrlKey` y `metaKey` antes de mirar la tecla. Escribir un correo electrónico
sigue sin disparar la salida.

`preventDefault()` evita que el carácter traducido por la distribución (`œ`) quede escrito
en el campo enfocado antes de la redirección.

No se modificó ningún otro comportamiento de `QuickExitComponent` ni de `QuickExitService`:
el doble `Escape`, el clic, la limpieza de almacenamiento y el destino siguen igual.

### Cobertura

Diez casos, cinco positivos y cinco negativos:

| Caso | Entrada | Esperado |
|---|---|---|
| Windows/Linux latinoamericano | `key:'q'`, `code:'KeyQ'`, `altKey` | dispara + `preventDefault` |
| macOS | `key:'œ'`, `code:'KeyQ'`, `altKey` | dispara + `preventDefault` |
| Mayúscula | `key:'Q'`, `code:'KeyQ'`, `altKey` | dispara |
| AltGr en Windows | `key:'@'`, `code:'KeyQ'`, `altKey`+`ctrlKey` | **no** dispara, **no** cancela |
| Escribir `@` en campo de correo | ídem, despachado desde el `<input>` | **no** dispara, **no** cancela |
| `Cmd + Q` en macOS | `key:'q'`, `metaKey` | **no** dispara |
| `Q` sin modificadores | `key:'q'` | **no** dispara |
| `Alt` + otra tecla | `key:'a'`, `code:'KeyA'`, `altKey` | **no** dispara |

El caso del campo de correo se despacha **desde el `<input>`**, no llamando al método: así
recorre el `@HostListener('document:keydown')` real. Junto a él hay un caso de control
positivo por la misma vía, para que «no se ejecutó» no pueda significar «el manejador
nunca se enteró».

### Pendiente para el equipo

**Verificación manual sobre teclado físico**, en Windows con distribución latinoamericana
y en macOS. Ninguna prueba sintética la sustituye: Playwright y `KeyboardEvent` inyectan
los valores que uno les da, no la traducción que hace el sistema operativo. Es la única
parte de DSH-06-02 que no puede cerrarse desde el código.

---

## (c) Documentación

| Archivo | Cambio |
|---|---|
| `CLAUDE.md` §5 «Pendiente» | Pendiente 4 actualizado (ambos teléfonos vacíos a propósito, con el predicado). **Pendiente 6 nuevo:** retirar o condicionar a un flag las cuentas de prueba, `loginAsMock()`, `createMockToken`, las contraseñas genéricas y el selector de roles antes de conectar el backend o desplegar fuera de desarrollo. |
| `00-diagnostico-y-plan.md` §3.7 | ADD-01 pasa a **«ACEPTADO — deuda conocida de la etapa de desarrollo»**, con la decisión del equipo y la referencia al pendiente 6. |
| `00-diagnostico-y-plan.md` §6 | Subfase 0 reescrita: se retira el bloque (b) original (gating de cuentas de prueba) y entra DSH-06-02. Marcada como ejecutada. |
| `00-diagnostico-y-plan.md` §7 | P-17 y P-18 marcadas como **RESUELTAS**. Nota de numeración: P-09 y P-10 no existen, fueron identificadores de borrador absorbidos por P-21 y P-18. |
| `00-diagnostico-y-plan.md` §3.1, §3.6, §9 | Referencias cruzadas corregidas (P-09→P-21, P-10→P-18) y tabla de resultado actualizada. |
| `.agents/skills/angular_frontend_guidelines/SKILL.md` | Angular 17→21, Material 17→21, Node 20→24 (según `.nvmrc`), y SweetAlert2 reemplazado por `DialogoService`/`NotificacionService`. **No se tocó ninguna otra convención.** |
| `docs/contratos/DASHBOARDS_POR_ROL.md` DSH-02-04 | Se retira la hipótesis de `#814ea5` (0 usos verificados) y se precisa que el morado es la Pantone 7650 C oficial, ya tokenizada; el defecto es el literal y el uso del color como identificador. |
| `docs/contratos/DASHBOARDS_POR_ROL.md` §5.5 | Se sustituye «si no existe un token, proponerlo» por el uso directo de `--font-size-base`, que ya existe. |

El perfil COORDINADOR **no** se agregó al contrato: depende de P-02.

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `grep` de números de relleno en `src/` | **Limpio.** Las únicas coincidencias son las pruebas que verifican el rechazo y un comentario explicativo. Las de `registro-caso` y `formulario-anonimo` son números de **documento de identidad** en fixtures, no teléfonos. |
| Rol Usuario, 1440 px | Sin línea de orientación; el banner se reacomoda sin romperse. `usuario-1440.png` |
| Rol Usuario, 375 px | Ídem; salida rápida visible y sin obstrucción. `usuario-375.png` |
| Pestaña Protocolos (Admin) | Solo quedan «Línea Nacional 155» y «Línea 123». `admin-1440-protocolos.png` |
| Portada pública anónima | Sin enlaces `tel:` vacíos; pie con correo y sitio web. `portada-publica-1440.png` |
| `npm run a11y:audit` | Pasa. Sin deuda nueva: mismos valores que antes de la subfase. |
| `npm run a11y:rules` | Pasa. |
| `npm run build` | Pasa. |
| Pruebas de los archivos tocados | **29 + 10 = 39 casos, todos en verde.** |
| `npm run test:ci` | 183 de 184. El fallo es **preexistente** (ver abajo). |
| `npm run lint` | Falla por el tope. **Preexistente** (ver abajo). |

### Dos fallos preexistentes que `npm run check` arrastra

Ninguno lo introduce esta subfase, y **ninguno se corrigió**, por quedar fuera del alcance
autorizado. Se reportan porque impiden que `npm run check` pase en verde hoy:

1. **`npm run lint` supera el tope.** El proyecto admite 299 warnings; hay **302**.
   Medido sobre un *worktree* limpio en cada commit, el salto ocurre en **`d3066e0`**
   («feat(vbg): estandarizar campos, tooltips, catálogos…», integrado en el PR #13):
   299 → 302. Mis cambios aportan **0 warnings** (verificado con el informe JSON de ESLint
   por archivo: ninguno de los ficheros tocados produce avisos).
   Decidir si se corrigen los tres avisos o se ajusta el tope es del equipo; cambiar
   `package.json` habría excedido lo autorizado.

2. **`RegisterComponent` falla:** `NG0201: No provider found for 'ActivatedRoute'`. Su
   spec no provee el router. Verificado sobre el árbol sin mis cambios: **falla igual**.
   Viene del PR #14, recién integrado.

---

## Pendientes para el equipo

- **[P-04]** Número real de la Línea de Orientación Telefónica de la UdeA, con horarios y
  cobertura. Mientras tanto, cuatro puntos de la interfaz no ofrecen el canal.
- **[P-04 bis]** Teléfono de contacto del pie público (`telefonoContactoPublico`). Es un
  dato distinto del anterior; confirmar si debe ser el mismo.
- **[DSH-06-02]** Verificación manual del atajo sobre teclado físico: Windows con
  distribución latinoamericana y macOS. No puede cerrarse desde el código.
- **[ADD-01]** Deuda aceptada. Antes de conectar el backend o desplegar fuera de
  desarrollo: retirar o condicionar las cuentas de prueba y el selector de roles
  (`CLAUDE.md` §5 pendiente 6).
- **[lint]** Decidir entre corregir los tres warnings de `d3066e0` o ajustar el tope de
  `npm run lint`. Hoy `npm run check` no puede pasar por este motivo.
- **[tests]** Reparar el spec de `RegisterComponent` (falta `provideRouter` o
  `ActivatedRoute`).
- **¿Se aceptan los dos puntos de alcance añadido** (pie público y portada), o se revierten
  `876c3f6` y la parte del pie de `6c7a9c0`?
