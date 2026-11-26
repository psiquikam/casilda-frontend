import { firstValueFrom } from 'rxjs';
import { CasosSimuladosService } from './casos-simulados.service';
import { EstadoCitaEnum } from './solicitud.service';

describe('CasosSimuladosService', () => {
  it('no muestra en Casos una solicitud cuya primera cita aún no fue atendida', async () => {
    const service = new CasosSimuladosService();
    const pagina = await firstValueFrom(service.listarCasos(0, 10));

    expect(pagina.content.length).toBe(3);
    expect(pagina.content.every((caso) => Boolean(caso.codigo.trim()))).toBeTrue();
    expect(pagina.content.some((caso) => caso.citaId === 9004)).toBeFalse();
  });

  it('muestra la cita inicial en casos después de registrar la primera atención', async () => {
    const service = new CasosSimuladosService();

    await firstValueFrom(service.registrarResultadoCita(9004, 'ATENDIDA'));
    const pendientes = await firstValueFrom(service.listarCitasPendientesDeCaso(0, 10));
    expect(pendientes.content.map((cita) => cita.id)).toEqual([9004]);

    await firstValueFrom(service.guardarPestana(null, 0, {}, 9004));
    expect((await firstValueFrom(service.listarCitasPendientesDeCaso(0, 10))).content).toEqual([]);
  });

  it('comparte cuatro solicitudes en la bandeja de contacto', () => {
    const service = new CasosSimuladosService();

    expect(service.listarSolicitudesAsignadas().length).toBe(4);
    expect(new Set(service.listarSolicitudesAsignadas().map((solicitud) => solicitud.id)).size).toBe(4);
  });

  it('registra el resultado de la cita inicial y permite crear el caso solo después de atenderla', async () => {
    const service = new CasosSimuladosService();
    const citasAntes = await firstValueFrom(service.listarCitas(0, 10));
    const citaPendiente = citasAntes.content.find((cita) => cita.id === 9004);

    expect(citaPendiente?.estadoCita).toBe('Programada');
    expect(citaPendiente?.codigoCaso).toBe('');

    await firstValueFrom(service.registrarResultadoCita(9004, 'ATENDIDA'));
    const citaAtendida = (await firstValueFrom(service.listarCitas(0, 10))).content
      .find((cita) => cita.id === 9004);
    expect(citaAtendida?.estadoCita).toBe('Atendida');

    const creado = await firstValueFrom(service.guardarPestana(null, 0, { persona: 'demo' }, 9004));
    expect(creado.codigo).toBeTruthy();

    const casos = (await firstValueFrom(service.listarCasos(0, 10))).content;
    expect(casos.length).toBe(4);
    expect(casos.find((caso) => caso.citaId === 9004)?.codigo).toBe(creado.codigo);
  });

  it('usa el estado visible Programada para citas nuevas y para la semilla', async () => {
    const service = new CasosSimuladosService();
    const citaSemilla = (await firstValueFrom(service.listarCitas(0, 10))).content
      .find((cita) => cita.id === 9004);
    const fechaCita = new Date();
    fechaCita.setDate(fechaCita.getDate() + 1);
    const contacto = service.registrarContactoSolicitud(9004, {
      fecha: new Date().toISOString(),
      resultado: 'CONTACTADO',
      observacion: 'Se acordó una cita.',
      fechaCita: fechaCita.toISOString().slice(0, 10),
      horaCita: '10:30'
    });

    expect(citaSemilla?.estadoCita).toBe('Programada');
    expect(contacto.citaCreada).toBeTrue();
    expect((await firstValueFrom(service.listarCitas(0, 10))).content
      .find((cita) => cita.id === 9005)?.estadoCita).toBe('Programada');
  });

  it('no permite registrar primera atención antes de una cita atendida', async () => {
    const service = new CasosSimuladosService();

    await expectAsync(firstValueFrom(service.guardarPestana(null, 0, {}, 9004)))
      .toBeRejectedWithError('Solo se puede registrar una atención después de marcar la cita como atendida.');
  });

  it('una inasistencia no crea ni muestra un caso', async () => {
    const service = new CasosSimuladosService();

    await firstValueFrom(service.registrarResultadoCita(9004, 'INASISTENCIA'));

    const citas = (await firstValueFrom(service.listarCitas(0, 10))).content;
    expect(citas.find((cita) => cita.id === 9004)?.estadoCita).toBe('Inasistencia');
    expect((await firstValueFrom(service.listarCasos(0, 10))).content.length).toBe(3);
  });

  it('agenda una nueva cita al recontactar una solicitud con inasistencia', async () => {
    const service = new CasosSimuladosService();
    const fechaCita = new Date();
    fechaCita.setDate(fechaCita.getDate() + 1);
    const fechaCitaTexto = fechaCita.toISOString().slice(0, 10);

    await firstValueFrom(service.registrarResultadoCita(9004, 'INASISTENCIA'));
    const contacto = service.registrarContactoSolicitud(9004, {
      fecha: new Date().toISOString(),
      resultado: 'CONTACTADO',
      observacion: 'Se acordó una nueva cita.',
      fechaCita: fechaCitaTexto,
      horaCita: '10:30'
    });

    expect(contacto.citaCreada).toBeTrue();
    const citas = (await firstValueFrom(service.listarCitas(0, 10))).content;
    const nuevaCita = citas.find((cita) => cita.id === 9005);
    expect(nuevaCita?.solicitudId).toBe(9004);
    expect(nuevaCita?.idEstadoCita).toBe(EstadoCitaEnum.PROGRAMADA);
    expect(nuevaCita?.casoId).toBeNull();
    expect(nuevaCita?.codigoCaso).toBe('');
    expect(service.listarSolicitudesAsignadas().filter((solicitud) => solicitud.id === 9004).length).toBe(1);
  });

  it('guarda las pestañas de seguimiento en el caso seleccionado', async () => {
    const service = new CasosSimuladosService();
    const casos = (await firstValueFrom(service.listarCasos(0, 10))).content;

    const respuesta = await firstValueFrom(service.guardarPestana(casos[1].id, 10, { nota: 'seguimiento' }));

    expect(respuesta.id).not.toBe(casos[1].id);
    expect(respuesta.codigo).toBe(casos[1].codigo);
    expect((await firstValueFrom(service.listarCasos(0, 10))).content.map((caso) => caso.id))
      .toEqual(casos.map((caso) => caso.id));
  });

  it('agrega una atención de seguimiento al mismo caso sin duplicar el expediente', async () => {
    const service = new CasosSimuladosService();
    const caso = (await firstValueFrom(service.listarCasos(0, 10))).content[0];
    const fechaCita = new Date();
    fechaCita.setDate(fechaCita.getDate() + 1);
    const fechaCitaTexto = fechaCita.toISOString().slice(0, 10);
    const citaSeguimiento = await firstValueFrom(service.programarCitaSeguimiento(caso.id, fechaCitaTexto, '09:00'));

    expect(citaSeguimiento.tipoAtencion).toBe('SEGUIMIENTO');
    expect(citaSeguimiento.casoId).toBe(caso.id);
    expect(citaSeguimiento.codigoCaso).toBe(caso.codigo);

    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date(citaSeguimiento.fechaCita));
      const resultado = firstValueFrom(service.registrarResultadoCita(citaSeguimiento.id, 'ATENDIDA'));
      jasmine.clock().tick(500);
      await resultado;

      const atencion = firstValueFrom(
        service.guardarPestana(caso.id, 0, { nota: 'atención de seguimiento' }, citaSeguimiento.id)
      );
      jasmine.clock().tick(500);
      await atencion;
    } finally {
      jasmine.clock().uninstall();
    }

    const casos = (await firstValueFrom(service.listarCasos(0, 10))).content;
    const casoActualizado = casos.find((item) => item.id === caso.id);
    const citasDelCaso = service.listarCitasDeCaso(caso.id);
    expect(casos.length).toBe(3);
    expect(casoActualizado?.codigo).toBe(caso.codigo);
    expect(casoActualizado?.cantidadAtenciones).toBe(2);
    expect(citasDelCaso.length).toBe(2);
    expect(citasDelCaso.find((cita) => cita.id === citaSeguimiento.id)?.casoId).toBe(caso.id);
  });
});
