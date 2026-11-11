import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type { MaestroDto } from './listas.service';

/** Quién reporta, según el perfil elegido en el paso «Identificación». */
export type TipoReportante = 'AFECTADA' | 'TERCERO';

/** Bloque `victima` del contrato v2 (`ReporteVictimaRequest`). Solo viaja si la persona eligió dar los datos. */
export interface ReporteVictimaDto {
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  correo: string | null;
  identidadGeneroId: number | null;
  cargoId: number | null;
}

/** Bloque `contacto` del contrato v2 (`ReporteContactoRequest`). */
export interface ReporteContactoDto {
  deseaContacto: boolean;
  correo: string | null;
  whatsapp: string | null;
}

/** Bloque `presuntoAgresor` del contrato v2 (`ReportePresuntoAgresorRequest`). */
export interface ReportePresuntoAgresorDto {
  numeroDocumento: string | null;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  vinculoUniversidadId: number | null;
  vinculoVictimaId: number | null;
  otroVinculoUniversidad: string | null;
  otroVinculoVictima: string | null;
  informacionAdicional: string | null;
  /** `null` cuando la pregunta de la UAD no aplica (sin vínculo con la Universidad). */
  remitirUad: boolean | null;
}

/**
 * Cuerpo de `POST {apiBaseUrl}/reportes` (`ReporteCasoRequest` del backend, contrato v2).
 * Contrato: `docs/contratos/contrato-reportar-caso.md` §0 y §4.1.
 * Los opcionales vacíos viajan como `null`, nunca como `""`: el servidor valida patrones
 * (`@Pattern`) sobre cadenas presentes y rechazaría una cadena vacía.
 */
export interface ReporteCasoRequestDto {
  tipoDocumentoId: number | null;
  numeroDocumento: string | null;
  /** Solo fecha, `YYYY-MM-DD`, sin hora ni zona. */
  fechaNacimiento: string | null;
  tipoLugar: 'interno' | 'externo' | null;
  campusId: number | null;
  facultad: string | null;
  bloque: string | null;
  espacio: string | null;
  lugarDetalleExterno: string | null;
  descripcionHechos: string;
  rutaActivacionId: number;
  tipoReportante: TipoReportante | null;
  victima: ReporteVictimaDto | null;
  contacto: ReporteContactoDto | null;
  presuntoAgresor: ReportePresuntoAgresorDto | null;
}

/** Respuesta `201` de `POST /reportes`. El código CAS lo genera y persiste el servidor. */
export interface ReporteCasoResponseDto {
  id: number;
  codigo: string;
  fechaRegistro: string;
  rutaActivacion: {
    id: number;
    codigo: string | null;
    nombre: string;
    estado: 'SOLICITADA' | 'ACTIVA';
  };
}

/** Valores crudos de los controles del formulario que alimentan el DTO. */
export interface ValoresReporteFormulario {
  /** `anonimo` (persona afectada) o `anonimo_tercero` (tercero o testigo). */
  perfil?: string | null;
  deseaDatosVictima: string | null | undefined;
  victima: {
    tipoDocumento?: number | null;
    identificacion?: string | null;
    fechaNacimiento?: Date | string | null;
    primerNombre?: string | null;
    segundoNombre?: string | null;
    primerApellido?: string | null;
    segundoApellido?: string | null;
    correo?: string | null;
    /** `id` de `GET /maestros/identidades-genero`. */
    genero?: number | string | null;
    /** `id` de `GET /maestros/cargos`. */
    cargo?: number | string | null;
  };
  deseaContacto?: string | null;
  correoContacto?: string | null;
  whatsappContacto?: string | null;
  relato: {
    tipoLugar?: string | null;
    sedeCampus?: number | string | null;
    facultad?: string | null;
    bloque?: string | null;
    espacio?: string | null;
    lugarDetalleExterno?: string | null;
    descripcionHechos?: string | null;
  };
  victimario?: {
    identificacion?: string | null;
    primerNombre?: string | null;
    segundoNombre?: string | null;
    primerApellido?: string | null;
    segundoApellido?: string | null;
    /** `id` de `GET /maestros/vinculos-udea`. */
    vinculoUniversidad?: number | string | null;
    otroVinculoUniversidad?: string | null;
    /** `id` de `GET /maestros/vinculos-agresor-victima`. */
    vinculoVictima?: number | string | null;
    otroVinculoVictima?: string | null;
    /** `si` / `no`; solo se envía cuando el vínculo es con la comunidad universitaria. */
    remitirUad?: string | null;
    /** Control «Información adicional» (correo, dependencia o apodo). */
    correo?: string | null;
  };
  /** Catálogos cargados, para resolver «Otro» y el vínculo con la UdeA con la misma regla del servidor. */
  vinculosUniversidad?: readonly MaestroDto[];
  vinculosVictima?: readonly MaestroDto[];
  rutaActivacion: number | null | undefined;
}

/** Error de `POST /reportes` traducido para la persona usuaria. */
export interface ErrorReporteCaso {
  mensaje: string;
  /** Mensajes por campo del DTO (`validationErrors` del `400`), con claves anidadas como `victima.cargoId`. */
  campos: Record<string, string>;
}

/**
 * Límites de evidencias del servidor (`ReporteEvidenciaStorageService`):
 * hasta 5 archivos, 10 MB cada uno y 25 MB en total; PDF, JPG, PNG, MP4, MOV y 3GP.
 * El servidor además comprueba la firma binaria de cada archivo.
 */
export const LIMITES_EVIDENCIAS = {
  maxArchivos: 5,
  maxBytesPorArchivo: 10 * 1024 * 1024,
  maxBytesTotal: 25 * 1024 * 1024,
  tiposPorExtension: {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.3gp': 'video/3gpp'
  } as Readonly<Record<string, string>>,
  descripcionFormatos: 'PDF, JPG, PNG, MP4, MOV o 3GP'
} as const;

/** Valor del atributo `accept` del selector de archivos. */
export const ACEPTA_EVIDENCIAS = Object.keys(LIMITES_EVIDENCIAS.tiposPorExtension).join(',');

/**
 * Crea reportes de caso desde el formulario multipaso, en modo anónimo o
 * autenticado. El endpoint es público: el modo lo decide el servidor por la
 * presencia de un JWT válido (lo adjunta `authInterceptor`), nunca un campo del cuerpo.
 */
@Injectable({ providedIn: 'root' })
export class ReporteCasoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/reportes`;

  /**
   * Sin evidencias envía JSON. Con evidencias envía `multipart/form-data` con la parte
   * `reporte` (JSON) y una parte `evidencias` por archivo, como espera el servidor.
   */
  crear(dto: ReporteCasoRequestDto, evidencias: readonly File[] = []): Observable<ReporteCasoResponseDto> {
    if (!evidencias.length) {
      return this.http.post<ReporteCasoResponseDto>(this.apiUrl, dto);
    }
    const form = new FormData();
    form.append('reporte', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    for (const archivo of evidencias) {
      form.append('evidencias', conTipoDeclarado(archivo), archivo.name);
    }
    return this.http.post<ReporteCasoResponseDto>(this.apiUrl, form);
  }
}

function texto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio.length ? limpio : null;
}

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/** `Date` → `YYYY-MM-DD` con la fecha local, para no desplazar el día por zona horaria. */
export function aFechaIso(valor: Date | string | null | undefined): string | null {
  if (!valor) return null;
  if (typeof valor === 'string') {
    return /^\d{4}-\d{2}-\d{2}/.test(valor) ? valor.slice(0, 10) : null;
  }
  if (Number.isNaN(valor.getTime())) return null;
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');
  return `${valor.getFullYear()}-${mes}-${dia}`;
}

/**
 * Misma regla que `ReporteCasoService.validarOtroVinculo` del backend: el campo «¿Cuál?»
 * solo aplica cuando el nombre del vínculo es exactamente «Otro» (sin distinguir mayúsculas).
 */
export function esOpcionOtro(nombre: string | null | undefined): boolean {
  return (nombre ?? '').trim().toLowerCase() === 'otro';
}

/**
 * Un vínculo del catálogo `vinculos-udea` representa a la comunidad universitaria, salvo
 * que sea una persona externa, un vínculo desconocido u «Otro». Decide si se pregunta por la UAD.
 */
export function esVinculoComunidadUdea(nombre: string | null | undefined): boolean {
  const limpio = (nombre ?? '').trim().toLowerCase();
  if (!limpio) return false;
  return !/^(externo|externa|persona externa|otro|se desconoce|desconoc)/.test(limpio);
}

function nombreDeCatalogo(catalogo: readonly MaestroDto[] | undefined, id: number | null): string | null {
  if (id === null || !catalogo) return null;
  return catalogo.find((item) => item.id === id)?.nombre ?? null;
}

function tipoReportanteDesde(perfil: string | null | undefined): TipoReportante | null {
  if (perfil === 'anonimo_tercero') return 'TERCERO';
  if (perfil === 'anonimo') return 'AFECTADA';
  return null;
}

function construirVictima(valores: ValoresReporteFormulario): ReporteVictimaDto {
  const victima = valores.victima;
  return {
    primerNombre: texto(victima.primerNombre),
    segundoNombre: texto(victima.segundoNombre),
    primerApellido: texto(victima.primerApellido),
    segundoApellido: texto(victima.segundoApellido),
    correo: texto(victima.correo),
    identidadGeneroId: numero(victima.genero),
    cargoId: numero(victima.cargo)
  };
}

function construirContacto(valores: ValoresReporteFormulario, conVictima: boolean): ReporteContactoDto {
  if (valores.deseaContacto !== 'si') {
    return { deseaContacto: false, correo: null, whatsapp: null };
  }
  // La persona afectada que dio su correo en «datos de la víctima» no lo vuelve a escribir.
  const correoVictima = conVictima && valores.perfil === 'anonimo' ? texto(valores.victima.correo) : null;
  return {
    deseaContacto: true,
    correo: texto(valores.correoContacto) ?? correoVictima,
    whatsapp: texto(valores.whatsappContacto)
  };
}

function construirPresuntoAgresor(valores: ValoresReporteFormulario): ReportePresuntoAgresorDto | null {
  const v = valores.victimario;
  if (!v) return null;

  const vinculoUniversidadId = numero(v.vinculoUniversidad);
  const vinculoVictimaId = numero(v.vinculoVictima);
  const nombreVinculoUniversidad = nombreDeCatalogo(valores.vinculosUniversidad, vinculoUniversidadId);
  const nombreVinculoVictima = nombreDeCatalogo(valores.vinculosVictima, vinculoVictimaId);

  // «¿Cuál?» solo viaja cuando el vínculo elegido es «Otro»; si no hay catálogo para
  // comprobarlo, se confía en que la UI solo mostró el campo en ese caso.
  const otroUniversidad = valores.vinculosUniversidad && !esOpcionOtro(nombreVinculoUniversidad)
    ? null
    : texto(v.otroVinculoUniversidad);
  const otroVictima = valores.vinculosVictima && !esOpcionOtro(nombreVinculoVictima)
    ? null
    : texto(v.otroVinculoVictima);

  // La UAD solo se pregunta cuando la persona señalada pertenece a la comunidad universitaria.
  const aplicaUad = vinculoUniversidadId !== null
    && (nombreVinculoUniversidad === null || esVinculoComunidadUdea(nombreVinculoUniversidad));

  const agresor: ReportePresuntoAgresorDto = {
    numeroDocumento: texto(v.identificacion),
    primerNombre: texto(v.primerNombre),
    segundoNombre: texto(v.segundoNombre),
    primerApellido: texto(v.primerApellido),
    segundoApellido: texto(v.segundoApellido),
    vinculoUniversidadId,
    vinculoVictimaId,
    otroVinculoUniversidad: otroUniversidad,
    otroVinculoVictima: otroVictima,
    informacionAdicional: texto(v.correo),
    remitirUad: aplicaUad ? v.remitirUad === 'si' : null
  };

  const hayDatos = agresor.numeroDocumento !== null || agresor.primerNombre !== null
    || agresor.segundoNombre !== null || agresor.primerApellido !== null
    || agresor.segundoApellido !== null || agresor.vinculoUniversidadId !== null
    || agresor.vinculoVictimaId !== null || agresor.informacionAdicional !== null;
  return hayDatos ? agresor : null;
}

/**
 * Mapea el formulario al DTO del contrato v2 (§4.1 y reglas cruzadas del §5.3):
 * - Los datos de la víctima solo viajan si la persona eligió darlos.
 * - Solo se envían los campos del tipo de lugar elegido; los del otro tipo,
 *   que pueden quedar en el control tras cambiar de opción, van en `null`.
 * - `sedeCampus` se envía como `campusId`.
 * - El bloque del presunto agresor va en `null` si no se diligenció nada.
 */
export function construirReporteCasoRequest(valores: ValoresReporteFormulario): ReporteCasoRequestDto {
  const conVictima = valores.deseaDatosVictima === 'si';
  const relato = valores.relato;
  const tipoLugar = relato.tipoLugar === 'interno' || relato.tipoLugar === 'externo' ? relato.tipoLugar : null;
  const interno = tipoLugar === 'interno';

  return {
    tipoDocumentoId: conVictima ? numero(valores.victima.tipoDocumento) : null,
    numeroDocumento: conVictima ? texto(valores.victima.identificacion)?.toUpperCase() ?? null : null,
    fechaNacimiento: conVictima ? aFechaIso(valores.victima.fechaNacimiento) : null,
    tipoLugar,
    campusId: interno ? numero(relato.sedeCampus) : null,
    facultad: interno ? texto(relato.facultad) : null,
    bloque: interno ? texto(relato.bloque) : null,
    espacio: interno ? texto(relato.espacio) : null,
    lugarDetalleExterno: tipoLugar === 'externo' ? texto(relato.lugarDetalleExterno) : null,
    descripcionHechos: texto(relato.descripcionHechos) ?? '',
    rutaActivacionId: numero(valores.rutaActivacion) as number,
    tipoReportante: tipoReportanteDesde(valores.perfil),
    victima: conVictima ? construirVictima(valores) : null,
    contacto: construirContacto(valores, conVictima),
    presuntoAgresor: construirPresuntoAgresor(valores)
  };
}

function extensionDe(nombre: string): string {
  const punto = nombre.lastIndexOf('.');
  return punto >= 0 ? nombre.slice(punto).toLowerCase() : '';
}

/** Tipo MIME que se declarará al servidor: el del navegador o, si falta, el que indica la extensión. */
function tipoEvidencia(archivo: File): string {
  return archivo.type || LIMITES_EVIDENCIAS.tiposPorExtension[extensionDe(archivo.name)] || '';
}

/** Algunos navegadores no asignan `type` a .mov/.3gp; el servidor rechaza partes sin tipo conocido. */
function conTipoDeclarado(archivo: File): File {
  const tipo = tipoEvidencia(archivo);
  return archivo.type === tipo ? archivo : new File([archivo], archivo.name, { type: tipo, lastModified: archivo.lastModified });
}

function enMegas(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * Repite en el cliente las reglas de evidencias del servidor. Devuelve el mensaje del primer
 * incumplimiento o `null` si la lista es válida.
 */
export function validarEvidencias(archivos: readonly File[]): string | null {
  const { maxArchivos, maxBytesPorArchivo, maxBytesTotal, tiposPorExtension, descripcionFormatos } = LIMITES_EVIDENCIAS;
  if (archivos.length > maxArchivos) {
    return `Puede adjuntar máximo ${maxArchivos} evidencias.`;
  }
  const tiposPermitidos = new Set(Object.values(tiposPorExtension));
  for (const archivo of archivos) {
    if (archivo.size === 0) {
      return `El archivo «${archivo.name}» está vacío.`;
    }
    if (!tiposPermitidos.has(tipoEvidencia(archivo))) {
      return `El archivo «${archivo.name}» no tiene un formato permitido (${descripcionFormatos}).`;
    }
    if (archivo.size > maxBytesPorArchivo) {
      return `El archivo «${archivo.name}» supera los ${enMegas(maxBytesPorArchivo)} permitidos por archivo.`;
    }
  }
  const total = archivos.reduce((suma, archivo) => suma + archivo.size, 0);
  if (total > maxBytesTotal) {
    return `Las evidencias superan en conjunto los ${enMegas(maxBytesTotal)} permitidos.`;
  }
  return null;
}

/** Traduce el error HTTP de `POST /reportes` (contrato §3.1 y §6). */
export function interpretarErrorReporte(error: unknown): ErrorReporteCaso {
  const http = error instanceof HttpErrorResponse ? error : null;
  const cuerpo = (http?.error ?? {}) as { message?: unknown; validationErrors?: unknown };
  const campos: Record<string, string> = {};

  switch (http?.status) {
    case 0:
      return { mensaje: 'No hay conexión con el servidor. Su reporte no se ha enviado. Verifique su conexión e intente de nuevo.', campos };
    case 401:
      return { mensaje: 'Su sesión expiró y el reporte no se envió. Inicie sesión de nuevo para enviarlo.', campos };
    case 413:
      return { mensaje: `Las evidencias superan el tamaño permitido (${enMegas(LIMITES_EVIDENCIAS.maxBytesTotal)} en total). Quite algún archivo e intente de nuevo.`, campos };
    case 429:
      return { mensaje: 'Se han enviado varios reportes en poco tiempo. Espere unos minutos e intente de nuevo.', campos };
    case 400: {
      if (cuerpo.validationErrors && typeof cuerpo.validationErrors === 'object') {
        for (const [campo, mensaje] of Object.entries(cuerpo.validationErrors as Record<string, unknown>)) {
          if (typeof mensaje === 'string') campos[campo] = mensaje;
        }
      }
      const mensajeServidor = typeof cuerpo.message === 'string' ? cuerpo.message : '';
      return {
        mensaje: Object.keys(campos).length
          ? 'Su reporte no se ha enviado. Revise los campos señalados e intente de nuevo.'
          : mensajeServidor || 'Su reporte no se ha enviado. Revise los datos e intente de nuevo.',
        campos
      };
    }
  }

  return { mensaje: 'No fue posible enviar su reporte. Intente de nuevo en unos minutos.', campos };
}
