# Mejoras del Dashboard por Rol — Casilda

> **Propósito:** guiar al agente de desarrollo (Claude Code) en el rediseño del panel de inicio que ve cada persona al iniciar sesión en Casilda (Angular), para que cada rol tenga un dashboard **moderno, claro, preciso y sin saturación**, centrado en la información de valor que le corresponde según sus permisos.
>
> **Contexto técnico actual:** la aplicación aún no está conectada al backend; los indicadores usan datos simulados (mocks). Este documento define cómo seguir trabajando con mocks sin bloquear la futura integración.
>
> **Documento hermano:** `MATRIZ_MODULO_ATENCION_VBG.md` (estandarización de formularios del módulo Equipo de Atención). Ambos se complementan; ante conflicto en formularios prevalece la matriz.
>
> **Precedencia frente al proyecto.** Este documento define **qué** muestra cada dashboard. El **cómo se ve** lo definen el sistema de diseño vigente y las reglas del repositorio, que prevalecen ante cualquier conflicto:
>
> 1. `CLAUDE.md` §3 (sistema de diseño) y §6 (reglas que no se deben romper).
> 2. `casilda-diseno-v1.md` — fuente de verdad de UI/UX. **Antes de implementar, revisar si su hoja de ruta por fases ya contempla el panel de inicio** y reportar coincidencias o diferencias con este documento.
> 3. `src/styles/_tokens.scss` y `src/styles/_base.scss` — único origen de colores, tipografías, espaciados y radios.
> 4. `.agents/skills/angular_frontend_guidelines/SKILL.md` y `.agents/skills/accessibility/SKILL.md`.
>
> **Alcance.** Este documento cubre el **panel de inicio autenticado** (`Panel de Inicio`, tras el login). La portada pública y su gestor de contenidos (`ContenidoHomeService`, `contrato-contenidos-home.md`) quedan fuera de alcance.

---

## 0. Convenciones de este documento

| Marca | Significado |
|---|---|
| **[OBSERVADO]** | Hallazgo verificado en las capturas del dashboard actual (rol Admin, 03/10/2026). |
| **[PROPUESTA]** | Mejora recomendada. Se implementa salvo que contradiga una decisión del equipo. |
| **[CRÍTICO]** | Debe corregirse antes de cualquier demostración o despliegue. |
| **[PENDIENTE]** | Requiere decisión del equipo. El agente no lo resuelve por suposición; lo reporta. |

Cada requisito tiene un ID `DSH-XX-NN` para que el agente reporte `CUMPLE` / `NO CUMPLE` / `PENDIENTE`.

---

## 1. Principios rectores

**DSH-P1 · Acción antes que métricas.** El dashboard responde primero "¿qué necesito hacer hoy?" y después "¿cómo va el sistema?". Solo los roles analíticos tienen las métricas como contenido principal.

**DSH-P2 · Cada rol ve solo lo que necesita.** El contenido se define por rol, no se filtra a partir del dashboard del administrador. Ocultar un elemento en el frontend no es control de acceso: los permisos deben validarse también en backend cuando exista.

**DSH-P3 · Ningún número sin contexto.** Toda cifra declara qué mide, sobre qué total (denominador), en qué periodo y con qué fecha de corte.

**DSH-P4 · Una sola vía de navegación primaria.** El menú lateral es la navegación. El dashboard no lo duplica con grillas de módulos.

**DSH-P5 · Calma visual.** Máximo 4 indicadores, 1 visualización principal y 1 lista de pendientes por pantalla inicial. El rojo se reserva para la salida rápida y alertas realmente críticas.

**DSH-P6 · Mínima exposición de datos sensibles.** Las vistas de resumen muestran el mínimo dato personal necesario (radicado, iniciales). El detalle se consulta dentro del expediente. Aplica el principio de necesidad de conocer y la Ley 1581 de 2012.

**DSH-P7 · Enfoque informado en trauma.** Obligatorio en todas las vistas del rol **Usuario** y deseable en las demás. Se basa en los seis principios de SAMHSA (2014): seguridad; confiabilidad y transparencia; apoyo entre pares; colaboración y mutualidad; empoderamiento, voz y elección; y consideración de aspectos culturales, históricos y de género. Ver sección 5.

---

## 2. Diagnóstico del dashboard actual [OBSERVADO]

### 2.1 Cabecera y saludo

| ID | Hallazgo | Impacto | Recomendación |
|---|---|---|---|
| DSH-01-01 | El rol aparece cuatro veces: chip de usuario, insignia "ADMIN", insignia "Admin" del saludo y título "Módulos Disponibles para Admin". | Ruido visual. Además, "Admin" y "Super Administrador" se usan como si fueran lo mismo. | Mostrar el rol una sola vez (en el menú de usuario) con su nombre oficial. |
| DSH-01-02 | La fecha se muestra como "Sábado, 3 De Octubre De 2026". | En español, días, meses y conectores van en minúscula. | El proyecto ya provee `LOCALE_ID` `es-CO`, así que el origen probable es un pipe `titlecase` o un formateo manual. Usar `DatePipe` con formato `fullDate`, sin `titlecase`: "sábado, 3 de octubre de 2026". |
| DSH-01-03 | El selector "Disposición: Lateral / Horizontal" ocupa el área principal y usa íconos de teléfono móvil. | Es una preferencia de interfaz, no información de valor. El ícono no representa la acción. | Moverlo al menú de usuario o a "Preferencias", con íconos de diseño de navegación. |
| DSH-01-04 | El nombre de usuario se trunca ("Super Administrador CASI..."). | Información incompleta en la zona más visible. | Mostrar nombre corto o nombre de pila. El nombre completo va en un tooltip o en el menú. |
| DSH-01-05 | El buscador "¿Qué necesitas gestionar hoy?" es un buen concepto, pero ocupa todo el ancho y repite la navegación. | Saturación. | Convertirlo en una paleta de comandos (atajo `Ctrl + K`) o reducirlo a un campo compacto en la cabecera. |

### 2.2 Indicadores (KPIs)

| ID | Hallazgo | Impacto | Recomendación |
|---|---|---|---|
| DSH-02-01 | Los porcentajes (30.8%, 33.3%, 26.3%) se calculan sobre los 156 casos activos, pero no se dice. Suman 90,4%. | Ambigüedad: la persona usuaria no sabe "¿porcentaje de qué?". | Declarar el denominador ("del total de casos activos") en el tooltip o eliminar el porcentaje. |
| DSH-02-02 | "Citas activas" se expresa como porcentaje de casos. | Mezcla de unidades: una cita no es un caso. | Mostrar las citas como valor absoluto con periodo ("esta semana"). |
| DSH-02-03 | La píldora "Activos" junto a "Casos activos" es redundante. | Ruido visual. | Eliminarla. |
| DSH-02-04 | Cada píldora tiene un color distinto (verde, azul, morado, naranja) sin significado. | El color sugiere un estado que no existe. | Color neutro para datos; color semántico solo para estados, siempre con tokens de `_tokens.scss`. **Verificado (2026-10-04):** la paleta heredada `#814ea5` tiene **cero usos** en `src/`; el morado es `#70205b`, la **Pantone 7650 C oficial de la UdeA**, ya declarada como token (`--color-comp-purple`). El defecto es doble: está escrito **literal** en el componente en vez de usarse el token, y se emplea como **identificador de rol y de serie sin significado semántico**. Migrar a tokens dentro de la tarea 4.2 de `plan_accesibilidad.md`. |
| DSH-02-05 | No hay periodo, fecha de corte ni tendencia. | No se puede interpretar si la cifra es buena o mala. | Agregar "Corte: [fecha y hora]" y, opcionalmente, la variación frente al periodo anterior. |
| DSH-02-06 | Los decimales usan punto ("30.8%"). | En Colombia (`es-CO`) el separador decimal es la coma. | Con `LOCALE_ID` `es-CO` ya configurado, el punto indica que el valor llega como texto preformateado (mock o `toFixed`). El mock debe entregar números y la vista formatearlos con `PercentPipe`/`DecimalPipe`. |

### 2.3 Visualización "Distribución por Identidad de Género y Diversidad"

| ID | Hallazgo | Impacto | Recomendación |
|---|---|---|---|
| DSH-03-01 | Paleta rosa/morado para mujeres y azul para hombres. | Refuerza estereotipos de género, algo incoherente con un sistema que aborda discriminaciones basadas en género. | Paleta categórica apta para daltonismo, sin asociación cultural de género y **expresada como tokens**. Si `casilda-diseno-v1.md` y `_tokens.scss` no definen una paleta para visualización de datos, proponer tokens `--color-data-*` derivados de la paleta institucional y reportarlos para aprobación; nunca declarar hexadecimales en el componente. **[PENDIENTE]** Aprobación de la paleta. |
| DSH-03-02 | Las categorías agrupan "Mujeres (Cis/Trans)" y "Hombres (Cis/Trans)", y usan "Disidencias / Otras". | Agregar personas cis y trans invisibiliza las violencias por prejuicio. "Otras" puede percibirse como excluyente. | **[PENDIENTE]** Alinear categorías y etiquetas con el catálogo oficial de identidad de género de *Maestros del Sistema* y con el enfoque diferencial definido por el equipo. |
| DSH-03-03 | El significado depende del color de la barra. | Barrera de accesibilidad (WCAG 1.4.1). | Incluir etiquetas de texto y una tabla alternativa accesible. |
| DSH-03-04 | Hay valores pequeños (8 casos). | Al combinarse con filtros (facultad, sede), las celdas pequeñas permiten reidentificar a personas. | Aplicar supresión de celdas pequeñas en vistas filtradas (p. ej. mostrar "< 5"). **[PENDIENTE]** Umbral. |

### 2.4 Pestañas "Ruta del Caso", "Módulos de la Plataforma" y "Protocolos"

| ID | Hallazgo | Impacto | Recomendación |
|---|---|---|---|
| DSH-04-01 | Hay tres vías de navegación a los mismos destinos: menú lateral, tarjetas "Gestión del Sistema" y grilla de 13 módulos. | Saturación. Es el principal problema del dashboard actual. | Dejar el menú lateral como navegación única (DSH-P4). Retirar la grilla de módulos del inicio. |
| DSH-04-02 | Las tarjetas de módulos tienen textos largos ("¿Qué es? / ¿Cuándo usarlo?") y llamados a la acción en MAYÚSCULAS que ocupan dos líneas. | Lectura lenta. Las mayúsculas sostenidas reducen la legibilidad. | Mover este contenido a un "Centro de ayuda" o mostrarlo solo en las primeras sesiones (onboarding). Llamados a la acción en tipo oración. |
| DSH-04-03 | Los nombres no coinciden entre vistas: "Nueva Solicitud" vs "Solicitud de Acompañamiento"; "Consulta Solicitudes" vs "Consulta y Bandeja de Solicitudes"; "Registro de Caso" vs "Registro de Caso (Expediente)". | Carga cognitiva: parecen módulos distintos. | Un solo nombre por módulo, definido en un catálogo central de navegación. **[PENDIENTE]** Nombres oficiales. |
| DSH-04-04 | La tarjeta "Reportar Caso" (etiqueta "Mis Solicitudes") aparece en la vista del Admin y comparte el ícono (+) con "Solicitud de Acompañamiento". | Mezcla funcionalidades de roles distintos y confunde dos acciones diferentes. | Ícono único por módulo. Verificar que cada rol vea solo sus módulos. |
| DSH-04-05 | En el stepper de "Ruta del Caso" las etiquetas aparecen truncadas ("Recepción y Radi...", "Intervención y Ci..."). | Información clave ilegible. | Etiquetas cortas completas o stepper vertical en pantallas estrechas. |
| DSH-04-06 | Ícono desalineado con "Paso 1: Solicitud". La lista de actividades tiene doble marcador (viñeta + ícono de verificación). | Acabado visual descuidado. | Alinear íconos al texto con flexbox. Un solo marcador por ítem. |
| DSH-04-07 | La regla tipográfica vigente (`Lora` solo para `h1`–`h3` y el nombre "Casilda"; `Inter` para todo lo demás) se aplica de forma inconsistente: "Hola, Super Administrador CASILDA", "Gestión del Sistema y Configuración" y "Flujo de Vida de una Solicitud" se ven en sans, mientras "Recepción y Radicación" y "Módulos Disponibles para Admin" se ven en serif. | Jerarquía visual que no corresponde a la jerarquía semántica. | Revisar el nivel real de cada encabezado: los que son `h1`–`h3` usan `--font-serif`; los que solo parecen títulos pero no son encabezados usan `--font-sans`. Un único `h1` por vista (regla 8 de `CLAUDE.md`). |
| DSH-04-08 | Las pestañas parecen tener su propia barra de desplazamiento (scroll anidado). | Doble scroll, mala experiencia en móvil y con trackpad. | Verificar y eliminar el scroll interno; la página debe tener un solo scroll. |

### 2.5 Protocolos y canales

| ID | Hallazgo | Impacto | Recomendación |
|---|---|---|---|
| DSH-05-01 **[CRÍTICO]** | "Línea de Orientación Telefónica: 1234567890" es un número de prueba. | En un contexto de crisis, un número falso puede impedir que alguien reciba ayuda. | El valor proviene de `environment.telefonoOrientacion`, cuyo dato real está pendiente (pendiente 4 de `CLAUDE.md`). Mientras no exista, la línea **no se muestra**: renderizar solo si el valor está configurado y no es un marcador, sin valor por defecto ficticio. Nunca usar números ficticios en contenido de crisis, ni siquiera en mocks. |
| DSH-05-02 | Los números de las líneas no se pueden pulsar. | En móvil obliga a copiar el número manualmente. | Enlaces `tel:` con texto accesible. |
| DSH-05-03 | No se indican los horarios ni la cobertura de cada línea. | La persona puede llamar a una línea que no atiende en ese momento. | Agregar horario y cobertura. **[PENDIENTE]** Datos oficiales. |
| DSH-05-04 | Inconsistencia en las citas normativas: "Ley 1257 de 2008" lleva año y "Ley 1581" no. | Imprecisión. | "Ley 1581 de 2012". **[PENDIENTE]** Validar el número y la denominación de la Resolución Rectoral con el equipo jurídico. |
| DSH-05-05 | El texto de crisis está dirigido al personal ("activa de inmediato la ruta de emergencia"). | No sirve para el rol Usuario. | Redactar una versión específica por audiencia (ver sección 5). |

### 2.6 Salida rápida

La salida rápida **ya está implementada** (`QuickExitComponent` + `QuickExitService`): clic, `Alt + Q` y doble `Escape`, `location.replace()` hacia `environment.quickExitUrl`, limpieza de `sessionStorage` y de las llaves `casilda_*` y `userSession`, y colapso a botón circular de 44 px en pantallas de 900 px o menos. Según la regla 6 de `CLAUDE.md`, **no se degrada ni se oculta en ningún rol**. El trabajo del dashboard sobre ella es solo de verificación y de no interferencia.

| ID | Tipo | Requisito |
|---|---|---|
| DSH-06-01 | No interferencia | Ningún elemento nuevo del dashboard se superpone al botón, le resta contraste ni captura sus atajos (en particular, paletas de comandos o diálogos que escuchen `Escape`). |
| DSH-06-02 | Verificación | En teclados latinoamericanos `AltGr + Q` produce "@", y en Windows AltGr se reporta como `Ctrl + Alt`. Verificar que el manejador no se dispare al escribir un correo electrónico: debe comprobar `event.key` y excluir `event.ctrlKey`, no basarse solo en `event.code === 'KeyQ'`. Si falla, reportar antes de corregir, porque es funcionalidad crítica. |
| DSH-06-03 | Verificación | Confirmar que las llaves que se agreguen para el dashboard (preferencias, estado de paneles colapsables) usan el prefijo `casilda_` para quedar cubiertas por la limpieza del servicio. |
| DSH-06-04 | Contenido (rol Usuario) | Informar a la persona, en lenguaje sencillo, que la salida rápida no borra por completo el historial del navegador, y sugerir la navegación privada. |

---

## 3. Arquitectura de información común [PROPUESTA]

Todos los dashboards comparten un esqueleto y varían en el contenido de cada zona:

```
┌───────────────────────────────────────────────────────────────┐
│ Cabecera: logo · paleta de comandos · menú de usuario · Salida│
├───────────────────────────────────────────────────────────────┤
│ Z1  Saludo compacto + fecha (1 línea)                         │
│ Z2  Atención requerida  ← lista accionable, máx. 5 ítems      │
│ Z3  Indicadores clave   ← máx. 4 tarjetas, con contexto       │
│ Z4  Vista principal     ← 1 visualización o 1 agenda          │
│ Z5  Accesos frecuentes  ← máx. 4, solo si aportan atajo real  │
│ Z6  Ayuda / Protocolos  ← colapsable o en panel lateral       │
└───────────────────────────────────────────────────────────────┘
```

- **DSH-07-01** Z2 va antes que Z3: lo accionable precede a lo informativo (DSH-P1).
- **DSH-07-02** Z2 vacía muestra un estado vacío amable ("No tienes pendientes para hoy"), nunca un espacio en blanco.
- **DSH-07-03** "Ruta del Caso" y "Protocolos" pasan a Z6 como contenido de consulta: un panel colapsable recordado por usuario, o una entrada "Ayuda y protocolos" en el menú. La grilla "Módulos de la Plataforma" sale del dashboard.
- **DSH-07-04** Cada zona tiene estados de carga (skeleton), vacío y error.
- **DSH-07-05** Responsive: en móvil las zonas se apilan en el mismo orden, Z3 pasa a un carrusel o grilla 2×2 y Z5 desaparece si duplica el menú.

---

## 4. Dashboards por rol

> **[PENDIENTE]** Catálogo oficial de roles y permisos. Los perfiles siguientes se infieren del menú lateral observado (Administración, Equipo de Atención, Línea ALMA, UAD Equipos 3 y 4, Reportes y Métricas) y de los roles profesionales de la matriz (Jurídico, Psicojurídico, Psicológico, Psicoorientación). El agente debe mapear cada perfil a los roles reales del código y reportar diferencias.

### 4.1 Administración (Super Administrador / Admin)

**Pregunta que responde:** ¿la plataforma está bien configurada y funcionando?

| Zona | Contenido |
|---|---|
| Z2 | Usuarios pendientes de activación o asignación de rol · catálogos con elementos incompletos · alertas del sistema. |
| Z3 | Usuarios activos por rol · casos activos (total institucional) · solicitudes sin asignar · último cambio en maestros. |
| Z4 | Distribución agregada (corregida según §2.3) o actividad reciente de configuración. |
| Z5 | Usuarios · Maestros del Sistema · Panel de Indicadores. |

**No debe ver en el inicio:** listas nominales de personas atendidas. **[PENDIENTE]** Confirmar si el Admin tiene acceso al contenido de los casos o solo a datos agregados.

### 4.2 Profesional del Equipo de Atención (Jurídico, Psicojurídico, Psicológico, Psicoorientación)

**Pregunta que responde:** ¿a quién atiendo hoy y qué tengo pendiente?

| Zona | Contenido |
|---|---|
| Z2 | Compromisos con **fecha de cumplimiento** vencida o próxima a vencer (matriz VBG-07-09) · seguimientos sin registro reciente · solicitudes asignadas sin primer contacto. |
| Z3 | Mis citas de hoy · mis seguimientos activos · compromisos de los próximos 7 días · mis casos activos. |
| Z4 | **Agenda del día** (hora, modalidad presencial/virtual, radicado, iniciales), con acceso directo al registro de atención. |
| Z5 | Nueva solicitud · Mis asignaciones · Citas y agendamiento. |

- **DSH-08-01** Cada profesional ve solo los seguimientos de su especialidad (matriz VBG-08-10).
- **DSH-08-02** Las listas muestran radicado e iniciales, no nombres completos (DSH-P6), porque el dashboard suele verse en espacios compartidos.
- **DSH-08-03** Si la persona es la última profesional activa en un caso, el dashboard lo señala de forma sutil (anticipa la alerta de cierre general, matriz VBG-08-13).

### 4.3 Recepción / Bandeja (si existe como rol o función diferenciada)

**Pregunta que responde:** ¿qué solicitudes nuevas necesitan contacto o asignación?

| Zona | Contenido |
|---|---|
| Z2 | Solicitudes sin primer contacto ordenadas por antigüedad · llamadas sin respuesta por reintentar. |
| Z3 | Recibidas hoy · pendientes de valoración · sin asignar · tiempo medio hasta el primer contacto. |
| Z4 | Bandeja resumida con estado y antigüedad. |

**[PENDIENTE]** Confirmar si es un rol propio o una función del Equipo de Atención.

### 4.4 Línea ALMA y UAD Equipos 3 y 4

**[PENDIENTE]** El alcance funcional de estos módulos no está documentado. El agente **no** debe diseñar su contenido por suposición. Mientras se define, aplicar la plantilla:

1. ¿Cuál es la decisión o acción diaria principal de este rol? → Z2.
2. ¿Qué 3–4 cifras le indican si su trabajo va bien? → Z3.
3. ¿Qué vista usa más? → Z4.
4. ¿Qué datos **no** debe ver? → restricciones explícitas.

### 4.5 Reportes y Métricas (perfil analítico)

**Pregunta que responde:** ¿qué patrones muestra la vigilancia?

| Zona | Contenido |
|---|---|
| Z2 | Reportes programados próximos · alertas de calidad de datos (campos obligatorios vacíos, inconsistencias). |
| Z3 | Indicadores definidos por el equipo de vigilancia, con definición operativa en tooltip. |
| Z4 | Visualización principal con filtros (periodo, sede, dependencia) y tabla alternativa. |

- **DSH-09-01** Datos solo agregados y anonimizados; supresión de celdas pequeñas (DSH-03-04).
- **DSH-09-02** Toda visualización tiene una opción "Ver como tabla" y declara su fecha de corte.

### 4.6 Usuario (persona que solicita atención)

Ver la sección 5 completa. Es el dashboard más sensible del sistema.

---

## 5. Dashboard del rol Usuario — enfoque informado en trauma

> La persona que entra a este dashboard puede estar atravesando una situación de violencia, puede estar acompañada por quien la ejerce o puede estar usando un dispositivo compartido. **Cada decisión de diseño se evalúa con una pregunta: ¿esto aumenta su sensación de seguridad y control, o la disminuye?**

### 5.1 Qué SÍ debe mostrar

| ID | Contenido | Criterio |
|---|---|---|
| DSH-10-01 | **Estado de la solicitud en lenguaje claro**, con el siguiente paso, quién lo realiza y cuándo. Ej.: "Tu solicitud fue recibida. Una profesional te contactará en los próximos días hábiles." | Transparencia: reduce la incertidumbre, que es una fuente importante de ansiedad. **[PENDIENTE]** Tiempos de respuesta oficiales; no prometer plazos no confirmados. |
| DSH-10-02 | **Próxima cita** con fecha, hora, modalidad y opción de reprogramar o pedir un cambio. | Voz y elección. |
| DSH-10-03 | **Mis compromisos** (los de la persona atendida, matriz VBG-07-04), en tono de acompañamiento, no de tarea. | Colaboración, sin presión. |
| DSH-10-04 | **Contacto con el equipo** a través del canal que la persona eligió. | Confiabilidad. |
| DSH-10-05 | **Líneas de ayuda** siempre accesibles pero en tono sereno: tarjeta discreta con enlaces `tel:`, sin íconos de alarma. Los números salen de `environment` o del backend, nunca de la plantilla (regla 1 de `CLAUDE.md`). | Seguridad sin alarmismo. |
| DSH-10-06 | **Preferencias de contacto y privacidad:** canal seguro, horarios en que se puede contactar, si se puede dejar mensaje. | Seguridad y control. |
| DSH-10-07 | **Saludo con el nombre que la persona eligió** (nombre identitario), no necesariamente el nombre legal. | Respeto a la identidad de género. **[PENDIENTE]** Confirmar que el modelo de datos lo soporta. |

### 5.2 Qué NO debe mostrar

- **DSH-10-08** Ningún indicador, estadística, conteo ni gráfico institucional. La distribución por identidad de género es información de vigilancia, no de la persona.
- **DSH-10-09** El relato de los hechos ni detalles de la violencia en la pantalla inicial. Si la persona quiere consultarlos, que sea una acción deliberada y con aviso previo.
- **DSH-10-10** Información interna del caso: grupo de atención, apreciaciones profesionales, rutas internas, datos del presunto agresor.
- **DSH-10-11** Grillas de módulos, jerga técnica ("radicado preliminar", "expediente", "bandeja"), siglas sin explicar.
- **DSH-10-12** Colores de alerta, contadores en rojo o urgencias artificiales ("¡Tienes 3 pendientes!").

### 5.3 Guía de lenguaje

| Evitar | Preferir | Razón |
|---|---|---|
| Víctima | Tú / la persona (o el término que la persona elija) | No imponer una identidad. |
| Caso, expediente, radicado | Tu solicitud, tu proceso | Lenguaje cotidiano. |
| Denuncia | Solicitud de acompañamiento | Casilda no es una instancia de denuncia judicial; no crear expectativas incorrectas. |
| Agresor | (No mencionar en el dashboard) | Evitar la reexposición. |
| "Debes completar..." | "Cuando te sientas lista/o/e, puedes..." | Autonomía y ritmo propio. **[PENDIENTE]** Política de lenguaje inclusivo del equipo. |
| "Error: campo inválido" | "Revisa este dato, parece incompleto" | Tono no punitivo. |
| "Tu sesión expiró" | "Por tu seguridad, cerramos la sesión tras un tiempo sin actividad." | Explica el porqué. |

### 5.4 Seguridad y privacidad específicas

- **DSH-10-13** La salida rápida se mantiene tal como está implementada (§2.6). En la vista de Usuario se verifica especialmente que ningún elemento la tape en móvil.
- **DSH-10-14** Cierre de sesión por inactividad con aviso previo amable. **No** guardar borradores en `localStorage` en este rol: el dispositivo puede ser compartido.
- **DSH-10-15** **[PENDIENTE]** Evaluar un título de pestaña y favicon neutros para el rol Usuario, para que la pestaña no revele el propósito del sitio.
- **DSH-10-16** Las notificaciones por correo o push no incluyen contenido sensible en el asunto ni en la vista previa ("Tienes una actualización en tu cuenta").
- **DSH-10-17** Animaciones mínimas; respetar `prefers-reduced-motion`.

### 5.5 Diseño visual

- Mucho espacio en blanco, una sola columna en móvil y máximo dos en escritorio.
- Solo tokens existentes de `_tokens.scss`: superficies neutras y claras, `--color-primary` (verde UdeA) reservado para la acción principal, y nada de superficies rojas salvo la salida rápida.
- Tipografía según el sistema (`Lora` en `h1`–`h3`, `Inter` en el resto). El piso global es 14 px; el texto corrido de esta vista usa **`--font-size-base`** (16 px), ya declarado en `_tokens.scss`, y nunca baja de ahí. Interlineado amplio y frases cortas.
- Estados vacíos cálidos: "Aquí verás tu próxima cita cuando la agendemos contigo."

---

## 6. Sistema visual y componentes

> Esta sección **no** define un sistema visual nuevo: aplica el existente. Los tokens viven en `src/styles/_tokens.scss` y las utilidades en `src/styles/_base.scss`. Ningún componente declara colores, tipografías, espaciados ni radios literales; siempre `var(--token)`. Si falta un token, se propone su adición en `_tokens.scss` y se reporta; no se improvisa un valor en el componente.

### 6.1 Tarjeta de indicador (KPI)

Estructura obligatoria:

```
[Etiqueta en tipo oración]                        [botón ⓘ]
[Valor principal]   [variación opcional ▲▼ con texto accesible]
[Contexto: periodo · denominador si hay %]
```

- **DSH-11-01** El botón ⓘ es un `mat-icon-button` con `aria-label` contextual (p. ej. "Definición de casos activos") y `<mat-icon aria-hidden="true">`. `matTooltip` puede mostrar la definición, pero no es el nombre accesible (regla 7). La definición también debe ser accesible para lectores de pantalla, por ejemplo con un texto `.visually-hidden` asociado.
- **DSH-11-02** Si hay porcentaje, se declara su denominador.
- **DSH-11-03** La tarjeta es clicable solo si lleva a una vista filtrada coherente con la cifra.
- **DSH-11-04** Etiquetas en tipo oración, no en MAYÚSCULAS sostenidas.
- **DSH-11-05** Revisar primero si `casilda-diseno-v1.md` define una tarjeta de indicador. `CasildaCardComponent` está pensado para contenido destacado (`ContenidoDestacadoDto`), no para métricas; si se crea un componente nuevo, debe compartir sus tokens de superficie, borde, radio y sombra.

### 6.2 Color

- **DSH-11-06** Mapeo con los tokens existentes:

| Uso | Token / utilidad existente |
|---|---|
| Acción principal, marca | `--color-primary` (verde UdeA `#026937`) · `.boton--primario` |
| Enlaces y acción secundaria | Turquesa `#0e7774` (token secundario de `_tokens.scss`) · `.boton--secundario` |
| Superficie roja con texto (solo salida rápida y emergencias) | `--color-danger-surface`, `--color-danger-surface-hover` · `.boton--emergencia` |
| Rojo de marca `#ef434d` | Solo bordes y elementos gráficos, **nunca texto** |
| Mensajes de estado | `.casilda-alerta--peligro`, `--precaucion`, `--exito` |
| Series de datos | **[PENDIENTE]** `--color-data-*` (ver DSH-03-01) |

- **DSH-11-07** El significado nunca depende solo del color: siempre lo acompañan un ícono y un texto (regla 5).

### 6.3 Formato regional

- **DSH-11-08** `LOCALE_ID` `es-CO` ya está provisto. Usar `DatePipe`, `DecimalPipe` y `PercentPipe` sobre valores numéricos y de fecha, nunca cadenas preformateadas. Fechas: "sábado, 3 de octubre de 2026" en saludos y `DD/MM/AAAA` en tablas y formularios (coherente con la matriz VBG-04-05).

### 6.4 Accesibilidad

Se aplican `.agents/skills/accessibility/SKILL.md` y el plan `docs/evidencias/accesibilidad/plan_accesibilidad.md`. Requisitos propios del dashboard:

- **DSH-11-09** Un único `h1` por vista y `h2` por zona.
- **DSH-11-10** Los gráficos tienen alternativa textual o tabla, con `aria-label` y `scope` como el resto de tablas del proyecto.
- **DSH-11-11** Los paneles colapsables (p. ej. "Ayuda y protocolos") usan `aria-expanded`, e `inert` en el contenido oculto, igual que las filas expandibles existentes.
- **DSH-11-12** Área táctil mínima de 44 px y reflujo correcto a 320 px (tarea 4.4 del plan).

---

## 7. Implementación técnica [PROPUESTA]

Se siguen `.agents/skills/angular_frontend_guidelines/SKILL.md` y las reglas de `CLAUDE.md` §6: componentes standalone, control flow `@if`/`@for`, rutas lazy con `title`, Material importado por módulo.

### 7.1 Dashboard configurable por rol

- **DSH-12-01** Reutilizar el modelo de roles y capacidades existente (`roleGuard`, `featureCapabilityGuard`). No crear un tipo de rol paralelo.
- **DSH-12-02** Definir qué widgets ve cada rol en un solo lugar (un registro de configuración), en lugar de condicionales dispersos en las plantillas. El orden del registro define el orden visual. Ejemplo ilustrativo; adaptar a los identificadores de rol reales:

```ts
export const DASHBOARD_POR_ROL: Record<RolCasilda, readonly WidgetId[]> = {
  ADMIN:       ['pendientes', 'kpis-admin', 'distribucion-identidad', 'ayuda-protocolos'],
  PROFESIONAL: ['pendientes', 'kpis-profesional', 'agenda-hoy', 'ayuda-protocolos'],
  USUARIO:     ['estado-solicitud', 'proxima-cita', 'mis-compromisos', 'lineas-ayuda'],
};
```

- **DSH-12-03** Cada widget es un componente standalone que obtiene sus datos de un servicio, no por `@Input` desde el dashboard padre.

### 7.2 Datos simulados (mocks) preparados para backend

- **DSH-12-04** Seguir el patrón ya establecido por `ContenidoHomeService`: un servicio por fuente de datos que hoy devuelve un mock tipado con un DTO y documenta el endpoint previsto (`GET {apiBaseUrl}/...`). Cambiar al backend real debe requerir solo cambiar la implementación del servicio. Documentar cada contrato en `docs/contratos/`.
- **DSH-12-05** Todo `subscribe()` maneja `next` y `error` (regla 2), y los errores se muestran con `NotificacionService`, nunca con `console.error`.
- **DSH-12-06** Los mocks son coherentes entre sí: los totales cuadran, los porcentajes corresponden a su denominador y las fechas son relativas al día actual. Entregan números, no textos formateados (DSH-02-06).
- **DSH-12-07** Los mocks **nunca** contienen datos personales reales ni números telefónicos ficticios en contenido de crisis (DSH-05-01).
- **DSH-12-08** En entornos que no son de producción, una franja discreta "Datos de demostración" controlada por los feature flags por entorno ya existentes, para que nadie interprete los mocks como cifras reales en presentaciones.
- **DSH-12-09** Simular latencia y errores en el mock (configurable) para probar los estados de carga, vacío y error.
- **DSH-12-10** Diálogos y confirmaciones con `DialogoService` (MatDialog), nunca `alert`, `confirm` ni SweetAlert2.

---

## 8. Lista de verificación de aceptación

**Por cada rol**
- [ ] El dashboard tiene máximo 4 KPIs, 1 vista principal y 1 lista de pendientes.
- [ ] No existe una grilla de módulos que duplique el menú lateral.
- [ ] Cada cifra declara periodo, fecha de corte y, si es porcentaje, su denominador.
- [ ] Hay estados de carga, vacío y error en cada zona.
- [ ] Se verificó en 375 px, 768 px y 1440 px de ancho, sin scroll anidado.
- [ ] Navegación por teclado completa y contraste AA.

**Globales**
- [ ] `npm run check` pasa (lint, `a11y:audit`, pruebas y build) sin agregar deuda nueva.
- [ ] Ningún color, tipografía, espaciado ni radio literal en los componentes nuevos o modificados.
- [ ] DSH-05-01 corregido: ningún número telefónico ficticio en toda la aplicación.
- [ ] Fechas y números formateados con pipes sobre el `LOCALE_ID` `es-CO`.
- [ ] Nombres de módulos idénticos en menú, dashboard y títulos de página.
- [ ] La salida rápida sigue intacta y se verificaron DSH-06-01 a DSH-06-03, incluido el teclado latinoamericano.
- [ ] La paleta de la distribución de identidad de género no usa estereotipos rosa/azul.

**Rol Usuario**
- [ ] No muestra estadísticas, relato de hechos ni información interna del caso.
- [ ] Todo el texto visible cumple la guía de lenguaje (§5.3).
- [ ] No usa `localStorage` para datos de la persona.
- [ ] Las líneas de ayuda son enlaces `tel:` verificados.

---

## 9. Pendientes consolidados para el equipo

| # | Tema | Ref. |
|---|---|---|
| 1 | Catálogo oficial de roles y permisos, y su mapeo con el código | §4 |
| 2 | Alcance funcional de Línea ALMA y UAD Equipos 3 y 4 | §4.4 |
| 3 | Si Recepción/Bandeja es un rol propio | §4.3 |
| 4 | Acceso del Admin al contenido de casos o solo a agregados | §4.1 |
| 5 | Número real de la Línea de Orientación Telefónica, horarios y cobertura de las líneas | DSH-05-01, 05-03 |
| 6 | Validación jurídica de la Resolución Rectoral citada | DSH-05-04 |
| 7 | Categorías y etiquetas de identidad de género del gráfico | DSH-03-02 |
| 8 | Umbral de supresión de celdas pequeñas | DSH-03-04 |
| 9 | Nombres oficiales únicos de cada módulo | DSH-04-03 |
| 10 | Paleta de tokens para visualización de datos (`--color-data-*`) | DSH-03-01 |
| 11 | Coincidencias con la hoja de ruta de `casilda-diseno-v1.md` para el panel de inicio | Encabezado |
| 12 | Tiempos de respuesta oficiales comunicables a la persona usuaria | DSH-10-01 |
| 13 | Soporte de nombre identitario en el modelo de datos | DSH-10-07 |
| 14 | Título y favicon neutros para el rol Usuario | DSH-10-15 |
| 15 | Política de lenguaje inclusivo | §5.3 |
