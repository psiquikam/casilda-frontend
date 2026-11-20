import { provideNativeDateAdapter } from '@angular/material/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DialogoService } from '../../../core/a11y/dialogo.service';
import { AuthService } from '../../../services/auth.service';
import { UadApiPort } from '../../contratos/uad-api.port';
import { UAD_MOCK_LATENCIA_MS } from '../../infraestructura/mock/uad-mock.adapter';
import { provideUadApi } from '../../uad.providers';
import { EvaluacionNoticiaPage } from './evaluacion-noticia.page';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pagina = any;

function montar(noticiaId: string, latencia = 0): ComponentFixture<EvaluacionNoticiaPage> {
  TestBed.configureTestingModule({
    imports: [EvaluacionNoticiaPage],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      provideNativeDateAdapter(),
      provideUadApi('mock'),
      { provide: UAD_MOCK_LATENCIA_MS, useValue: latencia },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ noticiaId }) } } },
      { provide: DialogoService, useValue: { confirmar: () => of(true), aviso: () => of(undefined) } },
      { provide: AuthService, useValue: { currentUser: { nombre: 'Prueba' }, hasRole: (r: string) => r === 'UAD_EQUIPO_3', isAdmin: () => false } }
    ]
  });
  const fixture = TestBed.createComponent(EvaluacionNoticiaPage);
  fixture.detectChanges();
  return fixture;
}

describe('UAD · EvaluacionNoticiaPage', () => {
  it('abrir la evaluación muestra identificadores separados y no asigna caso', () => {
    const fixture = montar('mock-ndi-141');
    const texto: string = fixture.nativeElement.textContent;
    expect(texto).toContain('NDI-2026-000141');
    expect(texto).toContain('ID de caso Casilda');
    expect(texto).toContain('Sin asignar');
    expect(texto).toContain('Sin registrar');
    expect(fixture.nativeElement.querySelectorAll('input[name="uad-tipo-decision"]').length).toBe(4);
  });

  it('no ofrece «Casos asociados» fuera de «Continuar trámite»', () => {
    const fixture = montar('mock-ndi-141');
    expect(fixture.nativeElement.querySelector('app-uad-casos-asociados')).toBeNull();
    (fixture.componentInstance as Pagina).elegirDecision('CONTINUAR_TRAMITE');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-uad-casos-asociados')).not.toBeNull();
  });

  it('continuar trámite sin expediente UAD registra la admisión con ID del servidor', () => {
    const fixture = montar('mock-ndi-141');
    const pagina = fixture.componentInstance as Pagina;
    pagina.elegirDecision('CONTINUAR_TRAMITE');
    pagina.registrar();
    fixture.detectChanges();
    const texto: string = fixture.nativeElement.textContent;
    expect(texto).toContain('Decisión registrada');
    expect(pagina.noticia().casoId).toMatch(/^CAS-2026-\d{6}$/);
    expect(pagina.noticia().expedienteUad).toBeNull();
  });

  it('bloquea el doble envío mientras la decisión está en curso', fakeAsync(() => {
    const fixture = montar('mock-ndi-141', 50);
    tick(50);
    fixture.detectChanges();
    const pagina = fixture.componentInstance as Pagina;
    const api = TestBed.inject(UadApiPort);
    const espia = spyOn(api, 'registrarDecision').and.callThrough();
    pagina.elegirDecision('REMISION_COMPETENCIA');
    pagina.form.controls.entidadDestinatariaCodigo.setValue('PROCURADURIA_REGIONAL');
    pagina.registrar();
    pagina.registrar();
    expect(espia).toHaveBeenCalledTimes(1);
    tick(50);
    fixture.detectChanges();
    expect(pagina.noticia().estado).toBe('REMITIDA_POR_COMPETENCIA');
    expect(pagina.noticia().casoId).toBeNull();
  }));

  it('muestra errores por campo sin llamar al servidor si faltan datos', () => {
    const fixture = montar('mock-ndi-141');
    const pagina = fixture.componentInstance as Pagina;
    const espia = spyOn(TestBed.inject(UadApiPort), 'registrarDecision').and.callThrough();
    pagina.elegirDecision('INHIBITORIO');
    pagina.registrar();
    fixture.detectChanges();
    expect(espia).not.toHaveBeenCalled();
    expect(pagina.resumenErrores().length).toBeGreaterThan(0);
  });

  it('una NDA no muestra datos del reportante', () => {
    const texto: string = montar('mock-nda-021').nativeElement.textContent;
    expect(texto).toContain('Noticia anónima');
    expect(texto).not.toContain('Documento');
  });
});
