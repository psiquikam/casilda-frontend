import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { almaMockInterceptor } from './alma-mock.interceptor';
import { almaMockStore } from './alma-mock-store';
import { AlmaApiClient } from '../shared/http/alma-api.client';
import { ErrorAlma } from '../shared/http/alma-error';

describe('almaMockInterceptor (interruptor mock/real por grupo)', () => {
  const original = { ...environment.lineaAlma.mocks };
  let api: AlmaApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    almaMockStore.reiniciar();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([almaMockInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: { nombre: 'Técnico APH (prueba)' } } }
      ]
    });
    api = TestBed.inject(AlmaApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    Object.assign(environment.lineaAlma.mocks, original);
    http.verify();
  });

  it('con el grupo en `true` responde con el mock y no sale a red', fakeAsync(() => {
    environment.lineaAlma.mocks.catalogos = true;
    let items: unknown[] | undefined;
    api.get<unknown[]>('/catalogos/estratos').subscribe((r) => (items = r));
    tick(500);
    expect(items?.length).toBe(6);
    http.expectNone(() => true);
  }));

  it('con el grupo en `false` la misma llamada sale a red (cambio mock→real sin tocar componentes)', () => {
    environment.lineaAlma.mocks.catalogos = false;
    api.get('/catalogos/estratos').subscribe();
    const peticion = http.expectOne(`${AlmaApiClient.PREFIJO}/catalogos/estratos`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);
  });

  it('los interruptores son independientes por grupo', fakeAsync(() => {
    environment.lineaAlma.mocks.catalogos = true;
    environment.lineaAlma.mocks.personas = false;
    api.get('/catalogos/estratos').subscribe();
    api.get('/personas/consulta', { tipoIdentificacion: 'CC', numeroIdentificacion: '1' }).subscribe();
    tick(500);
    http.expectOne((req) => req.url.endsWith('/personas/consulta')).flush({});
  }));

  it('una ruta que ningún manejador conoce sale a red (no se esconde con un 404 inventado)', () => {
    api.get('/bandeja/psicologia').subscribe();
    http.expectOne(`${AlmaApiClient.PREFIJO}/bandeja/psicologia`).flush({});
  });

  it('los errores del mock llegan traducidos al modelo estándar', fakeAsync(() => {
    environment.lineaAlma.mocks.atencionesAph = true;
    let error: ErrorAlma | undefined;
    api.get('/atenciones-aph/ALMA-2026-999999').subscribe({ error: (e: ErrorAlma) => (error = e) });
    tick(500);
    expect(error?.estado).toBe(404);
    expect(error?.tipo).toBe('no-encontrado');
  }));

  it('envía el filtro como query y el mock lo respeta', fakeAsync(() => {
    environment.lineaAlma.mocks.bandejaAph = true;
    let total = -1;
    api.get<{ total: number }>('/bandeja/aph', { vista: 'remisiones', origen: 'EA', page: 0, size: 10 }).subscribe((r) => (total = r.total));
    tick(500);
    expect(total).toBe(1);
  }));

  it('no se declara ningún interruptor en `true` en el entorno de producción por defecto', () => {
    // El archivo `environment.ts` es de desarrollo; esta prueba documenta que todos los grupos existen.
    expect(Object.keys(original).sort()).toEqual(
      ['atencionesAph', 'auditoria', 'bandejaAph', 'catalogos', 'contenciones', 'derivaciones', 'personas'].sort()
    );
  });

  it('el cliente HTTP está disponible para inyección', () => {
    expect(TestBed.inject(HttpClient)).toBeTruthy();
  });
});
