import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { NotaAtencionDto } from '../../types/alma-dto';
import { NotasTimelineComponent } from './notas-timeline.component';

registerLocaleData(localeEsCo);

const nota = (idNota: string, tipoOrigen: NotaAtencionDto['tipoOrigen'], contenido: string, fechaRegistro: string): NotaAtencionDto => ({
  idNota,
  tipoOrigen,
  contenido,
  fechaRegistro,
  autor: 'Autor de prueba'
});

describe('NotasTimelineComponent', () => {
  let fixture: ComponentFixture<NotasTimelineComponent>;

  function pintar(notas: NotaAtencionDto[]): string {
    fixture.componentRef.setInput('notas', notas);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NotasTimelineComponent], providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }] });
    fixture = TestBed.createComponent(NotasTimelineComponent);
  });

  it('muestra las notas APH y las de después del cierre', () => {
    const texto = pintar([
      nota('1', 'APH', 'Nota APH visible', '2026-11-06T09:00:00-05:00'),
      nota('2', 'POST_CIERRE', 'Contención visible', '2026-11-06T10:00:00-05:00')
    ]);
    expect(texto).toContain('Nota APH visible');
    expect(texto).toContain('Contención visible');
  });

  it('nunca muestra notas clínicas de Psicología ni seguimientos al rol APH (defensa en profundidad, R4)', () => {
    const texto = pintar([
      nota('1', 'APH', 'Nota APH', '2026-11-06T09:00:00-05:00'),
      nota('2', 'PSICO', 'Contenido clínico reservado', '2026-11-06T10:00:00-05:00'),
      nota('3', 'SEGTO', 'Seguimiento clínico reservado', '2026-11-06T11:00:00-05:00')
    ]);
    expect(texto).not.toContain('Contenido clínico reservado');
    expect(texto).not.toContain('Seguimiento clínico reservado');
  });

  it('ordena de la más reciente a la más antigua', () => {
    pintar([
      nota('1', 'APH', 'Primera', '2026-11-06T09:00:00-05:00'),
      nota('2', 'APH', 'Segunda', '2026-11-06T12:00:00-05:00')
    ]);
    const items = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('li')).map((li) => li.textContent ?? '');
    expect(items[0]).toContain('Segunda');
    expect(items[1]).toContain('Primera');
  });

  it('con un rol que sí puede ver notas clínicas, respeta los tipos que se le pasen', () => {
    fixture.componentRef.setInput('tiposVisibles', ['APH', 'PSICO']);
    const texto = pintar([nota('2', 'PSICO', 'Visible para Psicología', '2026-11-06T10:00:00-05:00')]);
    expect(texto).toContain('Visible para Psicología');
  });

  it('sin notas muestra un estado vacío', () => {
    expect(pintar([])).toContain('Todavía no hay notas');
  });
});
