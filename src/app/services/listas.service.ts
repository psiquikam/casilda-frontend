import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListasService {
  // Definimos los datos iniciales (Mocks)
  private data: any = {
    tiposSolicitud: ['Psicológico', 'Jurídico', 'Académico', 'Social',],
    campus: ['Central', 'Robledo', 'Oriente', 'Apartadó'],
    dependencias: ['Bienestar Universitario', 'Talento Humano', 'Rectoría'],
    facultades: ['Medicina', 'Salud Pública', 'Enfermería', 'Artes'],
    tiposDocumento: ['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Pasaporte']
  };

  private listasSubject = new BehaviorSubject<any>(this.data);
  listas$ = this.listasSubject.asObservable();

  constructor() {}

  // CRUD: Agregar
  agregarItem(lista: string, nuevoItem: string) {
    if (nuevoItem && !this.data[lista].includes(nuevoItem)) {
      this.data[lista].push(nuevoItem);
      this.listasSubject.next(this.data);
    }
  }

  // CRUD: Eliminar (Simulado)
  eliminarItem(lista: string, itemAEliminar: string) {
    this.data[lista] = this.data[lista].filter((item: string) => item !== itemAEliminar);
    this.listasSubject.next(this.data);
  }

  // CRUD: Editar (Simulado)
  editarItem(lista: string, valorAntiguo: string, valorNuevo: string) {
    const index = this.data[lista].indexOf(valorAntiguo);
    if (index !== -1) {
      this.data[lista][index] = valorNuevo;
      this.listasSubject.next(this.data);
    }
  }
}