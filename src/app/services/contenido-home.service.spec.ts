import { TestBed } from '@angular/core/testing';

import { ContenidoDestacadoDto, ContenidoHomeService, estaVigente } from './contenido-home.service';

describe('ContenidoHomeService', () => {
  let service: ContenidoHomeService;

  const contenidoBase: ContenidoDestacadoDto = {
    id: 99,
    imagen: 'assets/distintivo_casilda.svg',
    titulo: 'Contenido de prueba',
    contenido: 'Descripción',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    seccion: 'acciones'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContenidoHomeService);
  });

  it('debe entregar contenido para las dos secciones del home', (done) => {
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
