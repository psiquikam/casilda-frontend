import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatIconTestingModule } from '@angular/material/icon/testing';

import { DashboardHomeComponent } from './dashboard-home.component';
import { AuthService } from '../../services/auth.service';

registerLocaleData(localeEsCo);

/**
 * Este componente solo reparte entre las dos vistas. El contenido se prueba en
 * `panel-inicio.component.spec.ts` (personal) y en
 * `panel-usuario.component.spec.ts` (persona que solicita acompañamiento).
 */
describe('DashboardHomeComponent', () => {
  let fixture: ComponentFixture<DashboardHomeComponent>;
  let auth: AuthService;

  function conRol(rol: string): HTMLElement {
    auth.currentUser = { nombre: `Persona ${rol}`, email: 'x@udea.edu.co', rol, token: 't' };
    fixture = TestBed.createComponent(DashboardHomeComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHomeComponent, MatIconTestingModule],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'es-CO' }
      ]
    }).compileComponents();

    auth = TestBed.inject(AuthService);
  });

  it('should create', () => {
    expect(conRol('Admin')).toBeTruthy();
  });

  it('el personal ve el panel por zonas', () => {
    for (const rol of ['Admin', 'Coordinador', 'Profesional', 'Revisor']) {
      const vista = conRol(rol);
      expect(vista.querySelector('app-panel-inicio')).withContext(rol).not.toBeNull();
      expect(vista.querySelector('app-panel-usuario')).withContext(rol).toBeNull();
    }
  });

  it('la persona que solicita acompañamiento ve su propio espacio', () => {
    const vista = conRol('Usuario');

    expect(vista.querySelector('app-panel-usuario')).not.toBeNull();
    expect(vista.querySelector('app-panel-inicio')).toBeNull();
  });
});
