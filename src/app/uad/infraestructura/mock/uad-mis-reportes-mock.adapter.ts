import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { MiReporteDetalle, MiReporteResumen, Pagina } from '../../contratos/uad-api.types';
import { UadMisReportesPort } from '../../contratos/uad-mis-reportes.port';
import { estadoParaReportante, validarRespuestaSolicitud } from '../../dominio/mis-reportes';
import { interpretarErrorUad } from '../uad-error';
import { UAD_MOCK_LATENCIA_MS } from './uad-mock.adapter';
import { NoticiaMock } from './uad-mock-seed';
import { UadMockStore } from './uad-mock-store';

/**
 * Código de reporte sintético de una noticia sembrada (`NDI-2026-000145` → `CAS-DEMO-000145`). El servidor
 * real entrega el `CAS-…` que la persona recibió al radicar.
 */
export function codigoReporteMock(consecutivo: string): string {
  return `CAS-DEMO-${consecutivo.slice(-6)}`;
}

/**
 * «Mis reportes» simulado. Comparte el store con las bandejas UAD: lo que la UAD solicita en la evaluación
 * aparece aquí, y la respuesta dada aquí aparece en la evaluación.
 *
 * **Dueño simulado:** el mock no tiene usuarios, así que trata como «propias» las NDI del formulario web con
 * reportante identificado. Las NDA y las remitidas por otro actor nunca aparecen, igual que en el servidor.
 * Aplica las reglas de `UadMisReportesService` del backend.
 */
@Injectable()
export class UadMisReportesMockAdapter extends UadMisReportesPort {
  private readonly store = inject(UadMockStore);
  private readonly latencia = inject(UAD_MOCK_LATENCIA_MS);

  listar(page: number, size: number): Observable<Pagina<MiReporteResumen>> {
    return this.servir(() => {
      const propias = this.propias().sort((a, b) => b.fechaRecepcion.localeCompare(a.fechaRecepcion));
      const tamano = Math.max(size, 1);
      const pagina = Math.max(page, 0);
      const content = propias.slice(pagina * tamano, pagina * tamano + tamano).map((n) => this.resumen(n));
      return { content, totalElements: propias.length, totalPages: Math.ceil(propias.length / tamano), number: pagina, size: tamano };
    });
  }

  obtener(codigo: string): Observable<MiReporteDetalle> {
    return this.servir(() => this.detalle(this.propia(codigo)));
  }

  responder(codigo: string, solicitudId: string, respuesta: string): Observable<MiReporteDetalle> {
    return this.servir(() => {
      const n = this.propia(codigo);
      const s = n.solicitudInformacion;
      if (!s || s.solicitudId !== solicitudId) throw this.error(404, 'No encontrado.', 'NO_ENCONTRADO');
      const invalido = validarRespuestaSolicitud(respuesta);
      if (invalido) throw this.error(400, 'Revise los datos marcados.', 'VALIDACION', { respuesta: invalido });
      if (s.respondida) throw this.error(409, 'Esta solicitud ya fue respondida.', 'SOLICITUD_YA_RESPONDIDA');
      if (n.estado !== 'PENDIENTE_SUBSANACION') throw this.error(409, 'Esta solicitud ya no está pendiente de respuesta.', 'SOLICITUD_NO_VIGENTE');

      // Responder vencida está permitido: el vencimiento no cierra la noticia (UAD-EVA-05).
      n.solicitudInformacion = { ...s, respondida: true, vencida: false, respuesta: respuesta.trim(), fechaRespuesta: new Date().toISOString() };
      n.estado = 'SUBSANACION_RECIBIDA';
      n.version += 1;
      this.store.registrarEvento(n.noticiaId, 'SUBSANACION_RECIBIDA', 'El reportante respondió la solicitud de información.', {
        estadoAnterior: 'PENDIENTE_SUBSANACION',
        estadoNuevo: 'SUBSANACION_RECIBIDA'
      });
      return this.detalle(n);
    });
  }

  // ------------------------------------------------------------------ apoyo

  private propias(): NoticiaMock[] {
    return this.store.noticias.filter((n) => n.tipo === 'NDI' && n.origen.tipo === 'FORMULARIO_WEB_CASILDA' && n.reportante !== null);
  }

  /** 404 si no existe o no es propio: no se revela cuál de los dos. */
  private propia(codigo: string): NoticiaMock {
    const n = this.propias().find((x) => codigoReporteMock(x.consecutivo) === codigo.trim());
    if (!n) throw this.error(404, 'No encontrado.', 'NO_ENCONTRADO');
    return n;
  }

  private resumen(n: NoticiaMock): MiReporteResumen {
    const s = n.solicitudInformacion;
    return {
      codigo: codigoReporteMock(n.consecutivo),
      consecutivo: n.consecutivo,
      actor: 'UAD',
      estado: estadoParaReportante(n.estado),
      fechaRegistro: n.fechaRecepcion,
      // Solo lo que la persona ya conoce: cuándo le pidieron información o cuándo respondió.
      fechaUltimaActuacion: s ? (s.fechaRespuesta ?? s.fechaSolicitud) : null,
      solicitudPendiente: !!s && !s.respondida && n.estado === 'PENDIENTE_SUBSANACION'
    };
  }

  private detalle(n: NoticiaMock): MiReporteDetalle {
    return { ...this.resumen(n), solicitudInformacion: n.solicitudInformacion ? { ...n.solicitudInformacion } : null };
  }

  private error(estado: number, message: string, codigo: string, validationErrors?: Record<string, string>): HttpErrorResponse {
    return new HttpErrorResponse({ status: estado, error: { status: estado, error: String(estado), message, codigo, validationErrors } });
  }

  private servir<T>(manejador: () => T): Observable<T> {
    let salida: Observable<T>;
    try {
      salida = of(manejador());
    } catch (e) {
      salida = throwError(() => interpretarErrorUad(e));
    }
    return this.latencia > 0 ? salida.pipe(delay(this.latencia)) : salida;
  }
}
