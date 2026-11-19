import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DialogoService } from '../../../core/a11y/dialogo.service';
import { AuthService } from '../../../services/auth.service';
import { UadApiPort } from '../../contratos/uad-api.port';
import { UAD_MOCK_LATENCIA_MS } from '../../infraestructura/mock/uad-mock.adapter';
import { UadMockStore } from '../../infraestructura/mock/uad-mock-store';
import { provideUadApi } from '../../uad.providers';
import { GestionarCasoPage } from './gestionar-caso.page';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pagina = any;

function montar(casoUadId: string, equipo = 'UAD_EQUIPO_3', latencia = 0): ComponentFixture<GestionarCasoPage> {
  TestBed.configureTestingModule({
    imports: [GestionarCasoPage],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      provideUadApi('mock'),
      { provide: UAD_MOCK_LATENCIA_MS, useValue: latencia },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ casoUadId }) } } },
      { provide: DialogoService, useValue: { confirmar: () => of(true), aviso: () => of(undefined) } },
      { provide: AuthService, useValue: { currentUser: { nombre: 'Prueba' }, hasRole: (r: string) => r === equipo, isAdmin: () => false } }
    ]
  });
  const fixture = TestBed.createComponent(GestionarCasoPage);
  fixture.detectChanges();
  return fixture;
}

const textoDe = (f: ComponentFixture<GestionarCasoPage>): string => f.nativeElement.textContent;

describe('UAD · GestionarCasoPage', () => {
  it('muestra la cabecera del caso y el catálogo de instrucción del Equipo 3', () => {
    const fixture = montar('mock-cuad-201');
    const texto = textoDe(fixture);
    expect(texto).toContain('CAS-2026-000301');
    expect(texto).toContain('Sin registrar');
    expect(texto).toContain('Indagación previa');
    expect(texto).toContain('Investigación disciplinaria');
    expect(texto).not.toContain('Averiguaciones preliminares');
    expect(texto).not.toContain('Fallo');
  });

  it('no muestra «Casos asociados de la persona» (solo van en la evaluación)', () => {
    const fixture = montar('mock-cuad-203');
    expect(fixture.nativeElement.querySelector('app-uad-casos-asociados')).toBeNull();
    expect(textoDe(fixture)).not.toContain('Casos asociados');
  });

  it('muestra las acciones permanentes y deshabilita las pendientes de validación', () => {
    const fixture = montar('mock-cuad-201');
    const botones = Array.from(fixture.nativeElement.querySelectorAll('.permanente__boton')) as HTMLButtonElement[];
    const porNombre = (n: string) => botones.find((b) => b.textContent?.trim() === n)!;
    expect(botones.length).toBe(5);
    expect(porNombre('Remisión por competencia').disabled).toBeFalse();
    expect(porNombre('Finalizar etapa de instrucción').disabled).toBeFalse();
    expect(porNombre('Inhibitorio').disabled).toBeTrue();
    expect(porNombre('Terminación').disabled).toBeTrue();
    expect(porNombre('Remisión a otro actor de la Ruta').disabled).toBeTrue();
  });

  it('guardar una actuación la agrega al historial sin cambiar la fase y observaciones opcionales', () => {
    const fixture = montar('mock-cuad-201');
    const pagina = fixture.componentInstance as Pagina;
    const antes = pagina.historial().length;
    pagina.alternar('PLIEGO_CARGOS', true);
    pagina.guardarActuacion();
    fixture.detectChanges();
    expect(pagina.historial().length).toBe(antes + 1);
    expect(pagina.caso().faseActual).toBe('INSTRUCCION');
    expect(pagina.seleccion().size).toBe(0);
  });

  it('sin actuaciones marcadas avisa y no llama al servidor', () => {
    const fixture = montar('mock-cuad-201');
    const espia = spyOn(TestBed.inject(UadApiPort), 'registrarActuaciones').and.callThrough();
    (fixture.componentInstance as Pagina).guardarActuacion();
    fixture.detectChanges();
    expect(espia).not.toHaveBeenCalled();
    expect(textoDe(fixture)).toContain('Marque al menos una actuación');
  });

  it('bloquea el doble envío de una actuación', fakeAsync(() => {
    const fixture = montar('mock-cuad-201', 'UAD_EQUIPO_3', 50);
    tick(50);
    fixture.detectChanges();
    const pagina = fixture.componentInstance as Pagina;
    const espia = spyOn(TestBed.inject(UadApiPort), 'registrarActuaciones').and.callThrough();
    pagina.alternar('PRACTICA_PRUEBAS', true);
    pagina.guardarActuacion();
    pagina.guardarActuacion();
    expect(espia).toHaveBeenCalledTimes(1);
    tick(200);
  }));

  it('el traslado exige confirmación explícita y luego saca el caso de la bandeja del instructor', () => {
    const fixture = montar('mock-cuad-201');
    const pagina = fixture.componentInstance as Pagina;
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const espia = spyOn(TestBed.inject(UadApiPort), 'finalizarInstruccion').and.callThrough();

    pagina.abrirPermanente(pagina.permanentes().find((a: Pagina) => a.codigo === 'FINALIZAR_INSTRUCCION'));
    pagina.finalizarInstruccion();
    fixture.detectChanges();
    expect(espia).not.toHaveBeenCalled();
    expect(textoDe(fixture)).toContain('Confirme expresamente');

    pagina.confirmaTraslado.set(true);
    pagina.finalizarInstruccion();
    expect(espia).toHaveBeenCalledTimes(1);
    expect(navegar).toHaveBeenCalledWith(['/uad/casos'], jasmine.objectContaining({ state: jasmine.any(Object) }));
    const caso = TestBed.inject(UadMockStore).buscarCaso('mock-cuad-201')!;
    expect(caso.faseActual).toBe('DECISION');
    expect(caso.equipoResponsable).toBe('EQUIPO_4');
  });

  it('en decisión no permite «Finalizar etapa de instrucción»', () => {
    const fixture = montar('mock-cuad-203');
    const pagina = fixture.componentInstance as Pagina;
    const finalizar = pagina.permanentes().find((a: Pagina) => a.codigo === 'FINALIZAR_INSTRUCCION');
    expect(finalizar.ejecutable).toBeFalse();
    pagina.abrirPermanente(finalizar);
    expect(pagina.permanente()).toBeNull();
  });

  it('registra el expediente UAD después, sin bloquear nada', () => {
    const fixture = montar('mock-cuad-201');
    const pagina = fixture.componentInstance as Pagina;
    pagina.editarExpediente();
    pagina.expediente.set('EXP-FICTICIO-0100');
    pagina.guardarExpediente();
    fixture.detectChanges();
    expect(pagina.caso().expedienteUad).toBe('EXP-FICTICIO-0100');
    expect(pagina.historial().some((e: Pagina) => e.tipo === 'EXPEDIENTE_ACTUALIZADO')).toBeTrue();
  });

  it('la remisión por competencia deja la gestión finalizada y de solo lectura', () => {
    const fixture = montar('mock-cuad-201');
    const pagina = fixture.componentInstance as Pagina;
    pagina.abrirPermanente(pagina.permanentes().find((a: Pagina) => a.codigo === 'REMISION_COMPETENCIA'));
    pagina.entidad.set('FISCALIA');
    pagina.remitirPorCompetencia();
    fixture.detectChanges();
    expect(pagina.caso().estadoGestion).toBe('FINALIZADA');
    expect(textoDe(fixture)).toContain('La gestión de la UAD sobre este caso terminó');
    expect(pagina.ordinarias().every((a: Pagina) => !a.ejecutable)).toBeTrue();
  });

  it('un caso de otro equipo muestra «no está en su bandeja»', () => {
    expect(textoDe(montar('mock-cuad-201', 'UAD_EQUIPO_4'))).toContain('no está en su bandeja');
  });
});
