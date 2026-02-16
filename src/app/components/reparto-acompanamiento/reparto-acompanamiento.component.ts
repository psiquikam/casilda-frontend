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
import { ActivatedRoute, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { RepartoModalComponent } from '../reparto-modal/reparto-modal.component';


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
  selector: 'app-reparto-acompanamiento',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatTableModule, MatPaginatorModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() }
  ],
  templateUrl: './reparto-acompanamiento.component.html',
  styleUrls: ['./reparto-acompanamiento.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class RepartoAcompanamientoComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);


  @ViewChild(MatPaginator) paginator!: MatPaginator;

  repartoForm!: FormGroup;
  codigoCaso: string = 'Seleccione un caso';
  displayedColumns: string[] = ['expand', 'id', 'nombre', 'fecha', 'dependencia', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  expandedElement: any | null;

  filterValues = { id: '', nombre: '', fecha: '', dependencia: '' };

  datosSimulados = [
    {
      id: 'CAS-2001', nombre: 'Laura Restrepo', documento: '10359874', fecha: '2026-02-01', dependencia: 'Bienestar',
      tipoSolicitud: 'Psicosocial', facultad: 'Artes', campus: 'Norte', genero: 'Femenino', edad: 20, celular: '3109988776',
      cargo: 'Estudiante', telefono: '6012233', correoInst: 'l.restrepo@U.edu.co', correoPers: 'laura.res@gmail.com'
    },
    {
      id: 'ACO-2002', nombre: 'Miguel Cano', documento: '71234456', fecha: '2026-02-03', dependencia: 'Jurídica',
      tipoSolicitud: 'Asesoría', facultad: 'Derecho', campus: 'Principal', genero: 'Masculino', edad: 24, celular: '3154433221',
      cargo: 'Egresado', telefono: '6014455', correoInst: 'm.cano@U.edu.co', correoPers: 'miguel.c@outlook.com'
    },
    {
      id: 'CAS-2003', nombre: 'Elena Vasquez', documento: '43567812', fecha: '2026-02-05', dependencia: 'Salud',
      tipoSolicitud: 'Médica', facultad: 'Ingeniería', campus: 'Sur', genero: 'Femenino', edad: 21, celular: '3201122334',
      cargo: 'Estudiante', telefono: '6019900', correoInst: 'e.vasquez@U.edu.co', correoPers: 'elena.v@gmail.com'
    }
  ];

  tiposAsignacion = ['Prioritaria', 'Ordinaria', 'Seguimiento'];
  servicios = ['Psicología', 'Asesoría Jurídica', 'Trabajo Social', 'Dupla Psicosocial'];
  profesionales = [
    { id: 1, nombre: 'Dra. Elena Gómez', cargo: 'Abogada' },
    { id: 2, nombre: 'Dr. Ricardo Luna', cargo: 'Psicólogo' },
    { id: 3, nombre: 'Dupla A (Social/Psico)', cargo: 'Dupla' }
  ];

  ngOnInit() {
    this.dataSource.data = this.datosSimulados;
    this.dataSource.filterPredicate = this.createFilter();

    const idUrl = this.route.snapshot.paramMap.get('codigo');
    if (idUrl) this.codigoCaso = idUrl;

    this.repartoForm = this.fb.group({
      tipoAsignacion: ['', Validators.required],
      fechaReparto: [{ value: new Date().toLocaleDateString(), disabled: true }],
      servicio: ['', Validators.required],
      asignadoA: ['', Validators.required],
      observaciones: ['', [Validators.required, Validators.minLength(10)]]
    });
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

  guardarReparto() {
    if (this.repartoForm.valid) {
      const index = this.dataSource.data.findIndex(c => c.id === this.codigoCaso);
      if (index !== -1) {
        const newData = [...this.dataSource.data];
        newData.splice(index, 1);
        this.dataSource.data = newData;
      }
      this.repartoForm.reset({ fechaReparto: new Date().toLocaleDateString() });
      this.codigoCaso = 'Seleccione un caso';
      this.expandedElement = null;
    }
  }

  abrirModal(caso: any) {
  const dialogRef = this.dialog.open(RepartoModalComponent, {
    width: '650px',
    data: caso
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      const index = this.dataSource.data.findIndex(c => c.id === result.caso.id);
      if (index !== -1) {
        const newData = [...this.dataSource.data];
        newData.splice(index, 1);
        this.dataSource.data = newData;
      }
    }
  });
}


  regresar() {
    this.router.navigate(['/consulta']);
  }
}