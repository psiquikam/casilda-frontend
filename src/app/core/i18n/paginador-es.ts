import { MatPaginatorIntl } from '@angular/material/paginator';

/**
 * Textos en español del paginador de Angular Material.
 *
 * Se provee **una sola vez** a nivel de aplicación (`app.config.ts`) para que
 * toda tabla nueva nazca traducida; antes cada componente traía su copia.
 * Las etiquetas alimentan el nombre accesible de los botones del paginador.
 */
export function getPaginadorIntlEs(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Elementos por página:';
  intl.nextPageLabel = 'Página siguiente';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primera página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return `0 de ${length}`;
    const inicio = page * pageSize;
    const fin = inicio < length ? Math.min(inicio + pageSize, length) : inicio + pageSize;
    return `${inicio + 1} – ${fin} de ${length}`;
  };
  return intl;
}
