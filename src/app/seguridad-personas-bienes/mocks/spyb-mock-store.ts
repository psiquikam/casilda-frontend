import {
  ConteosBandejaAnalista,
  IndicadoresSpyb,
  InformeAcompanamiento,
  MedidaProteccionActiva,
  OrdenAcompanamiento,
  RegistroSeguridad,
  RemisionSeguridad,
  RequerimientoUad,
  SolicitudEvidenciaCamara
} from '../models/spyb.models';
import {
  SEED_EVIDENCIAS_CAMARAS,
  SEED_INFORMES_ACOMPANAMIENTO,
  SEED_MEDIDAS_ACTIVAS,
  SEED_ORDENES_ACOMPANAMIENTO,
  SEED_REGISTROS_SEGURIDAD,
  SEED_REMISIONES,
  SEED_REQUERIMIENTOS_UAD,
  SEED_SUGERENCIAS_CASOS
} from './spyb-mock-seed';
import { SugerenciaCasoDto } from '../models/spyb-dtos';

class SpybMockStore {
  private registros: RegistroSeguridad[] = [...SEED_REGISTROS_SEGURIDAD];
  private ordenes: OrdenAcompanamiento[] = [...SEED_ORDENES_ACOMPANAMIENTO];
  private informes: InformeAcompanamiento[] = [...SEED_INFORMES_ACOMPANAMIENTO];
  private evidencias: SolicitudEvidenciaCamara[] = [...SEED_EVIDENCIAS_CAMARAS];
  private remisiones: RemisionSeguridad[] = [...SEED_REMISIONES];
  private requerimientosUad: RequerimientoUad[] = [...SEED_REQUERIMIENTOS_UAD];
  private medidasActivas: Record<string, MedidaProteccionActiva[]> = { ...SEED_MEDIDAS_ACTIVAS };
  private sugerenciasCasos: Record<string, SugerenciaCasoDto[]> = { ...SEED_SUGERENCIAS_CASOS };
  private contadorConsecutivo = 5;

  // --- REGISTROS ---
  getRegistros(): RegistroSeguridad[] {
    return [...this.registros];
  }

  getRegistroPorId(id: number): RegistroSeguridad | undefined {
    return this.registros.find((r) => r.id === id);
  }

  agregarRegistro(item: Omit<RegistroSeguridad, 'id' | 'consecutivo' | 'fechaReporte' | 'estado'>): RegistroSeguridad {
    const id = this.contadorConsecutivo++;
    const consecutivo = `SPB-2026-${String(id).padStart(5, '0')}`;
    const nuevo: RegistroSeguridad = {
      ...item,
      id,
      consecutivo,
      estado: 'NUEVO',
      estadoNombre: 'Nuevo / Sin Gestionar',
      fechaReporte: new Date().toISOString()
    };
    this.registros.unshift(nuevo);
    return nuevo;
  }

  actualizarRegistro(id: number, cambios: Partial<RegistroSeguridad>): RegistroSeguridad | undefined {
    const index = this.registros.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    this.registros[index] = { ...this.registros[index], ...cambios, fechaModificacion: new Date().toISOString() };
    return this.registros[index];
  }

  // --- CONSULTA MEDIDAS ACTIVAS ---
  getMedidasPorDocumento(documento: string): MedidaProteccionActiva[] {
    return this.medidasActivas[documento] ?? [];
  }

  // --- SUGERENCIAS DE CASOS ---
  getSugerenciasCasos(documento: string): SugerenciaCasoDto[] {
    return this.sugerenciasCasos[documento] ?? [];
  }

  // --- ÓRDENES ---
  getOrdenes(): OrdenAcompanamiento[] {
    return [...this.ordenes];
  }

  getOrdenPorToken(token: string): OrdenAcompanamiento | undefined {
    return this.ordenes.find((o) => o.tokenAcceso === token);
  }

  agregarOrden(orden: Omit<OrdenAcompanamiento, 'id' | 'codigoOrden' | 'tokenAcceso' | 'estado' | 'fechaCreacion'>): OrdenAcompanamiento {
    const id = this.ordenes.length + 1;
    const codigoOrden = `ORD-SPB-2026-${String(id).padStart(4, '0')}`;
    const tokenAcceso = `token-orden-${Math.random().toString(36).substring(2, 10)}`;
    const nueva: OrdenAcompanamiento = {
      ...orden,
      id,
      codigoOrden,
      tokenAcceso,
      estado: 'CREADA',
      fechaCreacion: new Date().toISOString()
    };
    this.ordenes.unshift(nueva);
    return nueva;
  }

  actualizarEstadoOrden(codigoOrden: string, estado: OrdenAcompanamiento['estado']): OrdenAcompanamiento | undefined {
    const orden = this.ordenes.find((o) => o.codigoOrden === codigoOrden);
    if (orden) {
      orden.estado = estado;
    }
    return orden;
  }

  // --- INFORMES ---
  agregarInforme(informe: Omit<InformeAcompanamiento, 'id' | 'fechaCreacion'>): InformeAcompanamiento {
    const id = this.informes.length + 1;
    const nuevo: InformeAcompanamiento = {
      ...informe,
      id,
      fechaCreacion: new Date().toISOString()
    };
    this.informes.unshift(nuevo);
    if (informe.codigoOrden) {
      this.actualizarEstadoOrden(informe.codigoOrden, 'FINALIZADA');
    }
    return nuevo;
  }

  // --- CÁMARAS ---
  getEvidencias(): SolicitudEvidenciaCamara[] {
    return [...this.evidencias];
  }

  agregarEvidencia(evidencia: Omit<SolicitudEvidenciaCamara, 'id' | 'codigoSolicitud' | 'estadoGestion' | 'fechaCreacion'>): SolicitudEvidenciaCamara {
    const id = this.evidencias.length + 1;
    const codigoSolicitud = `EVD-SPB-2026-${String(id).padStart(4, '0')}`;
    const nueva: SolicitudEvidenciaCamara = {
      ...evidencia,
      id,
      codigoSolicitud,
      estadoGestion: 'SOLICITADA',
      estadoGestionNombre: 'Solicitud Radicada',
      fechaCreacion: new Date().toISOString()
    };
    this.evidencias.unshift(nueva);
    return nueva;
  }

  actualizarEvidencia(id: number, cambios: Partial<SolicitudEvidenciaCamara>): SolicitudEvidenciaCamara | undefined {
    const index = this.evidencias.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    this.evidencias[index] = { ...this.evidencias[index], ...cambios };
    return this.evidencias[index];
  }

  // --- REMISIONES & UAD ---
  getRemisiones(): RemisionSeguridad[] {
    return [...this.remisiones];
  }

  agregarRemision(rem: Omit<RemisionSeguridad, 'id' | 'fechaRemision' | 'estadoRemision'>): RemisionSeguridad {
    const id = this.remisiones.length + 1;
    const nueva: RemisionSeguridad = {
      ...rem,
      id,
      fechaRemision: new Date().toISOString(),
      estadoRemision: 'ENVIADA'
    };
    this.remisiones.unshift(nueva);
    return nueva;
  }

  actualizarRemision(id: number, cambios: Partial<RemisionSeguridad>): RemisionSeguridad | undefined {
    const index = this.remisiones.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    this.remisiones[index] = { ...this.remisiones[index], ...cambios };
    return this.remisiones[index];
  }

  getRequerimientosUad(): RequerimientoUad[] {
    return [...this.requerimientosUad];
  }

  agregarRequerimientoUad(req: Omit<RequerimientoUad, 'id' | 'fechaRegistro'>): RequerimientoUad {
    const id = this.requerimientosUad.length + 1;
    const nuevo: RequerimientoUad = {
      ...req,
      id,
      fechaRegistro: new Date().toISOString()
    };
    this.requerimientosUad.unshift(nuevo);
    return nuevo;
  }

  // --- CONTEOS BANDEJA ---
  getConteos(): ConteosBandejaAnalista {
    return {
      nuevos: this.registros.filter((r) => r.estado === 'NUEVO').length,
      enRevision: this.registros.filter((r) => r.estado === 'EN_REVISION' || r.estado === 'SUBSANACION_REQUERIDA').length,
      pendienteVinculacion: this.registros.filter((r) => r.estado === 'PENDIENTE_VINCULACION').length,
      acompanamientos: this.ordenes.filter((o) => o.estado !== 'FINALIZADA' && o.estado !== 'CANCELADA').length,
      camaras: this.evidencias.filter((e) => e.estadoGestion !== 'CERRADA').length,
      remisiones: this.remisiones.length,
      uad: this.requerimientosUad.length
    };
  }

  // --- INDICADORES ---
  getIndicadores(): IndicadoresSpyb {
    const totalReg = Math.max(this.registros.length, 35);
    return {
      totalPersonasAtendidas: Math.max(new Set(this.registros.map((r) => r.persona.numeroDocumento)).size, 28),
      totalCasosVinculados: Math.max(new Set(this.registros.filter((r) => r.idCaso).map((r) => r.idCaso)).size, 12),
      totalActuacionesSeguridad: totalReg,
      actuacionesIndependientes: Math.max(this.registros.filter((r) => r.estado === 'ACTUACION_INDEPENDIENTE').length, 15),
      porTipoRegistro: {
        'Novedades de Seguridad': 18,
        'Alertas Tempranas en Campus': 8,
        'Informes de Acompañamiento': 6,
        'PQRS de Convivencia y Seguridad': 3
      },
      porCanalRecepcion: {
        'Teléfono Central (219-64-19)': 15,
        'Rondas y Recorridos de Vigilancia': 11,
        'Atención Presencial en Central': 6,
        'Correo Institucional / Web': 3
      },
      porCampus: {
        'Ciudad Universitaria - Medellín': 24,
        'Ciudadela Robledo': 7,
        'Sedes Regionales': 4
      },
      acompanamientosFormalesVsEspontaneos: {
        formales: 14,
        espontaneos: 10
      },
      camarasCustodiadas: 8,
      remisionesPorDestino: {
        'Equipo de Atención Integral (EA)': 14,
        'Unidad de Asuntos Disciplinarios (UAD)': 9,
        'Línea Alma (APH y Psicología)': 7,
        'Entidades Externas (Fiscalía / Policía)': 3
      }
    };
  }
}

export const spybMockStore = new SpybMockStore();

