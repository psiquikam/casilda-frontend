import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlmaApiClient } from '../http/alma-api.client';
import { ItemCatalogo } from '../types/alma.types';
import { CatalogosAlmaService, etiquetaDe, etiquetasDe } from './catalogos-alma.service';

/** J-0.2 — caché por nombre, filtro de activos e invalidación. */
describe('CatalogosAlmaService', () => {
  const items: ItemCatalogo[] = [
    { codigo: 'DIM_01', etiqueta: 'Dimensión 1', activo: true },
    { codigo: 'DIM_02', etiqueta: 'Dimensión 2', activo: false },
    { codigo: 'DIM_03', etiqueta: 'Dimensión 3', activo: true }
  ];
  let api: jasmine.SpyObj<AlmaApiClient>;
  let servicio: CatalogosAlmaService;

  beforeEach(() => {
    api = jasmine.createSpyObj<AlmaApiClient>('AlmaApiClient', ['get']);
    api.get.and.returnValue(of(items));
    TestBed.configureTestingModule({ providers: [{ provide: AlmaApiClient, useValue: api }] });
    servicio = TestBed.inject(CatalogosAlmaService);
  });

  it('pide el catálogo por nombre y devuelve solo los activos', () => {
    let recibidos: ItemCatalogo[] = [];
    servicio.obtener('dimensiones-salud-mental').subscribe((r) => (recibidos = r));
    expect(api.get).toHaveBeenCalledWith('/catalogos/dimensiones-salud-mental');
    expect(recibidos.map((i) => i.codigo)).toEqual(['DIM_01', 'DIM_03']);
  });

  it('cachea por nombre: dos lecturas del mismo catálogo son una sola petición', () => {
    servicio.obtener('dimensiones-salud-mental').subscribe();
    servicio.obtener('dimensiones-salud-mental').subscribe();
    servicio.obtener('vinculos-agresor').subscribe();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('`invalidar` descarta la caché para poder reintentar', () => {
    servicio.obtener('resultados-intento').subscribe();
    servicio.invalidar('resultados-intento');
    servicio.obtener('resultados-intento').subscribe();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('`etiquetaDe` y `etiquetasDe` conservan el código cuando el catálogo no lo conoce (dato histórico)', () => {
    expect(etiquetaDe(items, 'DIM_01')).toBe('Dimensión 1');
    expect(etiquetaDe(items, 'VIEJO')).toBe('VIEJO');
    expect(etiquetaDe(items, null)).toBe('');
    expect(etiquetasDe(items, ['DIM_03', 'VIEJO', 'DIM_01'])).toEqual(['Dimensión 1', 'Dimensión 3', 'VIEJO']);
  });
});
