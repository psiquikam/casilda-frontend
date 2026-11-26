import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { SolicitudService } from './solicitud.service';

describe('SolicitudService', () => {
  let service: SolicitudService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SolicitudService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(SolicitudService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('solicita el orden de reparto solo cuando se indica', () => {
    service.listarPaginadas(1, 10, undefined, true).subscribe();
    const reparto = http.expectOne(req => req.url === `${environment.apiBaseUrl}/solicitudes/acompanamiento/paginado`);
    expect(reparto.request.params.get('ordenReparto')).toBe('true');
    reparto.flush({});

    service.listarPaginadas(0, 10).subscribe();
    const normal = http.expectOne(req => req.url === `${environment.apiBaseUrl}/solicitudes/acompanamiento/paginado`);
    expect(normal.request.params.has('ordenReparto')).toBeFalse();
    normal.flush({});
  });

  it('envía cada pestaña visible de atención al endpoint correspondiente', () => {
    const rutas = [
      '/casos/pestana/0',
      '/atenciones/pestana/5',
      '/casos/pestana/4',
      '/atenciones/pestana/6',
      '/atenciones/pestana/7',
      '/atenciones/pestana/9',
      '/atenciones/pestana/10',
      '/atenciones/pestana/11'
    ];

    rutas.forEach((ruta, tabIndex) => {
      const datos = { tabIndex };
      service.registrarPestanaAtencion(tabIndex, datos).subscribe();

      const request = http.expectOne(`${environment.apiBaseUrl}${ruta}`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(datos);
      request.flush({});
    });
  });

  it('envía los compromisos, seguimientos y estado de primera atención a sus endpoints', () => {
    ['/atenciones/pestana/9', '/atenciones/pestana/10', '/atenciones/pestana/11']
      .forEach((ruta, indice) => {
        service.registrarPestana(indice + 8, {}).subscribe();
        const request = http.expectOne(`${environment.apiBaseUrl}${ruta}`);
        expect(request.request.method).toBe('POST');
        request.flush({});
      });
  });

  it('rechaza índices de pestaña que no existen en el formulario de atención', () => {
    expect(() => service.registrarPestanaAtencion(8, {}))
      .toThrowError('Pestaña de Equipo de Atención no soportada: 8');
  });
});
