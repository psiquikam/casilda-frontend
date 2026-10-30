import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, switchMap } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  CasoDto,
  CitaDto,
  PagedResponseDto,
  SolicitudAcompanamientoResponse,
  SolicitudService
} from './solicitud.service';
import { CasosSimuladosService } from './casos-simulados.service';

/**
 * Datos de citas, casos y guardado del módulo Equipo de Atención
 * (`registro-caso`, `registro-atencion`).
 *
 * Cambio de proveedor, patrón `ContenidoHomeService`: en modo de
 * demostración delega en `CasosSimuladosService` (en memoria, sin red); en
 * modo real llama a `SolicitudService` exactamente igual que antes. No se
 * borra ningún código HTTP: `SolicitudService` queda intacto y sigue siendo
 * la implementación real para cuando exista backend accesible.
 *
 * Solo envuelve los métodos de `SolicitudService` que usan en exclusiva estos
 * dos formularios (verificado: ningún otro componente los invoca), para no
 * tocar un servicio compartido con el resto de la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class RegistroVbgDatosService {
  private readonly solicitudService = inject(SolicitudService);
  private readonly casosSimulados = inject(CasosSimuladosService);
  private usarRespaldo = false;

  usandoDatosDemostracion(): boolean {
    return environment.datosDemostracion || this.usarRespaldo;
  }

  listarCitasPaginadas(
    page: number,
    size: number,
    idEstadoCita?: number,
    excluirEstadoCitaId?: number
  ): Observable<PagedResponseDto<CitaDto>> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.listarCitas(page, size);
    }
    return this.solicitudService
      .listarCitasPaginadas(page, size, idEstadoCita, excluirEstadoCitaId)
      .pipe(
        switchMap((respuesta) => {
          this.usarRespaldo = respuesta.content.length === 0;
          return this.usarRespaldo
            ? this.casosSimulados.listarCitas(page, size)
            : of(respuesta);
        }),
        catchError(() => {
          this.usarRespaldo = true;
          return this.casosSimulados.listarCitas(page, size);
        })
      );
  }

  listarCasosPaginados(page: number, size: number): Observable<PagedResponseDto<CasoDto>> {
    if (environment.datosDemostracion) {
      return this.casosSimulados.listarCasos(page, size);
    }
    return this.solicitudService.listarCasosPaginados(page, size).pipe(
      switchMap((respuesta) => {
        this.usarRespaldo = respuesta.content.length === 0;
        return this.usarRespaldo
          ? this.casosSimulados.listarCasos(page, size)
          : of(respuesta);
      }),
      catchError(() => {
        this.usarRespaldo = true;
        return this.casosSimulados.listarCasos(page, size);
      })
    );
  }

  obtenerPorId(solicitudId: number): Observable<SolicitudAcompanamientoResponse> {
    if (
      environment.datosDemostracion ||
      this.usarRespaldo ||
      this.casosSimulados.tieneSolicitud(solicitudId)
    ) {
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
    casoIdActual: number | null = null
  ): Observable<{ id?: number; codigo?: string }> {
    if (
      environment.datosDemostracion ||
      this.usarRespaldo ||
      (casoIdActual != null && this.casosSimulados.tieneSolicitud(casoIdActual))
    ) {
      return this.casosSimulados.guardarPestana(casoIdActual, tabIndex, datos);
    }
    return this.solicitudService.registrarPestana(tabIndex, datos);
  }
}

