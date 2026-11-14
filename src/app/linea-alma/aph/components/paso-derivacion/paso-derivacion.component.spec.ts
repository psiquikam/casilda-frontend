import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../services/auth.service';
import { almaMockInterceptor } from '../../../mocks/alma-mock.interceptor';
import { almaMockStore } from '../../../mocks/alma-mock-store';
import { AtencionAphDto } from '../../../shared/types/alma-dto';
import { AtencionAph, aAtencion } from '../../services/atenciones-aph.service';
import { PasoDerivacionComponent } from './paso-derivacion.component';

registerLocaleData(localeEsCo);

/**
 * H-1.4 / RN-ALMA-02: **sin consentimiento no hay derivación**. Se prueba contra el mock,
 * que replica el contrato, para cubrir pantalla + servicio + validación de servidor.
 */
describe('PasoDerivacionComponent (H-1.4)', () => {
  const original = { ...environment.lineaAlma.mocks };
  let fixture: ComponentFixture<PasoDerivacionComponent>;

  function dom(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function boton(texto: string): HTMLButtonElement | undefined {
    return Array.from(dom().querySelectorAll('button')).find((b) => (b.textContent ?? '').includes(texto));
  }

  /** Atención en gestión con triaje, tal como la deja el paso anterior. */
  function atencionEnGestion(conTriaje = true): AtencionAph {
    const semilla = Array.from(almaMockStore.atenciones.values()).find((a) => a.estado === 'EN_GESTION_APH' || a.estado === 'PENDIENTE_APH')!;
    const dto: AtencionAphDto = { ...semilla, estado: 'EN_GESTION_APH' as const, triaje: conTriaje ? ('ALTO' as const) : null, aceptaPsicologia: null, consentimiento: null, sla: null, fechaDerivacion: null };
    almaMockStore.atenciones.set(dto.idAtencion, dto);
    return aAtencion(dto);
  }

  function crear(atencion: AtencionAph): void {
    fixture = TestBed.createComponent(PasoDerivacionComponent);
    fixture.componentRef.setInput('atencion', atencion);
    fixture.detectChanges();
  }

  function elegirSi(): void {
    (dom().querySelector('mat-radio-button input[value="SI"]') as HTMLInputElement).click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    almaMockStore.reiniciar();
    Object.keys(environment.lineaAlma.mocks).forEach((k) => ((environment.lineaAlma.mocks as Record<string, boolean>)[k] = true));
    TestBed.configureTestingModule({
      imports: [PasoDerivacionComponent, MatIconTestingModule],
      providers: [
        provideHttpClient(withInterceptors([almaMockInterceptor])),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'es-CO' },
        { provide: AuthService, useValue: { currentUser: { nombre: 'Técnico APH (prueba)' } } }
      ]
    });
  });

  afterEach(() => Object.assign(environment.lineaAlma.mocks, original));

  it('«Derivar a Psicología» está deshabilitado mientras no haya consentimiento registrado', fakeAsync(() => {
    crear(atencionEnGestion());
    elegirSi();
    tick(600);
    fixture.detectChanges();

    expect(boton('Derivar a Psicología')?.disabled).toBeTrue();
    expect(dom().textContent).toContain('se habilita cuando el consentimiento queda registrado');
  }));

  it('al registrar el consentimiento se habilita y deriva, mostrando estado y plazo del servidor', fakeAsync(() => {
    const atencion = atencionEnGestion();
    crear(atencion);
    elegirSi();
    tick(600);
    fixture.detectChanges();

    (dom().querySelector('app-consentimiento-informado mat-checkbox input') as HTMLInputElement).click();
    fixture.detectChanges();
    expect(boton('Derivar a Psicología')?.disabled).toBeFalse();

    boton('Derivar a Psicología')!.click();
    tick(600);
    fixture.detectChanges();

    expect(almaMockStore.atenciones.get(atencion.idAtencion)?.estado).toBe('PENDIENTE_PSICOLOGIA');
    expect(dom().textContent).toContain('quedó en la cola de Psicología');
    expect(dom().textContent).toContain('12 h');
  }));

  it('sin triaje explica que primero debe registrarlo y no permite derivar', fakeAsync(() => {
    crear(atencionEnGestion(false));
    elegirSi();
    tick(600);
    fixture.detectChanges();
    (dom().querySelector('app-consentimiento-informado mat-checkbox input') as HTMLInputElement).click();
    fixture.detectChanges();

    expect(dom().textContent).toContain('primero registre el triaje');
    expect(boton('Derivar a Psicología')?.disabled).toBeTrue();
  }));

  it('«No» registra que la persona no desea remisión y la atención sigue en gestión', fakeAsync(() => {
    const atencion = atencionEnGestion();
    crear(atencion);
    (dom().querySelector('mat-radio-button input[value="NO"]') as HTMLInputElement).click();
    fixture.detectChanges();

    boton('Registrar que no desea remisión')!.click();
    tick(600);

    const guardada = almaMockStore.atenciones.get(atencion.idAtencion)!;
    expect(guardada.aceptaPsicologia).toBeFalse();
    expect(guardada.estado).toBe('EN_GESTION_APH');
  }));

  it('una atención ya derivada no vuelve a ofrecer la derivación', fakeAsync(() => {
    const derivada = aAtencion({ ...atencionEnGestion(), estado: 'PENDIENTE_PSICOLOGIA' });
    crear(derivada);
    expect(dom().textContent).toContain('ya fue derivada');
    expect(boton('Derivar a Psicología')).toBeUndefined();
  }));
});
