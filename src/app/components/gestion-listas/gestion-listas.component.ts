import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListasService } from '../../services/listas.service';

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
  listas: any = {};
  nuevoItem: string = '';
  editandoItem: { lista: string, original: string, actual: string } | null = null;

  constructor(private listasService: ListasService) {}

  ngOnInit() {
    this.listasService.listas$.subscribe(data => this.listas = data);
  }

  agregar(nombreLista: string) {
    if (this.nuevoItem.trim()) {
      this.listasService.agregarItem(nombreLista, this.nuevoItem.trim());
      this.nuevoItem = '';
    }
  }

  borrar(nombreLista: string, item: string) {
    if (confirm(`¿Está seguro de eliminar "${item}"?`)) {
      this.listasService.eliminarItem(nombreLista, item);
    }
  }

  iniciarEdicion(nombreLista: string, item: string) {
    this.editandoItem = { lista: nombreLista, original: item, actual: item };
  }

  guardarEdicion() {
    if (this.editandoItem && this.editandoItem.actual.trim()) {
      this.listasService.editarItem(
        this.editandoItem.lista, 
        this.editandoItem.original, 
        this.editandoItem.actual.trim()
      );
      this.editandoItem = null;
    }
  }
}