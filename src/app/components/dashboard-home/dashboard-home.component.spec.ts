import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatIconTestingModule } from '@angular/material/icon/testing';

import { DashboardHomeComponent } from './dashboard-home.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('DashboardHomeComponent', () => {
  let component: DashboardHomeComponent;
  let fixture: ComponentFixture<DashboardHomeComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHomeComponent, MatIconTestingModule],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHomeComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    authService.currentUser = {
      nombre: 'Admin UdeA',
      email: 'admin@udea.edu.co',
      rol: 'Admin',
      token: 'fake-token'
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar con 5 etapas en el flujo de caso', () => {
    expect(component.workflowSteps.length).toBe(5);
    expect(component.workflowSteps[0].title).toBe('Recepción y Radicación');
  });

  it('debe permitir cambiar de etapa en la guía interactiva', () => {
    expect(component.selectedStepIndex).toBe(0);
    component.selectStep(2);
    expect(component.selectedStepIndex).toBe(2);
  });

  it('debe filtrar herramientas en tiempo real según el término de búsqueda', () => {
    component.searchQuery = 'cita';
    const resultados = component.filteredTools;
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados.some(t => t.id === 'cita')).toBeTrue();
  });

  it('debe excluir herramientas exclusivas de admin si el usuario no tiene rol Admin', () => {
    authService.currentUser = {
      nombre: 'Revisor UdeA',
      email: 'revisor@udea.edu.co',
      rol: 'Revisor',
      token: 'fake-token'
    };
    fixture.detectChanges();

    const tools = component.filteredTools;
    expect(tools.some(t => t.id === 'usuarios')).toBeFalse();
    expect(tools.some(t => t.id === 'maestros')).toBeFalse();
  });

  it('debe incluir herramientas de administración si el usuario tiene rol Admin', () => {
    authService.currentUser = {
      nombre: 'Admin UdeA',
      email: 'admin@udea.edu.co',
      rol: 'Admin',
      token: 'fake-token'
    };
    fixture.detectChanges();

    const tools = component.filteredTools;
    expect(tools.some(t => t.id === 'usuarios')).toBeTrue();
    expect(tools.some(t => t.id === 'maestros')).toBeTrue();
  });

  // ==========================================================================
  // DSH-05-01 — Línea de orientación telefónica (contenido de crisis)
  // ==========================================================================
  describe('línea de orientación telefónica', () => {
    /** Reemplaza el valor de solo lectura tomado de `environment` al construirse. */
    function configurarTelefono(valor: string): void {
      (component as unknown as { telefonoOrientacion: string }).telefonoOrientacion = valor;
      fixture.detectChanges();
    }

    function comoUsuario(): void {
      authService.currentUser = {
        nombre: 'Valentina Morales',
        email: 'usuario@udea.edu.co',
        rol: 'Usuario',
        token: 'fake-token'
      };
    }

    it('el valor configurado en environment no es publicable mientras no haya dato real', () => {
      // Red de seguridad: si alguien repone un número de relleno como
      // «1234567890», esta prueba falla antes de llegar a producción.
      expect(component.hayLineaOrientacion).toBeFalse();
      expect(environment.telefonoOrientacion).toBe('');
    });

    it('no muestra la línea en el banner del rol Usuario sin número real', () => {
      comoUsuario();
      configurarTelefono('');

      const banner = fixture.nativeElement as HTMLElement;
      expect(banner.querySelector('.banner-ciudadano__help-box')).toBeNull();
      expect(banner.textContent).not.toContain('Línea de Orientación en Crisis');
    });

    it('no muestra la línea en la pestaña de protocolos sin número real', () => {
      component.activeTab = 'protocolos';
      configurarTelefono('');

      const panel = fixture.nativeElement as HTMLElement;
      expect(panel.textContent).not.toContain('Línea de Orientación Telefónica');
    });

    it('rechaza un número de relleno aunque esté configurado', () => {
      comoUsuario();
      configurarTelefono('1234567890');

      const banner = fixture.nativeElement as HTMLElement;
      expect(component.hayLineaOrientacion).toBeFalse();
      expect(banner.querySelector('.banner-ciudadano__help-box')).toBeNull();
      expect(banner.textContent).not.toContain('1234567890');
    });

    it('muestra la línea en el banner cuando hay un número real', () => {
      comoUsuario();
      configurarTelefono('6042196000');

      const banner = fixture.nativeElement as HTMLElement;
      expect(component.hayLineaOrientacion).toBeTrue();
      expect(banner.querySelector('.banner-ciudadano__help-box')).not.toBeNull();
      expect(banner.textContent).toContain('6042196000');
    });

    it('muestra la línea en la pestaña de protocolos cuando hay un número real', () => {
      component.activeTab = 'protocolos';
      configurarTelefono('6042196000');

      const panel = fixture.nativeElement as HTMLElement;
      expect(panel.textContent).toContain('Línea de Orientación Telefónica');
      expect(panel.textContent).toContain('6042196000');
    });

    it('conserva las líneas 155 y 123 aunque no haya línea propia de la UdeA', () => {
      component.activeTab = 'protocolos';
      configurarTelefono('');

      const panel = fixture.nativeElement as HTMLElement;
      expect(panel.textContent).toContain('Línea Nacional 155');
      expect(panel.textContent).toContain('Línea 123');
    });
  });
});
