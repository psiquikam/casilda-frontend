import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { FiltroColumnaDirective } from '../../core/a11y/filtro-columna.directive';

@Component({
    selector: 'app-tabla-citas',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatCardModule, FiltroColumnaDirective
    ],
    templateUrl: './tabla-citas.component.html',
    styleUrls: ['./tabla-citas.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed, void', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ]
})
export class TablaCitasComponent implements AfterViewInit {

  @Input() dataSource!: MatTableDataSource<any>;
  @Input() displayedColumns!: string[];
  @Input() expandedElement!: any;
  @Input() serverSidePagination = false;
  @Input() totalElements = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 10;

  @Output() iniciar = new EventEmitter<any>();
  @Output() reprogramar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<any>();
  @Output() expand = new EventEmitter<any>();
  @Output() filter = new EventEmitter<{ column: string, event: Event }>();
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

  iniciarAtencion(element: any) {
    this.iniciar.emit(element);
  }

  reprogramarCita(element: any) {
    this.reprogramar.emit(element);
  }

  cancelarCita(element: any) {
    this.cancelar.emit(element);
  }

  toggleExpand(element: any) {
    this.expand.emit(element);
  }

  applyFilter(column: string, event: Event) {
    this.filter.emit({ column, event });
  }
}