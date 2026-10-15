import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DialogUsuarioComponent } from '../dialog-usuario/dialog-usuario.component';
import { UsuarioService } from '../../services/usuario.service';
import { DialogoService } from '../../core/a11y/dialogo.service';
import { NotificacionService } from '../../core/a11y/notificacion.service';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
  idRol: number;
}

@Component({
    selector: 'app-gestion-usuarios',
    imports: [
        CommonModule, MatTableModule, MatButtonModule, MatIconModule,
        MatCardModule, MatChipsModule, MatDialogModule, MatTooltipModule,
        MatPaginatorModule
    ],
    templateUrl: './gestion-usuarios.component.html',
    styleUrls: ['./gestion-usuarios.component.scss']
})
export class GestionUsuariosComponent implements OnInit {
  private readonly notificacion = inject(NotificacionService);
  private readonly dialogo = inject(DialogoService);
  displayedColumns: string[] = ['nombre', 'email', 'rol', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Usuario>([]);
  totalElementos = 0;
  pageIndex = 0;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private dialog: MatDialog, private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios(0, this.pageSize);
  }

  private cargarUsuarios(page: number, size: number): void {
    this.usuarioService.obtenerPaginados(page, size).subscribe({
      next: (respuesta) => {
        const usuariosTransformados = respuesta.content.map(u => ({
          id: Number(u.id),
          nombre: u.nombre,
          email: u.email,
          rol: u.nombreRol,
          estado: (u.activo ? 'Activo' : 'Inactivo') as 'Activo' | 'Inactivo',
          idRol: u.idRol
        }));
        this.dataSource.data = usuariosTransformados;
        this.totalElementos = respuesta.totalElements;
        this.pageIndex = respuesta.number;
        this.pageSize = respuesta.size;
      },
      error: (err) => this.notificacion.error('No fue posible cargar los usuarios. Recargue la página o intente más tarde.', err)
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarUsuarios(this.pageIndex, this.pageSize);
  }

  abrirFormulario(usuario?: Usuario) {
    const dialogRef = this.dialog.open(DialogUsuarioComponent, {
      width: '500px',
      data: usuario ? { ...usuario } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const request = {
        nombre: result.nombre,
        email: result.email,
        password: result.password || undefined,
        idRol: result.idRol,
        activo: result.estado === 'Activo'
      };

      if (usuario) {
        this.usuarioService.actualizar(usuario.id, request).subscribe({
          next: () => this.cargarUsuarios(this.pageIndex, this.pageSize),
          error: (err) => this.notificacion.error('No fue posible actualizar el usuario. Revise los datos e intente de nuevo.', err)
        });
      } else {
        this.usuarioService.crear(request).subscribe({
          next: () => this.cargarUsuarios(this.pageIndex, this.pageSize),
          error: (err) => this.notificacion.error('No fue posible crear el usuario. Revise los datos e intente de nuevo.', err)
        });
      }
    });
  }

  eliminarUsuario(id: number) {
    this.dialogo.confirmar({
      titulo: 'Eliminar usuario',
      mensaje: '¿Desea eliminar este usuario? Perderá el acceso al sistema.'
    }).subscribe((confirmado) => {
      if (confirmado) {
        this.usuarioService.eliminar(id).subscribe({
          next: () => this.cargarUsuarios(this.pageIndex, this.pageSize),
          error: (err) => this.notificacion.error('No fue posible eliminar el usuario. Intente de nuevo.', err)
        });
      }
    });
  }

  toggleEstado(usuario: Usuario) {
    const nuevoActivo = usuario.estado !== 'Activo';
    this.usuarioService.cambiarEstado(usuario.id, nuevoActivo).subscribe({
      next: () => this.cargarUsuarios(this.pageIndex, this.pageSize),
      error: (err) => this.notificacion.error('No fue posible cambiar el estado del usuario. Intente de nuevo.', err)
    });
  }
}