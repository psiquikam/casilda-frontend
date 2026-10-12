import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { RegistroCasoComponent } from './registro-caso.component';

describe('RegistroCasoComponent', () => {
  let component: RegistroCasoComponent;
  let fixture: ComponentFixture<RegistroCasoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroCasoComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RegistroCasoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format alphanumeric document with country code and uppercase', () => {
    component.casoForm.get('documento')?.enable();
    const mockInput = document.createElement('input');
    mockInput.value = 'vnz-123.456';
    const event = { target: mockInput } as unknown as Event;

    component.formatoDocumento(event);

    expect(mockInput.value).toBe('VNZ123456');
    expect(component.casoForm.get('documento')?.value).toBe('VNZ123456');
  });

  it('should allow up to 20 chars for foreign/alphanumeric document', () => {
    component.casoForm.get('documento')?.setValue('VNZ1234567890');
    expect(component.maxLongitudDocumento).toBe(20);
  });

  it('should open country codes catalog and prefix selected code', () => {
    const dialogRefSimulado = {
      afterClosed: () => ({ subscribe: (fn: (val?: string) => void) => fn('VNZ') })
    } as unknown as MatDialogRef<unknown, string>;
    const dialogSpy = spyOn(
      (component as unknown as { dialog: MatDialog }).dialog,
      'open'
    ).and.returnValue(dialogRefSimulado);

    component.casoForm.get('documento')?.setValue('123456');
    component.abrirCatalogoPaises();

    expect(dialogSpy).toHaveBeenCalled();
    expect(component.casoForm.get('documento')?.value).toBe('VNZ123456');
  });

  describe('VBG-01: lógica condicional de "Violencia Basada en Género"', () => {
    it('no exige Forma de Ocurrencia cuando VBG = No', () => {
      component.casoForm.get('violenciaGenero')?.setValue('NO');
      expect(component.casoForm.get('queForma')?.valid).toBeTrue();
    });

    it('exige Forma de Ocurrencia cuando VBG = Sí', () => {
      component.casoForm.get('violenciaGenero')?.setValue('SI');
      expect(component.casoForm.get('queForma')?.invalid).toBeTrue();

      component.casoForm.get('queForma')?.setValue('Presencial');
      expect(component.casoForm.get('queForma')?.valid).toBeTrue();
    });

    it('nunca exige Lugar de Ocurrencia (decisión provisional del pendiente 5)', () => {
      component.casoForm.get('violenciaGenero')?.setValue('SI');
      expect(component.casoForm.get('lugarHechos')?.valid).toBeTrue();
    });
  });

  describe('VBG-02: Relación Misional / Institucional (decisión provisional del pendiente 7)', () => {
    it('nivel 2 solo se exige cuando "Misional" está entre los seleccionados de nivel 1', () => {
      const misional = component.relacionMisionalNivel1.find(c => c.codigo === 'misional');
      expect(misional).toBeTruthy();

      expect(component.esRelacionMisionalSeleccionada()).toBeFalse();

      component.relacionMisionalNivel1Sel.push(misional!.id);
      expect(component.esRelacionMisionalSeleccionada()).toBeTrue();
    });

    it('bloquea el guardado si "Misional" está marcado sin ninguna subcategoría de nivel 2', () => {
      const misional = component.relacionMisionalNivel1.find(c => c.codigo === 'misional')!;
      component.relacionMisionalNivel1Sel.push(misional.id);

      expect((component as unknown as { validarFormulario: () => boolean }).validarFormulario()).toBeFalse();

      const docencia = component.relacionMisionalNivel2.find(c => c.codigo === 'misional-docencia')!;
      component.relacionMisionalNivel2Sel.push(docencia.id);

      expect((component as unknown as { validarFormulario: () => boolean }).validarFormulario()).toBeTrue();
    });
  });

  describe('VBG-03-05/06: subárbol tecnológico anidado bajo Violencia sexual', () => {
    it('no expone "Violencia facilitada por nuevas tecnologías" como modalidad principal de Sexual', () => {
      const etiquetas = component.listaSexual.map(c => c.nombre);
      expect(etiquetas).not.toContain('Violencia facilitada por nuevas tecnologías');
      expect(etiquetas).toContain('Explotación sexual');
    });

    it('expone las cuatro subcategorías tecnológicas, con "Sexting sin consentimiento" literal (VBG-03-07)', () => {
      const etiquetas = component.listaInformatica.map(c => c.nombre);
      expect(etiquetas).toContain('Sexting sin consentimiento');
      expect(etiquetas).not.toContain('Sexting');
    });
  });

  describe('VBG-00-03: consentimiento de atención, solo PDF hasta 10 MB (pendiente 18)', () => {
    function simularSeleccionArchivo(archivo: File): HTMLInputElement {
      const crearElementoOriginal = document.createElement.bind(document);
      const inputCreado = crearElementoOriginal('input') as HTMLInputElement;
      spyOn(document, 'createElement').and.callFake((tagName: string) =>
        tagName === 'input' ? inputCreado : crearElementoOriginal(tagName)
      );
      spyOn(inputCreado, 'click').and.callFake(() => {
        inputCreado.onchange?.({ target: { files: [archivo] } } as unknown as Event);
      });
      component.subirArchivo();
      return inputCreado;
    }

    it('rechaza un archivo que no sea PDF', () => {
      const notificacionSpy = spyOn((component as unknown as { notificacion: { error: jasmine.Spy } }).notificacion, 'error');
      simularSeleccionArchivo(new File(['contenido'], 'foto.png', { type: 'image/png' }));

      expect(notificacionSpy).toHaveBeenCalled();
      expect(component.estadoConsentimiento()).toBe('Consentimiento pendiente');
    });

    it('rechaza un PDF de más de 10 MB', () => {
      const notificacionSpy = spyOn((component as unknown as { notificacion: { error: jasmine.Spy } }).notificacion, 'error');
      const archivoGrande = new File(['contenido'], 'consentimiento.pdf', { type: 'application/pdf' });
      Object.defineProperty(archivoGrande, 'size', { value: 11 * 1024 * 1024 });
      simularSeleccionArchivo(archivoGrande);

      expect(notificacionSpy).toHaveBeenCalled();
      expect(component.estadoConsentimiento()).toBe('Consentimiento pendiente');
    });

    it('acepta un PDF válido y reporta "Consentimiento cargado"', () => {
      expect(component.estadoConsentimiento()).toBe('Consentimiento pendiente');
      simularSeleccionArchivo(new File(['contenido'], 'consentimiento.pdf', { type: 'application/pdf' }));
      expect(component.estadoConsentimiento()).toBe('Consentimiento cargado');
    });
  });
});
