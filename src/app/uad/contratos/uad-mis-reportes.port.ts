import { Observable } from 'rxjs';
import { MiReporteDetalle, MiReporteResumen, Pagina } from './uad-api.types';

/**
 * Puerto de «Mis reportes» (Entrega 3). Va separado de `UadApiPort` porque lo usa la persona que radicó
 * (rol `USUARIO`), fuera de las rutas `/uad` de los Equipos 3 y 4.
 *
 * ```text
 * MisReportesPage / MiReportePage → UadMisReportesPort
 *                                     ├─ UadMisReportesHttpAdapter  ({apiBaseUrl}/mis-reportes)
 *                                     └─ UadMisReportesMockAdapter  (mismo store que las bandejas UAD)
 * ```
 *
 * El dueño lo filtra **siempre el servidor**: un reporte ajeno responde 404.
 */
export abstract class UadMisReportesPort {
  /** `GET /mis-reportes` — listarMisReportes. Más recientes primero. */
  abstract listar(page: number, size: number): Observable<Pagina<MiReporteResumen>>;

  /** `GET /mis-reportes/{codigo}` — obtenerMiReporte. */
  abstract obtener(codigo: string): Observable<MiReporteDetalle>;

  /**
   * `POST /reportes/{codigo}/solicitudes-informacion/{solicitudId}/respuesta` — responderSolicitudInformacion.
   * Solo texto: el servidor rechaza archivos hasta aprobar la política de evidencias (D-UAD-09).
   */
  abstract responder(codigo: string, solicitudId: string, respuesta: string): Observable<MiReporteDetalle>;
}
