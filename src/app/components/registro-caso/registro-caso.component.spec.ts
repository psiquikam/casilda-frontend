import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RegistroCasoComponent } from './registro-caso.component';

describe('RegistroCasoComponent', () => {
  let component: RegistroCasoComponent;
  let fixture: ComponentFixture<RegistroCasoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroCasoComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RegistroCasoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format alphanumeric document with country code and uppercase', () => {
    component.casoForm.get('documento')?.enable();
    const mockInput = document.createElement('input');
    mockInput.value = 'vnz-123.456';
    const event = { target: mockInput } as unknown as Event;

    component.formatoDocumento(event);

    expect(mockInput.value).toBe('VNZ123456');
    expect(component.casoForm.get('documento')?.value).toBe('VNZ123456');
  });

  it('should allow up to 20 chars for foreign/alphanumeric document', () => {
    component.casoForm.get('documento')?.setValue('VNZ1234567890');
    expect(component.maxLongitudDocumento).toBe(20);
  });

  it('should open country codes catalog and prefix selected code', () => {
    const dialogSpy = spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => ({ subscribe: (fn: (val?: string) => void) => fn('VNZ') })
    } as any);

    component.casoForm.get('documento')?.setValue('123456');
    component.abrirCatalogoPaises();

    expect(dialogSpy).toHaveBeenCalled();
    expect(component.casoForm.get('documento')?.value).toBe('VNZ123456');
  });
});
