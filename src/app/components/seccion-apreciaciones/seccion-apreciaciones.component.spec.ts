import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, of } from 'rxjs';

import { SeccionApreciacionesComponent } from './seccion-apreciaciones.component';

describe('SeccionApreciacionesComponent', () => {
  let component: SeccionApreciacionesComponent;
  let fixture: ComponentFixture<SeccionApreciacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionApreciacionesComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(SeccionApreciacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('agrega una apreciación jurídica y emite el cambio por separado de la psicológica', () => {
    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of({ idTipoApreciacion: 1, descripcion: 'Concepto legal' })
    } as any);
    spyOn(component.apreciacionesJuridicasChange, 'emit');
    spyOn(component.apreciacionesPsicologicasChange, 'emit');

    component.abrirModalApreciacionJuridica();

    expect(component.apreciacionesJuridicas.length).toBe(1);
    expect(component.apreciacionesJuridicasChange.emit).toHaveBeenCalled();
    expect(component.apreciacionesPsicologicasChange.emit).not.toHaveBeenCalled();
  });

  it('elimina una apreciación psicológica por índice', () => {
    component.apreciacionesPsicologicas = [
      { idTipoApreciacion: 2, descripcion: 'Uno' },
      { idTipoApreciacion: 2, descripcion: 'Dos' }
    ];
    spyOn(component.apreciacionesPsicologicasChange, 'emit');

    component.eliminarApreciacionPsicologica(0);

    expect(component.apreciacionesPsicologicas.length).toBe(1);
    expect(component.apreciacionesPsicologicas[0].descripcion).toBe('Dos');
    expect(component.apreciacionesPsicologicasChange.emit).toHaveBeenCalled();
  });

  it('ofrece un campo amplio en ambos formularios de apreciación', async () => {
    const dialog = TestBed.inject(MatDialog);
    for (const abrir of [
      () => component.abrirModalApreciacionJuridica(),
      () => component.abrirModalApreciacionPsicologica()
    ]) {
      abrir();
      fixture.detectChanges();
      const referencia = dialog.openDialogs[dialog.openDialogs.length - 1];
      await firstValueFrom(referencia.afterOpened());
      const contenido = document.querySelector<HTMLElement>('.mat-mdc-dialog-content');
      const campo = contenido?.querySelector<HTMLElement>('mat-form-field');
      const texto = campo?.querySelector<HTMLTextAreaElement>('textarea');
      expect(campo).toBeTruthy();
      expect(texto).toBeTruthy();
      expect(campo!.getBoundingClientRect().width).toBeGreaterThan(contenido!.getBoundingClientRect().width * 0.8);
      expect(texto!.getBoundingClientRect().height).toBeGreaterThanOrEqual(160);
      const cerrado = firstValueFrom(referencia.afterClosed());
      referencia.close();
      await cerrado;
    }
  });
});
