import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogUsuarioComponent } from '../dialog-usuario/dialog-usuario.component';

// Interfaz para definir la estructura del usuario
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'Admin' | 'Revisor' | 'Consulta';
  estado: 'Activo' | 'Inactivo';
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
export class GestionUsuariosComponent {
  displayedColumns: string[] = ['nombre', 'email', 'rol', 'estado', 'acciones'];

  // Datos de ejemplo
  usuarios: Usuario[] = [
    { id: 1, nombre: 'Admin Sistema', email: 'admin@fnsp.gov', rol: 'Admin', estado: 'Activo' },
    { id: 2, nombre: 'Carlos Pérez', email: 'c.perez@juridico.com', rol: 'Revisor', estado: 'Activo' },
    { id: 3, nombre: 'Ana García', email: 'ana.garcia@gmail.com', rol: 'Consulta', estado: 'Inactivo' },
  ];

  constructor(private dialog: MatDialog) { }

  abrirFormulario(usuario?: Usuario) {
    const dialogRef = this.dialog.open(DialogUsuarioComponent, {
      width: '500px',
      data: usuario ? { ...usuario } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (usuario) {
          const index = this.usuarios.findIndex(u => u.id === usuario.id);
          this.usuarios[index] = result;
        } else {
          result.id = Date.now();
          this.usuarios = [...this.usuarios, result];
        }
        this.usuarios = [...this.usuarios];
      }
    });
  }

  eliminarUsuario(id: number) {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      this.usuarios = this.usuarios.filter(u => u.id !== id);
    }
  }

  toggleEstado(usuario: Usuario) {
    usuario.estado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
  }

}