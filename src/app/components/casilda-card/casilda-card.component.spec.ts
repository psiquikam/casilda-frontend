import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CasildaCardComponent } from './casilda-card.component';
import { ContenidoDestacadoDto } from '../../services/contenido-home.service';

describe('CasildaCardComponent', () => {
  let fixture: ComponentFixture<CasildaCardComponent>;

  const contenido: ContenidoDestacadoDto = {
    id: 1,
    imagen: 'assets/distintivo_casilda.svg',
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
});
