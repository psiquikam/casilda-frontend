import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DetalleAcompanamientoComponent } from './gestion-contacto.component';
import { AsignacionesService, SolicitudAsignada } from '../../services/asignaciones.service';
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
            listarContactos: () => of([]),
            obtenerUltimaCita: () => of({ fechaCita: null, estadoCita: null, tieneCitaProgramada: false })
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

  it('muestra la fecha y hora de reparto y no inventa la hora si falta', () => {
    const base = {
      id: 1, codigo: 'SOL-1', tipoSolicitud: 'Directa', estado: 'Asignada',
      fechaCreacion: '2026-11-01T10:00:00', fechaReparto: '2026-11-25',
      profesional: 'Equipo', tipoDocumento: 'CC', nombreSolicitante: 'Persona',
      documentoSolicitante: '1', esDemostracion: false, unidadAdministrativa: '', tipoAsignacion: '',
      numeroDocumento: '1', fechaNacimiento: null, primerNombre: '', segundoNombre: '',
      primerApellido: '', segundoApellido: '', identidadGenero: '', celular: '', telefonoAlterno: '',
      correoInstitucional: '', correoPersonal: '', nombreRemitente: null, remitenteTipoSolicitud: '',
      remitentePrimerNombre: '', remitenteSegundoNombre: '', remitentePrimerApellido: '',
      remitenteSegundoApellido: '', remitenteCargo: '', remitenteCampus: '',
      remitenteUnidadAdministrativa: '', remitenteUnidadAcademica: '', remitenteOtraUnidadAcademica: '',
      remitenteFechaSolicitud: '', remitenteTipoDocumento: '', remitenteNumeroDocumento: ''
    };
    component['procesarSolicitudes']({
      solicitudes: [
        { ...base, fechaHoraReparto: '2026-11-25T16:30:45' },
        { ...base, id: 2 }
      ],
      totalElementos: 2, pagina: 0, tamano: 10, usaDemostracion: false
    });
    expect(component.dataSourceAsignados.data[0].fecha).toBe('25/11/2026 16:30:45');
    expect(component.dataSourceAsignados.data[1].fecha).toBe('25/11/2026 (hora no disponible)');
  });

  it('muestra la última cita real y filtra por cita pendiente, sin confundir errores con ausencia', () => {
    const servicio = TestBed.inject(AsignacionesService);
    spyOn(servicio, 'obtenerUltimaCita').and.callFake((solicitud) => {
      if (solicitud.id === 1) {
        return of({ fechaCita: '2026-11-25T16:30:00', estadoCita: 'Cancelada', tieneCitaProgramada: true });
      }
      if (solicitud.id === 2) {
        return of({ fechaCita: null, estadoCita: null, tieneCitaProgramada: false });
      }
      return throwError(() => new Error('No disponible'));
    });
    const base = { id: 1, fechaCreacion: '', esDemostracion: false } as SolicitudAsignada;
    component['procesarSolicitudes']({
      solicitudes: [base, { ...base, id: 2 }, { ...base, id: 3 }],
      totalElementos: 3, pagina: 0, tamano: 10, usaDemostracion: false
    });
    expect(component.dataSourceAsignados.data[0].fechaCita).toBe('25/11/2026 16:30');
    expect(component.dataSourceAsignados.data[0].estadoCita).toBe('Cancelada');
    expect(component.dataSourceAsignados.data[2].citaError).toBeTrue();
    component.applySelectFilter('estadoCita', component.SIN_AGENDAR);
    expect(component.dataSourceAsignados.filteredData.map(fila => fila.id)).toEqual([2]);
  });
});
