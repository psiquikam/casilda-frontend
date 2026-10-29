import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ConsultaComponent } from './consulta.component';

describe('ConsultaComponent', () => {
  let component: ConsultaComponent;
  let fixture: ComponentFixture<ConsultaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConsultaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar únicamente los tipos de reparto definidos', () => {
    component.tiposReparto = [
      { id: 1, nombre: 'Prioritaria' },
      { id: 2, nombre: 'Ordinaria' },
      { id: 3, nombre: 'Seguimiento' }
    ];
    expect(component.opcionesTipoReparto).toEqual([
      'Prioritaria',
      'Ordinaria',
      'Seguimiento'
    ]);
  });

  it('debe ocultar el estado de transición y preparar el detalle compacto', () => {
    const item = component['mapToItem']({
      id: 10,
      codigo: 'SOL-10',
      estado: 'Abierto en transición',
      fechaCreacion: '2026-10-28',
      tipoSolicitud: 'Directa',
      descripcionHechos: 'Descripción obligatoria',
      lugarOcurrencia: 'Ciudad Universitaria',
      identidadGenero: 'Mujer',
      correos: [{ correo: 'persona@udea.edu.co' }],
      telefonos: [{ telefono: '3001234567' }]
    });

    expect(item.estadoDisplay).toBe('Repartida');
    expect(item.tipoAsignacionDisplay).toBe('Esperando reparto');
    expect(item.telefonoContacto).toBe('3001234567');
    expect(item.correoContacto).toBe('persona@udea.edu.co');
    expect(item.tieneDatosAgresor).toBeFalse();
  });

  it('debe mostrar la persona agresora solo cuando tenga información', () => {
    const item = component['mapToItem']({
      id: 11,
      codigo: 'SOL-11',
      fechaCreacion: '2026-10-28',
      lugarOcurrencia: 'Ciudad Universitaria',
      identidadGenero: 'Mujer',
      agresorNombre: 'Persona registrada'
    });

    expect(item.tieneDatosAgresor).toBeTrue();
    expect(item.agresorNombre).toBe('Persona registrada');

    component.dataSourceTodos.data = [item];
    component.expandedElement = item;
    fixture.detectChanges();

    const detalle = fixture.nativeElement.querySelector('.element-detail')?.textContent ?? '';
    const tarjetas = fixture.nativeElement.querySelectorAll('.detail-cards-grid .detail-card');
    expect(tarjetas.length).toBe(2);
    expect(tarjetas[1].textContent).toContain('Presunta persona agresora');
    expect(detalle).toContain('Presunta persona agresora');
    expect(detalle).not.toContain('Lugar de ocurrencia');
    expect(detalle).not.toContain('Identidad de género');
  });
});
