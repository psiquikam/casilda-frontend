import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

/**
 * Reseña de Casilda Cundumí Dembelé, la figura que da nombre al sistema. Se abre
 * desde la portada pública. Texto entregado por el equipo de producto.
 */
@Component({
  selector: 'app-quien-era-casilda-dialog',
  imports: [MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="resena__titulo">¿Quién era Casilda Cundumí Dembelé?</h2>
    <mat-dialog-content class="resena">
      <img class="resena__emblema" src="assets/casilda-emblema-morado.svg" alt="" aria-hidden="true"
        width="88" height="80">
      <p>
        <strong>Casilda Cundumí Dembelé</strong> es una figura del folclore literario y la tradición
        oral afrocolombiana, cuya historia se ha convertido en símbolo de resistencia, libertad,
        emancipación y autonomía. Los relatos populares la recuerdan como una mujer cimarrona que,
        tras haber sido esclavizada, habría liderado en 1840 la huida de 45 personas hacia las
        montañas del Valle del Cauca, donde se organizaron para vivir en libertad.
      </p>
      <p>
        Aunque los detalles de su historia no cuentan con suficiente respaldo documental para ser
        considerados hechos históricos verificables, su figura permanece en la memoria colectiva y
        ha inspirado canciones, poemas y relatos que reivindican la resistencia y el liderazgo de
        las comunidades afrodescendientes.
      </p>
      <p>
        En reconocimiento a este legado simbólico, la Universidad de Antioquia adoptó su nombre para
        <strong>CASILDA</strong>, el
        <strong><em>Sistema de Información y Vigilancia en Salud Pública para el abordaje de las
        discriminaciones y las violencias basadas en género,</em></strong>
        como una apuesta institucional por el reconocimiento, la dignidad y la transformación.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" class="boton boton--primario" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .resena__titulo { font-family: var(--font-serif); }
    .resena { color: var(--color-text-primary); line-height: var(--line-height-relaxed); }
    .resena__emblema { display: block; margin: 0 auto var(--space-4); }
    .resena p { margin: 0 0 var(--space-4); max-width: 68ch; }
    .resena p:last-child { margin-bottom: 0; }
  `
})
export class QuienEraCasildaDialogComponent {}
