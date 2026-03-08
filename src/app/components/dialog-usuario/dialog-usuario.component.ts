import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { Usuario } from '../gestion-usuarios/gestion-usuarios.component';
import { environment } from '../../../environments/environment';

interface RolDto {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-dialog-usuario',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  templateUrl: './dialog-usuario.component.html',
  styleUrls: ['./dialog-usuario.component.scss']
})
export class DialogUsuarioComponent implements OnInit {
  userForm: FormGroup;
  isEdit: boolean = false;
  roles: RolDto[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<DialogUsuarioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Usuario
  ) {
    this.isEdit = !!data;

    this.userForm = this.fb.group({
      nombre: [data?.nombre || '', [Validators.required, Validators.minLength(3)]],
      email: [data?.email || '', [Validators.required, Validators.email]],
      password: [null, this.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
      idRol: [data?.idRol ?? null, Validators.required],
      estado: [data?.estado || 'Activo']
    });
  }

  ngOnInit(): void {
    this.http.get<RolDto[]>(`${environment.apiBaseUrl}/maestros/roles`).subscribe({
      next: (roles) => {
        this.roles = roles;
        if (!this.isEdit && roles.length > 0 && !this.userForm.get('idRol')?.value) {
          this.userForm.get('idRol')?.setValue(roles[0].id);
        }
      },
      error: (err) => console.error('Error cargando roles', err)
    });
  }

  guardar() {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }
}
