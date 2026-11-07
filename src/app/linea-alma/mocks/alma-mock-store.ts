import {
  AtencionAphDto,
  AuditoriaEventoDto,
  ContencionPostCierreDto,
  DerivacionInternaDto,
  RutaExternaDto,
  SlaDto
} from '../shared/types/alma-dto';
import { HORAS_LIMITE_PRIMER_CONTACTO, ItemCatalogo, Triaje } from '../shared/types/alma.types';
import { CATALOGOS_SEMILLA, PERSONAS_SEMILLA, PersonaSemilla, crearAtencionesSemilla } from './alma-mock-seed';

/**
 * Store en memoria **compartido** del módulo (H-0.3, plan §3.2). Es un singleton de módulo y no
 * un servicio de Angular para que los manejadores de APH y de Psicología (cada uno en su
 * carpeta) lean y escriban sobre los mismos datos: lo que APH deriva aparece en la bandeja de
 * Psicología sin intervención manual (escenario H-2.2).
 *
 * Mantiene el núcleo Hinara; Jonathan agrega **sus** colecciones aquí (intentos, casos,
 * seguimientos…) y sus manejadores en `mocks/psicologia.handlers.ts`. Datos **ficticios**.
 */
export class AlmaMockStore {
  atenciones = new Map<string, AtencionAphDto>();
  derivaciones: DerivacionInternaDto[] = [];
  rutasExternas: RutaExternaDto[] = [];
  contenciones: ContencionPostCierreDto[] = [];
  auditoria = new Map<string, AuditoriaEventoDto[]>();
  personas: PersonaSemilla[] = [];
  catalogos = new Map<string, ItemCatalogo[]>();
  private consecutivoAtencion = 0;
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
    this.catalogos = new Map(Object.entries(CATALOGOS_SEMILLA));
    this.consecutivoAtencion = 0;
    this.consecutivoEvento = 0;
    this.consecutivoSecundario = 0;
    for (const atencion of crearAtencionesSemilla(this.ahora())) {
      this.atenciones.set(atencion.idAtencion, atencion);
      this.consecutivoAtencion = Math.max(this.consecutivoAtencion, Number(atencion.idAtencion.slice(-6)));
      this.registrarAuditoria('ATENCION_APH', atencion.idAtencion, 'Sistema (semilla)', 'CREACION', 'Atención de prueba creada.');
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
}

/** Instancia compartida por todos los manejadores. */
export const almaMockStore = new AlmaMockStore();
