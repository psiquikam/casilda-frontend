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

@Component({
  selector: 'app-modal-direccion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
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
  ciudades: string[] = [];
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
      ciudad: ['', Validators.required],
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
      map((lista) => lista.map((item) => item.nombre)),
      catchError((error) => {
        console.error(`Error cargando ciudades del departamento ${departamentoId}:`, error);
        return of([] as string[]);
      })
    ).subscribe((ciudades) => {
      this.ciudades = ciudades;
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.direccionForm.valid) {
      this.dialogRef.close(this.direccionForm.value);
    }
  }
}