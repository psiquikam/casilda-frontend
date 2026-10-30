import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter, switchMap } from 'rxjs';

import { SECCIONES_CONTENIDO } from '../../core/contenidos/catalogo-contenidos';
import { estadoVigencia, type EstadoVigencia } from '../../core/contenidos/reglas-contenido';
import { DialogoService } from '../../core/a11y/dialogo.service';
import { NotificacionService } from '../../core/a11y/notificacion.service';
import { ContenidoAdminDto, ContenidoAdminService, interpretarErrorContenido } from '../../services/contenido-admin.service';
import { ZonaPanelComponent } from '../dashboard/zona-panel/zona-panel.component';
import { ContenidoItemComponent } from './contenido-item/contenido-item.component';
import { ETIQUETAS_ESTADO } from './estado-vigencia/estado-vigencia.component';

type FiltroEstado = 'todos' | EstadoVigencia;

/** Rótulo de cada filtro, en el orden en que se muestran. */
const FILTROS_ESTADO: Record<EstadoVigencia, string> = {
  vigente: 'Publicados',
  programado: 'Programados',
  vencido: 'Vencidos'
};

interface ContenidoConEstado {
  readonly contenido: ContenidoAdminDto;
  readonly estado: EstadoVigencia;
}

/**
 * Listado del gestor de contenidos del home (`/gestion-contenidos`).
 *
 * Organiza los contenidos **como los ve la portada**: un bloque por sección, en
 * el mismo orden y con los mismos títulos (`SECCIONES_CONTENIDO`), para que
 * quien administra no tenga que traducir entre la tabla y la página pública. El
 * estado (publicado, programado, vencido) se calcula aquí con la misma regla de
 * vigencia que aplica la portada.
 *
 * El catálogo es corto por diseño, así que se trae completo una vez y el filtro
 * por estado es local: cambiar de filtro no hace peticiones.
 */
@Component({
  selector: 'app-gestion-contenidos',
  imports: [RouterLink, MatIconModule, ZonaPanelComponent, ContenidoItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gestion-contenidos.component.html',
  styleUrl: './gestion-contenidos.component.scss'
})
export class GestionContenidosComponent implements OnInit {
  private readonly servicio = inject(ContenidoAdminService);
  private readonly dialogo = inject(DialogoService);
  private readonly notificacion = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cargando = signal(true);
  readonly errorCarga = signal(false);
  readonly filtro = signal<FiltroEstado>('todos');
  /** Id del contenido que se está eliminando, para deshabilitar su botón. */
  readonly eliminandoId = signal<number | null>(null);

  private readonly contenidos = signal<readonly ContenidoAdminDto[]>([]);
  /** Instante de la última carga: el estado se evalúa contra él, no en cada ciclo. */
  private readonly referencia = signal(new Date());

  private readonly conEstado = computed<readonly ContenidoConEstado[]>(() => {
    const referencia = this.referencia();
    return this.contenidos().map((contenido) => ({ contenido, estado: estadoVigencia(contenido, referencia) }));
  });

  readonly total = computed(() => this.contenidos().length);

  readonly filtros = computed(() => {
    const items = this.conEstado();
    const contar = (estado: EstadoVigencia) => items.filter((i) => i.estado === estado).length;
    return [
      { valor: 'todos' as FiltroEstado, texto: 'Todos', icono: 'apps', cantidad: items.length },
      ...(Object.keys(FILTROS_ESTADO) as EstadoVigencia[]).map((estado) => ({
        valor: estado as FiltroEstado,
        texto: FILTROS_ESTADO[estado],
        icono: ETIQUETAS_ESTADO[estado].icono,
        cantidad: contar(estado)
      }))
    ];
  });

  /** Un bloque por sección de la portada, con sus contenidos ya filtrados. */
  readonly secciones = computed(() => {
    const filtro = this.filtro();
    const visibles = this.conEstado().filter((item) => filtro === 'todos' || item.estado === filtro);
    return SECCIONES_CONTENIDO.map((seccion) => ({
      ...seccion,
      items: visibles.filter((item) => item.contenido.seccion === seccion.valor)
    }));
  });

  readonly cantidadVisible = computed(() => this.secciones().reduce((suma, s) => suma + s.items.length, 0));

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.servicio
      .listarTodos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (contenidos) => {
          this.contenidos.set(contenidos);
          this.referencia.set(new Date());
          this.cargando.set(false);
        },
        error: (error) => {
          this.errorCarga.set(true);
          this.cargando.set(false);
          this.notificacion.error(interpretarErrorContenido(error).mensaje, error);
        }
      });
  }

  filtrar(valor: FiltroEstado): void {
    this.filtro.set(valor);
  }

  mensajeVacio(tituloSeccion: string): string {
    return this.filtro() === 'todos'
      ? `Aún no hay tarjetas en «${tituloSeccion}». Esta sección no se mostrará en la portada.`
      : 'Ningún contenido de esta sección coincide con el filtro.';
  }

  eliminar(contenido: ContenidoAdminDto): void {
    this.dialogo
      .confirmar({
        titulo: 'Eliminar contenido',
        subtitulo: 'Dejará de mostrarse en la portada',
        mensaje: `«${contenido.titulo}» se retirará de la portada de inmediato. El registro se conserva por trazabilidad, pero no podrá recuperarlo desde aquí.`
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.eliminandoId.set(contenido.id);
          return this.servicio.eliminar(contenido.id);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          // Se retira localmente: recargar todo el listado solo para quitar una fila es innecesario.
          this.contenidos.update((lista) => lista.filter((c) => c.id !== contenido.id));
          this.eliminandoId.set(null);
          this.notificacion.exito(`Se eliminó «${contenido.titulo}».`);
        },
        error: (error) => {
          this.eliminandoId.set(null);
          const interpretado = interpretarErrorContenido(error);
          this.notificacion.error(interpretado.mensaje, error);
          // Si otra persona ya lo eliminó, el listado está desactualizado.
          if (interpretado.noEncontrado) this.cargar();
        }
      });
  }
}
