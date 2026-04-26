import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ModalHechosComponent } from '../modal-hechos/modal-hechos.component';
import { MaestroDto } from '../../services/listas.service';

export interface ModalAgregarCasoData {
  listaOrientacionSexual: string[];
  queForma: string[];
  lugarHechos: string[];
  actividadesMisionales: string[];
  listaPsicologica: MaestroDto[];
  listaFisica: MaestroDto[];
  listaSexual: MaestroDto[];
  listaInstitucional: MaestroDto[];
  listaPatrimonial: MaestroDto[];
  listaInformatica: MaestroDto[];
  listaPrejuicio: MaestroDto[];
  listaVinculos: string[];
  listaVinculosAgresorVictima: string[];
  titulo?: string;
  initialData?: any;
}

@Component({
  selector: 'app-modal-agregar-caso',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './modal-agregar-caso.component.html',
  styleUrls: ['./modal-agregar-caso.component.scss'],
})
export class ModalAgregarCasoComponent {

  casoForm: FormGroup;

  hechosRegistrados: any[] = [];
  hechosColumns: string[] = ['fecha', 'lugar', 'descripcion', 'opcion'];

  psicologicaSel: number[] = [];
  fisicaSel: number[] = [];
  sexualSel: number[] = [];
  institucionalSel: number[] = [];
  economicaSel: number[] = [];
  informaticaSel: number[] = [];
  prejuicioSel: number[] = [];

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ModalAgregarCasoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModalAgregarCasoData,
  ) {
    this.casoForm = this.fb.group({
      orientacionSexual: ['', Validators.required],
      tiempoOcurrido: ['', Validators.required],
      queForma: ['', Validators.required],
      lugarHechos: ['', Validators.required],
      violenciaGenero: ['NO'],
      violenciaMisional: ['NO'],
      actividadMisional: [''],
      violenciaPsicologica: ['NO'],
      violenciaFisica: ['NO'],
      violenciaSexual: ['NO'],
      violenciaInstitucional: ['NO'],
      violenciaEconomica: ['NO'],
      violenciaInformatica: ['NO'],
      violenciaPrejuicio: ['NO'],
      presuntoPrimerNombre: ['', Validators.required],
      presuntoSegundoNombre: [''],
      presuntoPrimerApellido: ['', Validators.required],
      presuntoSegundoApellido: [''],
      presuntoVinculoUniversidad: ['', Validators.required],
      presuntoVinculoVictima: ['', Validators.required],
    });

    this.aplicarDatosIniciales();
  }

  get tituloModal(): string {
    return this.data.titulo?.trim() || 'Agregar Caso';
  }

  get violenciaMisionalValue(): string {
    return this.casoForm.get('violenciaMisional')?.value ?? 'NO';
  }

  get violenciaPsicologicaValue(): string {
    return this.casoForm.get('violenciaPsicologica')?.value ?? 'NO';
  }

  get violenciaFisicaValue(): string {
    return this.casoForm.get('violenciaFisica')?.value ?? 'NO';
  }

  get violenciaSexualValue(): string {
    return this.casoForm.get('violenciaSexual')?.value ?? 'NO';
  }

  get violenciaInstitucionalValue(): string {
    return this.casoForm.get('violenciaInstitucional')?.value ?? 'NO';
  }

  get violenciaEconomicaValue(): string {
    return this.casoForm.get('violenciaEconomica')?.value ?? 'NO';
  }

  get violenciaInformaticaValue(): string {
    return this.casoForm.get('violenciaInformatica')?.value ?? 'NO';
  }

  get violenciaPrejuicioValue(): string {
    return this.casoForm.get('violenciaPrejuicio')?.value ?? 'NO';
  }

  abrirModalHechos(): void {
    const ref = this.dialog.open(ModalHechosComponent, {
      width: '600px',
      disableClose: true,
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.hechosRegistrados = [...this.hechosRegistrados, result];
      }
    });
  }

  eliminarHecho(i: number): void {
    this.hechosRegistrados.splice(i, 1);
    this.hechosRegistrados = [...this.hechosRegistrados];
  }

  onCheckboxChange(event: any, valor: number, arrayName: string): void {
    const lista = (this as any)[arrayName] as number[];
    if (event.checked) {
      lista.push(valor);
    } else {
      const idx = lista.indexOf(valor);
      if (idx >= 0) lista.splice(idx, 1);
    }
  }

  private aplicarDatosIniciales(): void {
    const initial = this.data.initialData;
    if (!initial) {
      return;
    }

    this.psicologicaSel = [...(initial.psicologicaSel ?? [])];
    this.fisicaSel = [...(initial.fisicaSel ?? [])];
    this.sexualSel = [...(initial.sexualSel ?? [])];
    this.institucionalSel = [...(initial.institucionalSel ?? [])];
    this.economicaSel = [...(initial.economicaSel ?? [])];
    this.informaticaSel = [...(initial.informaticaSel ?? [])];
    this.prejuicioSel = [...(initial.prejuicioSel ?? [])];

    this.hechosRegistrados = [...(initial.hechos ?? [])];

    this.casoForm.patchValue({
      orientacionSexual: initial.orientacionSexual ?? '',
      tiempoOcurrido: initial.tiempoOcurrido ?? '',
      queForma: initial.queForma ?? '',
      lugarHechos: initial.lugarHechos ?? '',
      violenciaGenero: initial.violenciaGenero ?? 'NO',
      violenciaMisional: initial.violenciaMisional ?? 'NO',
      actividadMisional: initial.actividadMisional ?? '',
      violenciaPsicologica: initial.violenciaPsicologica ?? 'NO',
      violenciaFisica: initial.violenciaFisica ?? 'NO',
      violenciaSexual: initial.violenciaSexual ?? 'NO',
      violenciaInstitucional: initial.violenciaInstitucional ?? 'NO',
      violenciaEconomica: initial.violenciaEconomica ?? 'NO',
      violenciaInformatica: initial.violenciaInformatica ?? 'NO',
      violenciaPrejuicio: initial.violenciaPrejuicio ?? 'NO',
      presuntoPrimerNombre: initial.presuntoPrimerNombre ?? '',
      presuntoSegundoNombre: initial.presuntoSegundoNombre ?? '',
      presuntoPrimerApellido: initial.presuntoPrimerApellido ?? '',
      presuntoSegundoApellido: initial.presuntoSegundoApellido ?? '',
      presuntoVinculoUniversidad: initial.presuntoVinculoUniversidad ?? '',
      presuntoVinculoVictima: initial.presuntoVinculoVictima ?? '',
    });
  }

  onGuardar(): void {
    this.casoForm.markAllAsTouched();
    if (this.casoForm.invalid) return;

    const formValue = this.casoForm.getRawValue();
    this.dialogRef.close({
      ...formValue,
      hechos: this.hechosRegistrados,
      psicologicaSel: this.psicologicaSel,
      fisicaSel: this.fisicaSel,
      sexualSel: this.sexualSel,
      institucionalSel: this.institucionalSel,
      economicaSel: this.economicaSel,
      informaticaSel: this.informaticaSel,
      prejuicioSel: this.prejuicioSel,
    });
  }

  onCerrar(): void {
    this.dialogRef.close();
  }
}
