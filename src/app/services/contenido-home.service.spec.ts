import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ContenidoDestacadoDto, ContenidoHomeService, estaVigente } from './contenido-home.service';
import { environment } from '../../environments/environment';

describe('ContenidoHomeService', () => {
  let service: ContenidoHomeService;
  let http: HttpTestingController;
  const modoOriginal = environment.datosDemostracion;

  const contenidoBase: ContenidoDestacadoDto = {
    id: 99,
    imagen: 'assets/distintivo_casilda_morado.svg',
    titulo: 'Contenido de prueba',
    contenido: 'Descripción',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    seccion: 'acciones'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ContenidoHomeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    environment.datosDemostracion = modoOriginal;
    http.verify();
  });

  it('en modo de demostración entrega contenido para las dos secciones del home, sin red', (done) => {
    environment.datosDemostracion = true;
    service.listarContenidoVigente(new Date('2026-06-01T00:00:00Z')).subscribe({
      next: (contenidos) => {
        expect(contenidos.length).toBeGreaterThan(0);
        expect(contenidos.some((c) => c.seccion === 'acciones')).toBeTrue();
        expect(contenidos.some((c) => c.seccion === 'informacion')).toBeTrue();
        contenidos.forEach((c) => {
          expect(c.imagen).toBeTruthy();
          expect(c.titulo).toBeTruthy();
          expect(c.contenido).toBeTruthy();
        });
        done();
      },
      error: done.fail
    });
  });

  it('fuera del modo de demostración consulta el endpoint público y filtra la vigencia', (done) => {
    environment.datosDemostracion = false;
    const vencido = { ...contenidoBase, id: 100, vigenciaFin: '2026-02-01T00:00:00Z' };

    service.listarContenidoVigente(new Date('2026-06-01T00:00:00Z')).subscribe({
      next: (contenidos) => {
        expect(contenidos.map((c) => c.id)).toEqual([99]);
        done();
      },
      error: done.fail
    });

    const peticion = http.expectOne(service.endpoint);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([contenidoBase, vencido]);
  });

  it('debe excluir contenido cuya vigencia aún no inicia', () => {
    const futuro = { ...contenidoBase, vigenciaInicio: '2027-01-01T00:00:00Z' };

    expect(estaVigente(futuro, new Date('2026-06-01T00:00:00Z'))).toBeFalse();
  });

  it('debe excluir contenido cuya vigencia ya expiró', () => {
    const expirado = { ...contenidoBase, vigenciaFin: '2026-02-01T00:00:00Z' };

    expect(estaVigente(expirado, new Date('2026-06-01T00:00:00Z'))).toBeFalse();
  });

  it('debe incluir contenido vigente sin fecha de expiración', () => {
    expect(estaVigente(contenidoBase, new Date('2026-06-01T00:00:00Z'))).toBeTrue();
  });

  it('debe construir el endpoint sobre environment.apiBaseUrl', () => {
    expect(service.endpoint.endsWith('/contenidos/home')).toBeTrue();
  });
});
