import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { MaestroDto } from './listas.service';
import { RESPALDO_MAESTROS_VBG } from '../core/catalogos/respaldo-maestros-vbg';
import { NotificacionService } from '../core/a11y/notificacion.service';

/**
 * Catálogos del módulo Equipo de Atención (`registro-caso`, `registro-atencion`
 * y sus modales).
 *
 * Antes cada componente duplicaba un método privado `obtenerMaestro(endpoint)`
 * idéntico. Se extrae aquí porque es funcionalidad repetida entre los dos
 * formularios principales (mismo criterio que para una sección de plantilla
 * idéntica), y porque es el punto natural para el cambio de proveedor:
 *
 * - **Modo de demostración** (`environment.datosDemostracion`): no se llama
 *   al backend. El catálogo sale de `RESPALDO_MAESTROS_VBG`
 *   (`core/catalogos/respaldo-maestros-vbg.ts`), con las etiquetas literales
 *   de la matriz donde ella gobierna el contenido.
 * - **Modo real**: se llama al backend igual que antes; si falla, cae al
 *   respaldo y avisa con `NotificacionService`. Las rutas y tipos de servicio
 *   no usan respaldo en modo real, para no enviar identificadores ficticios.
 *
 * El backend sigue siendo la fuente de los **códigos** fuera del modo de
 * demostración: aquí no se reetiquetan sus respuestas. Homologar sus
 * catálogos con el árbol de la matriz requiere coordinación con el equipo de
 * backend (ver `docs/contratos/GLOSARIO_VBG.md`).
 */
@Injectable({ providedIn: 'root' })
export class MaestrosVbgService {
  private readonly http = inject(HttpClient);
  private readonly notificacion = inject(NotificacionService);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  /**
   * Catálogo por endpoint relativo (p. ej. `'vinculos-udea'`,
   * `'modalidades-violencia/tipo/3'`).
   */
  obtenerCatalogo(endpoint: string): Observable<MaestroDto[]> {
    const respaldo = RESPALDO_MAESTROS_VBG[endpoint] ?? [];

    if (environment.datosDemostracion) {
      return of(respaldo);
    }

    return this.http.get<MaestroDto[]>(`${this.maestrosUrl}/${endpoint}`).pipe(
      catchError((error) => {
        if (['rutas-internas', 'rutas-externas', 'tipos-servicio', 'actividades-misionales', 'formas-ocurrencia', 'lugares-ocurrencia'].includes(endpoint)) {
          this.notificacion.error(`No fue posible cargar «${endpoint}» desde el servidor.`, error);
          return of([]);
        }
        if (respaldo.length > 0) {
          this.notificacion.error(
            `No fue posible cargar «${endpoint}» desde el servidor. Se muestran datos de respaldo.`,
            error
          );
        } else {
          this.notificacion.error(
            `No fue posible cargar «${endpoint}» desde el servidor.`,
            error
          );
        }
        return of(respaldo);
      })
    );
  }
}
