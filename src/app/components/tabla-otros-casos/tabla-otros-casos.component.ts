import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

export function getSpanishPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Elementos por página:';
  paginatorIntl.nextPageLabel = 'Siguiente';
  paginatorIntl.previousPageLabel = 'Anterior';
  paginatorIntl.firstPageLabel = 'Primera página';
  paginatorIntl.lastPageLabel = 'Última página';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return `0 de ${length}`;
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} – ${endIndex} de ${length}`;
  };
  return paginatorIntl;
}

@Component({
    selector: 'app-tabla-otros-casos',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatCardModule,
    ],
    providers: [
        { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() }
    ],
    templateUrl: './tabla-otros-casos.component.html',
    styleUrls: ['./tabla-otros-casos.component.scss']
})
export class TablaOtrosCasosComponent implements AfterViewInit {

  displayedColumns: string[] = ['id', 'tiempoHechos', 'tipoViolencia', 'subcategoriaViolencia', 'descripcion', 'opcion'];

  @Input() dataSource!: MatTableDataSource<any>;
  @Input() serverSidePagination = false;
  @Input() totalElements = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 10;

  @Output() editar = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<any>();
  @Output() filter = new EventEmitter<{ column: string; event: Event }>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    if (!this.serverSidePagination) {
      this.dataSource.paginator = this.paginator;
    }
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  onEditar(element: any) {
    this.editar.emit(element);
  }

  onEliminar(element: any) {
    this.eliminar.emit(element);
  }

  applyFilter(column: string, event: Event) {
    this.filter.emit({ column, event });
  }
}
