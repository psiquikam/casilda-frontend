import { Component, OnInit, inject } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-reparto-acompanamiento',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatTableModule
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
export class RepartoAcompanamientoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  repartoForm!: FormGroup;
  codigoCaso: string = 'Seleccione un caso';

  displayedColumns: string[] = ['expand', 'id', 'nombre', 'fecha', 'dependencia', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  expandedElement: any | null;

  datosSimulados = [
    {
      id: 'CAS-2001', nombre: 'Laura Restrepo', documento: '10359874', fecha: '2026-02-01', dependencia: 'Bienestar', estado: 'Abierto activo',
      tipoSolicitud: 'Psicosocial', facultad: 'Artes', campus: 'Norte', genero: 'Femenino', edad: 20, celular: '3109988776',
      cargo: 'Estudiante', telefono: '6012233', correoInst: 'l.restrepo@U.edu.co', correoPers: 'laura.res@gmail.com'
    },
    {
      id: 'ACO-2002', nombre: 'Miguel Cano', documento: '71234456', fecha: '2026-02-03', dependencia: 'Jurídica', estado: 'Abierto activo',
      tipoSolicitud: 'Asesoría', facultad: 'Derecho', campus: 'Principal', genero: 'Masculino', edad: 24, celular: '3154433221',
      cargo: 'Egresado', telefono: '6014455', correoInst: 'm.cano@U.edu.co', correoPers: 'miguel.c@outlook.com'
    },
    {
      id: 'CAS-2003', nombre: 'Elena Vasquez', documento: '43567812', fecha: '2026-02-05', dependencia: 'Salud', estado: 'Abierto activo',
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
    const idUrl = this.route.snapshot.paramMap.get('codigo');
    if (idUrl) this.codigoCaso = idUrl;

    this.dataSource.data = this.datosSimulados;

    this.repartoForm = this.fb.group({
      tipoAsignacion: ['', Validators.required],
      fechaReparto: [{ value: new Date().toLocaleDateString(), disabled: true }],
      servicio: ['', Validators.required],
      asignadoA: ['', Validators.required],
      observaciones: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  guardarReparto() {
    if (this.repartoForm.valid) {
      console.log(`Asignando caso ${this.codigoCaso}...`, this.repartoForm.value);
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

  seleccionarCaso(caso: any) {
    this.codigoCaso = caso.id;
    this.repartoForm.patchValue({ observaciones: '', tipoAsignacion: '', servicio: '', asignadoA: '' });

    setTimeout(() => {
      const formElement = document.getElementById('formulario-asignacion');
      if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  regresar() {
    this.router.navigate(['/consulta']);
  }
}