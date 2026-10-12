# Subfase 3 — Dashboards del personal

> **Fecha:** 4 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards`.
> **Diagnóstico de origen:** `docs/evidencias/dashboards/00-diagnostico-y-plan.md`.
> **IDs cubiertos:** DSH-03-04 · DSH-08-03 · DSH-09-01 · DSH-09-02 · §4.5.
> **IDs ya cubiertos en la Subfase 2:** DSH-02-01, 02-02, 02-03, 02-05, 03-03, 08-02,
> 11-02, 11-03, 11-10.
> **IDs bloqueados:** DSH-03-01 (P-03) · DSH-03-02 (P-05) · DSH-08-01 (P-12) · §4.3 (P-02).

---

## Qué quedaba realmente por hacer

La Subfase 2 adelantó buena parte de esta subfase: al construir la arquitectura común ya
quedaron los indicadores con periodo, fecha de corte y denominador; la tabla como
representación primaria; y las listas con radicado e iniciales. Conviene decirlo para que
no parezca que esta subfase hace menos de lo previsto: **hace lo que faltaba**, y lo que
faltaba es, casi todo, lo que más importa en materia de privacidad.

De lo que quedaba, una parte está **bloqueada** por decisiones del equipo. Lo entregable
sin suposiciones era:

1. La **vista analítica con filtros** del perfil de Reportes (§4.5).
2. La **supresión de celdas pequeñas**, que es precisamente el riesgo que los filtros
   crean (DSH-03-04, DSH-09-01).
3. El aviso de **última profesional activa** (DSH-08-03).

---

## Resultado

| ID | Estado | Evidencia |
|----|--------|-----------|
| §4.5 | **CUMPLE** | `VigilanciaWidget` + `VigilanciaService`: filtros de periodo, sede y dependencia, con tabla alternativa y fecha de corte. El perfil analítico deja de compartir la Z4 del Admin. |
| DSH-03-04 | **CUMPLE** | `core/vigilancia/supresion-celdas.ts`, aplicado **en el servicio** antes de que el dato salga. |
| DSH-09-01 | **CUMPLE** | Solo agregados; ningún conteo por debajo del umbral llega al DOM (probado). |
| DSH-09-02 | **CUMPLE** | La tabla es primaria y la barra es decorativa (`aria-hidden`); el `caption` declara total y corte. |
| DSH-08-03 | **CUMPLE** | Aviso sutil «Eres la última profesional activa en este caso», sin rojo ni urgencia. |
| DSH-03-01 | **BLOQUEADO (P-03)** | Las series siguen con los alias complementarios oficiales. El estereotipo ya está eliminado (color por orden, no por categoría), pero la paleta definitiva necesita aprobación. |
| DSH-03-02 | **BLOQUEADO (P-05)** | Las categorías siguen siendo provisionales, marcadas en el servicio. |
| DSH-08-01 | **NO IMPLEMENTABLE (P-12)** | Requiere un modelo de especialidades que no existe: hay un único rol `PROFESIONAL`. |
| §4.3 | **BLOQUEADO (P-02)** | No se sabe si Recepción/Bandeja es un rol propio. |

---

## La supresión de celdas pequeñas

Es lo más importante de esta subfase y conviene explicar por qué no es un detalle.

Sin filtros, «Disidencias / Otras: 8 casos» es una cifra agregada inocua. Al cruzar sede
con dependencia, ese 8 puede bajar a 2 — y en una dependencia concreta, dos casos son dos
personas que alguien de esa dependencia puede identificar. El contrato lo señala
(DSH-03-04) y el riesgo se materializa justo al añadir los filtros que pide §4.5, así que
ambas cosas tenían que entrar juntas.

**Dos decisiones que merecen revisión:**

**1. La supresión se aplica en el servicio, no en la vista.** Así ninguna vista puede
publicar por descuido un conteo identificable: el dato sale ya suprimido. Cuando exista
backend, **debe aplicarla también él**: ocultar en el frontend no es control de acceso
(DSH-P2), y queda anotado en el código.

**2. Hay supresión secundaria, y sin ella la primera sería decorativa.** Si se oculta una
sola celda pero se publican el total y el resto, el valor oculto se recupera restando:
`72 − 40 − 30 = 2`. Por eso, cuando solo una celda cae bajo el umbral, **se suprime
también la siguiente más pequeña**. Hay una prueba dedicada a esto.

**Sobre el umbral (P-06):** se usa **5**. No es una suposición mía: es el valor que el
propio contrato propone como ejemplo («p. ej. mostrar "< 5"») y el más extendido en
estadística oficial. Está en una sola constante, `UMBRAL_SUPRESION`, y la función acepta
otro valor por parámetro. **Si el equipo decide otro número, es cambiar esa línea.**

---

## Archivos

**Nuevos**

| Archivo | Qué aporta |
|---|---|
| `core/vigilancia/supresion-celdas.ts` (+ spec, 7 casos) | Supresión primaria y secundaria, umbral configurable. |
| `services/vigilancia.service.ts` | Distribución filtrable, con supresión aplicada antes de devolver. |
| `components/dashboard/widgets/vigilancia.widget.{ts,html}` (+ spec, 9 casos) | Z4 del perfil analítico. |

**Modificados:** `core/dashboard/dashboard-por-rol.ts` (`vigilancia` para REVISOR),
`panel-inicio.component.{ts,html,spec.ts}`, `services/dashboard-trabajo.service.ts`
(DSH-08-03), `widgets/pendientes.widget.ts`, `widgets/widgets.scss`.

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run build` | Pasa, sin errores. |
| `npm run test:ci` | **224 de 225.** El único fallo es `RegisterComponent`, **preexistente**. **18 casos nuevos.** |
| `npm run a11y:audit` | Sin deuda nueva: **0 literales** en los archivos nuevos (29 de 66, igual que antes). |
| `npm run lint` | **302 warnings, los mismos de siempre**: 0 nuevos. |

### Pruebas que vale la pena mirar

- **«nunca publica un conteo por debajo del umbral en el DOM»** — recorre los grupos tras
  el filtro más restrictivo y verifica que ninguno publicable queda por debajo de 5.
- **«aplica supresión secundaria»** — fija el caso en que el valor sería deducible restando.
- **«explica la celda oculta también a lectores de pantalla»** — el «< 5» por sí solo no
  dice nada a quien no ve la nota al pie.
- **«al cruzar sede y dependencia oculta los conteos identificables»** — reproduce el
  escenario exacto que describe DSH-03-04.

---

## Pendientes para el equipo

Esta subfase deja **cuatro cosas bloqueadas**, y las cuatro necesitan una decisión, no más
desarrollo:

- **[P-06]** ¿Se confirma **5** como umbral de supresión? Es el ejemplo del propio contrato,
  pero conviene que lo valide quien responde por la vigilancia.
- **[P-03]** Paleta `--color-data-*` (propuesta en el §5 del diagnóstico, con contrastes
  calculados). Sin ella, DSH-03-01 no puede cerrarse.
- **[P-05]** Categorías oficiales de identidad de género. Hoy siguen las provisionales.
- **[P-02]** ¿Recepción/Bandeja es un rol propio? Determina si falta un dashboard.
- **[P-12]** ¿Habrá modelo de especialidades (Jurídico, Psicojurídico, Psicológico,
  Psicoorientación)? Sin él, DSH-08-01 —que cada profesional vea solo los seguimientos de
  su especialidad— **no es implementable**.
- **[P-11]** ¿El Admin accede al contenido de los casos o solo a agregados? Hoy su Z2
  muestra solo alertas de configuración, sin radicados, que es la lectura conservadora.
- **Catálogos de sede y dependencia:** hoy están en el frontend
  (`vigilancia.service.ts`), marcados con `TODO(backend)`. Deben venir de Maestros del
  Sistema (regla 1 de `CLAUDE.md`).
- **[lint]** Sigue sin decidirse si se corrigen los tres warnings de `d3066e0` o se ajusta
  el tope. `npm run check` no pasa en verde por esto.
