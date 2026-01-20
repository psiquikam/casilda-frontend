import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-detalle-revisor',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTabsModule, MatButtonModule, 
    MatIconModule, MatChipsModule, MatCardModule, MatDividerModule
  ],
  templateUrl: './detalle-revisor.component.html',
  styleUrls: ['./detalle-revisor.component.scss']
})
export class DetalleRevisorComponent implements OnInit {
  idCaso: string | null = '';
  
  caso = {
    id: '',
    fechaCreacion: '2025-12-15 08:30 AM',
    estadoActual: 1,
    prioridad: 'Alta',
    victima: {
      nombre: 'Juan Pérez',
      documento: '10203040',
      correo: 'juan.perez@email.com',
      cargo: 'Estudiante',
      genero: 'Masculino'
    },
    queja: {
      tipo: 'Acoso',
      descripcion: 'El día 10 de diciembre se presentó una situación de lenguaje inapropiado y hostigamiento en el área de cafetería por parte de un docente...',
      lugar: 'Campus Central - Cafetería',
      testigos: 'María López, Carlos Ruiz'
    },
    archivos: [
      { nombre: 'evidencia_chat_whatsapp.pdf', tamano: '1.2MB' },
      { nombre: 'foto_incidente.jpg', tamano: '2.5MB' }
    ]
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.idCaso = this.route.snapshot.paramMap.get('id');
    this.caso.id = this.idCaso || 'CAS-0000';
  }

  cambiarEstado(nuevoEstado: number) {
    this.caso.estadoActual = nuevoEstado;
  }
}