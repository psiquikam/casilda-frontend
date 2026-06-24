import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../services/solicitud.service';
import { MaestroDto } from '../../services/listas.service';

@Component({
  selector: 'app-modal-medidas-proteccion',
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
  templateUrl: './modal-medidas-proteccion.component.html',
  styleUrls: ['./modal-medidas-proteccion.component.scss']
})
export class ModalMedidasProteccionComponent implements OnInit {

  private readonly solicitudService = inject(SolicitudService);
  public readonly dialogRef = inject(MatDialogRef<ModalMedidasProteccionComponent>);

  data = {
    tipoMedidaId: null as number | null,
    tipoMedida: '',
    subtipoMedidaId: null as number | null,
    subtipoMedida: '',
    responsableId: null as number | null,
    responsable: '',
    descripcion: '',
    fechaRegistro: new Date().toISOString(),
  };

  tiposMedidaList: MaestroDto[] = [];
  subtiposMedidaList: MaestroDto[] = [];
  responsablesList: MaestroDto[] = [];

  ngOnInit(): void {
    this.solicitudService.listarTiposMedida().subscribe({
      next: (tipos) => this.tiposMedidaList = tipos,
      error: (err) => console.error('Error cargando tipos de medida:', err)
    });

    this.solicitudService.listarResponsablesMedida().subscribe({
      next: (resps) => this.responsablesList = resps,
      error: (err) => console.error('Error cargando responsables de medida:', err)
    });
  }

  onTipoChange(tipoId: number): void {
    const selectedTipo = this.tiposMedidaList.find(t => t.id === tipoId);
    this.data.tipoMedida = selectedTipo ? selectedTipo.nombre : '';
    this.data.subtipoMedidaId = null;
    this.data.subtipoMedida = '';
    this.subtiposMedidaList = [];

    if (tipoId) {
      this.solicitudService.listarSubTiposMedidaPorTipo(tipoId).subscribe({
        next: (subtipos) => this.subtiposMedidaList = subtipos,
        error: (err) => console.error('Error cargando subtipos de medida:', err)
      });
    }
  }

  onSubtipoChange(subtipoId: number): void {
    const selectedSubtipo = this.subtiposMedidaList.find(s => s.id === subtipoId);
    this.data.subtipoMedida = selectedSubtipo ? selectedSubtipo.nombre : '';
  }

  onResponsableChange(responsableId: number): void {
    const selectedResp = this.responsablesList.find(r => r.id === responsableId);
    this.data.responsable = selectedResp ? selectedResp.nombre : '';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
