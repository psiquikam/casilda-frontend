import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { environment } from '../../../../../environments/environment';
import { DialogoService } from '../../../../core/a11y/dialogo.service';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { aplicarErroresServidor, mensajeDeError } from '../../../shared/http/errores-servidor';
import { AlmaPermisosService } from '../../../shared/permisos/alma-permisos.service';
import { RecontactoDto } from '../../../shared/types/alma-psicologia-dto';
import {
  DECISIONES_RECONTACTO,
  DecisionRecontacto,
  ETIQUETA_CANAL_INGRESO,
  ETIQUETA_DECISION_RECONTACTO,
  ETIQUETA_ESTADO_CASO,
  ETIQUETA_TRIAJE
} from '../../../shared/types/alma.types';
import { contadorControles } from '../../dominio/seguimientos';
import { NotificacionesPsicologiaService } from '../../services/notificaciones-psicologia.service';
import { RecontactosPsicologiaService } from '../../services/recontactos-psicologia.service';

const EXPLICACION: Record<DecisionRecontacto, string> = {
  VINCULAR_A_CASO: 'La nueva atención pasa a formar parte del caso activo; sus notas APH quedan en la línea de tiempo del caso.',
  CASO_NUEVO: 'Se trata de hechos distintos: la novedad sigue en la bandeja y, en el primer contacto efectivo, se abrirá un caso nuevo.',
  CONTENCION_PUNTUAL: 'Se registra una contención sobre el caso activo sin sumar seguimientos; la nueva atención se cierra.'
};

const CONFIRMACION: Record<DecisionRecontacto, { textoConfirmar: string; icono: string }> = {
  VINCULAR_A_CASO: { textoConfirmar: 'Vincular al caso', icono: 'link' },
  CASO_NUEVO: { textoConfirmar: 'Abrir caso nuevo', icono: 'create_new_folder' },
  CONTENCION_PUNTUAL: { textoConfirmar: 'Registrar contención', icono: 'support' }
};

/**
 * Resolución de recontactos — `/linea-alma/psicologia/recontactos` (J-1.7; `RF-ALMA-003`,
 * `RN-ALMA-06`, frontera F2).
 *
 * Una persona con caso activo volvió a llamar a APH, que registró una atención `ALMA-…` nueva
 * (nunca se vincula sola). Vista comparativa de la atención nueva frente al caso activo y tres
 * decisiones, **exclusivas de Psicología**: vincular al caso, abrir un caso nuevo (hechos
 * distintos) o contención puntual (Q8). Cada una pide confirmación y queda auditada en el servidor.
 */
@Component({
  selector: 'app-recontactos-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatIconModule, MatInputModule, MatRadioModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recontactos.page.html',
  styleUrl: './recontactos.page.scss'
})
export class RecontactosPage implements OnInit {
  private readonly servicio = inject(RecontactosPsicologiaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly notificaciones = inject(NotificacionesPsicologiaService);
  private readonly dialogo = inject(DialogoService);
  private readonly fb = inject(FormBuilder);
  protected readonly permisos = inject(AlmaPermisosService);

  protected readonly demo = Object.values(environment.lineaAlma.mocks).some(Boolean);
  protected readonly etiquetaCanal = ETIQUETA_CANAL_INGRESO;
  protected readonly etiquetaTriaje = ETIQUETA_TRIAJE;
  protected readonly etiquetaEstadoCaso = ETIQUETA_ESTADO_CASO;
  protected readonly etiquetaDecision = ETIQUETA_DECISION_RECONTACTO;
  protected readonly explicacion = EXPLICACION;
  protected readonly decisiones = DECISIONES_RECONTACTO;

  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly enviando = signal(false);
  protected readonly items = signal<RecontactoDto[]>([]);
  protected readonly seleccionadoId = signal<string | null>(null);
  protected readonly seleccionado = computed(() => this.items().find((r) => r.idAtencion === this.seleccionadoId()) ?? null);
  protected readonly vacio = computed(() => !this.cargando() && !this.error() && this.items().length === 0);
  protected readonly puedeResolver = computed(() => this.permisos.tiene('alma.psicologia.editar'));

  protected readonly form = this.fb.nonNullable.group({
    decision: ['' as DecisionRecontacto | '', Validators.required],
    nota: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]]
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.servicio.listar().subscribe({
      next: (items) => {
        this.items.set(items);
        if (!items.some((r) => r.idAtencion === this.seleccionadoId())) this.seleccionadoId.set(items[0]?.idAtencion ?? null);
        this.cargando.set(false);
      },
      error: (e: ErrorAlma) => {
        this.error.set(true);
        this.cargando.set(false);
        this.notificacion.error(e.mensaje, e);
      }
    });
  }

  protected seleccionar(id: string): void {
    this.seleccionadoId.set(id);
    this.form.reset({ decision: '', nota: '' });
  }

  protected controles(numeroSeguimientos: number): string {
    return contadorControles(numeroSeguimientos).texto;
  }

  protected error_(control: 'decision' | 'nota', etiqueta: string): string | null {
    return mensajeDeError(this.form.controls[control], etiqueta);
  }

  protected resolver(): void {
    const recontacto = this.seleccionado();
    this.form.markAllAsTouched();
    if (!recontacto || this.form.invalid || !this.puedeResolver()) return;
    const v = this.form.getRawValue();
    const decision = v.decision as DecisionRecontacto;
    const confirmacion = CONFIRMACION[decision];
    this.dialogo
      .confirmar({
        titulo: ETIQUETA_DECISION_RECONTACTO[decision],
        subtitulo: `${recontacto.idAtencion} · caso ${recontacto.casoActivo.numeroCaso}`,
        mensaje: `${EXPLICACION[decision]} La decisión queda registrada en el historial.`,
        textoConfirmar: confirmacion.textoConfirmar,
        iconoConfirmar: confirmacion.icono,
        textoCancelar: 'Revisar'
      })
      .subscribe({
        next: (confirmado) => confirmado && this.enviar(recontacto, decision, v.nota.trim()),
        error: () => undefined
      });
  }

  private enviar(recontacto: RecontactoDto, decision: DecisionRecontacto, nota: string): void {
    this.enviando.set(true);
    this.servicio
      .resolver(recontacto.idAtencion, {
        version: recontacto.version,
        decision,
        numeroCaso: decision === 'CASO_NUEVO' ? null : recontacto.casoActivo.numeroCaso,
        nota
      })
      .subscribe({
        next: (respuesta) => {
          this.enviando.set(false);
          this.form.reset({ decision: '', nota: '' });
          this.notificacion.exito(
            decision === 'VINCULAR_A_CASO'
              ? `${respuesta.idAtencion} quedó vinculada al caso ${respuesta.numeroCaso}.`
              : decision === 'CONTENCION_PUNTUAL'
                ? `Contención registrada en el caso ${respuesta.numeroCaso}; ${respuesta.idAtencion} queda cerrada.`
                : `${respuesta.idAtencion} seguirá como caso nuevo. Gestione la novedad desde la bandeja.`
          );
          this.notificaciones.refrescar();
          this.cargar();
        },
        error: (e: ErrorAlma) => {
          this.enviando.set(false);
          const sinCampo = aplicarErroresServidor(this.form, e);
          this.notificacion.error(sinCampo[0] ?? e.mensaje, e);
          // 409 o «ya resuelto»: la lista cambió; se refresca para mostrar lo vigente.
          if (e.tipo === 'conflicto' || e.codigo === 'RECONTACTO_YA_RESUELTO') this.cargar();
        }
      });
  }
}
