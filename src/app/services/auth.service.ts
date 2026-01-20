import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

// Definimos la estructura de nuestros usuarios simulados
export interface UserSession {
  email: string;
  nombre: string;
  rol: 'Admin' | 'Revisor' | 'Usuario';
  foto: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private MOCK_USERS = [
    {
      email: 'admin@gmail.com', password: '123',
      data: { nombre: 'Super Administrador', rol: 'Admin', foto: 'https://i.pravatar.cc/150?u=1' }
    },
    {
      email: 'revisor@gmail.com', password: '123',
      data: { nombre: 'Carlos Revisor', rol: 'Revisor', foto: 'https://i.pravatar.cc/150?u=2' }
    },
    {
      email: 'user@gmail.com', password: '123',
      data: { nombre: 'Juan Ciudadano', rol: 'Usuario', foto: 'https://i.pravatar.cc/150?u=3' }
    }
  ];

  public currentUser: UserSession | null = null;

  constructor(private router: Router) {
    const savedUser = localStorage.getItem('userSession');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isAdmin() { return this.currentUser?.rol === 'Admin'; }
  isRevisor() { return this.currentUser?.rol === 'Revisor' || this.currentUser?.rol === 'Admin'; }
  isUsuario() { return this.currentUser?.rol === 'Usuario'; }

  loginWithCredentials(email: string, pass: string): boolean {
    const userFound = this.MOCK_USERS.find(u => u.email === email && u.password === pass);

    if (userFound) {
      this.currentUser = userFound.data as UserSession;
      localStorage.setItem('userSession', JSON.stringify(this.currentUser));
      
      // Redirigimos según el rol
      if (this.isAdmin()) {
          this.router.navigate(['/gestion-usuarios']);
      } else {
          this.router.navigate(['/dashboard-revisor']);
      }
      return true;
    } else {
      // Falló el login
      return false;
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('userSession');
    this.router.navigate(['/login']); // Al salir, lo mandamos al login
  }
}