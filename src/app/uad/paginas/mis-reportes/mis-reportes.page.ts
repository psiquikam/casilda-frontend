import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MiReporteResumen } from '../../contratos/uad-api.types';
import { UadMisReportesPort } from '../../contratos/uad-mis-reportes.port';
import { mensajeParaReportante } from '../../dominio/mis-reportes';
import { ErrorUad } from '../../infraestructura/uad-error';
import { UAD_MIS_REPORTES_SIMULADO } from '../../uad.providers';

export const TAMANO_PAGINA_MIS_REPORTES = 10;

type Vista = 'cargando' | 'lista' | 'vacia' | 'error';

/**
 * «Mis reportes» — `/mis-reportes` (UAD-NOT-02, UAD-EVA-04). Lista los reportes que la persona radicó con
 * su sesión y que llegaron a la UAD. Muestra solo lo que el servidor entrega para ella: código, estado en
 * lenguaje llano y si la UAD le pidió información. Sin relato de hechos, historial ni decisiones internas.
 *
 * El dueño lo filtra el servidor; esta vista no oculta nada por su cuenta.
 */
@Component({
  selector: 'app-uad-mis-reportes-page',
  imports: [DatePipe, RouterLink, MatIconModule, MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mis-reportes.page.html',
  styleUrl: './mis-reportes.page.scss'
})
export class MisReportesPage implements OnInit {
  private readonly api = inject(UadMisReportesPort);
  protected readonly simulado = inject(UAD_MIS_REPORTES_SIMULADO);

  protected readonly vista = signal<Vista>('cargando');
  protected readonly reportes = signal<readonly MiReporteResumen[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly mensajeError = signal('');
  protected readonly tamano = TAMANO_PAGINA_MIS_REPORTES;

  ngOnInit(): void {
    this.cargar();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.cargar();
  }

  protected cargar(): void {
    this.vista.set('cargando');
    this.api.listar(this.pagina(), this.tamano).subscribe({
      next: (p) => {
        this.reportes.set(p.content);
        this.total.set(p.totalElements);
        this.vista.set(p.content.length > 0 ? 'lista' : 'vacia');
      },
      error: (e: ErrorUad) => {
        this.mensajeError.set(mensajeParaReportante(e));
        this.vista.set('error');
      }
    });
  }
}
