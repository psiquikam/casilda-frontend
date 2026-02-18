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
  ) { }

  ngOnInit() {
    this.detalleForm = this.fb.group({

      // REMITENTE
      remitentePrimerNombre: [this.data.info.remitentePrimerNombre || '', Validators.required],
      remitenteSegundoNombre: [this.data.info.remitenteSegundoNombre || ''],
      remitentePrimerApellido: [this.data.info.remitentePrimerApellido || '', Validators.required],
      remitenteSegundoApellido: [this.data.info.remitenteSegundoApellido || ''],
      cargo: [this.data.info.cargo || ''],

      // SOLICITANTE
      tipoSolicitud: [this.data.info.tipoSolicitud || ''],
      primerNombre: [this.data.info.primerNombre || '', Validators.required],
      segundoNombre: [this.data.info.segundoNombre || ''],
      primerApellido: [this.data.info.primerApellido || '', Validators.required],
      segundoApellido: [this.data.info.segundoApellido || ''],
      tipoDocumento: [this.data.info.tipoDocumento || ''],
      numeroDocumento: [this.data.info.numeroDocumento || ''],
      edad: [this.data.info.edad || ''],
      identidadGenero: [this.data.info.identidadGenero || ''],
      celular: [this.data.info.celular || ''],
      celularAlterno: [this.data.info.celularAlterno || ''],
      correoInstitucional: [this.data.info.correoInstitucional || ''],
      correoPersonal: [this.data.info.correoPersonal || ''],
      campus: [this.data.info.campus || ''],
      dependencia: [this.data.info.dependencia || ''],
      facultad: [this.data.info.facultad || '']

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