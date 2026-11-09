import { DestroyRef, Injectable, Signal, computed, inject, signal, untracked } from '@angular/core';
import { ahoraSegunServidor } from './sla';

const TICK_MS = 1000;

/**
 * Reloj del servidor (equivale al `useCuentaRegresiva` del plan, J-0.3). Se **sincroniza** con cada
 * `ahoraServidor` que llega en un DTO y a partir de ahí avanza con el tiempo transcurrido en el
 * navegador: nunca usa la hora absoluta local, así que un reloj desfasado o en otra zona horaria
 * no cambia qué está vencido (R6). Un solo intervalo de 1 s alimenta todos los `SlaBadge`.
 */
@Injectable({ providedIn: 'root' })
export class RelojServidorService {
  private readonly ancla = signal<{ ahoraServidor: string; recibidoEn: number } | null>(null);
  private readonly tick = signal(Date.now());
  private intervalo: ReturnType<typeof setInterval> | null = null;

  /** «Ahora» en milisegundos según el servidor; `null` hasta la primera sincronización. */
  readonly ahora: Signal<number | null> = computed(() => {
    const ancla = this.ancla();
    return ancla ? ahoraSegunServidor(ancla.ahoraServidor, ancla.recibidoEn, this.tick()) : null;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detener());
  }

  /** Toma como referencia la hora del servidor recién recibida. Las más recientes reemplazan a las anteriores. */
  sincronizar(ahoraServidor: string): void {
    if (!ahoraServidor || Number.isNaN(Date.parse(ahoraServidor))) return;
    // `untracked`: puede llamarse desde un `effect` (SlaBadge) y no debe quedar suscrito a su propia ancla.
    const actual = untracked(this.ancla);
    if (actual && (actual.ahoraServidor === ahoraServidor || Date.parse(actual.ahoraServidor) > Date.parse(ahoraServidor))) return;
    this.ancla.set({ ahoraServidor, recibidoEn: Date.now() });
    this.tick.set(Date.now());
    this.iniciar();
  }

  private iniciar(): void {
    if (this.intervalo !== null) return;
    this.intervalo = setInterval(() => this.tick.set(Date.now()), TICK_MS);
  }

  private detener(): void {
    if (this.intervalo !== null) clearInterval(this.intervalo);
    this.intervalo = null;
  }
}
