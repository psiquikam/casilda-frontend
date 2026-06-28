import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MaestroDto {
  id: number;
  codigo?: string | null;
  nombre: string;
}

export interface PagedResponseDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

type ListaKey = 'tiposSolicitud' | 'campus' | 'unidadesAdministrativas' | 'unidadesAcademicas' | 'tiposDocumento' | 'identidadesGenero' | 'cargos' | 'medioSolicitud';

@Injectable({
  providedIn: 'root'
})
export class ListasService {
  private readonly apiBaseUrl = `${environment.apiBaseUrl}/maestros`;
  private readonly endpointByList: Record<ListaKey, string> = {
    tiposSolicitud: 'tipos-solicitud',
    campus: 'campus',
    unidadesAdministrativas: 'unidades-administrativas',
    unidadesAcademicas: 'unidades-academicas',
    tiposDocumento: 'tipos-identificacion',
    identidadesGenero: 'identidades-genero',
    cargos: 'cargos',
    medioSolicitud: 'medio-solicitud'
  };

  private data: Record<ListaKey, MaestroDto[]> = {
    tiposSolicitud: [],
    campus: [],
    unidadesAdministrativas: [],
    unidadesAcademicas: [],
    tiposDocumento: [],
    identidadesGenero: [],
    cargos: [],
    medioSolicitud: []
  };

  private listasSubject = new BehaviorSubject<Record<ListaKey, MaestroDto[]>>(this.data);
  listas$ = this.listasSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.cargarListas();
  }

  private cargarListas(): void {
    forkJoin({
      tiposSolicitud: this.obtenerListaDesdeEndpoint('tiposSolicitud'),
      campus: this.obtenerListaDesdeEndpoint('campus'),
      unidadesAdministrativas: this.obtenerListaDesdeEndpoint('unidadesAdministrativas'),
      unidadesAcademicas: this.obtenerListaDesdeEndpoint('unidadesAcademicas'),
      tiposDocumento: this.obtenerListaDesdeEndpoint('tiposDocumento'),
      identidadesGenero: this.obtenerListaDesdeEndpoint('identidadesGenero'),
      cargos: this.obtenerListaDesdeEndpoint('cargos'),
      medioSolicitud: this.obtenerListaDesdeEndpoint('medioSolicitud')
    }).subscribe(result => {
      this.data = result;
      this.listasSubject.next(this.data);
    });
  }

  private obtenerListaDesdeEndpoint(lista: ListaKey) {
    const endpoint = this.endpointByList[lista];
    return this.http.get<MaestroDto[]>(`${this.apiBaseUrl}/${endpoint}`).pipe(
      catchError((error) => {
        console.error(`Error consultando maestros para ${lista}:`, error);
        return of([] as MaestroDto[]);
      })
    );
  }

  obtenerMaestro(endpoint: string): Observable<MaestroDto[]> {
    return this.http.get<MaestroDto[]>(`${this.apiBaseUrl}/${endpoint}`).pipe(
      catchError((error) => {
        console.error(`Error consultando maestros para endpoint ${endpoint}:`, error);
        return of([] as MaestroDto[]);
      })
    );
  }

  obtenerListaPaginada(lista: string, page: number, size: number): Observable<PagedResponseDto<MaestroDto>> {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey];
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PagedResponseDto<MaestroDto>>(`${this.apiBaseUrl}/catalogos/${endpoint}/paginado`, { params });
  }

  agregarItem$(lista: string, nombre: string, codigo?: string): Observable<MaestroDto> {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey];
    const body: any = { nombre: nombre.trim() };
    if (codigo?.trim()) {
      body['codigo'] = codigo.trim();
    }
    return this.http.post<MaestroDto>(`${this.apiBaseUrl}/${endpoint}`, body);
  }

  eliminarItem$(lista: string, id: number): Observable<void> {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey];
    return this.http.delete<void>(`${this.apiBaseUrl}/${endpoint}/${id}`);
  }

  editarItem$(lista: string, id: number, nombre: string, codigo?: string): Observable<MaestroDto> {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey];
    const body: any = { nombre: nombre.trim() };
    if (codigo !== undefined) {
      body['codigo'] = codigo?.trim() || null;
    }
    return this.http.put<MaestroDto>(`${this.apiBaseUrl}/${endpoint}/${id}`, body);
  }

  agregarItem(lista: string, nombre: string, codigo?: string) {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey];
    if (!endpoint || !nombre.trim()) return;

    this.agregarItem$(lista, nombre, codigo)
      .subscribe({
        next: () => this.cargarListas(),
        error: (error) => console.error(`Error agregando item en ${listaKey}:`, error)
      });
  }

  eliminarItem(lista: string, id: number) {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey];
    if (!endpoint || !id) return;

    this.eliminarItem$(lista, id)
      .subscribe({
        next: () => this.cargarListas(),
        error: (error) => console.error(`Error eliminando item en ${listaKey}:`, error)
      });
  }

  editarItem(lista: string, id: number, nombre: string, codigo?: string) {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey];
    if (!endpoint || !id || !nombre.trim()) return;

    this.editarItem$(lista, id, nombre, codigo)
      .subscribe({
        next: () => this.cargarListas(),
        error: (error) => console.error(`Error editando item en ${listaKey}:`, error)
      });
  }

  obtenerInstanciasRemision(tipoRemisionId?: number): Observable<MaestroDto[]> {
    let params: { [param: string]: string } = {};
    if (tipoRemisionId) {
      params['tipoRemisionId'] = tipoRemisionId.toString();
    }
    return this.http.get<MaestroDto[]>(`${this.apiBaseUrl}/instancias-remision`, { params });
  }
}
