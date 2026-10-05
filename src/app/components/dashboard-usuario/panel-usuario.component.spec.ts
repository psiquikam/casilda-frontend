import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of } from 'rxjs';

import { PanelUsuarioComponent } from './panel-usuario.component';
import { AuthService } from '../../services/auth.service';
import { MiProcesoService } from '../../services/mi-proceso.service';
import { LATENCIA_MOCK_MS } from '../../services/dashboard-mock';
import { environment } from '../../../environments/environment';

registerLocaleData(localeEsCo);

/**
 * Esta vista la consulta alguien que puede estar atravesando una situación de
 * violencia, acompañada por quien la ejerce o en un dispositivo compartido.
 * Las pruebas de aquí no verifican estética: verifican que no se filtre nada
 * que pueda ponerla en riesgo o reexponerla (§5 del contrato).
 */
describe('PanelUsuarioComponent', () => {
  let fixture: ComponentFixture<PanelUsuarioComponent>;
  let componente: PanelUsuarioComponent;

  function dom(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function resolver(): void {
    tick(LATENCIA_MOCK_MS);
    fixture.detectChanges();
  }

  function crear(): void {
    fixture = TestBed.createComponent(PanelUsuarioComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelUsuarioComponent, MatIconTestingModule],
      providers: [provideNoopAnimations(), provideRouter([]), { provide: LOCALE_ID, useValue: 'es-CO' }]
    }).compileComponents();

    TestBed.inject(AuthService).currentUser = {
      nombre: 'Valentina Morales (Estudiante UdeA)',
      email: 'usuario@udea.edu.co',
      rol: 'Usuario',
      token: 't'
    };
  });

  it('saluda con el nombre de la persona, sin el dato del sistema', () => {
    crear();

    const h1 = dom().querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Hola, Valentina');
    expect(dom().querySelectorAll('h1').length).toBe(1);
  });

  // ==========================================================================
  // §5.2 — Qué NO debe mostrar
  // ==========================================================================
  describe('lo que esta vista nunca muestra', () => {
    it('no muestra cifras, estadísticas ni gráficos institucionales (DSH-10-08)', fakeAsync(() => {
      crear();
      resolver();

      expect(dom().querySelector('app-kpi-card')).toBeNull();
      expect(dom().querySelector('.barra')).toBeNull();
      expect(dom().querySelector('table')).toBeNull();
      for (const palabra of ['casos activos', 'total institucional', '%']) {
        expect(dom().textContent?.toLowerCase()).not.toContain(palabra);
      }
    }));

    it('no usa jerga del sistema (DSH-10-11)', fakeAsync(() => {
      crear();
      resolver();

      const texto = (dom().textContent ?? '').toLowerCase();
      for (const jerga of ['radicado', 'expediente', 'bandeja', 'triaje', 'cas-2026']) {
        expect(texto).withContext(jerga).not.toContain(jerga);
      }
    }));

    it('no usa el vocabulario que la guía de lenguaje descarta (§5.3)', fakeAsync(() => {
      crear();
      resolver();

      const texto = (dom().textContent ?? '').toLowerCase();
      for (const palabra of ['víctima', 'denuncia', 'agresor', 'debes ']) {
        expect(texto).withContext(palabra).not.toContain(palabra);
      }
    }));

    it('no fabrica urgencias ni contadores (DSH-10-12)', fakeAsync(() => {
      crear();
      resolver();

      const texto = dom().textContent ?? '';
      expect(texto).not.toContain('!');
      expect(texto).not.toMatch(/\bTienes \d+\b/);
    }));

    it('no muestra grillas de módulos (DSH-10-11)', fakeAsync(() => {
      crear();
      resolver();

      expect(dom().querySelector('.tools-grid')).toBeNull();
      expect(dom().querySelector('nav')).toBeNull();
    }));
  });

  // ==========================================================================
  // §5.1 — Qué SÍ debe mostrar
  // ==========================================================================
  describe('lo que esta vista acompaña', () => {
    it('dice cómo va el proceso, qué sigue y quién lo hace (DSH-10-01)', fakeAsync(() => {
      crear();
      resolver();

      const texto = dom().textContent ?? '';
      expect(texto).toContain('Cómo va tu proceso');
      expect(texto).toContain('De esto se encarga');
    }));

    it('no promete plazos mientras no estén confirmados (DSH-10-01, P-13)', fakeAsync(() => {
      crear();
      resolver();

      // Una promesa incumplida a quien espera ayuda hace más daño que su ausencia.
      expect(componente.proceso()?.estado.plazo).toBeNull();
      expect(dom().textContent).not.toMatch(/\bd[ií]as h[áa]biles\b/);
    }));

    it('muestra la próxima sesión con opción de pedir otro horario (DSH-10-02)', fakeAsync(() => {
      crear();
      resolver();

      expect(dom().textContent).toContain('Tu próxima sesión');
      expect(dom().textContent).toContain('Pedir otro horario');
    }));

    it('presenta los acuerdos en tono de acompañamiento, sin presión (DSH-10-03)', fakeAsync(() => {
      crear();
      resolver();

      expect(dom().textContent).toContain('Lo que acordamos');
      expect(dom().textContent).toContain('No hay prisa');
    }));

    it('declara el canal que la persona eligió (DSH-10-06)', fakeAsync(() => {
      crear();
      resolver();

      expect(dom().textContent).toContain('Cómo nos comunicamos contigo');
      expect(dom().textContent).toContain('Cambiar cómo te contactamos');
    }));

    it('ofrece un estado vacío cálido cuando no hay cita', fakeAsync(() => {
      const servicio = TestBed.inject(MiProcesoService);
      spyOn(servicio, 'obtenerMiProceso').and.returnValue(
        of({
          estado: { id: 'x', resumen: 'r', siguientePaso: 's', loHace: 'El equipo de Casilda' as const, plazo: null },
          proximaCita: null,
          compromisos: [],
          preferencias: { canal: 'Llamada' as const, franjaHoraria: 'mañanas', sePuedeDejarMensaje: false }
        })
      );
      crear();

      expect(dom().textContent).toContain('Aquí verás tu próxima sesión cuando la acordemos contigo');
    }));
  });

  // ==========================================================================
  // §5.4 y §5.5 — Seguridad, privacidad y diseño
  // ==========================================================================
  describe('seguridad y privacidad', () => {
    it('las líneas de ayuda son enlaces que se pueden marcar (DSH-10-05)', fakeAsync(() => {
      crear();
      resolver();

      expect(dom().querySelector('a[href="tel:155"]')).not.toBeNull();
      expect(dom().querySelector('a[href="tel:123"]')).not.toBeNull();
    }));

    it('no publica la línea de la UdeA mientras no haya número real (DSH-05-01)', fakeAsync(() => {
      crear();
      resolver();

      expect(environment.telefonoOrientacion).toBe('');
      expect(componente.hayLineaOrientacion).toBeFalse();
      expect(dom().textContent).not.toContain('1234567890');
    }));

    it('explica que la salida rápida no borra todo el historial (DSH-06-04)', fakeAsync(() => {
      crear();
      resolver();

      const texto = dom().textContent ?? '';
      expect(texto).toContain('no borra todo el historial');
      expect(texto.toLowerCase()).toContain('incógnito');
    }));

    it('no guarda nada de la persona en localStorage (DSH-10-14)', fakeAsync(() => {
      const escribir = spyOn(Storage.prototype, 'setItem').and.callThrough();
      crear();
      resolver();

      expect(escribir).not.toHaveBeenCalled();
    }));

    it('el texto corrido no baja de 16 px (§5.5)', fakeAsync(() => {
      crear();
      resolver();

      for (const parrafo of Array.from(dom().querySelectorAll('.tarjeta__texto'))) {
        expect(parseFloat(getComputedStyle(parrafo).fontSize)).toBeGreaterThanOrEqual(16);
      }
    }));

    it('escribe los encabezados en la serif institucional', fakeAsync(() => {
      crear();
      resolver();

      for (const encabezado of Array.from(dom().querySelectorAll('h1, h2'))) {
        expect(getComputedStyle(encabezado).fontFamily).toContain('Lora');
      }
    }));
  });
});
