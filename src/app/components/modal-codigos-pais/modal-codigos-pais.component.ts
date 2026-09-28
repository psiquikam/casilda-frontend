import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';

import { CATALOGO_CODIGOS_PAIS, CodigoPais } from '../../constants/codigos-pais.constant';

@Component({
  selector: 'app-modal-codigos-pais',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTableModule
  ],
  templateUrl: './modal-codigos-pais.component.html',
  styleUrls: ['./modal-codigos-pais.component.scss']
})
export class ModalCodigosPaisComponent implements OnInit {
  filtro = '';
  displayedColumns: string[] = ['codigo', 'nombre', 'region', 'accion'];
  paises: CodigoPais[] = [];
  paisesFiltrados: CodigoPais[] = [];

  constructor(public dialogRef: MatDialogRef<ModalCodigosPaisComponent>) {}

  ngOnInit(): void {
    this.paises = [...CATALOGO_CODIGOS_PAIS];
    this.paisesFiltrados = [...this.paises];
  }

  aplicarFiltro(): void {
    const query = this.filtro.trim().toLowerCase();
    if (!query) {
      this.paisesFiltrados = [...this.paises];
      return;
    }

    this.paisesFiltrados = this.paises.filter(p =>
      p.codigo.toLowerCase().includes(query) ||
      p.nombre.toLowerCase().includes(query) ||
      (p.region && p.region.toLowerCase().includes(query))
    );
  }

  limpiarFiltro(): void {
    this.filtro = '';
    this.paisesFiltrados = [...this.paises];
  }

  seleccionar(codigo: string): void {
    this.dialogRef.close(codigo);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
