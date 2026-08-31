import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, UserSession } from './auth.service';

describe('AuthService', () => {
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

  const jwt = (expiresAt: number): string => {
    const payload = btoa(JSON.stringify({ exp: expiresAt }));
    return `header.${payload}.signature`;
  };

  const session = (expiresAt: number): UserSession => ({
    email: 'persona@udea.edu.co',
    nombre: 'Persona de prueba',
    rol: 'Usuario',
    token: jwt(expiresAt)
  });

  const createService = (): AuthService => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });
    return TestBed.inject(AuthService);
  };

  beforeEach(() => {
    localStorage.clear();
    router.navigate.calls.reset();
  });

  it('recupera una sesión vigente y reconoce el rol Usuario', () => {
    localStorage.setItem('userSession', JSON.stringify(session(Math.floor(Date.now() / 1000) + 3600)));

    const service = createService();

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isUsuario()).toBeTrue();
  });

  it('elimina una sesión corrupta sin interrumpir la aplicación', () => {
    localStorage.setItem('userSession', '{sesion-invalida');

    const service = createService();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('userSession')).toBeNull();
  });

  it('rechaza y elimina un token vencido', () => {
    localStorage.setItem('userSession', JSON.stringify(session(Math.floor(Date.now() / 1000) - 60)));

    const service = createService();

    expect(service.getToken()).toBeNull();
    expect(service.currentUser).toBeNull();
  });

  it('no considera Usuario a una persona sin sesión', () => {
    const service = createService();

    expect(service.isUsuario()).toBeFalse();
  });

  it('elige una ruta productiva de inicio según el rol', () => {
    const service = createService();

    service.currentUser = { ...session(Math.floor(Date.now() / 1000) + 3600), rol: 'Revisor' };
    expect(service.getDefaultRoute()).toBe('/consulta');

    service.currentUser = { ...service.currentUser, rol: 'Admin' };
    expect(service.getDefaultRoute()).toBe('/gestion-usuarios');

    service.currentUser = { ...service.currentUser, rol: 'Usuario' };
    expect(service.getDefaultRoute()).toBe('/solicitud-acompanamiento');
  });
});
