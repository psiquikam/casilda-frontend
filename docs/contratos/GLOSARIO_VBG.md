# Glosario VBG — Casilda

> **Propósito:** un término, un significado, en todo el aplicativo. Este documento es el
> punto de referencia para que un término de la Matriz Técnica VBG
> (`MATRIZ_MODULO_ATENCION_VBG.md`) se escriba igual en el módulo Equipo de Atención, en
> los paneles de inicio, en el menú, en los títulos de ruta y en los mocks/DTO —
> y para que la vista del rol Usuario, que usa otro lenguaje a propósito (§5.3 de
> `DASHBOARDS_POR_ROL.md`), exprese el **mismo concepto** sin la jerga técnica.
>
> **Precedencia:** la matriz gobierna el contenido (regla 2 de su §0: las etiquetas se
> copian literales). Este glosario no inventa términos nuevos; documenta dónde vive cada
> uno y qué le corresponde en cada superficie.
>
> **Origen:** `docs/evidencias/estandarizacion-vbg/00-diagnostico-y-plan.md` §3
> (glosario cruzado) y su Subfase M1.

---

## Cómo leer la tabla

| Columna | Qué contiene |
|---|---|
| Término de la matriz | Etiqueta oficial, literal, de `MATRIZ_MODULO_ATENCION_VBG.md`. |
| Código estable | El identificador que persiste, de `core/catalogos/catalogo-vbg.ts` cuando aplica. |
| Módulo Equipo de Atención | Dónde y cómo aparece hoy en `registro-caso`/`registro-atencion` y sus modales. |
| Paneles del personal | Dónde aparece en `PanelInicioComponent` y sus widgets. |
| Vista del rol Usuario | El **concepto** equivalente en el lenguaje de §5.3 — nunca el término técnico. |
| Mocks y DTO | El campo correspondiente en los servicios de datos. |

---

## Acuerdos, compromisos y seguimiento

| Término de la matriz | Código estable | Módulo Equipo de Atención | Paneles del personal | Vista del rol Usuario | Mocks y DTO |
|---|---|---|---|---|---|
| **Acuerdos Alcanzados** (Sí/No, VBG-07-01) | — | `logroAcuerdo` en `casoForm`/`atencionForm`. Falta la pregunta literal «¿Logró llegar a un acuerdo con la persona?» (M4). | No se muestra. | No se muestra: es una decisión del profesional, no de la persona (DSH-10-10). | — |
| **Compromisos Atendida** (VBG-07-04) | — | `modal-compromisos-persona`. Hoy es un desplegable; la matriz pide narrativa libre (M4). | KPI «Compromisos a 7 días» (cuenta ambos orígenes, P-VBG-01). | **«Lo que decidiste hacer»** (P-VBG-02: solo los suyos). | `CompromisoDto` en `mi-proceso.service.ts`. |
| **Compromisos Dupla / Profesional** (VBG-07-11) | — | `modal-compromisos-profesionales`. Bloque separado del de la persona ✅. | Incluido en «Compromisos a 7 días», sin desglosar por origen todavía. | **No se muestra**: son compromisos internos del equipo (DSH-10-10). | `CompromisoDto.origen` (M5, por añadir). |
| **Fecha de cumplimiento** (VBG-07-09) | — | «Fecha de Cumplimiento» en ambos modales ✅. | — | «Lo pensamos para el…» | `CompromisoDto.fechaCumplimiento` (M5: renombrado desde `fechaAcordada`, que contradecía VBG-07-09). |
| **Seguimiento** (sección 8, 7.1–7.4) | `llamada-telefonica`, `sesion-presencial`, `sesion-virtual`, `gestion-documental` (acciones, provisional — pendiente 15) | «Tipo de Seguimiento» hoy es **modalidad de contacto** (Presencial/Telefónico/Virtual/Visita), no un registro por especialidad. Las subsecciones 7.1–7.4 no existen (bloqueadas por P-12 hasta M4). | «Seguimiento sin registro en los últimos 15 días» (umbral provisional, P-VBG-07). | No se muestra. | `modal-seguimiento`. |
| **Cierre** — de un seguimiento (VBG-08-12) vs. **cierre general del caso** (VBG-08-13) | — | «Estado de seguimiento» existe; el cierre autónomo por profesional y la alerta de última activa se implementan en M4. | «Intervención y cierre» (etapa de la Ruta del Caso, texto genérico). | No se muestra. | — |
| **Última profesional activa** (VBG-08-13) | — | No existe todavía (M4). | «Eres la última profesional activa en este caso» (`pendientes.widget.ts`), ya implementado. | No se muestra. | `PendienteDto.ultimaProfesionalActiva`. **Una sola regla**: cuando M4 implemente el cierre, debe consumir el mismo predicado que ya usa el panel, no uno nuevo. |

---

## Clasificación VBG y modalidades de violencia

| Término de la matriz | Código estable | Módulo Equipo de Atención | Paneles del personal | Vista del rol Usuario | Mocks y DTO |
|---|---|---|---|---|---|
| **Violencia Basada en Género** (Sí/No, VBG-01-01) | — | No existe todavía (M2). | No desagregan por VBG = Sí/No (P-VBG-03: los indicadores cuentan solo VBG = Sí, declarado en su definición). | No se muestra. | — |
| **Modalidades de violencia** (6: Psicológica, Física, Sexual, Patrimonial, Por prejuicio, Institucional) | `psicologica`, `fisica`, `sexual`, `patrimonial`, `por-prejuicio`, `institucional` | El backend expone **7** tipos de primer nivel (incluye «Informática» como propio). Catálogo de demostración ya alineado a los 6 de la matriz (M1). | «Distribución por identidad de género» no desagrega por modalidad (fuera de alcance de esta fase). | No se muestra: nunca estadísticas institucionales (DSH-10-08). | `RESPALDO_MAESTROS_VBG['tipos-violencia']`. |
| **Explotación sexual** | `explotacion-sexual` (hijo de `sexual`) | Anidada bajo Sexual en el catálogo de demostración (VBG-03-05, M1). Los elementos entre paréntesis son texto de ayuda, no opciones (pendiente 9, decisión provisional). | — | — | `catalogo-vbg.ts` → `MODALIDADES_VIOLENCIA`. |
| **Violencia facilitada por nuevas tecnologías** | `violencia-tecnologica` (hijo de `sexual`) | Anidada bajo Sexual (VBG-03-06). El backend la expone como tipo 6 de primer nivel: discrepancia reportada (P-VBG-06). | — | — | — |
| **Sexting sin consentimiento** | `sexting-sin-consentimiento` | Etiqueta literal exacta, nunca «Sexting» a secas (VBG-03-07). | — | — | — |

---

## Identificación y presunto agresor

| Término de la matriz | Código estable | Módulo Equipo de Atención | Paneles del personal | Vista del rol Usuario | Mocks y DTO |
|---|---|---|---|---|---|
| **Datos del presunto agresor** (VBG-05-06) | — | Encabezado único, sin variantes ✅ (`registro-caso.component.html`). | — | **Nunca se muestra** (DSH-10-10). | — |
| **Personal no docente** (VBG-05-08) | `personal-no-docente` | El backend usa `VinculoUdeAEnum.PERSONAL_ADMINISTRATIVO`. Catálogo de demostración ya usa «Personal no docente» (M1); homologar con el backend real requiere su confirmación (hallazgo nuevo, ver abajo). | — | — | — |
| **Vínculo con la Universidad** (árbol: Estudiante{Pregrado,Posgrado,Tecnología,Técnica}, Docente{Vinculado,Ocasional,Cátedra,Cátedra 50}, Personal no docente, Otro) | `catalogo-vbg.ts` → `VINCULO_UNIVERSIDAD` | El backend (`VinculoUdeAEnum`, 14 valores: agrega Egresado, Contratista, Jubilado/Pensionado, Prestador de Servicios, Externo) no coincide con el árbol de la matriz. Ver hallazgo nuevo. | — | — | — |
| **Vínculo con la Víctima** | `catalogo-vbg.ts` → `VINCULO_VICTIMA` | `vinculos-agresor-victima`. | — | — | — |
| **Protocolo de amenazas** (VBG-07-07) | `protocolo-amenazas` | Renombrada en el catálogo de demostración; el backend puede seguir devolviendo «Ruta de amenazas» (M4 lo homologa). | — | — | — |
| **Grupo de atención** (VBG-09-01, solo lectura) | `grupo-1`…`grupo-6` | Hoy es un **campo editable** del formulario (NO CUMPLE VBG-09-02); pasa a solo lectura en M5, sin cálculo (pendiente 17 bloquea el cálculo). | — | **Nunca se muestra** (DSH-10-10). | `CasoSimuladoVbg.grupoAtencion`: `string \| null` (`null` = «Sin calcular»). |

---

## Hallazgo nuevo: el backend no modela el árbol de vínculos de la matriz

`VinculoUdeAEnum` (`solicitud.service.ts`) tiene 14 valores:
`EstudiantePregrado · EstudiantePosgrado · EgresadoPregrado · EgresadoPosgrado ·
PersonalAdministrativo · DocenteVinculado · DocenteOcasional · DocenteDeCatedra ·
Contratista · OtroTipoDeVinculo · DocenteCatedra50 · JubiladoPensionado ·
PrestadorDeServicios · Externo`.

La matriz (VBG-05-03) define un árbol de 10 hojas:
`Estudiante{Pregrado, Posgrado, Tecnología, Técnica} · Docente{Vinculado, Ocasional,
Cátedra, Cátedra 50} · Personal no docente · Otro`.

Diferencias:
- El backend no tiene **Estudiante Tecnología** ni **Estudiante Técnica**.
- El backend tiene **Egresado** (Pregrado/Posgrado), que la matriz no contempla en este árbol.
- El backend tiene **Contratista**, **Jubilado/Pensionado**, **Prestador de Servicios** y
  **Externo**, ninguno en la matriz.
- `PersonalAdministrativo` debe pasar a mostrarse como «Personal no docente» (VBG-05-08),
  pero el código seguiría siendo el mismo si no se migra en el backend.

**No se resuelve por suposición.** El catálogo de demostración (M1) usa el árbol exacto de
la matriz; fuera del modo de demostración, el frontend sigue mostrando las etiquetas tal
como las entrega el backend (`MaestrosVbgService`, ver `docs/evidencias/estandarizacion-vbg/`).
Homologar ambos catálogos requiere que el equipo de backend confirme la correspondencia.
→ Pregunta para el equipo, registrada en el reporte de M1.
