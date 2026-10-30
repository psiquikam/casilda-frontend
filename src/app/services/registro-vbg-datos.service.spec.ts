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
      'listarCitasPaginadas', 'listarCasosPaginados', 'obtenerPorId', 'registrarPestana'
    ]);
    simulados = jasmine.createSpyObj<CasosSimuladosService>('CasosSimuladosService', [
      'listarCitas', 'listarCasos', 'obtenerSolicitud', 'guardarPestana', 'tieneSolicitud'
    ]);
    simulados.listarCitas.and.returnValue(of(paginaDemo));
    simulados.tieneSolicitud.and.returnValue(false);

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

  it('usa citas simuladas cuando el backend responde sin datos', async () => {
    api.listarCitasPaginadas.and.returnValue(of(paginaVacia));

    const resultado = await firstValueFrom(service.listarCitasPaginadas(0, 10));

    expect(resultado.content[0].codigoSolicitud).toBe('CAS-DEMO-0001');
    expect(service.usandoDatosDemostracion()).toBeTrue();
  });

  it('usa citas simuladas cuando el endpoint falla', async () => {
    api.listarCitasPaginadas.and.returnValue(throwError(() => new Error('sin servicio')));

    const resultado = await firstValueFrom(service.listarCitasPaginadas(0, 10));

    expect(resultado.content.length).toBe(1);
    expect(service.usandoDatosDemostracion()).toBeTrue();
  });

  it('conserva la respuesta real cuando contiene citas', async () => {
    const citaReal = { ...citaDemo, id: 12, solicitudId: 12, codigoSolicitud: 'SOL-12' };
    api.listarCitasPaginadas.and.returnValue(of({ ...paginaDemo, content: [citaReal] }));

    const resultado = await firstValueFrom(service.listarCitasPaginadas(0, 10));

    expect(resultado.content[0].codigoSolicitud).toBe('SOL-12');
    expect(service.usandoDatosDemostracion()).toBeFalse();
  });
});
