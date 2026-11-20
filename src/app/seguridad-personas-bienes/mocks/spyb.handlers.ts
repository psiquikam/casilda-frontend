import { PeticionMockSpyb, RespuestaMockSpyb, RutaMockSpyb } from './spyb-mock-tipos';
import { spybMockStore } from './spyb-mock-store';
import {
  CrearOrdenAcompanamientoRequest,
  CrearRegistroSeguridadRequest,
  CrearRemisionSeguridadRequest,
  RegistrarInformeAcompanamientoRequest,
  RegistrarRequerimientoUadRequest,
  SolicitarEvidenciaCamaraRequest,
  VincularCasoRequest
} from '../models/spyb-dtos';

export const RUTAS_MOCK_SPYB: readonly RutaMockSpyb[] = [
  // --- REGISTROS ---
  {
    grupo: 'registros',
    metodo: 'POST',
    patron: /^\/registros$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const cuerpo = p.cuerpo as CrearRegistroSeguridadRequest;
      const nuevo = spybMockStore.agregarRegistro({
        tipoRegistro: cuerpo.tipoRegistroCodigo,
        canalRecepcion: cuerpo.canalRecepcionCodigo,
        fechaHoraHechos: cuerpo.fechaHoraHechos,
        campusId: cuerpo.campusId,
        campusNombre: cuerpo.campusId === 1 ? 'Ciudad Universitaria - Medellín' : 'Ciudadela Robledo',
        lugarHechos: cuerpo.lugarHechos,
        descripcionHechos: cuerpo.descripcionHechos,
        rolPersona: cuerpo.rolPersonaCodigo,
        persona: cuerpo.persona,
        reportante: cuerpo.reportante,
        consentimientoRutaVioleta: cuerpo.consentimientoRutaVioleta,
        usuarioCreacion: p.usuario
      });
      return {
        estado: 201,
        cuerpo: {
          id: nuevo.id,
          consecutivo: nuevo.consecutivo,
          estado: nuevo.estado,
          fechaReporte: nuevo.fechaReporte,
          mensaje: 'Actuación de seguridad registrada exitosamente'
        }
      };
    }
  },
  {
    grupo: 'registros',
    metodo: 'POST',
    patron: /^\/registros\/restringido$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const cuerpo = p.cuerpo as CrearRegistroSeguridadRequest;
      const nuevo = spybMockStore.agregarRegistro({
        tipoRegistro: cuerpo.tipoRegistroCodigo,
        canalRecepcion: cuerpo.canalRecepcionCodigo,
        fechaHoraHechos: cuerpo.fechaHoraHechos,
        campusId: cuerpo.campusId,
        campusNombre: cuerpo.campusId === 1 ? 'Ciudad Universitaria - Medellín' : 'Ciudadela Robledo',
        lugarHechos: cuerpo.lugarHechos,
        descripcionHechos: cuerpo.descripcionHechos,
        rolPersona: cuerpo.rolPersonaCodigo,
        persona: cuerpo.persona,
        reportante: cuerpo.reportante,
        consentimientoRutaVioleta: cuerpo.consentimientoRutaVioleta,
        usuarioCreacion: cuerpo.reportante.cedula
      });
      return {
        estado: 201,
        cuerpo: {
          id: nuevo.id,
          consecutivo: nuevo.consecutivo,
          estado: nuevo.estado,
          fechaReporte: nuevo.fechaReporte,
          mensaje: 'Reporte registrado exitosamente por personal de seguridad'
        }
      };
    }
  },
  {
    grupo: 'registros',
    metodo: 'GET',
    patron: /^\/registros\/(\d+)$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const id = Number(p.parametros[0]);
      const item = spybMockStore.getRegistroPorId(id);
      if (!item) return { estado: 404, cuerpo: { mensaje: 'Registro no encontrado' } };
      return { estado: 200, cuerpo: item };
    }
  },
  {
    grupo: 'registros',
    metodo: 'GET',
    patron: /^\/registros$/,
    manejador: (): RespuestaMockSpyb => {
      const items = spybMockStore.getRegistros();
      return { estado: 200, cuerpo: { items, total: items.length } };
    }
  },

  // --- CONSULTA MEDIDAS ACTIVAS ---
  {
    grupo: 'medidas',
    metodo: 'GET',
    patron: /^\/consultas\/medida-activa\/(.+)$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const doc = decodeURIComponent(p.parametros[0]);
      const medidas = spybMockStore.getMedidasPorDocumento(doc);
      return {
        estado: 200,
        cuerpo: {
          tieneMedidaActiva: medidas.length > 0,
          persona: medidas.length > 0 ? { numeroDocumento: doc, nombreCompleto: 'Persona registrada en el sistema' } : undefined,
          medidas
        }
      };
    }
  },

  // --- BANDEJA ANALISTA Y VINCULACIÓN ---
  {
    grupo: 'bandejaAnalista',
    metodo: 'GET',
    patron: /^\/analista\/conteos$/,
    manejador: (): RespuestaMockSpyb => {
      return { estado: 200, cuerpo: spybMockStore.getConteos() };
    }
  },
  {
    grupo: 'bandejaAnalista',
    metodo: 'GET',
    patron: /^\/analista\/bandeja$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const pestana = p.query.get('pestana') ?? 'NUEVOS';
      let filtrados = spybMockStore.getRegistros();
      if (pestana === 'NUEVOS') {
        filtrados = filtrados.filter((r) => r.estado === 'NUEVO');
      } else if (pestana === 'REVISION') {
        filtrados = filtrados.filter((r) => r.estado === 'EN_REVISION' || r.estado === 'SUBSANACION_REQUERIDA');
      } else if (pestana === 'PENDIENTE_VINCULACION') {
        filtrados = filtrados.filter((r) => r.estado === 'PENDIENTE_VINCULACION');
      }
      return { estado: 200, cuerpo: { items: filtrados, total: filtrados.length } };
    }
  },
  {
    grupo: 'bandejaAnalista',
    metodo: 'GET',
    patron: /^\/casos\/sugerencias-vinculacion$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const doc = p.query.get('numeroDocumento') ?? '';
      const sugerencias = spybMockStore.getSugerenciasCasos(doc);
      return { estado: 200, cuerpo: sugerencias };
    }
  },
  {
    grupo: 'bandejaAnalista',
    metodo: 'POST',
    patron: /^\/registros\/(\d+)\/vincular-caso$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const id = Number(p.parametros[0]);
      const cuerpo = p.cuerpo as VincularCasoRequest;
      const actualizado = spybMockStore.actualizarRegistro(id, {
        estado: 'VINCULADO_CASO',
        estadoNombre: 'Vinculado a Caso CASILDA',
        idCaso: cuerpo.idCaso,
        codigoCaso: `CAS-2026-${String(cuerpo.idCaso).padStart(4, '0')}`,
        criterioVinculacion: cuerpo.criterioJustificacion,
        fechaVinculacion: new Date().toISOString(),
        usuarioVinculacion: p.usuario
      });
      if (!actualizado) return { estado: 404, cuerpo: { mensaje: 'Registro no encontrado' } };
      return { estado: 200, cuerpo: actualizado };
    }
  },
  {
    grupo: 'bandejaAnalista',
    metodo: 'POST',
    patron: /^\/registros\/(\d+)\/declarar-independiente$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const id = Number(p.parametros[0]);
      const cuerpo = p.cuerpo as { motivo: string };
      const actualizado = spybMockStore.actualizarRegistro(id, {
        estado: 'ACTUACION_INDEPENDIENTE',
        estadoNombre: 'Cerrado como Actuación Independiente',
        criterioVinculacion: cuerpo.motivo,
        fechaVinculacion: new Date().toISOString(),
        usuarioVinculacion: p.usuario
      });
      if (!actualizado) return { estado: 404, cuerpo: { mensaje: 'Registro no encontrado' } };
      return { estado: 200, cuerpo: actualizado };
    }
  },
  {
    grupo: 'bandejaAnalista',
    metodo: 'POST',
    patron: /^\/registros\/(\d+)\/solicitar-subsanacion$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const id = Number(p.parametros[0]);
      const cuerpo = p.cuerpo as { motivoSubsanacion: string };
      const actualizado = spybMockStore.actualizarRegistro(id, {
        estado: 'SUBSANACION_REQUERIDA',
        estadoNombre: 'Subsanación Requerida a Vigilante',
        solicitaSubsanacion: true,
        motivoSubsanacion: cuerpo.motivoSubsanacion,
        fechaSubsanacion: new Date().toISOString()
      });
      if (!actualizado) return { estado: 404, cuerpo: { mensaje: 'Registro no encontrado' } };
      return { estado: 200, cuerpo: actualizado };
    }
  },

  // --- ÓRDENES E INFORMES DE ACOMPAÑAMIENTO ---
  {
    grupo: 'ordenes',
    metodo: 'POST',
    patron: /^\/ordenes-acompanamiento$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const cuerpo = p.cuerpo as CrearOrdenAcompanamientoRequest;
      const nueva = spybMockStore.agregarOrden({
        idCaso: cuerpo.idCaso,
        codigoCaso: cuerpo.idCaso ? `CAS-2026-${String(cuerpo.idCaso).padStart(4, '0')}` : undefined,
        idMedidaProteccion: cuerpo.idMedidaProteccion,
        idRegistroOrigen: cuerpo.idRegistroOrigen,
        esMedidaFormal: cuerpo.esMedidaFormal,
        prioridad: cuerpo.prioridad,
        fechaProgramada: cuerpo.fechaProgramada,
        horaProgramada: cuerpo.horaProgramada,
        lugarOrigen: cuerpo.lugarOrigen,
        lugarDestino: cuerpo.lugarDestino,
        personaAcompanada: cuerpo.personaAcompanada,
        documentoAcompanada: cuerpo.documentoAcompanada,
        telefonoAcompanada: cuerpo.telefonoAcompanada,
        condicionesOperativas: cuerpo.condicionesOperativas,
        observacionesOperativas: cuerpo.observacionesOperativas,
        usuarioCreacion: p.usuario
      });
      return { estado: 201, cuerpo: nueva };
    }
  },
  {
    grupo: 'ordenes',
    metodo: 'GET',
    patron: /^\/ordenes-acompanamiento$/,
    manejador: (): RespuestaMockSpyb => {
      return { estado: 200, cuerpo: spybMockStore.getOrdenes() };
    }
  },
  {
    grupo: 'ordenes',
    metodo: 'GET',
    patron: /^\/ordenes-acompanamiento\/restringida\/(.+)$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const token = decodeURIComponent(p.parametros[0]);
      const orden = spybMockStore.getOrdenPorToken(token);
      if (!orden) return { estado: 404, cuerpo: { mensaje: 'Orden de acompañamiento no encontrada o token inválido' } };
      return { estado: 200, cuerpo: orden };
    }
  },
  {
    grupo: 'ordenes',
    metodo: 'POST',
    patron: /^\/ordenes-acompanamiento\/(.+)\/informe$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const codigoOrden = decodeURIComponent(p.parametros[0]);
      const cuerpo = p.cuerpo as RegistrarInformeAcompanamientoRequest;
      const nuevoInforme = spybMockStore.agregarInforme({
        codigoOrden,
        idRegistroSeguridad: cuerpo.idRegistroSeguridad ?? 1,
        vigilanteResponsable: cuerpo.vigilanteResponsable,
        cedulaVigilante: cuerpo.cedulaVigilante,
        lugarInicio: cuerpo.lugarInicio,
        lugarDestino: cuerpo.lugardestino,
        fechaHoraInicio: cuerpo.fechaHoraInicio,
        fechaHoraFin: cuerpo.fechaHoraFin,
        identificoAgresor: cuerpo.identificoAgresor,
        lugarHoraAgresor: cuerpo.lugarHoraAgresor,
        descripcionAgresor: cuerpo.descripcionAgresor,
        ocurrioIncidente: cuerpo.ocurrioIncidente,
        tipoIncidente: cuerpo.tipoIncidente,
        descripcionIncidente: cuerpo.descripcionIncidente,
        actuacionAdoptada: cuerpo.actuacionAdoptada,
        camarasDisponibles: cuerpo.camarasDisponibles,
        observacionesCamaras: cuerpo.observacionesCamaras,
        novedadesAdicionales: cuerpo.novedadesAdicionales,
        usuarioCreacion: cuerpo.cedulaVigilante
      });
      return { estado: 201, cuerpo: nuevoInforme };
    }
  },

  // --- CÁMARAS Y EVIDENCIAS ---
  {
    grupo: 'camaras',
    metodo: 'POST',
    patron: /^\/evidencias\/solicitudes$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const cuerpo = p.cuerpo as SolicitarEvidenciaCamaraRequest;
      const nueva = spybMockStore.agregarEvidencia({
        idRegistroSeguridad: cuerpo.idRegistroSeguridad,
        idCaso: cuerpo.idCaso,
        ubicacionCamara: cuerpo.ubicacionCamara,
        fechaHechos: cuerpo.fechaHechos,
        horaInicioFranja: cuerpo.horaInicioFranja,
        horaFinFranja: cuerpo.horaFinFranja,
        motivoSolicitud: cuerpo.motivoSolicitud,
        usuarioCreacion: p.usuario
      });
      return { estado: 201, cuerpo: nueva };
    }
  },
  {
    grupo: 'camaras',
    metodo: 'GET',
    patron: /^\/evidencias\/solicitudes$/,
    manejador: (): RespuestaMockSpyb => {
      return { estado: 200, cuerpo: spybMockStore.getEvidencias() };
    }
  },
  {
    grupo: 'camaras',
    metodo: 'PATCH',
    patron: /^\/evidencias\/solicitudes\/(\d+)\/custodia$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const id = Number(p.parametros[0]);
      const cuerpo = p.cuerpo as Record<string, unknown>;
      const actualizada = spybMockStore.actualizarEvidencia(id, cuerpo);
      if (!actualizada) return { estado: 404, cuerpo: { mensaje: 'Solicitud no encontrada' } };
      return { estado: 200, cuerpo: actualizada };
    }
  },

  // --- REMISIONES & UAD ---
  {
    grupo: 'remisiones',
    metodo: 'POST',
    patron: /^\/remisiones$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const cuerpo = p.cuerpo as CrearRemisionSeguridadRequest;
      const reg = spybMockStore.getRegistroPorId(cuerpo.idRegistroSeguridad);
      const nueva = spybMockStore.agregarRemision({
        idRegistroSeguridad: cuerpo.idRegistroSeguridad,
        consecutivoSeguridad: reg?.consecutivo ?? 'SPB-2026-00001',
        idCaso: cuerpo.idCaso,
        codigoCaso: cuerpo.idCaso ? `CAS-2026-${String(cuerpo.idCaso).padStart(4, '0')}` : undefined,
        destino: cuerpo.destino,
        motivo: cuerpo.motivo,
        usuarioRemitente: p.usuario,
        consecutivoRecibidoUad: cuerpo.consecutivoRecibidoUad,
        entidadExterna: cuerpo.entidadExterna,
        medioNotificacion: cuerpo.medioNotificacion
      });
      return { estado: 201, cuerpo: nueva };
    }
  },
  {
    grupo: 'remisiones',
    metodo: 'GET',
    patron: /^\/remisiones$/,
    manejador: (): RespuestaMockSpyb => {
      return { estado: 200, cuerpo: spybMockStore.getRemisiones() };
    }
  },
  {
    grupo: 'remisiones',
    metodo: 'PATCH',
    patron: /^\/remisiones\/(\d+)\/uad-consecutivo$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const id = Number(p.parametros[0]);
      const cuerpo = p.cuerpo as { consecutivo: string };
      const actualizada = spybMockStore.actualizarRemision(id, { consecutivoRecibidoUad: cuerpo.consecutivo });
      if (!actualizada) return { estado: 404, cuerpo: { mensaje: 'Remisión no encontrada' } };
      return { estado: 200, cuerpo: actualizada };
    }
  },
  {
    grupo: 'remisiones',
    metodo: 'POST',
    patron: /^\/remisiones\/uad\/requerimientos$/,
    manejador: (p: PeticionMockSpyb): RespuestaMockSpyb => {
      const cuerpo = p.cuerpo as RegistrarRequerimientoUadRequest;
      const nuevo = spybMockStore.agregarRequerimientoUad({
        idRemision: cuerpo.idRemision,
        tipoRequerimiento: cuerpo.tipoRequerimiento,
        personaRequerida: cuerpo.personaRequerida,
        cedulaPersonaRequerida: cuerpo.cedulaPersonaRequerida,
        fechaAudiencia: cuerpo.fechaAudiencia,
        estadoNotificacion: 'NOTIFICADO',
        observaciones: cuerpo.observaciones,
        usuarioRegistro: p.usuario
      });
      return { estado: 201, cuerpo: nuevo };
    }
  },
  {
    grupo: 'remisiones',
    metodo: 'GET',
    patron: /^\/remisiones\/uad\/requerimientos$/,
    manejador: (): RespuestaMockSpyb => {
      return { estado: 200, cuerpo: spybMockStore.getRequerimientosUad() };
    }
  },

  // --- INDICADORES ---
  {
    grupo: 'indicadores',
    metodo: 'GET',
    patron: /^\/indicadores\/resumen$/,
    manejador: (): RespuestaMockSpyb => {
      return { estado: 200, cuerpo: spybMockStore.getIndicadores() };
    }
  }
];
