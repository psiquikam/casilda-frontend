import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RegistroAtencionComponent } from './registro-atencion.component';

describe('RegistroAtencionComponent', () => {
  let component: RegistroAtencionComponent;
  let fixture: ComponentFixture<RegistroAtencionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroAtencionComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegistroAtencionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar los controles queForma y ambitoOcurrencia en atencionForm', () => {
    expect(component.atencionForm.contains('queForma')).toBeTrue();
    expect(component.atencionForm.contains('ambitoOcurrencia')).toBeTrue();
    expect(component.atencionForm.contains('ambitoOcurrenciaOtro')).toBeTrue();
  });

  it('esAmbitoOtro() debe devolver true cuando se selecciona Otro o el código otro-ambito', () => {
    component.catalogoAmbitoOcurrencia = [
      { id: 1, codigo: 'laboral', nombre: 'Laboral' },
      { id: 9, codigo: 'otro-ambito', nombre: 'Otro' }
    ];
    component.atencionForm.get('ambitoOcurrencia')?.setValue('Laboral');
    expect(component.esAmbitoOtro()).toBeFalse();

    component.atencionForm.get('ambitoOcurrencia')?.setValue('Otro');
    expect(component.esAmbitoOtro()).toBeTrue();
  });
});
