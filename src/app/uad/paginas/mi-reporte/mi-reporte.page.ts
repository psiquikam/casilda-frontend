import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DialogoService } from '../../../core/a11y/dialogo.service';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { ConCambiosPendientes } from '../../../core/navegacion/cambios-sin-guardar.guard';
import { MiReporteDetalle } from '../../contratos/uad-api.types';
import { UadMisReportesPort } from '../../contratos/uad-mis-reportes.port';
import { LIMITE_RESPUESTA_SOLICITUD, mensajeParaReportante, validarRespuestaSolicitud } from '../../dominio/mis-reportes';
import { ErrorUad } from '../../infraestructura/uad-error';
import { UAD_MIS_REPORTES_SIMULADO } from '../../uad.providers';

type Vista = 'cargando' | 'detalle' | 'no-encontrado' | 'error';

/**
 * Detalle de un reporte propio — `/mis-reportes/:codigo` (UAD-EVA-04/05). Muestra el estado y, si la UAD
 * pidió información, la solicitud con su formulario de respuesta.
 *
 * - La respuesta es **solo texto**: el servidor rechaza archivos hasta aprobar la política de evidencias
 *   (D-UAD-09), y la página lo dice en vez de ofrecer un campo que fallaría.
 * - Se puede responder aunque el plazo haya vencido: el vencimiento no cierra el reporte (UAD-EVA-05).
 * - Enviar pide confirmación, porque la respuesta no se puede editar después.
 * - Un reporte ajeno o inexistente se ve igual: «no lo encontramos» (el servidor responde 404 a ambos).
 * - Nada se guarda en el navegador; el texto sin enviar se pierde al salir, con aviso previo.
 */
@Component({
  selector: 'app-uad-mi-reporte-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mi-reporte.page.html',
  styleUrl: './mi-reporte.page.scss'
})
export class MiReportePage implements OnInit, ConCambiosPendientes {
  private readonly api = inject(UadMisReportesPort);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogo = inject(DialogoService);
  private readonly notificacion = inject(NotificacionService);
  private readonly documento = inject(DOCUMENT);
  protected readonly simulado = inject(UAD_MIS_REPORTES_SIMULADO);

  protected readonly codigo = this.route.snapshot.paramMap.get('codigo') ?? '';
  protected readonly vista = signal<Vista>('cargando');
  protected readonly reporte = signal<MiReporteDetalle | null>(null);
  protected readonly mensajeError = signal('');
  protected readonly enviando = signal(false);
  protected readonly recienRespondida = signal(false);
  protected readonly respuesta = new FormControl('', { nonNullable: true });
  protected readonly limite = LIMITE_RESPUESTA_SOLICITUD;

  protected readonly solicitud = computed(() => this.reporte()?.solicitudInformacion ?? null);
  /** Hay formulario solo si el servidor dice que la solicitud sigue pendiente. */
  protected readonly puedeResponder = computed(() => !!this.reporte()?.solicitudPendiente && !!this.solicitud() && !this.solicitud()?.respondida);

  ngOnInit(): void {
    this.cargar();
  }

  tieneCambiosPendientes(): boolean {
    return this.puedeResponder() && this.respuesta.value.trim().length > 0 && !this.enviando();
  }

  protected cargar(): void {
    this.vista.set('cargando');
    this.api.obtener(this.codigo).subscribe({
      next: (r) => {
        this.reporte.set(r);
        this.vista.set('detalle');
      },
      error: (e: ErrorUad) => {
        this.mensajeError.set(mensajeParaReportante(e));
        this.vista.set(e.tipo === 'no-encontrado' ? 'no-encontrado' : 'error');
      }
    });
  }

  protected enviar(evento?: Event): void {
    // Formulario de un solo control, sin `FormGroup`: se atiende el `submit` nativo y se evita la recarga.
    evento?.preventDefault();
    const s = this.solicitud();
    if (!s || !this.puedeResponder() || this.enviando()) return;
    const invalido = validarRespuestaSolicitud(this.respuesta.value);
    if (invalido) {
      this.marcarError(invalido);
      return;
    }
    this.dialogo
      .confirmar({
        titulo: 'Enviar respuesta a la UAD',
        subtitulo: this.codigo,
        mensaje: 'La UAD recibirá su respuesta tal como la escribió. Después de enviarla no podrá editarla.',
        textoConfirmar: 'Sí, enviar',
        iconoConfirmar: 'send',
        textoCancelar: 'Revisar'
      })
      .subscribe({
        next: (ok) => {
          if (!ok || this.enviando()) return;
          this.enviando.set(true);
          this.api.responder(this.codigo, s.solicitudId, this.respuesta.value.trim()).subscribe({
            next: (r) => {
              this.enviando.set(false);
              this.reporte.set(r);
              this.recienRespondida.set(true);
              this.respuesta.reset();
              queueMicrotask(() => this.documento.getElementById('mr-confirmacion')?.focus());
            },
            error: (e: ErrorUad) => this.errorAlResponder(e)
          });
        },
        error: () => undefined
      });
  }

  private errorAlResponder(e: ErrorUad): void {
    this.enviando.set(false);
    const campo = e.camposInvalidos['respuesta'] ?? e.camposInvalidos['evidencias'];
    if (e.tipo === 'validacion' && campo) {
      this.marcarError(campo);
      return;
    }
    this.notificacion.error(mensajeParaReportante(e), e);
    // El reporte cambió en el servidor: se muestra su estado actual sin borrar lo escrito.
    if (e.tipo === 'conflicto') this.refrescarSinPerderTexto();
  }

  private refrescarSinPerderTexto(): void {
    this.api.obtener(this.codigo).subscribe({
      next: (r) => this.reporte.set(r),
      error: () => undefined
    });
  }

  private marcarError(mensaje: string): void {
    this.respuesta.setErrors({ servidor: mensaje });
    this.respuesta.markAsTouched();
    queueMicrotask(() => this.documento.getElementById('mr-respuesta')?.focus());
  }

  protected errorRespuesta(): string | null {
    return (this.respuesta.errors?.['servidor'] as string | undefined) ?? null;
  }
}
