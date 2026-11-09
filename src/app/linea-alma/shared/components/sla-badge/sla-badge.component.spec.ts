import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SlaDto } from '../../types/alma-dto';
import { SlaBadgeComponent } from './sla-badge.component';

/** J-0.3 — el semáforo lleva ícono y texto, y evalúa con la hora del servidor. */
describe('SlaBadgeComponent', () => {
  let fixture: ComponentFixture<SlaBadgeComponent>;
  const HORA = 3_600_000;
  const ahoraServidor = '2026-11-06T09:15:00-05:00';

  function pintar(sla: SlaDto, compacto = false): HTMLElement {
    TestBed.configureTestingModule({ imports: [SlaBadgeComponent, MatIconTestingModule] });
    fixture = TestBed.createComponent(SlaBadgeComponent);
    fixture.componentRef.setInput('sla', sla);
    fixture.componentRef.setInput('compacto', compacto);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function slaCon(restanteHoras: number, horasLimite = 12): SlaDto {
    return { horasLimite, venceEn: new Date(Date.parse(ahoraServidor) + restanteHoras * HORA).toISOString(), ahoraServidor };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('verde: queda más de la mitad del plazo, con el texto «Quedan…»', () => {
    const dom = pintar(slaCon(10));
    const chip = dom.querySelector('.sla')!;
    expect(chip.classList).toContain('sla--verde');
    expect(chip.textContent).toContain('Quedan 10 h');
    expect(chip.textContent).toContain('12 h');
    expect(chip.getAttribute('aria-label')).toContain('Dentro del plazo');
  });

  it('amarillo: entre el 50 % y el 20 %', () => {
    const chip = pintar(slaCon(4)).querySelector('.sla')!;
    expect(chip.classList).toContain('sla--amarillo');
  });

  it('rojo y «Vencido hace…» cuando ya pasó la hora límite del servidor', () => {
    const chip = pintar(slaCon(-2)).querySelector('.sla')!;
    expect(chip.classList).toContain('sla--rojo');
    expect(chip.textContent).toContain('Vencido hace 2 h');
    expect(chip.querySelector('mat-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('en modo compacto omite el detalle de horas límite', () => {
    const chip = pintar(slaCon(10), true).querySelector('.sla')!;
    expect(chip.textContent).not.toContain('· 12 h');
  });
});
