# Diseño Técnico y Contratos de API — Módulo Seguridad a Personas y Bienes (SPyB)

> **Para:** Equipo de Backend de CASILDA (`casilda-backend`) y Equipo de Frontend (`casilda-frontend`, Angular 21)  
> **De:** Ingeniería de Software CASILDA  
> **Fecha:** 13 de noviembre de 2026  
> **Rama Frontend:** `feature/07/020/casilda/seguridad-personas-y-bienes`  
> **Estado:** **Especificación de Arquitectura y Contratos v1.0**  
> **Fuente de Verdad Funcional:** `docs/Requisitos funcionales_SEG_PyB-ago2026 (1).docx` (148 Requisitos Funcionales RF-SPB-001 a RF-SPB-148).  
> **Objetivo:** Documento autosuficiente que define el modelo de datos relacional, modelo de autorización/roles, endpoints REST, validaciones, catálogos, auditoría, notificaciones y criterios de aceptación para la implementación en backend y frontend.

---

## Índice

1. [Resumen Ejecutivo y Reglas Centrales de Dominio](#1-resumen-ejecutivo-y-reglas-centrales-de-dominio)
2. [Modelo de Autorización, Roles y Acceso Restringido](#2-modelo-de-autorización-roles-y-acceso-restringido)
3. [Modelo de Datos Relacional (PostgreSQL DDL)](#3-modelo-de-datos-relacional-postgresql-ddl)
4. [Mapeo de Entidades JPA (Spring Boot)](#4-mapeo-de-entidades-jpa-spring-boot)
5. [Catálogos y Datos Maestros del Módulo](#5-catálogos-y-datos-maestros-del-módulo)
6. [Especificación de Endpoints REST (API Contracts)](#6-especificación-de-endpoints-rest-api-contracts)
   - 6.1 Recepción y Registro de Actuaciones de Seguridad (PQRS, Alerta, Novedad, Acompañamiento)
   - 6.2 Registro Restringido para Vigilantes / Supervisores (QR / Enlace)
   - 6.3 Consulta de Medidas Activas (Central de Monitoreo)
   - 6.4 Bandeja Central del Analista de Riesgos (Yeison)
   - 6.5 Revisión, Subsanación y Clasificación de Actuaciones
   - 6.6 Vinculación Manual a Casos CASILDA (con Sugerencias)
   - 6.7 Gestión de Solicitudes de Medidas de Protección (derivadas del EA)
   - 6.8 Generación y Consulta de Órdenes de Acompañamiento
   - 6.9 Registro de Informe de Ejecución de Acompañamiento
   - 6.10 Solicitud y Trazabilidad de Evidencia Audiovisual (Cámaras)
   - 6.11 Remisiones (Equipo de Atención, Línea ALMA, UAD y Externas)
   - 6.12 Requerimientos de la UAD y Citación de Testigos
   - 6.13 Indicadores Gerenciales
7. [Mecanismo de Notificaciones y Alertas por Correo](#7-mecanismo-de-notificaciones-y-alertas-por-correo)
8. [Auditoría, Historial y Trazabilidad](#8-auditoría-historial-y-trazabilidad)
9. [Criterios de Aceptación y Pruebas](#9-criterios-de-aceptación-y-pruebas)

---

## 1. Resumen Ejecutivo y Reglas Centrales de Dominio

### 1.1 Principios Fundamentales
1. **Regla de No Equivalencia:** `Persona ≠ Caso CASILDA ≠ Actuación de Seguridad`.
   * Una persona puede tener múltiples casos en la Universidad.
   * Un caso CASILDA puede registrar múltiples actuaciones de Seguridad.
   * Una actuación de Seguridad puede existir y cerrarse como **actuación independiente** sin generar jamás un caso de Ruta Violeta (RF-SPB-020, RF-SPB-065).
2. **Consecutivo Propio e Independiente:**
   * Toda actuación de Seguridad recibe un consecutivo oficial generado automáticamente por el sistema con formato `SPB-YYYY-XXXXX` (o `SPB-XXXXX`), completamente desacoplado del ID del caso CASILDA (RF-SPB-018).
3. **No Vinculación Automática por Cédula:**
   * La coincidencia del documento de identidad genera sugerencias al Analista de Riesgos, pero **la vinculación definitiva a un caso CASILDA debe ser confirmada manualmente por el Analista de Riesgos con justificación registrada** (RF-SPB-039, RF-SPB-040, RF-SPB-042).
4. **Mínima Información y Confidencialidad para Vigilantes:**
   * El personal de vigilancia reporta operativamente; **no consulta expedientes, antecedentes ni información psicosocial** (RF-SPB-007, RF-SPB-008, RF-SPB-136, RF-SPB-137).
5. **No Almacenamiento de Archivos Pesados de Video en CASILDA:**
   * CASILDA gestiona la **trazabilidad, solicitud, cadena de custodia y entrega oficial** de evidencia audiovisual de cámaras, pero **no almacena ni transmite los videos pesados** en su base de datos ni servidor web (RF-SPB-082, RF-SPB-105).
6. **Privacidad en Notificaciones por Correo:**
   * Los correos electrónicos actúan únicamente como disparadores de alerta; **jamás deben incluir datos sensibles, relatos de hechos ni detalles del presunto agresor** (RF-SPB-114, RF-SPB-124, RF-SPB-138).

---

## 2. Modelo de Autorización, Roles y Acceso Restringido

### 2.1 Nuevos Roles Requeridos en Backend

Siguiendo la convención de `casilda-backend/database/crear_rol_con_permisos.sql`:

| ID Rol | Código Rol | Nombre | Descripción y Alcance |
|---|---|---|---|
| 7 | `ANALISTA_RIESGOS` | Analista de Riesgos | Responsable central del módulo (Yeison). Bandeja central, revisión, subsanación, vinculación a casos, reparto a EA/UAD/Línea Alma, gestión de cámaras, métricas completas. |
| 8 | `CENTRAL_MONITOREO` | Central de Monitoreo | Operador telefónico (`219-64-19`) y presencial. Registra solicitudes y novedades iniciales, consulta medidas de protección activas por CC, genera órdenes de acompañamiento iniciales. |
| 9 | `SUPERVISOR_SEGURIDAD` | Supervisor de Seguridad | Supervisores de vigilancia y operadores de medios. Registra novedades, alertas tempranas, rondas e informes de acompañamiento. Acceso a formulario restringido. |

> **Nota:** El rol `ADMIN` de CASILDA (ID 1) hereda permisos completos de lectura y supervisión sobre el módulo.

### 2.2 Acceso Restringido para Vigilancia (QR / Token de Orden)
Para cumplir con RF-SPB-004 y RF-SPB-005 (vigilantes sin cuenta completa en CASILDA):
* Las órdenes de acompañamiento generan un **token de un solo uso o token temporal firmado** (`tokenAcceso` UUID v4 o JWT efímero).
* Al escanear el QR o abrir el enlace `https://casilda.udea.edu.co/seguridad/orden/{tokenAcceso}`, el frontend carga una interfaz limpia donde el vigilante:
  1. Valida su identidad ingresando su número de cédula/identificación institucional.
  2. Visualiza únicamente datos operativos de la orden: persona a acompañar (nombre), punto de encuentro, destino, hora programada y recomendaciones operativas.
  3. Diligencia el **Informe de Acompañamiento** y presiona Enviar.
  4. Una vez enviado, el token se invalida o pasa a estado `EJECUTADO`, bloqueando consultas posteriores (RF-SPB-005, RF-SPB-008).

---

## 3. Modelo de Datos Relacional (PostgreSQL DDL)

Script DDL listo para ejecución en PostgreSQL (`database/update_schema_seguridad_personas_bienes.sql`):

```sql
-- =============================================================================
-- MÓDULO: SEGURIDAD A PERSONAS Y BIENES (SPyB) - CASILDA
-- =============================================================================

-- 1. Secuencia para el consecutivo oficial SPB
CREATE SEQUENCE IF NOT EXISTS seq_consecutivo_spb START WITH 1 INCREMENT BY 1;

-- 2. Catálogos específicos de Seguridad
CREATE TABLE IF NOT EXISTS tiporegistroseguridad (
    id serial PRIMARY KEY,
    codigo varchar(50) UNIQUE NOT NULL,
    nombre varchar(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS canalrecepcionseguridad (
    id serial PRIMARY KEY,
    codigo varchar(50) UNIQUE NOT NULL,
    nombre varchar(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS rolpersonareportada (
    id serial PRIMARY KEY,
    codigo varchar(50) UNIQUE NOT NULL,
    nombre varchar(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS estadoregistroseguridad (
    id serial PRIMARY KEY,
    codigo varchar(50) UNIQUE NOT NULL,
    nombre varchar(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS tipoincidenteacompanamiento (
    id serial PRIMARY KEY,
    codigo varchar(50) UNIQUE NOT NULL,
    nombre varchar(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS estadogestioncamara (
    id serial PRIMARY KEY,
    codigo varchar(50) UNIQUE NOT NULL,
    nombre varchar(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS destinoremisionseguridad (
    id serial PRIMARY KEY,
    codigo varchar(50) UNIQUE NOT NULL,
    nombre varchar(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS tiporequerimientouad (
    id serial PRIMARY KEY,
    codigo varchar(50) UNIQUE NOT NULL,
    nombre varchar(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);

-- 3. Tabla principal: registro y actuación de Seguridad
CREATE TABLE IF NOT EXISTS registroseguridad (
    id bigserial PRIMARY KEY,
    consecutivo varchar(30) UNIQUE NOT NULL,
    idtiporegistro integer NOT NULL REFERENCES tiporegistroseguridad(id),
    idcanalrecepcion integer NOT NULL REFERENCES canalrecepcionseguridad(id),
    idestadoregistro integer NOT NULL REFERENCES estadoregistroseguridad(id),
    
    -- Fechas y horas (RF-SPB-011)
    fechareporte timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechahorahechos timestamp with time zone,
    
    -- Ubicación
    idcampus integer REFERENCES campus(id),
    lugarhechos varchar(255) NOT NULL,
    
    -- Descripción
    descripcionhechos text NOT NULL,
    
    -- Persona reportada / atendida
    idrolpersona integer NOT NULL REFERENCES rolpersonareportada(id),
    idpersona bigint REFERENCES persona(id),
    numerodocumento varchar(50),
    idtipoidentificacion integer REFERENCES tipoidentificacion(id),
    nombrecompleto varchar(255),
    telefono varchar(50),
    correo varchar(150),
    idvinculoudea integer REFERENCES vinculoudea(id),
    
    -- Reportante / Funcionario receptor
    cedulareportante varchar(50) NOT NULL,
    nombrereportante varchar(255) NOT NULL,
    cargoreportante varchar(100),
    
    -- Consentimiento informado para Ruta Violeta (RF-SPB-025..027)
    lecturaconsentimiento boolean DEFAULT false NOT NULL,
    autorizaactivacionruta boolean DEFAULT false NOT NULL,
    fechahoraconsentimiento timestamp with time zone,
    funcionariolecturaconsentimiento varchar(255),
    
    -- Vinculación a caso CASILDA (RF-SPB-035..045)
    idcaso bigint REFERENCES caso(id),
    criteriovinculacion text,
    fechavinculacion timestamp with time zone,
    usuariovinculacion varchar(100),
    
    -- Subsanación y revisión del Analista (RF-SPB-033..034)
    solicitasubsanacion boolean DEFAULT false NOT NULL,
    motivosubsanacion text,
    fechasubsanacion timestamp with time zone,
    
    -- Auditoría
    fechacreacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usuariocreacion varchar(100) NOT NULL,
    fechamodificacion timestamp with time zone,
    usuariomodificacion varchar(100)
);

CREATE INDEX IF NOT EXISTS idx_registroseg_consecutivo ON registroseguridad(consecutivo);
CREATE INDEX IF NOT EXISTS idx_registroseg_doc ON registroseguridad(numerodocumento);
CREATE INDEX IF NOT EXISTS idx_registroseg_caso ON registroseguridad(idcaso);
CREATE INDEX IF NOT EXISTS idx_registroseg_estado ON registroseguridad(idestadoregistro);
CREATE INDEX IF NOT EXISTS idx_registroseg_fecha ON registroseguridad(fechareporte);

-- 4. Órdenes de Acompañamiento
CREATE TABLE IF NOT EXISTS ordenacompanamientoseguridad (
    id bigserial PRIMARY KEY,
    codigoorden varchar(30) UNIQUE NOT NULL,
    idcaso bigint REFERENCES caso(id),
    idmedidaproteccion bigint REFERENCES medidaproteccion(id),
    idregistroorigen bigint REFERENCES registroseguridad(id),
    
    esmedidaformal boolean DEFAULT true NOT NULL,
    prioridad varchar(20) DEFAULT 'MEDIA' NOT NULL, -- ALTA, MEDIA, BAJA
    
    fechaprogramada date NOT NULL,
    horaprogramada time NOT NULL,
    lugarorigen varchar(255) NOT NULL,
    lugardestino varchar(255) NOT NULL,
    
    personaacompanada varchar(255) NOT NULL,
    documentoacompanada varchar(50),
    telefonoacompanada varchar(50),
    
    condicionesoperativas text,
    observacionesoperativas text,
    
    tokenacceso varchar(64) UNIQUE NOT NULL,
    estado varchar(30) DEFAULT 'CREADA' NOT NULL, -- CREADA, ASIGNADA, EN_EJECUCION, FINALIZADA, CANCELADA
    
    supervisorasignado varchar(255),
    cedulasupervisor varchar(50),
    
    fechacreacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usuariocreacion varchar(100) NOT NULL,
    fechamodificacion timestamp with time zone,
    usuariomodificacion varchar(100)
);

CREATE INDEX IF NOT EXISTS idx_ordenacomp_codigo ON ordenacompanamientoseguridad(codigoorden);
CREATE INDEX IF NOT EXISTS idx_ordenacomp_token ON ordenacompanamientoseguridad(tokenacceso);
CREATE INDEX IF NOT EXISTS idx_ordenacomp_caso ON ordenacompanamientoseguridad(idcaso);

-- 5. Informes de Acompañamiento
CREATE TABLE IF NOT EXISTS informeacompanamientoseguridad (
    id bigserial PRIMARY KEY,
    idorden bigint REFERENCES ordenacompanamientoseguridad(id),
    idregistroseguridad bigint NOT NULL REFERENCES registroseguridad(id),
    
    vigilanteresponsable varchar(255) NOT NULL,
    cedulavigilante varchar(50) NOT NULL,
    
    lugarinicio varchar(255) NOT NULL,
    lugardestino varchar(255) NOT NULL,
    fechahorainicio timestamp with time zone NOT NULL,
    fechahorafin timestamp with time zone NOT NULL,
    
    -- Identificación del agresor (RF-SPB-072..074)
    identificoagresor boolean DEFAULT false NOT NULL,
    lugarhoraagresor varchar(255),
    descripcionagresor text,
    
    -- Incidentes y situaciones de riesgo (RF-SPB-075..077)
    ocurrioincidente boolean DEFAULT false NOT NULL,
    idtipoincidente integer REFERENCES tipoincidenteacompanamiento(id),
    descripcionincidente text,
    actuacionadoptada text,
    
    -- Cámaras (RF-SPB-078)
    camarasdisponibles boolean DEFAULT false NOT NULL,
    observacionescamaras text,
    
    novedadesadicionales text,
    
    fechacreacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usuariocreacion varchar(100) NOT NULL
);

-- 6. Trazabilidad de Evidencia Audiovisual (Cámaras)
CREATE TABLE IF NOT EXISTS solicitudevidenciacamara (
    id bigserial PRIMARY KEY,
    codigosolicitud varchar(30) UNIQUE NOT NULL,
    idregistroseguridad bigint REFERENCES registroseguridad(id),
    idcaso bigint REFERENCES caso(id),
    
    ubicacioncamara varchar(255) NOT NULL,
    fechahechos date NOT NULL,
    horainiciofranja time NOT NULL,
    horafinfranja time NOT NULL,
    motivosolicitud text NOT NULL,
    
    idestadogestion integer NOT NULL REFERENCES estadogestioncamara(id),
    
    -- Referencia de custodia (SIN video físico en CASILDA)
    referenciaarchivoinstitucional varchar(255),
    ubicacionrepositorioautorizado varchar(255),
    observacionescustodia text,
    
    -- Entrega oficial a autoridades (RF-SPB-101..104)
    entidadautoridad varchar(255),
    oficiosolicitud varchar(100),
    fechaentrega timestamp with time zone,
    responsableentrega varchar(255),
    constanciaentrega varchar(255),
    
    fechacreacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usuariocreacion varchar(100) NOT NULL,
    fechamodificacion timestamp with time zone,
    usuariomodificacion varchar(100)
);

CREATE INDEX IF NOT EXISTS idx_evidenciacam_codigo ON solicitudevidenciacamara(codigosolicitud);

-- 7. Remisiones de Seguridad (EA, ALMA, UAD, Externas)
CREATE TABLE IF NOT EXISTS remisionseguridad (
    id bigserial PRIMARY KEY,
    idregistroseguridad bigint NOT NULL REFERENCES registroseguridad(id),
    idcaso bigint REFERENCES caso(id),
    iddestinoremision integer NOT NULL REFERENCES destinoremisionseguridad(id),
    
    motivo text NOT NULL,
    fecharemision timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usuarioremitente varchar(100) NOT NULL,
    estadoremision varchar(30) DEFAULT 'ENVIADA' NOT NULL,
    
    -- Datos específicos UAD (RF-SPB-087..091)
    consecutivorecibidouad varchar(100),
    radicadodisciplinariouad varchar(100),
    estadoprocesouad varchar(100),
    
    -- Datos entidades externas (Fiscalía, Policía) (RF-SPB-096..100)
    entidadexterna varchar(255),
    medionotificacion varchar(100),
    numerodenunciaexterna varchar(100),
    observacionesexternas text
);

-- 8. Requerimientos de la UAD (Citación testigos, etc.)
CREATE TABLE IF NOT EXISTS requerimientouadseguridad (
    id bigserial PRIMARY KEY,
    idremision bigint NOT NULL REFERENCES remisionseguridad(id),
    idtiporequerimiento integer NOT NULL REFERENCES tiporequerimientouad(id),
    
    personarequerida varchar(255) NOT NULL,
    cedulapersonarequerida varchar(50) NOT NULL,
    fechaaudiencia timestamp with time zone,
    
    estadonotificacion varchar(50) DEFAULT 'PENDIENTE' NOT NULL, -- PENDIENTE, NOTIFICADO, FALLIDO
    asistio boolean,
    observaciones text,
    
    fecharegistro timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usuarioregistro varchar(100) NOT NULL
);

-- 9. Notificaciones generadas por Seguridad
CREATE TABLE IF NOT EXISTS notificacionseguridad (
    id bigserial PRIMARY KEY,
    tiponotificacion varchar(100) NOT NULL,
    destinatariocorreo varchar(150) NOT NULL,
    destinatariorol varchar(50),
    eventoorigen varchar(100) NOT NULL,
    consecutivoasociado varchar(50),
    fechaenvio timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estadoenvio varchar(20) DEFAULT 'PENDIENTE' NOT NULL, -- PENDIENTE, ENVIADO, FALLIDO
    detalleerror text
);

-- 10. Auditoría e Historial de Cambios SPyB
CREATE TABLE IF NOT EXISTS auditoriaseguridad (
    id bigserial PRIMARY KEY,
    idregistroseguridad bigint REFERENCES registroseguridad(id),
    consecutivo varchar(30) NOT NULL,
    accion varchar(50) NOT NULL, -- CREACION, MODIFICACION, SUBSANACION, VINCULACION, ASIGNACION, CIERRE
    usuario varchar(100) NOT NULL,
    fechahora timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    datosanteriores jsonb,
    datosnuevos jsonb,
    justificacion text
);
```

---

## 4. Mapeo de Entidades JPA (Spring Boot)

Paquete sugerido: `co.edu.udea.casilda.model.entity.seguridad`

```java
// Entidad Principal: RegistroSeguridad.java
@Entity
@Table(name = "registroseguridad")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RegistroSeguridad extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String consecutivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idtiporegistro", nullable = false)
    private TipoRegistroSeguridad tipoRegistro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idcanalrecepcion", nullable = false)
    private CanalRecepcionSeguridad canalRecepcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idestadoregistro", nullable = false)
    private EstadoRegistroSeguridad estadoRegistro;

    @Column(name = "fechareporte", nullable = false)
    private ZonedDateTime fechaReporte;

    @Column(name = "fechahorahechos")
    private ZonedDateTime fechaHoraHechos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idcampus")
    private Campus campus;

    @Column(name = "lugarhechos", nullable = false)
    private String lugarHechos;

    @Column(name = "descripcionhechos", columnDefinition = "text", nullable = false)
    private String descripcionHechos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idrolpersona", nullable = false)
    private RolPersonaReportada rolPersona;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idpersona")
    private Persona persona;

    @Column(name = "numerodocumento", length = 50)
    private String numeroDocumento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idtipoidentificacion")
    private TipoIdentificacion tipoIdentificacion;

    @Column(name = "nombrecompleto")
    private String nombreCompleto;

    @Column(length = 50)
    private String telefono;

    @Column(length = 150)
    private String correo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idvinculoudea")
    private VinculoUdeA vinculoUdeA;

    @Column(name = "cedulareportante", nullable = false, length = 50)
    private String cedulaReportante;

    @Column(name = "nombrereportante", nullable = false)
    private String nombreReportante;

    @Column(name = "cargoreportante", length = 100)
    private String cargoReportante;

    @Column(name = "lecturaconsentimiento", nullable = false)
    private Boolean lecturaConsentimiento = false;

    @Column(name = "autorizaactivacionruta", nullable = false)
    private Boolean autorizaActivacionRuta = false;

    @Column(name = "fechahoraconsentimiento")
    private ZonedDateTime fechaHoraConsentimiento;

    @Column(name = "funcionariolecturaconsentimiento")
    private String funcionarioLecturaConsentimiento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idcaso")
    private Caso caso;

    @Column(name = "criteriovinculacion", columnDefinition = "text")
    private String criterioVinculacion;

    @Column(name = "fechavinculacion")
    private ZonedDateTime fechaVinculacion;

    @Column(name = "usuariovinculacion", length = 100)
    private String usuarioVinculacion;

    @Column(name = "solicitasubsanacion", nullable = false)
    private Boolean solicitaSubsanacion = false;

    @Column(name = "motivosubsanacion", columnDefinition = "text")
    private String motivoSubsanacion;

    @Column(name = "fechasubsanacion")
    private ZonedDateTime fechaSubsanacion;
}
```

---

## 5. Catálogos y Datos Maestros del Módulo

Datos semilla iniciales para `database/insert_catalogos_seguridad_personas_bienes.sql`:

```sql
-- Tipos de registro
INSERT INTO tiporegistroseguridad (id, codigo, nombre) VALUES
    (1, 'PQRS', 'PQRS Comunidad Universitaria'),
    (2, 'ALERTA_TEMPRANA', 'Alerta Temprana'),
    (3, 'NOVEDAD', 'Novedad de Seguridad'),
    (4, 'INFORME_ACOMPANAMIENTO', 'Informe de Acompañamiento')
ON CONFLICT (id) DO NOTHING;

-- Canales de recepción
INSERT INTO canalrecepcionseguridad (id, codigo, nombre) VALUES
    (1, 'TELEFONO_219_64_19', 'Línea de Seguridad 219-64-19'),
    (2, 'CORREO_ELECTRONICO', 'Correo Electrónico'),
    (3, 'PRESENCIAL', 'Atención Presencial'),
    (4, 'REVISION_INTERNA', 'Ronda / Detección Operativa'),
    (5, 'OTRO', 'Otro Canal Autorizado')
ON CONFLICT (id) DO NOTHING;

-- Roles de la persona reportada
INSERT INTO rolpersonareportada (id, codigo, nombre) VALUES
    (1, 'VICTIMA', 'Víctima / Persona Afectada'),
    (2, 'PRESUNTO_AGRESOR', 'Presunto Agresor / Persona Señalada'),
    (3, 'OTRO_INTERVINIENTE', 'Otro Interviniente / Testigo')
ON CONFLICT (id) DO NOTHING;

-- Estados de la actuación
INSERT INTO estadoregistroseguridad (id, codigo, nombre) VALUES
    (1, 'NUEVO', 'Nuevo / Sin Gestionar'),
    (2, 'EN_REVISION', 'En Revisión por Analista'),
    (3, 'SUBSANACION_REQUERIDA', 'Subsanación Requerida a Vigilante'),
    (4, 'PENDIENTE_VINCULACION', 'Pendiente de Vinculación a Caso'),
    (5, 'VINCULADO_CASO', 'Vinculado a Caso CASILDA'),
    (6, 'ACTUACION_INDEPENDIENTE', 'Cerrado como Actuación Independiente'),
    (7, 'CERRADO', 'Gestionado y Cerrado')
ON CONFLICT (id) DO NOTHING;

-- Tipos de incidente en acompañamiento
INSERT INTO tipoincidenteacompanamiento (id, codigo, nombre) VALUES
    (1, 'ACERCAMIENTO', 'Acercamiento indebido'),
    (2, 'CONTACTO_VERBAL_FISICO', 'Contacto verbal o físico no consentido'),
    (3, 'INTIMIDACION', 'Intimidación visual o gestual'),
    (4, 'AMENAZA', 'Amenaza verbal o expresa'),
    (5, 'OTRO', 'Otra situación de riesgo')
ON CONFLICT (id) DO NOTHING;

-- Estados de gestión de cámaras
INSERT INTO estadogestioncamara (id, codigo, nombre) VALUES
    (1, 'SOLICITADA', 'Solicitud Radicada'),
    (2, 'EXTRAIDA_CUSTODIADA', 'Video Extraído y Custodiado'),
    (3, 'NO_DISPONIBLE', 'Cámara Inoperativa / Sin Cobertura'),
    (4, 'ENTREGADA_AUTORIDAD', 'Entregada Oficialmente a Autoridad Externa'),
    (5, 'CERRADA', 'Gestión Finalizada')
ON CONFLICT (id) DO NOTHING;

-- Destinos de remisión
INSERT INTO destinoremisionseguridad (id, codigo, nombre) VALUES
    (1, 'EQUIPO_ATENCION', 'Equipo de Atención Integral (Ruta Violeta)'),
    (2, 'LINEA_ALMA', 'Línea ALMA (Apoyo Psicológico / Contención)'),
    (3, 'UAD', 'Unidad de Asuntos Disciplinarios (UAD)'),
    (4, 'FISCALIA', 'Fiscalía General de la Nación'),
    (5, 'POLICIA', 'Policía Nacional'),
    (6, 'OTRO_EXTERNO', 'Otra Entidad Externa')
ON CONFLICT (id) DO NOTHING;

-- Tipos de requerimiento UAD
INSERT INTO tiporequerimientouad (id, codigo, nombre) VALUES
    (1, 'CITACION_TESTIGO', 'Citación a Testigo / Vigilante'),
    (2, 'AMPLIACION_INFORME', 'Ampliación de Informe Operativo'),
    (3, 'SOLICITUD_EVIDENCIA', 'Requerimiento de Evidencia Audiovisual')
ON CONFLICT (id) DO NOTHING;
```

---

## 6. Especificación de Endpoints REST (API Contracts)

Base path: `/api/v1/seguridad`  
Formato de transporte: `application/json;charset=UTF-8`

### 6.1 Recepción y Registro de Actuaciones de Seguridad
* **POST `/api/v1/seguridad/registros`**
* **Roles:** `ANALISTA_RIESGOS`, `CENTRAL_MONITOREO`, `SUPERVISOR_SEGURIDAD`, `ADMIN`
* **Descripción:** Crea una actuación de Seguridad asignando automáticamente consecutivo `SPB-YYYY-XXXXX`.

**Request Body JSON:**
```json
{
  "tipoRegistroCodigo": "NOVEDAD",
  "canalRecepcionCodigo": "TELEFONO_219_64_19",
  "fechaHoraHechos": "2026-11-13T10:15:00-05:00",
  "campusId": 1,
  "lugarHechos": "Bloque 22, pasillo segundo piso",
  "descripcionHechos": "Durante ronda preventiva se observa discusión acalorada donde se evidencia presunto acoso físico...",
  "rolPersonaCodigo": "VICTIMA",
  "persona": {
    "tipoIdentificacionId": 1,
    "numeroDocumento": "1035987456",
    "nombreCompleto": "Ana María Gómez Restrepo",
    "telefono": "3001234567",
    "correo": "ana.gomez@udea.edu.co",
    "vinculoUdeAId": 2
  },
  "reportante": {
    "cedula": "71234567",
    "nombre": "Carlos Alberto Supervisor",
    "cargo": "Supervisor Turno Mañana"
  },
  "consentimientoRutaVioleta": {
    "lecturaConsentimiento": true,
    "autorizaActivacionRuta": true,
    "funcionarioLectura": "Operador Central 04",
    "fechaHora": "2026-11-13T10:20:00-05:00"
  }
}
```

**Response JSON (201 Created):**
```json
{
  "id": 105,
  "consecutivo": "SPB-2026-00042",
  "estado": "NUEVO",
  "fechaReporte": "2026-11-13T10:22:15-05:00",
  "mensaje": "Actuación de seguridad registrada exitosamente"
}
```

---

### 6.2 Registro Restringido para Vigilantes / Supervisores (QR / Enlace)
* **POST `/api/v1/seguridad/registros/restringido`**
* **Roles:** Público o token de sesión rápida de supervisor (`SUPERVISOR_SEGURIDAD` / Bearer temporal / validación cédula).
* **Descripción:** Permite a supervisores en campo registrar novedades sin acceso al expediente institucional.
* **Validaciones:** Exige número de cédula del supervisor para trazabilidad histórica indeleble (RF-SPB-006, RF-SPB-009).

---

### 6.3 Consulta de Medidas Activas (Central de Monitoreo)
* **GET `/api/v1/seguridad/consultas/medida-activa/{numeroDocumento}`**
* **Roles:** `CENTRAL_MONITOREO`, `ANALISTA_RIESGOS`, `ADMIN`
* **Descripción:** Verifica en tiempo real si una persona que llama o llega tiene una medida de protección vigente en CASILDA (RF-SPB-012).

**Response JSON (200 OK):**
```json
{
  "tieneMedidaActiva": true,
  "persona": {
    "numeroDocumento": "1035987456",
    "nombreCompleto": "Ana María Gómez Restrepo"
  },
  "medidas": [
    {
      "idMedida": 34,
      "idCaso": 12,
      "codigoCaso": "CAS-2026-0012",
      "tipoMedida": "Acompañamiento en campus",
      "vigenciaFin": "2026-11-30",
      "condiciones": "Acompañamiento desde portería Ferrocarril hasta Bloque 16 a las 07:00 y a las 18:00"
    }
  ]
}
```

---

### 6.4 Bandeja Central del Analista de Riesgos (Yeison)
* **GET `/api/v1/seguridad/analista/bandeja?pestana={pestana}&page=0&size=10`**
* **Roles:** `ANALISTA_RIESGOS`, `ADMIN`
* **Parámetros de pestaña:** `NUEVOS`, `REVISION`, `PENDIENTE_VINCULACION`, `ACOMPANAMIENTOS`, `CAMARAS`, `REMISIONES`, `UAD`.

**Response JSON (200 OK):**
```json
{
  "conteos": {
    "nuevos": 5,
    "enRevision": 3,
    "pendienteVinculacion": 4,
    "acompanamientos": 8,
    "camaras": 2,
    "remisiones": 6,
    "uad": 1
  },
  "items": [
    {
      "id": 105,
      "consecutivo": "SPB-2026-00042",
      "tipoRegistro": "NOVEDAD",
      "fechaReporte": "2026-11-13T10:22:15-05:00",
      "campusNombre": "Ciudad Universitaria - Medellín",
      "personaAfectada": "Ana María Gómez Restrepo",
      "documento": "1035987456",
      "reportante": "Carlos Alberto Supervisor",
      "estado": "NUEVO",
      "autorizaRutaVioleta": true,
      "tieneSugerenciasCaso": true
    }
  ],
  "page": 0,
  "size": 10,
  "total": 5
}
```

---

### 6.5 Vinculación Manual a Casos CASILDA (con Sugerencias)
* **GET `/api/v1/seguridad/casos/sugerencias-vinculacion?numeroDocumento={doc}`**
  * Retorna los casos CASILDA existentes asociados a la persona (ID caso, fecha apertura, estado, hechos resumidos).
* **POST `/api/v1/seguridad/registros/{id}/vincular-caso`**
  * **Request JSON:**
    ```json
    {
      "idCaso": 12,
      "criterioJustificacion": "Se vincula la novedad reportada por vigilancia a los hechos del caso CAS-2026-0012 por coincidencia de agresor y lugar"
    }
    ```
* **POST `/api/v1/seguridad/registros/{id}/declarar-independiente`**
  * Marca la actuación como independiente sin vincular a Ruta Violeta, registrando motivo (RF-SPB-041).

---

### 6.6 Órdenes de Acompañamiento y Ejecución
* **POST `/api/v1/seguridad/ordenes-acompanamiento`**
  * Crea una orden formal (desde medida EA o solicitud directa).
  * Genera `codigoOrden` (ej. `ORD-SPB-2026-0015`) y `tokenAcceso`.
* **GET `/api/v1/seguridad/ordenes-acompanamiento/restringida/{tokenAcceso}`**
  * Devuelve los datos indispensables para el vigilante en campo.
* **POST `/api/v1/seguridad/ordenes-acompanamiento/{codigoOrden}/informe`**
  * Diligenciamiento del informe de ejecución (lugar inicio, lugar fin, presencia del presunto agresor, incidentes, cámaras).

---

### 6.7 Trazabilidad de Evidencias de Cámaras
* **POST `/api/v1/seguridad/evidencias/solicitudes`**
  * Registra franja horaria, ubicación y motivo para extracción de grabación.
* **PATCH `/api/v1/seguridad/evidencias/solicitudes/{id}/custodia`**
  * Registra identificador de archivo en el repositorio institucional físico/digital y estado de custodia.
* **POST `/api/v1/seguridad/evidencias/solicitudes/{id}/entrega-autoridad`**
  * Documenta la entrega a Fiscalía/Policía con oficio y constancia formal.

---

### 6.8 Remisiones y Requerimientos de la UAD
* **POST `/api/v1/seguridad/remisiones`**
  * Crea remisión a EA, Alma o UAD.
* **PATCH `/api/v1/seguridad/remisiones/{id}/uad-consecutivo`**
  * Registra consecutivo de recibido emitido por la UAD.
* **POST `/api/v1/seguridad/remisiones/uad/requerimientos`**
  * Registra requerimientos de la UAD (citación a vigilantes como testigos con fecha de audiencia y estado de notificación).

---

## 7. Mecanismo de Notificaciones y Alertas por Correo

El módulo SPyB interactúa con la infraestructura de correo de CASILDA (`spring-boot-starter-mail` / JavaMailSender asíncrono `@Async`) bajo las siguientes reglas:

| Evento Disparador | Destinatario | Asunto | Contenido Permitido (Principio de Confidencialidad) |
|---|---|---|---|
| Nueva Novedad VBG reportada por Vigilante (RF-111) | Analista de Riesgos (`yeison...`) | `[CASILDA - SPyB] Nueva Novedad de Seguridad pendiente de revisión` | Consecutivo (`SPB-XXXX`), fecha/hora y enlace seguro a CASILDA. **Cero nombres ni relatos.** |
| Nueva Solicitud de Medida EA (RF-115) | Analista de Riesgos | `[CASILDA - SPyB] Solicitud de Medida de Protección recibida` | Código de caso, tipo de medida y enlace seguro. |
| Gestión de Medida por SPyB (RF-119) | Equipo de Atención | `[CASILDA] Medida de Protección gestionada por Seguridad` | Código de caso, estado de aceptación y condiciones operativas generales. |
| Acompañamiento habilitado (RF-121..125) | Víctima / Beneficiaria | `[CASILDA] Información sobre su medida de acompañamiento preventivo` | Canal telefónico para activar (`219-64-19`), horarios, puntos de encuentro y recomendaciones de seguridad. **Sin datos de agresor ni expediente.** |
| Citación Testigo UAD (RF-095) | Supervisor / Vigilante | `[CASILDA - SPyB] Notificación de diligencia disciplinaria UAD` | Fecha, hora, lugar de la audiencia e instrucciones. |

Toda notificación genera un registro en la tabla `notificacionseguridad` con estado (`PENDIENTE`, `ENVIADO`, `FALLIDO`) para auditoría e indicadores (RF-SPB-126..129).

---

## 8. Auditoría, Historial y Trazabilidad

1. **Inmutabilidad de Registros:**
   * La vinculación o actualización de una actuación independiente **nunca borra ni sobreescribe** los datos originales del reporte (RF-SPB-134).
2. **Tabla `auditoriaseguridad`:**
   * Guarda snapshots JSON (`datosanteriores`, `datosnuevos`) ante cualquier modificación, subsanación, vinculación o cierre realizada por el Analista de Riesgos.
3. **Identificación Histórica de Vigilantes:**
   * La cédula y nombre del supervisor se persisten en texto estático en la tabla de la actuación, de forma que si el funcionario deja de trabajar en la Universidad o se desactiva su usuario, el registro histórico permanece íntegro e identificable (RF-SPB-009).

---

## 9. Criterios de Aceptación y Pruebas

- [ ] **CA-01:** La base de datos genera automáticamente el consecutivo `SPB-YYYY-XXXXX` sin colisiones concurrentes.
- [ ] **CA-02:** Un supervisor puede registrar una novedad mediante el endpoint restringido aportando su cédula y nombre sin poseer rol de administración.
- [ ] **CA-03:** La Central de Monitoreo puede consultar en `< 200 ms` si una cédula posee medidas de protección activas.
- [ ] **CA-04:** El Analista de Riesgos visualiza la bandeja con conteos discriminados por estado y pestaña.
- [ ] **CA-05:** La vinculación a un caso CASILDA requiere confirmación manual del Analista con registro de justificación; no existe vinculación automática por cédula.
- [ ] **CA-06:** La generación de una orden de acompañamiento crea un token de acceso único para vigilantes.
- [ ] **CA-07:** El formulario de informe de acompañamiento permite documentar si se avistó al presunto agresor e incidentes de riesgo.
- [ ] **CA-08:** La gestión de cámaras almacena la referencia de custodia institucional sin aceptar archivos de video binarios en CASILDA.
- [ ] **CA-09:** Las remisiones a la UAD permiten registrar el consecutivo de recibido UAD y posteriormente el radicado disciplinario.
- [ ] **CA-10:** Los correos de notificación no exponen en su texto plano nombres de víctimas, relatos de violencia ni datos confidenciales del presunto agresor.
