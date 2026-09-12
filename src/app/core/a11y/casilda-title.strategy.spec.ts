import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { CasildaTitleStrategy, SUFIJO_TITULO } from './casilda-title.strategy';

describe('CasildaTitleStrategy', () => {
  let strategy: CasildaTitleStrategy;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    strategy = TestBed.inject(CasildaTitleStrategy);
    title = TestBed.inject(Title);
  });

  it('antepone el título de la ruta al sufijo institucional', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('Reporte anónimo de VBG');
    strategy.updateTitle({} as RouterStateSnapshot);
    expect(title.getTitle()).toBe(`Reporte anónimo de VBG | ${SUFIJO_TITULO}`);
  });

  it('usa solo el sufijo cuando la ruta no declara título', () => {
    spyOn(strategy, 'buildTitle').and.returnValue(undefined);
    strategy.updateTitle({} as RouterStateSnapshot);
    expect(title.getTitle()).toBe(SUFIJO_TITULO);
  });
});
