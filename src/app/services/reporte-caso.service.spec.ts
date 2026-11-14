import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../environments/environment';
import {
  LIMITES_EVIDENCIAS,
  ReporteCasoService,
  aFechaIso,
  construirReporteCasoRequest,
  esOpcionOtro,
  esVinculoComunidadUdea,
  interpretarErrorReporte,
  validarEvidencias,
  ValoresReporteFormulario
} from './reporte-caso.service';

const VINCULOS_UDEA = [
  { id: 1, nombre: 'Estudiante de Pregrado' },
  { id: 14, nombre: 'Externo' },
  { id: 20, nombre: 'Otro' }
];
const VINCULOS_VICTIMA = [
  { id: 1, nombre: 'Pareja/expareja' },
  { id: 13, nombre: 'Otro' }
];

function valoresBase(): ValoresReporteFormulario {
  return {
    perfil: 'anonimo',
    deseaDatosVictima: 'no',
    victima: {
      tipoDocumento: 1, identificacion: '1020304050', fechaNacimiento: new Date(1999, 2, 14),
      primerNombre: ' Ana ', segundoNombre: '', primerApellido: 'Prueba', segundoApellido: '',
      correo: 'ana@correo.com', genero: 3, cargo: '7'
    },
    deseaContacto: 'no',
    correoContacto: '',
    whatsappContacto: '',
    relato: { tipoLugar: null, descripcionHechos: '  Relato de los hechos  ' },
    victimario: {
      identificacion: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '',
      vinculoUniversidad: null, otroVinculoUniversidad: '', vinculoVictima: null, otroVinculoVictima: '',
      remitirUad: 'no', correo: ''
    },
    vinculosUniversidad: VINCULOS_UDEA,
    vinculosVictima: VINCULOS_VICTIMA,
    rutaActivacion: 2
  };
}

function archivo(nombre: string, bytes: number, tipo: string): File {
  const f = new File([''], nombre, { type: tipo });
  Object.defineProperty(f, 'size', { value: bytes });
  return f;
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

  it('should POST multipart/form-data with the JSON part `reporte` and one `evidencias` part per file', () => {
    const dto = construirReporteCasoRequest(valoresBase());
    const evidencias = [archivo('a.pdf', 10, 'application/pdf'), archivo('b.png', 10, 'image/png')];
    service.crear(dto, evidencias).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/reportes`);
    expect(req.request.body instanceof FormData).toBeTrue();
    const form = req.request.body as FormData;
    expect((form.get('reporte') as Blob).type).toBe('application/json');
    expect(form.getAll('evidencias').length).toBe(2);
    expect(req.request.headers.has('Content-Type')).toBeFalse();
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

  it('should map the profile to tipoReportante', () => {
    expect(construirReporteCasoRequest(valoresBase()).tipoReportante).toBe('AFECTADA');
    expect(construirReporteCasoRequest({ ...valoresBase(), perfil: 'anonimo_tercero' }).tipoReportante).toBe('TERCERO');
    expect(construirReporteCasoRequest({ ...valoresBase(), perfil: null }).tipoReportante).toBeNull();
  });

  it('should send the victim block (names, email, gender and cargo ids) only when the person chose to give it', () => {
    expect(construirReporteCasoRequest(valoresBase()).victima).toBeNull();

    const dto = construirReporteCasoRequest({ ...valoresBase(), deseaDatosVictima: 'si' });
    expect(dto.victima).toEqual({
      primerNombre: 'Ana', segundoNombre: null, primerApellido: 'Prueba', segundoApellido: null,
      correo: 'ana@correo.com', identidadGeneroId: 3, cargoId: 7
    });
  });

  it('should send contacto with deseaContacto=false and no channels when contact was declined', () => {
    expect(construirReporteCasoRequest(valoresBase()).contacto).toEqual({ deseaContacto: false, correo: null, whatsapp: null });
  });

  it('should send the contact channels, falling back to the affected person email given in the victim block', () => {
    const conCanales = construirReporteCasoRequest({
      ...valoresBase(), deseaContacto: 'si', correoContacto: ' quien@correo.com ', whatsappContacto: '3001234567'
    });
    expect(conCanales.contacto).toEqual({ deseaContacto: true, correo: 'quien@correo.com', whatsapp: '3001234567' });

    const conCorreoVictima = construirReporteCasoRequest({ ...valoresBase(), deseaDatosVictima: 'si', deseaContacto: 'si' });
    expect(conCorreoVictima.contacto?.correo).toBe('ana@correo.com');

    const tercero = construirReporteCasoRequest({ ...valoresBase(), perfil: 'anonimo_tercero', deseaDatosVictima: 'si', deseaContacto: 'si' });
    expect(tercero.contacto?.correo).toBeNull();
  });

  it('should send presuntoAgresor as null when nothing about the aggressor was filled in', () => {
    expect(construirReporteCasoRequest(valoresBase()).presuntoAgresor).toBeNull();
  });

  it('should map the aggressor block with catalog ids, informacionAdicional and remitirUad only for UdeA members', () => {
    const valores = valoresBase();
    valores.victimario = {
      ...valores.victimario, identificacion: '98765432', primerNombre: 'Carlos', primerApellido: 'Prueba',
      vinculoUniversidad: '1', vinculoVictima: 1, remitirUad: 'si', correo: 'Trabaja en la biblioteca'
    };
    const dto = construirReporteCasoRequest(valores);
    expect(dto.presuntoAgresor).toEqual({
      numeroDocumento: '98765432', primerNombre: 'Carlos', segundoNombre: null, primerApellido: 'Prueba', segundoApellido: null,
      vinculoUniversidadId: 1, vinculoVictimaId: 1, otroVinculoUniversidad: null, otroVinculoVictima: null,
      informacionAdicional: 'Trabaja en la biblioteca', remitirUad: true
    });

    valores.victimario.vinculoUniversidad = 14; // Externo: la UAD no aplica aunque el control diga «si»
    expect(construirReporteCasoRequest(valores).presuntoAgresor?.remitirUad).toBeNull();

    valores.victimario.vinculoUniversidad = null; // sin vínculo: el servidor rechaza remitirUad
    expect(construirReporteCasoRequest(valores).presuntoAgresor?.remitirUad).toBeNull();
  });

  it('should send «¿Cuál?» only when the chosen link is exactly «Otro», as the server validates', () => {
    const valores = valoresBase();
    valores.victimario = { ...valores.victimario, vinculoUniversidad: 20, otroVinculoUniversidad: 'Vecino del campus', vinculoVictima: 1, otroVinculoVictima: 'quedó de antes' };
    const dto = construirReporteCasoRequest(valores);
    expect(dto.presuntoAgresor?.otroVinculoUniversidad).toBe('Vecino del campus');
    expect(dto.presuntoAgresor?.otroVinculoVictima).toBeNull();
  });
});

describe('reglas de vínculos compartidas con el servidor', () => {
  it('esOpcionOtro only accepts the literal «Otro»', () => {
    expect(esOpcionOtro(' otro ')).toBeTrue();
    expect(esOpcionOtro('Otro tipo de vínculo')).toBeFalse();
    expect(esOpcionOtro(null)).toBeFalse();
  });

  it('esVinculoComunidadUdea excludes external, unknown and «Otro» links', () => {
    expect(esVinculoComunidadUdea('Estudiante de Pregrado')).toBeTrue();
    expect(esVinculoComunidadUdea('Contratista')).toBeTrue();
    expect(esVinculoComunidadUdea('Externo')).toBeFalse();
    expect(esVinculoComunidadUdea('Otro')).toBeFalse();
    expect(esVinculoComunidadUdea('Se desconoce')).toBeFalse();
    expect(esVinculoComunidadUdea('')).toBeFalse();
  });
});

describe('validarEvidencias', () => {
  const MB = 1024 * 1024;

  it('should accept an empty list and a valid set', () => {
    expect(validarEvidencias([])).toBeNull();
    expect(validarEvidencias([archivo('a.pdf', 2 * MB, 'application/pdf'), archivo('b.jpg', 3 * MB, 'image/jpeg')])).toBeNull();
  });

  it('should infer the type from the extension when the browser gives none', () => {
    expect(validarEvidencias([archivo('video.mov', MB, '')])).toBeNull();
    expect(validarEvidencias([archivo('nota.txt', MB, '')])).toContain('formato');
  });

  it('should reject too many files, oversized files, empty files and the total limit', () => {
    const seis = Array.from({ length: LIMITES_EVIDENCIAS.maxArchivos + 1 }, (_, i) => archivo(`${i}.png`, MB, 'image/png'));
    expect(validarEvidencias(seis)).toContain(`máximo ${LIMITES_EVIDENCIAS.maxArchivos}`);
    expect(validarEvidencias([archivo('grande.mp4', 11 * MB, 'video/mp4')])).toContain('10 MB');
    expect(validarEvidencias([archivo('vacio.pdf', 0, 'application/pdf')])).toContain('vacío');
    expect(validarEvidencias([archivo('a.mp4', 9 * MB, 'video/mp4'), archivo('b.mp4', 9 * MB, 'video/mp4'), archivo('c.mp4', 9 * MB, 'video/mp4')])).toContain('25 MB');
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

  it('should keep nested field keys such as victima.cargoId', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Datos inválidos', validationErrors: { 'victima.cargoId': 'El cargo de la víctima es obligatorio' } }
    });
    expect(interpretarErrorReporte(error).campos['victima.cargoId']).toContain('obligatorio');
  });

  it('should use the server message for a 400 without field errors (evidence rules)', () => {
    const error = new HttpErrorResponse({ status: 400, error: { message: 'Se permiten máximo 5 evidencias' } });
    expect(interpretarErrorReporte(error).mensaje).toBe('Se permiten máximo 5 evidencias');
  });

  it('should explain rate limiting and connection errors', () => {
    expect(interpretarErrorReporte(new HttpErrorResponse({ status: 413 })).mensaje).toContain('tamaño');
    expect(interpretarErrorReporte(new HttpErrorResponse({ status: 429 })).mensaje).toContain('Espere unos minutos');
    expect(interpretarErrorReporte(new HttpErrorResponse({ status: 0 })).mensaje).toContain('conexión');
    expect(interpretarErrorReporte(new HttpErrorResponse({ status: 500 })).mensaje).toContain('No fue posible');
  });
});
