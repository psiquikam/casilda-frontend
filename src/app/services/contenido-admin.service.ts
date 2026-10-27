import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { environment } from '../../environments/environment';
import type { ContenidoDestacadoDto } from './contenido-home.service';
import type { PagedResponseDto } from './listas.service';

/**
 * Contenido tal como lo devuelve la administración (`ContenidoResponse` del
 * backend): los campos públicos del home más los internos de gestión.
 */
export interface ContenidoAdminDto extends ContenidoDestacadoDto {
  /** Posición dentro de su sección; la portada ordena de menor a mayor. */
  orden: number;
  eliminado?: boolean;
  createdAt?: string | null;
  createdBy?: string | null;
  modifiedAt?: string | null;
  modifiedBy?: string | null;
}

/**
 * Parte `contenido` del `multipart/form-data` (`ContenidoRequest`). La imagen no
 * viaja aquí: va como archivo aparte y el backend calcula su ruta.
 */
export interface ContenidoRequestDto {
  titulo: string;
  contenido: string;
  /** ISO 8601 con zona (`Instant` en el backend). */
  vigenciaInicio: string;
  vigenciaFin: string | null;
  enlace: string | null;
  seccion: ContenidoDestacadoDto['seccion'];
  orden: number;
}

/** Qué hacer con la imagen al actualizar. Sin opciones, la imagen actual se conserva. */
export interface CambioImagen {
  /** Archivo nuevo: reemplaza la imagen actual. */
  archivo?: File | null;
  /** Quitar la imagen sin reemplazo. Se ignora si viene `archivo`. */
  eliminar?: boolean;
}

/**
 * Tamaño de página al traer el catálogo completo. Por diseño la portada tiene
 * entre 4 y 12 tarjetas (contrato §3.1), así que lo normal es una sola petición.
 */
const TAMANO_LOTE = 100;

/**
 * CRUD protegido del gestor de contenidos (`/contenidos`, roles
 * `GESTOR_CONTENIDO` y `ADMIN`). La lectura pública vive aparte, en
 * `ContenidoHomeService`, porque no requiere token y filtra por vigencia.
 *
 * Crear y actualizar usan `multipart/form-data`: no se fija `Content-Type` a
 * mano para que el navegador agregue el `boundary`.
 */
@Injectable({ providedIn: 'root' })
export class ContenidoAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/contenidos`;

  listarPagina(page: number, size: number): Observable<PagedResponseDto<ContenidoAdminDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponseDto<ContenidoAdminDto>>(this.apiUrl, { params });
  }

  /**
   * Todos los contenidos administrables (vigentes, programados y vencidos, no
   * eliminados), en el orden del backend: `orden` y luego `titulo`.
   *
   * Se traen completos para que la vista agrupe por sección y filtre por estado
   * sin ida y vuelta al servidor. Si algún día superan un lote, las páginas
   * restantes se piden en paralelo.
   */
  listarTodos(): Observable<ContenidoAdminDto[]> {
    return this.listarPagina(0, TAMANO_LOTE).pipe(
      switchMap((primera) => {
        if (primera.totalPages <= 1) return of(primera.content);
        const restantes = Array.from({ length: primera.totalPages - 1 }, (_, i) => this.listarPagina(i + 1, TAMANO_LOTE));
        return forkJoin(restantes).pipe(map((paginas) => [primera, ...paginas].flatMap((p) => p.content)));
      })
    );
  }

  obtenerPorId(id: number): Observable<ContenidoAdminDto> {
    return this.http.get<ContenidoAdminDto>(`${this.apiUrl}/${id}`);
  }

  crear(datos: ContenidoRequestDto, imagen?: File | null): Observable<ContenidoAdminDto> {
    return this.http.post<ContenidoAdminDto>(this.apiUrl, this.armarFormulario(datos, imagen));
  }

  actualizar(id: number, datos: ContenidoRequestDto, cambioImagen: CambioImagen = {}): Observable<ContenidoAdminDto> {
    const params = !cambioImagen.archivo && cambioImagen.eliminar ? new HttpParams().set('eliminarImagen', true) : undefined;
    return this.http.put<ContenidoAdminDto>(`${this.apiUrl}/${id}`, this.armarFormulario(datos, cambioImagen.archivo), { params });
  }

  /** Borrado lógico en el backend: el contenido deja de verse pero se conserva por trazabilidad. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private armarFormulario(datos: ContenidoRequestDto, imagen?: File | null): FormData {
    const formulario = new FormData();
    // Spring (@RequestPart) solo deserializa la parte como JSON si declara su tipo.
    formulario.append('contenido', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    if (imagen) formulario.append('imagen', imagen, imagen.name);
    return formulario;
  }
}

/** Error de guardado traducido a lo que la vista necesita mostrar. */
export interface ErrorContenido {
  /** Mensaje general, en lenguaje claro. */
  mensaje: string;
  /** Mensajes por campo del formulario (`titulo`, `vigenciaFin`, `imagen`…). */
  campos: Record<string, string>;
  /** El contenido ya no existe (404): la vista debe volver al listado. */
  noEncontrado: boolean;
}

/**
 * Traduce la respuesta de error del backend.
 *
 * El backend responde de dos formas: `ValidationErrorResponse`, con
 * `validationErrors: { campo: mensaje }` (anotaciones de `ContenidoRequest`), y
 * `ErrorResponse`, con un `message` suelto (vigencia e imagen, que se validan en
 * el servicio). Los mensajes técnicos conocidos se reescriben y se asocian al
 * campo que los causa.
 */
export function interpretarErrorContenido(error: unknown): ErrorContenido {
  const resultado: ErrorContenido = { mensaje: '', campos: {}, noEncontrado: false };
  const http = error instanceof HttpErrorResponse ? error : null;
  const cuerpo = (http?.error ?? {}) as { message?: unknown; validationErrors?: unknown };
  const mensajeServidor = typeof cuerpo.message === 'string' ? cuerpo.message : '';

  switch (http?.status) {
    case 0:
      resultado.mensaje = 'No hay conexión con el servidor. Verifique su conexión e intente de nuevo.';
      return resultado;
    case 403:
      resultado.mensaje = 'Su usuario no tiene permiso para gestionar los contenidos del inicio.';
      return resultado;
    case 404:
      resultado.mensaje = 'Este contenido ya no existe. Es posible que otra persona lo haya eliminado.';
      resultado.noEncontrado = true;
      return resultado;
    case 413:
      resultado.campos['imagen'] = 'La imagen es demasiado pesada. El máximo es 400 KB.';
      resultado.mensaje = 'La imagen es demasiado pesada.';
      return resultado;
  }

  if (http?.status === 400) {
    if (cuerpo.validationErrors && typeof cuerpo.validationErrors === 'object') {
      for (const [campo, mensaje] of Object.entries(cuerpo.validationErrors as Record<string, unknown>)) {
        if (typeof mensaje === 'string') resultado.campos[campo] = mensaje;
      }
    }
    if (/vigencia\s*fin/i.test(mensajeServidor) || mensajeServidor.includes('vigenciaFin')) {
      resultado.campos['vigenciaFin'] = 'La fecha de fin debe ser posterior a la de inicio.';
    } else if (/imagen|svg/i.test(mensajeServidor)) {
      resultado.campos['imagen'] = mensajeServidor;
    }
    resultado.mensaje = Object.keys(resultado.campos).length
      ? 'Revise los campos señalados e intente de nuevo.'
      : mensajeServidor || 'Los datos enviados no son válidos. Revíselos e intente de nuevo.';
    return resultado;
  }

  resultado.mensaje = 'No fue posible completar la operación. Intente de nuevo en unos minutos.';
  return resultado;
}
