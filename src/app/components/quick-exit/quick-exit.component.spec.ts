import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';

import { QuickExitComponent } from './quick-exit.component';
import { QuickExitService } from '../../core/security/quick-exit.service';

describe('QuickExitComponent', () => {
  let fixture: ComponentFixture<QuickExitComponent>;
  let component: QuickExitComponent;
  let quickExit: jasmine.SpyObj<QuickExitService>;

  beforeEach(async () => {
    quickExit = jasmine.createSpyObj<QuickExitService>('QuickExitService', ['ejecutar']);

    await TestBed.configureTestingModule({
      imports: [QuickExitComponent, MatIconTestingModule],
      providers: [{ provide: QuickExitService, useValue: quickExit }]
    }).compileComponents();

    fixture = TestBed.createComponent(QuickExitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe exponer un botón con nombre accesible y atajos declarados', () => {
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-escape');

    expect(boton).toBeTruthy();
    expect(boton.getAttribute('aria-label')).toContain('Salida rápida');
    expect(boton.getAttribute('aria-keyshortcuts')).toBe('Alt+Q Escape');
  });

  it('debe ejecutar la salida al hacer clic', () => {
    fixture.nativeElement.querySelector('button.btn-escape').click();

    expect(quickExit.ejecutar).toHaveBeenCalledTimes(1);
  });

  it('debe ejecutar la salida con Alt + Q', () => {
    component.manejarAtajo(new KeyboardEvent('keydown', { key: 'q', altKey: true }));

    expect(quickExit.ejecutar).toHaveBeenCalledTimes(1);
  });

  // ==========================================================================
  // DSH-06-02 — El atajo debe reconocerse en las distribuciones de teclado que
  // atendemos, sin dispararse al escribir «@» en teclado latinoamericano.
  // ==========================================================================
  describe('atajo Alt + Q en distintas distribuciones de teclado', () => {
    /** Crea el evento y espía `preventDefault` para comprobar la inserción. */
    function pulsar(init: KeyboardEventInit): KeyboardEvent {
      const evento = new KeyboardEvent('keydown', { cancelable: true, ...init });
      spyOn(evento, 'preventDefault').and.callThrough();
      component.manejarAtajo(evento);
      return evento;
    }

    it('dispara con Alt + q (Windows y Linux, distribución latinoamericana)', () => {
      const evento = pulsar({ key: 'q', code: 'KeyQ', altKey: true });

      expect(quickExit.ejecutar).toHaveBeenCalledTimes(1);
      expect(evento.preventDefault).toHaveBeenCalled();
    });

    it('dispara con Option + Q en macOS, donde la tecla se traduce a «œ»', () => {
      const evento = pulsar({ key: 'œ', code: 'KeyQ', altKey: true });

      expect(quickExit.ejecutar).toHaveBeenCalledTimes(1);
      // Sin preventDefault, «œ» quedaría escrito en el campo enfocado.
      expect(evento.preventDefault).toHaveBeenCalled();
    });

    it('dispara con Alt + Q mayúscula', () => {
      pulsar({ key: 'Q', code: 'KeyQ', altKey: true });

      expect(quickExit.ejecutar).toHaveBeenCalledTimes(1);
    });

    it('NO dispara con AltGr + Q en Windows, que escribe «@»', () => {
      // En Windows AltGr se reporta como Ctrl + Alt: es la señal que lo separa
      // de un Alt + Q real.
      const evento = pulsar({ key: '@', code: 'KeyQ', altKey: true, ctrlKey: true });

      expect(quickExit.ejecutar).not.toHaveBeenCalled();
      expect(evento.preventDefault).not.toHaveBeenCalled();
    });

    describe('con un campo de correo electrónico enfocado', () => {
      let campo: HTMLInputElement;

      /** Despacha desde el campo para recorrer el `@HostListener` de verdad. */
      function escribirEn(campoEnfocado: HTMLInputElement, init: KeyboardEventInit): KeyboardEvent {
        const evento = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
        campoEnfocado.dispatchEvent(evento);
        return evento;
      }

      beforeEach(() => {
        campo = document.createElement('input');
        campo.type = 'email';
        document.body.appendChild(campo);
        campo.focus();
      });

      afterEach(() => campo.remove());

      it('el manejador global sí escucha los eventos del campo', () => {
        // Control del caso negativo de abajo: sin esto, «no se ejecutó» podría
        // significar simplemente que el manejador nunca se enteró.
        const evento = escribirEn(campo, { key: 'q', code: 'KeyQ', altKey: true });

        expect(quickExit.ejecutar).toHaveBeenCalledTimes(1);
        expect(evento.defaultPrevented).toBeTrue();
      });

      it('NO dispara al escribir «@» con AltGr', () => {
        const evento = escribirEn(campo, { key: '@', code: 'KeyQ', altKey: true, ctrlKey: true });

        expect(quickExit.ejecutar).not.toHaveBeenCalled();
        // El evento no se cancela, así que el navegador inserta el carácter.
        expect(evento.defaultPrevented).toBeFalse();
      });
    });

    it('NO dispara con Cmd + Q en macOS (cerrar aplicación)', () => {
      pulsar({ key: 'q', code: 'KeyQ', metaKey: true });

      expect(quickExit.ejecutar).not.toHaveBeenCalled();
    });

    it('NO dispara con la tecla Q sin modificadores', () => {
      pulsar({ key: 'q', code: 'KeyQ' });

      expect(quickExit.ejecutar).not.toHaveBeenCalled();
    });

    it('NO dispara con Alt y una tecla distinta de Q', () => {
      pulsar({ key: 'a', code: 'KeyA', altKey: true });

      expect(quickExit.ejecutar).not.toHaveBeenCalled();
    });
  });

  it('debe ejecutar la salida con doble Escape en menos de un segundo', () => {
    component.manejarAtajo(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(quickExit.ejecutar).not.toHaveBeenCalled();

    component.manejarAtajo(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(quickExit.ejecutar).toHaveBeenCalledTimes(1);
  });

  it('no debe ejecutar la salida con un solo Escape', () => {
    component.manejarAtajo(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(quickExit.ejecutar).not.toHaveBeenCalled();
  });
});
