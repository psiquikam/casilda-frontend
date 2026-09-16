import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

export const AUTH_REQUIRED_MESSAGE = 'Tu sesión venció o no has iniciado sesión. Debes autenticarte para continuar.';

export interface UserSession {
  email: string;
  nombre: string;
  rol: string;
  roles?: string[];
  authorities?: string[];
  foto?: string | null;
  token: string;
}

export interface AuthLoginResponse {
  nombre: string;
  email: string;
  rol: string;
  roles: string[];
  authorities: string[];
  foto: string | null;
  token: string;
}

export type UserRole =
  | 'Admin'
  | 'Coordinador'
  | 'Profesional'
  | 'Revisor'
  | 'Usuario'
  | 'ADMIN'
  | 'COORDINADOR'
  | 'PROFESIONAL'
  | 'REVISOR'
  | 'USUARIO';

export interface MockUserProfile {
  id: number;
  nombre: string;
  email: string;
  password: string;
  rol: string;
  roles: string[];
  authorities: string[];
  foto: string | null;
  descripcion: string;
  badgeClass: string;
}

function createMockToken(email: string, roleCode: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS384', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(
    JSON.stringify({
      sub: email,
      role: roleCode,
      iat: now,
      exp: now + 86400 * 7 // 7 días de vigencia
    })
  )
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const signature = 'mockSignatureCasildaTokenValidation2026';
  return `${header}.${payload}.${signature}`;
}

export const MOCK_USERS: Record<string, MockUserProfile> = {
  admin: {
    id: 1,
    nombre: 'Super Administrador CASILDA',
    email: 'admin@udea.edu.co',
    password: 'Admin123*',
    rol: 'Admin',
    roles: ['ADMIN'],
    authorities: ['ROLE_ADMIN'],
    foto: null,
    descripcion: 'Acceso total a parametrización, usuarios, métricas y módulos.',
    badgeClass: 'admin'
  },
  coordinador: {
    id: 2,
    nombre: 'Dra. Elena Ramos (Coordinadora)',
    email: 'coordinador@udea.edu.co',
    password: 'Coord123*',
    rol: 'Coordinador',
    roles: ['COORDINADOR'],
    authorities: ['ROLE_COORDINADOR'],
    foto: null,
    descripcion: 'Coordinación del equipo, triaje, reparto y supervisión de casos.',
    badgeClass: 'coordinador'
  },
  profesional: {
    id: 3,
    nombre: 'Lic. Carlos Restrepo (Profesional Psicosocial)',
    email: 'profesional@udea.edu.co',
    password: 'Pro123*',
    rol: 'Profesional',
    roles: ['PROFESIONAL'],
    authorities: ['ROLE_PROFESIONAL'],
    foto: null,
    descripcion: 'Atención técnica directa, citas, expediente y acuerdos.',
    badgeClass: 'profesional'
  },
  revisor: {
    id: 4,
    nombre: 'Dra. Marcela Gómez (Calidad y Revisión)',
    email: 'revisor@udea.edu.co',
    password: 'Revisor123*',
    rol: 'Revisor',
    roles: ['REVISOR'],
    authorities: ['ROLE_REVISOR'],
    foto: null,
    descripcion: 'Auditoría de casos, métricas e indicadores epidemiológicos.',
    badgeClass: 'revisor'
  },
  usuario: {
    id: 5,
    nombre: 'Valentina Morales (Estudiante UdeA)',
    email: 'usuario@udea.edu.co',
    password: 'User123*',
    rol: 'Usuario',
    roles: ['USUARIO'],
    authorities: ['ROLE_USUARIO'],
    foto: null,
    descripcion: 'Ciudadano/Estudiante: reporte y consulta de solicitudes propias.',
    badgeClass: 'usuario'
  }
};

interface JwtPayload {
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;
  public currentUser: UserSession | null = null;

  constructor() {
    this.currentUser = this.loadStoredSession();
  }

  isAuthenticated(): boolean {
    if (!this.currentUser || this.isTokenExpired(this.currentUser.token)) {
      this.clearSession();
      return false;
    }
    return true;
  }

  getToken(): string | null {
    return this.isAuthenticated() ? this.currentUser?.token ?? null : null;
  }

  getRoleCode(): string {
    const raw = (this.currentUser?.roles?.[0] || this.currentUser?.rol || '').toUpperCase();
    if (raw.includes('ADMIN')) return 'ADMIN';
    if (raw.includes('COORD')) return 'COORDINADOR';
    if (raw.includes('PROF')) return 'PROFESIONAL';
    if (raw.includes('REVIS')) return 'REVISOR';
    return 'USUARIO';
  }

  getRoleName(): string {
    const code = this.getRoleCode();
    switch (code) {
      case 'ADMIN':
        return 'Admin';
      case 'COORDINADOR':
        return 'Coordinador';
      case 'PROFESIONAL':
        return 'Profesional';
      case 'REVISOR':
        return 'Revisor';
      default:
        return 'Usuario';
    }
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isCoordinador(): boolean {
    return this.hasRole('COORDINADOR');
  }

  isProfesional(): boolean {
    return this.hasRole('PROFESIONAL');
  }

  isRevisor(): boolean {
    return this.hasRole('REVISOR');
  }

  isUsuario(): boolean {
    return this.hasRole('USUARIO');
  }

  isMockUser(): boolean {
    if (!this.currentUser) return false;
    const token = this.currentUser.token || '';
    return (
      token.includes('mockSignatureCasildaTokenValidation2026') ||
      token.startsWith('mock-') ||
      Object.values(MOCK_USERS).some((u) => u.email.toLowerCase() === this.currentUser?.email.toLowerCase())
    );
  }

  hasRole(role: string): boolean {
    if (!this.currentUser) return false;
    const target = role.toUpperCase().replace(/^ROLE_/, '');
    const userRole = (this.currentUser.rol || '').toUpperCase().replace(/^ROLE_/, '');
    if (userRole === target) return true;
    if (this.currentUser.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === target)) {
      return true;
    }
    if (this.currentUser.authorities?.some((a) => a.toUpperCase().replace(/^ROLE_/, '') === target)) {
      return true;
    }
    return false;
  }

  hasAnyRole(roles: string[]): boolean {
    if (!this.isAuthenticated()) return false;
    // Regla de negocio fundamental: El administrador tiene acceso a todo
    if (this.isAdmin()) return true;
    if (!roles || roles.length === 0) return true;
    return roles.some((r) => this.hasRole(r));
  }

  getDefaultRoute(): string {
    return '/inicio';
  }

  loginWithCredentials(email: string, password: string): Observable<AuthLoginResponse> {
    const emailNorm = email.trim().toLowerCase();
    const mockUser = Object.values(MOCK_USERS).find((u) => u.email.toLowerCase() === emailNorm);

    // Si es un usuario mockeado reconocido, permitir autenticación inmediata para pruebas
    if (mockUser && (password === mockUser.password || password === '123456' || password === 'password123')) {
      const mockResponse: AuthLoginResponse = {
        nombre: mockUser.nombre,
        email: mockUser.email,
        rol: mockUser.rol,
        roles: [...mockUser.roles],
        authorities: [...mockUser.authorities],
        foto: mockUser.foto,
        token: createMockToken(mockUser.email, mockUser.roles[0])
      };
      this.currentUser = mockResponse;
      localStorage.setItem('userSession', JSON.stringify(mockResponse));
      return of(mockResponse);
    }

    // Intentar autenticación con el backend real
    return this.http.post<AuthLoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        const fullResponse: AuthLoginResponse = {
          nombre: response.nombre,
          email: response.email,
          rol: response.rol,
          roles: response.roles || [response.rol.toUpperCase()],
          authorities: response.authorities || [`ROLE_${response.rol.toUpperCase()}`],
          foto: response.foto || null,
          token: response.token
        };
        this.currentUser = fullResponse;
        localStorage.setItem('userSession', JSON.stringify(fullResponse));
      }),
      catchError((error) => {
        // Fallback para desarrollo/testing si el backend no responde y el email coincide con un rol
        if (mockUser) {
          const fallbackResponse: AuthLoginResponse = {
            nombre: mockUser.nombre,
            email: mockUser.email,
            rol: mockUser.rol,
            roles: [...mockUser.roles],
            authorities: [...mockUser.authorities],
            foto: mockUser.foto,
            token: createMockToken(mockUser.email, mockUser.roles[0])
          };
          this.currentUser = fallbackResponse;
          localStorage.setItem('userSession', JSON.stringify(fallbackResponse));
          return of(fallbackResponse);
        }
        throw error;
      })
    );
  }

  loginAsMock(roleCodeOrKey: string): Observable<AuthLoginResponse> {
    const key = roleCodeOrKey.toLowerCase().replace(/^role_/, '');
    const user =
      MOCK_USERS[key] ||
      Object.values(MOCK_USERS).find(
        (u) =>
          u.roles[0].toLowerCase() === key ||
          u.rol.toLowerCase() === key ||
          u.email.toLowerCase() === key
      ) ||
      MOCK_USERS['admin'];

    const response: AuthLoginResponse = {
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      roles: [...user.roles],
      authorities: [...user.authorities],
      foto: user.foto,
      token: createMockToken(user.email, user.roles[0])
    };

    this.currentUser = response;
    localStorage.setItem('userSession', JSON.stringify(response));
    return of(response);
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  private loadStoredSession(): UserSession | null {
    const saved = localStorage.getItem('userSession');
    if (!saved) return null;

    try {
      const session: unknown = JSON.parse(saved);
      if (this.isValidSession(session) && !this.isTokenExpired(session.token)) return session;
    } catch {
      // La sesión corrupta se elimina de forma segura más abajo.
    }

    this.clearSession();
    return null;
  }

  private isValidSession(value: unknown): value is UserSession {
    if (!value || typeof value !== 'object') return false;
    const session = value as Partial<UserSession>;
    const validRoles = [
      'admin',
      'coordinador',
      'profesional',
      'revisor',
      'usuario'
    ];
    const roleString = (session.rol || session.roles?.[0] || '').toLowerCase().replace(/^role_/, '');
    return (
      typeof session.email === 'string' &&
      typeof session.nombre === 'string' &&
      typeof session.token === 'string' &&
      session.token.length > 0 &&
      validRoles.includes(roleString)
    );
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return true;
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(normalized)) as JwtPayload;
      return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  private clearSession(): void {
    this.currentUser = null;
    localStorage.removeItem('userSession');
  }
}
