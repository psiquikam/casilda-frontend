# Contrato de API — Línea Alma · Psicología: expediente, seguimientos, cierre, PDF, agenda y recontactos

> **Para:** equipo de Backend de CASILDA (y desarrollo de APH en el front, por las fronteras F2/F6)
> **De:** equipo de Frontend (`casilda-frontend`) — submódulo Psicología (Jonathan)
> **Fecha:** 9 de noviembre de 2026
> **Estado:** propuesta v0. **Ningún endpoint ha sido verificado en el backend.** Construido y probado contra el mock
> (`mocks/psicologia.handlers.ts`, grupos `casos`, `agenda` y `recontactos`). Convenciones y decisiones comunes:
> `README.md`; decisiones de Psicología `D-PSI-*`: `contrato-psicologia-bandeja-novedades.md` §2 y §2 de este documento.

Rotulado: **[Front]** = verificado leyendo el archivo citado · **[Propuesta]** = pendiente de confirmar con Backend.

---

## 1. Contexto y qué se necesita

Tras el primer contacto, el psicólogo registra seguimientos (mínimo 3 controles, sin tope, RN-ALMA-05), programa el
siguiente control con recordatorio por correo (RNF-ALMA-004), cierra por motivo predefinido y exporta el PDF
(RF-ALMA-PSI-005, RF-ALMA-007). Además decide qué hacer cuando una persona con caso activo vuelve a llamar
(recontacto, RN-ALMA-06) y consulta su agenda de controles.

### Archivos de referencia en el front

| Archivo | Rol |
|---|---|
| `src/app/linea-alma/shared/types/alma-psicologia-dto.ts` | `CasoDto`, `SeguimientoDto`, `AgendaItemDto`, `RecontactoDto` **[Front]** |
| `src/app/linea-alma/psicologia/services/casos-alma.service.ts`, `recontactos-psicologia.service.ts` | Llamadas **[Front]** |
| `src/app/linea-alma/psicologia/pages/caso/`, `pages/agenda/`, `pages/recontactos/` | Expediente (J-2.1), agenda (J-1.5), recontactos (J-1.7) **[Front]** |
| `src/app/linea-alma/psicologia/components/seguimientos/`, `components/cierre-caso-dialog/` | Seguimientos (J-1.5) y cierre (J-1.6) **[Front]** |
| `src/app/linea-alma/psicologia/dominio/seguimientos.ts` | Contador de controles y fecha futura, con pruebas **[Front]** |
| `src/app/linea-alma/shared/http/alma-api.client.ts` (`descargar`) | Descarga binaria del PDF **[Front]** |

---

## 2. Decisiones que necesitamos de Backend

| # | Decisión | Recomendación | Impacto en el front |
|---|---|---|---|
| **D-PSI-12** | **Contador de controles (RN-ALMA-05).** `numeroSeguimientos` cuenta solo seguimientos; el front muestra `controles = 1 + numeroSeguimientos` sobre 3 reglamentarios (`contadorControles()`), **sin bloquear** al superarlos. | Adoptar. | Una función pura. |
| **D-PSI-13** | **«¿Desea continuar?» = No.** El seguimiento se guarda sin `proximoControl`, el caso pasa a `EN_CIERRE` y `proximoControl` queda `null`; el cierre sigue siendo una acción aparte con motivo del catálogo (Q12: permitido antes del 3.er control). Si vuelve a comunicarse, se admiten más seguimientos. | Adoptar. | Ninguno. |
| **D-PSI-14** | **Recordatorio por correo (RNF-ALMA-004).** Lo envía el servidor al registrar un seguimiento con `proximoControl`; devuelve `recordatorio: { estado: PENDIENTE\|ENVIADO\|FALLIDO\|SIN_CORREO, correo, fechaEnvio }`. Si es asíncrono, `PENDIENTE` y el estado final se ve al recargar. | Adoptar. | La UI solo muestra el estado. |
| **D-PSI-15** | **PDF (Q10).** `GET /casos/{n}/pdf` devuelve el archivo (`application/pdf`, `Content-Disposition: attachment`) de forma **síncrona**; el front tolera hasta 30 s. Alternativa: `202` + URL prefirmada. Contenido: caso completo (atenciones vinculadas, notas, seguimientos, cierre). Roles: ADMIN, COORD, PSI (`alma.pdf.exportar`); REV solo consulta en pantalla. | Síncrono en v1. | Con URL prefirmada, se cambia `descargarPdf()` del servicio. |
| **D-PSI-16** | **Cierre de caso.** Cierra también las atenciones vinculadas (`CERRADO` con el mismo motivo), pone `proximoControl` en `null`, `pdfDisponible: true`, y la persona pasa a «caso cerrado» en la consulta de APH (F2), lo que habilita la contención post-cierre de APH (H-1.7). | Adoptar. | Ninguno. |
| **D-PSI-17** | **Recontacto (RN-ALMA-06, Q8).** `/psicologia/recontactos` lista atenciones `PENDIENTE_PSICOLOGIA` sin `numeroCaso` cuya persona tiene un caso no cerrado y sin decisión. Decisiones: `VINCULAR_A_CASO` (la atención entra al caso, `EN_SEGUIMIENTO`; auditoría `VINCULACION`), `CASO_NUEVO` (sigue en la bandeja; el primer contacto abrirá otro caso sin pedir decisión) y `CONTENCION_PUNTUAL` (nota `PSICO` en el caso **sin sumar seguimientos**; la atención se cierra con `cierre.motivo = CONTENCION_PUNTUAL`). | Adoptar; validar con Laura Murillo si la contención puntual debe ser un `tipo_seguimiento` propio. | Si pasa a ser seguimiento, se quita el texto «no suma seguimientos». |
| **D-PSI-18** | **Agenda.** `GET /psicologia/agenda?desde&hasta&alcance=mios\|todos` con fechas `YYYY-MM-DD` (inclusivas, zona del servidor). `mios` = casos cuyo `profesional` es la sesión; `todos` solo para COORD y ADMIN (el front lo oculta a los demás). | Adoptar. | Ninguno. |
| **D-PSI-19** | **Notas del expediente.** `GET /casos/{n}` trae en `notas` las notas `PSICO`/`SEGTO` del caso **y** las `APH`/`POST_CIERRE` de sus atenciones vinculadas, para una línea de tiempo única sin llamadas extra (J-2.1). | Adoptar. | Sin esto, el front tendría que pedir cada atención. |

---

## 3. Endpoints

Prefijo `{apiBaseUrl}/alma`. JWT en todos.

### 3.1 `GET /casos/{numeroCaso}` — expediente (J-2.1, `RF-ALMA-001`)

- **Roles:** PSI, COORD, ADMIN, REV. `404 CASO_NO_ENCONTRADO`.
- **Respuesta `200`** (`CasoDto` **[Front]**):

```json
{
  "numeroCaso": "CAS-2026-000045",
  "version": 2,
  "estado": "ACTIVO",
  "prioridad": "ALTA",
  "persona": { "tipoIdentificacion": "CC", "numeroIdentificacion": "1000000001", "nombres": "Persona", "apellidos": "Uno", "telefonoPrincipal": "3000000000", "correoPersonal": "p@ejemplo.test", "ciudad": "Medellín", "estrato": 3 },
  "fechaApertura": "2026-11-06T15:05:00-05:00",
  "profesional": "Nombre de la profesional",
  "triajeAph": "ALTO",
  "valoracionRiesgo": { "nivel": "MEDIO", "descripcion": "…" },
  "consentimiento": { "otorgado": true, "medio": "VERBAL", "fechaRegistro": "…", "versionTexto": "v0-provisional" },
  "dimensiones": ["DIM_01", "DIM_04"],
  "presuntoAgresor": null,
  "acuerdos": "…",
  "atenciones": [ { "idAtencion": "ALMA-2026-000123", "fechaCreacion": "…", "canalIngreso": "LLAMADA", "triaje": "ALTO", "estado": "EN_SEGUIMIENTO", "motivoConsulta": "…" } ],
  "numeroSeguimientos": 1,
  "proximoControl": "2026-11-13T10:00:00-05:00",
  "seguimientos": [ { "idSeguimiento": "…", "numeroSeguimiento": 1, "tipo": "REGULAR", "fecha": "…", "nota": "…", "deseaContinuar": true, "proximoControl": "2026-11-13T10:00:00-05:00", "recordatorio": { "estado": "ENVIADO", "correo": "p@ejemplo.test", "fechaEnvio": "…" }, "autor": "…" } ],
  "notas": [ { "idNota": "…", "tipoOrigen": "APH", "contenido": "…", "fechaRegistro": "…", "autor": "…" }, { "idNota": "…", "tipoOrigen": "PSICO", "…": "…" } ],
  "cierre": null,
  "gestionSimultanea": false,
  "pdfDisponible": true,
  "fechaActualizacion": "…"
}
```

- `estado` del caso: `ABIERTO | ACTIVO | EN_CIERRE | CERRADO` (D-PSI-02). `prioridad`: `ALTA | MEDIA | BAJA` (Q1).
- `cierre`: `{ "motivo", "observacion", "fecha", "autor" }` cuando está cerrado.

### 3.2 `GET` / `POST /casos/{numeroCaso}/seguimientos` (J-1.5, `RF-ALMA-PSI-004`)

- **Roles:** PSI, COORD, ADMIN (GET también REV). `GET` → `SeguimientoDto[]`.
- **`POST` request:** `{ "version": 2, "nota": "…", "deseaContinuar": true, "proximoControl": "2026-11-20T10:00:00-05:00" }`
  (`proximoControl` obligatorio y futuro solo si `deseaContinuar`).
- **Respuesta `201`:** `CasoDto` actualizado (`numeroSeguimientos + 1`, `version + 1`, nota `SEGTO`, `estado` `ACTIVO` o `EN_CIERRE`, atenciones vinculadas en `EN_SEGUIMIENTO`, `recordatorio` según D-PSI-14).
- **Errores:** `422 CASO_CERRADO` · `409 CONFLICTO_VERSION` · `400 VALIDACION` (`nota` mín. 5, `deseaContinuar` booleano, `proximoControl`).

### 3.3 `POST /casos/{numeroCaso}/cierre` (J-1.6, `RF-ALMA-PSI-005`)

- **Roles:** PSI, ADMIN (`alma.psicologia.cerrar`; COORD no cierra, plan §11).
- **Request:** `{ "version": 3, "motivo": "OBJETIVOS_CUMPLIDOS", "observacion": null }` (`observacion` obligatoria con `motivo = OTRO`).
- **Respuesta `200`:** `CasoDto` cerrado. Efectos: D-PSI-16; auditoría `CAMBIO_ESTADO`.
- **Errores:** `422 CASO_CERRADO` · `409 CONFLICTO_VERSION` · `400` (`motivo` del catálogo `motivos-cierre-psicologia`, `observacion`).

### 3.4 `GET /casos/{numeroCaso}/pdf` (J-1.6, `RF-ALMA-007`)

- **Roles:** PSI, COORD, ADMIN (`alma.pdf.exportar`). **Respuesta `200`:** `application/pdf` (D-PSI-15).
- **Errores:** `404 CASO_NO_ENCONTRADO` · `422 PDF_NO_DISPONIBLE` · `403` sin permiso.

### 3.5 `GET /psicologia/agenda?desde=&hasta=&alcance=` (J-1.5)

- **Roles:** PSI, COORD, ADMIN. **Respuesta `200`:** `AgendaItemDto[]` ordenado por `proximoControl` ascendente:
  `[ { "numeroCaso", "nombreCompleto", "proximoControl", "numeroSeguimientos", "profesional", "recordatorio" } ]`.
- Solo casos no cerrados con `proximoControl` en el rango. `400` si el rango es inválido (`detalles.desde`).

### 3.6 `GET /psicologia/recontactos` (J-1.7, `RF-ALMA-003`, frontera **F2**)

- **Roles:** PSI, COORD, ADMIN, REV. **Respuesta `200`:** `RecontactoDto[]` (más antiguo primero):

```json
[
  {
    "idAtencion": "ALMA-2026-000200",
    "version": 2,
    "fechaCreacion": "2026-11-08T08:00:00-05:00",
    "canalIngreso": "LLAMADA",
    "triaje": "MEDIO",
    "motivoConsulta": "…",
    "notaAph": "…",
    "persona": { "tipoIdentificacion": "CC", "numeroIdentificacion": "1000000002", "nombreCompleto": "Persona De Prueba Dos" },
    "casoActivo": { "numeroCaso": "CAS-2026-000002", "estado": "ACTIVO", "fechaApertura": "…", "profesional": "…", "numeroSeguimientos": 1, "proximoControl": "…", "ultimaNota": "…" }
  }
]
```

### 3.7 `POST /psicologia/recontactos/{idAtencion}/resolucion` (J-1.7, `RN-ALMA-06`)

- **Roles:** PSI, COORD, ADMIN. **Request:** `{ "version": 2, "decision": "VINCULAR_A_CASO", "numeroCaso": "CAS-2026-000002", "nota": "Mismos hechos; se vincula al caso activo." }`.
  `decision ∈ VINCULAR_A_CASO | CASO_NUEVO | CONTENCION_PUNTUAL`; `numeroCaso` obligatorio salvo con `CASO_NUEVO` y debe ser el caso activo.
- **Respuesta `200`:** `{ "idAtencion", "version", "decision", "numeroCaso": "CAS-2026-000002" | null, "estadoAtencion": "EN_SEGUIMIENTO" | "PENDIENTE_PSICOLOGIA" | "CERRADO" }`. Efectos: D-PSI-17; auditoría en caso y atención.
- **Errores:** `422 RECONTACTO_YA_RESUELTO` · `409 CONFLICTO_VERSION` · `404 NOVEDAD_NO_ENCONTRADA` · `400` (`decision`, `nota` mín. 5, `numeroCaso`).

---

## 4. Diccionario de campos (lo no cubierto en el otro contrato)

| Campo | Tipo | Obligatorio | Regla | Control del front |
|---|---|:-:|---|---|
| `numeroSeguimientos` | entero | sí | D-PSI-12 | `contadorControles()` |
| `deseaContinuar` | boolean | sí | D-PSI-13 | radio Sí/No |
| `proximoControl` | ISO-8601 \| null | si continúa | Futura | `fechaFuturaValidator` |
| `recordatorio.estado` | `PENDIENTE\|ENVIADO\|FALLIDO\|SIN_CORREO` | — | D-PSI-14 | etiqueta en la lista |
| `cierre.motivo` | catálogo `motivos-cierre-psicologia` | sí | `OTRO` exige `observacion` | `CierreCasoDialog` |
| `pdfDisponible` | boolean | sí | D-PSI-15 | botón «Descargar PDF» |
| `decision` | enum | sí | D-PSI-17 | radios + confirmación |

## 5. Validaciones en servidor

Las de §3; el servidor es la autoridad y repite permisos (`403`) y estado.

## 6. Errores

Códigos nuevos que el front ya traduce (`alma-error.ts`): `CASO_CERRADO`, `CASO_NO_ENCONTRADO`, `RECONTACTO_YA_RESUELTO`, `PDF_NO_DISPONIBLE`.

## 7. Maestros

`GET /catalogos/motivos-cierre-psicologia` (placeholder: `OBJETIVOS_CUMPLIDOS`, `PERSONA_NO_DESEA_CONTINUAR`,
`REMITIDA_A_OTRO_SERVICIO`, `NO_CONTACTO`, `OTRO`). Derivaciones del caso: `PanelDerivaciones` con `contexto = { tipo: "CASO", id }` (F6, contrato de APH).

## 8. Privacidad y seguridad

Todo el expediente es información clínica: solo roles con `alma.notasClinicas.consultar`; el Técnico APH nunca lo
recibe. El PDF contiene el historial completo: solo con `alma.pdf.exportar` y auditar su descarga **[Propuesta]**.

## 9. Compatibilidad

Aditivo. `GET /auditoria?tipoContexto=CASO&idContexto=CAS-…` reutiliza el contrato de APH (`AuditTrail`).

## 10. Criterios de aceptación

- [ ] Un cuarto seguimiento se registra sin error y el expediente sigue abierto.
- [ ] Seguimiento con `deseaContinuar: false` no exige `proximoControl` y deja el caso `EN_CIERRE`.
- [ ] Cierre con `motivo = OTRO` sin `observacion` → `400 detalles.observacion`.
- [ ] Tras cerrar, `/personas/consulta` de la cédula devuelve `tieneCasoCerrado: true` y `seguimientoActivo.activo: false`.
- [ ] `GET …/pdf` responde `application/pdf` en menos de 30 s.
- [ ] Un recontacto resuelto desaparece de `/psicologia/recontactos`; `CONTENCION_PUNTUAL` no cambia `numeroSeguimientos`.
- [ ] `alcance=todos` responde `403` a un rol PROFESIONAL.

## 11. Qué hará el frontend cuando el endpoint exista

Poner `environment.lineaAlma.mocks.casos`, `agenda` y `recontactos` en `false` (J-3.3). Los componentes no cambian.
