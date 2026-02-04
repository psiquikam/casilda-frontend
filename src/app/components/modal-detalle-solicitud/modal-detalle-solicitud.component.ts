import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-modal-detalle-solicitud',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './modal-detalle-solicitud.component.html',
  styleUrls: ['./modal-detalle-solicitud.component.scss']
})
export class ModalDetalleSolicitudComponent implements OnInit {
  private fb = inject(FormBuilder);
  detalleForm!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { info: any, modo: 'editar' | 'visualizar' },
    public dialogRef: MatDialogRef<ModalDetalleSolicitudComponent>
  ) {}

  ngOnInit() {
    this.detalleForm = this.fb.group({
      remitentePrimerNombre: [this.data.info.remitentePrimerNombre || '', Validators.required],
      remitenteSegundoNombre: [this.data.info.remitenteSegundoNombre || ''],
      remitentePrimerApellido: [this.data.info.remitentePrimerApellido || '', Validators.required],
      remitenteSegundoApellido: [this.data.info.remitenteSegundoApellido || ''],
      cargo: [this.data.info.cargo || ''],
      dependencia: [this.data.info.dependencia || ''],
      facultad: [this.data.info.facultad || ''],
      campus: [this.data.info.campus || ''],
      pacientePrimerNombre: [this.data.info.pacientePrimerNombre || '', Validators.required],
      pacienteSegundoNombre: [this.data.info.pacienteSegundoNombre || ''],
      pacientePrimerApellido: [this.data.info.pacientePrimerApellido || '', Validators.required],
      pacienteSegundoApellido: [this.data.info.pacienteSegundoApellido || ''],
      documento: [this.data.info.documento || '', Validators.required],
      edad: [this.data.info.edad || ''],
      celular: [this.data.info.celular || ''],
      correoInst: [this.data.info.correoInst || '']
    });

    if (this.data.modo === 'visualizar') {
      this.detalleForm.disable();
    }
  }

  guardar() {
    if (this.detalleForm.valid) {
      this.dialogRef.close(this.detalleForm.value);
    }
  }
}