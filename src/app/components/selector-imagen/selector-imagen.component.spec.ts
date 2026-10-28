import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';

import { SelectorImagenComponent } from './selector-imagen.component';

describe('SelectorImagenComponent', () => {
  let fixture: ComponentFixture<SelectorImagenComponent>;
  let componente: SelectorImagenComponent;
  let elegidos: File[];

  const archivo = (nombre: string, tipo: string, bytes: number) =>
    new File([new Uint8Array(bytes)], nombre, { type: tipo });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectorImagenComponent, MatIconTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(SelectorImagenComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('idEntrada', 'prueba-imagen');
    fixture.componentRef.setInput('tiposPermitidos', ['image/png', 'image/svg+xml']);
    fixture.componentRef.setInput('extensiones', '.png,.svg');
    fixture.componentRef.setInput('tamanoMaximoBytes', 1024);
    elegidos = [];
    componente.seleccionar.subscribe((f) => elegidos.push(f));
    fixture.detectChanges();
  });

  const textoError = (): string | undefined =>
    (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent?.trim();

  it('sin imagen ofrece un botón real para elegirla, con su ayuda asociada', () => {
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('#prueba-imagen');
    expect(boton.tagName).toBe('BUTTON');
    expect(boton.getAttribute('aria-describedby')).toBe('prueba-imagen-ayuda');
    expect(fixture.nativeElement.querySelector('#prueba-imagen-ayuda').textContent).toContain('PNG, SVG');
  });

  it('acepta un archivo válido y lo entrega al padre', () => {
    componente.procesar(archivo('ok.png', 'image/png', 500));
    fixture.detectChanges();

    expect(elegidos.length).toBe(1);
    expect(textoError()).toBeUndefined();
  });

  it('rechaza un formato no permitido sin enviarlo', () => {
    componente.procesar(archivo('foto.jpg', 'image/jpeg', 500));
    fixture.detectChanges();

    expect(elegidos.length).toBe(0);
    expect(textoError()).toContain('no es una imagen válida');
  });

  it('rechaza un archivo que supera el peso máximo e indica cuánto pesa', () => {
    componente.procesar(archivo('grande.png', 'image/png', 4096));
    fixture.detectChanges();

    expect(elegidos.length).toBe(0);
    expect(textoError()).toContain('4 KB');
    expect(fixture.nativeElement.querySelector('#prueba-imagen').getAttribute('aria-describedby'))
      .toContain('prueba-imagen-error');
  });

  it('con imagen muestra la vista previa y permite quitarla', () => {
    let quitada = false;
    componente.quitar.subscribe(() => (quitada = true));
    fixture.componentRef.setInput('imagenUrl', 'assets/linea_alma.svg');
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('img')?.getAttribute('src')).toBe('assets/linea_alma.svg');
    const quitar = Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes('Quitar'));
    quitar?.click();
    expect(quitada).toBeTrue();
  });

  it('muestra el error que llega del servidor', () => {
    fixture.componentRef.setInput('errorExterno', 'El archivo SVG no es válido');
    fixture.detectChanges();

    expect(textoError()).toContain('El archivo SVG no es válido');
  });
});
