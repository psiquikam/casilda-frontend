import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AlertaGestionSimultaneaComponent } from './alerta-gestion-simultanea.component';

describe('AlertaGestionSimultaneaComponent (J-1.8)', () => {
  let fixture: ComponentFixture<AlertaGestionSimultaneaComponent>;

  function pintar(activa: boolean, numeroCaso: string | null = null): HTMLElement {
    TestBed.configureTestingModule({ imports: [AlertaGestionSimultaneaComponent, MatIconTestingModule] });
    fixture = TestBed.createComponent(AlertaGestionSimultaneaComponent);
    fixture.componentRef.setInput('activa', activa);
    fixture.componentRef.setInput('numeroCaso', numeroCaso);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('no pinta nada si no hay gestión simultánea', () => {
    expect(pintar(false).querySelector('.casilda-alerta')).toBeNull();
  });

  it('avisa con texto e ícono (el color no es el único portador de significado)', () => {
    const dom = pintar(true, 'CAS-2026-000010');
    const alerta = dom.querySelector('.casilda-alerta')!;
    expect(alerta.getAttribute('role')).toBe('status');
    expect(alerta.textContent).toContain('CAS-2026-000010');
    expect(alerta.textContent).toContain('Equipo de Atención');
    expect(alerta.querySelector('mat-icon')?.getAttribute('aria-hidden')).toBe('true');
  });
});
