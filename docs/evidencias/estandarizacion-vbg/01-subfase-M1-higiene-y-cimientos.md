# Subfase M1 — Higiene y cimientos

> **Fecha:** 5 de octubre de 2026.
> **Rama:** `feature/04/010/casilda/optmizacion-dashboards` (se decidió no abrir rama nueva).
> **Diagnóstico de origen:** `docs/evidencias/estandarizacion-vbg/00-diagnostico-y-plan.md`.
> **Contratos nuevos:** `docs/contratos/GLOSARIO_VBG.md` ·
> `docs/contratos/DECISIONES_PROVISIONALES_VBG.md`.
> **IDs cubiertos:** higiene (lint, spec de `RegisterComponent`, EST-04) · cimiento del modo
> de demostración (requisito previo de VBG-03-04, base de M2 a M5).
>
> Las capturas de verificación se tomaron localmente y no se versionan (`.gitignore` ya
> excluye `docs/evidencias/**/capturas/`, decisión confirmada en P-VBG-05). Lo observado se
> describe en este reporte.

---

## El hallazgo que cambiaba el plan, resuelto

El diagnóstico encontró que `/registro-caso` y `/registro-atencion` **no se podían abrir**:
31 catálogos y la lista de citas respondían `403` contra el backend real, y el formulario
nunca llegaba a renderizarse. Esta subfase lo resuelve con el **modo de demostración**
descrito en la autorización: con `environment.datosDemostracion = true`, el módulo no
llama al backend — catálogos, citas, casos y guardado salen de implementaciones simuladas,
sin borrar ningún código HTTP.

**Verificado en navegador, rol PROFESIONAL:** `/registro-caso`, `/registro-atencion` y
`/cita` abren sin errores de consola atribuibles al módulo (0 errores propios; el único
error presente es `NG0100` del sidenav, preexistente y ya documentado como ADD-06 en la
fase de dashboards). Las tres vistas muestran la franja «Datos de demostración», listan
tres casos ficticios con nombres y documentos evidentemente de demostración
(«Persona Demostración Uno», «DEMO-0000001»…), y al abrir un caso el formulario carga con
los catálogos poblados (por ejemplo, «Identidad de Género» muestra «Mujer
(Cisgénero / Trans)», tomado del catálogo de respaldo). Guardar la primera pestaña del
caso «CAS-DEMO-0001» completa con el diálogo «¡Caso Registrado!», confirmando que
`registrarPestana` persiste en el almacén simulado de punta a punta. Verificado también a
375 px.

---

## Arquitectura del modo de demostración

```
registro-caso / registro-atencion / cita
        │
        ├─ obtenerMaestro(endpoint) ──────► MaestrosVbgService.obtenerCatalogo(endpoint)
        │                                         │
        │                                         ├─ demoData=true  → RESPALDO_MAESTROS_VBG[endpoint]
        │                                         └─ demoData=false → http real, con el mismo
        │                                                              respaldo si falla (antes: [])
        │
        └─ listarCitas/listarCasos/obtenerPorId/registrarPestana
                  │
                  ▼
          RegistroVbgDatosService
                  │
                  ├─ demoData=true  → CasosSimuladosService (en memoria)
                  └─ demoData=false → SolicitudService, sin modificar
```

**Por qué una fachada y no un interceptor HTTP.** Se consideró interceptar `/maestros/*` a
nivel de transporte, pero habría sido "mágico" y difícil de acotar: un interceptor global
corre el riesgo de alcanzar otros módulos que también usan `environment.apiBaseUrl`. La
fachada explícita, tipada, por método, solo se activa donde se inyecta — ningún otro
componente del aplicativo cambia de comportamiento.

**Por qué `SolicitudService` queda intacto.** Se verificó que `listarCitasPaginadas`,
`listarCasosPaginados`, `obtenerPorId` y `registrarPestana` **solo** los invocan
`registro-caso`, `registro-atencion` y `cita` (grep sobre todo `src/`, sin coincidencias en
otros componentes). Envolverlos en `RegistroVbgDatosService` no toca un servicio
compartido con `consulta`, `caso`, `formulario-acompanamiento` ni ningún otro módulo.

**Qué NO se cubrió en esta subfase, y por qué.** Las pequeñas consultas de catálogo que
viven dentro de los modales de compromisos, seguimientos, rutas, remisiones y apreciaciones
(`tipos-compromiso`, `acciones`, `tipos-ruta-activacion`, `tipos-remision`,
`tipos-apreciacion/1,2`…) siguen llamando al backend real. Son exactamente las secciones 6,
7 y 8 de la matriz — contenido de M3 y M4 —, y dos de ellas (tipo de apreciación,
tipo de compromiso) van a **desaparecer** en esas subfases. Wirearlas ahora habría sido
trabajo desechable. Hasta M3/M4, abrir esos modales específicos seguirá mostrando «No fue
posible cargar…» en modo de demostración; es una limitación acotada y documentada, no un
olvido.

---

## Resultado

| ID / tarea | Estado | Evidencia |
|---|---|---|
| Modo de demostración (requisito previo de VBG-03-04 y base de M2–M5) | **CUMPLE** | `MaestrosVbgService`, `RegistroVbgDatosService`, `CasosSimuladosService`. Verificado en navegador: los tres puntos de entrada abren sin 403. |
| Catálogo central con código + etiqueta | **CUMPLE (parcial, ampliable)** | `core/catalogos/catalogo-vbg.ts`: ámbito, forma y lugar de ocurrencia; relación misional (2 niveles); modalidades de violencia (árbol con Sexual, Explotación sexual y Sexting sin consentimiento anidados); vínculo universidad (árbol); vínculo víctima; rutas internas (con Protocolo de amenazas) y externas; acciones→actividades (provisional); grupos de atención (etiquetas). Sembrado desde `formulario-anonimo.component.ts`, que ya tenía las listas correctas de la matriz. |
| EST-01 (módulo inalcanzable) | **CORREGIDO** | Ver verificación en navegador arriba. |
| EST-02 (`of([])` sin respaldo) | **CORREGIDO** | `MaestrosVbgService` cae al mismo respaldo en modo real si el backend falla, y avisa con `NotificacionService`. |
| EST-04 (`console.log`, botón muerto) | **CORREGIDO** | `editarAcuerdo` retirado de ambos componentes: no tenía ningún botón en plantilla que lo invocara (verificado por grep), así que no había nada que «retirar» de la interfaz — solo código muerto. |
| Lint: 302 → tope 299 | **CORREGIDO** | Los tres avisos de `d3066e0` (1 `prefer-inject` en `modal-codigos-pais`, 2 `no-explicit-any` en `registro-caso.component.spec.ts`) se corrigieron sin tocar el tope. Verificado con worktrees aislados que aislaron el delta exacto introducido por ese commit. |
| Spec de `RegisterComponent` (NG0201) | **CORREGIDO** | `provideRouter([])` en el `TestBed`. |
| `CLAUDE.md` §2 (SweetAlert2) | **CORREGIDO** | Ya no lo lista como parte del stack vigente; nota explícita de que fue retirado, remitiendo a §4. |
| Franja «Datos de demostración» en el módulo | **CUMPLE** | Visible en `registro-caso`, `registro-atencion` y `cita`, con los tokens de `panel-inicio.component.scss`. |
| Ningún dato simulado es real | **CUMPLE** | Nombres («Persona Demostración Uno/Dos/Tres»), documentos («DEMO-0000001»…) y teléfonos («Demo · sin teléfono real») son evidentemente ficticios. |
| `GLOSARIO_VBG.md` | **ENTREGADO** | Con la columna del rol Usuario, como se pidió. Documenta ahí mismo el hallazgo nuevo (ver abajo). |
| `DECISIONES_PROVISIONALES_VBG.md` | **ENTREGADO** | 19 filas: las 17 decisiones de la autorización + las 2 filas «sin cambios» (pendientes 10 y 11). |

---

## Hallazgo nuevo, no estaba en el diagnóstico original

**El backend no modela el árbol de vínculos de la matriz.** `VinculoUdeAEnum`
(`solicitud.service.ts`) tiene **14** valores (incluye Egresado, Contratista,
Jubilado/Pensionado, Prestador de Servicios, Externo — ninguno en la matriz) y **no** tiene
Estudiante Tecnología ni Estudiante Técnica, que la matriz sí pide (VBG-05-03). Es la misma
clase de discrepancia que P-VBG-06 (modalidades de violencia), pero del lado del vínculo con
la Universidad. Documentado en `GLOSARIO_VBG.md` con el detalle completo.

**No se resolvió por suposición.** El catálogo de demostración usa el árbol exacto de la
matriz (10 hojas); fuera del modo de demostración, el frontend sigue mostrando las
etiquetas del backend tal cual, sin relabelarlas — intentar una correspondencia automática
sin que el backend la confirme sería inventar un mapeo no verificable.

---

## Archivos

**Nuevos**

| Archivo | Qué aporta |
|---|---|
| `core/catalogos/catalogo-vbg.ts` | Árboles de la matriz, código + etiqueta + ayuda. |
| `core/catalogos/respaldo-maestros-vbg.ts` | Los 31 catálogos de `cargarListasMaestras()`, derivados del anterior donde la matriz gobierna, y datos de demostración simples donde no. |
| `core/vbg/caso-simulado.model.ts` | Modelo del caso simulado + mapeadores a `CitaDto`/`CasoDto`. |
| `services/maestros-vbg.service.ts` | Fachada de catálogos, compartida (antes duplicada en los dos formularios). |
| `services/casos-simulados.service.ts` | Almacén en memoria, 3 casos ficticios. |
| `services/registro-vbg-datos.service.ts` | Fachada de citas/casos/guardado. |
| `docs/contratos/GLOSARIO_VBG.md` | Glosario cruzado como contrato. |
| `docs/contratos/DECISIONES_PROVISIONALES_VBG.md` | 19 decisiones provisionales, para validación del equipo. |

**Modificados:** `registro-caso.component.{ts,html,scss,spec.ts}`,
`registro-atencion.component.{ts,html,scss}`, `cita.component.{ts,html,scss}`,
`modal-codigos-pais.component.ts`, `auth/register/register.component.spec.ts`, `CLAUDE.md`.

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run check` | **Pasa completo** (lint + a11y:audit + test:ci + build), por primera vez en esta fase. |
| `npm run lint` | **297 de 299** (tope). Mis cambios no introdujeron ningún aviso neto (verificado archivo por archivo contra el árbol sin tocar). |
| `npm run test:ci` | **237 de 237.** Incluye `RegisterComponent`, que antes fallaba. |
| `npm run a11y:audit` | Sin deuda nueva: 0 botones sin nombre, 0 filtros sin etiqueta, 0 usos de paleta heredada. |
| `npm run build` | Pasa, sin errores. |
| Navegador, rol PROFESIONAL, 1440 y 375 px | `registro-caso`, `registro-atencion` y `cita` abren sin 403; franja de demostración visible; catálogos poblados; guardar completa con éxito. |

---

## Pendientes para el equipo

- **Validar `docs/contratos/DECISIONES_PROVISIONALES_VBG.md`.** Es el entregable explícito
  de esta subfase: 17 decisiones de contenido que permiten demostrar el módulo mientras se
  confirma la versión oficial.
- **Confirmar el hallazgo nuevo:** ¿`VinculoUdeAEnum` se homologa al árbol de la matriz en
  el backend, o el frontend debe mapear sus 14 códigos a los 10 de la matriz? Mismo tipo de
  pregunta que P-VBG-06, ahora para vínculos en vez de modalidades.
- **P-12** (modelo de especialidades) sigue abierta: esta subfase no la toca, entra en M4.
- Los pendientes 10 y 11 de la matriz (códigos de país, persona extranjera) conservan el
  comportamiento actual; no se tocaron.
