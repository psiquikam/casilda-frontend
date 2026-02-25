import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

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
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
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
    const info = this.data?.info ?? {};

    this.detalleForm = this.fb.group({

      remitenteTipoSolicitud: [info.remitenteTipoSolicitud ?? ''],
      remitentePrimerNombre: [info.remitentePrimerNombre ?? '', Validators.required],
      remitenteSegundoNombre: [info.remitenteSegundoNombre ?? ''],
      remitentePrimerApellido: [info.remitentePrimerApellido ?? '', Validators.required],
      remitenteSegundoApellido: [info.remitenteSegundoApellido ?? ''],
      remitenteCargo: [info.remitenteCargo ?? ''],
      remitenteCampus: [info.remitenteCampus ?? ''],
      remitenteDependencia: [info.remitenteDependencia ?? ''],
      remitenteFacultad: [info.remitenteFacultad ?? ''],
      remitenteOtraFacultad: [info.remitenteOtraFacultad ?? ''],
      remitenteFechaSolicitud: [info.remitenteFechaSolicitud ?? null],
      remitenteTipoDocumento: [info.remitenteTipoDocumento ?? ''],
      remitenteNumeroDocumento: [info.remitenteNumeroDocumento ?? ''],

      tipoDocumento: [info.tipoDocumento ?? ''],
      numeroDocumento: [info.numeroDocumento ?? ''],
      fechaNacimiento: [info.fechaNacimiento ?? null],
      primerNombre: [info.primerNombre ?? '', Validators.required],
      segundoNombre: [info.segundoNombre ?? ''],
      primerApellido: [info.primerApellido ?? '', Validators.required],
      segundoApellido: [info.segundoApellido ?? ''],
      identidadGenero: [info.identidadGenero ?? ''],
      celular: [info.celular ?? ''],
      telefonoAlterno: [info.telefonoAlterno ?? ''],
      correoInstitucional: [info.correoInstitucional ?? ''],
      correoPersonal: [info.correoPersonal ?? '']

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