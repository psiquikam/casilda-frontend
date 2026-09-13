import { DOCUMENT } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { EnfoqueRutaService, ID_CONTENIDO_PRINCIPAL } from './enfoque-ruta.service';

describe('EnfoqueRutaService', () => {
  let servicio: EnfoqueRutaService;
  let eventos: Subject<unknown>;
  let principal: HTMLElement;

  const navegar = (url: string) => eventos.next(new NavigationEnd(1, url, url));

  beforeEach(() => {
    eventos = new Subject();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { events: eventos.asObservable() } }]
    });
    servicio = TestBed.inject(EnfoqueRutaService);
    principal = TestBed.inject(DOCUMENT).createElement('main');
    principal.id = ID_CONTENIDO_PRINCIPAL;
    document.body.appendChild(principal);
    servicio.iniciar();
  });

  afterEach(() => principal.remove());

  it('no mueve el foco en la carga inicial', fakeAsync(() => {
    navegar('/home');
    tick();
    expect(document.activeElement).not.toBe(principal);
  }));

  it('enfoca el contenido principal al cambiar de vista', fakeAsync(() => {
    navegar('/home');
    navegar('/formulario-anonimo');
    tick();
    expect(principal.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(principal);
  }));

  it('ignora cambios de fragmento dentro de la misma vista', fakeAsync(() => {
    navegar('/home');
    navegar('/home#servicios');
    tick();
    expect(document.activeElement).not.toBe(principal);
  }));
});
