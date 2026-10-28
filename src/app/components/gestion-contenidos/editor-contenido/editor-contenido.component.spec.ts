import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of, throwError } from 'rxjs';

import { EditorContenidoComponent } from './editor-contenido.component';
import { ContenidoAdminDto, ContenidoAdminService } from '../../../services/contenido-admin.service';
import { NotificacionService } from '../../../core/a11y/notificacion.service';

describe('EditorContenidoComponent', () => {
  let fixture: ComponentFixture<EditorContenidoComponent>;
  let componente: EditorContenidoComponent;
  let servicio: jasmine.SpyObj<ContenidoAdminService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;
  let router: Router;

  const existente: ContenidoAdminDto = {
    id: 4,
    imagen: '/contenidos/imagenes/abc.svg',
    titulo: 'Línea Alma',
    contenido: 'Escucha y apoyo psicológico.',
    vigenciaInicio: '2026-10-25T14:15:48.887Z',
    vigenciaFin: null,
    enlace: '/formulario-anonimo',
    seccion: 'acciones',
    orden: 1
  };

  const hermanos: ContenidoAdminDto[] = [
    { ...existente, id: 1, orden: 0 },
    { ...existente, id: 2, orden: 3 },
    { ...existente, id: 3, orden: 7, seccion: 'informacion' }
  ];

  const crear = async (parametros: { id?: string; seccion?: string } = {}) => {
    servicio = jasmine.createSpyObj<ContenidoAdminService>('ContenidoAdminService', [
      'listarTodos',
      'obtenerPorId',
      'crear',
      'actualizar'
    ]);
    servicio.listarTodos.and.returnValue(of(hermanos));
    servicio.obtenerPorId.and.returnValue(of(existente));
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', ['error', 'exito']);

    const ruta = {
      snapshot: {
        paramMap: convertToParamMap(parametros.id ? { id: parametros.id } : {}),
        queryParamMap: convertToParamMap(parametros.seccion ? { seccion: parametros.seccion } : {})
      }
    };

    await TestBed.configureTestingModule({
      imports: [EditorContenidoComponent, MatIconTestingModule],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        { provide: ActivatedRoute, useValue: ruta },
        { provide: ContenidoAdminService, useValue: servicio },
        { provide: NotificacionService, useValue: notificacion }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(EditorContenidoComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  };

  const llenarValido = () => {
    componente.form.patchValue({ titulo: '  Atención jurídica  ', contenido: ' Orientación legal gratuita. ' });
    componente.form.markAsDirty();
  };

  describe('al crear', () => {
    it('toma la sección de la URL y sugiere la siguiente posición libre', async () => {
      await crear({ seccion: 'informacion' });

      expect(componente.modo()).toBe('crear');
      expect(componente.form.controls.seccion.value).toBe('informacion');
      expect(componente.form.controls.orden.value).toBe(8);

      componente.form.controls.seccion.setValue('acciones');
      expect(componente.form.controls.orden.value).toBe(4);
    });

    it('no pisa una posición que la persona ya escribió', async () => {
      await crear();
      componente.form.controls.orden.setValue(20);
      componente.form.controls.orden.markAsDirty();

      componente.form.controls.seccion.setValue('informacion');

      expect(componente.form.controls.orden.value).toBe(20);
    });

    it('no envía un formulario inválido y lista los campos en el resumen de errores', async () => {
      await crear();

      componente.form.controls.titulo.setValue('   ');
      componente.guardar();

      expect(servicio.crear).not.toHaveBeenCalled();
      const etiquetas = componente.errores().map((e) => e.etiqueta);
      expect(etiquetas).toEqual(['Título', 'Texto de la tarjeta']);
      expect(componente.errores()[0].id).toBe('editor-titulo');
    });

    it('guarda con textos recortados, inicio a medianoche y sin fecha de fin', async () => {
      await crear();
      servicio.crear.and.returnValue(of({ ...existente, id: 10, titulo: 'Atención jurídica' }));
      llenarValido();

      componente.guardar();

      const [datos, imagen] = servicio.crear.calls.mostRecent().args;
      expect(datos.titulo).toBe('Atención jurídica');
      expect(datos.contenido).toBe('Orientación legal gratuita.');
      expect(datos.vigenciaFin).toBeNull();
      expect(new Date(datos.vigenciaInicio).getHours()).toBe(0);
      expect(imagen).toBeNull();
      expect(notificacion.exito).toHaveBeenCalledWith(jasmine.stringContaining('Se creó «Atención jurídica»'));
      expect(router.navigateByUrl).toHaveBeenCalledWith('/gestion-contenidos');
      expect(componente.tieneCambiosPendientes()).toBeFalse();
    });

    it('guarda la fecha de retiro al final del día elegido', async () => {
      await crear();
      servicio.crear.and.returnValue(of(existente));
      llenarValido();
      componente.form.controls.vigenciaFin.setValue(new Date(2030, 0, 15, 9, 0));

      componente.guardar();

      const fin = new Date(servicio.crear.calls.mostRecent().args[0].vigenciaFin!);
      expect([fin.getDate(), fin.getHours(), fin.getMinutes()]).toEqual([15, 23, 59]);
    });

    it('marca en su campo los errores de validación que devuelve el backend', async () => {
      await crear();
      servicio.crear.and.returnValue(
        throwError(() => new HttpErrorResponse({
          status: 400,
          error: { validationErrors: { titulo: 'El título debe tener máximo 160 caracteres' } }
        }))
      );
      llenarValido();

      componente.guardar();

      expect(componente.form.controls.titulo.errors).toEqual({ servidor: 'El título debe tener máximo 160 caracteres' });
      expect(componente.errores()[0].mensaje).toBe('El título debe tener máximo 160 caracteres');
      expect(componente.guardando()).toBeFalse();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('lleva al resumen el rechazo de la imagen por parte del servidor', async () => {
      await crear();
      servicio.crear.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'El archivo SVG no es válido o está corrupto' } }))
      );
      llenarValido();

      componente.guardar();

      expect(componente.errorImagen()).toContain('SVG');
      expect(componente.errores().map((e) => e.id)).toEqual(['editor-imagen']);
    });
  });

  describe('vista previa e imagen', () => {
    it('refleja lo escrito y la imagen recién elegida', async () => {
      await crear();
      spyOn(URL, 'createObjectURL').and.returnValue('blob:vista-local');
      spyOn(URL, 'revokeObjectURL');

      componente.form.controls.titulo.setValue('Nueva tarjeta');
      componente.seleccionarImagen(new File(['x'], 'icono.png', { type: 'image/png' }));

      expect(componente.vistaPrevia().titulo).toBe('Nueva tarjeta');
      expect(componente.vistaPrevia().imagen).toBe('blob:vista-local');
      expect(componente.tieneCambiosPendientes()).toBeTrue();
    });

    it('con los campos vacíos muestra textos guía en lugar de una tarjeta en blanco', async () => {
      await crear();
      expect(componente.vistaPrevia().titulo).toBe('Título de la tarjeta');
    });

    it('anticipa si el contenido quedará programado', async () => {
      await crear();
      componente.form.controls.vigenciaInicio.setValue(new Date(2999, 0, 1));

      expect(componente.publicacionPrevista()?.estado).toBe('programado');
    });
  });

  describe('al editar', () => {
    it('carga el contenido sin marcar cambios pendientes', async () => {
      await crear({ id: '4' });

      expect(servicio.obtenerPorId).toHaveBeenCalledWith(4);
      expect(componente.modo()).toBe('editar');
      expect(componente.form.controls.titulo.value).toBe('Línea Alma');
      expect(componente.tieneCambiosPendientes()).toBeFalse();
      expect(servicio.listarTodos).not.toHaveBeenCalled();
    });

    it('conserva el instante original de inicio si no se cambió el día, y pide quitar la imagen', async () => {
      await crear({ id: '4' });
      servicio.actualizar.and.returnValue(of(existente));
      componente.form.controls.titulo.setValue('Línea Alma UdeA');
      componente.quitarImagenActual();

      componente.guardar();

      const [id, datos, imagen] = servicio.actualizar.calls.mostRecent().args;
      expect(id).toBe(4);
      expect(datos.vigenciaInicio).toBe(existente.vigenciaInicio);
      expect(imagen).toEqual({ archivo: null, eliminar: true });
    });

    it('si el contenido ya no existe, avisa y vuelve al listado', async () => {
      await crear({ id: '4' });
      servicio.obtenerPorId.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

      componente.cargarContenido();

      expect(notificacion.error).toHaveBeenCalledWith(jasmine.stringContaining('ya no existe'), jasmine.anything());
      expect(router.navigateByUrl).toHaveBeenCalledWith('/gestion-contenidos');
    });

    it('con un id inválido en la URL vuelve al listado sin consultar', async () => {
      await crear({ id: 'abc' });

      expect(servicio.obtenerPorId).not.toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/gestion-contenidos');
    });

    it('conserva como opción un enlace que no está en el catálogo de destinos', async () => {
      await crear({ id: '4' });
      componente.original.set({ ...existente, enlace: '/ruta-vieja' });

      expect(componente.destinos().some((d) => d.ruta === '/ruta-vieja')).toBeTrue();
    });
  });
});
