import { TestBed } from '@angular/core/testing';

import { CASILDA_STORAGE_PREFIX, QuickExitService } from './quick-exit.service';

describe('QuickExitService', () => {
  let service: QuickExitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuickExitService);
    spyOn(service, 'navegarADestinoSeguro');
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('debe crearse con un destino neutral configurado por entorno', () => {
    expect(service).toBeTruthy();
    expect(service.destinoSeguro).toMatch(/^https?:\/\//);
  });

  it('debe limpiar sessionStorage y las llaves sensibles de localStorage', () => {
    sessionStorage.setItem('borrador-reporte', 'texto sensible');
    localStorage.setItem(`${CASILDA_STORAGE_PREFIX}borrador`, 'texto sensible');
    localStorage.setItem('userSession', '{"token":"abc"}');
    localStorage.setItem('preferencia-udea-ajena', 'conservar');

    service.ejecutar();

    expect(sessionStorage.length).toBe(0);
    expect(localStorage.getItem(`${CASILDA_STORAGE_PREFIX}borrador`)).toBeNull();
    expect(localStorage.getItem('userSession')).toBeNull();
    expect(localStorage.getItem('preferencia-udea-ajena')).toBe('conservar');
  });

  it('debe redirigir al destino seguro al ejecutarse', () => {
    service.ejecutar();

    expect(service.navegarADestinoSeguro).toHaveBeenCalledTimes(1);
  });
});
