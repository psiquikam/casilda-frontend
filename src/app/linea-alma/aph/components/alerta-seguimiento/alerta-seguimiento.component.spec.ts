import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AuthService } from '../../../../services/auth.service';
import { ConsultaPersonaVista } from '../../services/personas-alma.service';
import { AlertaSeguimientoComponent } from './alerta-seguimiento.component';

registerLocaleData(localeEsCo);

const BASE: ConsultaPersonaVista = {
  existe: true,
  nombreCompleto: 'Persona De Prueba Dos',
  nombres: 'Persona',
  apellidos: 'De Prueba Dos',
  seguimientoActivo: null,
  casoCerrado: null
};

describe('AlertaSeguimientoComponent (H-1.1)', () => {
  let fixture: ComponentFixture<AlertaSeguimientoComponent>;

  function pintar(rol: string, consulta: ConsultaPersonaVista): HTMLElement {
    TestBed.configureTestingModule({
      imports: [AlertaSeguimientoComponent, MatIconTestingModule],
      providers: [
        { provide: LOCALE_ID, useValue: 'es-CO' },
        { provide: AuthService, useValue: { hasRole: (r: string) => r === rol } }
      ]
    });
    fixture = TestBed.createComponent(AlertaSeguimientoComponent);
    fixture.componentRef.setInput('consulta', consulta);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('persona nueva: informa que no hay atenciones previas', () => {
    const dom = pintar('TECNICO_APH', { ...BASE, existe: false, nombreCompleto: null });
    expect(dom.textContent).toContain('No encontramos atenciones previas');
  });

  it('seguimiento activo: muestra la fecha del próximo control y la profesional, sin nada clínico', () => {
    const dom = pintar('TECNICO_APH', {
      ...BASE,
      seguimientoActivo: { proximoSeguimiento: '2026-11-09T10:00:00-05:00', profesional: 'Profesional de prueba' }
    });
    const texto = dom.textContent ?? '';
    expect(texto).toContain('seguimiento psicológico activo');
    expect(texto).toContain('Profesional de prueba');
    expect(texto).toContain('noviembre');
    expect(texto).toMatch(/atención nueva/);
  });

  it('la alerta no ofrece vincular la llamada al caso (RN-ALMA-06)', () => {
    const dom = pintar('TECNICO_APH', {
      ...BASE,
      seguimientoActivo: { proximoSeguimiento: '2026-11-09T10:00:00-05:00', profesional: 'Profesional de prueba' }
    });
    expect(dom.querySelectorAll('button').length).toBe(0);
    expect(dom.textContent).toContain('la decisión de unirla al caso la toma Psicología');
  });

  it('un rol sin permiso de alerta no ve el aviso de seguimiento', () => {
    const dom = pintar('USUARIO', {
      ...BASE,
      seguimientoActivo: { proximoSeguimiento: '2026-11-09T10:00:00-05:00', profesional: 'Profesional de prueba' }
    });
    expect(dom.textContent).not.toContain('seguimiento psicológico activo');
  });

  it('caso cerrado: habilita la contención post-cierre y emite el número del caso', () => {
    const dom = pintar('TECNICO_APH', { ...BASE, casoCerrado: { numeroCaso: 'CAS-2026-000003', fechaCierre: '2026-10-16T10:00:00-05:00' } });
    let emitido = '';
    fixture.componentInstance.contencion.subscribe((n) => (emitido = n));
    const boton = dom.querySelector('button') as HTMLButtonElement;
    expect(boton.textContent).toContain('contención');
    boton.click();
    expect(emitido).toBe('CAS-2026-000003');
  });
});
