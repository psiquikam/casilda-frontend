import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PersonaSearchDto,
  SolicitudAcompanamientoRequest,
  SolicitudAcompanamientoResponse,
  SolicitudService
} from '../../services/solicitud.service';

const LATENCIA_MS = 300;

/** Documento ficticio que la búsqueda simulada sí encuentra. */
export const DOCUMENTO_SIMULADO = '1000000000';

/**
 * Radicación desde «Registro de solicitud» de SPyB. Con `environment.seguridadPyB.mocks.solicitudes`
 * simula la búsqueda, la creación y las evidencias **sin enviar nada**, mientras Backend no atienda el
 * contrato `docs/contratos/seguridad-personas-bienes/contrato-registro-solicitud-canal-virtual.md`.
 *
 * No usa un interceptor porque la ruta (`/solicitudes/acompanamiento`) es la misma del Equipo de
 * Atención, que sí va al backend real.
 */
@Injectable({ providedIn: 'root' })
export class SpybSolicitudService {
  private readonly solicitudes = inject(SolicitudService);
  private consecutivo = 0;

  get simulado(): boolean {
    return environment.seguridadPyB.mocks.solicitudes;
  }

  buscarPersonaPorDocumento(tipoDocumentoId: number, documento: string): Observable<PersonaSearchDto> {
    if (!this.simulado) return this.solicitudes.buscarPersonaPorDocumento(tipoDocumentoId, documento);

    if (documento !== DOCUMENTO_SIMULADO) {
      return throwError(() => new HttpErrorResponse({
        status: 404,
        error: { message: `No se encontró la persona. En la demostración use el documento ${DOCUMENTO_SIMULADO}.` }
      })).pipe(delay(LATENCIA_MS));
    }
    return of<PersonaSearchDto>({
      tipoDocumentoId,
      numeroDocumento: documento,
      fechaNacimiento: '2000-01-15',
      primerNombre: 'Persona',
      segundoNombre: null,
      primerApellido: 'De Prueba',
      segundoApellido: null,
      correos: [{ tipoId: 1, tipo: 'Personal', correo: 'persona@ejemplo.invalid' }],
      telefonos: [{ tipoId: 1, tipo: 'Celular', telefono: '3000000000' }]
    }).pipe(delay(LATENCIA_MS));
  }

  crearAcompanamiento(request: SolicitudAcompanamientoRequest): Observable<SolicitudAcompanamientoResponse> {
    if (!this.simulado) return this.solicitudes.crearAcompanamiento(request);

    this.consecutivo += 1;
    return of({
      id: this.consecutivo,
      codigo: `SOL-DEMO-${this.consecutivo}`,
      tipoSolicitud: request.tipoSolicitudId === 1 ? 'Directa' : 'Indirecta',
      estado: 'Sin asignar',
      fechaCreacion: new Date().toISOString()
    } as SolicitudAcompanamientoResponse).pipe(delay(LATENCIA_MS));
  }

  subirEvidencias(id: number, archivos: File[]): Observable<unknown[]> {
    if (!this.simulado) return this.solicitudes.subirEvidencias(id, archivos);
    return of(archivos.map((archivo) => ({ nombre: archivo.name }))).pipe(delay(LATENCIA_MS));
  }
}
