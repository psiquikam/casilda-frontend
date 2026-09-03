import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';

import { QuickExitComponent } from './quick-exit.component';
import { QuickExitService } from '../../core/security/quick-exit.service';

describe('QuickExitComponent', () => {
  let fixture: ComponentFixture<QuickExitComponent>;
  let component: QuickExitComponent;
  let quickExit: jasmine.SpyObj<QuickExitService>;

  beforeEach(async () => {
    quickExit = jasmine.createSpyObj<QuickExitService>('QuickExitService', ['ejecutar']);

    await TestBed.configureTestingModule({
      imports: [QuickExitComponent, MatIconTestingModule],
      providers: [{ provide: QuickExitService, useValue: quickExit }]
    }).compileComponents();

    fixture = TestBed.createComponent(QuickExitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe exponer un botón con nombre accesible y atajos declarados', () => {
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-escape');

    expect(boton).toBeTruthy();
    expect(boton.getAttribute('aria-label')).toContain('Salida rápida');
    expect(boton.getAttribute('aria-keyshortcuts')).toBe('Alt+Q Escape');
  });

  it('debe ejecutar la salida al hacer clic', () => {
    fixture.nativeElement.querySelector('button.btn-escape').click();

    expect(quickExit.ejecutar).toHaveBeenCalledTimes(1);
  });

  it('debe ejecutar la salida con Alt + Q', () => {
    component.manejarAtajo(new KeyboardEvent('keydown', { key: 'q', altKey: true }));

    expect(quickExit.ejecutar).toHaveBeenCalledTimes(1);
  });

  it('debe ejecutar la salida con doble Escape en menos de un segundo', () => {
    component.manejarAtajo(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(quickExit.ejecutar).not.toHaveBeenCalled();

    component.manejarAtajo(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(quickExit.ejecutar).toHaveBeenCalledTimes(1);
  });

  it('no debe ejecutar la salida con un solo Escape', () => {
    component.manejarAtajo(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(quickExit.ejecutar).not.toHaveBeenCalled();
  });
});
