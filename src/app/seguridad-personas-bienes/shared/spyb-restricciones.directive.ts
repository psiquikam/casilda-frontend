import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/** Deja escribir solo dígitos: descarta lo demás al teclear o pegar. */
@Directive({ selector: 'input[appSoloNumeros]', standalone: true })
export class SpybSoloNumerosDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostListener('input')
  alEscribir(): void {
    limpiar(this.el.nativeElement, /\D/g);
  }
}

/** Deja escribir solo letras (con tildes y ñ), espacios y apóstrofe. */
@Directive({ selector: 'input[appSoloLetras]', standalone: true })
export class SpybSoloLetrasDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostListener('input')
  alEscribir(): void {
    limpiar(this.el.nativeElement, /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]/g);
  }
}

function limpiar(input: HTMLInputElement, invalidos: RegExp): void {
  const limpio = input.value.replace(invalidos, '');
  if (limpio === input.value) return;
  input.value = limpio;
  // Avisa al formulario del valor ya depurado.
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
