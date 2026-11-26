import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CitaComponent } from './cita.component';
import { CitaDto, EstadoCitaEnum } from '../../services/solicitud.service';

describe('CitaComponent', () => {
  let component: CitaComponent;
  let fixture: ComponentFixture<CitaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitaComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filtra por los valores visibles de todas las columnas de cita', () => {
    const cita = {
      id: 42, nombreSolicitante: 'Ana Pérez', tipoDocumento: 'CC', documento: '12345',
      fechaCita: '25/11/2026 16:30', profesional: 'Psicología',
      tipoSolicitud: 'Directa', idEstadoCita: EstadoCitaEnum.PROGRAMADA, estadoCita: 'Creada'
    } as CitaDto;
    component.dataSource.data = [cita];
    for (const [campo, valor] of [
      ['id', '42'], ['nombre', 'ana'], ['documento', '123'],
      ['fecha', '25/11/2026'], ['profesional', 'psicología'],
      ['tipoSolicitud', 'directa'], ['estadoCita', 'programada']
    ]) {
      component.filterValues[campo] = valor;
      component.dataSource.filter = JSON.stringify(component.filterValues);
      expect(component.dataSource.filteredData).withContext(campo).toEqual([cita]);
      component.filterValues[campo] = '';
    }
    component.filterValues.documento = '999';
    component.dataSource.filter = JSON.stringify(component.filterValues);
    expect(component.dataSource.filteredData).toEqual([]);
  });

  it('solo permite registrar resultado en citas pendientes cuya fecha ya pasó', () => {
    const fechaPasada = new Date(Date.now() - 60_000).toISOString();
    const citaPendiente = { idEstadoCita: EstadoCitaEnum.PROGRAMADA, fechaCita: fechaPasada } as CitaDto;
    const citaAtendida = { ...citaPendiente, idEstadoCita: EstadoCitaEnum.ATENDIDA };
    const citaFutura = { ...citaPendiente, fechaCita: new Date(Date.now() + 60_000).toISOString() };

    expect(component.puedeRegistrarResultado(citaPendiente)).toBeTrue();
    expect(component.puedeRegistrarResultado(citaAtendida)).toBeFalse();
    expect(component.puedeRegistrarResultado(citaFutura)).toBeFalse();
  });

  it('permite reprogramar citas programadas o reprogramadas vencidas, iniciales o de seguimiento', () => {
    for (const tipoAtencion of ['INICIAL', 'SEGUIMIENTO']) {
      for (const idEstadoCita of [EstadoCitaEnum.PROGRAMADA, EstadoCitaEnum.REPROGRAMADA]) {
        expect(component.puedeReprogramarCita({
          tipoAtencion,
          idEstadoCita,
          fechaCita: '01/01/2020 08:00'
        } as CitaDto)).toBeTrue();
      }
    }

    expect(component.puedeReprogramarCita({
      idEstadoCita: EstadoCitaEnum.ATENDIDA
    } as CitaDto)).toBeFalse();
  });

  it('abre primera atención desde una cita programada vencida y muestra su estado como Programada', () => {
    const citaProgramada = {
      id: 9004,
      casoId: null,
      tipoAtencion: 'INICIAL',
      idEstadoCita: EstadoCitaEnum.PROGRAMADA,
      estadoCita: 'Programada',
      fechaCita: new Date(Date.now() - 60_000).toISOString()
    } as CitaDto;

    expect(component.esPrimeraCita(citaProgramada)).toBeTrue();
    expect(component.puedeAbrirRegistroPrimeraAtencion(citaProgramada)).toBeTrue();
    expect(component.nombreEstadoCita(citaProgramada)).toBe('Programada');
  });

  it('no ofrece primera atención para una cita de seguimiento', () => {
    const seguimiento = {
      tipoAtencion: 'SEGUIMIENTO',
      casoId: 9001,
      idEstadoCita: EstadoCitaEnum.PROGRAMADA,
      fechaCita: new Date(Date.now() - 60_000).toISOString()
    } as CitaDto;

    expect(component.puedeAbrirRegistroPrimeraAtencion(seguimiento)).toBeFalse();
  });

  it('muestra la primera atención futura deshabilitada y la hora programada', () => {
    const cita = {
      id: 101, tipoAtencion: 'INICIAL', casoId: null,
      idEstadoCita: EstadoCitaEnum.PROGRAMADA,
      fechaCita: '31/12/2099 16:30'
    } as CitaDto;

    expect(component.mostrarRegistroPrimeraAtencion(cita)).toBeTrue();
    expect(component.puedeAbrirRegistroPrimeraAtencion(cita)).toBeFalse();
    expect(component.esCitaPendiente(cita)).toBeTrue();
    expect(component.puedeRegistrarResultado(cita)).toBeFalse();
    expect(component.fechaHoraCita(cita.fechaCita)).toBe('31/12/2099 16:30');
    component.dataSource.data = [cita];
    fixture.detectChanges();
    const registro = fixture.nativeElement.querySelector('[aria-label="Abrir el registro de primera atención para la cita 101"]') as HTMLButtonElement;
    const inasistencia = fixture.nativeElement.querySelector('[aria-label="Registrar inasistencia de la cita 101"]') as HTMLButtonElement;
    expect(registro?.disabled).toBeTrue();
    expect(inasistencia?.disabled).toBeTrue();
    expect(getComputedStyle(registro).color).toBe(getComputedStyle(inasistencia).color);
    const cancelar = fixture.nativeElement.querySelector('[aria-label="Cancelar la cita 101"]') as HTMLButtonElement;
    expect(getComputedStyle(registro).color).not.toBe(getComputedStyle(cancelar).color);
  });

  it('muestra en gris la acción atendida en una cita futura de seguimiento', () => {
    component.dataSource.data = [{
      id: 102, tipoAtencion: 'SEGUIMIENTO', casoId: 5,
      idEstadoCita: EstadoCitaEnum.PROGRAMADA, fechaCita: '31/12/2099 16:30'
    } as CitaDto];
    fixture.detectChanges();
    const atendida = fixture.nativeElement.querySelector('[aria-label="Marcar como atendida la cita 102"]') as HTMLButtonElement;
    const inasistencia = fixture.nativeElement.querySelector('[aria-label="Registrar inasistencia de la cita 102"]') as HTMLButtonElement;
    expect(atendida.disabled).toBeTrue();
    expect(getComputedStyle(atendida).color).toBe(getComputedStyle(inasistencia).color);
  });

  it('permite reintentar el registro inicial cuando la cita atendida aún no tiene caso', () => {
    const cita = {
      tipoAtencion: 'INICIAL', casoId: null, solicitudTieneCaso: false,
      idEstadoCita: EstadoCitaEnum.ATENDIDA
    } as CitaDto;
    expect(component.puedeAbrirRegistroPrimeraAtencion(cita)).toBeTrue();
    expect(component.esCitaPendiente(cita)).toBeFalse();
  });

  it('no ofrece crear otro caso en citas iniciales anteriores o ya vinculadas', () => {
    const cita = {
      tipoAtencion: 'INICIAL', casoId: null, solicitudTieneCaso: true,
      idEstadoCita: EstadoCitaEnum.PROGRAMADA,
      fechaCita: new Date(Date.now() - 60_000).toISOString()
    } as CitaDto;
    expect(component.mostrarRegistroPrimeraAtencion(cita)).toBeFalse();
    expect(component.puedeAbrirRegistroPrimeraAtencion({ ...cita, casoId: 5 })).toBeFalse();
  });

  it('no permite registrar resultados sin una fecha válida ni para estados finales', () => {
    for (const estado of [EstadoCitaEnum.ATENDIDA, EstadoCitaEnum.CANCELADA, EstadoCitaEnum.INASISTENCIA]) {
      expect(component.esCitaPendiente({ idEstadoCita: estado } as CitaDto)).toBeFalse();
    }
    expect(component.puedeRegistrarResultado({
      idEstadoCita: EstadoCitaEnum.PROGRAMADA, fechaCita: ''
    } as CitaDto)).toBeFalse();
  });
});
