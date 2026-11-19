import { MensajeErrorPipe } from '../shared/mensaje-error.pipe';
import { SpybSoloNumerosDirective, SpybSoloLetrasDirective } from '../shared/spyb-restricciones.directive';
import { Component, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SpybAcompanamientoService } from '../services/spyb-acompanamiento.service';
import { RegistroSeguridad } from '../models/spyb.models';
import { REGEX_LETRAS, fechaNoPasada, horaNoPasadaDelDia, hoyLocal, revalidarAlCambiar, textoRequerido, validadoresTelefono } from '../shared/spyb-validadores';
import { CrearOrdenAcompanamientoRequest } from '../models/spyb-dtos';

export interface ModalNuevaOrdenData {
  registro?: RegistroSeguridad;
  idCaso?: number;
  idMedida?: number;
}

@Component({
  selector: 'app-modal-nueva-orden',
  standalone: true,
  imports: [
    MensajeErrorPipe, SpybSoloNumerosDirective, SpybSoloLetrasDirective,
    MatTooltipModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggleModule
],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="primary">transfer_within_a_station</mat-icon>
      Emitir orden de acompañamiento
    </h2>
    
    <mat-dialog-content class="dialog-content">
      <form [formGroup]="form" class="formulario-orden">
        <div class="row">
          <div  class="spyb-campo col-6">
<label class="spyb-campo__etiqueta" for="spyb-prioridad">Prioridad <span class="required-star">*</span> <button type="button" class="help-tooltip-trigger" matTooltip="Alta: inmediata o por medida de protección. Media: programada. Baja: preventiva." matTooltipClass="casilda-help-tooltip" (click)="$event.stopPropagation()" aria-label="Ayuda sobre prioridad">?</button></label>
<mat-form-field appearance="outline">
            <mat-select placeholder="Seleccione una opción" id="spyb-prioridad" formControlName="prioridad">
              <mat-option value="ALTA">Alta (Inmediata / medida de protección)</mat-option>
              <mat-option value="MEDIA">Media (Programada)</mat-option>
              <mat-option value="BAJA">Baja (Preventiva)</mat-option>
            </mat-select>
        <mat-error>{{ form.get('prioridad') | mensajeError:'seleccion' }}</mat-error>
      </mat-form-field>
</div>
    
          <div class="col-6 toggle-container">
            <mat-slide-toggle formControlName="esMedidaFormal" color="primary">
              ¿Medida formal de protección?
            </mat-slide-toggle>
          </div>
        </div>
    
        <div class="row">
          <div  class="spyb-campo col-6">
<label class="spyb-campo__etiqueta" for="spyb-fechaProgramada">Fecha programada <span class="required-star">*</span></label>
<mat-form-field appearance="outline">
            <input id="spyb-fechaProgramada" matInput type="date" formControlName="fechaProgramada" [min]="hoy" />
        <mat-error>{{ form.get('fechaProgramada') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
    
          <div  class="spyb-campo col-6">
<label class="spyb-campo__etiqueta" for="spyb-horaProgramada">Hora programada <span class="required-star">*</span></label>
<mat-form-field appearance="outline">
            <input id="spyb-horaProgramada" matInput type="time" formControlName="horaProgramada" />
        <mat-error>{{ form.get('horaProgramada') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
        </div>
    
        <div class="row">
          <div  class="spyb-campo col-6">
<label class="spyb-campo__etiqueta" for="spyb-lugarOrigen">Punto de origen / encuentro <span class="required-star">*</span></label>
<mat-form-field appearance="outline">
            <input id="spyb-lugarOrigen" matInput formControlName="lugarOrigen" placeholder="Ej. Portería ferrocarril" maxlength="150" />
        <mat-error>{{ form.get('lugarOrigen') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
    
          <div  class="spyb-campo col-6">
<label class="spyb-campo__etiqueta" for="spyb-lugarDestino">Punto de destino <span class="required-star">*</span></label>
<mat-form-field appearance="outline">
            <input id="spyb-lugarDestino" matInput formControlName="lugarDestino" placeholder="Ej. Bloque 16 Aula 302" maxlength="150" />
        <mat-error>{{ form.get('lugarDestino') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
        </div>
    
        <div class="row">
          <div  class="spyb-campo col-12">
<label class="spyb-campo__etiqueta" for="spyb-personaAcompanada">Nombre persona a acompañar <span class="required-star">*</span></label>
<mat-form-field appearance="outline">
            <input id="spyb-personaAcompanada" matInput formControlName="personaAcompanada" appSoloLetras autocomplete="off" maxlength="120" />
        <mat-error>{{ form.get('personaAcompanada') | mensajeError:'letras' }}</mat-error>
      </mat-form-field>
</div>
        </div>
    
        <div class="row">
          <div  class="spyb-campo col-6">
<label class="spyb-campo__etiqueta" for="spyb-documentoAcompanada">Documento de identidad</label>
<mat-form-field appearance="outline">
            <input id="spyb-documentoAcompanada" matInput formControlName="documentoAcompanada" appSoloNumeros inputmode="numeric" autocomplete="off" maxlength="20" />
        <mat-error>{{ form.get('documentoAcompanada') | mensajeError:'documento' }}</mat-error>
      </mat-form-field>
</div>
    
          <div  class="spyb-campo col-6">
<label class="spyb-campo__etiqueta" for="spyb-telefonoAcompanada">Teléfono de contacto</label>
<mat-form-field appearance="outline">
            <input id="spyb-telefonoAcompanada" matInput formControlName="telefonoAcompanada" appSoloNumeros inputmode="numeric" autocomplete="off" maxlength="12" />
        <mat-error>{{ form.get('telefonoAcompanada') | mensajeError:'telefono' }}</mat-error>
      </mat-form-field>
</div>
        </div>
    
        <div  class="spyb-campo full-width">
<label class="spyb-campo__etiqueta" for="spyb-condicionesOperativas">Condiciones y observaciones operativas (para el vigilante) <button type="button" class="help-tooltip-trigger" matTooltip="Instrucciones para el vigilante, si las hay." matTooltipClass="casilda-help-tooltip" (click)="$event.stopPropagation()" aria-label="Ayuda sobre condiciones y observaciones operativas (para el vigilante)">?</button></label>
<mat-form-field appearance="outline">
          <textarea id="spyb-condicionesOperativas"
            matInput
            rows="3"
            formControlName="condicionesOperativas"
            placeholder="Instrucciones tácticas para el personal de vigilancia..." maxlength="500"
          ></textarea>
        <mat-error>{{ form.get('condicionesOperativas') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || guardando" (click)="confirmar()">
        <mat-icon>qr_code</mat-icon> Generar orden y token
      </button>
    </mat-dialog-actions>
    `,
  styles: [`
    .dialog-title { display: flex; align-items: center; gap: 8px; }
    .row { display: flex; gap: 12px; margin-bottom: 4px; }
    .col-6 { flex: 1; }
    .col-12 { flex: 2; }
    .full-width { width: 100%; }
    .toggle-container { display: flex; align-items: center; padding-top: 10px; }
  `]
})
export class ModalNuevaOrdenComponent {
  data? = inject<ModalNuevaOrdenData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly acompService = inject(SpybAcompanamientoService);
  private readonly dialogRef = inject(MatDialogRef<ModalNuevaOrdenComponent>);

  guardando = false;

  form: FormGroup = this.fb.group({
    prioridad: [null, [Validators.required]],
    esMedidaFormal: [false],
    fechaProgramada: ['', [Validators.required, fechaNoPasada]],
    horaProgramada: ['', [Validators.required, horaNoPasadaDelDia('fechaProgramada')]],
    lugarOrigen: ['', textoRequerido(3, 150)],
    lugarDestino: ['', textoRequerido(3, 150)],
    personaAcompanada: ['', [...textoRequerido(3, 120), Validators.pattern(REGEX_LETRAS)]],
    documentoAcompanada: ['', [Validators.pattern(/^[0-9]{5,20}$/)]],
    telefonoAcompanada: ['', validadoresTelefono],
    condicionesOperativas: ['', [Validators.maxLength(500)]]
  });

  readonly hoy = hoyLocal();

  constructor() {
    revalidarAlCambiar(this.form, 'fechaProgramada', 'horaProgramada');
    const data = this.data;

    if (data?.registro) {
      this.form.patchValue({
        personaAcompanada: data.registro.persona.nombreCompleto,
        documentoAcompanada: data.registro.persona.numeroDocumento,
        telefonoAcompanada: data.registro.persona.telefono,
        lugarOrigen: data.registro.lugarHechos,
        esMedidaFormal: Boolean(data.registro.idCaso)
      });
    }
  }

  confirmar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    const req: CrearOrdenAcompanamientoRequest = {
      ...this.form.value,
      idCaso: this.data?.idCaso,
      idMedidaProteccion: this.data?.idMedida,
      idRegistroOrigen: this.data?.registro?.id
    };
    this.acompService.crearOrden(req).subscribe({
      next: (res) => this.dialogRef.close(res),
      error: () => (this.guardando = false)
    });
  }
}

