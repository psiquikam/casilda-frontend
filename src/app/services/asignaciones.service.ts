import { Injectable, inject } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';

import { CasosSimuladosService } from './casos-simulados.service';
import { environment } from '../../environments/environment';
import {
  ContactoTelefonicoDto,
  ContactoTelefonicoRequestDto,
  SolicitudAcompanamientoResponse,
  SolicitudService,
  UltimaCitaDto
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
 * La bandeja es compartida por el equipo: ambas pantallas consultan las
 * solicitudes asignadas sin filtrarlas por profesional.
 * Los casos ficticios solo se usan cuando la configuración activa explícitamente
 * el modo de demostración; en producción las respuestas vacías y los errores
 * del API se conservan.
 */
@Injectable({ providedIn: 'root' })
export class AsignacionesService {
  private readonly solicitudesApi = inject(SolicitudService);
  private readonly casosSimulados = inject(CasosSimuladosService);

  listar(page: number, size: number): Observable<ResultadoAsignaciones> {
    if (environment.datosDemostracion) {
      return of(this.resultadoDemostracion(page, size));
    }

    return this.solicitudesApi
      .listarPaginadas(page, size, ESTADO_SOLICITUD_ASIGNADA)
      .pipe(
        map((respuesta) => ({
          solicitudes: respuesta.content.map((solicitud) => ({
            ...solicitud,
            esDemostracion: false
          })),
          totalElementos: respuesta.totalElements,
          pagina: respuesta.number,
          tamano: respuesta.size,
          usaDemostracion: false
        }))
      );
  }

  obtener(referencia: string, size: number): Observable<ResultadoAsignaciones> {
    if (environment.datosDemostracion && referencia.startsWith(PREFIJO_REFERENCIA_DEMO)) {
      const id = Number(referencia.slice(PREFIJO_REFERENCIA_DEMO.length));
      return of(this.resultadoDemostracion(0, size, id));
    }

    const id = Number(referencia);
    if (!Number.isInteger(id) || id <= 0) {
      return throwError(() => new Error('La solicitud seleccionada no tiene un identificador válido.'));
    }

    return this.solicitudesApi.obtenerPorId(id).pipe(
      map((solicitud) => ({
        solicitudes: [{ ...solicitud, esDemostracion: false }],
        totalElementos: 1,
        pagina: 0,
        tamano: size,
        usaDemostracion: false
      }))
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

  obtenerUltimaCita(solicitud: SolicitudAsignada): Observable<UltimaCitaDto> {
    if (solicitud.esDemostracion) {
      const cita = this.casosSimulados.obtenerUltimaCitaSolicitud(solicitud.id);
      return of({
        fechaCita: cita?.fechaCita ?? null,
        estadoCita: cita?.estadoCita ?? null,
        tieneCitaProgramada: this.casosSimulados.tieneCitaProgramada(solicitud.id)
      });
    }
    return this.solicitudesApi.obtenerUltimaCita(solicitud.id);
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
