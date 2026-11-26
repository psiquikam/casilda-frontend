import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { NotificacionService } from '../../core/a11y/notificacion.service';
import { ModalDiscapacidadComponent } from './modal-discapacidad.component';

describe('ModalDiscapacidadComponent', () => {
  let fixture: ComponentFixture<ModalDiscapacidadComponent>;
  let http: HttpTestingController;
  let notificacion: jasmine.SpyObj<NotificacionService>;

  beforeEach(async () => {
    notificacion = jasmine.createSpyObj('NotificacionService', ['error']);
    await TestBed.configureTestingModule({
      imports: [ModalDiscapacidadComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: NotificacionService, useValue: notificacion }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalDiscapacidadComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('muestra un solo desplegable y permite agregar una discapacidad sin observación', () => {
    http.expectOne(req => req.url.endsWith('/tipo-discapacidad'))
      .flush([{ id: 5, nombre: 'Clasificación funcional' }]);
    http.expectOne(req => req.url.endsWith('/subtipo-discapacidad/5'))
      .flush([{ id: 14, nombre: 'Persona ciega' }]);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-confirm');
    expect(fixture.nativeElement.querySelectorAll('mat-select').length).toBe(1);
    expect(button.disabled).toBeTrue();

    fixture.componentInstance.onSubTipoChange(14);
    fixture.detectChanges();
    expect(button.disabled).toBeFalse();
    expect(fixture.componentInstance.data).toEqual({
      tipo: 'Clasificación funcional',
      subTipo: 'Persona ciega',
      descripcion: '',
      idSubTipoDiscapacidad: 14
    });
  });

  it('informa si el catálogo no está configurado', () => {
    http.expectOne(req => req.url.endsWith('/tipo-discapacidad'))
      .flush([{ id: 1, nombre: 'Física o Motora' }]);
    fixture.detectChanges();

    expect(notificacion.error).toHaveBeenCalledWith('El catálogo de discapacidad aún no está configurado.');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-confirm');
    expect(button.disabled).toBeTrue();
  });

  it('informa si falla la carga de las opciones', () => {
    http.expectOne(req => req.url.endsWith('/tipo-discapacidad'))
      .flush([{ id: 5, nombre: 'Clasificación funcional' }]);
    http.expectOne(req => req.url.endsWith('/subtipo-discapacidad/5'))
      .flush('Error', { status: 500, statusText: 'Error' });
    expect(notificacion.error).toHaveBeenCalledWith('No fue posible cargar las discapacidades.', jasmine.anything());
  });
});
