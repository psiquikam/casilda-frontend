import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalSeguimientosComponent } from './modal-seguimiento.component';

describe('ModalRemisionesComponent', () => {
  let component: ModalSeguimientosComponent;
  let fixture: ComponentFixture<ModalSeguimientosComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalSeguimientosComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalSeguimientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
    http.expectOne(req => req.url.endsWith('/tipos-seguimiento')).flush([]);
    http.expectOne(req => req.url.endsWith('/acciones')).flush([
      { id: 1, nombre: 'Primera acción', codigo: null },
      { id: 2, nombre: 'Segunda acción', codigo: null }
    ]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carga actividades por ID y descarta respuestas de una acción anterior', () => {
    component.seleccionarAccion(1);
    const primera = http.expectOne(req => req.url.endsWith('/actividades/por-accion/1'));
    component.seleccionarAccion(2);
    http.expectOne(req => req.url.endsWith('/actividades/por-accion/2'))
      .flush([{ id: 20, nombre: 'Actividad actual' }]);
    primera.flush([{ id: 10, nombre: 'Actividad anterior' }]);

    expect(component.actividades).toEqual([{ id: 20, nombre: 'Actividad actual' }]);
  });
});
