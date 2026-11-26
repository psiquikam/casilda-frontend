import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { CasosSimuladosService } from './casos-simulados.service';
import { RegistroVbgDatosService } from './registro-vbg-datos.service';
import { CitaDto, PagedResponseDto, SolicitudService } from './solicitud.service';

describe('RegistroVbgDatosService', () => {
  let service: RegistroVbgDatosService;
  let api: jasmine.SpyObj<SolicitudService>;
  let simulados: jasmine.SpyObj<CasosSimuladosService>;
  const modoOriginal = environment.datosDemostracion;
  const paginaVacia = { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 };
  const citaDemo = { id: 9001, solicitudId: 9001, codigoSolicitud: 'CAS-DEMO-0001' } as CitaDto;
  const paginaDemo: PagedResponseDto<CitaDto> = {
    content: [citaDemo], totalElements: 1, totalPages: 1, size: 10, number: 0
  };

  beforeEach(() => {
    environment.datosDemostracion = false;
    api = jasmine.createSpyObj<SolicitudService>('SolicitudService', [
      'listarCitasPaginadas', 'listarCasosPaginados', 'obtenerPorId', 'registrarPestana',
      'registrarPestanaAtencion', 'listarCitasPendientesDeCaso', 'listarHistorialAtenciones', 'registrarResultadoCita'
    ]);
    simulados = jasmine.createSpyObj<CasosSimuladosService>('CasosSimuladosService', [
      'listarCitas', 'listarCitasPendientesDeCaso', 'listarCasos', 'obtenerSolicitud', 'guardarPestana', 'tieneSolicitud',
      'tieneCaso', 'tieneCita', 'registrarResultadoCita'
    ]);
    simulados.listarCitas.and.returnValue(of(paginaDemo));
    simulados.tieneSolicitud.and.returnValue(false);
    simulados.tieneCaso.and.returnValue(false);
    simulados.tieneCita.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        RegistroVbgDatosService,
        { provide: SolicitudService, useValue: api },
        { provide: CasosSimuladosService, useValue: simulados }
      ]
    });
    service = TestBed.inject(RegistroVbgDatosService);
  });

  afterEach(() => {
    environment.datosDemostracion = modoOriginal;
  });

  it('conserva una respuesta vacía del backend sin mostrar datos simulados', async () => {
    api.listarCitasPaginadas.and.returnValue(of(paginaVacia));

    const resultado = await firstValueFrom(service.listarCitasPaginadas(0, 10));

    expect(resultado.content).toEqual([]);
    expect(service.usandoDatosDemostracion()).toBeFalse();
  });

  it('propaga el error del backend en vez de simular una respuesta exitosa', async () => {
    api.listarCitasPaginadas.and.returnValue(throwError(() => new Error('sin servicio')));

    await expectAsync(firstValueFrom(service.listarCitasPaginadas(0, 10)))
      .toBeRejectedWithError('sin servicio');
    expect(simulados.listarCitas).not.toHaveBeenCalled();
  });

  it('consulta la bandeja de citas atendidas que aún no tienen caso en el endpoint específico', async () => {
    api.listarCitasPendientesDeCaso.and.returnValue(of(paginaDemo));

    const resultado = await firstValueFrom(service.listarCitasPendientesDeCaso(0, 10));

    expect(api.listarCitasPendientesDeCaso).toHaveBeenCalledWith(0, 10);
    expect(resultado.content[0].id).toBe(9001);
    expect(simulados.listarCitasPendientesDeCaso).not.toHaveBeenCalled();
  });

  it('consulta el historial de citas por el ID del caso', async () => {
    api.listarHistorialAtenciones.and.returnValue(of([citaDemo]));

    const resultado = await firstValueFrom(service.listarHistorialAtenciones(82));

    expect(api.listarHistorialAtenciones).toHaveBeenCalledWith(82);
    expect(resultado).toEqual([citaDemo]);
  });

  it('envía las pestañas visibles de atención al adaptador de endpoints del backend', async () => {
    api.registrarPestanaAtencion.and.returnValue(of({ id: 33 }));

    await firstValueFrom(service.registrarPestanaAtencion(1, { casoId: 7, citaId: 15 }, 7, 15));

    expect(api.registrarPestanaAtencion).toHaveBeenCalledWith(1, { casoId: 7, citaId: 15 });
    expect(simulados.guardarPestana).not.toHaveBeenCalled();
  });

  it('mantiene los índices visuales de las pestañas al guardar datos de demostración', async () => {
    environment.datosDemostracion = true;
    simulados.guardarPestana.and.returnValue(of({ id: 33, codigo: 'CAS-33' }));

    await firstValueFrom(service.registrarPestanaAtencion(1, { casoId: 7, citaId: 15 }, 7, 15));

    expect(simulados.guardarPestana).toHaveBeenCalledWith(7, 1, { casoId: 7, citaId: 15 }, 15);
    expect(api.registrarPestanaAtencion).not.toHaveBeenCalled();
  });

  it('conserva la respuesta real cuando contiene citas', async () => {
    const citaReal = { ...citaDemo, id: 12, solicitudId: 12, codigoSolicitud: 'SOL-12' };
    api.listarCitasPaginadas.and.returnValue(of({ ...paginaDemo, content: [citaReal] }));

    const resultado = await firstValueFrom(service.listarCitasPaginadas(0, 10));

    expect(resultado.content[0].codigoSolicitud).toBe('SOL-12');
    expect(service.usandoDatosDemostracion()).toBeFalse();
  });

  it('envía el resultado de la cita al endpoint cuando trabaja con datos reales', async () => {
    const citaAtendida = { ...citaDemo, idEstadoCita: 4, estadoCita: 'Atendida' };
    api.registrarResultadoCita.and.returnValue(of(citaAtendida));
    simulados.tieneCita.and.returnValue(true);

    await firstValueFrom(service.registrarResultadoCita(citaDemo.id, 'ATENDIDA'));

    expect(api.registrarResultadoCita).toHaveBeenCalledWith(citaDemo.id, { resultado: 'ATENDIDA' });
    expect(simulados.registrarResultadoCita).not.toHaveBeenCalled();
  });
});
