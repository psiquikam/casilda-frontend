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
    { id: 'p1', nombre: 'Abogado N1', esGrupo: false, integrantes: [] },
    { id: 'p2', nombre: 'Abogado N2', esGrupo: false, integrantes: [] },
    { id: 'p3', nombre: 'Psicologa N1', esGrupo: false, integrantes: [] },
    { id: 'p4', nombre: 'Psicologa N2', esGrupo: false, integrantes: [] },
    { id: 'p5', nombre: 'Psicoorientadora', esGrupo: false, integrantes: [] },
    { id: 'p6', nombre: 'Trabajadora Social', esGrupo: false, integrantes: [] },
    { 
      id: 'd1', 
      nombre: 'Dupla 1', 
      esGrupo: true, 
      integrantes: [
        { id: 'p1', nombre: 'Abogado N1' },
        { id: 'p3', nombre: 'Psicologa N1' }
      ] 
    },
    { 
      id: 'd2', 
      nombre: 'Dupla 2', 
      esGrupo: true, 
      integrantes: [
        { id: 'p2', nombre: 'Abogado N2' },
        { id: 'p4', nombre: 'Psicologa N2' }
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
      fechaReparto: [new Date().toISOString().substring(0, 10)],
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
        opcion.integrantes.forEach(integrante => this.insertarSinDuplicados(integrante));
      } else {
        this.insertarSinDuplicados({ id: opcion.id, nombre: opcion.nombre });
      }
    }
  }

  private insertarSinDuplicados(persona: any) {
    const existe = this.profesionalesAsignados.some(p => p.id === persona.id);
    if (!existe) {
      this.profesionalesAsignados.push(persona);
    }
  }

  guardar() {
    if (this.repartoForm.valid && this.profesionalesAsignados.length > 0) {
      const { seleccionTemp, ...datosForm } = this.repartoForm.value;
      this.dialogRef.close({
        ...datosForm,
        idsProfesionales: this.profesionalesAsignados.map(p => p.id),
        nombresProfesionales: this.profesionalesAsignados.map(p => p.nombre).join(' & '),
        idCaso: this.data.id
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}