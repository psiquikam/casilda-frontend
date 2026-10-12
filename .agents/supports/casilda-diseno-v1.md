# Sistema de Diseño y Especificaciones Técnicas UI/UX para Casilda (UdeA)
## Marco de Identidad Visual, Accesibilidad (WCAG) y Enfoque Sensible al Trauma

Este informe técnico establece las directrices de interfaz y arquitectura frontend para la modernización de **Casilda**, el Sistema de Información en Vigilancia en Salud Pública de la Universidad de Antioquia, enfocado en la atención, reporte y gestión de alertas sobre Violencia Basada en Género (VBG) y equidad de género [92].

---

## 1. Síntesis de Marca Digital (UdeA en Interfaces Web)

Para mantener la coherencia de la imagen institucional de la Alma Máter, el sistema se acoge de manera estricta al **Manual de Identidad Institucional (Versión 8)** y al **Manual de Sistema de Orientación Universitario** de la Universidad de Antioquia.

### A. Paleta de Colores Oficial Traducida a UI/UX (Conformidad WCAG AA/AAA)
La identidad visual de la UdeA se fundamenta en su paleta verde institucional y complementaria [21, 65, 67]. Para interfaces interactivas, estos colores se estructuran bajo tokens que garantizan una relación de contraste mínima de **4.5:1** para texto normal y **3:1** para texto grande (WCAG AA) e idealmente **7:1** (WCAG AAA):

*   **Verde Principal (Pantone 349 C - `#026937`):** Se establece como el color de marca primario [65]. En interfaces, se reserva para botones de acción positiva primarios, bordes activos y elementos estructurales del encabezado. Ofrece un excelente contraste (5.16:1) sobre fondos blancos [69].
*   **Verde Dependencias (Pantone 7740 C - `#35944b`):** Color secundario, ideal para botones secundarios de confirmación o etiquetas de éxito [65, 71].
*   **Turquesa Oscuro (Pantone 7718 C - `#0e7774`):** Debido a su alta densidad tonal, se utiliza como color para enlaces interactivos en el texto corrido y botones interactivos secundarios, garantizando legibilidad extrema [66].
*   **Rojo Emergencias (Pantone 032 C - `#ef434d`):** Color semántico para estados de peligro, errores críticos y el botón crítico de **Salida Rápida** [68].
*   **Naranja Alerta (Pantone 137 C - `#f9a12c`):** Utilizado para estados de advertencia y alertas transitorias [68].
*   **Fondo y Superficie (Gris Neutro Calmado):** Para reducir la fatiga visual y la carga cognitiva en momentos de crisis, se evitan contrastes agresivos de fondo. Se utiliza un fondo neutral claro (`#f9fafb`) y tarjetas blancas con bordes sutiles en `#e5e7eb` [60].

### B. Tipografía Institucional y Equivalencia Digital
El sistema adopta el "matrimonio tipográfico" clásico-moderno establecido en la normativa de la UdeA [20]:
*   **Times New Roman (Familia Serif):** Tipografía oficial e institucional [20, 50, 58]. Se reserva exclusivamente para encabezados de página y títulos principales (`<h1>`, `<h2>`), aportando solemnidad y reconocimiento institucional.
*   **Lato / Roboto (Familia Sans-Serif):** Tipografía complementaria recomendada por su legibilidad en pantallas [20, 59, 60, 61]. Se utiliza de manera generalizada para el cuerpo de texto, etiquetas de formularios, botones y elementos de navegación.
*   **Accesibilidad de Fuente (Resolución MinTIC 1519 de 2020):** Se define un tamaño de fuente base de `1rem` (16px) y textos de lectura de un mínimo de `0.875rem` (14px) en pantallas, asegurando que sean visibles sin mayor esfuerzo [60, 61].

### C. Uso Correcto del Imagotipo/Escudo en la Plataforma
*   **Sub-marca e Iniciativas Transitorias (Prohibición de Distintivos Propios):** De acuerdo con el manual, *no está permitida la creación de distintivos, logos o marcas independientes para programas institucionales, proyectos estratégicos o iniciativas transitorias* [83]. Por tanto, **Casilda no debe utilizar un logotipo gráfico propio** que genere dispersión de marca [89].
*   **Implementación Correcta:** Casilda se identificará visualmente mediante el **logosímbolo horizontal oficial de la UdeA** [71].
*   **Jerarquía de Dependencias:** El logosímbolo horizontal llevará debajo (centrado y en la fuente *Times New Roman Bold*, color 7740 C) el nombre de la dependencia administrativa o académica a la cual pertenece la iniciativa [71, 72]. El nombre de la plataforma ("Casilda") se presentará como texto plano estilizado en la barra de navegación lateral o en el título del contenido, pero nunca como un logo integrado en el escudo [89].
*   **Área de Reserva y Tamaños Mínimos:** Se respetará el área de seguridad mínima (basada en el ancho de la letra "U" para la versión horizontal) [64]. En pantallas digitales, el logosímbolo nunca se mostrará con un ancho inferior a **130 píxeles** para garantizar la correcta visibilidad del escudo institucional [68].
*   **Piezas Digitales:** Las imágenes del portal web o banners siguen la directriz de colocar el logosímbolo en sectores que proporcionen suficiente contraste, evitando colocarlo directamente sobre áreas complejas de imágenes sin una reserva de opacidad adecuada [70].

---

## 2. Criterios de UX/UI Sensibles al Trauma (Enfoque VBG)

El diseño de Casilda debe ser un espacio virtual seguro que no revictimice ni abrume a la persona usuaria en condiciones de vulnerabilidad o estrés.

### A. Principios Visuales para Transmitir Seguridad y Empatía
1.  **Paleta de Color Atenuada para Alertas:** Aunque el rojo (#ef434d) y el naranja (#f9a12c) se asocian con alertas, su uso directo en grandes superficies puede provocar ansiedad o pánico [68]. Para las cajas de alerta se usarán fondos pastel extremadamente suaves (ej. `#fef2f2` para peligro, `#fffbeb` para advertencia) combinados con un borde grueso a la izquierda en el color semántico de marca para guiar la atención sin agredir.
2.  **Microcopy Empático e Informativo:** Mensajes que utilicen una voz humana, respetuosa, clara y libre de juicios de valor. Toda acción debe ser explicada con transparencia (ej. *"Tus datos están protegidos bajo estricto secreto profesional. Puedes guardar un borrador en cualquier momento"*).
3.  **Confirmaciones Suaves de Seguridad:** Evitar modales intrusivos con sonidos o parpadeos agresivos. Las transiciones de interfaz deben ser fluidas pero sutiles.

### B. Arquitectura de la Información para Evitar la Saturación Visual
1.  **Formularios Segmentados (Diseño Paso a Paso / Stepper):** Los formularios de reporte de VBG suelen ser extensos. En lugar de mostrar un único formulario abrumador, se implementa una arquitectura progresiva dividida en secciones lógicas claras (ej. 1. Información General -> 2. Descripción -> 3. Red de Apoyo).
2.  **Indicadores de Progreso No-Lineales:** Permitir que la usuaria navegue libremente entre pasos sin forzar un orden rígido de llenado de información, lo cual reduce la frustración.
3.  **Inputs Opcionales:** Minimizar los campos obligatorios para permitir que la persona reporte únicamente lo que se sienta preparada para compartir en ese momento.

---

## 3. Sistema de Tokens de Diseño y Componentes Base

A continuación, se define el archivo de estilos base que implementa de forma directa las pautas de marca de la UdeA y accesibilidad para el desarrollador frontend.

### A. Archivo de Estilos Base en CSS (Variables Nativa `:root`)

```css
/**
 * CASILDA - SISTEMA DE INFORMACIÓN VBG
 * HOJA DE ESTILOS BASE Y TOKENS DE DISEÑO (UdeA COMPLIANT)
 * Conforme con WCAG 2.1 / 2.2 AA (Contraste Mínimo >= 4.5:1)
 */

:root {
  /* ==========================================================================
     1. PALETA DE COLORES OFICIAL UdeA (Equivalentes Pantone Solid Coated)
     ========================================================================== */
  --udea-green-349: #026937;    /* Verde Principal Institucional [65] */
  --udea-green-7740: #35944b;   /* Verde Dependencias e Hitos [65, 71] */
  --udea-green-361: #43b649;    /* Verde Vibrante [66] */
  --udea-green-375: #8dc63f;    /* Verde Claro [66] */
  --udea-blue-7465: #3ebdac;    /* Azul Turquesa Claro [66] */
  --udea-blue-334: #069a7e;     /* Azul Turquesa Medio [66] */
  --udea-blue-7718: #0e7774;    /* Azul Turquesa Oscuro (Ideal para textos) [66] */

  /* Paleta Complementaria Oficial [67, 68] */
  --udea-purple-7650: #70205b;  /* Púrpura */
  --udea-blue-633: #137598;     /* Azul Informativo */
  --udea-red-032: #ef434d;      /* Rojo (Uso en Alertas Críticas y Salida Rápida) */
  --udea-orange-137: #f9a12c;   /* Naranja (Precaución / Advertencia) */
  --udea-violet-1007: #532d87;  /* Violeta */

  /* ==========================================================================
     2. APLICACIÓN SEMÁNTICA UI (Accesibilidad y Enfoque Sensible al Trauma)
     ========================================================================== */
  --color-primary: var(--udea-green-349);
  --color-primary-hover: #014f29;  /* Oscurecido para estados hover interactivos */
  --color-primary-active: #01361c;
  
  --color-secondary: var(--udea-blue-7718);
  --color-secondary-hover: #0a5a57;
  
  /* Estados del Sistema (WCAG Compliant) */
  --color-danger: var(--udea-red-032);
  --color-danger-hover: #d32f2f;
  --color-warning: #d97706; /* Ajustado ligeramente desde el #f9a12c para mejor contraste en texto web */
  --color-success: var(--udea-green-7740);
  --color-info: var(--udea-blue-633);

  /* Fondos Atenuados (Sensible al Trauma - Reducción de Ansiedad) */
  --color-bg-danger-light: #fdf2f2;  /* Fondo suave para advertencias críticas */
  --color-bg-warning-light: #fffbeb; /* Fondo suave para precaución */
  --color-bg-success-light: #f0fdf4; /* Fondo suave para confirmaciones */
  --color-bg-info-light: #f0f9ff;    /* Fondo suave para guía informativa */

  /* Neutros para Lectura Optima */
  --color-text-primary: #111827;     /* Gris muy oscuro (Evita el negro puro para reducir fatiga) */
  --color-text-secondary: #4b5563;   /* Gris medio para textos de apoyo */
  --color-text-muted: #6b7280;       /* Gris claro para placeholders o metadatos */
  --color-text-on-primary: #ffffff;  /* Texto sobre fondos verdes/oscuros */
  --color-text-on-danger: #ffffff;   /* Texto sobre botones de emergencia */
  
  /* Superficies */
  --color-bg-main: #f9fafb;          /* Fondo del sitio (limpio y libre de distracciones) */
  --color-bg-surface: #ffffff;       /* Fondo de tarjetas, contenedores de formularios */
  --color-border: #e5e7eb;           /* Bordes divisores */

  /* ==========================================================================
     3. TIPOGRAFÍAS Y ESCALAS (Normativa UdeA & Accesibilidad) [20, 60]
     ========================================================================== */
  --font-serif: 'Times New Roman', Times, Georgia, serif; /* Tradición e Identidad */
  --font-sans: 'Lato', 'Roboto', -apple-system, BlinkMacSystemFont, Arial, sans-serif; /* Dinamismo y Lectura */

  /* Escala Modular Web (Tamaño Base 16px) */
  --font-size-xs: 0.75rem;    /* 12px (Metadatos/Ayuda pequeña) [60] */
  --font-size-sm: 0.875rem;   /* 14px (Textos secundarios / Etiquetas) */
  --font-size-base: 1rem;     /* 16px (Cuerpo de texto general - Lectura cómoda) */
  --font-size-md: 1.125rem;   /* 18px (Subtítulos pequeños / Inputs) */
  --font-size-lg: 1.25rem;    /* 20px (Títulos de tarjetas) */
  --font-size-xl: 1.5rem;     /* 24px (Títulos secundarios `<h2>`) */
  --font-size-2xl: 1.875rem;  /* 30px (Títulos principales de sección) */
  --font-size-3xl: 2.25rem;   /* 36px (Títulos de Landing Page `<h1>`) */

  /* ==========================================================================
     4. ESPACIADOS (Grilla de 4px / Layout Fluido)
     ========================================================================= */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px (Padding/Margin estándar) */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */

  /* ==========================================================================
     5. BORDES, SOMBRAS Y ACCESIBILIDAD
     ========================================================================== */
  --radius-sm: 4px;
  --radius-md: 8px;    /* Estándar para tarjetas y modales */
  --radius-lg: 12px;
  --radius-full: 9999px; /* Botones pill o avatares */

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);

  /* Anillo de Enfoque para Navegación por Teclado (WCAG 2.1 AAA Indicator) */
  --focus-ring: 3px solid var(--udea-blue-7465);
}

/* Reseteo y Estilos Base de Accesibilidad */
body {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: var(--color-text-primary);
  background-color: var(--color-bg-main);
  margin: 0;
}

h1, h2, h3 {
  font-family: var(--font-serif);
  font-weight: bold;
  color: var(--color-primary);
  margin-top: 0;
}

a:focus-visible, 
button:focus-visible, 
input:focus-visible, 
select:focus-visible, 
textarea:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}
```

### B. Lista de Componentes UI Clave para Casilda
1.  **Formularios Adaptativos y Accesibles:** Con etiquetas asociadas de forma semántica mediante `for`/`id`, validación en tiempo real amigable, mensajes de error descriptivos (`aria-describedby`) e indicadores visuales claros que no dependan únicamente del color (combinando color, íconos y texto).
2.  **Banners de Estado de Baja Carga:** Componentes de alerta en la parte superior del flujo con fondos suaves (`--color-bg-info-light`) y bordes notables para guiar al usuario sin causar estrés.
3.  **Botones de Acción Clara:** Diseñados con tipografía sans-serif en negrita, manteniendo el texto legible sobre el color de fondo y un área táctil mínima de **44 x 44 píxeles** (estándar de accesibilidad móvil).
4.  **Modal de Confirmación de Privacidad:** Al iniciar un reporte, un cuadro modal claro debe recordar a la persona usuaria los protocolos de manejo de datos, con una opción simple y visible de aceptación o retiro.

---

## 4. Especificación Técnica de UX: Componente 'Salida Rápida'

El botón de **"Salida Rápida" (Quick Escape)** es la herramienta de seguridad más crítica de la plataforma. Permite que una persona que está redactando o consultando información confidencial de VBG cierre de forma inmediata la pestaña o redirija la navegación a un sitio neutral en caso de que esté en riesgo de ser descubierta en su entorno físico.

### A. Comportamiento y Funcionalidad UX
1.  **Visibilidad Permanente:** El botón debe estar fijo en la pantalla (sticky/floating), visible en todo momento independientemente del desplazamiento de la página.
2.  **Redirección Instantánea:** Al hacer clic, se debe redirigir el navegador de forma inmediata a un sitio web de alta neutralidad que cargue muy rápido (como Google, un portal del clima nacional, o el portal web principal de la UdeA en una sección general).
3.  **Destrucción de Estado de Sesión:** Antes de redirigir, el componente debe limpiar cualquier dato temporal guardado en memoria, `localStorage`, `sessionStorage` o caché que pudiera comprometer la confidencialidad de los datos ingresados en el formulario de reporte.
4.  **Reemplazo del Historial:** Se debe utilizar `window.location.replace()` en lugar de `window.location.href` para que el botón de "Atrás" del navegador no permita regresar al formulario de Casilda.

### B. Accesibilidad (WCAG) y Atajos de Teclado
*   **Atajo de Teclado de Seguridad:** Se asocian dos formas de activación rápida por teclado:
    *   La tecla **`Escape` (presionada dos veces consecutivas en menos de 1 segundo)**.
    *   La combinación universal **`Alt + Q`** (especificada claramente en el texto descriptivo del botón para lectores de pantalla mediante `aria-keyshortcuts`).
*   **Contraste Elevado:** Diseñado con color de fondo rojo de peligro de la UdeA (`--udea-red-032`), garantizando total visibilidad en situaciones de pánico.
*   **Atributos ARIA Completos:** Debe incluir roles semánticos y etiquetas legibles para tecnologías de asistencia.

### C. Código del Componente Base (HTML, CSS y JS Reutilizable/TypeScript)

#### Código HTML Semántico:
```html
<button 
  id="btn-salida-rapida" 
  class="btn-escape" 
  aria-label="Salida rápida de seguridad. Presiona Alt + Q o presiona dos veces la tecla Escape para redirigir inmediatamente a un sitio seguro."
  aria-keyshortcuts="Alt+Q Escape"
  tabindex="0"
>
  <span class="btn-escape-icon" aria-hidden="true">🚪</span>
  <span class="btn-escape-text">Salida Rápida (Alt + Q)</span>
</button>
```

#### Código CSS para Posicionamiento y Estilos:
```css
.btn-escape {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 9999; /* Asegura estar por encima de cualquier modal */
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--color-danger);
  color: var(--color-text-on-danger);
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: bold;
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.btn-escape:hover,
.btn-escape:focus {
  background-color: var(--color-danger-hover);
  transform: scale(1.05);
}

.btn-escape:focus-visible {
  outline: 3px solid var(--color-text-on-danger);
  outline-offset: -4px;
}

/* Ocultar texto en pantallas muy pequeñas para mantener limpieza visual, conservando el ícono */
@media (max-width: 640px) {
  .btn-escape-text {
    display: none;
  }
  .btn-escape {
    padding: var(--space-3);
    border-radius: 50%;
    width: 44px;
    height: 44px;
    justify-content: center;
  }
}
```

#### Lógica en JavaScript (Si es posible manejarlo en TypScript)
```javascript
(function() {
  const SITIO_NEUTRAL = "https://www.google.com";

  function ejecutarSalidaDeSeguridad() {
    // 1. Limpieza inmediata de datos de sesión sensibles en cliente
    try {
      sessionStorage.clear();
      // Opcional: Limpiar solo las llaves de Casilda de localStorage para no afectar otros flujos de la UdeA
      const keysToClear = Object.keys(localStorage).filter(key => key.startsWith('casilda_'));
      keysToClear.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.warn("No se pudo limpiar el almacenamiento local/sesión:", e);
    }

    // 2. Redirección reemplazando el historial para evitar que "Volver" regrese al formulario
    window.location.replace(SITIO_NEUTRAL);
  }

  // Escucha del botón
  const boton = document.getElementById('btn-salida-rapida');
  if (boton) {
    boton.addEventListener('click', function(e) {
      e.preventDefault();
      ejecutarSalidaDeSeguridad();
    });
  }

  // Escucha de Atajos de Teclado
  let timestampUltimoEscape = 0;

  document.addEventListener('keydown', function(event) {
    // Atajo 1: Alt + Q
    if (event.altKey && (event.key === 'q' || event.key === 'Q' || event.keyCode === 81)) {
      event.preventDefault();
      ejecutarSalidaDeSeguridad();
    }

    // Atajo 2: Doble toque rápido de la tecla Escape
    if (event.key === 'Escape' || event.keyCode === 27) {
      const ahora = Date.now();
      if (ahora - timestampUltimoEscape < 1000) { // Menos de 1 segundo de intervalo
        event.preventDefault();
        ejecutarSalidaDeSeguridad();
      }
      timestampUltimoEscape = ahora;
    }
  });
})();
```

---

## 5. Briefing / Prompt de Desarrollo Frontend (Landing y Login)

El siguiente es el prompt de ingeniería estructurado listo para ser entregado a un agente de código o desarrollador Frontend Senior para maquetar la página de bienvenida y la pantalla de inicio de sesión de Casilda.

```text
Actúa como un Desarrollador Frontend Senior experto en accesibilidad (WCAG 2.2 AA) y maquetación semántica. Tu tarea es implementar y modernizar la interfaz HTML/CSS de la Landing Page (Home) y la pantalla de Login para la plataforma "Casilda", el Sistema de Vigilancia en Salud Pública sobre Violencia Basada en Género de la Universidad de Antioquia (UdeA). 

Debes utilizar un diseño empático, con baja carga cognitiva y sensible al trauma. Sigue minuciosamente los siguientes requerimientos arquitectónicos, de marca y accesibilidad:

1. Estructura de Archivos e Integración de Variables CSS:
   - Integra las variables CSS (:root) oficiales de la UdeA que te he proporcionado (Verde UdeA #026937 como primario, Lato/Roboto como fuente sans-serif para lectura, y Times New Roman como serif para encabezados solemnes).
   - Asegura que ningún texto tenga una relación de contraste inferior a 4.5:1.

2. Logosímbolo Oficial UdeA (Cumplimiento de Marca):
   - En el encabezado (Header), utiliza el logosímbolo institucional horizontal oficial de la UdeA en formato SVG o imagen clara.
   - Aplica el área de seguridad adecuada y asegúrate de que el ancho mínimo del logo en digital sea de 130px.
   - De acuerdo con el manual de identidad, el logo debe ir acompañado debajo (centrado, en fuente Times New Roman Bold en color #35944b) por el texto de su unidad organizativa: "Rectoría" o "División de Infraestructura Física / Dirección de Comunicaciones" (según corresponda administrativamente). El término "Casilda" se presentará a la derecha o debajo como un título semántico plano <h2> o <h3> separado del logo, respetando que no está permitida la creación de distintivos de marca independientes para proyectos o campañas.

3. Pantalla de Bienvenida (Landing Page) - Requerimientos de UX:
   - Sección Hero Simple: Título claro y empático en Serif (Times New Roman): "Casilda: Un espacio seguro de escucha y orientación". Añade un párrafo corto que explique con total confidencialidad el propósito del sitio.
   - Acciones Destacadas (Call To Actions):
     * Botón Primario: "Iniciar Reporte Seguro" (Estilo pill/redondeado, color de fondo Verde Principal #026937, texto blanco).
     * Botón Crítico: "Orientación Telefónica de Emergencia" (Fondo suave #fdf2f2, borde rojo #ef434d y texto rojo oscuro para alta legibilidad).
   - Sección de Advertencia de Privacidad (Calma visual): Una caja informativa de baja carga con fondo azul de información atenuado (#f0f9ff), borde izquierdo grueso en #137598 y texto gris oscuro (#111827) con ícono de candado, explicando que la navegación es segura y anónima si se prefiere.
   - Se debe validar que los componentes que se visualizan como opciones para que el usuario interactue para alguna gestión. Debe ser componentes personalizables, que significa ello que son componentes reutilizables que van a tener contenido dinamico. El cual se va controlar desde un perfil de gestor de contenidos, donde basicamente esa persona en su panel va a modificar la información que se va a exponer en dichos componentes de opción que se le brindan al usuario. La idea es que esto en su momento se haria con un endpoint que sea el que traiga esa información al momento de cargar el home. Dicho componente recibiria lo que seria un objeto como lo siguiente: imagen principal, titulo, contenido y vigencia. Lo que se rendizaria en el componente seria la imagen, el titulo y el contenido. Por ahora puedes tomar de referencia la información que tenemos en los componentes de opción en el home (ejemplo: Registrar queja, solicitud equipo de atención, etc.) esto con la finalidad de emular el mock del servicio que luego nos entregue el Backend.
   - Se debe retirar el acceso a la ruta de "Consultar caso" que se muestra actualmente en el home y desde el formulario del login, ya que esa funcionalidad luego se va a brindar desde una sesión logueada, por lo que no debería estar accesible de manera publica.

4. Pantalla de Login - Requerimientos de UX y Accesibilidad:
   - Mantén la pantalla de login extremadamente limpia, con una sola columna centrada para evitar la distracción.
   - Formulario Semántico: Utiliza etiquetas <label> explícitas asociadas mediante "for" a cada input.
   - Campos de Entrada: "Correo Institucional UdeA" (con autocompletado "username" y validación de correo) y "Contraseña" (con opción para ocultar/mostrar texto del password para evitar errores de escritura bajo situaciones de estrés).
   - Botón de Envío: "Ingresar de forma segura" con un spinner accesible para el estado de carga (`aria-live="policy"`).
   - Enlace de recuperación de contraseña accesible por teclado, utilizando el color turquesa oscuro #0e7774 para asegurar visibilidad.
   - Se habia pensado inicialmente que el formulario del login se ubicara como en la parte derecha de la pantalla y que a su lado venga acompañado de alguna infografia o información del proyecto o logo. Solo es como una sugerencia sino altera el caso de mantenerse agradable visualmente para el usuario.

5. Elemento Obligatorio de Seguridad:
   - Implementa de manera global y fija (floating) el componente de "Salida Rápida" (Quick Escape) en la esquina superior derecha utilizando el color #ef434d. Debe redirigir instantáneamente a "https://www.google.com" usando window.location.replace() y limpiar el sessionStorage al activarse mediante clic, doble pulsación de Escape, o la combinación Alt + Q.

6. Estándares de Código Esperados:
   - Código HTML5 100% semántico (<header>, <main>, <section>, <form>, <footer>).
   - Atributos aria (aria-describedby para los errores de campos, aria-invalid para validación incorrecta, aria-label en el botón de salida rápida).
   - Sin librerías externas de CSS, utiliza CSS nativo limpio con Flexbox o Grid para la estructura responsive.
```

---

## 6. Hoja de Ruta Frontend de Implementación por Fases

Para estructurar de manera óptima las tareas de maquetación y desarrollo del frontend de Casilda, se recomienda seguir este cronograma secuencial:

### Fase 1: Configuración de Cimientos y Tokens de Diseño
*   **Paso 1.1:** Creación e integración del archivo global `variables.css` con los tokens oficiales de la UdeA y estados sensibles al trauma en el repositorio del proyecto Angular / Frontend.
*   **Paso 1.2:** Configuración del reseteo CSS global, tipografías del sistema (`Times New Roman` para encabezados y `Lato` o `Roboto` para cuerpo de texto) y estilos del foco visual del teclado (`outline`).

### Fase 2: Desarrollo del Componente Global de Escape Rápido
*   **Paso 2.1:** Maquetación del componente flotante `Salida Rápida` con posicionamiento fijo, asegurando que se adapte al diseño responsive en móviles (convirtiéndose en botón circular interactivo táctil).
*   **Paso 2.2:** Codificación de la lógica TypeScript/JavaScript para la limpieza segura del almacenamiento local/sesión y la redirección instantánea por reemplazo de historial (`window.location.replace()`).
*   **Paso 2.3:** Vinculación de los atajos de teclado (`Alt + Q` y doble clic de `Escape`), testeando con tecnologías de asistencia (lectores de pantalla) el correcto anuncio del componente.

### Fase 3: Maquetación Semántica de la Landing Page y Login
*   **Paso 3.1:** Estructuración del encabezado institucional con el logosímbolo horizontal UdeA, el área de reserva regulada y el identificador de la dependencia en formato accesible.
*   **Paso 3.2:** Construcción del contenedor principal del Home con la sección Hero de baja carga cognitiva, los botones destacados de acción y la caja suave de advertencia de privacidad.
*   **Paso 3.3:** Maquetación de la interfaz de Login centrada, configurando los inputs semánticos, el toggle de visibilidad de contraseñas y las marcas de error de entrada accesibles.

### Fase 4: Pruebas de Accesibilidad y Control de Calidad
*   **Paso 4.1:** Auditoría de contraste automático y manual de todos los estados del sistema utilizando herramientas como Axe Accessibility o Lighthouse para garantizar un puntaje del 100%.
*   **Paso 4.2:** Pruebas de navegación completa mediante teclado (tecla `Tab` para enfoque secuencial y `Enter`/`Espacio` para activación de botones) asegurando que no existan trampas de foco.
*   **Paso 4.3:** Validación cruzada en navegadores de escritorio y dispositivos móviles para garantizar un comportamiento fluido y libre de saturación en el uso adaptativo.
