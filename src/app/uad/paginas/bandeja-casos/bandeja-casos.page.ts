import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { CasoUadResumen, FaseUad } from '../../contratos/uad-api.types';
import { PanelSimulacionComponent } from '../../componentes/panel-simulacion/panel-simulacion.component';
import { ETIQUETA_EQUIPO, ETIQUETA_FASE, ETIQUETA_VINCULACION } from '../../dominio/etiquetas';
import { ErrorUad } from '../../infraestructura/uad-error';
import { UadFacade } from '../../servicios/uad.facade';

const TAMANO_PAGINA = 10;

/**
 * Bandeja de casos UAD — `/uad/casos` (P-UAD-06; UAD-CAS-01 a 03). **Andamiaje de la Entrega 2.**
 *
 * Hoy solo lista (lectura) para comprobar que «Continuar trámite» deja el caso en la bandeja del
 * equipo instructor con su ID y expediente. «Gestionar caso», actuaciones, historial del caso y el
 * traslado instrucción → decisión llegan en la Entrega 2 (contratos ya propuestos en el OpenAPI).
 */
@Component({
  selector: 'app-uad-bandeja-casos-page',
  imports: [DatePipe, FormsModule, RouterLink, MatFormFieldModule, MatIconModule, MatPaginatorModule, MatSelectModule, PanelSimulacionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bandeja">
      <header>
        <h1 class="bandeja__titulo">Bandeja de casos UAD</h1>
        <p class="bandeja__intro">Casos admitidos para trámite. Cada equipo ve los casos de su competencia según la fase actual.</p>
      </header>

      <app-uad-panel-simulacion (equipoCambiado)="cargar()" />

      <div class="casilda-alerta" role="note">
        <mat-icon aria-hidden="true">construction</mat-icon>
        <p>
          Vista de solo lectura. «Gestionar caso», el registro de actuaciones y el paso de instrucción a decisión se habilitan en la siguiente
          entrega.
        </p>
      </div>

      <form class="bandeja__filtros" (ngSubmit)="filtrar()" aria-label="Filtros de la bandeja de casos">
        <mat-form-field appearance="outline">
          <mat-label>Fase actual</mat-label>
          <mat-select [ngModel]="fase()" name="fase" (ngModelChange)="fase.set($event); filtrar()">
            <mat-option value="">Todas</mat-option>
            <mat-option value="INSTRUCCION">Instrucción</mat-option>
            <mat-option value="DECISION">Decisión</mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      @if (cargando()) {
        <p role="status" aria-busy="true" class="bandeja__meta">Cargando casos…</p>
      } @else if (error()) {
        <div class="casilda-alerta casilda-alerta--peligro" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <div>
            <p>{{ error() }}</p>
            <button type="button" class="boton boton--secundario" (click)="cargar()">Intentar de nuevo</button>
          </div>
        </div>
      } @else if (items().length === 0) {
        <p class="bandeja__vacio">No hay casos en su bandeja con este filtro.</p>
      } @else {
        <div class="bandeja__tabla-contenedor">
          <table class="bandeja__tabla" aria-label="Casos UAD">
            <thead>
              <tr>
                <th scope="col">ID de caso Casilda</th>
                <th scope="col">Expediente UAD</th>
                <th scope="col">Víctima</th>
                <th scope="col">Vínculo del investigado con la UdeA</th>
                <th scope="col">Fecha de admisión</th>
                <th scope="col">Fase actual</th>
                <th scope="col">Equipo</th>
                <th scope="col"><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              @for (c of items(); track c.casoUadId) {
                <tr>
                  <th scope="row" class="bandeja__codigo">
                    {{ c.casoId }}
                    <span class="bandeja__sub">{{ c.consecutivosNoticia.join(', ') }}</span>
                  </th>
                  <td>{{ c.expedienteUad ?? 'Sin registrar' }}</td>
                  <td>{{ c.victimaNombre ?? 'Sin dato' }}</td>
                  <td>{{ etiquetaVinculacion[c.vinculacionInvestigado] }}</td>
                  <td>{{ c.fechaAdmision | date: 'd MMM y' }}</td>
                  <td>{{ etiquetaFase[c.faseActual] }}</td>
                  <td>{{ etiquetaEquipo[c.equipoResponsable] }}</td>
                  <td>
                    <button type="button" class="boton boton--secundario boton--compacto" disabled aria-describedby="uad-gestionar-nota">
                      Gestionar caso <span class="visually-hidden">{{ c.casoId }}</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p id="uad-gestionar-nota" class="bandeja__meta">«Gestionar caso» estará disponible en la siguiente entrega.</p>
        <mat-paginator [length]="total()" [pageSize]="tamano" [pageIndex]="pagina()" [hidePageSize]="true" (page)="cambiarPagina($event)" aria-label="Páginas de casos" />
      }

      <a class="boton boton--secundario" routerLink="/uad/noticias">Ir a noticias disciplinarias</a>
    </div>
  `,
  styleUrl: './bandeja-casos.page.scss'
})
export class BandejaCasosPage implements OnInit {
  private readonly facade = inject(UadFacade);
  private readonly notificacion = inject(NotificacionService);

  protected readonly fase = signal<FaseUad | ''>('');
  protected readonly pagina = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<readonly CasoUadResumen[]>([]);
  protected readonly total = signal(0);
  protected readonly tamano = TAMANO_PAGINA;
  protected readonly etiquetaFase = ETIQUETA_FASE;
  protected readonly etiquetaEquipo = ETIQUETA_EQUIPO;
  protected readonly etiquetaVinculacion = ETIQUETA_VINCULACION;

  ngOnInit(): void {
    this.cargar();
  }

  protected filtrar(): void {
    this.pagina.set(0);
    this.cargar();
  }

  protected cambiarPagina(e: PageEvent): void {
    this.pagina.set(e.pageIndex);
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.facade.listarCasos({ fase: this.fase() || null, page: this.pagina(), size: TAMANO_PAGINA }).subscribe({
      next: (p) => {
        this.items.set(p.content);
        this.total.set(p.totalElements);
        this.cargando.set(false);
      },
      error: (e: ErrorUad) => {
        this.cargando.set(false);
        this.error.set(e.tipo === 'sin-permiso' ? 'Su perfil no tiene un equipo UAD asignado o no tiene permiso para esta bandeja.' : 'No pudimos cargar los casos.');
        if (e.tipo !== 'sin-permiso') this.notificacion.error(e.mensaje, e);
      }
    });
  }
}
