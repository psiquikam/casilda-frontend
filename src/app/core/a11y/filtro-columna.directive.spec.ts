import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FiltroColumnaDirective } from './filtro-columna.directive';

@Component({
  imports: [FiltroColumnaDirective],
  template: `<input appFiltroColumna="ID de caso" placeholder="Filtrar">`
})
class AnfitrionComponent {}

describe('FiltroColumnaDirective', () => {
  let input: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AnfitrionComponent] });
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  it('expone un nombre accesible contextual a la columna', () => {
    expect(input.getAttribute('aria-label')).toBe('Filtrar por ID de caso');
  });

  it('declara semántica de búsqueda sin autocompletado', () => {
    expect(input.type).toBe('search');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.classList).toContain('filtro-columna');
  });
});
