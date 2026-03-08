import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListasService, MaestroDto } from '../../services/listas.service';
import Swal from 'sweetalert2';

// Material
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-gestion-listas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTabsModule, MatTableModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule
  ],
  templateUrl: './gestion-listas.component.html',
  styleUrls: ['./gestion-listas.component.scss']
})
export class GestionListasComponent implements OnInit {
  listas: Record<string, MaestroDto[]> = {};
  nuevoNombre: string = '';
  nuevoCodigo: string = '';
  editandoItem: { lista: string; id: number; nombre: string; codigo: string } | null = null;

  readonly etiquetas: Record<string, string> = {
    tiposSolicitud: 'Tipos de Solicitud',
    campus: 'Campus',
    dependencias: 'Dependencias',
    facultades: 'Facultades',
    tiposDocumento: 'Tipos de Documento'
  };

  readonly listasConCodigo = new Set(['tiposDocumento']);

  constructor(private listasService: ListasService) {}

  ngOnInit() {
    this.listasService.listas$.subscribe(data => this.listas = data);
  }

  tieneCodigo(listKey: string): boolean {
    return this.listasConCodigo.has(listKey);
  }

  agregar(nombreLista: string) {
    if (!this.nuevoNombre.trim()) return;
    this.listasService.agregarItem(nombreLista, this.nuevoNombre.trim(), this.nuevoCodigo.trim() || undefined);
    this.nuevoNombre = '';
    this.nuevoCodigo = '';
  }

  borrar(nombreLista: string, item: MaestroDto) {
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar "${item.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.listasService.eliminarItem(nombreLista, item.id);
      }
    });
  }

  iniciarEdicion(nombreLista: string, item: MaestroDto) {
    this.editandoItem = {
      lista: nombreLista,
      id: item.id,
      nombre: item.nombre,
      codigo: item.codigo ?? ''
    };
  }

  guardarEdicion() {
    if (this.editandoItem && this.editandoItem.nombre.trim()) {
      this.listasService.editarItem(
        this.editandoItem.lista,
        this.editandoItem.id,
        this.editandoItem.nombre.trim(),
        this.tieneCodigo(this.editandoItem.lista) ? this.editandoItem.codigo : undefined
      );
      this.editandoItem = null;
    }
  }
}
