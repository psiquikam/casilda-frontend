import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { diasDesdeHoy, respuestaSimulada } from './dashboard-mock';

/**
 * Decisión provisional P-VBG-07: umbral de «seguimiento sin registro» para
 * marcarlo como pendiente. Sin respaldo normativo confirmado; cambiar solo
 * esta constante no requiere tocar el widget que la consume.
 */
const UMBRAL_DIAS_SIN_REGISTRO = 15;

/**
 * Lo accionable del panel: qué requiere atención hoy y a quién se atiende.
 *
 * **Mínima exposición de datos personales** (DSH-P6, DSH-08-02): estas listas
 * se ven a menudo en espacios compartidos, así que identifican a la persona por
 * radicado e iniciales, nunca por nombre completo. El detalle vive dentro del
 * expediente.
 */
export interface PendienteDto {
  readonly id: string;
  /** Radicado del caso. Es el identificador que se muestra. */
  readonly radicado: string;
  /** Iniciales de la persona atendida. Nunca el nombre completo. */
  readonly iniciales: string;
  readonly descripcion: string;
  /** Fecha de cumplimiento o de vencimiento, en ISO 8601. */
  readonly vence: string;
  readonly ruta: string;
  /**
   * `true` si quien consulta es la última profesional activa en el caso.
   *
   * Mismo concepto que calcula `esUltimaProfesionalActiva()`
   * (`core/vbg/ultima-profesional-activa.ts`) al cerrar un seguimiento en
   * `SeccionSeguimientosComponent` (VBG-08-13), pero aquí es un valor de
   * mock agregado entre casos, no el resultado de esa función: el panel no
   * tiene todavía los seguimientos reales de cada caso para calcularlo. Se
   * señala **de forma sutil** (DSH-08-03): es un aviso, no una urgencia, y
   * no se pinta en rojo.
   */
  readonly ultimaProfesionalActiva?: boolean;
}

export interface CitaAgendaDto {
  readonly id: string;
  /** Hora de inicio, en ISO 8601. La formatea `DatePipe`, no el mock. */
  readonly inicio: string;
  readonly radicado: string;
  readonly iniciales: string;
  readonly tipo: string;
  readonly modalidad: 'Presencial' | 'Virtual';
  readonly ruta: string;
}

const PENDIENTES_POR_ROL: Record<string, readonly PendienteDto[]> = {
  ADMIN: [
    {
      id: 'p-adm-1',
      radicado: '—',
      iniciales: '—',
      descripcion: '3 cuentas creadas sin rol asignado',
      vence: diasDesdeHoy(0).toISOString(),
      ruta: '/gestion-usuarios'
    },
    {
      id: 'p-adm-2',
      radicado: '—',
      iniciales: '—',
      descripcion: '2 catálogos de Maestros del Sistema con elementos incompletos',
      vence: diasDesdeHoy(2).toISOString(),
      ruta: '/gestion-sistema'
    }
  ],
  COORDINADOR: [
    {
      id: 'p-coo-1',
      radicado: 'CAS-2026-214',
      iniciales: 'M. R.',
      descripcion: 'Solicitud sin asignar hace 3 días',
      vence: diasDesdeHoy(-3).toISOString(),
      ruta: '/consulta'
    },
    {
      id: 'p-coo-2',
      radicado: 'CAS-2026-219',
      iniciales: 'J. P.',
      descripcion: 'Triaje de riesgo alto sin profesional responsable',
      vence: diasDesdeHoy(0).toISOString(),
      ruta: '/consulta'
    },
    {
      id: 'p-coo-3',
      radicado: 'CAS-2026-221',
      iniciales: 'L. G.',
      descripcion: 'Dos intentos de contacto sin respuesta',
      vence: diasDesdeHoy(1).toISOString(),
      ruta: '/consulta'
    }
  ],
  PROFESIONAL: [
    {
      id: 'p-pro-1',
      radicado: 'CAS-2026-081',
      iniciales: 'V. M.',
      descripcion: 'Compromiso vencido: remisión a Bienestar Universitario',
      vence: diasDesdeHoy(-2).toISOString(),
      ruta: '/registro-atencion'
    },
    {
      id: 'p-pro-2',
      radicado: 'CAS-2026-145',
      iniciales: 'A. T.',
      descripcion: `Seguimiento sin registro en los últimos ${UMBRAL_DIAS_SIN_REGISTRO} días`,
      vence: diasDesdeHoy(1).toISOString(),
      ruta: '/registro-atencion',
      ultimaProfesionalActiva: true
    },
    {
      id: 'p-pro-3',
      radicado: 'CAS-2026-203',
      iniciales: 'S. C.',
      descripcion: 'Solicitud asignada sin primer contacto',
      vence: diasDesdeHoy(3).toISOString(),
      ruta: '/consulta'
    }
  ],
  REVISOR: [
    {
      id: 'p-rev-1',
      radicado: 'CAS-2026-112',
      iniciales: 'D. O.',
      descripcion: 'Expediente con campos obligatorios vacíos',
      vence: diasDesdeHoy(1).toISOString(),
      ruta: '/consulta'
    },
    {
      id: 'p-rev-2',
      radicado: '—',
      iniciales: '—',
      descripcion: 'Reporte mensual de vigilancia programado',
      vence: diasDesdeHoy(5).toISOString(),
      ruta: '/dashboard-revisor'
    }
  ]
};

const AGENDA_MOCK: readonly CitaAgendaDto[] = [
  {
    id: 'c-1',
    inicio: diasDesdeHoy(0, 8, 30).toISOString(),
    radicado: 'CAS-2026-081',
    iniciales: 'V. M.',
    tipo: 'Psicológica',
    modalidad: 'Virtual',
    ruta: '/registro-atencion'
  },
  {
    id: 'c-2',
    inicio: diasDesdeHoy(0, 10, 0).toISOString(),
    radicado: 'CAS-2026-145',
    iniciales: 'A. T.',
    tipo: 'Psicosocial',
    modalidad: 'Presencial',
    ruta: '/registro-atencion'
  },
  {
    id: 'c-3',
    inicio: diasDesdeHoy(0, 14, 0).toISOString(),
    radicado: 'CAS-2026-203',
    iniciales: 'S. C.',
    tipo: 'Seguimiento',
    modalidad: 'Virtual',
    ruta: '/registro-atencion'
  },
  {
    id: 'c-4',
    inicio: diasDesdeHoy(0, 16, 0).toISOString(),
    radicado: 'CAS-2026-230',
    iniciales: 'R. H.',
    tipo: 'Primera vez',
    modalidad: 'Presencial',
    ruta: '/registro-atencion'
  }
];

@Injectable({ providedIn: 'root' })
export class DashboardTrabajoService {
  readonly endpointPendientes = `${environment.apiBaseUrl}/dashboard/pendientes`;
  readonly endpointAgenda = `${environment.apiBaseUrl}/dashboard/agenda-hoy`;

  /**
   * TODO(backend): `this.http.get<PendienteDto[]>(this.endpointPendientes)`.
   * El backend debe filtrar por la persona autenticada; el rol que se pasa aquí
   * solo sirve para elegir el mock.
   */
  obtenerPendientes(rol: string): Observable<readonly PendienteDto[]> {
    return respuestaSimulada(PENDIENTES_POR_ROL[rol] ?? []);
  }

  /** TODO(backend): `this.http.get<CitaAgendaDto[]>(this.endpointAgenda)`. */
  obtenerAgendaDeHoy(): Observable<readonly CitaAgendaDto[]> {
    return respuestaSimulada(AGENDA_MOCK);
  }
}
