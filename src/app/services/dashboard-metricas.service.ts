import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { respuestaSimulada } from './dashboard-mock';

/**
 * Indicadores agregados del panel de inicio.
 *
 * Todo valor es **numérico**: el formato regional lo aplican los pipes sobre el
 * `LOCALE_ID` es-CO (DSH-02-06). Toda cifra declara su periodo y su fecha de
 * corte, y los porcentajes declaran su denominador (DSH-P3, DSH-02-01).
 */
export interface IndicadorDto {
  readonly id: string;
  readonly etiqueta: string;
  readonly valor: number;
  /** `true` si el valor va en el rango 0–1 y se muestra con `PercentPipe`. */
  readonly proporcion?: boolean;
  readonly unidad?: string;
  readonly comparador?: string;
  /** Qué mide y sobre qué. Se expone también a lectores de pantalla (DSH-11-01). */
  readonly definicion: string;
  /** Periodo al que corresponde la cifra. */
  readonly periodo: string;
  /** Denominador declarado cuando el indicador es una parte de un total. */
  readonly denominador?: { readonly valor: number; readonly etiqueta: string };
  readonly icono: string;
  /** Ruta a una vista filtrada coherente con la cifra, si existe (DSH-11-03). */
  readonly ruta?: string;
}

/** Una categoría de la distribución por identidad de género. */
export interface GrupoIdentidadDto {
  readonly etiqueta: string;
  readonly casos: number;
  /** Proporción sobre el total, en el rango 0–1. */
  readonly proporcion: number;
}

export interface MetricasPanelDto {
  /** Fecha y hora de corte de todas las cifras del bloque (DSH-02-05). */
  readonly corte: string;
  readonly indicadores: readonly IndicadorDto[];
}

export interface DistribucionIdentidadDto {
  readonly corte: string;
  readonly total: number;
  readonly grupos: readonly GrupoIdentidadDto[];
}

export interface CargaProfesionalDto {
  readonly profesional: string;
  readonly casos: number;
  readonly citasHoy: number;
  /** Ocupación en el rango 0–1. */
  readonly ocupacion: number;
  readonly nivel: 'bajo' | 'normal' | 'alto';
}

const CORTE_MOCK = new Date().toISOString();

const TOTAL_CASOS = 156;

/**
 * Mock coherente: los conteos cuadran con `TOTAL_CASOS` y las proporciones
 * corresponden a su denominador (DSH-12-06). Sin datos personales reales
 * (DSH-12-07).
 */
const INDICADORES_POR_ROL: Record<string, readonly IndicadorDto[]> = {
  ADMIN: [
    {
      id: 'casos-activos',
      etiqueta: 'Casos activos',
      valor: TOTAL_CASOS,
      definicion: 'Casos con al menos una actuación registrada y sin cierre formal.',
      periodo: 'Acumulado institucional',
      icono: 'folder_shared',
      ruta: '/consulta'
    },
    {
      id: 'sin-asignar',
      etiqueta: 'Solicitudes sin asignar',
      valor: 14,
      definicion: 'Solicitudes radicadas que aún no tienen profesional responsable.',
      periodo: 'A la fecha de corte',
      icono: 'inbox',
      ruta: '/consulta'
    },
    {
      id: 'usuarios-activos',
      etiqueta: 'Usuarios activos',
      valor: 38,
      definicion: 'Cuentas institucionales habilitadas para iniciar sesión.',
      periodo: 'A la fecha de corte',
      icono: 'manage_accounts',
      ruta: '/gestion-usuarios'
    },
    {
      id: 'en-recepcion',
      etiqueta: 'En recepción',
      valor: 48,
      definicion: 'Casos pendientes de valoración inicial.',
      periodo: 'A la fecha de corte',
      denominador: { valor: TOTAL_CASOS, etiqueta: 'del total de casos activos' },
      icono: 'pending_actions',
      ruta: '/consulta'
    }
  ],
  COORDINADOR: [
    {
      id: 'sin-asignar',
      etiqueta: 'Pendientes de asignación',
      valor: 14,
      definicion: 'Solicitudes radicadas que aún no tienen profesional responsable.',
      periodo: 'A la fecha de corte',
      icono: 'inbox',
      ruta: '/consulta'
    },
    {
      id: 'triaje-alto',
      etiqueta: 'Triaje prioritario',
      valor: 8,
      definicion: 'Solicitudes con riesgo alto detectado en la valoración inicial.',
      periodo: 'A la fecha de corte',
      icono: 'priority_high',
      ruta: '/consulta'
    },
    {
      id: 'casos-equipo',
      etiqueta: 'Casos del equipo',
      valor: TOTAL_CASOS,
      definicion: 'Casos activos a cargo del equipo de atención.',
      periodo: 'Acumulado institucional',
      icono: 'groups',
      ruta: '/consulta'
    },
    {
      id: 'citas-semana',
      etiqueta: 'Citas de la semana',
      valor: 52,
      definicion: 'Atenciones agendadas por el equipo.',
      periodo: 'Semana en curso',
      icono: 'calendar_month',
      ruta: '/cita'
    }
  ],
  PROFESIONAL: [
    {
      id: 'mis-casos',
      etiqueta: 'Mis casos activos',
      valor: 12,
      definicion: 'Casos asignados a tu cuenta y sin cierre formal.',
      periodo: 'A la fecha de corte',
      icono: 'folder_shared',
      ruta: '/mis-asignaciones'
    },
    {
      id: 'citas-hoy',
      etiqueta: 'Mis citas de hoy',
      valor: 4,
      definicion: 'Atenciones agendadas en tu agenda para hoy.',
      periodo: 'Hoy',
      icono: 'event_available',
      ruta: '/cita'
    },
    {
      id: 'compromisos-7-dias',
      etiqueta: 'Compromisos a 7 días',
      valor: 5,
      definicion: 'Compromisos con fecha de cumplimiento dentro de los próximos 7 días.',
      periodo: 'Próximos 7 días',
      icono: 'task_alt',
      ruta: '/mis-asignaciones'
    },
    {
      id: 'notas-pendientes',
      etiqueta: 'Atenciones por documentar',
      valor: 3,
      definicion: 'Atenciones realizadas cuya acta aún no se ha registrado.',
      periodo: 'A la fecha de corte',
      icono: 'edit_note',
      ruta: '/registro-atencion'
    }
  ],
  REVISOR: [
    {
      id: 'tiempo-respuesta',
      etiqueta: 'Tiempo de primer contacto',
      valor: 24,
      unidad: 'horas',
      comparador: 'menos de',
      definicion: 'Tiempo medio entre la radicación y el primer contacto efectivo.',
      periodo: 'Últimos 30 días',
      icono: 'speed'
    },
    {
      id: 'en-auditoria',
      etiqueta: 'Expedientes en auditoría',
      valor: 28,
      definicion: 'Expedientes bajo revisión de calidad.',
      periodo: 'A la fecha de corte',
      icono: 'fact_check',
      ruta: '/consulta'
    },
    {
      id: 'medidas',
      etiqueta: 'Medidas de protección',
      valor: 19,
      definicion: 'Medidas activadas y verificadas por el equipo.',
      periodo: 'Últimos 30 días',
      icono: 'verified_user'
    },
    {
      id: 'cumplimiento',
      etiqueta: 'Tasa de cumplimiento',
      valor: 0.96,
      proporcion: true,
      definicion: 'Acuerdos protocolizados sobre el total de acuerdos registrados.',
      periodo: 'Últimos 30 días',
      denominador: { valor: 184, etiqueta: 'acuerdos registrados' },
      icono: 'thumb_up'
    }
  ]
};

/**
 * **[PENDIENTE P-05]** Las categorías y etiquetas de identidad de género deben
 * alinearse con el catálogo oficial de Maestros del Sistema y con el enfoque
 * diferencial del equipo. Las de aquí son provisionales (DSH-03-02).
 */
const DISTRIBUCION_MOCK: DistribucionIdentidadDto = {
  corte: CORTE_MOCK,
  total: TOTAL_CASOS,
  grupos: [
    { etiqueta: 'Mujeres (Cis/Trans)', casos: 88, proporcion: 88 / TOTAL_CASOS },
    { etiqueta: 'Hombres (Cis/Trans)', casos: 36, proporcion: 36 / TOTAL_CASOS },
    { etiqueta: 'Personas No Binarias', casos: 24, proporcion: 24 / TOTAL_CASOS },
    { etiqueta: 'Disidencias / Otras', casos: 8, proporcion: 8 / TOTAL_CASOS }
  ]
};

const CARGA_EQUIPO_MOCK: readonly CargaProfesionalDto[] = [
  { profesional: 'Lic. Carlos Restrepo (Psicología)', casos: 12, citasHoy: 4, ocupacion: 0.8, nivel: 'normal' },
  { profesional: 'Dra. María Carmona (Derecho)', casos: 15, citasHoy: 5, ocupacion: 0.95, nivel: 'alto' },
  { profesional: 'Psic. Laura Valencia (Línea ALMA)', casos: 11, citasHoy: 3, ocupacion: 0.7, nivel: 'normal' },
  { profesional: 'Dupla Psicosocial 1 (Territorial)', casos: 8, citasHoy: 2, ocupacion: 0.55, nivel: 'bajo' }
];

@Injectable({ providedIn: 'root' })
export class DashboardMetricasService {
  readonly endpointIndicadores = `${environment.apiBaseUrl}/dashboard/indicadores`;
  readonly endpointDistribucion = `${environment.apiBaseUrl}/dashboard/distribucion-identidad`;
  readonly endpointCargaEquipo = `${environment.apiBaseUrl}/dashboard/carga-equipo`;

  /**
   * TODO(backend): `this.http.get<MetricasPanelDto>(this.endpointIndicadores, { params: { rol } })`.
   * La firma y el DTO no deben cambiar.
   */
  obtenerIndicadores(rol: string): Observable<MetricasPanelDto> {
    return respuestaSimulada({
      corte: CORTE_MOCK,
      indicadores: INDICADORES_POR_ROL[rol] ?? []
    });
  }

  /** TODO(backend): `this.http.get<DistribucionIdentidadDto>(this.endpointDistribucion)`. */
  obtenerDistribucionIdentidad(): Observable<DistribucionIdentidadDto> {
    return respuestaSimulada(DISTRIBUCION_MOCK);
  }

  /** TODO(backend): `this.http.get<CargaProfesionalDto[]>(this.endpointCargaEquipo)`. */
  obtenerCargaEquipo(): Observable<readonly CargaProfesionalDto[]> {
    return respuestaSimulada(CARGA_EQUIPO_MOCK);
  }
}
