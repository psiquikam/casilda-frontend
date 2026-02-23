import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reparto-modal',
  standalone: true,
  templateUrl: './modal-reparto.component.html',
  styleUrls: ['./modal-reparto.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class RepartoModalComponent {
  repartoForm: FormGroup;
  profesionalesAsignados: any[] = [];

  tiposAsignacion = ['Prioritaria', 'Ordinaria', 'Seguimiento'];
  servicios = ['Psicología', 'Asesoría Jurídica', 'Trabajo Social', 'Dupla Psicosocial'];

  opcionesAsignacion = [
    { id: 'p1', nombre: 'Dra. Elena Gómez', esGrupo: false, integrantes: [] },
    { id: 'p2', nombre: 'Dr. Ricardo Luna', esGrupo: false, integrantes: [] },
    { id: 'p3', nombre: 'Mg. Sofía Reyes', esGrupo: false, integrantes: [] },
    { 
      id: 'd1', 
      nombre: 'Dupla 1 (Elena & Ricardo)', 
      esGrupo: true, 
      integrantes: [
        { id: 'p1', nombre: 'Dra. Elena Gómez' },
        { id: 'p2', nombre: 'Dr. Ricardo Luna' }
      ] 
    },
    { 
      id: 'd2', 
      nombre: 'Dupla 2 (Sofía & Marina)', 
      esGrupo: true, 
      integrantes: [
        { id: 'p3', nombre: 'Mg. Sofía Reyes' },
        { id: 'p4', nombre: 'Dra. Marina Silva' }
      ] 
    }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RepartoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.repartoForm = this.fb.group({
      tipoAsignacion: ['', Validators.required],
      fechaReparto: [new Date().toISOString().substring(0, 10), Validators.required],
      servicio: ['', Validators.required],
      seleccionTemp: [''], 
      observaciones: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  agregarAsignacion() {
    const idSeleccionado = this.repartoForm.get('seleccionTemp')?.value;
    if (!idSeleccionado) return;

    const opcion = this.opcionesAsignacion.find(o => o.id === idSeleccionado);
    
    if (opcion) {
      if (opcion.esGrupo) {
        opcion.integrantes.forEach(integrante => {
          this.insertarSinDuplicados(integrante);
        });
      } else {
        this.insertarSinDuplicados({ id: opcion.id, nombre: opcion.nombre });
      }
      this.repartoForm.get('seleccionTemp')?.setValue('');
    }
  }

  private insertarSinDuplicados(persona: any) {
    const existe = this.profesionalesAsignados.some(p => p.id === persona.id);
    if (!existe) {
      this.profesionalesAsignados.push(persona);
    }
  }

  eliminarProfesional(index: number) {
    this.profesionalesAsignados.splice(index, 1);
  }

  guardar() {
    if (this.repartoForm.valid && this.profesionalesAsignados.length > 0) {
      this.dialogRef.close({
        ...this.repartoForm.value,
        profesionales: this.profesionalesAsignados
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}