import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HorizontalNavComponent } from './horizontal-nav.component';
import { AuthService } from '../../../services/auth.service';

describe('HorizontalNavComponent', () => {
  let component: HorizontalNavComponent;
  let fixture: ComponentFixture<HorizontalNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorizontalNavComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HorizontalNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Línea Alma como desplegable', () => {
    /** JWT con expiración futura: con un token inválido `isAuthenticated()` cierra la sesión a mitad del render. */
    const jwtVigente = (): string => `cabecera.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.firma`;

    function conRol(rol: string): HTMLElement {
      const auth = TestBed.inject(AuthService);
      auth.currentUser = { email: 'prueba@udea.edu.co', nombre: 'Prueba', rol, roles: [rol], authorities: [`ROLE_${rol}`], token: jwtVigente() };
      fixture.destroy();
      fixture = TestBed.createComponent(HorizontalNavComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    const escritorio = (el: HTMLElement) => el.querySelector('.hnav-desktop') as HTMLElement;

    it('ADMIN ve un solo botón «Línea Alma» y ningún enlace suelto del módulo en la barra', () => {
      const barra = escritorio(conRol('ADMIN'));
      const boton = barra.querySelector('button[aria-label="Abrir menú de Línea Alma"]');
      expect(boton).not.toBeNull();
      const sueltos = Array.from(barra.querySelectorAll('a.hnav-link')).map((a) => a.getAttribute('href') ?? '');
      expect(sueltos.some((href) => href.startsWith('/linea-alma'))).toBeFalse();
    });

    it('el Técnico APH también ve el desplegable', () => {
      expect(escritorio(conRol('TECNICO_APH')).querySelector('button[aria-label="Abrir menú de Línea Alma"]')).not.toBeNull();
    });

    it('el rol Usuario no ve Línea Alma', () => {
      expect(escritorio(conRol('USUARIO')).querySelector('button[aria-label="Abrir menú de Línea Alma"]')).toBeNull();
    });

    it('el botón se marca activo dentro del módulo', () => {
      conRol('ADMIN');
      (component as unknown as { urlActual: { set(v: string): void } }).urlActual.set('/linea-alma/aph/remisiones');
      fixture.detectChanges();
      const boton = escritorio(fixture.nativeElement).querySelector('button[aria-label="Abrir menú de Línea Alma"]')!;
      expect(boton.classList).toContain('hnav-item--active');
    });

    it('en móvil, Línea Alma es un grupo plegable con sus opciones dentro', () => {
      conRol('ADMIN');
      component.toggleMobileMenu();
      fixture.detectChanges();
      const grupos = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.hnav-mobile-group-header')).map((b) => b.textContent ?? '');
      expect(grupos.some((t) => t.includes('Línea Alma'))).toBeTrue();
      expect(component.isSectionExpanded('alma')).toBeTrue();
    });
  });
});
