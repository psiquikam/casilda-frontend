import { Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import type {
  CasoDto,
  CitaDto,
  CancelarCitaRequestDto,
  ContactoTelefonicoDto,
  ContactoTelefonicoRequestDto,
  PagedResponseDto,
  ResultadoCitaDto,
  ReprogramarCitaRequestDto,
  SolicitudAcompanamientoResponse
} from './solicitud.service';
import { EstadoCitaEnum } from './solicitud.service';
import type { MaestroDto } from './listas.service';
import {
  aCasoDto,
  aCitaDto,
  paginar,
  type CasoSimuladoConCaso,
  type CasoSimuladoVbg
} from '../core/vbg/caso-simulado.model';
import { respuestaSimulada } from './dashboard-mock';

/**
 * Almacén simulado único del módulo Equipo de Atención, en memoria.
 *
 * Alimenta: la lista de citas y de casos de `registro-caso`/`registro-atencion`
 * en modo de demostración, los widgets del panel del personal que dependen de
 * casos concretos (agenda, compromisos, pendientes, última profesional
 * activa) y `MiProcesoService` de la vista del rol Usuario — para que el
 * mismo caso de demostración se vea igual en todas las pantallas.
 *
 * Cada registro representa una cita. Las citas de seguimiento conservan el
 * mismo ID de caso y guardan su atención en el registro propio de esa cita.
 * Los datos ficticios viven solo en memoria y se reinician al recargar.
 */
@Injectable({ providedIn: 'root' })
export class CasosSimuladosService {
  private readonly casos = signal<CasoSimuladoVbg[]>(this.semilla());
  private readonly contactosPorSolicitud = new Map<number, ContactoTelefonicoDto[]>();

  listarSolicitudesAsignadas(): SolicitudAcompanamientoResponse[] {
    const solicitudes = new Map<number, SolicitudAcompanamientoResponse>();
    for (const caso of this.casos()) {
      solicitudes.set(caso.solicitudId, { ...caso.solicitud });
    }
    return [...solicitudes.values()];
  }

  listarCitasDeCaso(casoId: number): CitaDto[] {
    return this.casos()
      .filter((cita) => cita.id === casoId)
      .map(aCitaDto);
  }

  obtenerUltimaCitaSolicitud(solicitudId: number): CitaDto | undefined {
    return this.casos()
      .filter((cita) => cita.solicitudId === solicitudId)
      .map(aCitaDto)
      .sort((a, b) => b.fechaCita.localeCompare(a.fechaCita) || b.id - a.id)[0];
  }

  tieneCitaProgramada(solicitudId: number): boolean {
    return this.casos().some((cita) => cita.solicitudId === solicitudId &&
      [EstadoCitaEnum.PROGRAMADA, EstadoCitaEnum.REPROGRAMADA].includes(cita.idEstadoCita));
  }

  tieneSolicitud(solicitudId: number): boolean {
    return this.casos().some((caso) => caso.solicitudId === solicitudId);
  }

  tieneCaso(casoId: number): boolean {
    return this.casos().some((caso) => caso.id === casoId);
  }

  tieneCita(citaId: number): boolean {
    return this.casos().some((caso) => caso.citaId === citaId);
  }

  listarContactosSolicitud(solicitudId: number): ContactoTelefonicoDto[] {
    return [...(this.contactosPorSolicitud.get(solicitudId) ?? [])];
  }

  registrarContactoSolicitud(
    solicitudId: number,
    datos: ContactoTelefonicoRequestDto
  ): ContactoTelefonicoDto {
    const citaProgramada = datos.fechaCita && datos.horaCita
      ? this.crearCitaDesdeContacto(solicitudId, datos.fechaCita, datos.horaCita)
      : undefined;
    const contacto: ContactoTelefonicoDto = {
      ...datos,
      jornada: this.jornadaDesdeFecha(datos.fecha),
      citaCreada: Boolean(citaProgramada),
      fechaCita: datos.fechaCita,
      horaCita: datos.horaCita
    };
    const actuales = this.contactosPorSolicitud.get(solicitudId) ?? [];
    this.contactosPorSolicitud.set(solicitudId, [...actuales, contacto]);
    if (citaProgramada) {
      this.casos.set([...this.casos(), citaProgramada]);
    }
    return contacto;
  }

  listarCitas(
    page: number,
    size: number,
    idEstadoCita?: number,
    excluirEstadoCitaId?: number
  ): Observable<PagedResponseDto<CitaDto>> {
    const citas = this.casos()
      .map(aCitaDto)
      .filter((cita) => idEstadoCita == null || cita.idEstadoCita === idEstadoCita)
      .filter((cita) => excluirEstadoCitaId == null || cita.idEstadoCita !== excluirEstadoCitaId);
    return respuestaSimulada(paginar(citas, page, size));
  }

  listarCitasPendientesDeCaso(page: number, size: number): Observable<PagedResponseDto<CitaDto>> {
    const solicitudesConCaso = new Set(
      this.casos().filter((caso) => caso.id !== null && caso.codigo.trim()).map((caso) => caso.solicitudId)
    );
    const citas = this.casos()
      .filter((caso) => caso.idEstadoCita === EstadoCitaEnum.ATENDIDA)
      .filter((caso) => !solicitudesConCaso.has(caso.solicitudId))
      .map(aCitaDto);
    return respuestaSimulada(paginar(citas, page, size));
  }

  listarCasos(page: number, size: number): Observable<PagedResponseDto<CasoDto>> {
    const casosConId = this.casos().filter(
      (caso): caso is CasoSimuladoConCaso =>
        caso.id !== null && Boolean(caso.codigo.trim()) && caso.tipoAtencion === 'INICIAL'
    );
    const casosPorId = new Map<number, CasoSimuladoConCaso>();
    for (const caso of casosConId) {
      casosPorId.set(caso.id, caso);
    }
    const casos = [...casosPorId.values()].map((caso) => ({
      ...aCasoDto(caso),
      cantidadAtenciones: this.casos().filter((cita) => cita.id === caso.id && cita.atencionId != null).length
    }));
    return respuestaSimulada(paginar(casos, page, size));
  }

  programarCitaSeguimiento(
    casoId: number,
    fechaCita: string,
    horaCita: string
  ): Observable<CitaDto> {
    const caso = this.casos().find((registro) => registro.id === casoId && Boolean(registro.codigo));
    if (!caso) {
      return throwError(() => new Error(`No existe el caso simulado ${casoId}.`));
    }

    const nuevaCita = this.crearCitaDesdeContacto(caso.solicitudId, fechaCita, horaCita, 'SEGUIMIENTO', casoId);
    this.casos.set([...this.casos(), nuevaCita]);
    return respuestaSimulada(aCitaDto(nuevaCita));
  }

  obtenerSolicitud(solicitudId: number): Observable<SolicitudAcompanamientoResponse> {
    const caso = this.casos().find((c) => c.solicitudId === solicitudId);
    if (!caso) {
      return throwError(() => new Error(`No existe la solicitud simulada ${solicitudId}.`));
    }
    return respuestaSimulada(caso.solicitud);
  }

  registrarResultadoCita(citaId: number, resultado: ResultadoCitaDto): Observable<CitaDto> {
    const cita = this.casos().find((caso) => caso.citaId === citaId);
    if (!cita) {
      return throwError(() => new Error(`No existe la cita simulada ${citaId}.`));
    }
    if (cita.idEstadoCita !== EstadoCitaEnum.PROGRAMADA && cita.idEstadoCita !== EstadoCitaEnum.REPROGRAMADA) {
      return throwError(() => new Error('Esta cita ya tiene un resultado registrado.'));
    }
    if (new Date(cita.fechaCita).getTime() > Date.now()) {
      return throwError(() => new Error('El resultado solo se puede registrar después de la fecha de la cita.'));
    }

    const atendida = resultado === 'ATENDIDA';
    const actualizado = {
      ...cita,
      idEstadoCita: atendida ? EstadoCitaEnum.ATENDIDA : EstadoCitaEnum.INASISTENCIA,
      estadoCita: atendida ? 'Atendida' : 'Inasistencia'
    };
    this.casos.set(this.casos().map((caso) => caso.citaId === citaId ? actualizado : caso));
    return respuestaSimulada(aCitaDto(actualizado));
  }

  reprogramarCita(citaId: number, request: ReprogramarCitaRequestDto): Observable<CitaDto> {
    const cita = this.casos().find((caso) => caso.citaId === citaId);
    if (!cita) {
      return throwError(() => new Error(`No existe la cita simulada ${citaId}.`));
    }
    if (cita.idEstadoCita === EstadoCitaEnum.CANCELADA
      || cita.idEstadoCita === EstadoCitaEnum.ATENDIDA
      || cita.idEstadoCita === EstadoCitaEnum.INASISTENCIA) {
      return throwError(() => new Error('No se puede reprogramar una cita finalizada.'));
    }

    const fechaCita = new Date(`${request.fechaCita}T${request.horaCita}:00`).toISOString();
    const actualizado = {
      ...cita,
      fechaCita,
      idEstadoCita: EstadoCitaEnum.REPROGRAMADA,
      estadoCita: 'Reprogramada',
      motivoEstadoCita: request.idMotivoEstadoCita == null
        ? undefined
        : this.obtenerMotivoEstadoCita(request.idMotivoEstadoCita),
      observaciones: request.observaciones
    };
    this.casos.set(this.casos().map((caso) => caso.citaId === citaId ? actualizado : caso));
    return respuestaSimulada(aCitaDto(actualizado));
  }

  cancelarCita(citaId: number, request: CancelarCitaRequestDto): Observable<CitaDto> {
    const cita = this.casos().find((caso) => caso.citaId === citaId);
    if (!cita) {
      return throwError(() => new Error(`No existe la cita simulada ${citaId}.`));
    }
    if (cita.idEstadoCita === EstadoCitaEnum.CANCELADA
      || cita.idEstadoCita === EstadoCitaEnum.ATENDIDA
      || cita.idEstadoCita === EstadoCitaEnum.INASISTENCIA) {
      return throwError(() => new Error('No se puede cancelar una cita finalizada.'));
    }

    const actualizado = {
      ...cita,
      idEstadoCita: EstadoCitaEnum.CANCELADA,
      estadoCita: 'Cancelada',
      motivoEstadoCita: this.obtenerMotivoEstadoCita(request.idMotivoEstadoCita),
      observaciones: request.observaciones
    };
    this.casos.set(this.casos().map((caso) => caso.citaId === citaId ? actualizado : caso));
    return respuestaSimulada(aCitaDto(actualizado));
  }

  listarMotivosEstadoCita(): Observable<MaestroDto[]> {
    return respuestaSimulada(this.motivosEstadoCita.map((motivo) => ({ ...motivo })));
  }

  /**
   * Guarda el payload crudo de una pestaña del formulario. No lo interpreta:
   * cada sección añade su propia semántica en su subfase (ver
   * `CasoSimuladoVbg.pestanas`).
   */
  guardarPestana(
    casoId: number | null,
    tabIndex: number,
    datos: unknown,
    citaId?: number
  ): Observable<{ id: number; codigo: string }> {
    const lista = this.casos();
    const casoExistente = casoId == null
      ? undefined
      : lista.find((caso) => caso.id === casoId && caso.tipoAtencion === 'INICIAL' && Boolean(caso.codigo.trim()));
    if (casoId != null && !casoExistente) {
      return throwError(() => new Error(`No existe el caso simulado ${casoId}.`));
    }

    if (tabIndex === 0 && citaId == null) {
      return throwError(() => new Error('El registro de atención requiere la cita asociada.'));
    }

    if (casoId == null && (tabIndex !== 0 || citaId == null)) {
      return throwError(() => new Error('La primera pestaña requiere una cita atendida para crear el caso.'));
    }

    const citaSeleccionada = citaId == null
      ? casoExistente
      : lista.find((cita) => cita.citaId === citaId);
    if (!citaSeleccionada) {
      return throwError(() => new Error(`No existe la cita simulada ${citaId}.`));
    }
    if (casoId != null && citaSeleccionada.id !== casoId) {
      return throwError(() => new Error('La cita seleccionada no pertenece al caso indicado.'));
    }
    if (tabIndex === 0 && citaSeleccionada.idEstadoCita !== EstadoCitaEnum.ATENDIDA) {
      return throwError(() => new Error('Solo se puede registrar una atención después de marcar la cita como atendida.'));
    }
    if (casoId == null && (citaSeleccionada.tipoAtencion !== 'INICIAL' || citaSeleccionada.id !== null)) {
      return throwError(() => new Error('Solo se puede crear un caso después de registrar la cita como atendida.'));
    }

    const id = casoExistente?.id ?? Math.max(9000, ...lista.map((caso) => caso.id ?? 0)) + 1;
    const codigo = casoExistente?.codigo || this.generarCodigoCaso(lista);
    const nuevaAtencion = tabIndex === 0 && citaSeleccionada.atencionId == null
      ? Math.max(9100, ...lista.map((caso) => caso.atencionId ?? 0)) + 1
      : citaSeleccionada.atencionId;
    const destino: CasoSimuladoVbg = {
      ...citaSeleccionada,
      id,
      codigo,
      fechaCaso: casoExistente?.fechaCaso ?? new Date().toISOString(),
      estadoCaso: 'Abierto',
      atencionId: nuevaAtencion,
      pestanas: { ...citaSeleccionada.pestanas, [tabIndex]: datos }
    };
    this.casos.set(lista.map((caso) => {
      if (caso.citaId === destino.citaId) {
        return destino;
      }
      if (casoId == null && caso.solicitudId === destino.solicitudId) {
        return {
          ...caso,
          id,
          codigo,
          estadoCaso: 'Abierto'
        };
      }
      return caso;
    }));

    return respuestaSimulada({ id: tabIndex === 0 ? id : nuevaAtencion ?? id, codigo });
  }

  private generarCodigoCaso(casos: readonly CasoSimuladoVbg[]): string {
    let secuencia = casos.filter((caso) => Boolean(caso.codigo.trim())).length + 1;
    let codigo = `CAS-DEMO-${String(secuencia).padStart(4, '0')}`;
    while (casos.some((caso) => caso.codigo === codigo)) {
      codigo = `CAS-DEMO-${String(++secuencia).padStart(4, '0')}`;
    }
    return codigo;
  }

  private crearCitaDesdeContacto(
    solicitudId: number,
    fechaCita: string,
    horaCita: string,
    tipoAtencion: 'INICIAL' | 'SEGUIMIENTO' = 'INICIAL',
    casoId?: number
  ): CasoSimuladoVbg {
    const solicitud = this.casos().find((caso) => caso.solicitudId === solicitudId);
    if (!solicitud) {
      throw new Error(`No existe la solicitud simulada ${solicitudId}.`);
    }

    const fecha = new Date(`${fechaCita}T${horaCita}:00`);
    if (Number.isNaN(fecha.getTime())) {
      throw new Error('La fecha y hora de la cita simulada no son válidas.');
    }

    const fechaIso = fecha.toISOString();
    const citaId = Math.max(9000, ...this.casos().map((caso) => caso.citaId)) + 1;
    return {
      ...solicitud,
      id: casoId ?? solicitud.id,
      codigo: casoId == null ? '' : solicitud.codigo,
      citaId,
      tipoAtencion,
      atencionId: undefined,
      idEstadoCita: EstadoCitaEnum.PROGRAMADA,
      estadoCita: 'Programada',
      motivoEstadoCita: undefined,
      observaciones: undefined,
      estadoCaso: solicitud.id === null ? 'Pendiente de primera atención' : solicitud.estadoCaso,
      fechaCita: fechaIso,
      fechaCaso: fechaIso,
      pestanas: {}
    };
  }

  private obtenerMotivoEstadoCita(id: number): string | undefined {
    return this.motivosEstadoCita.find((motivo) => motivo.id === id)?.nombre;
  }

  private readonly motivosEstadoCita: MaestroDto[] = [
    { id: 1, nombre: 'Inasistencia injustificada' },
    { id: 2, nombre: 'Cambio de agenda del equipo profesional' },
    { id: 3, nombre: 'Circunstancias externas' },
    { id: 4, nombre: 'Solicitud de la persona atendida' },
    { id: 5, nombre: 'No aplica' }
  ];

  private semilla(): CasoSimuladoVbg[] {
    return [
      this.crearCaso({
        id: 9001,
        codigo: 'CAS-DEMO-0001',
        solicitudId: 9001,
        citaId: 9001,
        tipoAtencion: 'INICIAL',
        atencionId: 9101,
        idEstadoCita: EstadoCitaEnum.ATENDIDA,
        estadoCita: 'Atendida',
        diasCita: 0,
        nombre: ['Persona', 'Demostración', 'Uno', ''],
        documento: 'DEMO-0000001',
        profesional: 'Lic. Carlos Restrepo (Profesional Psicosocial)',
        unidadAcademica: 'Facultad de Ingeniería',
        campus: 'Medellín - Ciudad Universitaria',
        identidadGenero: 'Mujer (Cisgénero / Trans)',
        grupoAtencion: 'Grupo 2'
      }),
      this.crearCaso({
        id: 9002,
        codigo: 'CAS-DEMO-0002',
        solicitudId: 9002,
        citaId: 9002,
        tipoAtencion: 'INICIAL',
        atencionId: 9102,
        idEstadoCita: EstadoCitaEnum.ATENDIDA,
        estadoCita: 'Atendida',
        diasCita: 1,
        nombre: ['Persona', '', 'Demostración', 'Dos'],
        documento: 'DEMO-0000002',
        profesional: 'Lic. Carlos Restrepo (Profesional Psicosocial)',
        unidadAcademica: 'Facultad de Educación',
        campus: 'Seccional Oriente',
        identidadGenero: 'Persona no binaria',
        grupoAtencion: null
      }),
      this.crearCaso({
        id: 9003,
        codigo: 'CAS-DEMO-0003',
        solicitudId: 9003,
        citaId: 9003,
        tipoAtencion: 'INICIAL',
        atencionId: 9103,
        idEstadoCita: EstadoCitaEnum.ATENDIDA,
        estadoCita: 'Atendida',
        diasCita: -2,
        nombre: ['Persona', 'Demostración', 'Tres', ''],
        documento: 'DEMO-0000003',
        profesional: 'Dra. Elena Ramos (Coordinadora)',
        unidadAcademica: 'Facultad de Medicina',
        campus: 'Medellín - Ciudad Universitaria',
        identidadGenero: 'Hombre (Cisgénero / Trans)',
        grupoAtencion: 'Grupo 5'
      }),
      this.crearCaso({
        id: null,
        codigo: '',
        solicitudId: 9004,
        citaId: 9004,
        tipoAtencion: 'INICIAL',
        idEstadoCita: EstadoCitaEnum.PROGRAMADA,
        estadoCita: 'Programada',
        diasCita: -1,
        nombre: ['Persona', 'Demostración', 'Cuatro', ''],
        documento: 'DEMO-0000004',
        profesional: 'Lic. Carlos Restrepo (Profesional Psicosocial)',
        unidadAcademica: 'Facultad de Ciencias Sociales',
        campus: 'Medellín - Ciudad Universitaria',
        identidadGenero: 'Mujer (Cisgénero / Trans)',
        grupoAtencion: null
      })
    ];
  }

  private jornadaDesdeFecha(fecha: string): string {
    const hora = Number(fecha.match(/T(\d{2})/)?.[1] ?? 0);
    return hora < 12 ? 'Mañana' : 'Tarde';
  }

  private crearCaso(datos: {
    id: number | null;
    codigo: string;
    solicitudId: number;
    citaId: number;
    tipoAtencion: 'INICIAL' | 'SEGUIMIENTO';
    atencionId?: number;
    idEstadoCita: number;
    estadoCita: string;
    diasCita: number;
    nombre: [string, string, string, string];
    documento: string;
    profesional: string;
    unidadAcademica: string;
    campus: string;
    identidadGenero: string;
    grupoAtencion: string | null;
  }): CasoSimuladoVbg {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + datos.diasCita);
    const fechaIso = fecha.toISOString();
    const [primerNombre, segundoNombre, primerApellido, segundoApellido] = datos.nombre;
    const nombreCompleto = [primerNombre, segundoNombre, primerApellido, segundoApellido]
      .filter(Boolean)
      .join(' ');
    const referenciaDemo = datos.codigo
      ? datos.codigo.toLowerCase().replace(/-/g, '.')
      : `cita.${datos.citaId}`;
    const correoDemo = `${referenciaDemo}@demostracion.casilda`;

    const solicitud: SolicitudAcompanamientoResponse = {
      id: datos.solicitudId,
      codigo: datos.codigo,
      tipoSolicitud: 'Acompañamiento Psicosocial',
      estado: 'En atención',
      fechaCreacion: fechaIso,
      unidadAdministrativa: 'Dirección de Bienestar Universitario',
      profesional: datos.profesional,
      tipoAsignacion: 'Directa',
      nombreSolicitante: nombreCompleto,
      documentoSolicitante: datos.documento,
      tipoDocumento: 'Cédula de ciudadanía',
      numeroDocumento: datos.documento,
      fechaNacimiento: null,
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
      identidadGenero: datos.identidadGenero,
      direccionResidencia: null,
      // Formato evidentemente de demostración: no es un teléfono marcable.
      celular: 'Demo · sin teléfono real',
      telefonoAlterno: 'Demo · sin teléfono real',
      correoInstitucional: correoDemo,
      correoPersonal: correoDemo,
      correos: [{ tipoId: 1, tipo: 'Institucional', correo: correoDemo }],
      telefonos: [{ tipoId: 1, tipo: 'Celular', telefono: 'Demo · sin teléfono real' }],
      nombreRemitente: null,
      remitenteTipoSolicitud: 'Directa',
      remitentePrimerNombre: '',
      remitenteSegundoNombre: '',
      remitentePrimerApellido: '',
      remitenteSegundoApellido: '',
      remitenteCargo: '',
      remitenteCampus: datos.campus,
      remitenteUnidadAdministrativa: 'Dirección de Bienestar Universitario',
      remitenteUnidadAcademica: datos.unidadAcademica,
      remitenteOtraUnidadAcademica: '',
      remitenteFechaSolicitud: fechaIso,
      remitenteTipoDocumento: '',
      remitenteNumeroDocumento: ''
    };

    return {
      id: datos.id,
      codigo: datos.codigo,
      solicitudId: datos.solicitudId,
      citaId: datos.citaId,
      tipoAtencion: datos.tipoAtencion,
      atencionId: datos.atencionId,
      idEstadoCita: datos.idEstadoCita,
      estadoCita: datos.estadoCita,
      estadoCaso: datos.codigo ? 'Abierto' : 'Pendiente de primera atención',
      fechaCita: fechaIso,
      fechaCaso: fechaIso,
      tipoSolicitud: 'Acompañamiento Psicosocial',
      unidadAdministrativa: 'Dirección de Bienestar Universitario',
      unidadAcademica: datos.unidadAcademica,
      campus: datos.campus,
      profesional: datos.profesional,
      tipoAsignacion: 'Directa',
      solicitud,
      grupoAtencion: datos.grupoAtencion,
      consentimiento: { estado: 'pendiente' },
      pestanas: {}
    };
  }
}
