import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * Contenido editable que alimenta las tarjetas de opción del Home.
 *
 * Lo administra el perfil **gestor de contenidos** desde su panel: por eso el
 * componente no conoce textos ni imágenes, solo renderiza lo que llega.
 */
export interface ContenidoDestacadoDto {
  id: number;
  /** URL de la imagen principal de la tarjeta. */
  imagen: string;
  titulo: string;
  contenido: string;
  /** Inicio de vigencia (ISO 8601). */
  vigenciaInicio: string;
  /** Fin de vigencia (ISO 8601). `null` = sin fecha de expiración. */
  vigenciaFin: string | null;
  /**
   * Ruta interna a la que dirige la tarjeta. Extensión pendiente de confirmar
   * con backend; si llega vacía la tarjeta se muestra como informativa.
   */
  enlace?: string | null;
  /** Bloque del home donde se ubica la tarjeta. */
  seccion: 'acciones' | 'informacion';
}

/**
 * Contenido de referencia mientras el backend expone el endpoint real.
 * Reproduce las opciones vigentes del home para poder emular el servicio.
 * ÚNICO punto a eliminar cuando `GET /contenidos/home` esté disponible.
 */
const CONTENIDO_MOCK: readonly ContenidoDestacadoDto[] = [
  {
    id: 1,
    imagen: 'assets/uad_equipo_3_y_4.svg',
    titulo: 'Registrar queja disciplinaria (UAD 3 y 4)',
    contenido: 'Registra formalmente una queja ante la Unidad de Asuntos Disciplinarios. Tu relato se maneja bajo reserva.',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    enlace: '/formulario-anonimo',
    seccion: 'acciones'
  },
  {
    id: 2,
    imagen: 'assets/equipo_atencion.svg',
    titulo: 'Solicitud al equipo de atención VBG',
    contenido: 'Contacta al equipo especializado para recibir orientación y acompañamiento psicosocial y jurídico.',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    enlace: '/formulario-anonimo',
    seccion: 'acciones'
  },
  {
    id: 3,
    imagen: 'assets/linea_alma.svg',
    titulo: 'Atención por Línea Alma',
    contenido: 'Línea de escucha y apoyo psicológico inmediato de la Universidad de Antioquia.',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    enlace: null,
    seccion: 'acciones'
  },
  {
    id: 4,
    imagen: 'assets/seguridad_bienes_y_servicios.svg',
    titulo: 'Atención por seguridad a personas y bienes',
    contenido: 'Reporta incidentes que requieran respuesta de seguridad inmediata dentro del campus.',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    enlace: null,
    seccion: 'acciones'
  },
  {
    id: 5,
    imagen: 'assets/reportes_informes_indicadores.svg',
    titulo: 'Indicadores internos',
    contenido: 'Consulta los datos y métricas que el sistema Casilda consolida sobre la atención institucional.',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    enlace: null,
    seccion: 'informacion'
  },
  {
    id: 6,
    imagen: 'assets/estadisticas-vbg.svg',
    titulo: 'Estadísticas en VBG',
    contenido: 'Informes sobre la situación de las violencias basadas en género en la Universidad.',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    enlace: null,
    seccion: 'informacion'
  },
  {
    id: 7,
    imagen: 'assets/distintivo_casilda.svg',
    titulo: '¿Quién es Casilda?',
    contenido: 'Es el sistema de vigilancia en salud pública de la UdeA para el abordaje de las violencias y discriminaciones basadas en género. Centraliza la información para prevenir, atender y proteger.',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    enlace: null,
    seccion: 'informacion'
  }
];

/** Indica si un contenido está vigente en la fecha dada. */
export function estaVigente(contenido: ContenidoDestacadoDto, referencia: Date = new Date()): boolean {
  const inicio = new Date(contenido.vigenciaInicio).getTime();
  if (Number.isNaN(inicio) || inicio > referencia.getTime()) return false;

  if (!contenido.vigenciaFin) return true;

  const fin = new Date(contenido.vigenciaFin).getTime();
  return Number.isNaN(fin) ? true : fin >= referencia.getTime();
}

@Injectable({ providedIn: 'root' })
export class ContenidoHomeService {
  /** Endpoint previsto para el panel del gestor de contenidos. */
  readonly endpoint = `${environment.apiBaseUrl}/contenidos/home`;

  /**
   * Contenido vigente del home.
   *
   * TODO(backend): reemplazar por `this.http.get<ContenidoDestacadoDto[]>(this.endpoint)`
   * cuando el endpoint del gestor de contenidos esté publicado. La firma del
   * método y el DTO no deben cambiar.
   */
  listarContenidoVigente(referencia: Date = new Date()): Observable<ContenidoDestacadoDto[]> {
    return of(CONTENIDO_MOCK.filter((contenido) => estaVigente(contenido, referencia)));
  }
}
