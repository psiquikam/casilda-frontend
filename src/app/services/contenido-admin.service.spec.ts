import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../environments/environment';
import {
  ContenidoAdminDto,
  ContenidoAdminService,
  ContenidoRequestDto,
  interpretarErrorContenido
} from './contenido-admin.service';

describe('ContenidoAdminService', () => {
  let service: ContenidoAdminService;
  let http: HttpTestingController;
  const url = `${environment.apiBaseUrl}/contenidos`;

  const contenido = (id: number): ContenidoAdminDto => ({
    id,
    imagen: null,
    titulo: `Contenido ${id}`,
    contenido: 'Texto',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    enlace: null,
    seccion: 'acciones',
    orden: id
  });

  const datos: ContenidoRequestDto = {
    titulo: 'Línea Alma',
    contenido: 'Escucha y apoyo psicológico.',
    vigenciaInicio: '2026-11-01T05:00:00.000Z',
    vigenciaFin: null,
    enlace: '/formulario-anonimo',
    seccion: 'acciones',
    orden: 2
  };

  const pagina = (content: ContenidoAdminDto[], number: number, totalPages: number) => ({
    content,
    number,
    totalPages,
    size: 100,
    totalElements: totalPages * content.length
  });

  /** Lee la parte JSON del multipart tal como la recibiría el backend. */
  const leerParteContenido = async (cuerpo: FormData): Promise<unknown> => {
    const parte = cuerpo.get('contenido') as Blob;
    expect(parte.type).toBe('application/json');
    return JSON.parse(await parte.text());
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ContenidoAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listarTodos()', () => {
    it('con una sola página hace una única petición', () => {
      let resultado: ContenidoAdminDto[] = [];
      service.listarTodos().subscribe({ next: (r) => (resultado = r), error: fail });

      const req = http.expectOne((r) => r.url === url);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('100');
      req.flush(pagina([contenido(1), contenido(2)], 0, 1));

      expect(resultado.map((c) => c.id)).toEqual([1, 2]);
    });

    it('si hay más páginas las pide y conserva el orden del backend', () => {
      let resultado: ContenidoAdminDto[] = [];
      service.listarTodos().subscribe({ next: (r) => (resultado = r), error: fail });

      http.expectOne((r) => r.params.get('page') === '0').flush(pagina([contenido(1)], 0, 3));
      http.expectOne((r) => r.params.get('page') === '1').flush(pagina([contenido(2)], 1, 3));
      http.expectOne((r) => r.params.get('page') === '2').flush(pagina([contenido(3)], 2, 3));

      expect(resultado.map((c) => c.id)).toEqual([1, 2, 3]);
    });
  });

  it('crear() envía multipart con la parte JSON tipada y la imagen', async () => {
    const imagen = new File(['<svg/>'], 'icono.svg', { type: 'image/svg+xml' });
    service.crear(datos, imagen).subscribe({ error: fail });

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    const cuerpo = req.request.body as FormData;
    expect(await leerParteContenido(cuerpo)).toEqual(datos);
    expect((cuerpo.get('imagen') as File).name).toBe('icono.svg');
    // Sin Content-Type explícito: el navegador agrega el boundary del multipart.
    expect(req.request.headers.has('Content-Type')).toBeFalse();
    req.flush(contenido(9), { status: 201, statusText: 'Created' });
  });

  it('crear() sin imagen no envía la parte imagen', () => {
    service.crear(datos).subscribe({ error: fail });

    const req = http.expectOne(url);
    expect((req.request.body as FormData).has('imagen')).toBeFalse();
    req.flush(contenido(9));
  });

  describe('actualizar()', () => {
    it('sin cambios de imagen conserva la actual', () => {
      service.actualizar(4, datos).subscribe({ error: fail });

      const req = http.expectOne((r) => r.url === `${url}/4`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.params.has('eliminarImagen')).toBeFalse();
      expect((req.request.body as FormData).has('imagen')).toBeFalse();
      req.flush(contenido(4));
    });

    it('pide eliminar la imagen con el parámetro eliminarImagen', () => {
      service.actualizar(4, datos, { eliminar: true }).subscribe({ error: fail });

      const req = http.expectOne((r) => r.url === `${url}/4`);
      expect(req.request.params.get('eliminarImagen')).toBe('true');
      req.flush(contenido(4));
    });

    it('con archivo nuevo lo envía y no pide eliminar', () => {
      const imagen = new File(['png'], 'nueva.png', { type: 'image/png' });
      service.actualizar(4, datos, { archivo: imagen, eliminar: true }).subscribe({ error: fail });

      const req = http.expectOne((r) => r.url === `${url}/4`);
      expect(req.request.params.has('eliminarImagen')).toBeFalse();
      expect((req.request.body as FormData).get('imagen')).toBeTruthy();
      req.flush(contenido(4));
    });
  });

  it('obtenerPorId() y eliminar() usan la ruta del recurso', () => {
    service.obtenerPorId(7).subscribe({ error: fail });
    http.expectOne({ url: `${url}/7`, method: 'GET' }).flush(contenido(7));

    service.eliminar(7).subscribe({ error: fail });
    http.expectOne({ url: `${url}/7`, method: 'DELETE' }).flush(null, { status: 204, statusText: 'No Content' });
  });
});

describe('interpretarErrorContenido()', () => {
  const error = (status: number, cuerpo: unknown = null) =>
    new HttpErrorResponse({ status, error: cuerpo, url: '/contenidos' });

  it('lleva los errores de validación del backend a cada campo', () => {
    const r = interpretarErrorContenido(
      error(400, { message: 'Error de validación en los campos', validationErrors: { titulo: 'El título es obligatorio' } })
    );
    expect(r.campos).toEqual({ titulo: 'El título es obligatorio' });
    expect(r.mensaje).toContain('Revise los campos');
  });

  it('reescribe el mensaje técnico de vigencia y lo asocia a la fecha de fin', () => {
    const r = interpretarErrorContenido(error(400, { message: 'vigenciaFin debe ser posterior a vigenciaInicio' }));
    expect(r.campos['vigenciaFin']).toBe('La fecha de fin debe ser posterior a la de inicio.');
  });

  it('asocia a la imagen los rechazos del archivo', () => {
    const mensaje = 'Formato de imagen no soportado. Solo se permite PNG, WEBP o SVG';
    expect(interpretarErrorContenido(error(400, { message: mensaje })).campos['imagen']).toBe(mensaje);
    expect(interpretarErrorContenido(error(413)).campos['imagen']).toContain('400 KB');
  });

  it('distingue la falta de conexión, el permiso y el registro inexistente', () => {
    expect(interpretarErrorContenido(error(0)).mensaje).toContain('conexión');
    expect(interpretarErrorContenido(error(403)).mensaje).toContain('permiso');
    const noEncontrado = interpretarErrorContenido(error(404));
    expect(noEncontrado.noEncontrado).toBeTrue();
  });

  it('da un mensaje genérico ante cualquier otro fallo, sin exponer detalles técnicos', () => {
    const r = interpretarErrorContenido(error(500, { message: 'NullPointerException en ContenidoService' }));
    expect(r.mensaje).not.toContain('NullPointer');
    expect(r.campos).toEqual({});
  });
});
