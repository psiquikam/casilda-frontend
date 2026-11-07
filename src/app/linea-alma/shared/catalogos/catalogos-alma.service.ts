import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { AlmaApiClient } from '../http/alma-api.client';
import { ItemCatalogo, NombreCatalogo } from '../types/alma.types';

/**
 * Lectura de catálogos de Línea Alma por nombre, con caché por sesión (`GET /catalogos/{nombre}`).
 *
 * **PROVISIONAL — dueño: Jonathan (J-0.2, `useCatalogo`).** Este servicio cubre lo que APH
 * necesita (destinos, rutas, motivos de cierre, consentimiento) con la misma forma de
 * contrato; cuando J-0.2 llegue, su versión lo reemplaza sin cambiar a los consumidores
 * (`obtener(nombre)`). Solo se leen **activos**: un catálogo caído no se enmascara con una
 * lista inventada (el error llega a la pantalla, que lo muestra con reintento).
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
