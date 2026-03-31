import { Injectable } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;
  public currentUser: UserSession | null = null;

  constructor(private http: HttpClient, private router: Router) {
    const saved = localStorage.getItem('userSession');
    if (saved) this.currentUser = JSON.parse(saved);
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  getToken(): string | null {
    return this.currentUser?.token ?? null;
  }

  isAdmin(): boolean { return this.currentUser?.rol === 'Admin'; }
  isRevisor(): boolean { return ['Admin', 'Revisor'].includes(this.currentUser?.rol ?? ''); }
  isUsuario(): boolean { return !this.isRevisor(); }

  loginWithCredentials(email: string, password: string): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.currentUser = response;
        localStorage.setItem('userSession', JSON.stringify(response));
      })
    );
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('userSession');
    this.router.navigate(['/login']);
  }
}
