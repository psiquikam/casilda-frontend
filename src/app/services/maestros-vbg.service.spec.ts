import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificacionService } from '../core/a11y/notificacion.service';
import { environment } from '../../environments/environment';
import { MaestrosVbgService } from './maestros-vbg.service';

describe('MaestrosVbgService', () => {
  const modoOriginal = environment.datosDemostracion;
  afterEach(() => { environment.datosDemostracion = modoOriginal; });

  it('no usa IDs de respaldo para rutas cuando falla el servidor', () => {
    environment.datosDemostracion = false;
    const notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', ['error']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificacionService, useValue: notificacion }
      ]
    });

    let resultado: unknown;
    TestBed.inject(MaestrosVbgService).obtenerCatalogo('rutas-internas')
      .subscribe(items => resultado = items);
    TestBed.inject(HttpTestingController)
      .expectOne(req => req.url.endsWith('/rutas-internas'))
      .flush('Error', { status: 500, statusText: 'Error' });

    expect(resultado).toEqual([]);
    expect(notificacion.error).toHaveBeenCalled();
  });
});
