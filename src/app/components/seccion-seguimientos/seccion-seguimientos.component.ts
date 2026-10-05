import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../services/auth.service';
import { DialogoService } from '../../core/a11y/dialogo.service';
import { MaestrosVbgService } from '../../services/maestros-vbg.service';
import { MaestroDto } from '../../services/listas.service';
import { ModalSeguimientosComponent } from '../modal-seguimiento/modal-seguimiento.component';

export interface SeguimientoVbg {
  especialidad: string;
  idtiposeguimiento: number | null;
  tipoSeguimiento: string;
  fecha: Date | null;
  idaccion: number | null;
  accion: string;
  idactividad: number | null;
  actividad: string;
  descripcion: string;
  estado: 'Abierto' | 'Cerrado';
  motivoCierre: string | null;
  archivo: File | null;
}

/**
 * Sección «Seguimientos» del módulo Equipo de Atención (VBG-08), compartida
 * por `registro-caso` y `registro-atencion`.
 *
 * VBG-08-01..04: cuatro módulos independientes por especialidad.
 * VBG-08-10: cada especialidad gestiona sus registros de forma aislada —
 * aquí, la especialidad de la cuenta de prueba PROFESIONAL activa (P-12)
 * puede agregar, cerrar y eliminar; las otras tres se muestran de solo
 * lectura.
 * VBG-08-12/13: cierre autónomo con motivo en texto libre (decisión
 * provisional 16) y, si no queda ningún seguimiento abierto en el caso,
 * aviso de última profesional activa vía `DialogoService.confirmar()`.
 */
@Component({
  selector: 'app-seccion-seguimientos',
  imports: [FormsModule, DatePipe, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './seccion-seguimientos.component.html',
  styleUrls: ['./seccion-seguimientos.component.scss']
})
export class SeccionSeguimientosComponent implements OnInit {
  @Input() seguimientos: SeguimientoVbg[] = [];
  @Output() seguimientosChange = new EventEmitter<SeguimientoVbg[]>();

  private readonly dialog = inject(MatDialog);
  private readonly dialogoServicio = inject(DialogoService);
  private readonly maestrosVbg = inject(MaestrosVbgService);
  private readonly auth = inject(AuthService);

  especialidades: MaestroDto[] = [];

  cerrandoIndice: number | null = null;
  motivoCierreTexto = '';

  ngOnInit(): void {
    this.maestrosVbg.obtenerCatalogo('especialidades-seguimiento').subscribe({
      next: (data) => { this.especialidades = data; },
      error: () => { this.especialidades = []; }
    });
  }

  get especialidadActual(): string | undefined {
    return this.auth.getEspecialidadActual();
  }

  porEspecialidad(etiqueta: string): SeguimientoVbg[] {
    return this.seguimientos.filter((s) => s.especialidad === etiqueta);
  }

  puedeGestionar(etiqueta: string): boolean {
    return !!this.especialidadActual && this.especialidadActual === etiqueta;
  }

  indiceGlobal(seguimiento: SeguimientoVbg): number {
    return this.seguimientos.indexOf(seguimiento);
  }

  agregar(etiqueta: string): void {
    const ref = this.dialog.open(ModalSeguimientosComponent, { width: '720px', maxWidth: '95vw' });
    ref.afterClosed().subscribe((resultado) => {
      if (!resultado) {
        return;
      }
      const nuevo: SeguimientoVbg = {
        ...resultado,
        especialidad: etiqueta,
        estado: 'Abierto',
        motivoCierre: null
      };
      this.seguimientos = [...this.seguimientos, nuevo];
      this.seguimientosChange.emit(this.seguimientos);
    });
  }

  eliminar(seguimiento: SeguimientoVbg): void {
    this.dialogoServicio
      .confirmar({
        titulo: 'Eliminar seguimiento',
        mensaje: 'Se eliminará este registro de seguimiento del caso.',
        textoConfirmar: 'Eliminar'
      })
      .subscribe((confirmado) => {
        if (!confirmado) {
          return;
        }
        this.seguimientos = this.seguimientos.filter((s) => s !== seguimiento);
        this.seguimientosChange.emit(this.seguimientos);
      });
  }

  iniciarCierre(seguimiento: SeguimientoVbg): void {
    this.cerrandoIndice = this.indiceGlobal(seguimiento);
    this.motivoCierreTexto = '';
  }

  cancelarCierre(): void {
    this.cerrandoIndice = null;
    this.motivoCierreTexto = '';
  }

  confirmarCierre(seguimiento: SeguimientoVbg): void {
    const motivo = this.motivoCierreTexto.trim();
    if (!motivo) {
      return;
    }

    const cerrar = (): void => {
      seguimiento.estado = 'Cerrado';
      seguimiento.motivoCierre = motivo;
      this.seguimientos = [...this.seguimientos];
      this.seguimientosChange.emit(this.seguimientos);
      this.cerrandoIndice = null;
      this.motivoCierreTexto = '';
    };

    const quedanAbiertos = this.seguimientos.some((s) => s !== seguimiento && s.estado === 'Abierto');
    if (quedanAbiertos) {
      cerrar();
      return;
    }

    // VBG-08-13 / decisión provisional 16: en ambos botones el seguimiento
    // individual queda cerrado; el diálogo solo decide si se sugiere además
    // el cierre general del caso.
    this.dialogoServicio
      .confirmar({
        titulo: 'Eres la última profesional activa en este caso',
        subtitulo: 'No quedan seguimientos abiertos de ninguna especialidad',
        mensaje: 'Puedes cerrar también el caso general, o mantenerlo abierto y cerrar solo este seguimiento.',
        textoConfirmar: 'Cerrar el caso',
        textoCancelar: 'Mantener el caso abierto',
        iconoConfirmar: 'task_alt'
      })
      .subscribe(() => cerrar());
  }
}
