import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ListasService, MaestroDto } from '../../services/listas.service';

@Component({
  selector: 'app-modal-remision',
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
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './modal-remision.component.html',
  styleUrls: ['./modal-remision.component.scss']
})
export class ModalRemisionComponent implements OnInit {
  private readonly listasService = inject(ListasService);

  data = {
    tipo: null as MaestroDto | null,
    cual: '',
    fecha: null as Date | null
  };

  tiposRemision: MaestroDto[] = [];

  constructor(public dialogRef: MatDialogRef<ModalRemisionComponent>) {}

  ngOnInit(): void {
    this.cargarTiposRemision();
  }

  private cargarTiposRemision(): void {
    this.listasService.obtenerMaestro('tipos-remision').subscribe({
      next: (lista) => {
        this.tiposRemision = lista;
      },
      error: () => {
        this.tiposRemision = [];
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}