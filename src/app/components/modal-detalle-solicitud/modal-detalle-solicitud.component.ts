import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ModalCorreoComponent } from '../modal-correo/modal-correo.component';
import { ModalTelefonoComponent } from '../modal-telefono/modal-telefono.component';

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
    MatNativeDateModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './modal-detalle-solicitud.component.html',
  styleUrls: ['./modal-detalle-solicitud.component.scss']
})
export class ModalDetalleSolicitudComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  detalleForm!: FormGroup;

  correoRegistrados: any[] = [];
  telefonosRegistrados: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { info: any, modo: 'editar' | 'visualizar' },
    public dialogRef: MatDialogRef<ModalDetalleSolicitudComponent>
  ) {}

  get esVisualizacion(): boolean {
    return this.data.modo === 'visualizar';
  }

  ngOnInit() {
    const info = this.data?.info ?? {};
    const esIndirecta = !!(info.remitentePrimerNombre || info.remitentePrimerApellido);

    this.detalleForm = this.fb.group({
      remitenteTipoSolicitud: [info.remitenteTipoSolicitud ?? ''],
      remitentePrimerNombre: [info.remitentePrimerNombre ?? '', esIndirecta ? Validators.required : []],
      remitenteSegundoNombre: [info.remitenteSegundoNombre ?? ''],
      remitentePrimerApellido: [info.remitentePrimerApellido ?? '', esIndirecta ? Validators.required : []],
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
    });

    // Poblar tablas con datos existentes
    if (info.correoInstitucional) {
      this.correoRegistrados.push({ tipo: 'Institucional', correo: info.correoInstitucional, descripcion: '' });
    }
    if (info.correoPersonal) {
      this.correoRegistrados.push({ tipo: 'Personal', correo: info.correoPersonal, descripcion: '' });
    }
    if (info.celular) {
      this.telefonosRegistrados.push({ tipo: 'Celular', telefono: info.celular, descripcion: '' });
    }
    if (info.telefonoAlterno) {
      this.telefonosRegistrados.push({ tipo: 'Alterno', telefono: info.telefonoAlterno, descripcion: '' });
    }

    if (this.data.modo === 'visualizar') {
      this.detalleForm.disable();
    }
  }

  get tieneRemitente(): boolean {
    const info = this.data?.info ?? {};
    return !!(info.remitentePrimerNombre || info.remitentePrimerApellido);
  }

  abrirModalCorreo(): void {
    const ref = this.dialog.open(ModalCorreoComponent, { width: '600px', disableClose: true });
    ref.afterClosed().subscribe(result => {
      if (result) this.correoRegistrados = [...this.correoRegistrados, result];
    });
  }

  abrirModalTelefono(): void {
    const ref = this.dialog.open(ModalTelefonoComponent, { width: '600px', disableClose: true });
    ref.afterClosed().subscribe(result => {
      if (result) this.telefonosRegistrados = [...this.telefonosRegistrados, result];
    });
  }

  eliminarCorreo(i: number): void {
    this.correoRegistrados.splice(i, 1);
    this.correoRegistrados = [...this.correoRegistrados];
  }

  eliminarTelefono(i: number): void {
    this.telefonosRegistrados.splice(i, 1);
    this.telefonosRegistrados = [...this.telefonosRegistrados];
  }

  guardar() {
    if (this.detalleForm.valid) {
      this.dialogRef.close({
        ...this.detalleForm.value,
        correos: this.correoRegistrados,
        telefonos: this.telefonosRegistrados,
      });
    }
  }
}