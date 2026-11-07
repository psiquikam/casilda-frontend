import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { AlmaApiClient } from '../shared/http/alma-api.client';
import { RUTAS_MOCK_APH } from './aph.handlers';
import { almaMockStore } from './alma-mock-store';
import { GrupoMockAlma, PeticionMock, RutaMock } from './alma-mock-tipos';

/**
 * Servidor simulado de Línea Alma (H-0.3): atiende las peticiones a `{apiBaseUrl}/alma/…` con
 * los manejadores que replican el contrato, **sin tocar los servicios ni los componentes**.
 *
 * Un interruptor por grupo (`environment.lineaAlma.mocks`): con `false` la petición sale a red
 * normalmente (H-3.4: pasar APH a «real» es cambiar banderas, no código). Lo que ningún
 * manejador conoce también sale a red, para no esconder un endpoint real con un 404 inventado.
 *
 * Cada submódulo suma sus rutas aquí: `RUTAS_MOCK_APH` (Hinara) y, cuando exista,
 * `RUTAS_MOCK_PSICOLOGIA` (Jonathan, `psicologia.handlers.ts`).
 */
const TODAS_LAS_RUTAS: readonly RutaMock[] = [...RUTAS_MOCK_APH];

const LATENCIA_MS = 250;

function interruptores(): Record<GrupoMockAlma, boolean> {
  return environment.lineaAlma.mocks as Record<GrupoMockAlma, boolean>;
}

export const almaMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(AlmaApiClient.PREFIJO)) return next(req);

  const ruta = req.url.slice(AlmaApiClient.PREFIJO.length).split('?')[0];
  const candidata = TODAS_LAS_RUTAS.find((r) => r.metodo === req.method && r.patron.test(ruta));
  if (!candidata || !interruptores()[candidata.grupo]) return next(req);

  const auth = inject(AuthService);
  const peticion: PeticionMock = {
    metodo: req.method,
    ruta,
    query: new URLSearchParams(req.params.keys().flatMap((k) => (req.params.getAll(k) ?? []).map((v) => [k, v] as [string, string]))),
    cuerpo: req.body,
    usuario: auth.currentUser?.nombre ?? 'Técnico APH (prueba)',
    parametros: (ruta.match(candidata.patron) ?? []).slice(1)
  };

  const respuesta = candidata.manejador(peticion, almaMockStore);
  const salida: Observable<never | HttpResponse<unknown>> =
    respuesta.estado >= 400
      ? throwError(() => new HttpErrorResponse({ status: respuesta.estado, error: respuesta.cuerpo, url: req.url }))
      : of(new HttpResponse({ status: respuesta.estado, body: respuesta.cuerpo, url: req.url }));
  return salida.pipe(delay(LATENCIA_MS));
};
