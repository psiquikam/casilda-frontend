import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { UadRadicacionPort } from '../../contratos/uad-radicacion.port';
import { UAD_MOCK_LATENCIA_MS } from '../../infraestructura/mock/uad-mock.adapter';
import { provideUadRadicacion } from '../../uad.providers';
import { QuejaAnonimaPage } from './queja-anonima.page';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pagina = any;

function montar(latencia = 0): ComponentFixture<QuejaAnonimaPage> {
  TestBed.configureTestingModule({
    imports: [QuejaAnonimaPage],
    providers: [provideRouter([]), provideNoopAnimations(), provideUadRadicacion('mock'), { provide: UAD_MOCK_LATENCIA_MS, useValue: latencia }]
  });
  const fixture = TestBed.createComponent(QuejaAnonimaPage);
  fixture.detectChanges();
  return fixture;
}

describe('UAD · QuejaAnonimaPage', () => {
  it('no pide identidad ni contacto y todos los campos van sin autocompletar', () => {
    const el: HTMLElement = montar().nativeElement;
    const ids = Array.from(el.querySelectorAll('input, textarea, mat-select')).map((c) => c.id);
    expect(ids).toEqual(['nda-descripcion', 'nda-lugar', 'nda-responsable', 'nda-vinculacion']);
    for (const campo of Array.from(el.querySelectorAll('input, textarea'))) {
      expect(campo.getAttribute('autocomplete')).withContext(campo.id).toBe('off');
    }
    expect(el.textContent).not.toMatch(/correo electrónico|número de documento|teléfono/i);
  });

  it('declara los límites de la privacidad sin prometer anonimato absoluto', () => {
    const texto: string = montar().nativeElement.textContent;
    expect(texto).toContain('no envía los datos de su sesión');
    expect(texto).toContain('la UAD no podrá pedirle más información');
    expect(texto).not.toMatch(/anonimato (total|absoluto|garantizado)/i);
  });

  it('muestra la franja de demostración con la radicación simulada', () => {
    expect(montar().nativeElement.textContent).toContain('Datos de demostración');
  });

  it('valida el relato sin llamar al servidor', () => {
    const fixture = montar();
    const espia = spyOn(TestBed.inject(UadRadicacionPort), 'radicarNoticiaAnonima').and.callThrough();
    (fixture.componentInstance as Pagina).enviar();
    fixture.detectChanges();
    expect(espia).not.toHaveBeenCalled();
    expect((fixture.componentInstance as Pagina).errores().length).toBe(1);
  });

  it('al enviar muestra solo el consecutivo NDA del servidor y vacía el formulario', () => {
    const fixture = montar();
    const pagina = fixture.componentInstance as Pagina;
    pagina.form.patchValue({ descripcionHechos: 'Relato ficticio de prueba con detalle suficiente.', vinculacionDeclarada: 'NO_SE' });
    pagina.form.markAsDirty();
    pagina.enviar();
    fixture.detectChanges();
    const texto: string = fixture.nativeElement.textContent;
    expect(texto).toContain('Su queja fue recibida');
    expect(texto).toMatch(/NDA-\d{4}-\d{6}/);
    expect(pagina.form.controls.descripcionHechos.value).toBe('');
    expect(pagina.tieneCambiosPendientes()).toBeFalse();
  });

  it('bloquea el doble envío', fakeAsync(() => {
    const fixture = montar(50);
    const pagina = fixture.componentInstance as Pagina;
    const espia = spyOn(TestBed.inject(UadRadicacionPort), 'radicarNoticiaAnonima').and.callThrough();
    pagina.form.patchValue({ descripcionHechos: 'Relato ficticio de prueba con detalle suficiente.' });
    pagina.enviar();
    pagina.enviar();
    expect(espia).toHaveBeenCalledTimes(1);
    tick(50);
  }));
});
