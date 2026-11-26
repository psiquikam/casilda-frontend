import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { AsignacionesService } from './asignaciones.service';
import { CasosSimuladosService } from './casos-simulados.service';
import {
  PagedResponseDto,
  SolicitudAcompanamientoResponse,
  SolicitudService
} from './solicitud.service';

function solicitud(id: number, codigo: string): SolicitudAcompanamientoResponse {
  return {
    id,
    codigo,
    estado: 'Asignada',
    fechaCreacion: '2026-10-29T08:00:00',
    nombreSolicitante: 'Persona de prueba'
  } as SolicitudAcompanamientoResponse;
}

describe('AsignacionesService', () => {
  const modoDemostracionOriginal = environment.datosDemostracion;
  let service: AsignacionesService;
  let api: jasmine.SpyObj<SolicitudService>;
  let simulados: jasmine.SpyObj<CasosSimuladosService>;

  beforeEach(() => {
    environment.datosDemostracion = false;
    api = jasmine.createSpyObj<SolicitudService>('SolicitudService', [
      'listarPaginadas',
      'obtenerPorId',
      'listarContactos',
      'registrarContacto'
    ]);
    simulados = jasmine.createSpyObj<CasosSimuladosService>('CasosSimuladosService', [
      'listarSolicitudesAsignadas',
      'listarContactosSolicitud',
      'registrarContactoSolicitud'
    ]);
    simulados.listarSolicitudesAsignadas.and.returnValue([solicitud(9001, 'CAS-DEMO-0001')]);

    TestBed.configureTestingModule({
      providers: [
        AsignacionesService,
        { provide: SolicitudService, useValue: api },
        { provide: CasosSimuladosService, useValue: simulados }
      ]
    });
    service = TestBed.inject(AsignacionesService);
  });

  afterEach(() => {
    environment.datosDemostracion = modoDemostracionOriginal;
  });

  it('conserva los datos del API cuando hay asignaciones', async () => {
    const pagina: PagedResponseDto<SolicitudAcompanamientoResponse> = {
      content: [solicitud(12, 'SOL-12')],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0
    };
    api.listarPaginadas.and.returnValue(of(pagina));

    const resultado = await firstValueFrom(service.listar(0, 10));

    expect(api.listarPaginadas).toHaveBeenCalledWith(0, 10, 2);
    expect(resultado.usaDemostracion).toBeFalse();
    expect(resultado.solicitudes[0].codigo).toBe('SOL-12');
  });

  it('conserva una respuesta vacía del API sin mostrar datos de demostración', async () => {
    api.listarPaginadas.and.returnValue(of({
      content: [], totalElements: 0, totalPages: 0, size: 10, number: 0
    }));

    const resultado = await firstValueFrom(service.listar(0, 10));

    expect(resultado.usaDemostracion).toBeFalse();
    expect(resultado.solicitudes).toEqual([]);
    expect(simulados.listarSolicitudesAsignadas).not.toHaveBeenCalled();
  });

  it('propaga el error del API en vez de responder con datos de demostración', async () => {
    api.listarPaginadas.and.returnValue(throwError(() => new Error('sin servicio')));

    await expectAsync(firstValueFrom(service.listar(0, 10))).toBeRejectedWithError('sin servicio');
    expect(simulados.listarSolicitudesAsignadas).not.toHaveBeenCalled();
  });

  it('usa referencias demo solo cuando el modo demostración está habilitado', async () => {
    if (!environment.datosDemostracion) {
      await expectAsync(firstValueFrom(service.obtener('demo-9001', 10)))
        .toBeRejectedWithError('La solicitud seleccionada no tiene un identificador válido.');
      return;
    }

    const resultado = await firstValueFrom(service.obtener('demo-9001', 10));

    expect(api.obtenerPorId).not.toHaveBeenCalled();
    expect(resultado.solicitudes[0].id).toBe(9001);
  });
});
