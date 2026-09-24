import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';

import { ModalCodigosPaisComponent } from './modal-codigos-pais.component';

describe('ModalCodigosPaisComponent', () => {
  let component: ModalCodigosPaisComponent;
  let fixture: ComponentFixture<ModalCodigosPaisComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ModalCodigosPaisComponent>>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ModalCodigosPaisComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: mockDialogRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalCodigosPaisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.paises.length).toBeGreaterThan(0);
  });

  it('should filter countries by query', () => {
    component.filtro = 'Venezuela';
    component.aplicarFiltro();
    expect(component.paisesFiltrados.some(p => p.codigo === 'VNZ' || p.codigo === 'VEN')).toBeTrue();

    component.filtro = 'ECU';
    component.aplicarFiltro();
    expect(component.paisesFiltrados.length).toBe(1);
    expect(component.paisesFiltrados[0].codigo).toBe('ECU');
  });

  it('should reset filter', () => {
    component.filtro = 'ECU';
    component.aplicarFiltro();
    expect(component.paisesFiltrados.length).toBe(1);

    component.limpiarFiltro();
    expect(component.filtro).toBe('');
    expect(component.paisesFiltrados.length).toBe(component.paises.length);
  });

  it('should close dialog with selected country code', () => {
    component.seleccionar('VNZ');
    expect(mockDialogRef.close).toHaveBeenCalledWith('VNZ');
  });

  it('should close dialog with undefined when cerrar is called', () => {
    component.cerrar();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});
