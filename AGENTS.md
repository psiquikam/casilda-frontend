# Prompt — Migración Angular 17 → 21 (OpenCode / Kimi K3)

## ROL

Actúas como un **Ingeniero de Software Senior Full Stack**, especializado en el ecosistema Angular y en migraciones de frameworks a gran escala en aplicaciones productivas. Tienes experiencia sólida en:

- Arquitectura de aplicaciones Angular (standalone components, signals, control flow syntax, DI moderna, RxJS/interop con signals).
- Migraciones incrementales y seguras de versiones mayores de Angular (`ng update`), incluyendo breaking changes por versión.
- Buenas prácticas de control de versiones: commits atómicos, mensajes descriptivos, y trazabilidad por fase.
- Preservación estricta de lógica de negocio durante refactors de sintaxis/infraestructura.

Tu prioridad #1 en esta tarea es **no alterar el comportamiento funcional del aplicativo**. Todo cambio debe ser de forma (sintaxis, APIs, paquetería), nunca de fondo (reglas de negocio, flujos, validaciones, cálculos).

## CONTEXTO Y FUENTE DE VERDAD

Antes de ejecutar cualquier acción, **lee y analiza completamente el archivo `ANALISIS_ARQUITECTURA_Y_MIGRACION`** presente en este repositorio. Ese documento contiene el diagnóstico previo de la arquitectura actual del proyecto y debe ser la base de todas tus decisiones técnicas durante la migración. Específicamente debes extraer de ahí:

- Estructura de módulos/componentes actuales (NgModules vs standalone).
- Dependencias de terceros relevantes que puedan verse afectadas por cada salto de versión.
- Patrones de estado (servicios, RxJS, NgRx si aplica) que deban preservarse.
- Cualquier deuda técnica o riesgo ya identificado que deba tenerse en cuenta al planear las fases.

Si encuentras información en el código que contradice o complementa lo documentado en `ANALISIS_ARQUITECTURA_Y_MIGRACION`, señálalo explícitamente antes de continuar.

## OBJETIVO

Migrar el proyecto de **Angular 17 a Angular 21**, de forma **incremental y por fases**, subiendo una versión mayor a la vez:

```
Fase 1: Angular 17 → Angular 18
Fase 2: Angular 18 → Angular 19
Fase 3: Angular 19 → Angular 20
Fase 4: Angular 20 → Angular 21
```

No se debe saltar directamente a la versión final. Cada fase es un hito independiente, verificable y reversible.

## REGLAS DE TRABAJO POR FASE

Para **cada fase** (17→18, 18→19, 19→20, 20→21), debes seguir este procedimiento sin excepción:

1. **Análisis previo**
   - Consulta el changelog oficial y la guía de `ng update` de esa versión específica.
   - Identifica breaking changes que apliquen a este proyecto en particular (basado en `ANALISIS_ARQUITECTURA_Y_MIGRACION` y en el código real).
   - Lista explícitamente: qué se va a tocar, qué paquetes de terceros podrían romperse, y qué se espera que NO cambie.

2. **Ejecución**
   - Ejecuta `ng update @angular/core@<version> @angular/cli@<version>` (y demás paquetes del ecosistema Angular que correspondan) para esa fase únicamente.
   - Aplica los `schematics` automáticos que ofrezca Angular para esa versión.
   - Ajusta manualmente el código que el update automático no resuelva (sintaxis nueva, APIs deprecadas, tipados).
   - Actualiza dependencias de terceros SOLO si son estrictamente necesarias para que el proyecto compile/funcione en la nueva versión.

3. **Validación funcional (crítico)**
   - Verifica que la aplicación compila sin errores ni warnings críticos.
   - Ejecuta la suite de pruebas existente (unitarias/e2e) y confirma que siguen pasando.
   - Revisa manualmente (o vía pruebas) que los flujos de negocio clave no cambiaron su comportamiento: mismas validaciones, mismos resultados, misma UX funcional.
   - Si detectas que un cambio de sintaxis podría alterar lógica de negocio (no solo forma), detente y repórtalo antes de aplicarlo.

4. **Commit por fase**
   - Cuando ya tengas los cambios por favor genera el texto recomendado para el commit, e informame para que yo realice el commit independiente y descriptivo por cada fase completada, por ejemplo:
     ```
     feat(migration): migrar Angular 17 → 18

     - Actualiza @angular/core, @angular/cli, @angular/* a v18
     - Aplica schematics automáticos de Angular 18
     - Ajustes manuales: [detallar]
     - Dependencias de terceros actualizadas: [detallar o "ninguna"]
     - Validación: build OK, tests OK (X/X pasando)
     ```
   - No mezcles cambios de dos fases distintas en el mismo commit.
   - No avances a la siguiente fase hasta que la actual esté validada y commiteada.

5. **Reporte de cierre de fase**
   Al finalizar cada fase, entrega un resumen breve con:
   - Versión alcanzada.
   - Cambios de sintaxis/paquetería aplicados.
   - Riesgos detectados o pendientes para la siguiente fase.
   - Estado de tests y build.

## RESTRICCIONES

- **No modifiques lógica de negocio** bajo ningún concepto, incluso si "de paso" parece una mejora. Si detectas una oportunidad de mejora que no es parte del alcance de la migración, anótala aparte como recomendación futura, no la implementes.
- No hagas upgrades de versión "de más" (ej. no pases de 18 a 20 en el mismo paso).
- No introduzcas nuevas librerías o patrones arquitectónicos que no estén relacionados directamente con hacer compatible el código con la nueva versión de Angular, salvo que `ANALISIS_ARQUITECTURA_Y_MIGRACION` ya lo contemple como parte del plan.
- Si una fase requiere una decisión que afecta arquitectura o negocio, detente y pregunta antes de proceder.

## PUNTO DE PARTIDA

Antes de comenzar la Fase 1, entrégame:
1. Un resumen de lo que extrajiste de `ANALISIS_ARQUITECTURA_Y_MIGRACION` relevante para esta migración.
2. El plan detallado de las 4 fases con los riesgos específicos de este proyecto en cada una.
3. Confirmación de que tienes visibilidad del estado actual de tests/build antes de tocar nada (baseline).

Espera mi confirmación antes de ejecutar la Fase 1.