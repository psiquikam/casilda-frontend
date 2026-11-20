import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { UadMisReportesPort } from '../../contratos/uad-mis-reportes.port';
import { ErrorUad } from '../../infraestructura/uad-error';
import { UAD_MOCK_LATENCIA_MS } from '../../infraestructura/mock/uad-mock.adapter';
import { provideUadMisReportes } from '../../uad.providers';
import { MisReportesPage } from './mis-reportes.page';

function configurar(): void {
  TestBed.configureTestingModule({
    imports: [MisReportesPage],
    providers: [provideRouter([]), provideNoopAnimations(), provideUadMisReportes('mock'), { provide: UAD_MOCK_LATENCIA_MS, useValue: 0 }]
  });
}

function montar(): ComponentFixture<MisReportesPage> {
  const fixture = TestBed.createComponent(MisReportesPage);
  fixture.detectChanges();
  return fixture;
}

describe('UAD · MisReportesPage', () => {
  beforeEach(configurar);

  it('lista los reportes con código, estado y consecutivo, y declara que son de demostración', () => {
    const el: HTMLElement = montar().nativeElement;
    expect(el.querySelectorAll('h1').length).toBe(1);
    expect(el.textContent).toContain('Datos de demostración');
    expect(el.querySelectorAll('li.tarjeta').length).toBeGreaterThan(1);
    expect(el.textContent).toContain('CAS-DEMO-000145');
    expect(el.textContent).toContain('NDI-2026-000145');
    expect(el.textContent).toContain('Información adicional solicitada');
  });

  it('destaca el reporte con solicitud pendiente y enlaza a su detalle', () => {
    const el: HTMLElement = montar().nativeElement;
    const pendientes = Array.from(el.querySelectorAll('li.tarjeta')).filter((li) => li.textContent?.includes('le pidió información adicional'));
    expect(pendientes.length).toBe(1);
    const enlace = pendientes[0].querySelector('a.boton');
    expect(enlace?.getAttribute('href')).toBe('/mis-reportes/CAS-DEMO-000145');
    expect(enlace?.getAttribute('aria-label')).toBe('Responder la solicitud del reporte CAS-DEMO-000145');
    expect(enlace?.classList.contains('boton--primario')).toBeTrue();
  });

  it('no muestra el relato, la persona reportante ni la decisión interna', () => {
    const texto: string = montar().nativeElement.textContent;
    expect(texto).not.toMatch(/inhibitori|remitida|relato|persona ficticia|example\.org/i);
  });

  it('explica el estado vacío y ofrece reportar un caso', () => {
    spyOn(TestBed.inject(UadMisReportesPort), 'listar').and.returnValue(of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }));
    const el: HTMLElement = montar().nativeElement;
    expect(el.textContent).toContain('Todavía no tiene reportes en la UAD');
    expect(el.querySelector('a[href="/reportar-caso"]')).not.toBeNull();
  });

  it('ante un fallo muestra un mensaje llano y permite reintentar', () => {
    const error: ErrorUad = { estado: 0, tipo: 'red', codigo: null, mensaje: 'x', camposInvalidos: {} };
    const espia = spyOn(TestBed.inject(UadMisReportesPort), 'listar').and.returnValue(throwError(() => error));
    const fixture = montar();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No pudimos conectar con el servidor');

    espia.and.callThrough();
    (el.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.querySelectorAll('li.tarjeta').length).toBeGreaterThan(0);
  });
});
