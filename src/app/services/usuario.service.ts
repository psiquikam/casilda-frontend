import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioDto {
  id: number;
  nombre: string;
  email: string;
  idRol: number;
  nombreRol: string;
  activo: boolean;
}

export interface UsuarioUpsertDto {
  nombre: string;
  email: string;
  password?: string;
  idRol: number;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = `${environment.apiBaseUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<UsuarioDto[]> {
    return this.http.get<UsuarioDto[]>(this.apiUrl);
  }

  crear(request: UsuarioUpsertDto): Observable<UsuarioDto> {
    return this.http.post<UsuarioDto>(this.apiUrl, request);
  }

  actualizar(id: number, request: UsuarioUpsertDto): Observable<UsuarioDto> {
    return this.http.put<UsuarioDto>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cambiarEstado(id: number, activo: boolean): Observable<UsuarioDto> {
    return this.http.patch<UsuarioDto>(`${this.apiUrl}/${id}/estado`, { activo });
  }
}
