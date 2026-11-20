import { MensajeErrorPipe } from '../shared/mensaje-error.pipe';
import { SpybSoloNumerosDirective } from '../shared/spyb-restricciones.directive';
import { REGEX_ENTERO_POSITIVO, textoRequerido } from '../shared/spyb-validadores';
import { Component, OnInit, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { SpybAnalistaService } from '../services/spyb-analista.service';
import { RegistroSeguridad } from '../models/spyb.models';
import { SugerenciaCasoDto } from '../models/spyb-dtos';

export interface ModalVincularCasoData {
  registro: RegistroSeguridad;
}

@Component({
  selector: 'app-modal-vincular-caso',
  standalone: true,
  imports: [
    MensajeErrorPipe, SpybSoloNumerosDirective,
    MatTooltipModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule
],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="primary">link</mat-icon>
      Vincular actuación a caso CASILDA
    </h2>
    
    <mat-dialog-content class="dialog-content">
      <div class="registro-resumen">
        <p><strong>Consecutivo:</strong> {{ data.registro.consecutivo }}</p>
        <p><strong>Persona:</strong> {{ data.registro.persona.nombreCompleto }} (CC: {{ data.registro.persona.numeroDocumento }})</p>
        <p><strong>Hechos:</strong> {{ data.registro.descripcionHechos }}</p>
      </div>
    
      @if (cargandoSugerencias) {
        <div class="alerta-info">
          <mat-icon>sync</mat-icon> Buscando casos registrados para esta persona...
        </div>
      }
    
      @if (!cargandoSugerencias && sugerencias.length > 0) {
        <div class="sugerencias-seccion">
          <h4>Casos CASILDA coincidentes encontrados:</h4>
          @for (s of sugerencias; track s.idCaso) {
            <button
              type="button"
              class="sugerencia-card"
              (click)="seleccionarCaso(s)"
              [class.seleccionado]="form.get('idCaso')?.value === s.idCaso"
              [attr.aria-pressed]="form.get('idCaso')?.value === s.idCaso"
            >
              <div class="sugerencia-header">
                <strong>{{ s.codigoCaso }}</strong>
                <span class="badge-estado">{{ s.estado }}</span>
              </div>
              <p class="sugerencia-detalle"><strong>Lugar:</strong> {{ s.lugarHechos || 'No especificado' }}</p>
              @if (s.presuntoAgresor) {
                <p class="sugerencia-detalle"><strong>Presunto agresor:</strong> {{ s.presuntoAgresor }}</p>
              }
              <p class="sugerencia-motivo"><em>{{ s.motivo }}</em></p>
            </button>
          }
        </div>
      }
    
      @if (!cargandoSugerencias && sugerencias.length === 0) {
        <div class="alerta-warning">
          <mat-icon>info</mat-icon> No se encontraron casos abiertos para esta cédula. Puede ingresar el ID del caso manualmente.
        </div>
      }
    
      <form [formGroup]="form" class="formulario-vinculacion">
        <div  class="spyb-campo full-width">
<label class="spyb-campo__etiqueta" for="spyb-idCaso">ID numérico del caso CASILDA <span class="required-star">*</span> <button type="button" class="help-tooltip-trigger" matTooltip="Lo encuentra en la bandeja de reparto o en el detalle del caso." matTooltipClass="casilda-help-tooltip" (click)="$event.stopPropagation()" aria-label="Ayuda sobre id numérico del caso casilda">?</button></label>
<mat-form-field appearance="outline">
          <input id="spyb-idCaso" matInput formControlName="idCaso" placeholder="Ej. 12" appSoloNumeros inputmode="numeric" autocomplete="off" maxlength="10" />
        <mat-error>{{ form.get('idCaso') | mensajeError:'entero' }}</mat-error>
      </mat-form-field>
</div>
    
        <div  class="spyb-campo full-width">
<label class="spyb-campo__etiqueta" for="spyb-criterioJustificacion">Criterio o justificación de la vinculación <span class="required-star">*</span> <button type="button" class="help-tooltip-trigger" matTooltip="Queda guardado en la auditoría de la actuación." matTooltipClass="casilda-help-tooltip" (click)="$event.stopPropagation()" aria-label="Ayuda sobre criterio o justificación de la vinculación">?</button></label>
<mat-form-field appearance="outline">
          <textarea id="spyb-criterioJustificacion"
            matInput
            rows="3"
            formControlName="criterioJustificacion"
            placeholder="Describa el motivo técnico por el cual esta actuación corresponde a este caso..." maxlength="1000"
          ></textarea>
        <mat-error>{{ form.get('criterioJustificacion') | mensajeError:'texto' }}</mat-error>
      </mat-form-field>
</div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || guardando" (click)="confirmar()">
        <mat-icon>check</mat-icon> Confirmar vinculación
      </button>
    </mat-dialog-actions>
    `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .registro-resumen {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 0.9rem;
    }
    .registro-resumen p {
      margin: 4px 0;
    }
    .sugerencias-seccion {
      margin-bottom: 16px;
    }
    .sugerencia-card {
      display: block;
      width: 100%;
      text-align: left;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
    }
    .sugerencia-card:hover {
      background-color: #f1f8e9;
      border-color: #81c784;
    }
    .sugerencia-card.seleccionado {
      background-color: #e8f5e9;
      border-color: #2e7d32;
      border-width: 2px;
    }
    .sugerencia-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .sugerencia-detalle {
      font-size: 0.85rem;
      margin: 2px 0;
      color: #424242;
    }
    .sugerencia-motivo {
      font-size: 0.8rem;
      color: #616161;
      margin: 4px 0 0 0;
    }
    .badge-estado {
      background: #e3f2fd;
      color: #1565c0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .alerta-info, .alerta-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 12px;
    }
    .alerta-info { background: #e8f4fd; color: #0d47a1; }
    .alerta-warning { background: #fff3e0; color: #e65100; }
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }
  `]
})
export class ModalVincularCasoComponent implements OnInit {
  data = inject<ModalVincularCasoData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly analistaService = inject(SpybAnalistaService);
  private readonly dialogRef = inject(MatDialogRef<ModalVincularCasoComponent>);

  sugerencias: SugerenciaCasoDto[] = [];
  cargandoSugerencias = true;
  guardando = false;

  form: FormGroup = this.fb.group({
    idCaso: [null, [Validators.required, Validators.pattern(REGEX_ENTERO_POSITIVO)]],
    criterioJustificacion: ['', textoRequerido(10, 1000)]
  });

  ngOnInit(): void {
    const doc = this.data.registro.persona.numeroDocumento;
    if (doc) {
      this.analistaService.obtenerSugerenciasCasos(doc).subscribe({
        next: (items) => {
          this.sugerencias = items;
          this.cargandoSugerencias = false;
          if (items.length === 1) {
            this.seleccionarCaso(items[0]);
          }
        },
        error: () => {
          this.cargandoSugerencias = false;
        }
      });
    } else {
      this.cargandoSugerencias = false;
    }
  }

  seleccionarCaso(s: SugerenciaCasoDto): void {
    this.form.patchValue({
      idCaso: s.idCaso,
      criterioJustificacion: `Vinculación técnica por coincidencia de hechos y persona con caso ${s.codigoCaso}`
    });
  }

  confirmar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    const { idCaso, criterioJustificacion } = this.form.value;
    this.analistaService.vincularCaso(this.data.registro.id, Number(idCaso), criterioJustificacion).subscribe({
      next: (resultado) => {
        this.dialogRef.close(resultado);
      },
      error: () => {
        this.guardando = false;
      }
    });
  }
}

