import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of, throwError } from 'rxjs';

import { GestionContenidosComponent } from './gestion-contenidos.component';
import { ContenidoAdminDto, ContenidoAdminService } from '../../services/contenido-admin.service';
import { DialogoService } from '../../core/a11y/dialogo.service';
import { NotificacionService } from '../../core/a11y/notificacion.service';

describe('GestionContenidosComponent', () => {
  let fixture: ComponentFixture<GestionContenidosComponent>;
  let componente: GestionContenidosComponent;
  let servicio: jasmine.SpyObj<ContenidoAdminService>;
  let dialogo: jasmine.SpyObj<DialogoService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;

  const contenido = (id: number, extra: Partial<ContenidoAdminDto>): ContenidoAdminDto => ({
    id,
    imagen: null,
    titulo: `Contenido ${id}`,
    contenido: 'Texto',
    vigenciaInicio: '2026-01-01T00:00:00Z',
    vigenciaFin: null,
    enlace: null,
    seccion: 'acciones',
    orden: id,
    ...extra
  });

  const catalogo: ContenidoAdminDto[] = [
    contenido(1, {}),
    contenido(2, { vigenciaInicio: '2999-01-01T00:00:00Z' }),
    contenido(3, { seccion: 'informacion', vigenciaFin: '2026-02-01T00:00:00Z' })
  ];

  const crear = async (lista: ContenidoAdminDto[] = catalogo, fallo?: HttpErrorResponse) => {
    servicio = jasmine.createSpyObj<ContenidoAdminService>('ContenidoAdminService', ['listarTodos', 'eliminar']);
    servicio.listarTodos.and.returnValue(fallo ? throwError(() => fallo) : of(lista));
    dialogo = jasmine.createSpyObj<DialogoService>('DialogoService', ['confirmar']);
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', ['error', 'exito']);

    await TestBed.configureTestingModule({
      imports: [GestionContenidosComponent, MatIconTestingModule],
      providers: [
        provideRouter([]),
        { provide: ContenidoAdminService, useValue: servicio },
        { provide: DialogoService, useValue: dialogo },
        { provide: NotificacionService, useValue: notificacion }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GestionContenidosComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  };

  const host = (): HTMLElement => fixture.nativeElement;

  it('agrupa los contenidos por sección, con los mismos títulos que la portada', async () => {
    await crear();

    const titulos = Array.from(host().querySelectorAll('h2 > span')).map((h) => h.textContent?.trim());
    expect(titulos).toEqual(['Opciones de atención y gestión', 'Información de interés general']);
    expect(componente.secciones().map((s) => s.items.length)).toEqual([2, 1]);
    expect(host().querySelectorAll('h1').length).toBe(1);
  });

  it('calcula el estado de cada contenido y filtra sin volver a pedir datos', async () => {
    await crear();

    expect(componente.filtros().map((f) => f.cantidad)).toEqual([3, 1, 1, 1]);

    componente.filtrar('programado');
    fixture.detectChanges();

    expect(componente.cantidadVisible()).toBe(1);
    expect(componente.secciones()[0].items[0].contenido.id).toBe(2);
    expect(host().querySelector('[aria-pressed="true"]')?.textContent).toContain('Programados');
    expect(servicio.listarTodos).toHaveBeenCalledTimes(1);
  });

  it('sin contenidos invita a crear el primero', async () => {
    await crear([]);

    expect(host().textContent).toContain('La portada todavía no tiene contenidos');
    expect(host().querySelector('a[href="/nuevo"], a[href$="/nuevo"]')).toBeTruthy();
  });

  it('si la carga falla muestra el error con opción de reintentar', async () => {
    await crear([], new HttpErrorResponse({ status: 500 }));

    expect(host().querySelector('[role="alert"]')?.textContent).toContain('No pudimos cargar');
    expect(notificacion.error).toHaveBeenCalled();

    servicio.listarTodos.and.returnValue(of(catalogo));
    componente.cargar();
    fixture.detectChanges();
    expect(componente.total()).toBe(3);
  });

  describe('eliminar', () => {
    it('pide confirmación y, si se confirma, retira la fila sin recargar', async () => {
      await crear();
      dialogo.confirmar.and.returnValue(of(true));
      servicio.eliminar.and.returnValue(of(undefined));

      componente.eliminar(catalogo[0]);
      fixture.detectChanges();

      expect(dialogo.confirmar).toHaveBeenCalled();
      expect(servicio.eliminar).toHaveBeenCalledWith(1);
      expect(componente.total()).toBe(2);
      expect(notificacion.exito).toHaveBeenCalled();
      expect(servicio.listarTodos).toHaveBeenCalledTimes(1);
    });

    it('no elimina nada si la persona cancela', async () => {
      await crear();
      dialogo.confirmar.and.returnValue(of(false));

      componente.eliminar(catalogo[0]);

      expect(servicio.eliminar).not.toHaveBeenCalled();
      expect(componente.total()).toBe(3);
    });

    it('si otra persona ya lo eliminó, avisa y recarga el listado', async () => {
      await crear();
      dialogo.confirmar.and.returnValue(of(true));
      servicio.eliminar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

      componente.eliminar(catalogo[0]);

      expect(notificacion.error).toHaveBeenCalledWith(jasmine.stringContaining('ya no existe'), jasmine.anything());
      expect(servicio.listarTodos).toHaveBeenCalledTimes(2);
      expect(componente.eliminandoId()).toBeNull();
    });
  });
});
