import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ParametrosSpyb = Record<string, string | number | boolean | null | undefined>;

/**
 * Cliente HTTP para Seguridad a Personas y Bienes (SPyB).
 * Antepone `${environment.apiBaseUrl}/seguridad` y gestiona parámetros y headers.
 * Funciona indistintamente contra backend real o mediante el interceptor mock.
 */
@Injectable({ providedIn: 'root' })
export class SpybApiClient {
  private readonly http = inject(HttpClient);
  static readonly PREFIJO = `${environment.apiBaseUrl}/seguridad`;

  get<T>(ruta: string, parametros?: ParametrosSpyb): Observable<T> {
    return this.http.get<T>(this.url(ruta), { params: this.params(parametros) });
  }

  post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<T>(this.url(ruta), cuerpo);
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(this.url(ruta), cuerpo);
  }

  patch<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.patch<T>(this.url(ruta), cuerpo);
  }

  delete<T>(ruta: string): Observable<T> {
    return this.http.delete<T>(this.url(ruta));
  }

  private url(ruta: string): string {
    return `${SpybApiClient.PREFIJO}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  }

  private params(parametros?: ParametrosSpyb): HttpParams {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(parametros ?? {})) {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return params;
  }
}

