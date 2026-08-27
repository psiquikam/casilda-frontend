import { Component, Inject, OnInit, inject } from '@angular/core';

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
    imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
],
    templateUrl: './modal-direccion.component.html',
    styleUrls: ['./modal-direccion.component.scss']
})
export class ModalDireccionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  direccionForm!: FormGroup;

  vias = ['Calle', 'Carrera', 'Avenida', 'Transversal', 'Diagonal', 'Circular'];

  constructor(
    public dialogRef: MatDialogRef<ModalDireccionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  private inicializarFormulario(): void {
    this.direccionForm = this.fb.group({
      viaPrincipal: ['', Validators.required],
      numeroVia: ['', Validators.required],
      letraVia: [''],
      numeroCruce: ['', Validators.required],
      placa: ['', Validators.required],
      barrio: [''],
      complemento: ['']
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
    return partes.length ? partes.join(', ') : 'La dirección aparecerá aquí...';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.direccionForm.valid) {
      const formValue = this.direccionForm.getRawValue();

      this.dialogRef.close({
        ...formValue,
        barrio: formValue.barrio
      });
    }
  }
}