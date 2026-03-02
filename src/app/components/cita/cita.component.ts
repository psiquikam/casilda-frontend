import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { ReprogramarCitaModalComponent } from '../modal-reprogramar-cita/modal-reprogramar-cita.component';

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
  selector: 'app-cita',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatTableModule, MatPaginatorModule, MatTooltipModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() }
  ],
  templateUrl: './cita.component.html',
  styleUrls: ['./cita.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class CitaComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['expand', 'id', 'nombre', 'fecha', 'dependencia', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  expandedElement: any | null;

  filterValues = { id: '', nombre: '', fecha: '', dependencia: '' };

  datosSimulados = [
    {
      id: 'ACO-2002', nombre: 'Miguel Cano', documento: '71234456', fecha: '2026-02-03', dependencia: 'Jurídica',
      estado: 'Programada',
      tipoSolicitud: 'Asesoría', facultad: 'Derecho', campus: 'Principal', genero: 'Masculino', edad: 24, celular: '3154433221',
      cargo: 'Egresado', telefono: '6014455', correoInst: 'm.cano@U.edu.co', correoPers: 'miguel.c@outlook.com'
    }
  ];

  ngOnInit() {
    this.dataSource.data = this.datosSimulados;
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    (this.filterValues as any)[column] = filterValue.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  createFilter(): (data: any, filter: string) => boolean {
    return (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      return data.id.toLowerCase().includes(searchTerms.id)
        && data.nombre.toLowerCase().includes(searchTerms.nombre)
        && data.fecha.toLowerCase().includes(searchTerms.fecha)
        && data.dependencia.toLowerCase().includes(searchTerms.dependencia);
    };
  }

  iniciarAtencion(caso: any) {
    console.log('Iniciando atención para:', caso.id);
  }

  reprogramarCita(caso: any) {
    this.abrirModalGestion(caso, 'reprogramar');
  }

  cancelarCita(caso: any) {
    this.abrirModalGestion(caso, 'cancelar');
  }

  private abrirModalGestion(caso: any, accion: 'cancelar' | 'reprogramar') {
    const dialogRef = this.dialog.open(ReprogramarCitaModalComponent, {
      width: '600px',
      data: { caso: caso, accion: accion }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.accion === 'cancelar') {
          this.dataSource.data = this.dataSource.data.filter(c => c.id !== result.id);
        } else {
          const index = this.dataSource.data.findIndex(c => c.id === result.id);
          if (index !== -1) {
            this.dataSource.data[index].fecha = result.formulario.fechaCita;
            this.dataSource._updateChangeSubscription();
          }
        }
      }
    });
  }

  regresar() {
    this.router.navigate(['/consulta']);
  }
}