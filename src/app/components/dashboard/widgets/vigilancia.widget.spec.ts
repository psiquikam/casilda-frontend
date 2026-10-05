import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatIconTestingModule } from '@angular/material/icon/testing';

import { VigilanciaWidget } from './vigilancia.widget';
import { LATENCIA_MOCK_MS } from '../../../services/dashboard-mock';
import { UMBRAL_SUPRESION } from '../../../core/vigilancia/supresion-celdas';

registerLocaleData(localeEsCo);

describe('VigilanciaWidget', () => {
  let fixture: ComponentFixture<VigilanciaWidget>;
  let componente: VigilanciaWidget;

  function resolver(): void {
    tick(LATENCIA_MOCK_MS);
    fixture.detectChanges();
  }

  function dom(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VigilanciaWidget, MatIconTestingModule],
      providers: [provideNoopAnimations(), { provide: LOCALE_ID, useValue: 'es-CO' }]
    }).compileComponents();

    fixture = TestBed.createComponent(VigilanciaWidget);
    componente = fixture.componentInstance;
  });

  it('ofrece los tres filtros del contrato con etiqueta asociada (§4.5)', fakeAsync(() => {
    fixture.detectChanges();
    resolver();

    for (const id of ['filtro-periodo', 'filtro-sede', 'filtro-dependencia']) {
      const campo = dom().querySelector(`#${id}`);
      expect(campo).withContext(id).not.toBeNull();
      expect(dom().querySelector(`label[for="${id}"]`)).withContext(id).not.toBeNull();
    }
  }));

  it('presenta la tabla como representación primaria, no como alternativa (DSH-03-03)', fakeAsync(() => {
    fixture.detectChanges();
    resolver();

    const tabla = dom().querySelector('table');
    expect(tabla).not.toBeNull();
    expect(tabla?.getAttribute('aria-label')).toContain('identidad de género');
    expect(tabla?.querySelectorAll('th[scope="col"]').length).toBe(3);
    expect(tabla?.querySelectorAll('th[scope="row"]').length).toBeGreaterThan(0);
  }));

  it('mantiene la barra fuera del árbol de accesibilidad: es decorativa', fakeAsync(() => {
    fixture.detectChanges();
    resolver();

    expect(dom().querySelector('.barra')?.getAttribute('aria-hidden')).toBe('true');
  }));

  it('declara el total y la fecha de corte (DSH-09-02, DSH-02-05)', fakeAsync(() => {
    fixture.detectChanges();
    resolver();

    expect(dom().querySelector('caption')?.textContent).toContain('corte');
  }));

  describe('supresión de celdas pequeñas (DSH-03-04, DSH-09-01)', () => {
    it('sin filtrar, ningún grupo queda suprimido', fakeAsync(() => {
      fixture.detectChanges();
      resolver();

      expect(componente.datos()?.conSupresion).toBeFalse();
      expect(dom().querySelector('.nota-privacidad')).toBeNull();
    }));

    it('al cruzar sede y dependencia oculta los conteos identificables', fakeAsync(() => {
      fixture.detectChanges();
      resolver();

      componente.filtros = { periodo: 'ultimos-30', sede: 'oriente', dependencia: 'educacion' };
      componente.alCambiarFiltro();
      resolver();

      const datos = componente.datos();
      expect(datos?.conSupresion).withContext('debe suprimir al filtrar').toBeTrue();

      const suprimidos = datos?.grupos.filter((g) => g.suprimida) ?? [];
      expect(suprimidos.length).toBeGreaterThanOrEqual(2);
      for (const grupo of suprimidos) {
        expect(grupo.casos).toBeNull();
        expect(grupo.proporcion).toBeNull();
      }
    }));

    it('muestra «< N» en lugar del conteo y explica por qué', fakeAsync(() => {
      fixture.detectChanges();
      resolver();

      componente.filtros = { periodo: 'ultimos-30', sede: 'oriente', dependencia: 'educacion' };
      componente.alCambiarFiltro();
      resolver();

      expect(dom().querySelector('.tabla__suprimida')?.textContent).toContain(`< ${UMBRAL_SUPRESION}`);

      const nota = dom().querySelector('.nota-privacidad');
      expect(nota?.textContent).toContain('identificar a las personas');
    }));

    it('explica la celda oculta también a lectores de pantalla', fakeAsync(() => {
      fixture.detectChanges();
      resolver();

      componente.filtros = { periodo: 'ultimos-30', sede: 'oriente', dependencia: 'educacion' };
      componente.alCambiarFiltro();
      resolver();

      const oculto = dom().querySelector('.tabla__suprimida .visually-hidden');
      expect(oculto?.textContent).toContain('Dato oculto');
    }));

    it('nunca publica un conteo por debajo del umbral en el DOM', fakeAsync(() => {
      fixture.detectChanges();
      resolver();

      componente.filtros = { periodo: 'ultimos-30', sede: 'urabá', dependencia: 'educacion' };
      componente.alCambiarFiltro();
      resolver();

      for (const grupo of componente.datos()?.grupos ?? []) {
        if (grupo.casos !== null && grupo.casos > 0) {
          expect(grupo.casos).toBeGreaterThanOrEqual(UMBRAL_SUPRESION);
        }
      }
    }));
  });
});
