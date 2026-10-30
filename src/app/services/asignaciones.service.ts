import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { CasosSimuladosService } from './casos-simulados.service';
import {
  ContactoTelefonicoDto,
  ContactoTelefonicoRequestDto,
  SolicitudAcompanamientoResponse,
  SolicitudService
} from './solicitud.service';

const ESTADO_SOLICITUD_ASIGNADA = 2;
const PREFIJO_REFERENCIA_DEMO = 'demo-';

export interface SolicitudAsignada extends SolicitudAcompanamientoResponse {
  esDemostracion: boolean;
}

export interface ResultadoAsignaciones {
  solicitudes: SolicitudAsignada[];
  totalElementos: number;
  pagina: number;
  tamano: number;
  usaDemostracion: boolean;
}

/**
 * Fuente única para «Mis asignaciones» y «Gestión de contacto».
 *
 * El API publicado solo permite filtrar por estado; todavía no expone una ruta
 * «asignadas a la persona autenticada». Mientras ese contrato no exista, ambas
 * pantallas consumen exactamente el mismo listado de solicitudes asignadas.
 * Si el backend no entrega registros o falla, se usan casos ficticios y se
 * informa a la vista para que los identifique como datos de demostración.
 */
@Injectable({ providedIn: 'root' })
export class AsignacionesService {
  private readonly solicitudesApi = inject(SolicitudService);
  private readonly casosSimulados = inject(CasosSimuladosService);

  listar(page: number, size: number): Observable<ResultadoAsignaciones> {
    return this.solicitudesApi
      .listarPaginadas(page, size, ESTADO_SOLICITUD_ASIGNADA)
      .pipe(
        map((respuesta) => {
          if (respuesta.content.length === 0) {
            return this.resultadoDemostracion(page, size);
          }

          return {
            solicitudes: respuesta.content.map((solicitud) => ({
              ...solicitud,
              esDemostracion: false
            })),
            totalElementos: respuesta.totalElements,
            pagina: respuesta.number,
            tamano: respuesta.size,
            usaDemostracion: false
          };
        }),
        catchError(() => of(this.resultadoDemostracion(page, size)))
      );
  }

  obtener(referencia: string, size: number): Observable<ResultadoAsignaciones> {
    if (referencia.startsWith(PREFIJO_REFERENCIA_DEMO)) {
      const id = Number(referencia.slice(PREFIJO_REFERENCIA_DEMO.length));
      return of(this.resultadoDemostracion(0, size, id));
    }

    const id = Number(referencia);
    if (!Number.isInteger(id) || id <= 0) {
      return of(this.resultadoDemostracion(0, size));
    }

    return this.solicitudesApi.obtenerPorId(id).pipe(
      map((solicitud) => ({
        solicitudes: [{ ...solicitud, esDemostracion: false }],
        totalElementos: 1,
        pagina: 0,
        tamano: size,
        usaDemostracion: false
      })),
      catchError(() => of(this.resultadoDemostracion(0, size)))
    );
  }

  referenciaRuta(solicitud: SolicitudAsignada): string | number {
    return solicitud.esDemostracion
      ? `${PREFIJO_REFERENCIA_DEMO}${solicitud.id}`
      : solicitud.id;
  }

  listarContactos(solicitud: SolicitudAsignada): Observable<ContactoTelefonicoDto[]> {
    if (solicitud.esDemostracion) {
      return of(this.casosSimulados.listarContactosSolicitud(solicitud.id));
    }
    return this.solicitudesApi.listarContactos(solicitud.id);
  }

  registrarContacto(
    solicitud: SolicitudAsignada,
    datos: ContactoTelefonicoRequestDto
  ): Observable<ContactoTelefonicoDto> {
    if (solicitud.esDemostracion) {
      return of(this.casosSimulados.registrarContactoSolicitud(solicitud.id, datos));
    }
    return this.solicitudesApi.registrarContacto(solicitud.id, datos);
  }

  private resultadoDemostracion(
    page: number,
    size: number,
    solicitudId?: number
  ): ResultadoAsignaciones {
    const solicitudes = this.casosSimulados
      .listarSolicitudesAsignadas()
      .filter((solicitud) => solicitudId == null || solicitud.id === solicitudId)
      .map((solicitud) => ({ ...solicitud, esDemostracion: true }));
    const inicio = solicitudId == null ? page * size : 0;
    const pagina = solicitudId == null ? solicitudes.slice(inicio, inicio + size) : solicitudes;

    return {
      solicitudes: pagina,
      totalElementos: solicitudes.length,
      pagina: solicitudId == null ? page : 0,
      tamano: size,
      usaDemostracion: true
    };
  }
}
