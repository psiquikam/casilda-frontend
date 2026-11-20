import { MensajeErrorPipe } from '../shared/mensaje-error.pipe';
import { textoRequerido } from '../shared/spyb-validadores';
import { Component, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { SpybRemisionesService } from '../services/spyb-remisiones.service';
import { RegistroSeguridad } from '../models/spyb.models';
import { CATALOGO_DESTINOS_REMISION, DestinoRemisionSeguridad } from '../models/spyb-catalogos';
import { CrearRemisionSeguridadRequest } from '../models/spyb-dtos';

export interface ModalRemisionSpybData {
  registro: RegistroSeguridad;
}

@Component({
  selector: 'app-modal-remision-spyb',
  standalone: true,
  imports: [
    MensajeErrorPipe,
    MatTooltipModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="primary">forward_to_inbox</mat-icon>
      Remisión de actuación de seguridad
    </h2>
    
    <mat-dialog-content class="dialog-content">
      <p>
        Generar remisión para la actuación <strong>{{ data.registro.consecutivo }}</strong>.
      </p>
    
      <form [formGroup]="form">
        <div  class="spyb-campo full-width">
<label class="spyb-campo__etiqueta" for="spyb-destino">Destino de la remisión <span class="required-star">*</span> <button type="button" class="help-tooltip-trigger" matTooltip="Equipo de atención, Línea Alma, UAD o una entidad externa." matTooltipClass="casilda-help-tooltip" (click)="$event.stopPropagation()" aria-label="Ayuda sobre destino de la remisión">?</button></label>
<mat-form-field appearance="outline">
          <mat-select placeholder="Seleccione una opción" id="spyb-destino" formControlName="destino">
            @for (d of destinos; track d) {
              <mat-option [value]="d.codigo">
                {{ d.nombre }}
              </mat-option>
            }
          </mat-select>
        <mat-error>{{ form.get('destino') | mensajeError:'seleccion' }}</mat-error>
      </mat-form-field>
</div>
    
        <!-- Campo adicional si el destino es UAD -->
        @if (form.get('destino')?.value === 'UAD') {
          <div  class="spyb-campo full-width">
<label class="spyb-campo__etiqueta" for="spyb-consecutivoRecibidoUad">Consecutivo de recibido UAD (Si ya fue emitido) <button type="button" class="help-tooltip-trigger" matTooltip="Solo si la UAD ya emitió un número de recibido." matTooltipClass="casilda-help-tooltip" (click)="$event.stopPropagation()" aria-label="Ayuda sobre consecutivo de recibido uad (si ya fue emitido)">?</button></label>
<mat-form-field appearance="outline">
            <input id="spyb-consecutivoRecibidoUad" matInput formControlName="consecutivoRecibidoUad" placeholder="Ej. UAD-REC-2026-0042" maxlength="30" />
        <mat-error>{{ form.get('consecutivoRecibidoUad') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
        }
    
        <!-- Campos adicionales si es entidad externa -->
        @if (esDestinoExterno) {
          <div class="row">
            <div  class="spyb-campo col-6">
<label class="spyb-campo__etiqueta" for="spyb-entidadExterna">Nombre entidad externa</label>
<mat-form-field appearance="outline">
              <input id="spyb-entidadExterna" matInput formControlName="entidadExterna" placeholder="Ej. Fiscalía 14 Seccional" maxlength="100" />
        <mat-error>{{ form.get('entidadExterna') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
            <div  class="spyb-campo col-6">
<label class="spyb-campo__etiqueta" for="spyb-medioNotificacion">Medio utilizado</label>
<mat-form-field appearance="outline">
              <input id="spyb-medioNotificacion" matInput formControlName="medioNotificacion" placeholder="Ej. Oficio radicado / correo" maxlength="100" />
        <mat-error>{{ form.get('medioNotificacion') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
          </div>
        }
    
        <div  class="spyb-campo full-width">
<label class="spyb-campo__etiqueta" for="spyb-motivo">Motivo y justificación de la remisión <span class="required-star">*</span> <button type="button" class="help-tooltip-trigger" matTooltip="Este texto lo verá la dependencia que recibe la remisión. Por qué se remite, mínimo 10 caracteres." matTooltipClass="casilda-help-tooltip" (click)="$event.stopPropagation()" aria-label="Ayuda sobre motivo y justificación de la remisión">?</button></label>
<mat-form-field appearance="outline">
          <textarea id="spyb-motivo"
            matInput
            rows="3"
            formControlName="motivo"
            placeholder="Describa el fundamento de la remisión y qué actuación se traslada..." maxlength="1000"
          ></textarea>
        <mat-error>{{ form.get('motivo') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || guardando" (click)="confirmar()">
        <mat-icon>send</mat-icon> Emitir remisión
      </button>
    </mat-dialog-actions>
    `,
  styles: [`
    .dialog-title { display: flex; align-items: center; gap: 8px; }
    .full-width { width: 100%; margin-bottom: 4px; }
    .row { display: flex; gap: 12px; }
    .col-6 { flex: 1; }
  `]
})
export class ModalRemisionSpybComponent {
  data = inject<ModalRemisionSpybData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly remisionesService = inject(SpybRemisionesService);
  private readonly dialogRef = inject(MatDialogRef<ModalRemisionSpybComponent>);

  destinos = CATALOGO_DESTINOS_REMISION;
  guardando = false;

  form: FormGroup = this.fb.group({
    destino: [null, [Validators.required]],
    motivo: ['', textoRequerido(10, 1000)],
    consecutivoRecibidoUad: ['', [Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9/-]*$/)]],
    entidadExterna: ['', [Validators.maxLength(100)]],
    medioNotificacion: ['', [Validators.maxLength(100)]]
  });

  constructor() {
    // La entidad externa solo se pide (y se exige) cuando el destino es externo.
    this.form.get('destino')?.valueChanges.subscribe(() => {
      const entidad = this.form.get('entidadExterna');
      entidad?.setValidators(this.esDestinoExterno ? textoRequerido(3, 100) : [Validators.maxLength(100)]);
      entidad?.updateValueAndValidity({ emitEvent: false });
    });
  }

  get esDestinoExterno(): boolean {
    const d = this.form.get('destino')?.value;
    return d === 'FISCALIA' || d === 'POLICIA' || d === 'OTRO_EXTERNO';
  }

  confirmar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    const req: CrearRemisionSeguridadRequest = {
      idRegistroSeguridad: this.data.registro.id,
      idCaso: this.data.registro.idCaso,
      destino: this.form.value.destino as DestinoRemisionSeguridad,
      motivo: this.form.value.motivo,
      consecutivoRecibidoUad: this.form.value.consecutivoRecibidoUad,
      entidadExterna: this.form.value.entidadExterna,
      medioNotificacion: this.form.value.medioNotificacion
    };
    this.remisionesService.crearRemision(req).subscribe({
      next: (res) => this.dialogRef.close(res),
      error: () => (this.guardando = false)
    });
  }
}

