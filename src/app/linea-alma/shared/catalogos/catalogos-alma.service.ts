import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { AlmaApiClient } from '../http/alma-api.client';
import { ItemCatalogo, NombreCatalogo } from '../types/alma.types';

/**
 * Lectura de catálogos de Línea Alma por nombre, con caché por sesión (`GET /catalogos/{nombre}`).
 * Equivale al `useCatalogo(nombre)` del plan (J-0.2, dueño: Jonathan). **Único punto** por el que
 * APH y Psicología leen catálogos (plan §10.2): así dos pantallas nunca ven valores distintos
 * para el mismo catálogo.
 *
 * Solo se exponen los ítems **activos**. Un catálogo caído no se enmascara con una lista
 * inventada: el error llega a la pantalla, que lo muestra con reintento (`invalidar()` antes).
 * Los catálogos placeholder (Q6, p. ej. «Dimensión 1…15») viven en el mock; reemplazarlos por los
 * oficiales del Backend es transparente para los consumidores.
 */
@Injectable({ providedIn: 'root' })
export class CatalogosAlmaService {
  private readonly api = inject(AlmaApiClient);
  private readonly cache = new Map<NombreCatalogo, Observable<ItemCatalogo[]>>();

  obtener(nombre: NombreCatalogo): Observable<ItemCatalogo[]> {
    let consulta = this.cache.get(nombre);
    if (!consulta) {
      consulta = this.api
        .get<ItemCatalogo[]>(`/catalogos/${nombre}`)
        .pipe(
          map((items) => items.filter((item) => item.activo)),
          shareReplay({ bufferSize: 1, refCount: false })
        );
      this.cache.set(nombre, consulta);
    }
    return consulta;
  }

  /** Descarta la caché de un catálogo (p. ej. tras un error, para reintentar). */
  invalidar(nombre?: NombreCatalogo): void {
    if (nombre) this.cache.delete(nombre);
    else this.cache.clear();
  }
}

/** Etiqueta de un código, o el propio código si el catálogo no lo trae (dato histórico). */
export function etiquetaDe(items: readonly ItemCatalogo[] | null | undefined, codigo: string | null | undefined): string {
  if (!codigo) return '';
  return items?.find((item) => item.codigo === codigo)?.etiqueta ?? codigo;
}

/** Etiquetas de varios códigos, en el orden del catálogo (los desconocidos van al final con su código). */
export function etiquetasDe(items: readonly ItemCatalogo[] | null | undefined, codigos: readonly string[]): string[] {
  const conocidos = (items ?? []).filter((item) => codigos.includes(item.codigo)).map((item) => item.etiqueta);
  const desconocidos = codigos.filter((codigo) => !(items ?? []).some((item) => item.codigo === codigo));
  return [...conocidos, ...desconocidos];
}
