import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatIconTestingModule } from '@angular/material/icon/testing';

import { DashboardHomeComponent } from './dashboard-home.component';
import { AuthService } from '../../services/auth.service';

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
        provideHttpClientTesting()
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
});
