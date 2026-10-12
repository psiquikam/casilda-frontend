import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

import type {
  CasoDto,
  CitaDto,
  PagedResponseDto,
  SolicitudAcompanamientoResponse
} from './solicitud.service';
import {
  aCasoDto,
  aCitaDto,
  paginar,
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
 * Tres casos ficticios, ninguno con datos reales. M1 solo cubre la
 * navegación (listar, abrir, guardar genérico); M2 a M5 añaden métodos con
 * semántica propia por sección (compromisos, seguimientos, cierre) conforme
 * cada subfase los va necesitando.
 */
@Injectable({ providedIn: 'root' })
export class CasosSimuladosService {
  private readonly casos = signal<CasoSimuladoVbg[]>(this.semilla());

  listarCitas(page: number, size: number): Observable<PagedResponseDto<CitaDto>> {
    const citas = this.casos().map(aCitaDto);
    return respuestaSimulada(paginar(citas, page, size));
  }

  listarCasos(page: number, size: number): Observable<PagedResponseDto<CasoDto>> {
    const casos = this.casos().map(aCasoDto);
    return respuestaSimulada(paginar(casos, page, size));
  }

  obtenerSolicitud(solicitudId: number): Observable<SolicitudAcompanamientoResponse> {
    const caso = this.casos().find((c) => c.solicitudId === solicitudId);
    if (!caso) {
      return of(this.casos()[0].solicitud);
    }
    return respuestaSimulada(caso.solicitud);
  }

  /**
   * Guarda el payload crudo de una pestaña del formulario. No lo interpreta:
   * cada sección añade su propia semántica en su subfase (ver
   * `CasoSimuladoVbg.pestanas`).
   */
  guardarPestana(
    casoId: number | null,
    tabIndex: number,
    datos: unknown
  ): Observable<{ id: number; codigo: string }> {
    const lista = this.casos();
    const caso = casoId ? lista.find((c) => c.id === casoId) : lista[0];
    const destino = caso ?? lista[0];

    (destino.pestanas as Record<number, unknown>)[tabIndex] = datos;
    this.casos.set([...lista]);

    return respuestaSimulada({ id: destino.id, codigo: destino.codigo });
  }

  private semilla(): CasoSimuladoVbg[] {
    return [
      this.crearCaso({
        id: 9001,
        codigo: 'CAS-DEMO-0001',
        solicitudId: 9001,
        citaId: 9001,
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
        diasCita: 1,
        nombre: ['Persona', '', 'Demostración', 'Dos'],
        documento: 'DEMO-0000002',
        profesional: 'Lic. Carlos Restrepo (Profesional Psicosocial)',
        unidadAcademica: 'Facultad de Educación',
        campus: 'Seccional Oriente',
        identidadGenero: 'Persona No Binaria',
        grupoAtencion: null
      }),
      this.crearCaso({
        id: 9003,
        codigo: 'CAS-DEMO-0003',
        solicitudId: 9003,
        citaId: 9003,
        diasCita: -2,
        nombre: ['Persona', 'Demostración', 'Tres', ''],
        documento: 'DEMO-0000003',
        profesional: 'Dra. Elena Ramos (Coordinadora)',
        unidadAcademica: 'Facultad de Medicina',
        campus: 'Medellín - Ciudad Universitaria',
        identidadGenero: 'Hombre (Cisgénero / Trans)',
        grupoAtencion: 'Grupo 5'
      })
    ];
  }

  private crearCaso(datos: {
    id: number;
    codigo: string;
    solicitudId: number;
    citaId: number;
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
    const correoDemo = `${datos.codigo.toLowerCase().replace(/-/g, '.')}@demostracion.casilda`;

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
      tipoDocumento: 'Cédula de Ciudadanía',
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
      idEstadoCita: 1,
      estadoCita: 'Creada',
      estadoCaso: 'Abierto',
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
