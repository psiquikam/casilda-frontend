import { MensajeErrorPipe } from '../shared/mensaje-error.pipe';
import { textoRequerido } from '../shared/spyb-validadores';
import { Component, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { SpybAnalistaService } from '../services/spyb-analista.service';
import { RegistroSeguridad } from '../models/spyb.models';

export interface ModalSubsanacionData {
  registro: RegistroSeguridad;
}

@Component({
  selector: 'app-modal-solicitar-subsanacion',
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
      <mat-icon color="warn">assignment_late</mat-icon>
      Solicitar subsanación o ampliación a vigilancia
    </h2>
    
    <mat-dialog-content class="dialog-content">
      <p>
        El reporte <strong>{{ data.registro.consecutivo }}</strong> pasará a estado
        <em>Subsanación requerida</em> y se notificará al supervisor
        <strong>{{ data.registro.reportante.nombre }}</strong>.
      </p>
    
      <form [formGroup]="form">
        <div  class="spyb-campo full-width">
<label class="spyb-campo__etiqueta" for="spyb-motivoSubsanacion">Motivo de la subsanación / información requerida <span class="required-star">*</span> <button type="button" class="help-tooltip-trigger" matTooltip="Se notifica al supervisor y el registro pasa a Subsanación requerida." matTooltipClass="casilda-help-tooltip" (click)="$event.stopPropagation()" aria-label="Ayuda sobre motivo de la subsanación / información requerida">?</button></label>
<mat-form-field appearance="outline">
          <textarea id="spyb-motivoSubsanacion"
            matInput
            rows="4"
            formControlName="motivoSubsanacion"
            placeholder="Especifique qué información técnica u operativa falta por completar en el informe..." maxlength="500"
          ></textarea>
        <mat-error>{{ form.get('motivoSubsanacion') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="warn" [disabled]="form.invalid || guardando" (click)="confirmar()">
        <mat-icon>send</mat-icon> Enviar solicitud de subsanación
      </button>
    </mat-dialog-actions>
    `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .full-width {
      width: 100%;
      margin-top: 8px;
    }
  `]
})
export class ModalSolicitarSubsanacionComponent {
  data = inject<ModalSubsanacionData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly analistaService = inject(SpybAnalistaService);
  private readonly dialogRef = inject(MatDialogRef<ModalSolicitarSubsanacionComponent>);

  guardando = false;

  form: FormGroup = this.fb.group({
    motivoSubsanacion: ['', textoRequerido(10, 500)]
  });

  confirmar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    const { motivoSubsanacion } = this.form.value;
    this.analistaService.solicitarSubsanacion(this.data.registro.id, motivoSubsanacion).subscribe({
      next: (resultado) => {
        this.dialogRef.close(resultado);
      },
      error: () => {
        this.guardando = false;
      }
    });
  }
}

