import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reparto-acompanamiento',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, 
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatDividerModule
  ],
  templateUrl: './reparto-acompanamiento.component.html',
  styleUrls: ['./reparto-acompanamiento.component.scss']
})
export class RepartoAcompanamientoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  repartoForm!: FormGroup;
  codigoCaso: string = '';

  // Datos simulados para el formulario
  tiposAsignacion = ['Prioritaria', 'Ordinaria', 'Seguimiento'];
  servicios = ['Psicología', 'Asesoría Jurídica', 'Trabajo Social', 'Dupla Psicosocial'];
  profesionales = [
    { id: 1, nombre: 'Dra. Elena Gómez', cargo: 'Abogada' },
    { id: 2, nombre: 'Dr. Ricardo Luna', cargo: 'Psicólogo' },
    { id: 3, nombre: 'Dupla A (Social/Psico)', cargo: 'Dupla' }
  ];

  ngOnInit() {
    this.codigoCaso = this.route.snapshot.paramMap.get('codigo') || 'ACO-XXX';
    
    this.repartoForm = this.fb.group({
      tipoAsignacion: ['', Validators.required],
      fechaReparto: [{ value: new Date().toLocaleDateString(), disabled: true }],
      servicio: ['', Validators.required],
      asignadoA: ['', Validators.required],
      observaciones: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  guardarReparto() {
    if (this.repartoForm.valid) {
      console.log('Asignando caso...', this.repartoForm.value);
      // Aquí iría la lógica de API
      this.router.navigate(['/dashboard']);
    }
  }

  regresar() {
    this.router.navigate(['/dashboard-revisor']);
  }
}
