import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SpybRegistroService } from '../../services/spyb-registro.service';
import { SpybConsecutivoBadgeComponent } from '../../components/spyb-consecutivo-badge.component';
import { SpybEstadoBadgeComponent } from '../../components/spyb-estado-badge.component';
import { ModalVincularCasoComponent } from '../../components/modal-vincular-caso.component';
import { ModalSolicitarSubsanacionComponent } from '../../components/modal-solicitar-subsanacion.component';
import { ModalNuevaOrdenComponent } from '../../components/modal-nueva-orden.component';
import { ModalSolicitudCamaraComponent } from '../../components/modal-solicitud-camara.component';
import { ModalRemisionSpybComponent } from '../../components/modal-remision-spyb.component';
import { RegistroSeguridad } from '../../models/spyb.models';

@Component({
  selector: 'app-detalle-registro',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    SpybConsecutivoBadgeComponent,
    SpybEstadoBadgeComponent
  ],
  templateUrl: './detalle-registro.component.html',
  styleUrls: ['./detalle-registro.component.scss']
})
export class DetalleRegistroComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly registroService = inject(SpybRegistroService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  cargando = true;
  registro: RegistroSeguridad | null = null;
  errorCarga = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.cargarDetalle(id);
    } else {
      this.cargando = false;
      this.errorCarga = true;
    }
  }

  cargarDetalle(id: number): void {
    this.cargando = true;
    this.registroService.obtenerRegistro(id).subscribe({
      next: (res) => {
        this.registro = res;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.errorCarga = true;
      }
    });
  }

  abrirModalVincular(): void {
    if (!this.registro) return;
    const ref = this.dialog.open(ModalVincularCasoComponent, {
      width: '600px',
      data: { registro: this.registro }
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.registro = res;
        this.snackBar.open(`Vinculado a ${res.codigoCaso}`, 'Aceptar', { duration: 4000 });
      }
    });
  }

  abrirModalSubsanar(): void {
    if (!this.registro) return;
    const ref = this.dialog.open(ModalSolicitarSubsanacionComponent, {
      width: '550px',
      data: { registro: this.registro }
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.registro = res;
        this.snackBar.open('Subsanación solicitada', 'Aceptar', { duration: 4000 });
      }
    });
  }

  abrirModalNuevaOrden(): void {
    if (!this.registro) return;
    const ref = this.dialog.open(ModalNuevaOrdenComponent, {
      width: '650px',
      data: { registro: this.registro, idCaso: this.registro.idCaso }
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open(`Orden ${res.codigoOrden} emitida`, 'Aceptar', { duration: 4000 });
      }
    });
  }

  abrirModalCamara(): void {
    if (!this.registro) return;
    const ref = this.dialog.open(ModalSolicitudCamaraComponent, {
      width: '600px',
      data: { registro: this.registro }
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open(`Solicitud de cámara ${res.codigoSolicitud} radicada`, 'Aceptar', { duration: 4000 });
      }
    });
  }

  abrirModalRemision(): void {
    if (!this.registro) return;
    const ref = this.dialog.open(ModalRemisionSpybComponent, {
      width: '600px',
      data: { registro: this.registro }
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open('Remisión emitida', 'Aceptar', { duration: 4000 });
      }
    });
  }
}

