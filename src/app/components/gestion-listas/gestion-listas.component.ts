import { Component, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ListasService, MaestroDto } from '../../services/listas.service';
import { DialogoService } from '../../core/a11y/dialogo.service';

// Material
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NotificacionService } from '../../core/a11y/notificacion.service';

type ListaTabKey = 'tiposSolicitud' | 'campus' | 'unidadesAdministrativas' | 'facultades' | 'tiposDocumento';

interface PaginacionEstado {
  pageIndex: number;
  pageSize: number;
  totalElements: number;
}

@Component({
    selector: 'app-gestion-listas',
    imports: [
    FormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatPaginatorModule
],
    templateUrl: './gestion-listas.component.html',
    styleUrls: ['./gestion-listas.component.scss']
})
export class GestionListasComponent implements OnInit {
  private readonly notificacion = inject(NotificacionService);
  private readonly dialogo = inject(DialogoService);
  listas: Record<ListaTabKey, MaestroDto[]> = {
    tiposSolicitud: [],
    campus: [],
    unidadesAdministrativas: [],
    facultades: [],
    tiposDocumento: []
  };
  readonly listKeys: ListaTabKey[] = ['tiposSolicitud', 'campus', 'unidadesAdministrativas', 'facultades', 'tiposDocumento'];
  tabIndex = 0;
  nuevoNombre = '';
  nuevoCodigo = '';
  editandoItem: { lista: string; id: number; nombre: string; codigo: string } | null = null;
  paginacion: Record<ListaTabKey, PaginacionEstado> = {
    tiposSolicitud: { pageIndex: 0, pageSize: 10, totalElements: 0 },
    campus: { pageIndex: 0, pageSize: 10, totalElements: 0 },
    unidadesAdministrativas: { pageIndex: 0, pageSize: 10, totalElements: 0 },
    facultades: { pageIndex: 0, pageSize: 10, totalElements: 0 },
    tiposDocumento: { pageIndex: 0, pageSize: 10, totalElements: 0 }
  };

  readonly etiquetas: Record<string, string> = {
    tiposSolicitud: 'Tipos de Solicitud',
    campus: 'Campus',
    unidadesAdministrativas: 'Unidades Administrativas',
    facultades: 'Facultades',
    tiposDocumento: 'Tipos de Documento'
  };

  readonly listasConCodigo = new Set(['tiposDocumento']);

  constructor(private listasService: ListasService) {}

  ngOnInit() {
    this.cargarPagina('tiposSolicitud');
  }

  tieneCodigo(listKey: string): boolean {
    return this.listasConCodigo.has(listKey);
  }

  onTabChange(index: number): void {
    this.tabIndex = index;
    const listKey = this.listKeys[index];
    this.cargarPagina(listKey);
  }

  onPageChange(listKey: ListaTabKey, event: PageEvent): void {
    this.paginacion[listKey].pageIndex = event.pageIndex;
    this.paginacion[listKey].pageSize = event.pageSize;
    this.cargarPagina(listKey);
  }

  private cargarPagina(listKey: ListaTabKey): void {
    const estado = this.paginacion[listKey];
    this.listasService.obtenerListaPaginada(listKey, estado.pageIndex, estado.pageSize).subscribe({
      next: (resp) => {
        this.listas[listKey] = resp.content;
        this.paginacion[listKey].totalElements = resp.totalElements;
        this.paginacion[listKey].pageIndex = resp.number;
        this.paginacion[listKey].pageSize = resp.size;
      },
      error: (error) => {
        this.notificacion.error(`No fue posible cargar la lista «${listKey}». Recarga la página o intenta más tarde.`, error);
        this.listas[listKey] = [];
        this.paginacion[listKey].totalElements = 0;
      }
    });
  }

  agregar(nombreLista: string) {
    if (!this.nuevoNombre.trim()) return;
    const listKey = nombreLista as ListaTabKey;
    this.listasService.agregarItem$(nombreLista, this.nuevoNombre.trim(), this.nuevoCodigo.trim() || undefined).subscribe({
      next: () => {
        this.nuevoNombre = '';
        this.nuevoCodigo = '';
        this.paginacion[listKey].pageIndex = 0;
        this.cargarPagina(listKey);
      },
      error: (error) => this.notificacion.error(`No fue posible agregar el elemento a «${listKey}». Intenta de nuevo.`, error)
    });
  }

  borrar(nombreLista: string, item: MaestroDto) {
    this.dialogo.confirmar({
      titulo: 'Eliminar elemento',
      mensaje: `¿Deseas eliminar «${item.nombre}» de la lista?`
    }).subscribe((confirmado) => {
      if (confirmado) {
        const listKey = nombreLista as ListaTabKey;
        this.listasService.eliminarItem$(nombreLista, item.id).subscribe({
          next: () => this.cargarPagina(listKey),
          error: (error) => this.notificacion.error(`No fue posible eliminar el elemento de «${listKey}». Intenta de nuevo.`, error)
        });
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
      const listKey = this.editandoItem.lista as ListaTabKey;
      this.listasService.editarItem$(
        this.editandoItem.lista,
        this.editandoItem.id,
        this.editandoItem.nombre.trim(),
        this.tieneCodigo(this.editandoItem.lista) ? this.editandoItem.codigo : undefined
      ).subscribe({
        next: () => {
          this.editandoItem = null;
          this.cargarPagina(listKey);
        },
        error: (error) => this.notificacion.error(`No fue posible guardar la edición en «${listKey}». Intenta de nuevo.`, error)
      });
    }
  }
}
