import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  const auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'logout']);
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    auth.getToken.and.returnValue('token-vigente');
    auth.logout.calls.reset();
    router.navigate.calls.reset();
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('cierra la sesión ante una respuesta 401', () => {
    http.get('/recurso-protegido').subscribe({ error: () => undefined });
    const request = controller.expectOne('/recurso-protegido');

    expect(request.request.headers.get('Authorization')).toBe('Bearer token-vigente');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalled();
  });

  it('conserva la sesión y redirige ante una respuesta 403', () => {
    http.get('/recurso-restringido').subscribe({ error: () => undefined });
    const request = controller.expectOne('/recurso-restringido');

    request.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/acceso-denegado']);
  });
});
