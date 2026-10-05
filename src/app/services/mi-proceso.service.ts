import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { diasDesdeHoy, respuestaSimulada } from './dashboard-mock';

/**
 * Lo que la persona que solicita acompañamiento ve de **su propio proceso**.
 *
 * Este servicio no expone nada de la operación interna: ni grupo de atención,
 * ni apreciaciones profesionales, ni rutas internas, ni datos de quien ejerció
 * la violencia (DSH-10-10). Tampoco cifras institucionales (DSH-10-08).
 *
 * El vocabulario de los DTO sigue la guía de lenguaje del §5.3: «solicitud» y
 * «proceso», nunca «caso», «expediente» ni «radicado».
 */

/** Etapa del acompañamiento, en lenguaje de la persona, no del sistema. */
export interface EstadoProcesoDto {
  readonly id: string;
  /** Dónde va el proceso. Frase corta y en segunda persona. */
  readonly resumen: string;
  /** Qué sigue y **quién** lo hace: reduce la incertidumbre (DSH-10-01). */
  readonly siguientePaso: string;
  readonly loHace: 'El equipo de Casilda' | 'Tú, cuando quieras';
  /**
   * Plazo comunicable.
   *
   * **[PENDIENTE P-13]** Mientras el equipo no confirme los tiempos de
   * respuesta oficiales, va en `null` y la interfaz **no promete ninguna
   * fecha**: una promesa incumplida a alguien que espera ayuda hace más daño
   * que la ausencia de plazo (DSH-10-01).
   */
  readonly plazo: string | null;
}

export interface ProximaCitaDto {
  /** Inicio en ISO 8601. La formatea `DatePipe`, no el mock. */
  readonly inicio: string;
  readonly modalidad: 'Presencial' | 'Virtual';
  /** Dónde o cómo. Sin códigos internos. */
  readonly lugar: string;
  /** Nombre de quien acompaña, tal como se le presentó a la persona. */
  readonly acompanaA: string;
}

/** Compromiso que la persona decidió asumir. Nunca una tarea impuesta. */
export interface CompromisoDto {
  readonly id: string;
  readonly descripcion: string;
  /** Fecha acordada, en ISO 8601. `null` si no se acordó ninguna. */
  readonly fechaAcordada: string | null;
  readonly cumplido: boolean;
}

/** Canal que la persona eligió para que la contacten (DSH-10-06). */
export interface PreferenciasContactoDto {
  readonly canal: 'Llamada' | 'Mensaje de texto' | 'Correo electrónico';
  readonly franjaHoraria: string;
  readonly sePuedeDejarMensaje: boolean;
}

export interface MiProcesoDto {
  readonly estado: EstadoProcesoDto;
  readonly proximaCita: ProximaCitaDto | null;
  readonly compromisos: readonly CompromisoDto[];
  readonly preferencias: PreferenciasContactoDto;
}

const MOCK: MiProcesoDto = {
  estado: {
    id: 'en-acompanamiento',
    resumen: 'Tu solicitud fue recibida y ya tienes acompañamiento en curso.',
    siguientePaso: 'Nos vemos en la próxima sesión que acordamos contigo.',
    loHace: 'El equipo de Casilda',
    plazo: null
  },
  proximaCita: {
    inicio: diasDesdeHoy(3, 10, 0).toISOString(),
    modalidad: 'Presencial',
    lugar: 'Oficina de Casilda, Ciudad Universitaria',
    acompanaA: 'Carlos Restrepo'
  },
  compromisos: [
    {
      id: 'c-1',
      descripcion: 'Escribir lo que quieras contar en la próxima sesión, si te sirve llevarlo anotado.',
      fechaAcordada: null,
      cumplido: false
    },
    {
      id: 'c-2',
      descripcion: 'Guardar el contacto de la persona que te acompaña en tu teléfono.',
      fechaAcordada: diasDesdeHoy(5).toISOString(),
      cumplido: true
    }
  ],
  preferencias: {
    canal: 'Mensaje de texto',
    franjaHoraria: 'Entre semana, por la tarde',
    sePuedeDejarMensaje: false
  }
};

@Injectable({ providedIn: 'root' })
export class MiProcesoService {
  readonly endpoint = `${environment.apiBaseUrl}/mi-proceso`;

  /**
   * TODO(backend): `this.http.get<MiProcesoDto>(this.endpoint)`.
   *
   * El backend debe resolver la persona desde el token, nunca desde un
   * identificador en la URL: este contenido es el más sensible del sistema.
   */
  obtenerMiProceso(): Observable<MiProcesoDto> {
    return respuestaSimulada(MOCK);
  }
}
