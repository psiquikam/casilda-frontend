import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { SpybAnalistaService } from '../../services/spyb-analista.service';
import { SpybAcompanamientoService } from '../../services/spyb-acompanamiento.service';
import { SpybCamarasService } from '../../services/spyb-camaras.service';
import { SpybRemisionesService } from '../../services/spyb-remisiones.service';
import { SpybConsecutivoBadgeComponent } from '../../components/spyb-consecutivo-badge.component';
import { SpybEstadoBadgeComponent } from '../../components/spyb-estado-badge.component';
import { ModalVincularCasoComponent } from '../../components/modal-vincular-caso.component';
import { ModalSolicitarSubsanacionComponent } from '../../components/modal-solicitar-subsanacion.component';
import { ModalNuevaOrdenComponent } from '../../components/modal-nueva-orden.component';
import { ModalSolicitudCamaraComponent } from '../../components/modal-solicitud-camara.component';
import { ModalRemisionSpybComponent } from '../../components/modal-remision-spyb.component';
import { environment } from '../../../../environments/environment';
import {
  ConteosBandejaAnalista,
  OrdenAcompanamiento,
  RegistroSeguridad,
  RemisionSeguridad,
  RequerimientoUad,
  SolicitudEvidenciaCamara
} from '../../models/spyb.models';

@Component({
  selector: 'app-bandeja-analista',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
    SpybConsecutivoBadgeComponent,
    SpybEstadoBadgeComponent
  ],
  templateUrl: './bandeja-analista.component.html',
  styleUrls: ['./bandeja-analista.component.scss']
})
export class BandejaAnalistaComponent implements OnInit {
  private readonly analistaService = inject(SpybAnalistaService);
  private readonly acompService = inject(SpybAcompanamientoService);
  private readonly camarasService = inject(SpybCamarasService);
  private readonly remisionesService = inject(SpybRemisionesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly demo = environment.seguridadPyB?.mocks ?? true;

  // Conteos reactivos mediante Signals
  conteos = signal<ConteosBandejaAnalista>({
    nuevos: 0,
    enRevision: 0,
    pendienteVinculacion: 0,
    acompanamientos: 0,
    camaras: 0,
    remisiones: 0,
    uad: 0
  });

  pestanaActiva = 'NUEVOS';
  cargando = false;

  // Listas de datos
  registros: RegistroSeguridad[] = [];
  ordenes: OrdenAcompanamiento[] = [];
  evidencias: SolicitudEvidenciaCamara[] = [];
  remisiones: RemisionSeguridad[] = [];
  requerimientosUad: RequerimientoUad[] = [];

  // Filtros
  filtroTexto = '';
  filtroCampus: number | 'TODOS' = 'TODOS';

  columnasRegistros = ['consecutivo', 'tipo', 'fecha', 'campus', 'persona', 'estado', 'caso', 'acciones'];
  columnasOrdenes = ['codigoOrden', 'prioridad', 'fechaHora', 'itinerario', 'persona', 'estado', 'acciones'];
  columnasEvidencias = ['codigo', 'ubicacion', 'fechaFranja', 'estado', 'referencia', 'acciones'];
  columnasRemisiones = ['consecutivo', 'destino', 'fecha', 'estado', 'uadConsecutivo', 'acciones'];
  columnasUad = ['persona', 'tipo', 'audiencia', 'notificacion', 'acciones'];

  ngOnInit(): void {
    this.cargarConteos();
    this.cargarDatosPestana(this.pestanaActiva);
  }

  cargarConteos(): void {
    this.analistaService.obtenerConteos().subscribe({
      next: (c) => this.conteos.set(c),
      error: (err) => console.error('Error cargando conteos', err)
    });
  }

  alSeleccionarPestana(pestana: string): void {
    this.pestanaActiva = pestana;
    this.cargarDatosPestana(pestana);
  }

  alCambiarPestana(indice: number): void {
    const mapa: Record<number, string> = {
      0: 'NUEVOS',
      1: 'REVISION',
      2: 'PENDIENTE_VINCULACION',
      3: 'ACOMPANAMIENTOS',
      4: 'CAMARAS',
      5: 'REMISIONES',
      6: 'UAD'
    };
    this.pestanaActiva = mapa[indice] || 'NUEVOS';
    this.cargarDatosPestana(this.pestanaActiva);
  }

  cargarDatosPestana(pestana: string): void {
    this.cargando = true;
    if (pestana === 'ACOMPANAMIENTOS') {
      this.acompService.listarOrdenes().subscribe({
        next: (items) => { this.ordenes = items; this.cargando = false; },
        error: () => (this.cargando = false)
      });
    } else if (pestana === 'CAMARAS') {
      this.camarasService.listarSolicitudes().subscribe({
        next: (items) => { this.evidencias = items; this.cargando = false; },
        error: () => (this.cargando = false)
      });
    } else if (pestana === 'REMISIONES') {
      this.remisionesService.listarRemisiones().subscribe({
        next: (items) => { this.remisiones = items; this.cargando = false; },
        error: () => (this.cargando = false)
      });
    } else if (pestana === 'UAD') {
      this.remisionesService.listarRequerimientosUad().subscribe({
        next: (items) => { this.requerimientosUad = items; this.cargando = false; },
        error: () => (this.cargando = false)
      });
    } else {
      this.analistaService.obtenerBandeja(pestana).subscribe({
        next: (resp) => { this.registros = resp.items; this.cargando = false; },
        error: () => (this.cargando = false)
      });
    }
  }

  // --- ACCIONES MODALES ---

  abrirModalVincular(reg: RegistroSeguridad): void {
    const ref = this.dialog.open(ModalVincularCasoComponent, {
      width: '600px',
      data: { registro: reg }
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open(`Actuación vinculada exitosamente a ${res.codigoCaso}`, 'Aceptar', { duration: 4000 });
        this.cargarConteos();
        this.cargarDatosPestana(this.pestanaActiva);
      }
    });
  }

  abrirModalSubsanar(reg: RegistroSeguridad): void {
    const ref = this.dialog.open(ModalSolicitarSubsanacionComponent, {
      width: '550px',
      data: { registro: reg }
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open('Subsanación solicitada a vigilancia', 'Aceptar', { duration: 4000 });
        this.cargarConteos();
        this.cargarDatosPestana(this.pestanaActiva);
      }
    });
  }

  declararIndependiente(reg: RegistroSeguridad): void {
    const motivo = prompt('Ingrese el motivo por el cual esta actuación se gestiona de forma independiente (sin abrir caso Ruta Violeta):');
    if (!motivo) return;
    this.analistaService.declararIndependiente(reg.id, motivo).subscribe({
      next: () => {
        this.snackBar.open('Actuación archivada como independiente', 'Aceptar', { duration: 4000 });
        this.cargarConteos();
        this.cargarDatosPestana(this.pestanaActiva);
      }
    });
  }

  abrirModalNuevaOrden(reg?: RegistroSeguridad): void {
    const ref = this.dialog.open(ModalNuevaOrdenComponent, {
      width: '650px',
      data: { registro: reg, idCaso: reg?.idCaso }
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open(`Orden ${res.codigoOrden} generada exitosamente`, 'Aceptar', { duration: 4000 });
        this.cargarConteos();
        if (this.pestanaActiva === 'ACOMPANAMIENTOS') {
          this.cargarDatosPestana('ACOMPANAMIENTOS');
        }
      }
    });
  }

  abrirModalSolicitudCamara(reg?: RegistroSeguridad): void {
    const ref = this.dialog.open(ModalSolicitudCamaraComponent, {
      width: '600px',
      data: { registro: reg }
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open(`Solicitud de video ${res.codigoSolicitud} radicada`, 'Aceptar', { duration: 4000 });
        this.cargarConteos();
        if (this.pestanaActiva === 'CAMARAS') {
          this.cargarDatosPestana('CAMARAS');
        }
      }
    });
  }

  abrirModalRemision(reg: RegistroSeguridad): void {
    const ref = this.dialog.open(ModalRemisionSpybComponent, {
      width: '600px',
      data: { registro: reg }
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open('Remisión emitida exitosamente', 'Aceptar', { duration: 4000 });
        this.cargarConteos();
        if (this.pestanaActiva === 'REMISIONES') {
          this.cargarDatosPestana('REMISIONES');
        }
      }
    });
  }

  copiarEnlaceVigilante(orden: OrdenAcompanamiento): void {
    const url = `${window.location.origin}/seguridad/orden/${orden.tokenAcceso}`;
    navigator.clipboard.writeText(url);
    this.snackBar.open('Enlace / QR de acceso para vigilante copiado al portapapeles', 'Cerrar', { duration: 3000 });
  }
}

