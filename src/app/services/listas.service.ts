import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, forkJoin, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { NotificacionService } from '../core/a11y/notificacion.service';

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

type ListaKey =
  | 'tiposSolicitud'
  | 'campus'
  | 'unidadesAdministrativas'
  | 'unidadesAcademicas'
  | 'tiposDocumento'
  | 'identidadesGenero'
  | 'cargos'
  | 'medioSolicitud';

export const DEFAULT_MAESTROS: Record<ListaKey, MaestroDto[]> = {
  tiposSolicitud: [
    { id: 1, codigo: 'ACOMP', nombre: 'Acompañamiento Psicosocial' },
    { id: 2, codigo: 'JURID', nombre: 'Asesoría Jurídica' },
    { id: 3, codigo: 'INTEG', nombre: 'Atención Integral VBG' }
  ],
  campus: [
    { id: 1, codigo: 'CU', nombre: 'Medellín - Ciudad Universitaria' },
    { id: 2, codigo: 'ROB', nombre: 'Robledo' },
    { id: 3, codigo: 'ORI', nombre: 'Seccional Oriente' },
    { id: 4, codigo: 'URA', nombre: 'Seccional Urabá' }
  ],
  unidadesAdministrativas: [
    { id: 1, codigo: 'VIC_DOC', nombre: 'Vicerrectoría de Docencia' },
    { id: 2, codigo: 'BIENESTAR', nombre: 'Dirección de Bienestar Universitario' },
    { id: 3, codigo: 'GEST_HUM', nombre: 'Gestión del Talento Humano' }
  ],
  unidadesAcademicas: [
    { id: 1, codigo: 'FAC_MED', nombre: 'Facultad de Medicina' },
    { id: 2, codigo: 'FAC_ING', nombre: 'Facultad de Ingeniería' },
    { id: 3, codigo: 'FAC_EDU', nombre: 'Facultad de Educación' },
    { id: 4, codigo: 'FAC_SOC', nombre: 'Facultad de Ciencias Sociales y Humanas' }
  ],
  tiposDocumento: [
    { id: 1, codigo: 'CC', nombre: 'Cédula de Ciudadanía' },
    { id: 2, codigo: 'TI', nombre: 'Tarjeta de Identidad' },
    { id: 3, codigo: 'CE', nombre: 'Cédula de Extranjería' },
    { id: 4, codigo: 'PAS', nombre: 'Pasaporte' }
  ],
  identidadesGenero: [
    { id: 1, codigo: 'MUJ', nombre: 'Mujer (Cisgénero / Trans)' },
    { id: 2, codigo: 'HOM', nombre: 'Hombre (Cisgénero / Trans)' },
    { id: 3, codigo: 'NB', nombre: 'Persona No Binaria' },
    { id: 4, codigo: 'DIV', nombre: 'Disidencias / Otras' }
  ],
  cargos: [
    { id: 1, codigo: 'EST', nombre: 'Estudiante' },
    { id: 2, codigo: 'DOC', nombre: 'Docente' },
    { id: 3, codigo: 'ADM', nombre: 'Empleado Administrativo' },
    { id: 4, codigo: 'CON', nombre: 'Contratista / Egresado' }
  ],
  medioSolicitud: [
    { id: 1, codigo: 'PRES', nombre: 'Presencial en Punto de Atención' },
    { id: 2, codigo: 'TEL', nombre: 'Línea Telefónica Institucional' },
    { id: 3, codigo: 'WEB', nombre: 'Portal Web CASILDA' },
    { id: 4, codigo: 'REM', nombre: 'Remisión Interna UdeA' }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class ListasService {
  private readonly notificacion = inject(NotificacionService);
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
    tiposSolicitud: [...DEFAULT_MAESTROS.tiposSolicitud],
    campus: [...DEFAULT_MAESTROS.campus],
    unidadesAdministrativas: [...DEFAULT_MAESTROS.unidadesAdministrativas],
    unidadesAcademicas: [...DEFAULT_MAESTROS.unidadesAcademicas],
    tiposDocumento: [...DEFAULT_MAESTROS.tiposDocumento],
    identidadesGenero: [...DEFAULT_MAESTROS.identidadesGenero],
    cargos: [...DEFAULT_MAESTROS.cargos],
    medioSolicitud: [...DEFAULT_MAESTROS.medioSolicitud]
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
    }).subscribe((result) => {
      this.data = result;
      this.listasSubject.next(this.data);
    });
  }

  private obtenerListaDesdeEndpoint(lista: ListaKey): Observable<MaestroDto[]> {
    const endpoint = this.endpointByList[lista];
    const fallback = DEFAULT_MAESTROS[lista] || [];
    return this.http.get<MaestroDto[]>(`${this.apiBaseUrl}/${endpoint}`).pipe(
      catchError(() => of(fallback))
    );
  }

  obtenerMaestro(endpoint: string): Observable<MaestroDto[]> {
    const matchedKey = (Object.keys(this.endpointByList) as ListaKey[]).find(
      (k) => this.endpointByList[k] === endpoint
    );
    const fallback = matchedKey ? DEFAULT_MAESTROS[matchedKey] : [];

    return this.http.get<MaestroDto[]>(`${this.apiBaseUrl}/${endpoint}`).pipe(
      catchError(() => of(fallback))
    );
  }

  obtenerListaPaginada(lista: string, page: number, size: number): Observable<PagedResponseDto<MaestroDto>> {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey] || lista;
    const fallbackItems = DEFAULT_MAESTROS[listaKey] || [];
    const params = new HttpParams().set('page', String(page)).set('size', String(size));

    return this.http.get<PagedResponseDto<MaestroDto>>(`${this.apiBaseUrl}/catalogos/${endpoint}/paginado`, { params }).pipe(
      catchError(() => {
        const start = page * size;
        const paged = fallbackItems.slice(start, start + size);
        return of({
          content: paged,
          totalElements: fallbackItems.length,
          totalPages: Math.ceil(fallbackItems.length / size) || 1,
          size,
          number: page
        });
      })
    );
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

  agregarItem(lista: string, nombre: string, codigo?: string): void {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey];
    if (!endpoint || !nombre.trim()) return;

    this.agregarItem$(lista, nombre, codigo).subscribe({
      next: () => this.cargarListas(),
      error: (error) => this.notificacion.error(`No fue posible agregar el elemento a «${listaKey}». Intenta de nuevo.`, error)
    });
  }

  eliminarItem(lista: string, id: number): void {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey];
    if (!endpoint || !id) return;

    this.eliminarItem$(lista, id).subscribe({
      next: () => this.cargarListas(),
      error: (error) => this.notificacion.error(`No fue posible eliminar el elemento de «${listaKey}». Intenta de nuevo.`, error)
    });
  }

  editarItem(lista: string, id: number, nombre: string, codigo?: string): void {
    const listaKey = lista as ListaKey;
    const endpoint = this.endpointByList[listaKey];
    if (!endpoint || !id || !nombre.trim()) return;

    this.editarItem$(lista, id, nombre, codigo).subscribe({
      next: () => this.cargarListas(),
      error: (error) => this.notificacion.error(`No fue posible guardar la edición en «${listaKey}». Intenta de nuevo.`, error)
    });
  }

  obtenerInstanciasRemision(tipoRemisionId?: number): Observable<MaestroDto[]> {
    const params: Record<string, string> = {};
    if (tipoRemisionId) {
      params['tipoRemisionId'] = tipoRemisionId.toString();
    }
    return this.http.get<MaestroDto[]>(`${this.apiBaseUrl}/instancias-remision`, { params });
  }
}
