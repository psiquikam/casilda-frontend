import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificacionService } from './notificacion.service';

describe('NotificacionService', () => {
  let servicio: NotificacionService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: snackBar }] });
    servicio = TestBed.inject(NotificacionService);
  });

  it('anuncia los errores de forma asertiva y con acción para cerrar', () => {
    servicio.error('No fue posible guardar.');
    expect(snackBar.open).toHaveBeenCalledWith(
      'No fue posible guardar.',
      'Cerrar',
      jasmine.objectContaining({ politeness: 'assertive' })
    );
  });

  it('anuncia los éxitos de forma cortés', () => {
    servicio.exito('Guardado.');
    expect(snackBar.open).toHaveBeenCalledWith('Guardado.', 'Cerrar', jasmine.objectContaining({ politeness: 'polite' }));
  });
});
