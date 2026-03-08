import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogUsuarioComponent } from '../dialog-usuario/dialog-usuario.component';
import { UsuarioService } from '../../services/usuario.service';
import Swal from 'sweetalert2';

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
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatDialogModule, MatTooltipModule
  ],
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.scss']
})
export class GestionUsuariosComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'email', 'rol', 'estado', 'acciones'];
  usuarios: Usuario[] = [];

  constructor(private dialog: MatDialog, private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.usuarioService.obtenerTodos().subscribe({
      next: (data) => {
        this.usuarios = data.map(u => ({
          id: Number(u.id),
          nombre: u.nombre,
          email: u.email,
          rol: u.nombreRol,
          estado: u.activo ? 'Activo' : 'Inactivo',
          idRol: u.idRol
        }));
      },
      error: (err) => console.error('Error cargando usuarios', err)
    });
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
          next: () => this.cargarUsuarios(),
          error: (err) => console.error('Error actualizando usuario', err)
        });
      } else {
        this.usuarioService.crear(request).subscribe({
          next: () => this.cargarUsuarios(),
          error: (err) => console.error('Error creando usuario', err)
        });
      }
    });
  }

  eliminarUsuario(id: number) {
    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea eliminar este usuario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.usuarioService.eliminar(id).subscribe({
          next: () => this.cargarUsuarios(),
          error: (err) => console.error('Error eliminando usuario', err)
        });
      }
    });
  }

  toggleEstado(usuario: Usuario) {
    const nuevoActivo = usuario.estado !== 'Activo';
    this.usuarioService.cambiarEstado(usuario.id, nuevoActivo).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => console.error('Error cambiando estado', err)
    });
  }

}
