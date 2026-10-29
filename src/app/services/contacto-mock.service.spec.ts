import { ContactoMockService } from './contacto-mock.service';

describe('ContactoMockService', () => {
  let service: ContactoMockService;

  beforeEach(() => {
    service = new ContactoMockService();
  });

  it('provides the four prototype assignments without exposing its internal history array', () => {
    const solicitudes = service.listarSolicitudes();

    expect(solicitudes.map((solicitud) => solicitud.codigo)).toEqual([
      'ACO-1029',
      'ACO-0982',
      'ACO-1105',
      'ACO-1200'
    ]);
    expect('historial' in solicitudes[0]).toBeFalse();
  });

  it('updates the visible status when an assignment is withdrawn', () => {
    service.desistir(1029);

    expect(service.listarSolicitudes()[0].estado).toBe('Desistido');
  });

  it('stores a no-answer attempt and keeps the assignment available for follow-up', () => {
    service.registrarContacto(1029, {
      fecha: '2025-12-18T10:00:00',
      resultado: 'No contesta',
      observacion: ''
    });

    expect(service.listarContactos(1029).length).toBe(1);
    expect(service.listarContactos(1029)[0].observacion).toBe('');
    expect(service.listarSolicitudes()[0].estado).toBe('En espera de cita');
  });

  it('updates the appointment date when a contact schedules an appointment', () => {
    service.registrarContacto(1029, {
      fecha: '2025-12-18T10:00:00',
      resultado: 'Contesta y se concerta cita',
      observacion: 'Cita confirmada.',
      fechaCita: '2025-12-22',
      horaCita: '11:00'
    });

    expect(service.listarSolicitudes()[0].fechaCita).toBe('2025-12-22');
  });
});
