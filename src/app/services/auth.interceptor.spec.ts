import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { DialogoService } from '../core/a11y/dialogo.service';

describe('authInterceptor', () => {
  const auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'logout']);
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  const dialogo = jasmine.createSpyObj<DialogoService>('DialogoService', ['aviso']);
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    auth.getToken.and.returnValue('token-vigente');
    auth.logout.calls.reset();
    router.navigate.calls.reset();
    dialogo.aviso.calls.reset();
    dialogo.aviso.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: DialogoService, useValue: dialogo }
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('cierra la sesión y avisa con un diálogo bloqueante ante una respuesta 401', () => {
    http.get('/recurso-protegido').subscribe({ error: () => undefined });
    const request = controller.expectOne('/recurso-protegido');

    expect(request.request.headers.get('Authorization')).toBe('Bearer token-vigente');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalled();
    expect(dialogo.aviso).toHaveBeenCalledWith(
      jasmine.objectContaining({ titulo: 'Sesión expirada' }),
      jasmine.objectContaining({ bloqueante: true })
    );
  });

  it('conserva la sesión y redirige ante una respuesta 403', () => {
    http.get('/recurso-restringido').subscribe({ error: () => undefined });
    const request = controller.expectOne('/recurso-restringido');

    request.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(auth.logout).not.toHaveBeenCalled();
    expect(dialogo.aviso).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/acceso-denegado']);
  });
});
