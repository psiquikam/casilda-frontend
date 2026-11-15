import { Injectable, inject, signal } from '@angular/core';
import { CasoAsociado, EquipoUad, EventoHistorial, TipoEventoHistorial } from '../../contratos/uad-api.types';
import { CasoUadMock, NoticiaMock, sembrarCasosPorPersona, sembrarCasosUad, sembrarNoticias } from './uad-mock-seed';

/**
 * Estado en memoria del «servidor» simulado UAD. Vive mientras viva el inyector de las rutas UAD
 * (se reinicia al recargar la página). **No** escribe en `localStorage`/`sessionStorage`: los datos,
 * aunque ficticios, tienen forma de información reservada.
 */
@Injectable()
export class UadMockStore {
  noticias: NoticiaMock[] = sembrarNoticias();
  casosPorPersona: Map<string, CasoAsociado[]> = sembrarCasosPorPersona();
  casosUad: CasoUadMock[] = sembrarCasosUad();
  historial = new Map<string, EventoHistorial[]>();
  /** Últimos `casoId` devueltos por la consulta de casos asociados, por noticia (para validar vínculos). */
  casosConsultados = new Map<string, string[]>();
  private secuenciaCaso = 700;
  private secuenciaEvento = 1;

  constructor() {
    for (const n of this.noticias) {
      this.registrarEvento(n.noticiaId, 'NOTICIA_RECIBIDA', `Se registró la noticia ${n.consecutivo}.`, {
        fecha: n.fechaRecepcion,
        estadoNuevo: 'RECIBIDA'
      });
    }
  }

  buscar(noticiaId: string): NoticiaMock | undefined {
    return this.noticias.find((n) => n.noticiaId === noticiaId);
  }

  /** ID de caso CASILDA nuevo: lo asigna el «servidor», nunca la interfaz (UAD-ID-05). */
  siguienteCasoId(): string {
    return `CAS-2026-${String(this.secuenciaCaso++).padStart(6, '0')}`;
  }

  siguienteId(prefijo: string): string {
    return `${prefijo}-${this.secuenciaEvento++}`;
  }

  registrarEvento(
    noticiaId: string,
    tipo: TipoEventoHistorial,
    descripcion: string,
    extra: Partial<Pick<EventoHistorial, 'fecha' | 'profesional' | 'equipo' | 'estadoAnterior' | 'estadoNuevo' | 'observaciones'>> = {}
  ): void {
    const lista = this.historial.get(noticiaId) ?? [];
    // Append-only: nunca se reemplaza ni se borra un evento (UAD-HIS-02, UAD-NOT-12).
    lista.push({
      eventoId: this.siguienteId('ev'),
      tipo,
      fecha: extra.fecha ?? new Date().toISOString(),
      descripcion,
      profesional: extra.profesional ?? null,
      equipo: extra.equipo ?? null,
      fase: null,
      estadoAnterior: extra.estadoAnterior ?? null,
      estadoNuevo: extra.estadoNuevo ?? null,
      observaciones: extra.observaciones ?? null
    });
    this.historial.set(noticiaId, lista);
  }
}

/**
 * Controles de **demostración** del mock (no forman parte del puerto ni del contrato).
 * - `equipoSimulado`: equipo con el que actúa un usuario sin rol de equipo UAD (p. ej. ADMIN en
 *   despliegue controlado). El backend real nunca acepta el equipo desde el cliente.
 * - `fallarSiguiente`: fuerza el código HTTP de la próxima respuesta (estados de error de la UI).
 */
@Injectable()
export class UadSimulacionService {
  readonly equipoSimulado = signal<EquipoUad>('EQUIPO_3');
  readonly fallarSiguiente = signal<number | null>(null);
  private readonly store = inject(UadMockStore);

  /** Otra persona cambia la noticia: sube la versión. La próxima acción con la versión vieja recibe 409. */
  simularCambioConcurrente(noticiaId: string, equipo: EquipoUad): void {
    const n = this.store.buscar(noticiaId);
    if (!n) return;
    n.version += 1;
    n.revisionConcurrente = { desde: new Date().toISOString(), equipo };
    this.store.registrarEvento(noticiaId, 'ASIGNADA_EQUIPO', 'Otra persona abrió la evaluación de esta noticia (simulado).', {
      profesional: 'Profesional ficticio',
      equipo
    });
  }

  /** El reportante responde desde «Mis reportes» (Entrega 3): `PENDIENTE_SUBSANACION` → `SUBSANACION_RECIBIDA`. */
  simularRespuestaReportante(noticiaId: string): boolean {
    const n = this.store.buscar(noticiaId);
    if (!n || n.estado !== 'PENDIENTE_SUBSANACION' || !n.solicitudInformacion) return false;
    n.estado = 'SUBSANACION_RECIBIDA';
    n.version += 1;
    n.solicitudInformacion = { ...n.solicitudInformacion, respondida: true };
    this.store.registrarEvento(noticiaId, 'SUBSANACION_RECIBIDA', 'El reportante respondió la solicitud desde «Mis reportes» (simulado).', {
      estadoAnterior: 'PENDIENTE_SUBSANACION',
      estadoNuevo: 'SUBSANACION_RECIBIDA'
    });
    return true;
  }
}
