import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export const AUTH_REQUIRED_MESSAGE = 'Tu sesión venció o no has iniciado sesión. Debes autenticarte para continuar.';

export interface UserSession {
  email: string;
  nombre: string;
  rol: string;
  foto?: string;
  token: string;
}

export interface AuthLoginResponse {
  nombre: string;
  email: string;
  rol: string;
  foto?: string;
  token: string;
}

type UserRole = 'Admin' | 'Revisor' | 'Usuario';

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

  isAdmin(): boolean { return this.currentUser?.rol === 'Admin'; }
  isRevisor(): boolean { return ['Admin', 'Revisor'].includes(this.currentUser?.rol ?? ''); }
  isUsuario(): boolean { return this.currentUser?.rol === 'Usuario'; }

  getDefaultRoute(): string {
    if (this.isAdmin()) return '/gestion-usuarios';
    if (this.currentUser?.rol === 'Revisor') return '/consulta';
    return '/solicitud-acompanamiento';
  }

  loginWithCredentials(email: string, password: string): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.currentUser = response;
        localStorage.setItem('userSession', JSON.stringify(response));
      })
    );
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
    const validRoles: UserRole[] = ['Admin', 'Revisor', 'Usuario'];
    return typeof session.email === 'string'
      && typeof session.nombre === 'string'
      && typeof session.token === 'string'
      && session.token.length > 0
      && typeof session.rol === 'string'
      && validRoles.includes(session.rol as UserRole);
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
