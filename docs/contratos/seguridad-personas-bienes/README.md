# Contratos de API y Diseño Técnico — Módulo Seguridad a Personas y Bienes (SPyB)

> **Para:** Equipo de Backend de CASILDA (`casilda-backend`) y Frontend (`casilda-frontend`)  
> **Fecha:** 13 de noviembre de 2026  
> **Rama Frontend:** `feature/07/020/casilda/seguridad-personas-y-bienes`  
> **Estado:** **Especificación de Arquitectura y Contratos v1.0**  
> **Documento Principal:** [diseno-tecnico-y-contratos-backend-spyb.md](file:///D:/Documentos/GitHub/casilda-frontend/docs/contratos/seguridad-personas-bienes/diseno-tecnico-y-contratos-backend-spyb.md)

---

## 1. Documentos en esta sección

| Archivo | Descripción |
|---|---|
| `README.md` (este archivo) | Introducción, guía de navegación e inventario de artefactos técnicos de SPyB. |
| [diseno-tecnico-y-contratos-backend-spyb.md](file:///D:/Documentos/GitHub/casilda-frontend/docs/contratos/seguridad-personas-bienes/diseno-tecnico-y-contratos-backend-spyb.md) | **Especificación completa y autosuficiente:** DDL PostgreSQL, mapeo JPA, roles y permisos, contratos de endpoints REST, reglas de negocio, catálogos, notificaciones y criterios de aceptación. |

---

## 2. Puntos Clave para Backend

1. **Scripts de Base de Datos:**
   * El DDL completo con tablas, secuencias, índices y catálogos iniciales se encuentra en la Sección 3 del documento principal.
   * Se requiere crear los 3 roles (`ANALISTA_RIESGOS`, `CENTRAL_MONITOREO`, `SUPERVISOR_SEGURIDAD`) usando el procedimiento `crear_rol_con_permisos` o SQL manual documentado en `casilda-backend/docs/GUIA_CREACION_ROLES.md`.

2. **Endpoints Centrales:**
   * `POST /api/v1/seguridad/registros` (recepción general).
   * `POST /api/v1/seguridad/registros/restringido` (formulario ágil supervisores con cédula).
   * `GET /api/v1/seguridad/consultas/medida-activa/{numeroDocumento}` (consulta rápida Central de Monitoreo).
   * `GET /api/v1/seguridad/analista/bandeja` (bandeja con conteos de Yeison).
   * `POST /api/v1/seguridad/registros/{id}/vincular-caso` (vinculación manual con justificación).
   * `POST /api/v1/seguridad/ordenes-acompanamiento` y `/informe` (órdenes y ejecución).
   * `POST /api/v1/seguridad/evidencias/solicitudes` (trazabilidad de cámaras sin archivos de video).
   * `POST /api/v1/seguridad/remisiones` y `/uad/requerimientos` (articulación y citación de testigos).

3. **Estrategia Frontend:**
   * Mientras backend despliega los endpoints en el ambiente QA, el frontend implementará los servicios y componentes contra un servicio mock (`src/app/features/seguridad-personas-bienes/mocks/`) asegurando independencia operativa sin bloqueos mutuos.

