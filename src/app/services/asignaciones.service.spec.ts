import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

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
  let service: AsignacionesService;
  let api: jasmine.SpyObj<SolicitudService>;
  let simulados: jasmine.SpyObj<CasosSimuladosService>;

  beforeEach(() => {
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

  it('usa datos identificados como demostración cuando el API responde vacío', async () => {
    api.listarPaginadas.and.returnValue(of({
      content: [], totalElements: 0, totalPages: 0, size: 10, number: 0
    }));

    const resultado = await firstValueFrom(service.listar(0, 10));

    expect(resultado.usaDemostracion).toBeTrue();
    expect(resultado.solicitudes[0].esDemostracion).toBeTrue();
    expect(resultado.solicitudes[0].codigo).toBe('CAS-DEMO-0001');
  });

  it('usa datos de demostración si el endpoint falla', async () => {
    api.listarPaginadas.and.returnValue(throwError(() => new Error('sin servicio')));

    const resultado = await firstValueFrom(service.listar(0, 10));

    expect(resultado.usaDemostracion).toBeTrue();
    expect(resultado.totalElementos).toBe(1);
  });

  it('resuelve una referencia demo sin consultar el API', async () => {
    const resultado = await firstValueFrom(service.obtener('demo-9001', 10));

    expect(api.obtenerPorId).not.toHaveBeenCalled();
    expect(resultado.solicitudes[0].id).toBe(9001);
  });
});
