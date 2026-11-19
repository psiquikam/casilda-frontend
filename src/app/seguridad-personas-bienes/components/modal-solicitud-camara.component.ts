import { MensajeErrorPipe } from '../shared/mensaje-error.pipe';
import { fechaNoFutura, hoyLocal, posteriorA, revalidarAlCambiar, textoRequerido } from '../shared/spyb-validadores';
import { Component, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { SpybCamarasService } from '../services/spyb-camaras.service';
import { RegistroSeguridad } from '../models/spyb.models';
import { SolicitarEvidenciaCamaraRequest } from '../models/spyb-dtos';

export interface ModalSolicitudCamaraData {
  registro?: RegistroSeguridad;
}

@Component({
  selector: 'app-modal-solicitud-camara',
  standalone: true,
  imports: [
    MensajeErrorPipe,
    MatTooltipModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="primary">videocam</mat-icon>
      Solicitud de búsqueda y custodia de cámaras
    </h2>
    
    <mat-dialog-content class="dialog-content">
      <div class="aviso-seguridad">
        <mat-icon>info</mat-icon>
        <span>
          CASILDA registra la cadena de custodia institucional y referencias técnicas de almacenamiento.
          <strong>No almacena videos dentro del sistema</strong> (RF-SPB-082).
        </span>
      </div>
    
      <form [formGroup]="form">
        <div  class="spyb-campo full-width">
<label class="spyb-campo__etiqueta" for="spyb-ubicacionCamara">Ubicación de la cámara / sector <span class="required-star">*</span></label>
<mat-form-field appearance="outline">
          <input id="spyb-ubicacionCamara" matInput formControlName="ubicacionCamara" placeholder="Ej. Domo bloque 12 pasillo segundo piso" maxlength="150" />
        <mat-error>{{ form.get('ubicacionCamara') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
    
        <div class="row">
          <div  class="spyb-campo col-4">
<label class="spyb-campo__etiqueta" for="spyb-fechaHechos">Fecha de los hechos <span class="required-star">*</span></label>
<mat-form-field appearance="outline">
            <input id="spyb-fechaHechos" matInput type="date" formControlName="fechaHechos" [max]="hoy" />
        <mat-error>{{ form.get('fechaHechos') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
    
          <div  class="spyb-campo col-4">
<label class="spyb-campo__etiqueta" for="spyb-horaInicioFranja">Hora inicio franja <span class="required-star">*</span></label>
<mat-form-field appearance="outline">
            <input id="spyb-horaInicioFranja" matInput type="time" formControlName="horaInicioFranja" />
        <mat-error>{{ form.get('horaInicioFranja') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
    
          <div  class="spyb-campo col-4">
<label class="spyb-campo__etiqueta" for="spyb-horaFinFranja">Hora fin franja <span class="required-star">*</span> <button type="button" class="help-tooltip-trigger" matTooltip="Franja corta: entre más precisa, más rápida la extracción del video." matTooltipClass="casilda-help-tooltip" (click)="$event.stopPropagation()" aria-label="Ayuda sobre hora fin franja">?</button></label>
<mat-form-field appearance="outline">
            <input id="spyb-horaFinFranja" matInput type="time" formControlName="horaFinFranja" />
        <mat-error>{{ form.get('horaFinFranja') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
        </div>
    
        <div  class="spyb-campo full-width">
<label class="spyb-campo__etiqueta" for="spyb-motivoSolicitud">Motivo de la solicitud / justificación técnica <span class="required-star">*</span> <button type="button" class="help-tooltip-trigger" matTooltip="Sin justificación técnica no se puede iniciar la cadena de custodia. Por qué se necesita el video, mínimo 10 caracteres." matTooltipClass="casilda-help-tooltip" (click)="$event.stopPropagation()" aria-label="Ayuda sobre motivo de la solicitud / justificación técnica">?</button></label>
<mat-form-field appearance="outline">
          <textarea id="spyb-motivoSolicitud"
            matInput
            rows="3"
            formControlName="motivoSolicitud"
            placeholder="Describa por qué se requiere la extracción y conservación de esta grabación..." maxlength="1000"
          ></textarea>
        <mat-error>{{ form.get('motivoSolicitud') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || guardando" (click)="confirmar()">
        <mat-icon>save</mat-icon> Radicar solicitud
      </button>
    </mat-dialog-actions>
    `,
  styles: [`
    .dialog-title { display: flex; align-items: center; gap: 8px; }
    .aviso-seguridad {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background-color: #e8f4fd;
      color: #0b5345;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 16px;
    }
    .row { display: flex; gap: 12px; }
    .col-4 { flex: 1; }
    .full-width { width: 100%; }
  `]
})
export class ModalSolicitudCamaraComponent {
  data? = inject<ModalSolicitudCamaraData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly camarasService = inject(SpybCamarasService);
  private readonly dialogRef = inject(MatDialogRef<ModalSolicitudCamaraComponent>);

  guardando = false;

  form: FormGroup = this.fb.group({
    ubicacionCamara: ['', textoRequerido(3, 150)],
    fechaHechos: ['', [Validators.required, fechaNoFutura]],
    horaInicioFranja: ['', [Validators.required]],
    horaFinFranja: ['', [Validators.required, posteriorA('horaInicioFranja')]],
    motivoSolicitud: ['', textoRequerido(10, 1000)]
  });

  readonly hoy = hoyLocal();

  constructor() {
    revalidarAlCambiar(this.form, 'horaInicioFranja', 'horaFinFranja');
    const data = this.data;

    if (data?.registro) {
      this.form.patchValue({
        ubicacionCamara: data.registro.lugarHechos,
        motivoSolicitud: `Requerimiento de extracción por actuación ${data.registro.consecutivo}: ${data.registro.descripcionHechos}`
      });
    }
  }

  confirmar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    const req: SolicitarEvidenciaCamaraRequest = {
      ...this.form.value,
      idRegistroSeguridad: this.data?.registro?.id,
      idCaso: this.data?.registro?.idCaso
    };
    this.camarasService.solicitarEvidencia(req).subscribe({
      next: (res) => this.dialogRef.close(res),
      error: () => (this.guardando = false)
    });
  }
}

