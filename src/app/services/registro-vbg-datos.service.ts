import { Injectable, inject } from '@angular/core';
import { map, Observable, of, switchMap } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  CasoDto,
  CancelarCitaRequestDto,
  CitaDto,
  PagedResponseDto,
  ReprogramarCitaRequestDto,
  ResultadoCitaDto,
  SolicitudAcompanamientoResponse,
  SolicitudService
} from './solicitud.service';
import { CasosSimuladosService } from './casos-simulados.service';
import type { MaestroDto } from './listas.service';

/**
 * Datos de citas, casos y guardado del módulo Equipo de Atención
 * (`registro-caso`, `registro-atencion`).
 *
 * Cambio de proveedor, patrón `ContenidoHomeService`: en modo de
 * demostración delega en `CasosSimuladosService` (en memoria, sin red); en
 * modo real llama a `SolicitudService`. El registro de atención traduce sus
 * pestañas visuales a los índices de endpoint propios del backend.
 *
 * Solo envuelve los métodos de `SolicitudService` que usan en exclusiva estos
 * dos formularios (verificado: ningún otro componente los invoca), para no
 * tocar un servicio compartido con el resto de la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class RegistroVbgDatosService {
  private readonly solicitudService = inject(SolicitudService);
  private readonly casosSimulados = inject(CasosSimuladosService);

  usandoDatosDemostracion(): boolean {
    return environment.datosDemostracion;
  }

  listarCitasPaginadas(
    page: number,
    size: number,
    idEstadoCita?: number,
    excluirEstadoCitaId?: number
  ): Observable<PagedResponseDto<CitaDto>> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.listarCitas(page, size, idEstadoCita, excluirEstadoCitaId);
    }
    return this.solicitudService.listarCitasPaginadas(page, size, idEstadoCita, excluirEstadoCitaId);
  }

  listarCitasPendientesDeCaso(page: number, size: number): Observable<PagedResponseDto<CitaDto>> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.listarCitasPendientesDeCaso(page, size);
    }
    return this.solicitudService.listarCitasPendientesDeCaso(page, size);
  }

  listarHistorialAtenciones(casoId: number): Observable<CitaDto[]> {
    if (environment.datosDemostracion) {
      return of(this.casosSimulados.listarCitasDeCaso(casoId));
    }

    return this.solicitudService.listarHistorialAtenciones(casoId);
  }

  listarCasosPaginados(page: number, size: number): Observable<PagedResponseDto<CasoDto>> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.listarCasos(page, size);
    }
    return this.solicitudService.listarCasosPaginados(page, size);
  }

  obtenerCasoPorId(casoId: number): Observable<CasoDto> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.listarCasos(0, 1000).pipe(
        map((respuesta) => {
          const caso = respuesta.content.find((item) => item.id === casoId);
          if (!caso) {
            throw new Error(`No se encontró el caso ${casoId}.`);
          }
          return caso;
        })
      );
    }
    return this.solicitudService.obtenerCasoPorId(casoId);
  }

  obtenerPorId(solicitudId: number): Observable<SolicitudAcompanamientoResponse> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.obtenerSolicitud(solicitudId);
    }
    return this.solicitudService.obtenerPorId(solicitudId);
  }

  /**
   * `datos` es el payload que arma cada formulario para su pestaña; su forma
   * varía por sección (compromisos, seguimientos, hechos…) y todavía no tiene
   * un tipo único en `SolicitudService`, de modo que se recibe como
   * `unknown` y se pasa sin interpretar.
   */
  registrarPestana(
    tabIndex: number,
    datos: unknown,
    casoIdActual: number | null = null,
    citaIdActual?: number
  ): Observable<{ id?: number; codigo?: string }> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.guardarPestana(casoIdActual, tabIndex, datos, citaIdActual);
    }
    return this.solicitudService.registrarPestana(tabIndex, datos);
  }

  registrarPestanaAtencion(
    tabIndex: number,
    datos: unknown,
    casoIdActual: number | null = null,
    citaIdActual?: number
  ): Observable<{ id?: number; codigo?: string } | null> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.guardarPestana(casoIdActual, tabIndex, datos, citaIdActual);
    }
    return this.solicitudService.registrarPestanaAtencion(tabIndex, datos);
  }

  registrarPrimeraAtencion(
    datos: { citaId: number; datosPersona: unknown; datosComplementarios: unknown },
    citaAtendida: boolean
  ): Observable<{ id?: number; casoId?: number; codigoCaso?: string }> {
    if (!environment.datosDemostracion) {
      return this.solicitudService.registrarPestana(5, datos);
    }

    const cita: Observable<unknown> = citaAtendida ? of(null) : this.casosSimulados.registrarResultadoCita(datos.citaId, 'ATENDIDA');
    return cita.pipe(
      switchMap(() => this.casosSimulados.guardarPestana(null, 0, datos.datosPersona, datos.citaId)),
      switchMap(caso => this.casosSimulados.guardarPestana(caso.id, 1, datos.datosComplementarios, datos.citaId).pipe(
        switchMap(() => this.casosSimulados.guardarPestana(caso.id, 5, datos, datos.citaId)),
        map(atencion => ({ id: atencion.id, casoId: caso.id, codigoCaso: caso.codigo }))
      ))
    );
  }

  registrarResultadoCita(id: number, resultado: ResultadoCitaDto): Observable<CitaDto> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.registrarResultadoCita(id, resultado);
    }
    return this.solicitudService.registrarResultadoCita(id, { resultado });
  }

  programarCitaSeguimiento(
    casoId: number,
    datos: { fechaCita: string; horaCita: string }
  ): Observable<CitaDto> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.programarCitaSeguimiento(casoId, datos.fechaCita, datos.horaCita);
    }
    return this.solicitudService.programarCitaSeguimiento(casoId, datos);
  }

  reprogramarCita(id: number, datos: ReprogramarCitaRequestDto): Observable<CitaDto> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.reprogramarCita(id, datos);
    }
    return this.solicitudService.reprogramarCita(id, datos);
  }

  cancelarCita(id: number, datos: CancelarCitaRequestDto): Observable<CitaDto> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.cancelarCita(id, datos);
    }
    return this.solicitudService.cancelarCita(id, datos);
  }

  listarMotivosEstadoCita(): Observable<MaestroDto[]> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.listarMotivosEstadoCita();
    }
    return this.solicitudService.listarMotivosEstadoCita();
  }
}
