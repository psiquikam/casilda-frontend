import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MaestroDto } from '../../services/listas.service';

@Component({
  selector: 'app-modal-presunto-agresor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './modal-presunto-agresor.component.html',
  styleUrls: ['./modal-presunto-agresor.component.scss']
})
export class ModalPresuntoAgresorComponent {

  public readonly dialogRef = inject(MatDialogRef<ModalPresuntoAgresorComponent>);

  data = {
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    idVinculoUniversidad: null as number | null,
    vinculoUniversidad: '',
    idVinculoVictima: null as number | null,
    vinculoVictima: ''
  };

  catalogoVinculosUdea: MaestroDto[] = [];
  catalogoVinculosAgresorVictima: MaestroDto[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public dialogData: any) {
    if (dialogData) {
      this.catalogoVinculosUdea = dialogData.vinculosUdea || [];
      this.catalogoVinculosAgresorVictima = dialogData.vinculosAgresor || [];
    }
  }

  onVinculoUdeaChange(id: number): void {
    const selected = this.catalogoVinculosUdea.find(v => v.id === id);
    this.data.vinculoUniversidad = selected ? selected.nombre : '';
  }

  onVinculoVictimaChange(id: number): void {
    const selected = this.catalogoVinculosAgresorVictima.find(v => v.id === id);
    this.data.vinculoVictima = selected ? selected.nombre : '';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
