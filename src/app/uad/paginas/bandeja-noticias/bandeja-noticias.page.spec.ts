import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AuthService } from '../../../services/auth.service';
import { UAD_MOCK_LATENCIA_MS } from '../../infraestructura/mock/uad-mock.adapter';
import { provideUadApi } from '../../uad.providers';
import { BandejaNoticiasPage } from './bandeja-noticias.page';

function montar(roles: string[]): ComponentFixture<BandejaNoticiasPage> {
  TestBed.configureTestingModule({
    imports: [BandejaNoticiasPage],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      provideUadApi('mock'),
      { provide: UAD_MOCK_LATENCIA_MS, useValue: 0 },
      { provide: AuthService, useValue: { currentUser: { nombre: 'Prueba' }, hasRole: (r: string) => roles.includes(r), isAdmin: () => roles.includes('ADMIN') } }
    ]
  });
  const fixture = TestBed.createComponent(BandejaNoticiasPage);
  fixture.detectChanges();
  return fixture;
}

describe('UAD · BandejaNoticiasPage', () => {
  it('muestra las columnas de UAD-NOT-10, sin «Asunto» ni «Expediente UAD»', () => {
    const el: HTMLElement = montar(['UAD_EQUIPO_3']).nativeElement;
    const encabezados = Array.from(el.querySelectorAll('thead th')).map((th) => th.textContent?.trim() ?? '');
    expect(encabezados).toContain('NDI (consecutivo)');
    expect(encabezados).toContain('ID de caso Casilda');
    expect(encabezados).toContain('Origen');
    expect(encabezados).toContain('Fecha de recepción');
    expect(encabezados).toContain('Estado');
    expect(encabezados.some((t) => /asunto|expediente/i.test(t))).toBeFalse();
    expect(el.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
  });

  it('la fila expandible muestra contacto en NDI y «No aplica» en NDA', () => {
    const fixture = montar(['UAD_EQUIPO_3']);
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('.bandeja__expandir') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.bandeja__detalle')?.textContent).toContain('Teléfono');

    (el.querySelector('#uad-pestana-NDA') as HTMLButtonElement).click();
    fixture.detectChanges();
    (el.querySelector('.bandeja__expandir') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.bandeja__detalle')?.textContent).toContain('No aplica (anónima)');
  });

  it('coordinación sin equipo ve «Acceso restringido», sin datos', () => {
    const el: HTMLElement = montar(['UAD_COORDINACION']).nativeElement;
    expect(el.textContent).toContain('Acceso restringido');
    expect(el.querySelector('table')).toBeNull();
  });

  it('muestra la franja de datos de demostración con el adaptador mock', () => {
    const el: HTMLElement = montar(['UAD_EQUIPO_4']).nativeElement;
    expect(el.textContent).toContain('Datos de demostración');
  });
});
