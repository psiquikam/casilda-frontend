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
  intl.itemsPerPageLabel = 'Registros por página:';
  intl.nextPageLabel = 'Página siguiente';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primera página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0) return '0 registros';
    if (page === 0 && length <= pageSize) {
      return `Mostrando ${length} ${length === 1 ? 'registro en total' : 'registros en total'}`;
    }
    const inicio = page * pageSize + 1;
    const fin = Math.min((page + 1) * pageSize, length);
    return `Mostrando ${inicio} - ${fin} de ${length} registros`;
  };
  return intl;
}
