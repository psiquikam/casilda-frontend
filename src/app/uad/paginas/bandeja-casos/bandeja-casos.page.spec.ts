import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AuthService } from '../../../services/auth.service';
import { UAD_MOCK_LATENCIA_MS } from '../../infraestructura/mock/uad-mock.adapter';
import { provideUadApi } from '../../uad.providers';
import { BandejaCasosPage } from './bandeja-casos.page';

function montar(equipo: string): HTMLElement {
  TestBed.configureTestingModule({
    imports: [BandejaCasosPage],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      provideUadApi('mock'),
      { provide: UAD_MOCK_LATENCIA_MS, useValue: 0 },
      { provide: AuthService, useValue: { currentUser: { nombre: 'Prueba' }, hasRole: (r: string) => r === equipo, isAdmin: () => false } }
    ]
  });
  const fixture = TestBed.createComponent(BandejaCasosPage);
  fixture.detectChanges();
  return fixture.nativeElement;
}

describe('UAD · BandejaCasosPage', () => {
  it('muestra las columnas de UAD-CAS-02 y la acción «Gestionar caso»', () => {
    const el = montar('UAD_EQUIPO_3');
    const encabezados = Array.from(el.querySelectorAll('thead th')).map((th) => th.textContent?.trim() ?? '');
    for (const columna of ['ID de caso Casilda', 'Expediente UAD', 'Víctima', 'Vínculo del investigado con la UdeA', 'Fecha de admisión', 'Fase actual']) {
      expect(encabezados).withContext(columna).toContain(columna);
    }
    const enlaces = Array.from(el.querySelectorAll('a.boton')).filter((a) => a.textContent?.includes('Gestionar caso'));
    expect(enlaces.length).toBe(2);
    expect(enlaces[0].getAttribute('href')).toContain('/uad/casos/');
  });

  it('cada equipo ve sus casos según la fase', () => {
    expect(montar('UAD_EQUIPO_3').textContent).toContain('CAS-2026-000301');
    TestBed.resetTestingModule();
    const e4 = montar('UAD_EQUIPO_4').textContent ?? '';
    expect(e4).toContain('CAS-2026-000302');
    expect(e4).not.toContain('CAS-2026-000301');
  });
});
