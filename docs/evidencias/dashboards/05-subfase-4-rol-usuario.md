# Subfase 4 — Panel del rol Usuario, con enfoque informado en trauma

> **Fecha:** 4 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards`.
> **Diagnóstico de origen:** `docs/evidencias/dashboards/00-diagnostico-y-plan.md`.
> **IDs cubiertos:** DSH-10-01…06 · DSH-10-08…14 · DSH-10-17 · DSH-06-04 · DSH-05-05.
>
> ⚠️ **Los textos de esta vista son una propuesta, no contenido aprobado.** El skill
> `casilda-ux` y el §5 del contrato exigen que **cada cadena visible se valide con el
> equipo de atención antes de ponerla frente a una persona usuaria**. Nada de lo que hay
> aquí debería llegar a producción sin esa revisión.

---

## El criterio con el que se tomó cada decisión

Quien abre esta pantalla puede estar atravesando una situación de violencia, puede estar
acompañada por quien la ejerce, y puede estar usando un teléfono que no es solo suyo. Cada
elemento se evaluó con la pregunta del contrato: **¿esto aumenta su sensación de seguridad
y control, o la disminuye?**

Por eso aquí importa tanto lo que no está como lo que está, y por eso la mitad de las
pruebas nuevas verifican **ausencias**.

---

## Resultado

| ID | Estado | Evidencia |
|----|--------|-----------|
| DSH-10-01 | **CUMPLE (sin plazo)** | «Cómo va tu proceso»: resumen, siguiente paso y **quién lo hace**. El plazo va en `null` — ver «Decisiones», punto 1. |
| DSH-10-02 | **CUMPLE** | «Tu próxima sesión» con fecha, modalidad, lugar y «Pedir otro horario». |
| DSH-10-03 | **CUMPLE** | «Lo que acordamos», encabezado con «No hay prisa: lo retomamos cuando quieras». |
| DSH-10-04 | **CUMPLE** | «Cómo nos comunicamos contigo», con el canal que la persona eligió. |
| DSH-10-05 | **CUMPLE** | Líneas de ayuda con enlaces `tel:`, sobre superficie verde suave. Sin íconos de alarma. |
| DSH-10-06 | **CUMPLE** | Canal, franja horaria y si se puede dejar mensaje, con acción para cambiarlo. |
| DSH-10-07 | **PARCIAL (P-14)** | Saluda con el nombre de la sesión, descartando lo que va entre paréntesis. El **nombre identitario** aún no existe en el modelo. |
| DSH-10-08 | **CUMPLE** | Probado: sin `app-kpi-card`, sin tablas, sin barras, sin «%». |
| DSH-10-09 | **CUMPLE** | La vista no tiene ningún campo de relato ni de hechos. |
| DSH-10-10 | **CUMPLE** | El DTO no expone grupo de atención, apreciaciones, rutas internas ni datos de terceras personas. |
| DSH-10-11 | **CUMPLE** | Probado: sin «radicado», «expediente», «bandeja», «triaje» ni grillas de módulos. |
| DSH-10-12 | **CUMPLE** | Probado: ninguna superficie roja, ningún contador, ningún signo de admiración. |
| DSH-10-13 | **CUMPLE** | La salida rápida no se toca y nada la tapa: la vista es una columna estrecha y centrada. |
| DSH-10-14 | **CUMPLE** | Probado con espía sobre `Storage.prototype.setItem`: la vista **no escribe nada**. |
| DSH-10-15 | **NO IMPLEMENTADO (P-16)** | Título y favicon neutros: decisión abierta, no se resuelve por suposición. |
| DSH-10-17 | **CUMPLE** | Una sola animación, de opacidad, ya neutralizada por `prefers-reduced-motion` en `_base.scss`. |
| DSH-06-04 | **CUMPLE** | «Tu privacidad al navegar» explica que la salida rápida **no** borra todo el historial y sugiere la ventana privada. |
| DSH-05-05 | **CUMPLE** | El texto de crisis del personal ya quedó rotulado en la Subfase 1; esta vista tiene el suyo, en otra voz. |

---

## Decisiones que conviene revisar

**1. No se promete ningún plazo, y es deliberado.** El contrato lo pide explícitamente
(DSH-10-01: «no prometer plazos no confirmados») y **[P-13]** sigue abierto. La alternativa
—escribir «te contactaremos en X días hábiles»— sería inventar un compromiso institucional
frente a alguien que está esperando ayuda. Una promesa incumplida ahí hace más daño que la
ausencia de plazo. El campo `plazo` existe en el DTO y está en `null`: cuando el equipo
confirme los tiempos, el texto aparece solo. **Hay una prueba que falla si alguien escribe
«días hábiles» en la vista.**

**2. Se evitaron las construcciones que dependen de [P-15].** La guía de lenguaje propone
«Cuando te sientas lista/o/e, puedes…», y precisamente esa forma es la que está pendiente
de la política de lenguaje inclusivo del equipo. En vez de elegir una por mi cuenta, **se
redactó sin marca de género**: «cuando quieras», «lo retomamos cuando quieras», «si te
sirve llevarlo anotado». Así el texto cumple la intención de la guía sin anticipar una
decisión que no me corresponde.

**3. Desapareció el banner «Espacio Confidencial y Seguro».** Era un sello de confianza
declarado, de los que un sistema se concede a sí mismo. Se sustituyó por algo que hace lo
mismo pero con información concreta y accionable: la tarjeta «Tu privacidad al navegar»,
que explica qué borra y qué **no** borra la salida rápida. La confianza se gana diciendo
qué pasa de verdad, no afirmando que el espacio es seguro.

**4. Se retiró la tarjeta «Queja Disciplinaria (UAD)» del panel.** Sigue accesible desde el
menú lateral. En el inicio, ofrecer un trámite sancionatorio junto al acompañamiento mezcla
dos decisiones de naturaleza muy distinta, y la guía de lenguaje advierte justamente sobre
no crear expectativas incorrectas («Casilda no es una instancia de denuncia judicial»).
**Si el equipo prefiere mantenerlo visible, es añadir una tarjeta.**

**5. «Reportar Caso» pasó a «Pedir acompañamiento».** La ruta `/reportar-caso` no cambia;
cambia cómo se le presenta a la persona, siguiendo la guía de lenguaje.

**6. Se eliminó `dashboard-home.component.scss`.** El componente quedó reducido a repartir
entre las dos vistas y ya no tiene plantilla propia que estilar.

---

## Lo que ve ahora la persona

```
Hola, Valentina
Este es tu espacio. Aquí puedes ver cómo va tu proceso y comunicarte
con el equipo que te acompaña, a tu ritmo.

┌ Cómo va tu proceso ─────────────────────────────────┐
│ Tu solicitud fue recibida y ya tienes acompañamiento│
│ en curso.                                            │
│ Nos vemos en la próxima sesión que acordamos contigo.│
│ De esto se encarga: El equipo de Casilda             │
└──────────────────────────────────────────────────────┘
┌ Tu próxima sesión ──────────────────────────────────┐
│ miércoles 7 de octubre, 10:00 a. m.                 │
│ Presencial · Oficina de Casilda                      │
│ Te acompaña Carlos Restrepo.     [Pedir otro horario]│
└──────────────────────────────────────────────────────┘
┌ Lo que acordamos ───────────────────────────────────┐
│ No hay prisa: lo retomamos cuando quieras.           │
└──────────────────────────────────────────────────────┘
┌ Cómo nos comunicamos contigo ───────────────────────┐
┌ ¿Quieres contarnos algo más? ─ [Pedir acompañamiento]┐
┌ Si necesitas hablar con alguien ahora ─ 155 · 123 ──┐
┌ Tu privacidad al navegar ───────────────────────────┐
```

Una sola columna, máximo 760 px de ancho, texto a 16 px con interlineado amplio, y una
única acción principal en verde institucional.

---

## Archivos

**Nuevos:** `services/mi-proceso.service.ts` ·
`components/dashboard-usuario/panel-usuario.component.{ts,html,scss}` (+ spec, 18 casos).

**Modificados:** `dashboard-home.component.{ts,html,spec.ts}` (queda como repartidor).
**Eliminado:** `dashboard-home.component.scss`.

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run build` | Pasa, sin errores. |
| `npm run test:ci` | **236 de 237.** El único fallo es `RegisterComponent`, **preexistente**. **21 casos nuevos.** |
| `npm run a11y:audit` | Sin deuda nueva: **0 literales** en el SCSS nuevo. |
| `npm run lint` | **302 warnings, los mismos de siempre**: 0 nuevos. |

### Las pruebas que más importan aquí

La mitad verifican **que algo no aparezca**, porque es ahí donde está el riesgo:

- **«no guarda nada de la persona en localStorage»** — espía `Storage.prototype.setItem` y
  exige que no se llame (DSH-10-14). El dispositivo puede ser compartido.
- **«no promete plazos mientras no estén confirmados»** — falla si alguien escribe «días
  hábiles» en la vista.
- **«no usa el vocabulario que la guía de lenguaje descarta»** — «víctima», «denuncia»,
  «agresor», «debes ».
- **«no usa jerga del sistema»** — «radicado», «expediente», «bandeja», «triaje», «CAS-2026».
- **«no muestra cifras, estadísticas ni gráficos»** y **«no fabrica urgencias ni
  contadores»**.
- **«el texto corrido no baja de 16 px»** — mide el tamaño calculado, no el declarado.

---

## Pendientes para el equipo

**Bloqueante antes de desplegar esta vista:**

- **Validación de cada cadena visible con el equipo de atención.** Es un requisito del
  skill y del contrato, y es la parte que ningún desarrollo sustituye. Los textos de aquí
  son una propuesta redactada siguiendo §5.3.

**Decisiones abiertas:**

- **[P-13]** Tiempos de respuesta oficiales. Hasta tenerlos, la vista no promete plazos.
- **[P-14]** ¿El modelo de datos soportará **nombre identitario** distinto del legal?
  Mientras no, el saludo usa el nombre de la sesión (DSH-10-07).
- **[P-15]** Política de lenguaje inclusivo. El texto actual evita la marca de género para
  no anticipar la decisión.
- **[P-16]** ¿Título de pestaña y favicon neutros para este rol? (DSH-10-15). No se
  implementó.
- **[P-19]** La sesión sigue en `localStorage` (`userSession`, en `auth.service.ts`). **La
  vista no escribe nada**, pero la sesión la escribe el servicio de autenticación, para
  todos los roles. Moverla a `sessionStorage` para este rol es un cambio fuera del panel.
- **¿Se acepta retirar la tarjeta de queja UAD del inicio** (punto 4) o se restituye?
- **[lint]** Sigue sin decidirse si se corrigen los tres warnings de `d3066e0` o se ajusta
  el tope. `npm run check` no pasa en verde por esto.
