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

});
