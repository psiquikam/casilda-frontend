import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DetalleAcompanamientoComponent } from './gestion-contacto.component';
import { AsignacionesService } from '../../services/asignaciones.service';
import { NotificacionService } from '../../core/a11y/notificacion.service';

describe('DetalleAcompanamientoComponent', () => {
  let component: DetalleAcompanamientoComponent;
  let fixture: ComponentFixture<DetalleAcompanamientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleAcompanamientoComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AsignacionesService,
          useValue: {
            listar: () => of({
              solicitudes: [], totalElementos: 0, pagina: 0, tamano: 10, usaDemostracion: false
            }),
            obtener: () => of({
              solicitudes: [], totalElementos: 0, pagina: 0, tamano: 10, usaDemostracion: false
            }),
            listarContactos: () => of([])
          }
        },
        { provide: NotificacionService, useValue: { error: () => undefined, info: () => undefined } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetalleAcompanamientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
