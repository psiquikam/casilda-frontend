import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { respuestaSimulada } from './dashboard-mock';
import {
  CeldaPublicable,
  hayCeldasSuprimidas,
  suprimirCeldasPequenas
} from '../core/vigilancia/supresion-celdas';

/**
 * Vigilancia epidemiológica con enfoque diferencial, para el perfil analítico
 * (§4.5 del contrato).
 *
 * Entrega **solo datos agregados y anonimizados**, y aplica supresión de celdas
 * pequeñas antes de devolverlos (DSH-09-01). El filtrado es justamente lo que
 * hace peligrosa esta vista: cruzar sede con dependencia reduce los conteos
 * hasta volverlos identificables.
 */
export interface OpcionFiltro {
  readonly id: string;
  readonly nombre: string;
}

export interface FiltrosVigilancia {
  readonly periodo: string;
  readonly sede: string;
  readonly dependencia: string;
}

export interface CatalogosVigilancia {
  readonly periodos: readonly OpcionFiltro[];
  readonly sedes: readonly OpcionFiltro[];
  readonly dependencias: readonly OpcionFiltro[];
}

export interface VigilanciaDto {
  readonly corte: string;
  /** Total de casos que cumplen el filtro. */
  readonly total: number;
  readonly grupos: readonly CeldaPublicable[];
  /** `true` si algún conteo se ocultó por ser demasiado pequeño. */
  readonly conSupresion: boolean;
}

export const FILTROS_POR_DEFECTO: FiltrosVigilancia = {
  periodo: 'ultimos-30',
  sede: 'todas',
  dependencia: 'todas'
};

const CATALOGOS: CatalogosVigilancia = {
  periodos: [
    { id: 'ultimos-30', nombre: 'Últimos 30 días' },
    { id: 'ultimos-90', nombre: 'Últimos 90 días' },
    { id: 'anio-actual', nombre: 'Año en curso' }
  ],
  // TODO(backend): estas listas deben venir de Maestros del Sistema, no del
  // frontend (regla 1 de `CLAUDE.md`). Se dejan aquí mientras no exista el
  // endpoint, igual que el resto de catálogos del panel.
  sedes: [
    { id: 'todas', nombre: 'Todas las sedes' },
    { id: 'medellin', nombre: 'Medellín' },
    { id: 'oriente', nombre: 'Oriente' },
    { id: 'urabá', nombre: 'Urabá' }
  ],
  dependencias: [
    { id: 'todas', nombre: 'Todas las dependencias' },
    { id: 'salud-publica', nombre: 'Facultad Nacional de Salud Pública' },
    { id: 'ingenieria', nombre: 'Facultad de Ingeniería' },
    { id: 'educacion', nombre: 'Facultad de Educación' }
  ]
};

/**
 * Conteos base por categoría. **[PENDIENTE P-05]**: las categorías deben
 * alinearse con el catálogo oficial de identidad de género (DSH-03-02).
 */
const BASE = [
  { etiqueta: 'Mujeres (Cis/Trans)', casos: 88 },
  { etiqueta: 'Hombres (Cis/Trans)', casos: 36 },
  { etiqueta: 'Personas No Binarias', casos: 24 },
  { etiqueta: 'Disidencias / Otras', casos: 8 }
];

/** Factor de reducción por filtro, para que el mock cambie de forma coherente. */
const FACTORES: Record<string, number> = {
  'ultimos-30': 1,
  'ultimos-90': 1.8,
  'anio-actual': 2.6,
  todas: 1,
  medellin: 0.62,
  oriente: 0.2,
  urabá: 0.18,
  'salud-publica': 0.34,
  ingenieria: 0.28,
  educacion: 0.22
};

@Injectable({ providedIn: 'root' })
export class VigilanciaService {
  readonly endpoint = `${environment.apiBaseUrl}/vigilancia/identidad-genero`;
  readonly endpointCatalogos = `${environment.apiBaseUrl}/vigilancia/catalogos`;

  /** TODO(backend): `this.http.get<CatalogosVigilancia>(this.endpointCatalogos)`. */
  obtenerCatalogos(): Observable<CatalogosVigilancia> {
    return respuestaSimulada(CATALOGOS);
  }

  /**
   * TODO(backend): `this.http.get<VigilanciaDto>(this.endpoint, { params })`.
   *
   * La supresión se aplica aquí a propósito: debe ocurrir **antes** de que el
   * dato salga del servicio, para que ninguna vista pueda publicar por descuido
   * un conteo identificable. Cuando exista backend, debe aplicarla él también:
   * ocultar en el frontend no es control de acceso (DSH-P2).
   */
  obtenerDistribucion(filtros: FiltrosVigilancia): Observable<VigilanciaDto> {
    const factor =
      (FACTORES[filtros.periodo] ?? 1) *
      (FACTORES[filtros.sede] ?? 1) *
      (FACTORES[filtros.dependencia] ?? 1);

    const crudos = BASE.map((grupo) => ({
      etiqueta: grupo.etiqueta,
      casos: Math.round(grupo.casos * factor)
    }));
    const total = crudos.reduce((suma, grupo) => suma + grupo.casos, 0);
    const grupos = suprimirCeldasPequenas(crudos, total);

    return respuestaSimulada({
      corte: new Date().toISOString(),
      total,
      grupos,
      conSupresion: hayCeldasSuprimidas(grupos)
    });
  }
}
