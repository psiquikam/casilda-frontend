import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { ModalCorreoComponent } from './modal-correo.component';

describe('ModalCorreoComponent', () => {
  let component: ModalCorreoComponent;
  let fixture: ComponentFixture<ModalCorreoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCorreoComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalCorreoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe rechazar correo institucional si no termina en @udea.edu.co', () => {
    component.tiposCorreo = [
      { id: 1, nombre: 'Correo Institucional' },
      { id: 2, nombre: 'Correo Personal' }
    ];
    component.data.tipoId = 1;
    component.onTipoChange(1);

    component.data.correo = 'usuario@gmail.com';
    expect(component.isValidEmail(component.data.correo)).toBeFalse();
    expect(component.canSubmit).toBeFalse();

    component.data.correo = 'usuario@udea.edu.co';
    expect(component.isValidEmail(component.data.correo)).toBeTrue();
    expect(component.canSubmit).toBeTrue();
  });

  it('debe aceptar correo personal con dominios estándar', () => {
    component.tiposCorreo = [
      { id: 1, nombre: 'Correo Institucional' },
      { id: 2, nombre: 'Correo Personal' }
    ];
    component.data.tipoId = 2;
    component.onTipoChange(2);

    component.data.correo = 'persona@gmail.com';
    expect(component.isValidEmail(component.data.correo)).toBeTrue();
    expect(component.canSubmit).toBeTrue();
  });

  it('debe mostrar el error de dominio institucional en el formulario', async () => {
    component.tiposCorreo = [{ id: 1, nombre: 'Correo institucional' }];
    component.data.tipoId = 1;
    component.onTipoChange(1);
    fixture.detectChanges();
    fixture.debugElement
      .query(By.css('input[name="correoVal"]'))
      .triggerEventHandler('input', { target: { value: 'usuario@gmail.com' } });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.data.correo).toBe('usuario@gmail.com');
    expect(fixture.nativeElement.textContent).toContain('El correo institucional debe ser del dominio @udea.edu.co');
  });
});
