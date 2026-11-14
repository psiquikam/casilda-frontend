import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ErrorAlma, interpretarErrorAlma } from './alma-error';

export type ParametrosAlma = Record<string, string | number | boolean | null | undefined>;

/**
 * Cliente HTTP de Línea Alma (H-0.2). Antepone `{apiBaseUrl}/alma` y entrega los errores ya
 * traducidos a `ErrorAlma`. El JWT y el manejo de 401 los pone el `authInterceptor` global; los
 * mocks (si el interruptor está activo) los atiende `almaMockInterceptor` **antes** de salir a red,
 * por eso este cliente es el mismo en modo simulado y real.
 */
@Injectable({ providedIn: 'root' })
export class AlmaApiClient {
  private readonly http = inject(HttpClient);
  static readonly PREFIJO = `${environment.apiBaseUrl}/alma`;

  get<T>(ruta: string, parametros?: ParametrosAlma): Observable<T> {
    return this.http.get<T>(this.url(ruta), { params: this.params(parametros) }).pipe(this.traducir());
  }

  post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<T>(this.url(ruta), cuerpo).pipe(this.traducir());
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(this.url(ruta), cuerpo).pipe(this.traducir());
  }

  patch<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.patch<T>(this.url(ruta), cuerpo).pipe(this.traducir());
  }

  /** Descarga binaria (p. ej. `GET /casos/{n}/pdf`, J-1.6). El servidor responde el archivo; la UI lo ofrece para guardar. */
  descargar(ruta: string, parametros?: ParametrosAlma): Observable<Blob> {
    return this.http.get(this.url(ruta), { params: this.params(parametros), responseType: 'blob' }).pipe(this.traducir<Blob>());
  }

  private url(ruta: string): string {
    return `${AlmaApiClient.PREFIJO}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  }

  private params(parametros?: ParametrosAlma): HttpParams {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(parametros ?? {})) {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return params;
  }

  private traducir<T>() {
    return catchError<T, Observable<never>>((error: unknown) => throwError((): ErrorAlma => interpretarErrorAlma(error)));
  }
}
