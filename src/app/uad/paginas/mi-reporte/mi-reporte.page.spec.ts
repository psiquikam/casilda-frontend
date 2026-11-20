import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { DialogoService } from '../../../core/a11y/dialogo.service';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { UadMisReportesPort } from '../../contratos/uad-mis-reportes.port';
import { ErrorUad } from '../../infraestructura/uad-error';
import { UAD_MOCK_LATENCIA_MS } from '../../infraestructura/mock/uad-mock.adapter';
import { UadMockStore } from '../../infraestructura/mock/uad-mock-store';
import { provideUadMisReportes } from '../../uad.providers';
import { MiReportePage } from './mi-reporte.page';

const PENDIENTE = 'CAS-DEMO-000145';
const SIN_SOLICITUD = 'CAS-DEMO-000142';

let confirma = true;
let notificacion: jasmine.SpyObj<NotificacionService>;

function montar(codigo: string): ComponentFixture<MiReportePage> {
  notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', ['error', 'exito', 'info']);
  TestBed.configureTestingModule({
    imports: [MiReportePage],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      provideUadMisReportes('mock'),
      { provide: UAD_MOCK_LATENCIA_MS, useValue: 0 },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ codigo }) } } },
      { provide: DialogoService, useValue: { confirmar: () => of(confirma), aviso: () => of(undefined) } },
      { provide: NotificacionService, useValue: notificacion }
    ]
  });
  const fixture = TestBed.createComponent(MiReportePage);
  fixture.detectChanges();
  return fixture;
}

function escribir(fixture: ComponentFixture<MiReportePage>, texto: string): void {
  const area = fixture.nativeElement.querySelector('#mr-respuesta') as HTMLTextAreaElement;
  area.value = texto;
  area.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function enviar(fixture: ComponentFixture<MiReportePage>): void {
  (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('UAD · MiReportePage', () => {
  beforeEach(() => (confirma = true));

  it('muestra la solicitud vencida con su formulario y avisa que aún se puede responder', () => {
    const el: HTMLElement = montar(PENDIENTE).nativeElement;
    expect(el.querySelectorAll('h1').length).toBe(1);
    expect(el.textContent).toContain('precise fechas y lugar de los hechos');
    expect(el.textContent).toContain('todavía puede responder');
    const area = el.querySelector('#mr-respuesta');
    expect(area).not.toBeNull();
    expect(area?.getAttribute('autocomplete')).toBe('off');
    // Sin campo de archivos: el servidor los rechaza (D-UAD-09).
    expect(el.querySelector('input[type="file"]')).toBeNull();
    expect(el.textContent).toContain('solo admite texto');
  });

  it('no envía una respuesta vacía', () => {
    const fixture = montar(PENDIENTE);
    const espia = spyOn(TestBed.inject(UadMisReportesPort), 'responder').and.callThrough();
    enviar(fixture);
    expect(espia).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain('Escriba su respuesta.');
  });

  it('no envía si la persona no confirma, y conserva lo escrito', () => {
    confirma = false;
    const fixture = montar(PENDIENTE);
    const espia = spyOn(TestBed.inject(UadMisReportesPort), 'responder').and.callThrough();
    escribir(fixture, 'Ocurrió el 3 de noviembre.');
    enviar(fixture);
    expect(espia).not.toHaveBeenCalled();
    expect((fixture.nativeElement.querySelector('#mr-respuesta') as HTMLTextAreaElement).value).toBe('Ocurrió el 3 de noviembre.');
    expect(fixture.componentInstance.tieneCambiosPendientes()).toBeTrue();
  });

  it('al confirmar envía, muestra la respuesta y retira el formulario', () => {
    const fixture = montar(PENDIENTE);
    escribir(fixture, 'Ocurrió el 3 de noviembre.');
    enviar(fixture);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#mr-confirmacion')?.textContent).toContain('Su respuesta fue enviada a la UAD');
    expect(el.querySelector('#mr-respuesta')).toBeNull();
    expect(el.textContent).toContain('Ocurrió el 3 de noviembre.');
    expect(el.textContent).toContain('En revisión');
    expect(fixture.componentInstance.tieneCambiosPendientes()).toBeFalse();
    expect(TestBed.inject(UadMockStore).buscar('mock-ndi-145')?.estado).toBe('SUBSANACION_RECIBIDA');
  });

  it('si el servidor rechaza por conflicto, avisa, refresca y no borra el texto', () => {
    const fixture = montar(PENDIENTE);
    const conflicto: ErrorUad = { estado: 409, tipo: 'conflicto', codigo: 'CONFLICTO_VERSION', mensaje: 'x', camposInvalidos: {} };
    const api = TestBed.inject(UadMisReportesPort);
    spyOn(api, 'responder').and.returnValue(throwError(() => conflicto));
    const obtener = spyOn(api, 'obtener').and.callThrough();
    escribir(fixture, 'Mi respuesta');
    enviar(fixture);

    expect(notificacion.error).toHaveBeenCalledTimes(1);
    expect(notificacion.error.calls.mostRecent().args[0]).toContain('su texto sigue en pantalla');
    expect(obtener).toHaveBeenCalledTimes(1);
    expect((fixture.nativeElement.querySelector('#mr-respuesta') as HTMLTextAreaElement).value).toBe('Mi respuesta');
  });

  it('sin solicitud de la UAD no hay formulario', () => {
    const el: HTMLElement = montar(SIN_SOLICITUD).nativeElement;
    expect(el.textContent).toContain('no le ha pedido información adicional');
    expect(el.querySelector('form')).toBeNull();
  });

  it('un reporte ajeno o inexistente se ve como no encontrado, sin datos', () => {
    const el: HTMLElement = montar('CAS-DEMO-000144').nativeElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No encontramos este reporte entre los suyos');
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('a[href="/mis-reportes"]')).not.toBeNull();
  });
});
