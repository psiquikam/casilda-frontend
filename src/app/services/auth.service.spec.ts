import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, UserSession, MOCK_USERS } from './auth.service';

describe('AuthService', () => {
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

  const jwt = (expiresAt: number): string => {
    const payload = btoa(JSON.stringify({ exp: expiresAt }));
    return `header.${payload}.signature`;
  };

  const session = (expiresAt: number, rol: string = 'Usuario'): UserSession => ({
    email: 'persona@udea.edu.co',
    nombre: 'Persona de prueba',
    rol: rol,
    roles: [rol.toUpperCase()],
    authorities: [`ROLE_${rol.toUpperCase()}`],
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
    localStorage.setItem('userSession', JSON.stringify(session(Math.floor(Date.now() / 1000) + 3600, 'Usuario')));

    const service = createService();

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isUsuario()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
    expect(service.getRoleCode()).toBe('USUARIO');
    expect(service.getRoleName()).toBe('Usuario');
  });

  it('reconoce adecuadamente los 5 roles del sistema', () => {
    const service = createService();

    // 1. Admin
    service.currentUser = session(Math.floor(Date.now() / 1000) + 3600, 'Admin');
    expect(service.isAdmin()).toBeTrue();
    expect(service.hasAnyRole(['Usuario', 'Revisor'])).toBeTrue(); // Admin tiene acceso a todo

    // 2. Coordinador
    service.currentUser = session(Math.floor(Date.now() / 1000) + 3600, 'Coordinador');
    expect(service.isCoordinador()).toBeTrue();
    expect(service.hasRole('COORDINADOR')).toBeTrue();
    expect(service.hasRole('ROLE_COORDINADOR')).toBeTrue();
    expect(service.isAdmin()).toBeFalse();

    // 3. Profesional
    service.currentUser = session(Math.floor(Date.now() / 1000) + 3600, 'Profesional');
    expect(service.isProfesional()).toBeTrue();
    expect(service.hasRole('PROFESIONAL')).toBeTrue();
    expect(service.hasAnyRole(['Profesional', 'Coordinador'])).toBeTrue();
    expect(service.hasAnyRole(['Admin'])).toBeFalse();

    // 4. Revisor
    service.currentUser = session(Math.floor(Date.now() / 1000) + 3600, 'Revisor');
    expect(service.isRevisor()).toBeTrue();
    expect(service.hasRole('REVISOR')).toBeTrue();

    // 5. Usuario
    service.currentUser = session(Math.floor(Date.now() / 1000) + 3600, 'Usuario');
    expect(service.isUsuario()).toBeTrue();
    expect(service.hasRole('USUARIO')).toBeTrue();
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

  it('dirige al panel de inicio unificado según rol', () => {
    const service = createService();

    service.currentUser = session(Math.floor(Date.now() / 1000) + 3600, 'Revisor');
    expect(service.getDefaultRoute()).toBe('/inicio');

    service.currentUser = session(Math.floor(Date.now() / 1000) + 3600, 'Admin');
    expect(service.getDefaultRoute()).toBe('/inicio');

    service.currentUser = session(Math.floor(Date.now() / 1000) + 3600, 'Usuario');
    expect(service.getDefaultRoute()).toBe('/inicio');

    service.currentUser = session(Math.floor(Date.now() / 1000) + 3600, 'Coordinador');
    expect(service.getDefaultRoute()).toBe('/inicio');

    service.currentUser = session(Math.floor(Date.now() / 1000) + 3600, 'Profesional');
    expect(service.getDefaultRoute()).toBe('/inicio');
  });

  it('permite iniciar sesión con usuario mockeado', (done) => {
    const service = createService();

    service.loginAsMock('coordinador').subscribe((res) => {
      expect(res.email).toBe(MOCK_USERS['coordinador'].email);
      expect(res.rol).toBe('Coordinador');
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.isCoordinador()).toBeTrue();
      expect(localStorage.getItem('userSession')).toBeTruthy();
      done();
    });
  });
});
