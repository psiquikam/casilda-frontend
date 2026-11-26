import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

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
        provideHttpClientTesting(),
        provideRouter([])
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

  it('no envía discapacidades vacías ni conserva las de otro caso', async () => {
    component.discapacidadesRegistradas = [{ idSubTipoDiscapacidad: 1 }];
    component.iniciarAtencion({ casoId: 1 });
    const request = await component['construirRegistroAtencionRequest'](0);
    expect(request.discapacidades).toBeUndefined();
  });

  it('guarda la atención de seguimiento sin pedir consentimiento', fakeAsync(() => {
    component.iniciarAtencion({ casoId: 1, citaId: 2 });
    component.catalogoTiposServicio = [{ id: 3, nombre: 'Jurídica' }];
    component.atencionForm.patchValue({ tipoServicio: 'Jurídica' });
    const guardar = spyOn(component['registroVbgDatos'], 'registrarPestanaAtencion').and.returnValue(of({ id: 5 }));
    spyOn(component['dialog'], 'open');

    component.guardarAtencion(1);
    flushMicrotasks();
    expect(guardar).toHaveBeenCalledWith(1, jasmine.objectContaining({
      casoId: 1, citaId: 2, idTipoServicio: 3, archivoConsentimientoContenido: undefined
    }), 1, 2);
    expect(component.atencionId).toBe(5);
  }));

  it('distingue la primera atención del seguimiento por el código, no por el ID interno', () => {
    expect(component.esCasoConCodigo({ codigo: ' CAS-12 ' })).toBeTrue();
    expect(component.esCasoConCodigo({ codigo: '' })).toBeFalse();
    expect(component.esCasoConCodigo({})).toBeFalse();
  });

  it('pone el estado junto al ID y oculta la unidad administrativa de la tabla', () => {
    expect(component.displayedColumnsTablaInicial.slice(1, 3)).toEqual(['id', 'etapa']);
    expect(component.displayedColumnsTablaInicial).not.toContain('unidadAdministrativa');
  });

  it('el filtro de seguimiento excluye los registros que todavía no tienen código de caso', () => {
    component.dataSource.data = [
      { id: '', tieneCodigoCaso: false, profesional: 'Sin asignar', estadoCaso: 'Abierto' },
      { id: 'CAS-12', tieneCodigoCaso: true, profesional: 'Profesional', estadoCaso: 'Abierto' }
    ];

    component.cambiarFiltroEtapa('seguimiento');
    expect(component.dataSource.filteredData.map((caso) => caso.id)).toEqual(['CAS-12']);
  });

  it('mantiene los filtros de estado y etapa combinados', () => {
    component.dataSource.data = [
      { id: 'CAS-12', tieneCodigoCaso: true, profesional: 'Profesional', estadoCaso: 'Cerrado' },
      { id: 'CAS-13', tieneCodigoCaso: true, profesional: 'Profesional', estadoCaso: 'Abierto' },
      { id: '', tieneCodigoCaso: false, profesional: 'Sin asignar', estadoCaso: 'Abierto' }
    ];

    component.cambiarFiltroEtapa('seguimiento');
    component.cambiarFiltroEstado('cerrado');
    expect(component.dataSource.filteredData.map((caso) => caso.id)).toEqual(['CAS-12']);
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
