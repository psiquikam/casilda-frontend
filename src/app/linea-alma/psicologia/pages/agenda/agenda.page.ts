import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../../../environments/environment';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { AlmaPermisosService } from '../../../shared/permisos/alma-permisos.service';
import { AgendaItemDto, AlcanceAgenda } from '../../../shared/types/alma-psicologia-dto';
import { ETIQUETA_ESTADO_RECORDATORIO } from '../../../shared/types/alma.types';
import { contadorControles } from '../../dominio/seguimientos';
import { CasosAlmaService } from '../../services/casos-alma.service';

const DIA_MS = 86_400_000;

function aFecha(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * «Mi agenda» — `/linea-alma/psicologia/agenda` (sugerencia de J-1.5): controles programados en
 * un rango de fechas. Resuelve la falla de agenda del proceso actual: hoy nadie ve de forma
 * consolidada qué controles vienen. Coordinación y administración pueden ver la de todo el equipo.
 */
@Component({
  selector: 'app-agenda-page',
  imports: [DatePipe, FormsModule, RouterLink, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agenda.page.html',
  styleUrl: './agenda.page.scss'
})
export class AgendaPage implements OnInit {
  private readonly servicio = inject(CasosAlmaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly permisos = inject(AlmaPermisosService);

  protected readonly demo = Object.values(environment.lineaAlma.mocks).some(Boolean);
  protected readonly etiquetaRecordatorio = ETIQUETA_ESTADO_RECORDATORIO;
  protected readonly desde = signal(aFecha(Date.now()));
  protected readonly hasta = signal(aFecha(Date.now() + 14 * DIA_MS));
  protected readonly alcance = signal<AlcanceAgenda>('mios');
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly items = signal<AgendaItemDto[]>([]);
  protected readonly vacio = computed(() => !this.cargando() && !this.error() && this.items().length === 0);
  /** Coordinación y administración (editan en ambos submódulos) ven la agenda de todo el equipo. */
  protected readonly puedeVerTodos = computed(() => this.permisos.tiene('alma.psicologia.editar') && this.permisos.tiene('alma.aph.editar'));
  protected readonly hoy = aFecha(Date.now());

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    if (this.desde() > this.hasta()) {
      this.notificacion.info('La fecha inicial no puede ser posterior a la final.');
      return;
    }
    this.cargando.set(true);
    this.error.set(false);
    this.servicio.agenda(this.desde(), this.hasta(), this.alcance()).subscribe({
      next: (items) => {
        this.items.set(items);
        this.cargando.set(false);
      },
      error: (e: ErrorAlma) => {
        this.error.set(true);
        this.cargando.set(false);
        this.notificacion.error(e.mensaje, e);
      }
    });
  }

  protected controles(item: AgendaItemDto): string {
    return contadorControles(item.numeroSeguimientos).texto;
  }

  protected esHoy(iso: string): boolean {
    return iso.slice(0, 10) === this.hoy;
  }

  protected vencido(iso: string): boolean {
    return Date.parse(iso) < Date.now();
  }
}
