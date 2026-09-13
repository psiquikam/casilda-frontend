import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Sufijo institucional que acompaña al título de cada vista. */
export const SUFIJO_TITULO = 'Casilda — UdeA';

/**
 * Estrategia de título del documento (WCAG 2.2 · 2.4.2 Página titulada).
 *
 * Toma el `title` declarado en cada ruta y le añade el sufijo institucional,
 * con lo distintivo al inicio: es lo primero que anuncia el lector de pantalla
 * y lo que distingue las pestañas en el navegador y en el historial.
 */
@Injectable({ providedIn: 'root' })
export class CasildaTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pagina = this.buildTitle(snapshot);
    this.title.setTitle(pagina ? `${pagina} | ${SUFIJO_TITULO}` : SUFIJO_TITULO);
  }
}
