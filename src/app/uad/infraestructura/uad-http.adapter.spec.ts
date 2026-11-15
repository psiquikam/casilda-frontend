import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { UadHttpAdapter } from './uad-http.adapter';
import { ErrorUad } from './uad-error';

/** Verifica que el adaptador HTTP llame exactamente las rutas y verbos de `openapi-uad.yaml`. */
describe('UAD · adaptador HTTP (contrato)', () => {
  let api: UadHttpAdapter;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/uad`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [UadHttpAdapter, provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(UadHttpAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GET /uad/noticias con filtros y sin parámetros vacíos', () => {
    api.listarNoticias({ tipo: 'NDA', estado: null, consecutivo: 'NDA-2026', fechaRecepcionDesde: '', page: 2, size: 10 }).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/noticias`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('tipo')).toBe('NDA');
    expect(req.request.params.get('consecutivo')).toBe('NDA-2026');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.has('estado')).toBeFalse();
    expect(req.request.params.has('fechaRecepcionDesde')).toBeFalse();
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 2, size: 10 });
  });

  it('POST /uad/noticias/{id}/decisiones envía el cuerpo tal cual', () => {
    const cuerpo = { tipo: 'INHIBITORIO' as const, version: 4, inhibitorio: { causalCodigo: 'X', justificacion: 'y' } };
    api.registrarDecision('abc', cuerpo).subscribe();
    const req = http.expectOne(`${base}/noticias/abc/decisiones`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(cuerpo);
    req.flush({ noticia: {}, casoUad: null, notificaciones: [] });
  });

  it('POST clasificación, GET casos asociados, historial, descarga y catálogo', () => {
    api.clasificarVinculacion('n1', { vinculacionInvestigado: 'NO_SE', version: 1 }).subscribe();
    http.expectOne({ method: 'POST', url: `${base}/noticias/n1/clasificacion` }).flush({ visibleParaUsuario: true, noticia: null });
    api.consultarCasosAsociados('n1').subscribe();
    http.expectOne({ method: 'GET', url: `${base}/noticias/n1/casos-asociados` }).flush([]);
    api.historialNoticia('n1').subscribe();
    http.expectOne({ method: 'GET', url: `${base}/noticias/n1/historial` }).flush([]);
    api.descargarEvidencia('e1').subscribe();
    const descarga = http.expectOne({ method: 'GET', url: `${base}/evidencias/e1/descarga` });
    expect(descarga.request.responseType).toBe('blob');
    descarga.flush(new Blob(['x']));
    api.catalogo('uad-causales-inhibitorio').subscribe();
    http.expectOne({ method: 'GET', url: `${environment.apiBaseUrl}/maestros/uad-causales-inhibitorio` }).flush([]);
  });

  it('traduce el 409 del backend (ErrorResponse + codigo) a ErrorUad', () => {
    let error: ErrorUad | undefined;
    api.obtenerNoticia('n1').subscribe({ error: (e: ErrorUad) => (error = e) });
    http.expectOne(`${base}/noticias/n1`).flush(
      { timestamp: '2026-11-14T10:00:00', status: 409, error: 'Conflict', message: 'x', path: '/api/v1/uad/noticias/n1', codigo: 'CONFLICTO_VERSION' },
      { status: 409, statusText: 'Conflict' }
    );
    expect(error?.tipo).toBe('conflicto');
    expect(error?.codigo).toBe('CONFLICTO_VERSION');
  });

  it('traduce el 400 con validationErrors por campo', () => {
    let error: ErrorUad | undefined;
    api.registrarDecision('n1', { tipo: 'INHIBITORIO', version: 1 }).subscribe({ error: (e: ErrorUad) => (error = e) });
    http
      .expectOne(`${base}/noticias/n1/decisiones`)
      .flush({ status: 400, message: 'Revise los datos.', validationErrors: { 'inhibitorio.causalCodigo': 'Requerido' } }, { status: 400, statusText: 'Bad Request' });
    expect(error?.tipo).toBe('validacion');
    expect(error?.camposInvalidos['inhibitorio.causalCodigo']).toBe('Requerido');
  });
});
