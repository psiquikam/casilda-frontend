import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RelojServidorService } from './reloj-servidor.service';

describe('RelojServidorService (cuenta regresiva anclada al servidor)', () => {
  let reloj: RelojServidorService;

  beforeEach(() => {
    reloj = TestBed.inject(RelojServidorService);
  });

  it('no sabe la hora hasta sincronizarse', () => {
    expect(reloj.ahora()).toBeNull();
  });

  it('avanza con el tiempo transcurrido desde la sincronización', fakeAsync(() => {
    reloj.sincronizar('2026-11-06T10:00:00-05:00');
    const inicio = reloj.ahora()!;
    expect(inicio).toBe(Date.parse('2026-11-06T10:00:00-05:00'));
    tick(3000);
    expect(reloj.ahora()! - inicio).toBeGreaterThanOrEqual(3000);
    TestBed.resetTestingModule();
  }));

  it('ignora una hora de servidor más antigua que la ya conocida y valores inválidos', () => {
    reloj.sincronizar('2026-11-06T10:00:00-05:00');
    reloj.sincronizar('2026-11-06T09:00:00-05:00');
    reloj.sincronizar('no-es-fecha');
    expect(reloj.ahora()).toBeGreaterThanOrEqual(Date.parse('2026-11-06T10:00:00-05:00'));
    TestBed.resetTestingModule();
  });
});
