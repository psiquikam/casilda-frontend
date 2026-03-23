import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MaestroDto } from '../../services/listas.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-modal-direccion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './modal-direccion.component.html',
  styleUrls: ['./modal-direccion.component.scss']
})
export class ModalDireccionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  direccionForm!: FormGroup;

  departamentos: MaestroDto[] = [];
  ciudades: MaestroDto[] = [];
  vias = ['Calle', 'Carrera', 'Avenida', 'Transversal', 'Diagonal', 'Circular'];

  constructor(
    public dialogRef: MatDialogRef<ModalDireccionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.cargarDepartamentos();
    this.inicializarFormulario();
    this.suscribirCambiosDepartamento();
  }

  private inicializarFormulario(): void {
    this.direccionForm = this.fb.group({
      departamento: ['', Validators.required],
      ciudad: [null, Validators.required],
      viaPrincipal: ['', Validators.required],
      numeroVia: ['', Validators.required],
      letraVia: [''],
      numeroCruce: ['', Validators.required],
      placa: ['', Validators.required],
      barrio: ['', Validators.required],
      complemento: ['']
    });
  }

  private cargarDepartamentos(): void {
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/departamentos`).pipe(
      catchError((error) => {
        console.error('Error cargando departamentos:', error);
        return of([] as MaestroDto[]);
      })
    ).subscribe((depts) => {
      this.departamentos = depts.sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  }

  private suscribirCambiosDepartamento(): void {
    this.direccionForm.get('departamento')?.valueChanges.subscribe((departamentoId) => {
      this.cargarCiudadesPorDepartamento(departamentoId);
      this.direccionForm.get('ciudad')?.setValue('');
    });
  }

  private cargarCiudadesPorDepartamento(departamentoId: number | null): void {
    if (!departamentoId) {
      this.ciudades = [];
      return;
    }

    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/departamentos/${departamentoId}/ciudades`).pipe(
      catchError((error) => {
        console.error(`Error cargando ciudades del departamento ${departamentoId}:`, error);
        return of([] as MaestroDto[]);
      })
    ).subscribe((ciudades) => {
      this.ciudades = ciudades;
    });
  }
  
  get direccionPreview(): string {
    const v = this.direccionForm.value;
    const partes: string[] = [];
    if (v.viaPrincipal && v.numeroVia) {
      let via = `${v.viaPrincipal} ${v.numeroVia}`;
      if (v.letraVia) via += ` ${v.letraVia}`;
      if (v.numeroCruce) via += ` #${v.numeroCruce}`;
      if (v.placa) via += `-${v.placa}`;
      partes.push(via);
    }
    if (v.barrio) partes.push(`Barrio ${v.barrio}`);
    if (v.complemento) partes.push(v.complemento);
    const municipio = this.ciudades.find((c) => c.id === v.ciudad)?.nombre;
    const departamento = this.departamentos.find((d) => d.id === v.departamento)?.nombre;
    if (municipio) partes.push(municipio);
    if (departamento) partes.push(departamento);
    return partes.length ? partes.join(', ') : 'La dirección aparecerá aquí...';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.direccionForm.valid) {
      const formValue = this.direccionForm.getRawValue();
      const departamentoNombre = this.departamentos.find((d) => d.id === formValue.departamento)?.nombre ?? '';
      const municipioNombre = this.ciudades.find((c) => c.id === formValue.ciudad)?.nombre ?? '';

      this.dialogRef.close({
        ...formValue,
        departamentoId: formValue.departamento,
        ciudadId: formValue.ciudad,
        departamento: departamentoNombre,
        municipio: municipioNombre,
        barrio: formValue.barrio
      });
    }
  }
}