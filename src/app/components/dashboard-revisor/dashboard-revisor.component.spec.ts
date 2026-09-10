import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DashboardRevisorComponent } from './dashboard-revisor.component';

describe('DashboardRevisorComponent', () => {
  let component: DashboardRevisorComponent;
  let fixture: ComponentFixture<DashboardRevisorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRevisorComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardRevisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe incluir métricas de género diversas y no binarias', () => {
    const identidades = component.stats.genero.map(g => g.label);
    expect(identidades).toContain('Personas No Binarias');
    expect(identidades).toContain('Mujeres (Cis/Trans)');
    expect(identidades).toContain('Hombres (Cis/Trans)');
  });

  it('debe contener barritas de distribución por modalidades de violencia VBG', () => {
    expect(component.stats.modalidades.length).toBeGreaterThan(3);
    const labels = component.stats.modalidades.map(m => m.label);
    expect(labels).toContain('Violencia Psicológica');
    expect(labels).toContain('Discriminación por Género u Orientación');
  });
});
