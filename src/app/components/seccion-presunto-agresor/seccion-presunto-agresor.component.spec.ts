import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { SeccionPresuntoAgresorComponent } from './seccion-presunto-agresor.component';

describe('SeccionPresuntoAgresorComponent', () => {
  let component: SeccionPresuntoAgresorComponent;
  let fixture: ComponentFixture<SeccionPresuntoAgresorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionPresuntoAgresorComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(SeccionPresuntoAgresorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formatea el nombre con las cuatro partes disponibles', () => {
    expect(component.formatearNombreAgresor({ primerNombre: 'Juan', primerApellido: 'Pérez' })).toBe('Juan Pérez');
  });

  it('usa "Desconocido" si no hay ningún nombre', () => {
    expect(component.formatearNombreAgresor({})).toBe('Desconocido');
  });

  it('agrega el resultado del modal y emite el cambio', () => {
    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of({ primerNombre: 'Ana', primerApellido: 'Gómez' })
    } as any);
    spyOn(component.agresoresRegistradosChange, 'emit');

    component.abrirModalAgresor();

    expect(component.agresoresRegistrados.length).toBe(1);
    expect(component.agresoresRegistradosChange.emit).toHaveBeenCalledWith(component.agresoresRegistrados);
  });

  it('elimina un agresor por índice y emite el cambio', () => {
    component.agresoresRegistrados = [{ primerNombre: 'Ana' }, { primerNombre: 'Luis' }];
    spyOn(component.agresoresRegistradosChange, 'emit');

    component.eliminarAgresor(0);

    expect(component.agresoresRegistrados.length).toBe(1);
    expect(component.agresoresRegistrados[0].primerNombre).toBe('Luis');
    expect(component.agresoresRegistradosChange.emit).toHaveBeenCalled();
  });
});
