import { Injectable } from '@angular/core';
import { ContactoTelefonicoDto, ContactoTelefonicoRequestDto } from './solicitud.service';

export type EstadoContactoMock = 'Desistido' | 'En espera de cita';

export interface SolicitudContactoMock {
  id: number;
  codigo: string;
  fechaAsignacion: string;
  profesional: string;
  solicitante: string;
  fechaCita: string | null;
  estado: EstadoContactoMock;
}

interface SolicitudContactoConHistorial extends SolicitudContactoMock {
  historial: ContactoTelefonicoDto[];
}

@Injectable({ providedIn: 'root' })
export class ContactoMockService {
  private readonly solicitudes: SolicitudContactoConHistorial[] = [
    {
      id: 1029,
      codigo: 'ACO-1029',
      fechaAsignacion: '2025-12-18',
      profesional: 'Dr. Ricardo Luna',
      solicitante: 'Laura V.',
      fechaCita: null,
      estado: 'En espera de cita',
      historial: []
    },
    {
      id: 982,
      codigo: 'ACO-0982',
      fechaAsignacion: '2025-12-10',
      profesional: 'Dr. Ricardo Luna',
      solicitante: 'Carlos D.',
      fechaCita: null,
      estado: 'En espera de cita',
      historial: [{
        fecha: '2025-12-11T09:15:00',
        hora: '09:15',
        jornada: 'Mañana',
        resultado: 'No contesta',
        observacion: ''
      }]
    },
    {
      id: 1105,
      codigo: 'ACO-1105',
      fechaAsignacion: '2025-12-19',
      profesional: 'Dr. Ricardo Luna',
      solicitante: 'Ana M.',
      fechaCita: '2025-12-23',
      estado: 'En espera de cita',
      historial: [{
        fecha: '2025-12-20T14:00:00',
        hora: '14:00',
        jornada: 'Tarde',
        resultado: 'Contesta y se concerta cita',
        observacion: 'Cita acordada con la solicitante.',
        citaCreada: true,
        fechaCita: '2025-12-23'
      }]
    },
    {
      id: 1200,
      codigo: 'ACO-1200',
      fechaAsignacion: '2025-12-20',
      profesional: 'Dr. Ricardo Luna',
      solicitante: 'Pedro S.',
      fechaCita: null,
      estado: 'En espera de cita',
      historial: []
    }
  ];

  listarSolicitudes(): SolicitudContactoMock[] {
    return this.solicitudes.map((solicitud) => ({
      id: solicitud.id,
      codigo: solicitud.codigo,
      fechaAsignacion: solicitud.fechaAsignacion,
      profesional: solicitud.profesional,
      solicitante: solicitud.solicitante,
      fechaCita: solicitud.fechaCita,
      estado: solicitud.estado
    }));
  }

  listarContactos(idSolicitud: number): ContactoTelefonicoDto[] {
    return [...this.obtenerSolicitud(idSolicitud).historial];
  }

  registrarContacto(idSolicitud: number, datos: ContactoTelefonicoRequestDto): ContactoTelefonicoDto {
    const solicitud = this.obtenerSolicitud(idSolicitud);
    const hora = datos.fecha.includes('T') ? datos.fecha.split('T')[1].substring(0, 5) : '';
    const citaCreada = Boolean(datos.fechaCita && datos.horaCita);
    const contacto: ContactoTelefonicoDto = {
      fecha: datos.fecha,
      hora,
      jornada: Number(hora.split(':')[0]) < 12 ? 'Mañana' : 'Tarde',
      resultado: datos.resultado,
      observacion: datos.observacion,
      citaCreada,
      fechaCita: citaCreada ? datos.fechaCita : undefined
    };

    solicitud.historial.push(contacto);
    if (citaCreada) {
      solicitud.fechaCita = datos.fechaCita ?? null;
      solicitud.estado = 'En espera de cita';
    }

    return { ...contacto };
  }

  desistir(idSolicitud: number): void {
    this.obtenerSolicitud(idSolicitud).estado = 'Desistido';
  }

  private obtenerSolicitud(idSolicitud: number): SolicitudContactoConHistorial {
    const solicitud = this.solicitudes.find((item) => item.id === idSolicitud);
    if (!solicitud) {
      throw new Error(`No existe la solicitud simulada ${idSolicitud}.`);
    }
    return solicitud;
  }
}
