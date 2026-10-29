import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CasildaCardComponent } from './casilda-card.component';
import { ContenidoDestacadoDto } from '../../services/contenido-home.service';
import { IMAGEN_RESPALDO } from '../../core/contenidos/catalogo-contenidos';
import { environment } from '../../../environments/environment';

describe('CasildaCardComponent', () => {
  let fixture: ComponentFixture<CasildaCardComponent>;

  const contenido: ContenidoDestacadoDto = {
    id: 1,
    imagen: 'assets/distintivo_casilda_morado.svg',
    titulo: 'Registrar queja',
    contenido: 'Texto administrado por el gestor de contenidos.',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    enlace: '/formulario-anonimo',
    seccion: 'acciones'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasildaCardComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(CasildaCardComponent);
  });

  it('debe renderizar imagen, título y contenido recibidos', () => {
    fixture.componentRef.setInput('contenido', contenido);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('img')?.getAttribute('src')).toBe(contenido.imagen);
    expect(host.querySelector('.tarjeta__titulo')?.textContent).toContain('Registrar queja');
    expect(host.querySelector('.tarjeta__contenido')?.textContent).toContain('gestor de contenidos');
  });

  it('debe renderizarse como enlace cuando el contenido trae ruta', () => {
    fixture.componentRef.setInput('contenido', contenido);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a.tarjeta--accion')).toBeTruthy();
  });

  it('debe renderizarse como tarjeta informativa cuando no hay ruta', () => {
    fixture.componentRef.setInput('contenido', { ...contenido, enlace: null });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.querySelector('article.tarjeta')).toBeTruthy();
  });

  it('resuelve contra la API la imagen que sube el gestor de contenidos', () => {
    fixture.componentRef.setInput('contenido', { ...contenido, imagen: '/contenidos/imagenes/abc.svg' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img').getAttribute('src'))
      .toBe(`${environment.apiBaseUrl}/contenidos/imagenes/abc.svg`);
  });

  it('usa la imagen de respaldo si el contenido no tiene imagen o la suya no carga', () => {
    fixture.componentRef.setInput('contenido', { ...contenido, imagen: null });
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe(IMAGEN_RESPALDO);

    fixture.componentRef.setInput('contenido', { ...contenido, imagen: '/contenidos/imagenes/borrada.png' });
    fixture.detectChanges();
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(IMAGEN_RESPALDO);
  });

  it('no navega con un enlace que no es una ruta interna', () => {
    fixture.componentRef.setInput('contenido', { ...contenido, enlace: '//sitio-externo.com' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('en vista previa conserva el aspecto de acción pero no navega', () => {
    fixture.componentRef.setInput('contenido', contenido);
    fixture.componentRef.setInput('vistaPrevia', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.querySelector('article.tarjeta--previa-accion')).toBeTruthy();
  });
});
