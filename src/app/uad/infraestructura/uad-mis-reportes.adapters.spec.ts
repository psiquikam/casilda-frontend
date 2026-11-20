import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { MiReporteDetalle, MiReporteResumen, Pagina } from '../contratos/uad-api.types';
import { UadMisReportesPort } from '../contratos/uad-mis-reportes.port';
import { provideUadMisReportes, UAD_MIS_REPORTES_SIMULADO } from '../uad.providers';
import { ErrorUad } from './uad-error';
import { UadMisReportesHttpAdapter } from './uad-mis-reportes-http.adapter';
import { UAD_MOCK_LATENCIA_MS } from './mock/uad-mock.adapter';
import { UadMisReportesMockAdapter, codigoReporteMock } from './mock/uad-mis-reportes-mock.adapter';
import { UadMockStore } from './mock/uad-mock-store';

const CODIGO_145 = codigoReporteMock('NDI-2026-000145');

describe('UAD · «Mis reportes»', () => {
  describe('adaptador HTTP', () => {
    let http: HttpTestingController;
    let api: UadMisReportesHttpAdapter;

    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [UadMisReportesHttpAdapter, provideHttpClient(), provideHttpClientTesting()] });
      http = TestBed.inject(HttpTestingController);
      api = TestBed.inject(UadMisReportesHttpAdapter);
    });

    afterEach(() => http.verify());

    it('lista con GET /mis-reportes paginado', () => {
      api.listar(1, 10).subscribe();
      const req = http.expectOne((r) => r.url === `${environment.apiBaseUrl}/mis-reportes`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      req.flush({ content: [], totalElements: 0, totalPages: 0, number: 1, size: 10 });
    });

    it('consulta el detalle con el código del reporte codificado en la ruta', () => {
      api.obtener('CAS-A/B').subscribe();
      const req = http.expectOne(`${environment.apiBaseUrl}/mis-reportes/CAS-A%2FB`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('responde con POST multipart que solo lleva el texto', () => {
      api.responder('CAS-0001', 'sol-1', 'Mi respuesta').subscribe();
      const req = http.expectOne(`${environment.apiBaseUrl}/reportes/CAS-0001/solicitudes-informacion/sol-1/respuesta`);
      expect(req.request.method).toBe('POST');
      const cuerpo = req.request.body as FormData;
      expect(cuerpo instanceof FormData).toBeTrue();
      expect(Array.from(cuerpo.keys())).toEqual(['respuesta']);
      expect(cuerpo.get('respuesta')).toBe('Mi respuesta');
      req.flush({});
    });

    it('traduce el error del servidor a ErrorUad con su código', () => {
      let error: ErrorUad | undefined;
      api.responder('CAS-0001', 'sol-1', 'Texto').subscribe({ error: (e: ErrorUad) => (error = e) });
      http
        .expectOne(`${environment.apiBaseUrl}/reportes/CAS-0001/solicitudes-informacion/sol-1/respuesta`)
        .flush({ status: 409, message: 'Esta solicitud ya fue respondida.', codigo: 'SOLICITUD_YA_RESPONDIDA' }, { status: 409, statusText: 'Conflict' });
      expect(error?.tipo).toBe('conflicto');
      expect(error?.codigo).toBe('SOLICITUD_YA_RESPONDIDA');
    });
  });

  describe('adaptador mock', () => {
    let api: UadMisReportesMockAdapter;
    let store: UadMockStore;

    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [UadMisReportesMockAdapter, { provide: UAD_MOCK_LATENCIA_MS, useValue: 0 }] });
      api = TestBed.inject(UadMisReportesMockAdapter);
      store = TestBed.inject(UadMockStore);
    });

    function listar(page = 0, size = 50): Pagina<MiReporteResumen> {
      let pagina!: Pagina<MiReporteResumen>;
      api.listar(page, size).subscribe((p) => (pagina = p));
      return pagina;
    }

    function fallo(accion: () => void): void {
      accion();
    }

    it('nunca lista quejas anónimas ni noticias remitidas por otro actor', () => {
      const consecutivos = listar().content.map((r) => r.consecutivo ?? '');
      expect(consecutivos.length).toBeGreaterThan(0);
      expect(consecutivos.some((c) => c.startsWith('NDA-'))).toBeFalse();
      expect(consecutivos).not.toContain('NDI-2026-000144');
      expect(consecutivos).toContain('NDI-2026-000145');
    });

    it('ordena por fecha descendente y pagina', () => {
      const todos = listar().content;
      const fechas = todos.map((r) => r.fechaRegistro);
      expect(fechas).toEqual([...fechas].sort().reverse());
      const primera = listar(0, 2);
      expect(primera.content.length).toBe(2);
      expect(primera.totalElements).toBe(todos.length);
      expect(listar(1, 2).content[0].codigo).toBe(todos[2].codigo);
    });

    it('no entrega datos internos: ni relato, ni reportante, ni decisión', () => {
      const texto = JSON.stringify(listar().content);
      expect(texto).not.toMatch(/hechos|reportante|INHIBITORIA|vinculacion|version|noticiaId/);
      const inhibitoria = listar().content.find((r) => r.consecutivo === 'NDI-2026-000140');
      expect(inhibitoria?.estado).toBe('Revisión finalizada');
    });

    it('marca como pendiente la solicitud sin responder, aunque esté vencida', () => {
      let detalle!: MiReporteDetalle;
      api.obtener(CODIGO_145).subscribe((d) => (detalle = d));
      expect(detalle.solicitudPendiente).toBeTrue();
      expect(detalle.solicitudInformacion?.vencida).toBeTrue();
      expect(detalle.estado).toBe('Información adicional solicitada');
    });

    it('un código que no es propio responde 404', () => {
      let error: ErrorUad | undefined;
      fallo(() => api.obtener(codigoReporteMock('NDI-2026-000144')).subscribe({ error: (e: ErrorUad) => (error = e) }));
      expect(error?.tipo).toBe('no-encontrado');
    });

    it('responder deja la respuesta visible para la UAD y la noticia en SUBSANACION_RECIBIDA', () => {
      let detalle!: MiReporteDetalle;
      api.responder(CODIGO_145, 'mock-sol-145', '  Ocurrió el 3 de noviembre.  ').subscribe((d) => (detalle = d));

      expect(detalle.solicitudPendiente).toBeFalse();
      expect(detalle.estado).toBe('En revisión');
      expect(detalle.solicitudInformacion?.respuesta).toBe('Ocurrió el 3 de noviembre.');

      const noticia = store.buscar('mock-ndi-145');
      expect(noticia?.estado).toBe('SUBSANACION_RECIBIDA');
      expect(noticia?.version).toBe(4);
      expect(noticia?.solicitudInformacion?.respuesta).toBe('Ocurrió el 3 de noviembre.');
      const ultimo = store.historial.get('mock-ndi-145')?.at(-1);
      expect(ultimo?.tipo).toBe('SUBSANACION_RECIBIDA');
      expect(ultimo?.profesional).toBeNull();
    });

    it('rechaza la respuesta vacía, la segunda respuesta y la solicitud de otro reporte', () => {
      const errores: (ErrorUad | undefined)[] = [];
      const capturar = { error: (e: ErrorUad) => errores.push(e) };

      api.responder(CODIGO_145, 'mock-sol-145', '   ').subscribe(capturar);
      expect(errores.at(-1)?.camposInvalidos['respuesta']).toBe('Escriba su respuesta.');
      expect(store.buscar('mock-ndi-145')?.estado).toBe('PENDIENTE_SUBSANACION');

      api.responder(CODIGO_145, 'otra-solicitud', 'Texto').subscribe(capturar);
      expect(errores.at(-1)?.tipo).toBe('no-encontrado');

      api.responder(CODIGO_145, 'mock-sol-145', 'Texto').subscribe();
      api.responder(CODIGO_145, 'mock-sol-145', 'Otra vez').subscribe(capturar);
      expect(errores.at(-1)?.codigo).toBe('SOLICITUD_YA_RESPONDIDA');
      expect(store.buscar('mock-ndi-145')?.solicitudInformacion?.respuesta).toBe('Texto');
    });

    it('no admite responder cuando la UAD ya decidió sobre la noticia', () => {
      const noticia = store.buscar('mock-ndi-145');
      if (noticia) noticia.estado = 'REMITIDA_POR_COMPETENCIA';
      let error: ErrorUad | undefined;
      api.responder(CODIGO_145, 'mock-sol-145', 'Texto').subscribe({ error: (e: ErrorUad) => (error = e) });
      expect(error?.codigo).toBe('SOLICITUD_NO_VIGENTE');
    });
  });

  describe('proveedores', () => {
    it('eligen el adaptador y declaran si los datos son simulados', () => {
      TestBed.configureTestingModule({ providers: [provideUadMisReportes('mock')] });
      expect(TestBed.inject(UadMisReportesPort) instanceof UadMisReportesMockAdapter).toBeTrue();
      expect(TestBed.inject(UAD_MIS_REPORTES_SIMULADO)).toBeTrue();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideUadMisReportes('http'), provideHttpClient(), provideHttpClientTesting()] });
      expect(TestBed.inject(UadMisReportesPort) instanceof UadMisReportesHttpAdapter).toBeTrue();
      expect(TestBed.inject(UAD_MIS_REPORTES_SIMULADO)).toBeFalse();
    });
  });
});
