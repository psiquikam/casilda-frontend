import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * Cuerpo de `POST {apiBaseUrl}/reportes` (`ReporteCasoRequest` del backend).
 * Contrato: `docs/contratos/contrato-reportar-caso.md` §3.1 y §4.1.
 * Los opcionales vacíos viajan como `null`, nunca como `""`.
 */
export interface ReporteCasoRequestDto {
  tipoDocumentoId: number | null;
  numeroDocumento: string | null;
  /** Solo fecha, `YYYY-MM-DD`, sin hora ni zona. */
  fechaNacimiento: string | null;
  tipoLugar: 'interno' | 'externo' | null;
  campusId: number | null;
  facultad: string | null;
  bloque: string | null;
  espacio: string | null;
  lugarDetalleExterno: string | null;
  descripcionHechos: string;
  rutaActivacionId: number;
}

/** Respuesta `201` de `POST /reportes`. El código CAS lo genera y persiste el servidor. */
export interface ReporteCasoResponseDto {
  id: number;
  codigo: string;
  fechaRegistro: string;
  rutaActivacion: {
    id: number;
    codigo: string | null;
    nombre: string;
    estado: 'SOLICITADA' | 'ACTIVA';
  };
}

/** Valores crudos de los controles del formulario que alimentan el DTO. */
export interface ValoresReporteFormulario {
  deseaDatosVictima: string | null | undefined;
  victima: {
    tipoDocumento?: number | null;
    identificacion?: string | null;
    fechaNacimiento?: Date | string | null;
  };
  relato: {
    tipoLugar?: string | null;
    sedeCampus?: number | string | null;
    facultad?: string | null;
    bloque?: string | null;
    espacio?: string | null;
    lugarDetalleExterno?: string | null;
    descripcionHechos?: string | null;
  };
  rutaActivacion: number | null | undefined;
}

/** Error de `POST /reportes` traducido para la persona usuaria. */
export interface ErrorReporteCaso {
  mensaje: string;
  /** Mensajes por campo del DTO (`validationErrors` del `400`). */
  campos: Record<string, string>;
}

/**
 * Crea reportes de caso desde el formulario multipaso, en modo anónimo o
 * autenticado. El endpoint es público: el modo lo decide el servidor por la
 * presencia de un JWT válido (lo adjunta `authInterceptor`), nunca un campo del cuerpo.
 */
@Injectable({ providedIn: 'root' })
export class ReporteCasoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/reportes`;

  crear(dto: ReporteCasoRequestDto): Observable<ReporteCasoResponseDto> {
    return this.http.post<ReporteCasoResponseDto>(this.apiUrl, dto);
  }
}

function texto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio.length ? limpio : null;
}

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/** `Date` → `YYYY-MM-DD` con la fecha local, para no desplazar el día por zona horaria. */
export function aFechaIso(valor: Date | string | null | undefined): string | null {
  if (!valor) return null;
  if (typeof valor === 'string') {
    return /^\d{4}-\d{2}-\d{2}/.test(valor) ? valor.slice(0, 10) : null;
  }
  if (Number.isNaN(valor.getTime())) return null;
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');
  return `${valor.getFullYear()}-${mes}-${dia}`;
}

/**
 * Mapea el formulario al DTO del contrato (§4.1 y reglas cruzadas del §5.3):
 * - Los datos de la víctima solo viajan si la persona eligió darlos.
 * - Solo se envían los campos del tipo de lugar elegido; los del otro tipo,
 *   que pueden quedar en el control tras cambiar de opción, van en `null`.
 * - `sedeCampus` se envía como `campusId`.
 */
export function construirReporteCasoRequest(valores: ValoresReporteFormulario): ReporteCasoRequestDto {
  const conVictima = valores.deseaDatosVictima === 'si';
  const relato = valores.relato;
  const tipoLugar = relato.tipoLugar === 'interno' || relato.tipoLugar === 'externo' ? relato.tipoLugar : null;
  const interno = tipoLugar === 'interno';

  return {
    tipoDocumentoId: conVictima ? numero(valores.victima.tipoDocumento) : null,
    numeroDocumento: conVictima ? texto(valores.victima.identificacion)?.toUpperCase() ?? null : null,
    fechaNacimiento: conVictima ? aFechaIso(valores.victima.fechaNacimiento) : null,
    tipoLugar,
    campusId: interno ? numero(relato.sedeCampus) : null,
    facultad: interno ? texto(relato.facultad) : null,
    bloque: interno ? texto(relato.bloque) : null,
    espacio: interno ? texto(relato.espacio) : null,
    lugarDetalleExterno: tipoLugar === 'externo' ? texto(relato.lugarDetalleExterno) : null,
    descripcionHechos: texto(relato.descripcionHechos) ?? '',
    rutaActivacionId: numero(valores.rutaActivacion) as number
  };
}

/** Traduce el error HTTP de `POST /reportes` (contrato §3.1 y §6). */
export function interpretarErrorReporte(error: unknown): ErrorReporteCaso {
  const http = error instanceof HttpErrorResponse ? error : null;
  const cuerpo = (http?.error ?? {}) as { message?: unknown; validationErrors?: unknown };
  const campos: Record<string, string> = {};

  switch (http?.status) {
    case 0:
      return { mensaje: 'No hay conexión con el servidor. Su reporte no se ha enviado. Verifique su conexión e intente de nuevo.', campos };
    case 401:
      return { mensaje: 'Su sesión expiró y el reporte no se envió. Inicie sesión de nuevo para enviarlo.', campos };
    case 429:
      return { mensaje: 'Se han enviado varios reportes en poco tiempo. Espere unos minutos e intente de nuevo.', campos };
    case 400: {
      if (cuerpo.validationErrors && typeof cuerpo.validationErrors === 'object') {
        for (const [campo, mensaje] of Object.entries(cuerpo.validationErrors as Record<string, unknown>)) {
          if (typeof mensaje === 'string') campos[campo] = mensaje;
        }
      }
      const mensajeServidor = typeof cuerpo.message === 'string' ? cuerpo.message : '';
      return {
        mensaje: Object.keys(campos).length
          ? 'Su reporte no se ha enviado. Revise los campos señalados e intente de nuevo.'
          : mensajeServidor || 'Su reporte no se ha enviado. Revise los datos e intente de nuevo.',
        campos
      };
    }
  }

  return { mensaje: 'No fue posible enviar su reporte. Intente de nuevo en unos minutos.', campos };
}
