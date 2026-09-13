import { DOCUMENT, DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/** `id` del contenedor principal de cada vista (destino del enlace de salto). */
export const ID_CONTENIDO_PRINCIPAL = 'contenido-principal';

/**
 * Gestión de foco al cambiar de ruta (WCAG 2.2 · 2.4.3 Orden del foco · 4.1.3).
 *
 * En una SPA el DOM del `<router-outlet>` se reemplaza pero el foco se queda en
 * el elemento anterior (o cae a `<body>` si desapareció). Quien navega con
 * teclado tendría que recorrer de nuevo todo el encabezado; quien usa lector de
 * pantalla no recibe ninguna señal de que la página cambió.
 *
 * Tras cada `NavigationEnd` se enfoca el `<main id="contenido-principal">`:
 * con el `title` de la ruta recién asignado, el lector anuncia el nuevo título
 * y la lectura continúa desde el inicio del contenido.
 *
 * Se omite en la navegación inicial (no hay contexto previo que perder) y
 * cuando el cambio es solo de fragmento/consulta en la misma vista.
 */
@Injectable({ providedIn: 'root' })
export class EnfoqueRutaService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private rutaAnterior: string | null = null;

  iniciar(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((evento) => {
        const rutaActual = evento.urlAfterRedirects.split(/[?#]/)[0];
        const primeraCarga = this.rutaAnterior === null;
        const mismaVista = this.rutaAnterior === rutaActual;
        this.rutaAnterior = rutaActual;
        if (primeraCarga || mismaVista) return;
        this.enfocarContenidoPrincipal();
      });
  }

  /**
   * Enfoca el contenedor principal. Espera un ciclo de renderizado porque, con
   * `loadComponent`, el componente de la ruta puede montarse justo después de
   * `NavigationEnd`.
   */
  enfocarContenidoPrincipal(): void {
    setTimeout(() => {
      const principal = this.document.getElementById(ID_CONTENIDO_PRINCIPAL);
      if (!principal) return;
      if (!principal.hasAttribute('tabindex')) principal.setAttribute('tabindex', '-1');
      principal.focus({ preventScroll: false });
    });
  }
}
