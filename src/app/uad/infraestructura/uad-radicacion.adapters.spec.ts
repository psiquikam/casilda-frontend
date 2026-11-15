import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DialogoService } from '../../core/a11y/dialogo.service';
import { authInterceptor } from '../../services/auth.interceptor';
import { AuthService } from '../../services/auth.service';
import { RadicacionNdaResponse } from '../contratos/uad-api.types';
import { ErrorUad } from './uad-error';
import { UadRadicacionHttpAdapter } from './uad-radicacion-http.adapter';
import { UAD_MOCK_LATENCIA_MS, UadMockAdapter } from './mock/uad-mock.adapter';
import { UadRadicacionMockAdapter } from './mock/uad-radicacion-mock.adapter';
import { UadMockStore, UadSimulacionService } from './mock/uad-mock-store';

const RELATO = { descripcionHechos: 'Relato ficticio de prueba con detalle suficiente.', lugarOcurrencia: null, presuntoResponsable: null, vinculacionDeclarada: null };

describe('UAD · radicación de queja anónima', () => {
  describe('adaptador HTTP', () => {
    let http: HttpTestingController;
    let api: UadRadicacionHttpAdapter;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          UadRadicacionHttpAdapter,
          provideHttpClient(withInterceptors([authInterceptor])),
          provideHttpClientTesting(),
          // Hay una sesión abierta: aun así la queja no debe llevar el token.
          { provide: AuthService, useValue: { getToken: () => 'token-de-sesion', logout: jasmine.createSpy('logout') } },
          { provide: DialogoService, useValue: { aviso: () => of(undefined) } }
        ]
      });
      http = TestBed.inject(HttpTestingController);
      api = TestBed.inject(UadRadicacionHttpAdapter);
    });

    afterEach(() => http.verify());

    it('envía POST /uad/noticias-anonimas sin Authorization aunque haya sesión', () => {
      let respuesta: RadicacionNdaResponse | undefined;
      api.radicarNoticiaAnonima(RELATO).subscribe((r) => (respuesta = r));
      const req = http.expectOne(`${environment.apiBaseUrl}/uad/noticias-anonimas`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      expect(req.request.body).toEqual(RELATO);
      req.flush({ consecutivo: 'NDA-2026-000030', fechaRecepcion: '2026-11-15T20:00:00Z' }, { status: 201, statusText: 'Created' });
      expect(respuesta?.consecutivo).toBe('NDA-2026-000030');
    });

    it('traduce el 429 del servidor', () => {
      let error: ErrorUad | undefined;
      api.radicarNoticiaAnonima(RELATO).subscribe({ error: (e: ErrorUad) => (error = e) });
      http
        .expectOne(`${environment.apiBaseUrl}/uad/noticias-anonimas`)
        .flush({ status: 429, message: 'x', codigo: 'DEMASIADOS_ENVIOS' }, { status: 429, statusText: 'Too Many Requests' });
      expect(error?.estado).toBe(429);
      expect(error).not.toBeInstanceOf(HttpErrorResponse);
    });
  });

  describe('adaptador mock', () => {
    function crear(roles: string[]) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          UadRadicacionMockAdapter,
          UadMockAdapter,
          UadSimulacionService,
          { provide: UAD_MOCK_LATENCIA_MS, useValue: 0 },
          { provide: AuthService, useValue: { currentUser: { nombre: 'Prueba' }, hasRole: (r: string) => roles.includes(r), isAdmin: () => false } }
        ]
      });
      return { radicacion: TestBed.inject(UadRadicacionMockAdapter), bandeja: TestBed.inject(UadMockAdapter), store: TestBed.inject(UadMockStore) };
    }

    it('asigna un consecutivo NDA del servidor y la deja en la bandeja NDA de ambos equipos', () => {
      const { radicacion, bandeja, store } = crear(['UAD_EQUIPO_4']);
      let respuesta: RadicacionNdaResponse | undefined;
      radicacion.radicarNoticiaAnonima({ ...RELATO, vinculacionDeclarada: 'DOCENTE_CATEDRA' }).subscribe((r) => (respuesta = r));
      expect(respuesta?.consecutivo).toMatch(/^NDA-\d{4}-000023$/);

      let consecutivos: string[] = [];
      bandeja.listarNoticias({ tipo: 'NDA', page: 0, size: 50 }).subscribe((p) => (consecutivos = p.content.map((n) => n.consecutivo)));
      expect(consecutivos).toContain(respuesta!.consecutivo);

      const noticia = store.noticias.find((n) => n.consecutivo === respuesta!.consecutivo)!;
      expect(noticia.estado).toBe('RECIBIDA');
      expect(noticia.origen.tipo).toBe('FORMULARIO_ANONIMO');
      expect(noticia.reportante).toBeNull();
      expect(noticia.telefono).toBeNull();
      expect(noticia.correo).toBeNull();
      expect(noticia.personaClave).toBeNull();
    });

    it('rechaza un relato demasiado corto con error por campo', () => {
      const { radicacion } = crear([]);
      let error: ErrorUad | undefined;
      radicacion.radicarNoticiaAnonima({ ...RELATO, descripcionHechos: 'corto' }).subscribe({ error: (e: ErrorUad) => (error = e) });
      expect(error?.tipo).toBe('validacion');
      expect(error?.camposInvalidos['descripcionHechos']).toBeTruthy();
    });
  });
});
