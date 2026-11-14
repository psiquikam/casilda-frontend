import {
  AtencionAphDto,
  AuditoriaEventoDto,
  ContencionPostCierreDto,
  DerivacionInternaDto,
  RutaExternaDto,
  SlaDto
} from '../shared/types/alma-dto';
import { CasoDto } from '../shared/types/alma-psicologia-dto';
import { ESTADOS_CASO_ACTIVOS, HORAS_LIMITE_PRIMER_CONTACTO, ItemCatalogo, Triaje, formatearNumeroCaso } from '../shared/types/alma.types';
import { CATALOGOS_SEMILLA, PERSONAS_SEMILLA, PersonaSemilla, crearAtencionesSemilla } from './alma-mock-seed';
import {
  CATALOGOS_PSICOLOGIA,
  NovedadMock,
  crearAtencionesSemillaPsicologia,
  crearCasosSemilla,
  crearNovedadesSemilla
} from './psicologia-mock-seed';

/**
 * Store en memoria **compartido** del módulo (H-0.3, plan §3.2). Es un singleton de módulo y no
 * un servicio de Angular para que los manejadores de APH y de Psicología (cada uno en su
 * carpeta) lean y escriban sobre los mismos datos: lo que APH deriva aparece en la bandeja de
 * Psicología sin intervención manual (escenario H-2.2).
 *
 * Núcleo: Hinara. Colecciones de Psicología (`casos`, `novedades`): Jonathan, con sus
 * manejadores en `mocks/psicologia.handlers.ts`. Datos **ficticios**.
 */
export class AlmaMockStore {
  atenciones = new Map<string, AtencionAphDto>();
  derivaciones: DerivacionInternaDto[] = [];
  rutasExternas: RutaExternaDto[] = [];
  contenciones: ContencionPostCierreDto[] = [];
  auditoria = new Map<string, AuditoriaEventoDto[]>();
  personas: PersonaSemilla[] = [];
  catalogos = new Map<string, ItemCatalogo[]>();
  /** Psicología: expedientes por `numeroCaso`. */
  casos = new Map<string, CasoDto>();
  /** Psicología: gestión de cada novedad por `idAtencion` (toma, intentos, recontacto). */
  novedades = new Map<string, NovedadMock>();
  private consecutivoAtencion = 0;
  private consecutivoCaso = 0;
  private consecutivoEvento = 0;
  private consecutivoSecundario = 0;

  constructor() {
    this.reiniciar();
  }

  /** Vuelve al seed del Anexo B. Lo usan las pruebas y el botón de reinicio de desarrollo. */
  reiniciar(): void {
    this.atenciones = new Map();
    this.derivaciones = [];
    this.rutasExternas = [];
    this.contenciones = [];
    this.auditoria = new Map();
    this.personas = PERSONAS_SEMILLA.map((persona) => ({ ...persona }));
    this.catalogos = new Map(Object.entries({ ...CATALOGOS_SEMILLA, ...CATALOGOS_PSICOLOGIA }));
    this.casos = new Map();
    this.novedades = new Map();
    this.consecutivoAtencion = 0;
    this.consecutivoCaso = 0;
    this.consecutivoEvento = 0;
    this.consecutivoSecundario = 0;
    const ahora = this.ahora();
    for (const atencion of [...crearAtencionesSemilla(ahora), ...crearAtencionesSemillaPsicologia(ahora)]) {
      this.atenciones.set(atencion.idAtencion, atencion);
      this.consecutivoAtencion = Math.max(this.consecutivoAtencion, Number(atencion.idAtencion.slice(-6)));
      this.registrarAuditoria('ATENCION_APH', atencion.idAtencion, 'Sistema (semilla)', 'CREACION', 'Atención de prueba creada.');
    }
    for (const caso of crearCasosSemilla(ahora)) {
      this.casos.set(caso.numeroCaso, caso);
      this.consecutivoCaso = Math.max(this.consecutivoCaso, Number(caso.numeroCaso.slice(-6)));
      this.registrarAuditoria('CASO', caso.numeroCaso, 'Sistema (semilla)', 'CREACION', 'Caso de prueba creado.');
    }
    for (const novedad of crearNovedadesSemilla(ahora)) {
      this.novedades.set(novedad.idAtencion, novedad);
    }
  }

  /** «Reloj del servidor» simulado. */
  ahora(): Date {
    return new Date();
  }

  siguienteIdAtencion(): string {
    this.consecutivoAtencion += 1;
    return `ALMA-${this.ahora().getFullYear()}-${String(this.consecutivoAtencion).padStart(6, '0')}`;
  }

  /** `CAS-YYYY-NNNNNN`: nace solo en el primer contacto efectivo (RF-ALMA-001). */
  siguienteNumeroCaso(): string {
    this.consecutivoCaso += 1;
    return formatearNumeroCaso(this.ahora().getFullYear(), this.consecutivoCaso);
  }

  siguienteId(prefijo: string): string {
    this.consecutivoSecundario += 1;
    return `${prefijo}-${String(this.consecutivoSecundario).padStart(4, '0')}`;
  }

  calcularSla(triaje: Triaje, desde: Date): SlaDto {
    const horasLimite = HORAS_LIMITE_PRIMER_CONTACTO[triaje];
    return {
      horasLimite,
      venceEn: new Date(desde.getTime() + horasLimite * 3_600_000).toISOString(),
      ahoraServidor: this.ahora().toISOString()
    };
  }

  registrarAuditoria(
    tipoContexto: string,
    idContexto: string,
    usuario: string,
    accion: AuditoriaEventoDto['accion'],
    detalle: string
  ): void {
    this.consecutivoEvento += 1;
    const clave = `${tipoContexto}:${idContexto}`;
    const evento: AuditoriaEventoDto = {
      idEvento: `EVT-${String(this.consecutivoEvento).padStart(6, '0')}`,
      fechaHora: this.ahora().toISOString(),
      usuario,
      accion,
      detalle
    };
    this.auditoria.set(clave, [...(this.auditoria.get(clave) ?? []), evento]);
  }

  buscarPersona(tipo: string, numero: string): PersonaSemilla | undefined {
    return this.personas.find((p) => p.tipoIdentificacion === tipo && p.numeroIdentificacion === numero);
  }

  /** Gestión de la novedad en Psicología; se crea vacía la primera vez que se consulta. */
  novedadDe(idAtencion: string): NovedadMock {
    let novedad = this.novedades.get(idAtencion);
    if (!novedad) {
      novedad = { idAtencion, tomadaPor: null, tomadaEn: null, intentos: [], recontactoResuelto: null };
      this.novedades.set(idAtencion, novedad);
    }
    return novedad;
  }

  /** Caso activo (no cerrado) de una persona, si existe. */
  casoActivoDe(tipo: string, numero: string): CasoDto | undefined {
    return [...this.casos.values()].find(
      (c) => c.persona.tipoIdentificacion === tipo && c.persona.numeroIdentificacion === numero && ESTADOS_CASO_ACTIVOS.includes(c.estado)
    );
  }

  /**
   * Mantiene coherente la consulta previa de APH (F2): con un caso activo la persona tiene
   * «seguimiento activo» (días hasta el próximo control) y, al cerrarlo, «caso cerrado».
   */
  sincronizarPersonaDesdeCaso(caso: CasoDto): void {
    const { tipoIdentificacion, numeroIdentificacion, nombres, apellidos } = caso.persona;
    let persona = this.buscarPersona(tipoIdentificacion, numeroIdentificacion);
    if (!persona) {
      persona = {
        idPersona: 100 + this.personas.length,
        tipoIdentificacion,
        numeroIdentificacion,
        nombres: nombres ?? '',
        apellidos: apellidos ?? ''
      };
      this.personas.push(persona);
    }
    if (caso.estado === 'CERRADO') {
      persona.seguimientoActivoEnDias = undefined;
      persona.casoCerrado = { numeroCaso: caso.numeroCaso, diasDesdeCierre: 0 };
    } else {
      persona.casoCerrado = undefined;
      persona.seguimientoActivoEnDias = caso.proximoControl
        ? Math.max(0, Math.round((Date.parse(caso.proximoControl) - this.ahora().getTime()) / 86_400_000))
        : 0;
    }
  }
}

/** Instancia compartida por todos los manejadores. */
export const almaMockStore = new AlmaMockStore();
