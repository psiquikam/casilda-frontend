# Levantamiento de Requerimientos y Especificación Técnica — Módulo Línea Alma (Proyecto CASILDA)

Este documento constituye la especificación formal de requerimientos funcionales, no funcionales y arquitectónicos del módulo **Línea Alma** del sistema CASILDA (Universidad de Antioquia), elaborado por el equipo de arquitectura e ingeniería de software a partir del análisis de la documentación del proyecto, las actas de reunión del equipo de desarrollo, los manuales del modelo de telesalud y el esquema de base de datos PostgreSQL.

---

## 1. Mapa del módulo

### Submódulos y procesos derivados
A partir del análisis de las fuentes documentales del proyecto (especialmente el documento *Flujo de Información en Módulo Línea Alma*, la propuesta *Bienestar Violeta te Orienta 2025*, el *Informe Técnico de Línea Violeta* y las *Grabaciones y Transcripciones de la Reunión del Equipo de Desarrollo de noviembre de 2026*), se identifican los siguientes submódulos y procesos derivados:

*   **Submódulo APH (Atención Prehospitalaria / Primer Respondiente)**: Constituye la puerta de entrada operativa y la primera respuesta de Línea Alma. Funciona las 24 horas del día, los 7 días de la semana (24/7), atendiendo llamadas telefónicas e interacciones vía WhatsApp (específicamente la Opción 2 del menú automatizado). Su función es brindar contención emocional inmediata, aplicar el triaje estandarizado de riesgo, diligenciar la caracterización sociodemográfica básica, preguntar obligatoriamente a la víctima si desea atención psicológica y gestionar las primeras derivaciones (*fuente: Flujo de Información en Módulo Línea Alma y Grabación de la reunión del Equipo de Desarrollo*).
*   **Submódulo Psicología (Psicología Línea Alma / Teleorientación Psicológica)**: Constituye el tramo especializado de orientación en salud mental y apoyo psicosocial. Se encarga de la recepción de casos derivados por APH o por remisión interna, la ejecución del protocolo escalonado de intentos de contacto telefónico (hasta 9 intentos), la valoración clínica de riesgo psicosocial, la estructuración de la entrevista semiestructurada, la programación y ejecución de seguimientos clínicos, el registro opcional de datos del presunto agresor y la definición del cierre o derivación hacia otras instancias (*fuente: Flujo de Información en Módulo Línea Alma, Aspectos Generales y de Funcionamiento Línea Violeta y Planificación Completa Fase 2*).
*   **Proceso Derivado — Telepsiquiatría / Valoración Psiquiátrica**: Servicio contemplado conceptualmente en el modelo de telesalud del LivingLab (LIME - Facultad de Medicina / Hospital Alma Máter) para la valoración de casos prioritarios de salud mental que requieren manejo médico especializado (*fuente: Propuesta Bienestar Violeta te Orienta 2025*).
*   **Proceso Derivado — Activación de Rutas Internas**: Derivación formal y escrita (que exige el consentimiento informado expreso de la víctima) hacia otras dependencias de la Universidad de Antioquia: *Seguridad a Personas y Bienes (SPyB)*, *Equipo de Atención (EA)*, *Dupla Psicojurídica*, *Programa de Masculinidades* y la *Unidad de Asuntos Disciplinarios (UAD)* (*fuente: Aspectos Generales y de Funcionamiento Línea Violeta y Flujo de Información en Módulo Línea Alma*).
*   **Proceso Derivado — Activación de Rutas Externas**: Articulación e informe de remisión informativa hacia entidades del estado y redes de protección de la ciudad/departamento: *Línea 123 (Medellín/Antioquia)*, *Código Fucsia / Sector Salud (EPS/IPS/Urgencias)*, *Fiscalía General de la Nación*, *Comisarías de Familia*, *Policía Nacional*, *ICBF* y *CAIVAS* (*fuente: Aspectos Generales y de Funcionamiento Línea Violeta y Planificación Completa Fase 2*).
*   **Proceso Derivado — Atención de Contención Post-Cierre**: Atención de orientación o contención emocional brindada por APH o Psicología a personas cuyos casos ya han sido cerrados formalmente y que vuelven a comunicarse con la línea. Esta atención se registra de forma independiente para conservar trazabilidad, sin reabrir el caso derivado previo ni incrementar el contador de seguimientos reglamentarios (*fuente: Flujo de Información en Módulo Línea Alma y Planificación Completa Fase 2*).

### Equivalencias terminológicas
*   **Línea Alma**: Nombre oficial del módulo en la arquitectura del sistema CASILDA (*fuente: Arquitectura Sistema CASILDA y Flujo de Información Módulo Línea Alma*).
*   **Línea Violeta**: Denominación institucional previa y operativa dentro del modelo de telesalud de la Universidad de Antioquia (*fuente: Aspectos Generales y de Funcionamiento Línea Violeta*). **Inferido**: Se trata del mismo servicio de atención a violencias basadas en género (VBG); en el desarrollo del sistema debe estandarizarse la interfaz bajo la denominación "Línea Alma".
*   **LIME / LivingLab Telesalud**: Laboratorio Integrado de Medicina Especializada de la Facultad de Medicina de la Universidad de Antioquia que opera el servicio asistencial (*fuente: Propuesta Bienestar Violeta te Orienta 2025*).
*   **APH**: Sigla correspondiente a *Atención Prehospitalaria*. En el contexto de Línea Alma, designa al técnico en salud o auxiliador que actúa como primer respondiente telefónico (*fuente: Aspectos Generales y de Funcionamiento Línea Violeta y Grabación de la reunión del Equipo de Desarrollo*).

### Dinámica de relación entre submódulos
1. **Entrada al Sistema**: Las solicitudes ingresan a APH vía directa (Llamada/WhatsApp 24/7) o por remisión en bandeja enviada desde Equipo de Atención, SPyB o UAD.
2. **Atención APH**: APH registra la atención inicial y genera un identificador único de atención (`ALMA-YYYY-NNNNNN`). APH evalúa el triaje. Si la víctima autoriza la remisión psicológica, la atención pasa a la bandeja compartida de Psicología.
3. **Paso a Psicología**: El psicólogo disponible toma la solicitud de la bandeja compartida. Al lograr el primer contacto efectivo y registrar la valoración, el sistema genera o vincula el código único de Caso CASILDA (`CAS-YYYY-NNNNNN`).
4. **Recontactos**: Si una persona con seguimiento activo en Psicología vuelve a llamar a APH, el sistema genera un nuevo registro de atención APH (`ALMA-...`), despliega una alerta informativa a APH y notifica automáticamente a la bandeja del psicólogo asignado. El psicólogo evalúa si vincula la nueva atención al caso existente, abre un caso nuevo si corresponden a hechos diferentes, o si la trata como una contención puntual.

### Componentes mencionados de forma ambigua o sin detalle suficiente
*   **Telepsiquiatría / Orientación Médica**: Figura en los diagramas de bloques del LivingLab, pero **no está definido en las fuentes** ningún endpoint, entidad o formulario específico en la arquitectura de software de CASILDA Fase 2.
*   **15 Dimensiones de Salud Mental**: Mencionadas por el cliente en las reuniones y en el informe de Línea Violeta como una clasificación propia del LivingLab. **Sin información en las fuentes** sobre la lista o catálogo detallado de estas 15 dimensiones.

---

## 2. Diagnóstico

### Necesidad expresada por el cliente
La operación de la Línea Violeta/Alma se venía ejecutando sobre herramientas de formularios aislados y hojas de cálculo desarrolladas previamente por el equipo de Analítica y el LivingLab. Al no estar integradas con la arquitectura institucional de CASILDA, impedían una trazabilidad completa de la Ruta Violeta (*fuente: Aspectos Generales y de Funcionamiento Línea Violeta y Grabación de la reunión del Equipo de Desarrollo*).

### Fallas del proceso actual
1.  **Inexistencia de un identificador único por caso**: Las consultas y registros se realizaban únicamente ingresando el número de cédula de la persona. Esto impedía diferenciar cuando una misma víctima sufría múltiples hechos de violencia independientes en distintos momentos (*fuente: Aspectos Generales y de Funcionamiento Línea Violeta*).
2.  **Ausencia de agenda y recordatorios automáticos**: El sistema anterior no agendaba controles ni enviaba alertas, obligando a los psicólogos a llevar bitácoras personales físicas o digitales externas para recordar las fechas de recontacto (*fuente: Aspectos Generales y de Funcionamiento Línea Violeta*).
3.  **Desconexión ante recontactos**: Cuando la persona llamaba de nuevo a la línea mientras tenía un seguimiento activo, el primer respondiente no recibía alertas del estado psicológico y el psicólogo no se enteraba del recontacto producido en APH (*fuente: Flujo de Información en Módulo Línea Alma*).

### Objetivo de la solución tecnológica
Integrar Línea Alma dentro de la plataforma CASILDA Fase 2, proveyendo un esquema desacoplado de **códigos de atención (`ALMA-...`) y códigos de caso (`CAS-...`)**, una bandeja compartida con semáforo SLA basado en el triaje de APH, notificaciones internas automáticas de recontacto y recordatorios automatizados por correo electrónico (*fuente: Planificación Completa Fase 2 y Flujo de Información Módulo Línea Alma*).

---

## 3. Actores y roles

| Rol Cliente / Sistema | Quién es en la Organización | Submódulos en los que Participa | Acciones que Realiza | Información que Consulta o Modifica |
| :--- | :--- | :--- | :--- | :--- |
| **Técnico APH (Atención Prehospitalaria)** | Técnico o auxiliador en salud del LivingLab LIME. Primer respondiente 24/7. | Submódulo APH. | Recibe llamadas/WhatsApp, realiza contención, diligencia triaje, deriva a Psicología/rutas, registra atenciones APH. | **Consulta:** Datos sociodemográficos y estado de seguimiento activo (sin notas clínicas). **Modifica:** Registro de atención APH, triaje y observaciones APH. |
| **Profesional en Psicología** | Psicólogo clínico de telesalud del LivingLab. | Submódulo Psicología. | Ejecuta protocolos de llamada (1-9), realiza primer contacto efectivo, valoración clínica, seguimientos, derivaciones y cierres. | **Consulta:** Notas APH, historial clínico del caso, antecedentes permitidos. **Modifica:** Formulario psicológico, valoración de riesgo, agresor y seguimientos. |
| **Usuario / Víctima** | Estudiante, docente o empleado UdeA atendido. | Portal Usuario / Solicitudes. | Radica reportes, otorga consentimiento informado, recibe orientación y recordatorios de cita. | **Consulta:** Estado básico de sus trámites en su perfil. **Modifica:** Formulario autodiligenciable y aceptación de términos. |
| **Equipo de Atención (EA)** | Profesionales del tramo central de Ruta Violeta (Dupla Psicojurídica). | Módulo EA / Interconexión Línea Alma. | Remite casos a APH o recibe derivaciones desde Psicología para acompañamiento presencial/especializado. | **Consulta:** Remisiones enviadas y recibidas de Línea Alma. **Modifica:** Estado de gestión en el tramo de Equipo de Atención. |
| **Analista de Riesgos (SPyB)** | Coordinador del módulo de Seguridad a Personas y Bienes. | Módulo SPyB / Interconexión APH. | Recibe reportes directos de APH ante emergencias en el campus y gestiona medidas de protección. | **Consulta:** Notificaciones de emergencias o solicitudes de acompañamiento. **Modifica:** Órdenes de acompañamiento y medidas de seguridad. |
| **Administrador / Revisor** | Administrador del sistema o profesional revisor CASILDA. | Módulos transversales. | Administra usuarios, listas maestras, asignaciones y dashboards. | **Consulta:** Todos los módulos del sistema. **Modifica:** Usuarios, catálogos y parámetros. |

---

## 4. Flujo principal

### Recorrido paso a paso del caso
1.  **Paso 1: Recepción e Ingreso de la Solicitud**
    *   *Disparador*: Llamada telefónica entrante 24/7, mensaje de WhatsApp (Opción 2 APH) o remisión recibida desde la bandeja de EA/SPyB/UAD.
    *   *Actor*: Técnico APH.
    *   *Acción*: Digita la cédula de la persona. Si el sistema detecta un seguimiento psicológico activo, muestra una alerta informativa indicando fecha de próximo seguimiento y profesional a cargo, y genera una notificación automática a Psicología. APH captura los datos de la atención.
    *   *Datos de Entrada*: Tipo y número de documento, canal de origen, datos del solicitante/tercero, motivo de consulta.
    *   *Datos de Salida*: Registro de Atención APH con ID único (`ALMA-YYYY-NNNNNN`).
    *   *Siguiente paso*: Valoración de triaje APH.
2.  **Paso 2: Valoración de Triaje y Derivación Inicial**
    *   *Disparador*: Guardar los datos de la atención inicial.
    *   *Actor*: Técnico APH.
    *   *Acción*: Registra el triaje de prioridad (Alto, Medio, Bajo). Si hay peligro inminente para la vida, permite omitir el triaje registrando la justificación y activando directamente a SPyB o Línea 123. APH formula la pregunta obligatoria: *"¿Desea remisión a Psicología?"*.
    *   *Datos de Entrada*: Nivel de triaje, justificación narrativa (si aplica), respuesta sobre remisión psicológica.
    *   *Datos de Salida*: Estado de la atención APH y derivación a la bandeja de Psicología o rutas externas.
    *   *Siguiente paso*: Si acepta Psicología, ingresa a la bandeja de Psicología; si no, APH gestiona rutas externas o cierra.
3.  **Paso 3: Gestión de Contacto Telefónico (Psicología)**
    *   *Disparador*: Ingreso de la derivación a la bandeja compartida de Psicología.
    *   *Actor*: Psicólogo disponible.
    *   *Acción*: Toma la novedad de la bandeja compartida. Ejecuta el protocolo de llamadas (Protocolo 1: 1er intento; Protocolo 2: 2do intento en diferente día/horario; Protocolo 3: 3er intento en diferente día/horario; adicionales si se justifican). Registra el resultado de cada intento.
    *   *Datos de Entrada*: ID de atención APH, nota APH, nivel de triaje.
    *   *Datos de Salida*: Notas independientes de intento de contacto.
    *   *Siguiente paso*: Si logra contacto, pasa a la atención psicológica. Si agota 9 intentos sin éxito, el sistema cierra por "No contacto".
4.  **Paso 4: Primer Contacto Efectivo y Consolidación del Caso CASILDA**
    *   *Disparador*: Respuesta positiva de la víctima en la llamada.
    *   *Actor*: Psicólogo.
    *   *Acción*: Solicita y registra el consentimiento informado verbal, realiza la caracterización y la valoración clínica de riesgo psicosocial, y registra opcionalmente los datos del presunto agresor. En este momento se genera formalmente el código de Caso CASILDA (`CAS-YYYY-NNNNNN`) o se vincula la atención a un caso existente previa confirmación.
    *   *Datos de Entrada*: Respuesta de consentimiento verbal, valoración de riesgo, datos del presunto agresor, acuerdos.
    *   *Datos de Salida*: Caso CASILDA registrado en estado `ABIERTO_ACTIVO`, nota de primera atención y fecha/hora acordada para el control.
    *   *Siguiente paso*: Programación del próximo seguimiento y envío de correo recordatorio.
5.  **Paso 5: Seguimiento Psicológico y Cierre**
    *   *Disparador*: Cumplimiento de la fecha/hora programada para el siguiente control.
    *   *Actor*: Psicólogo disponible.
    *   *Acción*: Ejecuta la sesión de seguimiento (mínimo 3 controles reglamentarios, o adicionales si se requiere). En cada control se consulta: *"¿Desea continuar con el seguimiento?"*. Si acepta, se agenda el siguiente control y se envía correo recordatorio. Si finaliza, el psicólogo selecciona el motivo de cierre predefinido y cierra el caso en Línea Alma.
    *   *Datos de Entrada*: Nota de seguimiento, decisión de continuidad, motivo de cierre.
    *   *Datos de Salida*: Caso finalizado en Línea Alma en estado `CERRADO`.

### Estados del caso y transiciones
*   `PENDIENTE_APH`: Estado inicial de solicitudes que ingresan por remisión interna a la bandeja de APH.
*   `EN_GESTION_APH`: Solicitud en proceso de orientación o seguimiento a rutas externas por parte de APH (sin derivación psicológica).
*   `PENDIENTE_PSICOLOGIA`: Caso derivado por APH que ingresa a la bandeja compartida de Psicología con semáforo SLA activo.
*   `ABIERTO_ACTIVO` / `EN_SEGUIMIENTO`: Caso con primer contacto efectivo realizado y controles programados.
*   `CERRADO`: Caso finalizado por APH (si no aceptó Psicología) o por Psicología tras agotar la atención o por decisión de la persona.

### Excepciones y caminos alternos
*   *Urgencia Vital / Riesgo Inminente*: APH detecta intento suicida o violencia en curso en el campus. Omite el triaje regular, registra la justificación y deriva directamente a SPyB (Central de Monitoreo) o Línea 123.
*   *Atención Post-Cierre (Contención)*: Persona con caso cerrado llama de nuevo. APH o Psicología registran una nota de contención post-cierre. Se almacena la atención sin reabrir el caso formalmente ni alterar el contador de seguimientos.

---

## 5. Requerimientos funcionales generales del módulo

| ID | Requerimiento Funcional General | Actor | Prioridad Expresada | Cita de Origen |
| :--- | :--- | :--- | :--- | :--- |
| **RF-ALMA-001** | **Estructura de Identificadores Únicos**: El sistema debe generar un ID único de atención (`ALMA-YYYY-NNNNNN`) por cada atención en APH, y generar/vincular un código único de Caso CASILDA (`CAS-YYYY-NNNNNN`) únicamente al realizarse el primer contacto efectivo de Psicología. | APH / Psicólogo | **Alta** | *Reunión Equipo Desarrollo nov-2026 y Flujo de Información Módulo Línea Alma* |
| **RF-ALMA-002** | **Bandeja de Remisiones Recibidas**: El sistema debe disponer de una bandeja de entrada para APH y Psicología donde se visualicen las solicitudes remitidas desde otros tramos de la Ruta Violeta (EA, SPyB, UAD). | APH / Psicólogo | **Alta** | *Flujo de Información Módulo Línea Alma y Planificación Completa Fase 2* |
| **RF-ALMA-003** | **Notificación Automática por Recontacto**: Al ingresar la cédula de una persona con seguimiento psicológico activo, el sistema debe alertar al profesional y notificar a la bandeja de Psicología para evaluar su vinculación. | APH / Psicólogo | **Alta** | *Flujo de Información Módulo Línea Alma y Reunión Equipo Desarrollo nov-2026* |
| **RF-ALMA-004** | **Consentimiento Informado Obligatorio**: El sistema debe exigir el registro de la lectura y aceptación del consentimiento informado (verbal o digital) previa a la derivación o inicio de atención psicológica. | APH / Psicólogo | **Alta** | *Aspectos Generales Línea Violeta y Planificación Completa Fase 2* |
| **RF-ALMA-005** | **Funcionalidad Guardar Progreso**: El sistema debe implementar la opción "Guardar" borrador para almacenar cambios parciales sin cerrar la atención ni finalizar el trámite. | APH / Psicólogo | **Alta** | *Planificación Completa Fase 2 (HU-31)* |
| **RF-ALMA-006** | **Homologación Transversal de Variables**: Las etiquetas y variables sociodemográficas de Línea Alma deben estar estandarizadas con las de Equipo de Atención. | Todos los roles | **Alta** | *Planificación Completa Fase 2 (HU-33)* |
| **RF-ALMA-007** | **Generación y Descarga de PDF de Atención**: El sistema debe permitir a los profesionales autorizados exportar un PDF con el historial de atenciones y seguimientos del caso. | Psicólogo | **Alta** | *Planificación Completa Fase 2 (HU-30) y Aspectos Generales Línea Violeta* |

---

## 6. Resumen por submódulo

### Submódulo APH (Atención Prehospitalaria)
*   **Propósito**: Atender la línea 24/7 (teléfono/WhatsApp), brindar primeros auxilios psicológicos y contención, evaluar la prioridad por triaje, derivar a Psicología o activar rutas internas/externas de urgencia.
*   **Actores**: Técnico APH.
*   **Entradas**: Documento de identidad, canal de origen, datos del solicitante/tercero, motivo de consulta, nivel de triaje.
*   **Salidas**: Registro de Atención APH (`ALMA-YYYY-NNNNNN`), nota de valoración APH, derivaciones a Psicología o rutas externas.
*   **Requerimientos Principales**:
    *   `RF-ALMA-APH-001`: Registro de atención de primera respuesta directa o por remisión con captura de caracterización mínima *(Prioridad: Alta)*.
    *   `RF-ALMA-APH-002`: Registro de triaje de prioridad (Alto, Medio, Bajo) y opción de justificación narrativa si se omite por peligro vital *(Prioridad: Alta)*.
    *   `RF-ALMA-APH-003`: Derivación a Psicología Línea Alma con verificación de consentimiento y derivación a rutas internas (SPyB) *(Prioridad: Alta)*.
    *   `RF-ALMA-APH-004`: Activación y registro de seguimiento a rutas externas (Salud, Línea 123, Fiscalía) *(Prioridad: Alta)*.
    *   `RF-ALMA-APH-005`: Registro de atención y derivación de contención post-cierre sin reabrir el caso formal *(Prioridad: Alta)*.

### Submódulo Psicología (Psicología Línea Alma)
*   **Propósito**: Otorgar teleorientación psicológica especializada, valorar el riesgo clínico, ejecutar protocolos de contacto, programar y registrar seguimientos y concertar el cierre del caso o derivaciones avanzadas.
*   **Actores**: Psicólogo Línea Alma.
*   **Entradas**: Caso derivado por APH, notas APH, valoración clínica de riesgo, datos de caracterización y presunto agresor.
*   **Salidas**: Caso CASILDA (`CAS-YYYY-NNNNNN`), notas de atención y seguimiento, programación de controles, PDF de la atención y cierre formal.
*   **Requerimientos Principales**:
    *   `RF-ALMA-PSI-001`: Bandeja compartida "Pendiente seguimiento psicología" con semáforo SLA de reloj decreciente según triaje *(Prioridad: Alta)*.
    *   `RF-ALMA-PSI-002`: Registro detallado de hasta 9 intentos de contacto en días/horarios diferenciados con notas independientes y cierre automático si se agotan sin éxito *(Prioridad: Alta)*.
    *   `RF-ALMA-PSI-003`: Registro de primer contacto efectivo, valoración clínica de riesgo y generación/vinculación del Caso CASILDA (`CAS-...`) *(Prioridad: Alta)*.
    *   `RF-ALMA-PSI-004`: Registro de seguimientos programados (mínimo 3, o ilimitados si se requiere) con actualización de contador y envío de correo recordatorio al usuario *(Prioridad: Alta)*.
    *   `RF-ALMA-PSI-005`: Cierre de caso por motivo predefinido y opción de generar copia en PDF de la atención *(Prioridad: Alta)*.

---

## 7. Reglas de negocio

*   **RN-ALMA-01 (Tiempos Máximos de Atención / SLA por Triaje)**: El primer contacto por Psicología debe realizarse estrictamente dentro de las siguientes ventanas de tiempo según el triaje establecido por APH:
    *   *Riesgo Alto*: Hasta 12 horas.
    *   *Riesgo Medio*: Hasta 24 horas.
    *   *Riesgo Bajo*: Hasta 48 horas.
    *   *Aplica a*: Submódulo APH y Bandeja de Psicología (*fuente: Aspectos Generales Línea Violeta y Flujo de Información Módulo Línea Alma*).
*   **RN-ALMA-02 (Principio de Voluntariedad y Consentimiento Informado)**: Ninguna derivación a Psicología, Equipo de Atención o rutas externas/internas podrá efectuarse sin que conste en el sistema la autorización explícita y el consentimiento informado de la víctima. *(Excepción)*: Eventos de peligro inminente contra la vida o integridad en el campus donde APH reporta directamente a SPyB o autoridades (*fuente: Aspectos Generales Línea Violeta y Flujo de Información Módulo Línea Alma*).
*   **RN-ALMA-03 (Protocolo Escalonado de Intentos de Contacto)**: Psicología debe registrar hasta 9 intentos de llamada en días y horarios diferentes antes de cerrar un caso por "No contacto". Protocolo 1 (Intento 1), Protocolo 2 (distinto día/horario), Protocolo 3 (nuevo día/horario). Intentos adicionales a 3 exigen justificación registrada. *Aplica a*: Submódulo Psicología (*fuente: Flujo de Información Módulo Línea Alma y Planificación Completa Fase 2*).
*   **RN-ALMA-04 (Autonomía de Valoración de Riesgo)**: La valoración clínica del riesgo efectuada por Psicología no modifica ni sobreescribe el triaje de prioridad asignado por APH, preservando ambas variables para trazabilidad. *Aplica a*: Submódulo Psicología (*fuente: Flujo de Información Módulo Línea Alma y Reunión Equipo Desarrollo nov-2026*).
*   **RN-ALMA-05 (Flexibilidad en el Límite de Seguimientos)**: El estándar operacional prevé 1 atención inicial y 2 seguimientos (total 3 controles reglamentarios). Sin embargo, si el caso lo exige o la persona vuelve a contactarse, el sistema debe permitir registrar seguimientos adicionales sin bloquear el expediente. *Aplica a*: Submódulo Psicología (*fuente: Reunión Equipo Desarrollo nov-2026 y Planificación Completa Fase 2*).
*   **RN-ALMA-06 (No Autovinculación por Recontacto)**: Una llamada posterior a APH genera siempre un nuevo registro de atención (`ALMA-...`). El sistema prohíbe vincularla automáticamente al caso activo `CAS-...`; la decisión de vincular la nueva atención al caso existente o abrir un caso nuevo por hechos distintos es competencia exclusiva de Psicología. *Aplica a*: Submódulo APH y Psicología (*fuente: Flujo de Información Módulo Línea Alma y Reunión Equipo Desarrollo nov-2026*).

---

## 8. Modelo de datos

### Entidades, atributos clave y relaciones del modelo ER
A partir del análisis del documento de *Arquitectura del Sistema CASILDA* y la *Planificación Completa Fase 2*, el modelo de datos relacional PostgreSQL para Línea Alma se compone de las siguientes entidades principales:

*   `persona`: `id_persona` (PK), `tipo_identificacion`, `numero_identificacion` (UNIQUE), `nombres`, `apellidos`, `telefono_principal`, `correo_personal`, `ciudad`, `estrato`.
*   `caso`: `id_caso` (PK), `numero_caso` (UNIQUE, ej. `CAS-YYYY-NNNNNN`), `id_persona` (FK), `id_usuario_creador` (FK), `fecha_apertura`, `estado` (`ABIERTO`, `ACTIVO`, `EN_CIERRE`, `CERRADO`), `prioridad` (`ALTA`, `MEDIA`, `BAJA`), `fuente`, `canal_ingreso`, `motivo_cierre`.
*   `atencion_aph`: `id_atencion` (PK, ej. `ALMA-YYYY-NNNNNN`), `id_caso` (FK, NULLable), `id_usuario_aph` (FK), `fecha_atencion`, `triage` (`ALTO`, `MEDIO`, `BAJO`), `justificacion_no_triage`, `nota_valoracion`, `consentimiento_informado` (BOOLEAN).
*   `atencion_psicologia`: `id_psico` (PK), `id_caso` (FK), `id_usuario_psico` (FK), `fecha_inicio`, `fecha_primer_contacto`, `estado`, `numero_seguimientos`, `consentimiento_verbal` (BOOLEAN).
*   `intento_contacto`: `id_intento` (PK), `id_psico` (FK), `numero_intento` (1-9), `fecha_intento`, `hora_intento`, `resultado`, `protocolo_aplicado`.
*   `seguimiento_psicologia`: `id_segto` (PK), `id_psico` (FK), `numero_seguimiento`, `fecha_seguimiento`, `fecha_proximo`, `nota`, `tipo_seguimiento` (`REGULAR`, `POST_CIERRE`).
*   `nota_atencion`: `id_nota` (PK), `id_entidad_origen`, `tipo_origen` (`APH`, `PSICO`, `SEGTO`), `contenido`, `fecha_registro`, `pdf_generado`, `url_pdf`.
*   `presunto_agresor`: `id_agresor` (PK), `id_caso` (FK), `nombres`, `apellidos`, `vinculo`, `convivencia` (BOOLEAN), `observaciones`.
*   `derivacion_interna` / `ruta_externa`: `id_derivacion`/`id_ruta` (PK), `id_atencion` (FK), `tipo_destino`/`entidad`, `motivo`, `fecha_envio`/`fecha_activacion`, `resultado`, `estado`.

### Diferencias entre el modelo ER y lo expuesto en las reuniones
1.  **Momento de generación del código de caso**: El diagrama ER borrador planteaba crear la entidad `CASO` desde el registro en APH. En la reunión técnica de desarrollo se acordó explícitamente que APH solo genera un `ID_ATENCION` (`ALMA-...`), y que el `id_caso` (`CAS-...`) nace en la base de datos únicamente al consolidarse el **primer contacto efectivo por Psicología** (*fuente: Reunión Equipo Desarrollo nov-2026 y Flujo de Información Módulo Línea Alma*).
2.  **Relación 1:N entre atenciones APH y Caso CASILDA**: Una persona puede acumular múltiples atenciones APH que no poseen un `id_caso` (si la persona no aceptó psicología), o asociar varias atenciones APH a un único `id_caso` consolidado (*fuente: Reunión Equipo Desarrollo nov-2026*).
3.  **Almacenamiento de archivos binarios**: El esquema backend original almacena PDFs y consentimientos en la base de datos PostgreSQL mediante el tipo de dato `bytea` (`archivoconsentimiento`). **Sugerencia técnica**: Para la Fase 2 se recomienda migrar el almacenamiento de documentos a un repositorio de objetos externo (S3/MinIO), guardando únicamente la URL/path en la tabla `nota_atencion` (*fuente: Arquitectura Sistema CASILDA, §13.2*).

---

## 9. Requerimientos no funcionales

### Concurrencia y disponibilidad
*   `RNF-ALMA-001`: La plataforma telefónica y la captura de atenciones APH deben operar con disponibilidad 24/7/365. Al ser la bandeja de Psicología una cola compartida sin asignación individual, el sistema debe implementar bloqueo optimista para evitar que dos psicólogos tomen o editen la misma novedad simultáneamente (*fuente: Planificación Completa Fase 2 y Reunión Equipo Desarrollo nov-2026*).

### Seguridad y matriz de accesos
*   `RNF-ALMA-002`: Autenticación basada en tokens JWT (HMAC-SHA256) stateless y autorización por roles (RBAC). El perfil APH tiene **estrictamente restringido** el acceso a las notas clínicas psicológicas de la víctima; solo visualiza si existe un seguimiento psicológico activo, la fecha del próximo control y el profesional a cargo (*fuente: Arquitectura Sistema CASILDA y Flujo de Información Módulo Línea Alma*).

#### Matriz de permisos de acceso por submódulo

| Rol / Perfil | Submódulo APH | Submódulo Psicología | Archivos PDF / Notas Clínicas | Maestros y Configuración |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Crear, Consultar, Editar, Eliminar | Crear, Consultar, Editar, Eliminar | Consultar, Exportar | Crear, Consultar, Editar, Eliminar |
| **COORDINADOR** | Crear, Consultar, Editar | Crear, Consultar, Editar | Consultar, Exportar | Consultar |
| **PROFESIONAL (Psicólogo)** | Consultar (Notas APH) | Crear, Consultar, Editar, Cerrar | Crear, Consultar, Exportar PDF | Consultar |
| **TÉCNICO APH** | Crear, Consultar, Editar, Cerrar | Solo Alerta Informativa de Seguimiento | Sin Acceso a Notas Clínicas | Consultar |
| **REVISOR** | Consultar | Consultar | Consultar | Consultar |
| **USUARIO (Víctima)** | Sin Acceso Directo | Sin Acceso Directo | Consultar en Perfil (Reporte básico) | Sin Acceso |

### Trazabilidad y auditoría
*   `RNF-ALMA-003`: El sistema debe registrar un historial inmutable de auditoría para cada creación, actualización de notas, cambio de estado, derivación o vinculación manual de atenciones APH a un caso CASILDA, guardando `id_usuario`, `fecha`, `hora` y el detalle del cambio (*fuente: Planificación Completa Fase 2 y Arquitectura Sistema CASILDA*).

### Integraciones y exportaciones
*   `RNF-ALMA-004`: Integración con servidor de correo institucional (SendGrid/AWS SES) para el envío automático de notificaciones de derivación y recordatorios de citas. Exportación dinámica de informes en formato PDF formateado (*fuente: Planificación Completa Fase 2 y Aspectos Generales Línea Violeta*).

---

## 10. Relación con otros módulos de CASILDA

*   **Equipo de Atención (EA)**:
    *   *Remisión Entrante*: EA remite casos a Línea Alma cuando una víctima requiere soporte telefónico 24/7; la solicitud ingresa a la bandeja de pendientes de APH.
    *   *Remisión Saliente*: Psicología o APH de Línea Alma derivan el caso a la bandeja de EA cuando la víctima requiere acompañamiento presencial o jurídico.
    *   *Gestión Simultánea*: Un mismo caso CASILDA (`CAS-...`) puede tener actuaciones activas simultáneamente en Línea Alma y en Equipo de Atención. El sistema debe mostrar una alerta visual de "Gestión en simultáneo" (*fuente: Flujo de Información Módulo Línea Alma y Reunión Equipo Desarrollo nov-2026*).
*   **Seguridad a Personas y Bienes (SPyB)**:
    *   APH deriva de inmediato las emergencias en el campus a la bandeja de SPyB (Central de Monitoreo / Analista de Riesgos).
    *   SPyB traslada situaciones detectadas en rondas a Línea Alma cuando se requiere contención psicosocial (*fuente: Requisitos Funcionales SEG_PyB y Aspectos Generales Línea Violeta*).
*   **Unidad de Asuntos Disciplinarios (UAD)**:
    *   Remisión informativa realizada por APH o Psicología a la UAD cuando los hechos constituyen faltas disciplinarias cometidas por integrantes de la comunidad universitaria (*fuente: Requisitos Funcionales SEG_PyB y Flujo de Información Módulo Línea Alma*).

---

## 11. Matriz de brechas e inconsistencias

| Punto Ambiguo / Inconsistencia | Submódulo Afectado | Decisión de Desarrollo Bloqueada | A quién consultar / Fuente de Contradicción |
| :--- | :--- | :--- | :--- |
| **Inconsistencia de Denominación**: Coexistencia de términos "Línea Violeta", "Línea Alma" y "Violeta te Orienta". | Transversal | Estandarización de títulos en la interfaz (UI), menú principal y textos de correos automáticos. | **Laura Murillo / Cliente**: **Inferido**: Homologar bajo el nombre público y técnico "Línea Alma" dentro del sistema CASILDA. |
| **Punto Faltante — Catálogo de 15 Dimensiones de Salud Mental**: Se exige clasificar la atención en 15 dimensiones de salud mental del LivingLab, pero la lista no ha sido entregada. | Psicología | Creación de la tabla maestra en BD (`maestro_dimensiones`) y desplegables del formulario de Psicología. | **Equipo LivingLab / Laura Murillo**: **Sugerencia técnica**: Cargar un catálogo genérico "Dimensión 1" a "Dimensión 15" hasta recibir la lista oficial. |
| **Inconsistencia — Cantidad de Seguimientos**: El documento del LivingLab indica "máximo 2 a 3 seguimientos", mientras que en la reunión de desarrollo y en el Backlog de Fase 2 se establece que son "mínimo 3 controles, pero el sistema debe permitir seguimientos adicionales ilimitados si se requiere". | Psicología | Lógica de validación del backend para el contador de seguimientos `numero_seguimiento`. | **Laura Murillo / Backlog Fase 2**: Priman la reunión y el Backlog Fase 2 (el contador muestra X/3, pero permite añadir más allá del 3er control). |
| **Contradicción — Momento de Creación del ID de Caso**: El modelo ER borrador creaba la entidad `CASO` desde APH. En la reunión técnica se definió que APH solo crea `id_atencion` (`ALMA-...`) y que `id_caso` (`CAS-...`) nace únicamente con el primer contacto efectivo de Psicología. | APH / Psicología | Lógica relacional de base de datos y endpoints del controlador REST (`SolicitudController` / `AtencionController`). | **Arquitecto de Software / Beto / Laura Murillo**: Adoptar la regla consensuada en la reunión (APH genera `ALMA-...`; Psicología genera `CAS-...`). |
| **Punto Faltante — Algoritmo Interno de Triaje APH**: APH evalúa el triaje en una herramienta externa propia del LivingLab cuyo algoritmo no es público. | APH | Imposibilidad de calcular automáticamente el triaje dentro del código del backend de CASILDA. | **Cliente**: CASILDA únicamente almacena la selección manual del resultado (`ALTO`, `MEDIO`, `BAJO`) entregado por APH. |
