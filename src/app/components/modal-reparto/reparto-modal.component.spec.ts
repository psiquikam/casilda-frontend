import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { RepartoModalComponent } from './modal-reparto.component';
import { SolicitudService } from '../../services/solicitud.service';

describe('RepartoModalComponent', () => {
  let component: RepartoModalComponent;
  let fixture: ComponentFixture<RepartoModalComponent>;
  let solicitudService: jasmine.SpyObj<SolicitudService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<RepartoModalComponent>>;

  beforeEach(async () => {
    solicitudService = jasmine.createSpyObj<SolicitudService>('SolicitudService', [
      'listarTiposAsignacion',
      'listarTiposServicio',
      'listarGruposProfesionales',
      'asignar'
    ]);
    solicitudService.listarTiposAsignacion.and.returnValue(of([
      { id: 1, nombre: 'Prioritaria' },
      { id: 2, nombre: 'Ordinaria' },
      { id: 3, nombre: 'Seguimiento' }
    ]));
    solicitudService.listarTiposServicio.and.returnValue(of([
      { id: 1, nombre: 'Psicología' },
      { id: 2, nombre: 'Asesoría Jurídica' }
    ]));
    solicitudService.listarGruposProfesionales.and.returnValue(of([
      { id: 7, nombre: 'Psicología 1', activo: true },
      { id: 8, nombre: 'Grupo inactivo', activo: false }
    ]));
    solicitudService.asignar.and.returnValue(of({ id: 4, tipoAsignacion: 'Prioritaria' } as any));
    dialogRef = jasmine.createSpyObj<MatDialogRef<RepartoModalComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [RepartoModalComponent],
      providers: [
        provideNoopAnimations(),
        { provide: SolicitudService, useValue: solicitudService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { id: 'SOL-4', solicitudId: 4 } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RepartoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carga los catálogos reales y muestra los grupos activos', () => {
    expect(component.tiposAsignacion.map(tipo => tipo.nombre)).toEqual([
      'Prioritaria',
      'Ordinaria',
      'Seguimiento'
    ]);
    expect(component.tiposServicio.map(tipo => tipo.nombre)).toEqual([
      'Psicología',
      'Asesoría Jurídica'
    ]);
    expect(component.gruposProfesionalesDisponibles).toEqual([
      { id: 7, nombre: 'Psicología 1', activo: true }
    ]);
    expect(solicitudService.listarTiposServicio).toHaveBeenCalled();
    expect(solicitudService.listarGruposProfesionales).toHaveBeenCalled();
  });

  it('requiere seleccionar servicio antes de habilitar los grupos', () => {
    const grupoControl = component.repartoForm.get('grupoProfesionalId');
    expect(grupoControl?.disabled).toBeTrue();
    component.repartoForm.patchValue({
      idTipoServicio: 1
    });

    expect(grupoControl?.enabled).toBeTrue();
  });

  it('acepta observaciones cortas y rechaza solo espacios o más de 500 caracteres', () => {
    const observaciones = component.repartoForm.get('observaciones')!;
    observaciones.setValue('Sí');
    expect(observaciones.valid).toBeTrue();
    observaciones.setValue('   ');
    expect(observaciones.invalid).toBeTrue();
    observaciones.setValue('');
    expect(observaciones.invalid).toBeTrue();
    observaciones.setValue('x'.repeat(501));
    expect(observaciones.invalid).toBeTrue();
  });

  it('persiste el reparto con los IDs reales del API', () => {
    component.repartoForm.patchValue({
      idTipoAsignacion: 1,
      idTipoServicio: 1,
      grupoProfesionalId: 7,
      observaciones: 'Reparto priorizado por el equipo.'
    });

    component.guardar();

    expect(solicitudService.asignar).toHaveBeenCalledWith(4, jasmine.objectContaining({
      idTipoAsignacion: 1,
      idTipoServicio: 1,
      grupoProfesionalId: 7,
      observaciones: 'Reparto priorizado por el equipo.'
    }));
    expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ id: 4 }));
  });
});
