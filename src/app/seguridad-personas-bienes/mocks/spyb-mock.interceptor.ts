import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SpybApiClient } from '../services/spyb-api.client';
import { RUTAS_MOCK_SPYB } from './spyb.handlers';
import { GrupoMockSpyb, PeticionMockSpyb } from './spyb-mock-tipos';

const LATENCIA_MS = 200;

function interruptoresSpyb(): Record<GrupoMockSpyb, boolean> {
  const cfg = (environment as unknown as { seguridadPyB?: { mocks?: Record<GrupoMockSpyb, boolean> } }).seguridadPyB?.mocks;
  if (!cfg) {
    // Por defecto todos los mocks activos si no está especificado
    return {
      catalogos: true,
      registros: true,
      bandejaAnalista: true,
      medidas: true,
      ordenes: true,
      camaras: true,
      remisiones: true,
      indicadores: true
    };
  }
  return cfg;
}

export const spybMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(SpybApiClient.PREFIJO)) {
    return next(req);
  }

  const ruta = req.url.slice(SpybApiClient.PREFIJO.length).split('?')[0];
  const candidata = RUTAS_MOCK_SPYB.find((r) => r.metodo === req.method && r.patron.test(ruta));

  if (!candidata || !interruptoresSpyb()[candidata.grupo]) {
    return next(req);
  }

  const auth = inject(AuthService);
  const peticion: PeticionMockSpyb = {
    metodo: req.method,
    ruta,
    query: new URLSearchParams(req.params.keys().flatMap((k) => (req.params.getAll(k) ?? []).map((v) => [k, v] as [string, string]))),
    cuerpo: req.body,
    usuario: auth.currentUser?.nombre ?? 'Yeison (Analista de Riesgos)',
    parametros: (ruta.match(candidata.patron) ?? []).slice(1)
  };

  const respuesta = candidata.manejador(peticion, null);

  const salida: Observable<never | HttpResponse<unknown>> =
    respuesta.estado >= 400
      ? throwError(() => new HttpErrorResponse({ status: respuesta.estado, error: respuesta.cuerpo, url: req.url }))
      : of(new HttpResponse({ status: respuesta.estado, body: respuesta.cuerpo, url: req.url }));

  return salida.pipe(delay(LATENCIA_MS));
};

