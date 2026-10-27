import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatIconTestingModule } from '@angular/material/icon/testing';

import { ContenidoItemComponent } from './contenido-item.component';
import type { ContenidoAdminDto } from '../../../services/contenido-admin.service';

describe('ContenidoItemComponent', () => {
  let fixture: ComponentFixture<ContenidoItemComponent>;

  const contenido: ContenidoAdminDto = {
    id: 3,
    imagen: null,
    titulo: 'Atención por Línea Alma',
    contenido: 'Escucha y apoyo psicológico.',
    vigenciaInicio: '2026-01-01T05:00:00Z',
    vigenciaFin: null,
    enlace: '/formulario-anonimo',
    seccion: 'acciones',
    orden: 2,
    modifiedAt: '2026-10-26T14:20:38Z',
    modifiedBy: 'gestor@udea.edu.co'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContenidoItemComponent, MatIconTestingModule],
      providers: [provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(ContenidoItemComponent);
    fixture.componentRef.setInput('contenido', contenido);
    fixture.componentRef.setInput('estado', 'vigente');
    fixture.detectChanges();
  });

  it('resume estado, destino, posición y última edición', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Publicado');
    expect(texto).toContain('Lleva a: Reporte anónimo de VBG');
    expect(texto).toContain('Posición 2');
    expect(texto).toContain('sin fecha de fin');
    expect(texto).toContain('gestor@udea.edu.co');
  });

  it('nombra las acciones con el título del contenido', () => {
    const editar: HTMLAnchorElement = fixture.nativeElement.querySelector('.item__accion--editar');
    expect(editar.getAttribute('aria-label')).toBe('Editar «Atención por Línea Alma»');
    expect(editar.getAttribute('href')).toBe('/gestion-contenidos/3');
  });

  it('avisa al padre al pedir eliminar, y se deshabilita mientras elimina', () => {
    let pedido: ContenidoAdminDto | undefined;
    fixture.componentInstance.eliminar.subscribe((c) => (pedido = c));
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.item__accion--eliminar');

    boton.click();
    expect(pedido?.id).toBe(3);

    fixture.componentRef.setInput('eliminando', true);
    fixture.detectChanges();
    expect(boton.disabled).toBeTrue();
  });

  it('identifica la tarjeta informativa cuando no hay enlace', () => {
    fixture.componentRef.setInput('contenido', { ...contenido, enlace: null });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tarjeta informativa');
  });
});
