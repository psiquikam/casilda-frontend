import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatIconTestingModule } from '@angular/material/icon/testing';

import { PanelInicioComponent } from './panel-inicio.component';
import { AuthService } from '../../services/auth.service';
import { LATENCIA_MOCK_MS } from '../../services/dashboard-mock';
import { DashboardTrabajoService } from '../../services/dashboard-trabajo.service';
import { of } from 'rxjs';

registerLocaleData(localeEsCo);

describe('PanelInicioComponent', () => {
  let fixture: ComponentFixture<PanelInicioComponent>;
  let auth: AuthService;

  /** Deja pasar la latencia simulada del mock y repinta. */
  function resolverCarga(): void {
    tick(LATENCIA_MOCK_MS);
    fixture.detectChanges();
  }

  /**
   * Recrea el componente con otro rol. No basta reasignar `currentUser`: el
   * panel resuelve su rol al construirse, igual que en la aplicación, donde
   * cambiar de rol navega a `/inicio` y vuelve a crear el componente.
   */
  function comoRol(rol: string): void {
    auth.currentUser = { nombre: `Persona ${rol}`, email: 'x@udea.edu.co', rol, token: 't' };
    fixture = TestBed.createComponent(PanelInicioComponent);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelInicioComponent, MatIconTestingModule],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'es-CO' }
      ]
    }).compileComponents();

    // La sesión debe existir **antes** de construir el componente: el panel
    // resuelve su rol en los inicializadores de campo. En la aplicación lo
    // garantiza `authGuard`, que corre antes de instanciar la ruta.
    auth = TestBed.inject(AuthService);
    auth.currentUser = { nombre: 'Super Administrador CASILDA', email: 'a@udea.edu.co', rol: 'Admin', token: 't' };
    fixture = TestBed.createComponent(PanelInicioComponent);
    fixture.detectChanges();
  });

  it('tiene un único h1 y saluda con el nombre de pila (DSH-01-04, DSH-11-09)', () => {
    const panel = fixture.nativeElement as HTMLElement;
    const encabezados = panel.querySelectorAll('h1');

    expect(encabezados.length).toBe(1);
    expect(encabezados[0].textContent?.trim()).toBe('Hola, Super');
  });

  it('salta el tratamiento profesional al saludar', () => {
    comoRol('Coordinador');
    auth.currentUser = { nombre: 'Dra. Elena Ramos (Coordinadora)', email: 'c@udea.edu.co', rol: 'Coordinador', token: 't' };
    fixture = TestBed.createComponent(PanelInicioComponent);
    fixture.detectChanges();

    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Hola, Elena');
  });

  it('cada zona abre con un h2 (DSH-11-09)', () => {
    const panel = fixture.nativeElement as HTMLElement;
    expect(panel.querySelectorAll('h2').length).toBeGreaterThan(0);
  });

  it('declara que las cifras son simuladas mientras el flag esté activo (DSH-12-08)', () => {
    const franja = (fixture.nativeElement as HTMLElement).querySelector('.panel__demo');
    expect(franja?.textContent).toContain('Datos de demostración');
  });

  describe('zonas por rol', () => {
    it('el rol Profesional ve su agenda y no la distribución institucional', () => {
      comoRol('Profesional');

      const panel = fixture.nativeElement as HTMLElement;
      expect(panel.querySelector('app-widget-agenda-hoy')).not.toBeNull();
      expect(panel.querySelector('app-widget-distribucion-identidad')).toBeNull();
    });

    it('el rol Coordinador ve la carga del equipo', () => {
      comoRol('Coordinador');

      const panel = fixture.nativeElement as HTMLElement;
      expect(panel.querySelector('app-widget-carga-equipo')).not.toBeNull();
      expect(panel.querySelector('app-widget-agenda-hoy')).toBeNull();
    });

    it('todo rol de personal abre con los pendientes antes que los indicadores', () => {
      for (const rol of ['Admin', 'Coordinador', 'Profesional', 'Revisor']) {
        comoRol(rol);

        const orden = [...(fixture.nativeElement as HTMLElement).querySelectorAll('app-widget-pendientes, app-widget-kpis')]
          .map((e) => e.tagName.toLowerCase());
        expect(orden).withContext(rol).toEqual(['app-widget-pendientes', 'app-widget-kpis']);
      }
    });
  });

  describe('estados de las zonas (DSH-07-04)', () => {
    it('muestra el esqueleto mientras carga y lo anuncia', () => {
      const enCarga = (fixture.nativeElement as HTMLElement).querySelector('[aria-busy="true"]');
      expect(enCarga).not.toBeNull();
      expect(enCarga?.textContent).toContain('Cargando');
    });

    it('muestra los datos cuando la carga termina', fakeAsync(() => {
      // Dentro de `fakeAsync`, para que la latencia simulada se programe en la
      // zona falsa y `tick()` pueda vencerla.
      comoRol('Admin');
      resolverCarga();

      const panel = fixture.nativeElement as HTMLElement;
      expect(panel.querySelector('[aria-busy="true"]')).toBeNull();
      expect(panel.querySelectorAll('app-kpi-card').length).toBeGreaterThan(0);
    }));

    it('nunca muestra más de 4 indicadores por rol (DSH-P5)', fakeAsync(() => {
      comoRol('Admin');
      resolverCarga();

      expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-kpi-card').length).toBeGreaterThan(0);

      const tarjetas = (fixture.nativeElement as HTMLElement).querySelectorAll('app-kpi-card');
      expect(tarjetas.length).toBeLessThanOrEqual(4);
    }));

    it('nunca muestra más de 5 pendientes', fakeAsync(() => {
      comoRol('Coordinador');
      resolverCarga();

      const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.lista__item');
      expect(items.length).toBeLessThanOrEqual(5);
    }));
  });

  it('muestra un estado de error con reintento cuando la fuente falla', fakeAsync(() => {
    window.casildaForzarErrorPanel = true;
    try {
      comoRol('Admin');
      resolverCarga();

      const alerta = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
      expect(alerta).not.toBeNull();
      expect(alerta?.textContent).toContain('No pudimos cargar');
      expect(alerta?.querySelector('button')?.textContent).toContain('Intentar de nuevo');
    } finally {
      window.casildaForzarErrorPanel = undefined;
    }
  }));

  it('muestra un estado vacío amable cuando no hay pendientes (DSH-07-02)', fakeAsync(() => {
    // El rol Revisor tiene pendientes en el mock; se vacía la fuente para
    // comprobar que la zona nunca queda en blanco sin explicación.
    comoRol('Revisor');
    const trabajo = TestBed.inject(DashboardTrabajoService);
    spyOn(trabajo, 'obtenerPendientes').and.returnValue(of([]));

    comoRol('Revisor');
    resolverCarga();

    const zona = (fixture.nativeElement as HTMLElement).querySelector('app-widget-pendientes');
    expect(zona?.textContent).toContain('No tienes pendientes para hoy');
  }));

  it('identifica a las personas por radicado e iniciales, nunca por nombre (DSH-P6)', fakeAsync(() => {
    comoRol('Profesional');
    resolverCarga();

    const agenda = (fixture.nativeElement as HTMLElement).querySelector('app-widget-agenda-hoy');
    expect(agenda?.querySelectorAll('.tabla__radicado').length).toBeGreaterThan(0);
    // Las iniciales son de la forma «V. M.»: dos letras separadas por puntos.
    for (const celda of Array.from(agenda?.querySelectorAll('.tabla__iniciales') ?? [])) {
      expect(celda.textContent?.trim()).toMatch(/^[A-ZÁÉÍÓÚÑ]\.\s[A-ZÁÉÍÓÚÑ]\.$/);
    }
  }));
});
