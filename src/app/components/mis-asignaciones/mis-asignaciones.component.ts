import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ModalGestionComponent } from '../modal-gestion-contacto/modal-gestion-contacto.component';
import { ContactoMockService, SolicitudContactoMock } from '../../services/contacto-mock.service';
import { NotificacionService } from '../../core/a11y/notificacion.service';
import { formatOnlyDate } from '../../custom-date-adapter';

@Component({
  selector: 'app-mis-asignaciones',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './mis-asignaciones.component.html',
  styleUrls: ['./mis-asignaciones.component.scss']
})
export class MisAsignacionesComponent implements OnInit {
  private readonly contactoMock = inject(ContactoMockService);
  private readonly dialog = inject(MatDialog);
  private readonly notificacion = inject(NotificacionService);

  misCasos: SolicitudContactoMock[] = [];
  displayedColumns: string[] = ['id', 'fechaAsignacion', 'profesional', 'solicitante', 'fechaCita', 'estado', 'accion'];

  ngOnInit(): void {
    this.cargarAsignaciones();
  }

  get cantidadEnEspera(): number {
    return this.misCasos.filter((caso) => caso.estado === 'En espera de cita').length;
  }

  get cantidadDesistidos(): number {
    return this.misCasos.filter((caso) => caso.estado === 'Desistido').length;
  }

  cargarAsignaciones(): void {
    this.misCasos = this.contactoMock.listarSolicitudes();
  }

  gestionar(caso: SolicitudContactoMock): void {
    this.dialog.open(ModalGestionComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { ...caso, soloLectura: false }
    }).afterClosed().subscribe((result) => {
      if (result) this.cargarAsignaciones();
    });
  }

  desistir(caso: SolicitudContactoMock): void {
    this.contactoMock.desistir(caso.id);
    this.cargarAsignaciones();
    this.notificacion.exito(`La solicitud ${caso.codigo} quedó marcada como desistida.`);
  }

  mostrarFecha(fecha: string | null): string {
    return fecha ? formatOnlyDate(fecha) : 'Sin cita asignada';
  }

  getEstadoClass(estado: string): string {
    return estado === 'Desistido' ? 'status-danger' : 'status-warning';
  }
}
