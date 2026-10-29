import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { ModalTelefonoComponent } from './modal-telefono.component';

describe('ModalTelefonoComponent', () => {
  let component: ModalTelefonoComponent;
  let fixture: ComponentFixture<ModalTelefonoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalTelefonoComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalTelefonoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el error cuando el teléfono no tiene 10 dígitos', async () => {
    component.tiposTelefono = [{ id: 1, nombre: 'Celular' }];
    component.data.tipoId = 1;
    component.onTipoChange(1);
    fixture.detectChanges();
    fixture.debugElement
      .query(By.css('input[name="telefonoVal"]'))
      .triggerEventHandler('input', { target: { value: '30012' } });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.data.telefono).toBe('30012');
    expect(fixture.nativeElement.textContent).toContain('El teléfono debe tener exactamente 10 dígitos');
  });
});
