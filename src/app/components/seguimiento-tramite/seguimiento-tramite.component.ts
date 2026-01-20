import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-seguimiento-tramite',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './seguimiento-tramite.component.html',
  styleUrls: ['./seguimiento-tramite.component.scss']
})
export class SeguimientoTramiteComponent {
  codigoBusqueda: string = '';
  busquedaRealizada: boolean = false;
  casoEncontrado: any = null;
  etapas: any[] = [];

  // Etapas específicas para Quejas
  private flujoQueja = [
    { id: 1, nombre: 'Recibido', icon: 'assignment' },
    { id: 2, nombre: 'En Revisión Jurídica', icon: 'gavel' },
    { id: 3, nombre: 'Investigación', icon: 'search' },
    { id: 4, nombre: 'Respuesta Emitida', icon: 'mark_email_read' }
  ];

  // Etapas específicas para Acompañamiento
  private flujoAcompanamiento = [
    { id: 1, nombre: 'Solicitud Recibida', icon: 'pending_actions' },
    { id: 2, nombre: 'Asignación de Profesional', icon: 'person_add' },
    { id: 3, nombre: 'En Intervención/Citas', icon: 'record_voice_over' },
    { id: 4, nombre: 'Caso Cerrado', icon: 'verified' }
  ];

  buscarCaso() {
    this.busquedaRealizada = true;
    const codigo = this.codigoBusqueda.toUpperCase().trim();

    // Lógica de detección por prefijo
    if (codigo.startsWith('ACO-')) {
      this.etapas = this.flujoAcompanamiento;
      this.simularResultado(codigo, 'Acompañamiento', 2, 'Se ha asignado al Psicólogo clínico de la sede.');
    } else if (codigo.startsWith('CAS-')) {
      this.etapas = this.flujoQueja;
      this.simularResultado(codigo, 'Queja / Reclamo', 1, 'Su reporte ha sido recibido y está en turno de revisión.');
    } else {
      this.casoEncontrado = null;
    }
  }

  private simularResultado(codigo: string, tipo: string, estado: number, detalle: string) {
    this.casoEncontrado = {
      codigo,
      tipo,
      estadoActual: estado,
      diasDesdeRecepcion: Math.floor(Math.random() * 5) + 1,
      fechaActualizacion: new Date().toLocaleDateString(),
      detalle
    };
  }
}