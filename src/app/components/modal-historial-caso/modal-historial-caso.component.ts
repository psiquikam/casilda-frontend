import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { CitaDto } from '../../services/solicitud.service';
import { formatOnlyDate } from '../../custom-date-adapter';

export interface HistorialCasoDialogData {
  codigo: string;
  nombre: string;
  atenciones: CitaDto[];
}

@Component({
  selector: 'app-modal-historial-caso',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Historial del caso {{ data.codigo }}</h2>
    <mat-dialog-content>
      <p>{{ data.nombre }} · {{ data.atenciones.length }} atenciones</p>
      @if (data.atenciones.length) {
        <ol class="historial-caso">
          @for (atencion of data.atenciones; track atencion.id) {
            <li>
              <mat-icon aria-hidden="true">
                {{ atencion.tipoAtencion === 'SEGUIMIENTO' ? 'event_repeat' : 'event_available' }}
              </mat-icon>
              <div>
                <strong>
                  {{ atencion.tipoAtencion === 'SEGUIMIENTO' ? 'Seguimiento' : 'Primera atención' }}
                </strong>
                <span>{{ formatOnlyDate(atencion.fechaCita) }} · {{ atencion.estadoCita }}</span>
                @if (atencion.profesional) {
                  <span>{{ atencion.profesional }}</span>
                }
                @if (atencion.observaciones) {
                  <span>{{ atencion.observaciones }}</span>
                }
              </div>
            </li>
          }
        </ol>
      } @else {
        <p>No hay atenciones registradas para este caso.</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .historial-caso {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .historial-caso li {
      align-items: flex-start;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
      padding: 12px 0;
    }

    .historial-caso li:last-child {
      border-bottom: 0;
    }

    .historial-caso li div {
      display: grid;
      gap: 4px;
    }
  `]
})
export class ModalHistorialCasoComponent {
  readonly data = inject<HistorialCasoDialogData>(MAT_DIALOG_DATA);
  readonly formatOnlyDate = formatOnlyDate;
}
