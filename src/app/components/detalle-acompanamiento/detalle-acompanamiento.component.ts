import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModalGestionComponent } from '../modal-gestion-contacto/modal-gestion-contacto.component';


export function getSpanishPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Items:';
  paginatorIntl.nextPageLabel = 'Siguiente';
  paginatorIntl.previousPageLabel = 'Anterior';
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
  selector: 'app-detalle-acompanamiento',
  standalone: true,
  imports: [
  CommonModule,
  ReactiveFormsModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatButtonModule,
  MatTableModule,
  MatIconModule,
  MatPaginatorModule,
  MatDialogModule
],
  providers: [
    { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() }
  ],
  templateUrl: './detalle-acompanamiento.component.html',
  styleUrls: ['./detalle-acompanamiento.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class DetalleAcompanamientoComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);


  @ViewChild(MatPaginator) paginator!: MatPaginator;

  idCaso: string = 'Seleccione un caso';
  contactoForm!: FormGroup;
  
  displayedColumns: string[] = ['expand', 'id', 'nombre', 'fecha', 'dependencia', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  expandedElement: any | null;
  filterValues = { id: '', nombre: '', fecha: '', dependencia: '' };

  datosSimulados = [
    { id: 'CAS-2001', nombre: 'Laura Restrepo', documento: '10359874', fecha: '2026-02-01', dependencia: 'Bienestar', tipoSolicitud: 'Psicosocial', celular: '3109988776', correoInst: 'l.restrepo@U.edu.co', facultad: 'Artes', campus: 'Norte' },
    { id: 'ACO-2002', nombre: 'Miguel Cano', documento: '71234456', fecha: '2026-02-03', dependencia: 'Jurídica', tipoSolicitud: 'Asesoría', celular: '3154433221', correoInst: 'm.cano@U.edu.co', facultad: 'Derecho', campus: 'Central' },
    { id: 'CAS-2003', nombre: 'Elena Vasquez', documento: '43567812', fecha: '2026-02-05', dependencia: 'Salud', tipoSolicitud: 'Médica', celular: '3201122334', correoInst: 'e.vasquez@U.edu.co', facultad: 'Salud', campus: 'Sur' }
  ];

  historialContactos: any[] = [];
  columnasHistorial: string[] = ['fecha', 'jornada', 'resultado', 'observacion'];
  resultados = ['Exitoso (Cita agendada)', 'No contesta', 'Buzón de voz', 'Número equivocado', 'Solicita llamar luego'];
  jornadas = ['Mañana', 'Tarde'];

  ngOnInit(): void {
    this.dataSource.data = this.datosSimulados;
    this.dataSource.filterPredicate = this.createFilter();

    this.contactoForm = this.fb.group({
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      hora: ['08:00', Validators.required],
      jornada: ['', Validators.required],
      resultado: ['', Validators.required],
      observacion: ['', [Validators.required, Validators.minLength(5)]]
    });

    const idUrl = this.route.snapshot.paramMap.get('id');
    if (idUrl) {
      const caso = this.datosSimulados.find(c => c.id === idUrl);
      if (caso) this.seleccionarCaso(caso);
    }
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

  seleccionarCaso(caso: any) {
    this.idCaso = caso.id;
    this.historialContactos = [
      { fecha: '2026-02-10', hora: '10:00 AM', jornada: 'Mañana', resultado: 'No contesta', observacion: 'Se intentó contacto sin éxito.' }
    ];
    this.contactoForm.patchValue({ jornada: '', resultado: '', observacion: '' });
    
    setTimeout(() => {
      const element = document.getElementById('seccion-gestion');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  registrarIntento(): void {
    if (this.contactoForm.valid) {
      const val = this.contactoForm.value;
      const nuevo = {
        fecha: val.fecha,
        hora: this.formatearHora(val.hora),
        jornada: val.jornada,
        resultado: val.resultado,
        observacion: val.observacion
      };
      this.historialContactos = [nuevo, ...this.historialContactos];
      this.contactoForm.patchValue({ jornada: '', resultado: '', observacion: '' });
    }
  }

  abrirModalGestion(caso: any) {
  this.dialog.open(ModalGestionComponent, {
    width: '900px',
    maxWidth: '95vw',
    data: caso
  });
}

  private formatearHora(hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  regresar() {
    this.router.navigate(['/consulta']);
  }
}