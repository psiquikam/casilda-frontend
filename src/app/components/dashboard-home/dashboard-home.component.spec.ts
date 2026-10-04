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

// El `LOCALE_ID` es-CO se provee en `app.config.ts`, que no interviene en las
// pruebas unitarias: sin registrarlo aquí, los pipes caerían a en-US y las
// aserciones de formato regional no comprobarían nada (DSH-02-06, DSH-11-08).
registerLocaleData(localeEsCo);

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
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'es-CO' }
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
      expect(panel.textContent).not.toContain('Línea de orientación telefónica');
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
      expect(panel.textContent).toContain('Línea de orientación telefónica');
      expect(panel.textContent).toContain('6042196000');
    });

    it('conserva las líneas 155 y 123 aunque no haya línea propia de la UdeA', () => {
      component.activeTab = 'protocolos';
      configurarTelefono('');

      const panel = fixture.nativeElement as HTMLElement;
      expect(panel.textContent).toContain('Línea nacional');
      expect(panel.querySelector('a[href="tel:155"]')).not.toBeNull();
      expect(panel.querySelector('a[href="tel:123"]')).not.toBeNull();
    });
  });

  // ==========================================================================
  // Subfase 1 — correcciones transversales
  // ==========================================================================
  describe('formato regional (DSH-01-02, DSH-02-06)', () => {
    it('escribe la fecha en español y en minúscula, sin «capitalize»', () => {
      const fecha = (fixture.nativeElement as HTMLElement).querySelector('.user-greeting__date');

      expect(fecha?.textContent?.trim()).toMatch(/^[a-záéíóúñ]+, \d{1,2} de [a-záéíóúñ]+ de \d{4}$/);
      expect(getComputedStyle(fecha as Element).textTransform).toBe('none');
    });

    it('formatea los porcentajes con coma decimal, no con punto', () => {
      const insignias = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.kpi-card__badge')]
        .map((e) => e.textContent?.trim() ?? '');

      // Lo que importa es el separador decimal que impone es-CO: coma, no punto.
      // El espacio antes del «%» lo decide CLDR, no el componente.
      expect(insignias).toContain('30,8%');
      expect(insignias.join(' ')).not.toContain('30.8');
    });

    it('entrega los porcentajes como número, nunca como cadena con formato', () => {
      for (const kpi of component.summaryStats.kpis) {
        if ('porcentaje' in kpi) expect(typeof kpi.porcentaje).toBe('number');
      }
      for (const grupo of component.summaryStats.diversidad) {
        expect(typeof grupo.porcentaje).toBe('number');
        expect(grupo.porcentaje).toBeLessThanOrEqual(1);
      }
      for (const kpi of component.kpisRevisor) {
        expect(typeof kpi.valor).toBe('number');
      }
    });
  });

  describe('jerarquía tipográfica (DSH-04-07)', () => {
    it('tiene un único h1 y lo escribe en la serif institucional', () => {
      const encabezados = (fixture.nativeElement as HTMLElement).querySelectorAll('h1');

      expect(encabezados.length).toBe(1);
      expect(getComputedStyle(encabezados[0]).fontFamily).toContain('Lora');
    });

    it('no fuerza la sans en ningún encabezado h2 o h3', () => {
      const encabezados = (fixture.nativeElement as HTMLElement).querySelectorAll('h2, h3');

      expect(encabezados.length).toBeGreaterThan(0);
      for (const encabezado of Array.from(encabezados)) {
        expect(getComputedStyle(encabezado).fontFamily).toContain('Lora');
      }
    });
  });

  describe('el rol aparece una sola vez (DSH-01-01)', () => {
    it('el saludo ya no repite el nombre del rol', () => {
      const panel = fixture.nativeElement as HTMLElement;

      expect(panel.querySelector('.user-greeting__role-badge')).toBeNull();
      expect(panel.querySelector('.user-greeting__meta')?.textContent).not.toContain('Admin');
    });

    it('el catálogo de módulos no lleva el rol en su título', () => {
      component.activeTab = 'herramientas';
      fixture.detectChanges();

      const titulo = (fixture.nativeElement as HTMLElement).querySelector('.tools-intro__title');
      expect(titulo?.textContent?.trim()).toBe('Módulos disponibles para tu perfil');
    });
  });
});
