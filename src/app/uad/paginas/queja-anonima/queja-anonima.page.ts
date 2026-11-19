import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ErrorFormulario } from '../../../core/a11y/errores-formulario';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { ResumenErroresComponent } from '../../../core/a11y/resumen-errores.component';
import { ConCambiosPendientes } from '../../../core/navegacion/cambios-sin-guardar.guard';
import { RadicacionNdaResponse, VinculacionInvestigado } from '../../contratos/uad-api.types';
import { UadRadicacionPort } from '../../contratos/uad-radicacion.port';
import { ETIQUETA_VINCULACION, VINCULACIONES } from '../../dominio/etiquetas';
import {
  LIMITE_CAMPO_CORTO_NDA,
  LIMITE_RELATO_NDA,
  construirRadicacionNda,
  validarRadicacionNda
} from '../../dominio/radicacion-nda';
import { ErrorUad } from '../../infraestructura/uad-error';
import { UAD_RADICACION_SIMULADA } from '../../uad.providers';

const CAMPOS: Record<string, { id: string; etiqueta: string; control: string }> = {
  descripcionHechos: { id: 'nda-descripcion', etiqueta: 'Descripción de los hechos', control: 'descripcionHechos' },
  lugarOcurrencia: { id: 'nda-lugar', etiqueta: 'Lugar de ocurrencia', control: 'lugarOcurrencia' },
  presuntoResponsable: { id: 'nda-responsable', etiqueta: 'Persona presuntamente responsable', control: 'presuntoResponsable' },
  vinculacionDeclarada: { id: 'nda-vinculacion', etiqueta: 'Vinculación con la UdeA', control: 'vinculacionDeclarada' }
};

/**
 * Queja anónima ante la UAD — `/uad/queja-anonima`, ruta **pública** (P-UAD-02; UAD-FOR-12,
 * UAD-NOT-02/04, UAD-SEG-06).
 *
 * Controles de privacidad que sí dependen del frontend:
 * - No pide nombre, documento ni contacto, y no precarga nada de la sesión aunque exista.
 * - La petición sale sin `Authorization` (`SIN_CREDENCIALES`).
 * - `autocomplete="off"` en todos los campos; nada se guarda en `localStorage`/`sessionStorage`.
 * - El texto **no promete** anonimato técnico absoluto: no ocultar la IP ni los registros del servidor
 *   está fuera del alcance de Angular (D-UAD-02).
 *
 * Tras el envío solo se muestra el consecutivo NDA que asigna el servidor; el formulario se vacía.
 */
@Component({
  selector: 'app-uad-queja-anonima-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, ResumenErroresComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './queja-anonima.page.html',
  styleUrl: './queja-anonima.page.scss'
})
export class QuejaAnonimaPage implements ConCambiosPendientes {
  private readonly radicacion = inject(UadRadicacionPort);
  private readonly notificacion = inject(NotificacionService);
  private readonly documento = inject(DOCUMENT);
  private readonly fb = inject(FormBuilder);
  protected readonly simulada = inject(UAD_RADICACION_SIMULADA);

  protected readonly form = this.fb.nonNullable.group({
    descripcionHechos: [''],
    lugarOcurrencia: [''],
    presuntoResponsable: [''],
    vinculacionDeclarada: ['' as VinculacionInvestigado | '']
  });

  protected readonly enviando = signal(false);
  protected readonly resultado = signal<RadicacionNdaResponse | null>(null);
  protected readonly errores = signal<ErrorFormulario[]>([]);
  protected readonly erroresCampo = signal<Readonly<Record<string, string>>>({});

  protected readonly vinculaciones = VINCULACIONES;
  protected readonly etiquetaVinculacion = ETIQUETA_VINCULACION;
  protected readonly limiteRelato = LIMITE_RELATO_NDA;
  protected readonly limiteCorto = LIMITE_CAMPO_CORTO_NDA;

  tieneCambiosPendientes(): boolean {
    return this.form.dirty && !this.resultado() && !this.enviando();
  }

  protected error(campo: string): string | null {
    return this.erroresCampo()[campo] ?? null;
  }

  protected enviar(): void {
    if (this.enviando()) return;
    const cuerpo = construirRadicacionNda(this.form.getRawValue());
    const errores = validarRadicacionNda(cuerpo);
    if (Object.keys(errores).length > 0) {
      this.mostrarErrores(errores);
      return;
    }
    this.mostrarErrores({});
    this.enviando.set(true);
    this.radicacion.radicarNoticiaAnonima(cuerpo).subscribe({
      next: (r) => {
        this.enviando.set(false);
        this.resultado.set(r);
        // No se conserva nada de lo escrito: ni en pantalla ni en el navegador.
        this.form.reset();
        this.form.markAsPristine();
        queueMicrotask(() => this.documento.getElementById('nda-confirmacion')?.focus());
      },
      error: (e: ErrorUad) => {
        this.enviando.set(false);
        if (e.tipo === 'validacion' && Object.keys(e.camposInvalidos).length > 0) {
          this.mostrarErrores({ ...e.camposInvalidos });
          return;
        }
        const mensaje =
          e.estado === 429 ? 'Recibimos varios envíos seguidos desde esta conexión. Espere unos minutos e intente de nuevo; lo que escribió sigue en pantalla.' : e.mensaje;
        this.notificacion.error(mensaje, e);
      }
    });
  }

  protected copiarConsecutivo(): void {
    const consecutivo = this.resultado()?.consecutivo;
    if (!consecutivo) return;
    const portapapeles = this.documento.defaultView?.navigator.clipboard;
    if (!portapapeles) {
      this.notificacion.info(`Anote el consecutivo: ${consecutivo}`);
      return;
    }
    portapapeles.writeText(consecutivo).then(
      () => this.notificacion.exito('Consecutivo copiado.'),
      () => this.notificacion.info(`No pudimos copiarlo. Anote el consecutivo: ${consecutivo}`)
    );
  }

  protected nuevaQueja(): void {
    this.resultado.set(null);
    queueMicrotask(() => this.documento.getElementById('nda-descripcion')?.focus());
  }

  private mostrarErrores(errores: Record<string, string>): void {
    this.erroresCampo.set(errores);
    const resumen: ErrorFormulario[] = [];
    for (const [campo, mensaje] of Object.entries(errores)) {
      const def = CAMPOS[campo];
      if (!def) continue;
      resumen.push({ id: def.id, etiqueta: def.etiqueta, mensaje });
      const control = this.form.get(def.control);
      control?.setErrors({ servidor: mensaje });
      control?.markAsTouched();
    }
    this.errores.set(resumen);
  }
}
