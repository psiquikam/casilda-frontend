import {
  InformeAcompanamiento,
  MedidaProteccionActiva,
  OrdenAcompanamiento,
  RegistroSeguridad,
  RemisionSeguridad,
  RequerimientoUad,
  SolicitudEvidenciaCamara
} from '../models/spyb.models';
import { SugerenciaCasoDto } from '../models/spyb-dtos';

export const SEED_MEDIDAS_ACTIVAS: Record<string, MedidaProteccionActiva[]> = {
  '1035987456': [
    {
      idMedida: 101,
      idCaso: 12,
      codigoCaso: 'CAS-2026-0012',
      tipoMedida: 'Acompañamiento en campus',
      fechaRegistro: '2026-11-01T08:00:00-05:00',
      vigenciaFin: '2026-11-30',
      condiciones: 'Acompañamiento desde portería Ferrocarril hasta Bloque 16 (07:00 y 18:00)',
      responsable: 'Yeison (Analista de Riesgos)',
      estado: 'ACTIVA'
    }
  ],
  '71234567': [
    {
      idMedida: 102,
      idCaso: 18,
      codigoCaso: 'CAS-2026-0018',
      tipoMedida: 'Ronda periódica preventiva',
      fechaRegistro: '2026-11-05T10:00:00-05:00',
      vigenciaFin: '2026-12-15',
      condiciones: 'Monitoreo de cámaras en Bloque 22 y biblioteca central',
      responsable: 'Yeison (Analista de Riesgos)',
      estado: 'ACTIVA'
    }
  ]
};

export const SEED_SUGERENCIAS_CASOS: Record<string, SugerenciaCasoDto[]> = {
  '1035987456': [
    {
      idCaso: 12,
      codigoCaso: 'CAS-2026-0012',
      fechaApertura: '2026-10-15',
      estado: 'EN_TRAMITE',
      lugarHechos: 'Ciudad Universitaria - Bloque 16',
      presuntoAgresor: 'Carlos Esteban N.',
      motivo: 'Acoso verbal y hostigamiento reiterado en áreas comunes'
    }
  ],
  '71234567': [
    {
      idCaso: 18,
      codigoCaso: 'CAS-2026-0018',
      fechaApertura: '2026-11-02',
      estado: 'EN_TRAMITE',
      lugarHechos: 'Ciudadela Robledo',
      presuntoAgresor: 'Persona sin identificar',
      motivo: 'Amenazas en redes sociales institucionales'
    }
  ]
};

export const SEED_REGISTROS_SEGURIDAD: RegistroSeguridad[] = [
  {
    id: 1,
    consecutivo: 'SPB-2026-00001',
    tipoRegistro: 'NOVEDAD',
    tipoRegistroNombre: 'Novedad de Seguridad',
    canalRecepcion: 'REVISION_INTERNA',
    canalRecepcionNombre: 'Ronda Operativa / Detección en Campo',
    estado: 'NUEVO',
    estadoNombre: 'Nuevo / Sin Gestionar',
    fechaReporte: '2026-11-13T09:30:00-05:00',
    fechaHoraHechos: '2026-11-13T09:15:00-05:00',
    campusId: 1,
    campusNombre: 'Ciudad Universitaria - Medellín',
    lugarHechos: 'Bloque 12, plazoleta central',
    descripcionHechos: 'Vigilante de ronda detecta altercado verbal y hostigamiento presunto hacia estudiante de derecho.',
    rolPersona: 'VICTIMA',
    persona: {
      tipoIdentificacionId: 1,
      tipoIdentificacionNombre: 'Cédula de Ciudadanía',
      numeroDocumento: '1035987456',
      nombreCompleto: 'Ana María Gómez Restrepo',
      telefono: '3001234567',
      correo: 'ana.gomez@udea.edu.co',
      vinculoUdeAId: 1,
      vinculoUdeANombre: 'Estudiante de Pregrado'
    },
    reportante: {
      cedula: '98765432',
      nombre: 'Pedro Nel Supervisor',
      cargo: 'Supervisor Turno Mañana'
    },
    consentimientoRutaVioleta: {
      lecturaConsentimiento: true,
      autorizaActivacionRuta: true,
      funcionarioLectura: 'Pedro Nel Supervisor',
      fechaHora: '2026-11-13T09:25:00-05:00'
    }
  },
  {
    id: 2,
    consecutivo: 'SPB-2026-00002',
    tipoRegistro: 'PQRS',
    tipoRegistroNombre: 'PQRS Comunidad Universitaria',
    canalRecepcion: 'TELEFONO_219_64_19',
    canalRecepcionNombre: 'Línea de Seguridad 219-64-19',
    estado: 'EN_REVISION',
    estadoNombre: 'En Revisión por Analista',
    fechaReporte: '2026-11-12T14:10:00-05:00',
    fechaHoraHechos: '2026-11-12T13:45:00-05:00',
    campusId: 1,
    campusNombre: 'Ciudad Universitaria - Medellín',
    lugarHechos: 'Portería Barranquilla',
    descripcionHechos: 'Llamada telefónica de usuaria indicando sentirse intimidada por presencia de expareja en inmediaciones de la portería.',
    rolPersona: 'VICTIMA',
    persona: {
      tipoIdentificacionId: 1,
      tipoIdentificacionNombre: 'Cédula de Ciudadanía',
      numeroDocumento: '1020304050',
      nombreCompleto: 'Laura Isabel Martínez',
      telefono: '3109876543',
      correo: 'laura.martinez@udea.edu.co',
      vinculoUdeAId: 1,
      vinculoUdeANombre: 'Estudiante de Pregrado'
    },
    reportante: {
      cedula: '71987654',
      nombre: 'Operador Central 02',
      cargo: 'Operador Central de Monitoreo'
    },
    consentimientoRutaVioleta: {
      lecturaConsentimiento: true,
      autorizaActivacionRuta: true,
      funcionarioLectura: 'Operador Central 02',
      fechaHora: '2026-11-12T14:15:00-05:00'
    }
  },
  {
    id: 3,
    consecutivo: 'SPB-2026-00003',
    tipoRegistro: 'INFORME_ACOMPANAMIENTO',
    tipoRegistroNombre: 'Informe de Acompañamiento',
    canalRecepcion: 'PRESENCIAL',
    canalRecepcionNombre: 'Atención Presencial en Puesto de Control',
    estado: 'PENDIENTE_VINCULACION',
    estadoNombre: 'Pendiente de Vinculación a Caso',
    fechaReporte: '2026-11-11T18:30:00-05:00',
    campusId: 2,
    campusNombre: 'Ciudadela Robledo',
    lugarHechos: 'Desde Biblioteca Robledo hasta portería vehicular',
    descripcionHechos: 'Acompañamiento preventivo solicitado espontáneamente por docente que percibió seguimiento de persona desconocida.',
    rolPersona: 'VICTIMA',
    persona: {
      tipoIdentificacionId: 1,
      tipoIdentificacionNombre: 'Cédula de Ciudadanía',
      numeroDocumento: '43567890',
      nombreCompleto: 'Claudia Patricia Osorio',
      telefono: '3123456789',
      correo: 'claudia.osorio@udea.edu.co',
      vinculoUdeAId: 2,
      vinculoUdeANombre: 'Docente de Planta'
    },
    reportante: {
      cedula: '98765432',
      nombre: 'Pedro Nel Supervisor',
      cargo: 'Supervisor Turno Tarde'
    },
    consentimientoRutaVioleta: {
      lecturaConsentimiento: true,
      autorizaActivacionRuta: false,
      funcionarioLectura: 'Pedro Nel Supervisor',
      fechaHora: '2026-11-11T18:40:00-05:00'
    }
  },
  {
    id: 4,
    consecutivo: 'SPB-2026-00004',
    tipoRegistro: 'ALERTA_TEMPRANA',
    tipoRegistroNombre: 'Alerta Temprana',
    canalRecepcion: 'REVISION_INTERNA',
    canalRecepcionNombre: 'Ronda Operativa / Detección en Campo',
    estado: 'VINCULADO_CASO',
    estadoNombre: 'Vinculado a Caso CASILDA',
    fechaReporte: '2026-11-10T11:00:00-05:00',
    campusId: 1,
    campusNombre: 'Ciudad Universitaria - Medellín',
    lugarHechos: 'Canchas deportivas Bloque 23',
    descripcionHechos: 'Avistamiento de presunto agresor con medida de restricción de acercamiento en cercanías del área de entrenamiento.',
    rolPersona: 'PRESUNTO_AGRESOR',
    persona: {
      tipoIdentificacionId: 1,
      tipoIdentificacionNombre: 'Cédula de Ciudadanía',
      numeroDocumento: '71555444',
      nombreCompleto: 'Persona Señalada',
      telefono: '3010000000',
      vinculoUdeAId: 3,
      vinculoUdeANombre: 'Empleado Administrativo'
    },
    reportante: {
      cedula: '98765432',
      nombre: 'Pedro Nel Supervisor',
      cargo: 'Supervisor Turno Mañana'
    },
    consentimientoRutaVioleta: {
      lecturaConsentimiento: false,
      autorizaActivacionRuta: false
    },
    idCaso: 12,
    codigoCaso: 'CAS-2026-0012',
    criterioVinculacion: 'Vinculado formalmente al caso CAS-2026-0012 por verificarse incumplimiento de medida cautelar de distancia.',
    fechaVinculacion: '2026-11-10T15:20:00-05:00',
    usuarioVinculacion: 'yeison.analista'
  }
];

export const SEED_ORDENES_ACOMPANAMIENTO: OrdenAcompanamiento[] = [
  {
    id: 1,
    codigoOrden: 'ORD-SPB-2026-0001',
    idCaso: 12,
    codigoCaso: 'CAS-2026-0012',
    idMedidaProteccion: 101,
    esMedidaFormal: true,
    prioridad: 'ALTA',
    fechaProgramada: '2026-11-14',
    horaProgramada: '07:00:00',
    lugarOrigen: 'Portería Calle Barranquilla',
    lugarDestino: 'Bloque 16 Aula 302',
    personaAcompanada: 'Ana María Gómez Restrepo',
    documentoAcompanada: '1035987456',
    telefonoAcompanada: '3001234567',
    condicionesOperativas: 'Acompañamiento a pie por parte de guardia uniformado.',
    observacionesOperativas: 'Atención a presencia de vehículo gris placas XXX.',
    tokenAcceso: 'token-orden-demo-001',
    estado: 'ASIGNADA',
    supervisorAsignado: 'Pedro Nel Supervisor',
    cedulaSupervisor: '98765432',
    fechaCreacion: '2026-11-13T08:00:00-05:00',
    usuarioCreacion: 'yeison.analista'
  },
  {
    id: 2,
    codigoOrden: 'ORD-SPB-2026-0002',
    esMedidaFormal: false,
    prioridad: 'MEDIA',
    fechaProgramada: '2026-11-14',
    horaProgramada: '18:30:00',
    lugarOrigen: 'Bloque 22',
    lugarDestino: 'Estación Universidad del Metro',
    personaAcompanada: 'Claudia Patricia Osorio',
    documentoAcompanada: '43567890',
    telefonoAcompanada: '3123456789',
    condicionesOperativas: 'Acompañamiento preventivo nocturno.',
    tokenAcceso: 'token-orden-demo-002',
    estado: 'CREADA',
    fechaCreacion: '2026-11-13T10:00:00-05:00',
    usuarioCreacion: 'operador.central'
  }
];

export const SEED_INFORMES_ACOMPANAMIENTO: InformeAcompanamiento[] = [
  {
    id: 1,
    idOrden: 1,
    codigoOrden: 'ORD-SPB-2026-0001',
    idRegistroSeguridad: 3,
    consecutivoSeguridad: 'SPB-2026-00003',
    vigilanteResponsable: 'Guarda Wilson Restrepo',
    cedulaVigilante: '71444333',
    lugarInicio: 'Portería Ferrocarril',
    lugarDestino: 'Bloque 16',
    fechaHoraInicio: '2026-11-11T18:00:00-05:00',
    fechaHoraFin: '2026-11-11T18:25:00-05:00',
    identificoAgresor: false,
    ocurrioIncidente: false,
    camarasDisponibles: true,
    observacionesCamaras: 'Cámaras 12 y 14 de corredor cubrieron el trayecto.',
    novedadesAdicionales: 'Acompañamiento transcurrió sin anomalías.',
    fechaCreacion: '2026-11-11T18:30:00-05:00',
    usuarioCreacion: 'wilson.restrepo'
  }
];

export const SEED_EVIDENCIAS_CAMARAS: SolicitudEvidenciaCamara[] = [
  {
    id: 1,
    codigoSolicitud: 'EVD-SPB-2026-0001',
    idRegistroSeguridad: 1,
    consecutivoSeguridad: 'SPB-2026-00001',
    idCaso: 12,
    codigoCaso: 'CAS-2026-0012',
    ubicacionCamara: 'Domo Bloque 12 pasillo sur',
    fechaHechos: '2026-11-13',
    horaInicioFranja: '09:00:00',
    horaFinFranja: '09:30:00',
    motivoSolicitud: 'Extracción por presunto altercado y hostigamiento reportado en novedad SPB-2026-00001.',
    estadoGestion: 'EXTRAIDA_CUSTODIADA',
    estadoGestionNombre: 'Video Extraído y Custodiado',
    referenciaArchivoInstitucional: 'REC-CAM-2026-11-13-B12-01.mp4',
    ubicacionRepositorioAutorizado: 'Servidor Central Monitoreo NAS-02 Carpeta Custodia 2026',
    observacionesCustodia: 'Grabación de 30 minutos almacenada y respaldada en disco local de seguridad.',
    fechaCreacion: '2026-11-13T10:00:00-05:00',
    usuarioCreacion: 'yeison.analista'
  }
];

export const SEED_REMISIONES: RemisionSeguridad[] = [
  {
    id: 1,
    idRegistroSeguridad: 4,
    consecutivoSeguridad: 'SPB-2026-00004',
    idCaso: 12,
    codigoCaso: 'CAS-2026-0012',
    destino: 'UAD',
    destinoNombre: 'Unidad de Asuntos Disciplinarios (UAD)',
    motivo: 'Remisión de informe de novedad por desacato a medida cautelar para proceso disciplinario.',
    fechaRemision: '2026-11-10T16:00:00-05:00',
    usuarioRemitente: 'yeison.analista',
    estadoRemision: 'EN_TRAMITE',
    consecutivoRecibidoUad: 'UAD-REC-2026-089',
    radicadoDisciplinarioUad: 'EXP-DISC-2026-0045',
    estadoProcesoUad: 'Etapa de Instrucción Preliminar'
  }
];

export const SEED_REQUERIMIENTOS_UAD: RequerimientoUad[] = [
  {
    id: 1,
    idRemision: 1,
    tipoRequerimiento: 'CITACION_TESTIGO',
    tipoRequerimientoNombre: 'Citación a Testigo / Vigilante',
    personaRequerida: 'Pedro Nel Supervisor',
    cedulaPersonaRequerida: '98765432',
    fechaAudiencia: '2026-11-20T10:00:00-05:00',
    estadoNotificacion: 'NOTIFICADO',
    observaciones: 'Se notificó por correo y memorando interno para comparecer como testigo en audiencia UAD.'
  }
];
