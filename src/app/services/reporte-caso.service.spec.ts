import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../environments/environment';
import {
  ReporteCasoService,
  aFechaIso,
  construirReporteCasoRequest,
  interpretarErrorReporte,
  ValoresReporteFormulario
} from './reporte-caso.service';

function valoresBase(): ValoresReporteFormulario {
  return {
    deseaDatosVictima: 'no',
    victima: { tipoDocumento: 1, identificacion: '1020304050', fechaNacimiento: new Date(1999, 2, 14) },
    relato: { tipoLugar: null, descripcionHechos: '  Relato de los hechos  ' },
    rutaActivacion: 2
  };
}

describe('ReporteCasoService', () => {
  let service: ReporteCasoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReporteCasoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should POST the DTO to {apiBaseUrl}/reportes', () => {
    const dto = construirReporteCasoRequest(valoresBase());
    service.crear(dto).subscribe((respuesta) => expect(respuesta.codigo).toBe('CAS-ABC'));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/reportes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ id: 1, codigo: 'CAS-ABC', fechaRegistro: '', rutaActivacion: { id: 2, codigo: null, nombre: 'X', estado: 'SOLICITADA' } });
  });
});

describe('construirReporteCasoRequest', () => {
  it('should send victim data as null when the person chose not to give it', () => {
    const dto = construirReporteCasoRequest(valoresBase());
    expect(dto.tipoDocumentoId).toBeNull();
    expect(dto.numeroDocumento).toBeNull();
    expect(dto.fechaNacimiento).toBeNull();
    expect(dto.descripcionHechos).toBe('Relato de los hechos');
    expect(dto.rutaActivacionId).toBe(2);
  });

  it('should send victim document and birth date as YYYY-MM-DD when given', () => {
    const valores = valoresBase();
    valores.deseaDatosVictima = 'si';
    valores.victima.identificacion = 'ab123';
    const dto = construirReporteCasoRequest(valores);
    expect(dto.tipoDocumentoId).toBe(1);
    expect(dto.numeroDocumento).toBe('AB123');
    expect(dto.fechaNacimiento).toBe('1999-03-14');
  });

  it('should map sedeCampus to campusId and drop external fields for an internal place', () => {
    const valores = valoresBase();
    valores.relato = {
      ...valores.relato, tipoLugar: 'interno', sedeCampus: 3, facultad: ' Medicina ', bloque: '', espacio: null,
      lugarDetalleExterno: 'quedó de una selección anterior'
    };
    const dto = construirReporteCasoRequest(valores);
    expect(dto.campusId).toBe(3);
    expect(dto.facultad).toBe('Medicina');
    expect(dto.bloque).toBeNull();
    expect(dto.lugarDetalleExterno).toBeNull();
  });

  it('should drop internal fields for an external place', () => {
    const valores = valoresBase();
    valores.relato = { ...valores.relato, tipoLugar: 'externo', sedeCampus: 3, facultad: 'X', lugarDetalleExterno: 'Vía pública' };
    const dto = construirReporteCasoRequest(valores);
    expect(dto.campusId).toBeNull();
    expect(dto.facultad).toBeNull();
    expect(dto.lugarDetalleExterno).toBe('Vía pública');
  });

  it('should send every place field as null when no place type was chosen', () => {
    const valores = valoresBase();
    valores.relato = { ...valores.relato, sedeCampus: 3, facultad: 'X' };
    const dto = construirReporteCasoRequest(valores);
    expect(dto.tipoLugar).toBeNull();
    expect(dto.campusId).toBeNull();
    expect(dto.facultad).toBeNull();
  });
});

describe('aFechaIso', () => {
  it('should keep the local calendar day', () => {
    expect(aFechaIso(new Date(2001, 0, 5, 23, 30))).toBe('2001-01-05');
    expect(aFechaIso(null)).toBeNull();
    expect(aFechaIso('2001-01-05T00:00:00Z')).toBe('2001-01-05');
  });
});

describe('interpretarErrorReporte', () => {
  it('should return field messages from validationErrors', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Error de validación', validationErrors: { campusId: 'Seleccione el campus' } }
    });
    const detalle = interpretarErrorReporte(error);
    expect(detalle.campos).toEqual({ campusId: 'Seleccione el campus' });
    expect(detalle.mensaje).toContain('no se ha enviado');
  });

  it('should explain rate limiting and connection errors', () => {
    expect(interpretarErrorReporte(new HttpErrorResponse({ status: 429 })).mensaje).toContain('Espere unos minutos');
    expect(interpretarErrorReporte(new HttpErrorResponse({ status: 0 })).mensaje).toContain('conexión');
    expect(interpretarErrorReporte(new HttpErrorResponse({ status: 500 })).mensaje).toContain('No fue posible');
  });
});
