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
import { environment } from '../../../environments/environment';

registerLocaleData(localeEsCo);

/**
 * Tras la Subfase 2 este componente solo reparte entre dos vistas: el panel por
 * zonas del personal y la vista del rol Usuario. La lógica de panel se prueba
 * en `panel-inicio.component.spec.ts` y en los specs de cada widget.
 */
describe('DashboardHomeComponent', () => {
  let component: DashboardHomeComponent;
  let fixture: ComponentFixture<DashboardHomeComponent>;
  let authService: AuthService;

  function sesion(nombre: string, rol: string): void {
    authService.currentUser = { nombre, email: `${rol.toLowerCase()}@udea.edu.co`, rol, token: 'fake-token' };
    fixture.detectChanges();
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

    fixture = TestBed.createComponent(DashboardHomeComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    sesion('Admin UdeA', 'Admin');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('reparto por rol (DSH-12-01)', () => {
    it('el personal ve el panel por zonas, no la vista de Usuario', () => {
      sesion('Lic. Carlos Restrepo', 'Profesional');

      const vista = fixture.nativeElement as HTMLElement;
      expect(vista.querySelector('app-panel-inicio')).not.toBeNull();
      expect(vista.querySelector('.portal-usuario')).toBeNull();
    });

    it('el rol Usuario conserva su vista hasta la Subfase 4', () => {
      sesion('Valentina Morales', 'Usuario');

      const vista = fixture.nativeElement as HTMLElement;
      expect(vista.querySelector('.portal-usuario')).not.toBeNull();
      expect(vista.querySelector('app-panel-inicio')).toBeNull();
    });
  });

  describe('navegación duplicada retirada (DSH-04-01, DSH-01-03, DSH-01-05)', () => {
    it('ninguna vista conserva el buscador ni el conmutador de disposición', () => {
      for (const rol of ['Admin', 'Coordinador', 'Profesional', 'Revisor', 'Usuario']) {
        sesion(`Persona ${rol}`, rol);

        const vista = fixture.nativeElement as HTMLElement;
        expect(vista.querySelector('.search-box')).withContext(rol).toBeNull();
        expect(vista.querySelector('.layout-toggle-widget')).withContext(rol).toBeNull();
      }
    });

    it('el personal ya no ve la grilla de módulos ni las pestañas del panel', () => {
      sesion('Admin UdeA', 'Admin');

      const vista = fixture.nativeElement as HTMLElement;
      expect(vista.querySelector('.nav-tabs')).toBeNull();
      expect(vista.querySelector('.tools-grid')).toBeNull();
      expect(vista.textContent).not.toContain('Módulos de la Plataforma');
    });
  });

  // DSH-05-01 — contenido de crisis en la vista del rol Usuario
  describe('línea de orientación telefónica', () => {
    function configurarTelefono(valor: string): void {
      (component as unknown as { telefonoOrientacion: string }).telefonoOrientacion = valor;
      fixture.detectChanges();
    }

    it('el valor de environment no es publicable mientras no haya dato real', () => {
      expect(component.hayLineaOrientacion).toBeFalse();
      expect(environment.telefonoOrientacion).toBe('');
    });

    it('no muestra la línea en el banner sin número real', () => {
      sesion('Valentina Morales', 'Usuario');
      configurarTelefono('');

      const vista = fixture.nativeElement as HTMLElement;
      expect(vista.querySelector('.banner-ciudadano__help-box')).toBeNull();
      expect(vista.textContent).not.toContain('Línea de Orientación en Crisis');
    });

    it('rechaza un número de relleno aunque esté configurado', () => {
      sesion('Valentina Morales', 'Usuario');
      configurarTelefono('1234567890');

      const vista = fixture.nativeElement as HTMLElement;
      expect(component.hayLineaOrientacion).toBeFalse();
      expect(vista.querySelector('.banner-ciudadano__help-box')).toBeNull();
      expect(vista.textContent).not.toContain('1234567890');
    });

    it('muestra la línea cuando hay un número real', () => {
      sesion('Valentina Morales', 'Usuario');
      configurarTelefono('6042196000');

      const vista = fixture.nativeElement as HTMLElement;
      expect(component.hayLineaOrientacion).toBeTrue();
      expect(vista.querySelector('.banner-ciudadano__help-box')).not.toBeNull();
      expect(vista.textContent).toContain('6042196000');
    });
  });
});
