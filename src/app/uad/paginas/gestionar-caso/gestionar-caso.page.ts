import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DialogoService } from '../../../core/a11y/dialogo.service';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { ConCambiosPendientes } from '../../../core/navegacion/cambios-sin-guardar.guard';
import {
  ActuacionDisponible,
  CasoUadDetalle,
  CodigoActuacion,
  EventoHistorial,
  EvidenciaMetadato,
  MaestroUad,
  ResultadoAccionCaso
} from '../../contratos/uad-api.types';
import { PanelSimulacionComponent } from '../../componentes/panel-simulacion/panel-simulacion.component';
import { LIMITE_EXPEDIENTE_UAD, LIMITE_TEXTO_DECISION, fechaCalendario, fechaContrato, inicioDelDia } from '../../dominio/decision-evaluacion';
import { ETIQUETA_DESTINATARIO, ETIQUETA_EQUIPO, ETIQUETA_ESTADO_NOTIFICACION, ETIQUETA_EVENTO, ETIQUETA_FASE, ETIQUETA_VINCULACION } from '../../dominio/etiquetas';
import { ErrorUad } from '../../infraestructura/uad-error';
import { UadFacade } from '../../servicios/uad.facade';
import { AvisoBandeja } from '../bandeja-noticias/bandeja-noticias.page';

type Vista = 'cargando' | 'listo' | 'error' | 'no-encontrado' | 'sin-permiso';
type Permanente = 'REMISION_COMPETENCIA' | 'FINALIZAR_INSTRUCCION';

/**
 * Gestionar caso disciplinario — `/uad/casos/:casoUadId` (P-UAD-07/08/09; bitácora §7–10, UAD-CAS, UAD-HIS, UAD-PRU).
 *
 * Interfaz **deliberadamente sencilla**: marcar actuaciones del catálogo de la fase, escribir
 * observaciones si se desea y «Guardar actuación» con confirmación. Reglas que la vista respeta:
 * - Las actuaciones ordinarias no cambian la fase (ni «Pliego de cargos» traslada, UAD-CAS-11).
 * - Las acciones permanentes se ven siempre; las pendientes de validación jurídica, deshabilitadas.
 * - Ordinarias y permanentes van en operaciones separadas: nunca se confirman juntas (bitácora §8).
 * - «Finalizar etapa de instrucción» exige confirmación explícita; tras el traslado el caso sale de
 *   esta bandeja y aparece en la del equipo decisor, con su historial intacto (UAD-CAS-08 a 10).
 * - Aquí **no** se muestran «Casos asociados de la persona» (solo en evaluación, UAD-EVA-06).
 * - La carga de pruebas está deshabilitada hasta definir su política (bitácora §10).
 */
@Component({
  selector: 'app-uad-gestionar-caso-page',
  imports: [DatePipe, FormsModule, RouterLink, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, PanelSimulacionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gestionar-caso.page.html',
  styleUrl: './gestionar-caso.page.scss'
})
export class GestionarCasoPage implements OnInit, ConCambiosPendientes {
  private readonly facade = inject(UadFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialogo = inject(DialogoService);
  private readonly notificacion = inject(NotificacionService);
  private readonly documento = inject(DOCUMENT);

  protected readonly casoUadId = this.route.snapshot.paramMap.get('casoUadId') ?? '';
  protected readonly vista = signal<Vista>('cargando');
  protected readonly caso = signal<CasoUadDetalle | null>(null);
  protected readonly catalogo = signal<readonly ActuacionDisponible[]>([]);
  protected readonly historial = signal<readonly EventoHistorial[]>([]);
  protected readonly evidencias = signal<readonly EvidenciaMetadato[]>([]);
  protected readonly entidades = signal<readonly MaestroUad[]>([]);
  protected readonly ocupado = signal(false);
  protected readonly ultimoResultado = signal<ResultadoAccionCaso | null>(null);

  // Formulario de actuaciones ordinarias.
  protected readonly seleccion = signal<ReadonlySet<CodigoActuacion>>(new Set());
  protected readonly observaciones = signal('');
  protected readonly errorActuaciones = signal<string | null>(null);

  // Expediente UAD (UAD-ID-07).
  protected readonly editandoExpediente = signal(false);
  protected readonly expediente = signal('');
  protected readonly errorExpediente = signal<string | null>(null);

  // Acciones permanentes.
  protected readonly permanente = signal<Permanente | null>(null);
  protected readonly entidad = signal('');
  protected readonly fechaRemision = signal<Date | null>(inicioDelDia());
  /** Límite del calendario: la remisión no puede ser futura. */
  protected readonly fechaMaximaRemision = inicioDelDia();
  protected readonly justificacion = signal('');
  protected readonly confirmaTraslado = signal(false);
  protected readonly observacionesTraslado = signal('');
  protected readonly erroresPermanente = signal<Readonly<Record<string, string>>>({});

  protected readonly hoy = fechaCalendario(new Date());
  protected readonly limiteTexto = LIMITE_TEXTO_DECISION;
  protected readonly limiteExpediente = LIMITE_EXPEDIENTE_UAD;
  protected readonly etiquetaEquipo = ETIQUETA_EQUIPO;
  protected readonly etiquetaFase = ETIQUETA_FASE;
  protected readonly etiquetaVinculacion = ETIQUETA_VINCULACION;
  protected readonly etiquetaEvento = ETIQUETA_EVENTO;
  protected readonly etiquetaNotificacion = ETIQUETA_ESTADO_NOTIFICACION;
  protected readonly etiquetaDestinatario = ETIQUETA_DESTINATARIO;

  protected readonly ordinarias = computed(() => this.catalogo().filter((a) => !a.permanente));
  protected readonly permanentes = computed(() => this.catalogo().filter((a) => a.permanente));
  protected readonly activa = computed(() => this.caso()?.estadoGestion === 'ACTIVA');

  ngOnInit(): void {
    this.cargar();
  }

  tieneCambiosPendientes(): boolean {
    if (this.ocupado()) return false;
    return (
      this.seleccion().size > 0 ||
      this.observaciones().trim().length > 0 ||
      this.editandoExpediente() ||
      (this.permanente() !== null && (this.justificacion().trim().length > 0 || this.confirmaTraslado()))
    );
  }

  protected cargar(): void {
    this.vista.set('cargando');
    this.recargar(true);
    this.facade.catalogosEvaluacion().subscribe({
      next: (c) => this.entidades.set(c.entidadesRemision),
      error: (e: ErrorUad) => this.notificacion.error('No pudimos cargar las entidades de remisión. ' + e.mensaje, e)
    });
  }

  /** Lee caso, catálogo, historial y pruebas. No toca lo que la persona escribió. */
  protected recargar(primeraVez = false): void {
    forkJoin({
      caso: this.facade.obtenerCaso(this.casoUadId),
      catalogo: this.facade.catalogoActuaciones(this.casoUadId),
      historial: this.facade.historialCaso(this.casoUadId),
      evidencias: this.facade.evidenciasCaso(this.casoUadId)
    }).subscribe({
      next: (r) => {
        this.caso.set(r.caso);
        this.catalogo.set(r.catalogo);
        this.historial.set(r.historial);
        this.evidencias.set(r.evidencias);
        // Quita de la selección lo que dejó de estar disponible (p. ej. tras un 409).
        const disponibles = new Set(r.catalogo.filter((a) => !a.permanente && a.ejecutable).map((a) => a.codigo));
        this.seleccion.set(new Set([...this.seleccion()].filter((c) => disponibles.has(c))));
        this.vista.set('listo');
      },
      error: (e: ErrorUad) => {
        if (e.tipo === 'no-encontrado') this.vista.set('no-encontrado');
        else if (e.tipo === 'sin-permiso') this.vista.set('sin-permiso');
        else {
          if (primeraVez) this.vista.set('error');
          this.notificacion.error(e.mensaje, e);
        }
      }
    });
  }

  // ------------------------------------------------------------------ actuaciones ordinarias

  protected alternar(codigo: CodigoActuacion, marcada: boolean): void {
    const nueva = new Set(this.seleccion());
    if (marcada) nueva.add(codigo);
    else nueva.delete(codigo);
    this.seleccion.set(nueva);
    this.errorActuaciones.set(null);
  }

  protected limpiarActuaciones(): void {
    this.seleccion.set(new Set());
    this.observaciones.set('');
    this.errorActuaciones.set(null);
  }

  protected guardarActuacion(): void {
    const caso = this.caso();
    if (!caso || this.ocupado()) return;
    const codigos = this.ordinarias()
      .filter((a) => this.seleccion().has(a.codigo))
      .map((a) => a.codigo);
    if (codigos.length === 0) {
      this.errorActuaciones.set('Marque al menos una actuación.');
      this.documento.getElementById('uad-actuaciones')?.focus();
      return;
    }
    if (this.observaciones().length > LIMITE_TEXTO_DECISION) {
      this.errorActuaciones.set(`Las observaciones admiten máximo ${LIMITE_TEXTO_DECISION} caracteres.`);
      return;
    }
    const nombres = this.ordinarias()
      .filter((a) => codigos.includes(a.codigo))
      .map((a) => a.nombre)
      .join(', ');
    this.dialogo
      .confirmar({
        titulo: 'Guardar actuación',
        subtitulo: `${caso.casoId} · ${ETIQUETA_FASE[caso.faseActual]}`,
        mensaje: `Se registrará en el historial: ${nombres}. Queda guardado con fecha, hora, profesional y equipo, y no se sobrescribe. La fase del caso no cambia.`,
        textoConfirmar: 'Guardar actuación',
        iconoConfirmar: 'save',
        textoCancelar: 'Revisar'
      })
      .subscribe({
        next: (ok) => {
          if (!ok || this.ocupado()) return;
          this.ocupado.set(true);
          const observaciones = this.observaciones().trim() || null;
          this.facade.registrarActuaciones(caso, codigos, observaciones).subscribe({
            next: (r) => {
              this.ocupado.set(false);
              this.ultimoResultado.set(r);
              this.limpiarActuaciones();
              this.aplicarResultado(r);
              this.notificacion.exito(codigos.length === 1 ? 'Actuación guardada.' : 'Actuaciones guardadas.');
            },
            error: (e: ErrorUad) => this.errorDeAccion(e, (m) => this.errorActuaciones.set(m))
          });
        },
        error: () => undefined
      });
  }

  // ------------------------------------------------------------------ expediente UAD

  protected editarExpediente(): void {
    this.expediente.set(this.caso()?.expedienteUad ?? '');
    this.errorExpediente.set(null);
    this.editandoExpediente.set(true);
    queueMicrotask(() => this.documento.getElementById('uad-expediente-caso')?.focus());
  }

  protected cancelarExpediente(): void {
    this.editandoExpediente.set(false);
    this.errorExpediente.set(null);
  }

  protected guardarExpediente(): void {
    const caso = this.caso();
    if (!caso || this.ocupado()) return;
    const valor = this.expediente().trim() || null;
    if ((valor ?? '').length > LIMITE_EXPEDIENTE_UAD) {
      this.errorExpediente.set(`Máximo ${LIMITE_EXPEDIENTE_UAD} caracteres.`);
      return;
    }
    if (valor === caso.expedienteUad) {
      this.editandoExpediente.set(false);
      return;
    }
    this.ocupado.set(true);
    this.facade.registrarExpediente(caso, valor).subscribe({
      next: (r) => {
        this.ocupado.set(false);
        this.editandoExpediente.set(false);
        this.aplicarResultado(r);
        this.notificacion.exito(valor ? 'Expediente UAD registrado.' : 'Expediente UAD retirado.');
      },
      error: (e: ErrorUad) => this.errorDeAccion(e, (m) => this.errorExpediente.set(m), 'expedienteUad')
    });
  }

  // ------------------------------------------------------------------ acciones permanentes

  protected abrirPermanente(a: ActuacionDisponible): void {
    if (!a.ejecutable || (a.codigo !== 'REMISION_COMPETENCIA' && a.codigo !== 'FINALIZAR_INSTRUCCION')) return;
    this.permanente.set(this.permanente() === a.codigo ? null : a.codigo);
    this.erroresPermanente.set({});
    queueMicrotask(() => this.documento.getElementById('uad-panel-permanente')?.focus());
  }

  protected cerrarPermanente(): void {
    this.permanente.set(null);
    this.erroresPermanente.set({});
    this.justificacion.set('');
    this.confirmaTraslado.set(false);
    this.observacionesTraslado.set('');
  }

  protected finalizarInstruccion(): void {
    const caso = this.caso();
    if (!caso || this.ocupado()) return;
    if (!this.confirmaTraslado()) {
      this.erroresPermanente.set({ confirmaTraslado: 'Confirme expresamente que corresponde pasar a la etapa de decisión.' });
      this.documento.getElementById('uad-confirma-traslado')?.focus();
      return;
    }
    this.dialogo
      .confirmar({
        titulo: 'Finalizar etapa de instrucción',
        subtitulo: caso.casoId,
        mensaje: `El caso pasará a la etapa de decisión con ${ETIQUETA_EQUIPO[caso.equipoDecisor]} y saldrá de la bandeja de ${ETIQUETA_EQUIPO[caso.equipoInstructor]}. Se conservan el ID de caso, el expediente, la fecha de admisión, las pruebas y todo el historial.`,
        textoConfirmar: 'Sí, trasladar a decisión',
        iconoConfirmar: 'move_up',
        textoCancelar: 'Seguir en instrucción'
      })
      .subscribe({
        next: (ok) => {
          if (!ok || this.ocupado()) return;
          this.ocupado.set(true);
          this.facade.finalizarInstruccion(caso, this.observacionesTraslado().trim() || null).subscribe({
            next: (r) => {
              this.ocupado.set(false);
              this.cerrarPermanente();
              if (!r.visibleParaUsuario || !r.caso) {
                const aviso: AvisoBandeja = {
                  aviso: `El caso ${caso.casoId} pasó a la etapa de decisión con ${ETIQUETA_EQUIPO[caso.equipoDecisor]}. Ya no aparece en su bandeja activa.`
                };
                void this.router.navigate(['/uad/casos'], { state: aviso });
                return;
              }
              this.ultimoResultado.set(r);
              this.aplicarResultado(r);
              this.notificacion.exito('El caso pasó a la etapa de decisión.');
            },
            error: (e: ErrorUad) => this.errorDeAccion(e, () => undefined)
          });
        },
        error: () => undefined
      });
  }

  protected remitirPorCompetencia(): void {
    const caso = this.caso();
    if (!caso || this.ocupado()) return;
    const errores: Record<string, string> = {};
    if (!this.entidad()) errores['entidadDestinatariaCodigo'] = 'Seleccione la entidad destinataria.';
    const fechaRemision = fechaContrato(this.fechaRemision());
    if (!fechaRemision) errores['fechaRemision'] = 'Indique la fecha de remisión.';
    else if (fechaRemision > this.hoy) errores['fechaRemision'] = 'La fecha de remisión no puede ser futura.';
    if (this.justificacion().length > LIMITE_TEXTO_DECISION) errores['justificacion'] = `Máximo ${LIMITE_TEXTO_DECISION} caracteres.`;
    if (!fechaRemision || Object.keys(errores).length > 0) {
      this.erroresPermanente.set(errores);
      return;
    }
    const nombreEntidad = UadFacade.nombreDe(this.entidades(), this.entidad());
    this.dialogo
      .confirmar({
        titulo: 'Registrar remisión por competencia',
        subtitulo: caso.casoId,
        mensaje: `Entidad: ${nombreEntidad}. Casilda solo deja constancia: no envía correos ni documentos a esa entidad. La gestión de la UAD terminará; el caso institucional sigue activo para los demás actores.`,
        textoConfirmar: 'Sí, registrar remisión',
        iconoConfirmar: 'forward_to_inbox',
        textoCancelar: 'Revisar'
      })
      .subscribe({
        next: (ok) => {
          if (!ok || this.ocupado()) return;
          this.ocupado.set(true);
          this.facade
            .remitirCasoPorCompetencia(caso, {
              entidadDestinatariaCodigo: this.entidad(),
              fechaRemision,
              justificacion: this.justificacion().trim() || null
            })
            .subscribe({
              next: (r) => {
                this.ocupado.set(false);
                this.cerrarPermanente();
                this.ultimoResultado.set(r);
                this.aplicarResultado(r);
                this.notificacion.exito('Remisión por competencia registrada.');
              },
              error: (e: ErrorUad) => this.errorDeAccion(e, () => undefined)
            });
        },
        error: () => undefined
      });
  }

  // ------------------------------------------------------------------ comunes

  protected descargar(e: EvidenciaMetadato): void {
    this.facade.descargarEvidencia(e.evidenciaId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const enlace = this.documento.createElement('a');
        enlace.href = url;
        enlace.download = blob.type === 'text/plain' && !e.nombreArchivo.endsWith('.txt') ? `${e.nombreArchivo}.txt` : e.nombreArchivo;
        enlace.click();
        URL.revokeObjectURL(url);
        this.recargar();
      },
      error: (err: ErrorUad) => this.notificacion.error(err.mensaje, err)
    });
  }

  protected tamano(bytes: number | null): string {
    if (bytes === null) return 'Sin dato';
    return bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  private aplicarResultado(r: ResultadoAccionCaso): void {
    if (r.caso) this.caso.set(r.caso);
    this.recargar();
  }

  private errorDeAccion(e: ErrorUad, mostrar: (mensaje: string) => void, campo?: string): void {
    this.ocupado.set(false);
    if (e.tipo === 'validacion') {
      const campos = e.camposInvalidos;
      if (campo && campos[campo]) mostrar(campos[campo]);
      else if (Object.keys(campos).length > 0) {
        this.erroresPermanente.set({ ...campos });
        mostrar(Object.values(campos)[0]);
      } else mostrar(e.mensaje);
      return;
    }
    this.notificacion.error(e.mensaje, e);
    // 409/404: lo leído ya no es vigente. Se recarga sin borrar lo escrito; nunca se reintenta solo.
    if (e.tipo === 'conflicto' || e.tipo === 'no-encontrado') this.recargar();
  }
}
