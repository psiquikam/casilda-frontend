import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Selector de una imagen con vista previa, arrastrar y soltar, y validación de
 * tipo y peso **antes** de enviar nada al servidor.
 *
 * Es controlado: el padre decide qué se muestra (`imagenUrl`, `nombreArchivo`)
 * y recibe `seleccionar` / `quitar`. Así el padre es dueño del archivo y de la
 * URL temporal (`URL.createObjectURL`) y este componente sirve para cualquier
 * carga de imagen, no solo la de los contenidos del home.
 *
 * Accesibilidad: el disparador es un `<button>` real (el `<input type="file">`
 * queda oculto y fuera del orden de tabulación); arrastrar es un atajo, nunca la
 * única vía (WCAG 2.5.7). Los errores se anuncian con `role="alert"` y quedan
 * asociados al botón con `aria-describedby`.
 */
@Component({
  selector: 'app-selector-imagen',
  imports: [MatIconModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './selector-imagen.component.html',
  styleUrl: './selector-imagen.component.scss'
})
export class SelectorImagenComponent {
  /** `id` del botón principal, destino del salto desde el resumen de errores. */
  readonly idEntrada = input.required<string>();
  /** Imagen a mostrar: la nueva elegida o la que ya tiene el registro. `null` = sin imagen. */
  readonly imagenUrl = input<string | null>(null);
  /** Nombre del archivo recién elegido; `null` si se muestra la imagen guardada. */
  readonly nombreArchivo = input<string | null>(null);
  readonly tiposPermitidos = input.required<readonly string[]>();
  /** Valor del atributo `accept` (`.png,.webp`), para filtrar el diálogo del sistema. */
  readonly extensiones = input.required<string>();
  readonly tamanoMaximoBytes = input.required<number>();
  /** Texto que explica qué pasa si no se sube imagen. */
  readonly ayudaSinImagen = input('');
  /** Error que viene de fuera (p. ej. el servidor rechazó el archivo). */
  readonly errorExterno = input<string | null>(null);

  readonly seleccionar = output<File>();
  readonly quitar = output<void>();

  private readonly entrada = viewChild.required<ElementRef<HTMLInputElement>>('entrada');

  readonly arrastrando = signal(false);
  private readonly errorLocal = signal<string | null>(null);

  readonly error = computed(() => this.errorLocal() ?? this.errorExterno());
  readonly tamanoMaximoKb = computed(() => Math.round(this.tamanoMaximoBytes() / 1024));
  readonly formatos = computed(() =>
    this.extensiones()
      .split(',')
      .map((e) => e.replace('.', '').trim().toUpperCase())
      .join(', ')
  );
  readonly idAyuda = computed(() => `${this.idEntrada()}-ayuda`);
  readonly idError = computed(() => `${this.idEntrada()}-error`);

  abrirSelector(): void {
    this.entrada().nativeElement.click();
  }

  alElegir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    // Se limpia para que elegir de nuevo el mismo archivo vuelva a disparar `change`.
    campo.value = '';
    if (archivo) this.procesar(archivo);
  }

  alArrastrar(evento: DragEvent, encima: boolean): void {
    evento.preventDefault();
    this.arrastrando.set(encima);
  }

  alSoltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(false);
    const archivo = evento.dataTransfer?.files?.[0];
    if (archivo) this.procesar(archivo);
  }

  alQuitar(): void {
    this.errorLocal.set(null);
    this.quitar.emit();
  }

  /** Valida en el cliente con las mismas reglas del servidor y, si pasa, avisa al padre. */
  procesar(archivo: File): void {
    if (!this.tiposPermitidos().includes(archivo.type)) {
      this.errorLocal.set(`El archivo «${archivo.name}» no es una imagen válida. Use ${this.formatos()}.`);
      return;
    }
    if (archivo.size > this.tamanoMaximoBytes()) {
      const kb = Math.ceil(archivo.size / 1024);
      this.errorLocal.set(`La imagen pesa ${kb} KB y el máximo es ${this.tamanoMaximoKb()} KB. Redúzcala e intente de nuevo.`);
      return;
    }
    this.errorLocal.set(null);
    this.seleccionar.emit(archivo);
  }
}
