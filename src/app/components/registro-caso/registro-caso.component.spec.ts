import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';

import { RegistroCasoComponent } from './registro-caso.component';
import { environment } from '../../../environments/environment';
import { EstadoCitaEnum, SolicitudAcompanamientoResponse } from '../../services/solicitud.service';

describe('RegistroCasoComponent', () => {
  // Estas pruebas cubren el modo de demostración: sin él, los catálogos
  // salen del respaldo de la matriz, sin red.
  const modoOriginal = environment.datosDemostracion;
  beforeEach(() => {
    environment.datosDemostracion = true;
  });
  afterEach(() => {
    environment.datosDemostracion = modoOriginal;
  });
  let component: RegistroCasoComponent;
  let fixture: ComponentFixture<RegistroCasoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroCasoComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
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

  it('no envía una lista vacía de discapacidades ni conserva la de otra persona', async () => {
    component.discapacidadesRegistradas = [{ idSubTipoDiscapacidad: 1 }];
    component.iniciarAtencion({ citaId: 1, idEstadoCita: EstadoCitaEnum.PROGRAMADA });
    const request = await component['construirRegistroAtencionRequest'](0);
    expect(request.discapacidades).toBeUndefined();
  });

  it('conserva las discapacidades existentes al agregar una y permite eliminar la última', async () => {
    spyOn(component['registroVbgDatos'], 'obtenerPorId').and.returnValue(of({
      discapacidades: [{ idSubTipoDiscapacidad: 1, tipo: 'Sensorial', subTipo: 'Visual', descripcion: '' }]
    } as SolicitudAcompanamientoResponse));
    component.iniciarAtencion({ citaId: 1, solicitudId: 1, idEstadoCita: EstadoCitaEnum.PROGRAMADA });
    expect((await component['construirRegistroAtencionRequest'](0)).discapacidades).toBeUndefined();

    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of({ idSubTipoDiscapacidad: 2, descripcion: 'Nueva' })
    } as MatDialogRef<unknown>);
    component.abrirModalDiscapacidad();
    expect((await component['construirRegistroAtencionRequest'](0)).discapacidades).toEqual([
      { idSubTipoDiscapacidad: 1, descripcion: null },
      { idSubTipoDiscapacidad: 2, descripcion: 'Nueva' }
    ]);

    component.eliminarDiscapacidad(1);
    component.eliminarDiscapacidad(0);
    expect((await component['construirRegistroAtencionRequest'](0)).discapacidades).toEqual([]);
  });

  it('ignora una respuesta tardía de otra persona', () => {
    const primera = new Subject<SolicitudAcompanamientoResponse>();
    const segunda = new Subject<SolicitudAcompanamientoResponse>();
    spyOn(component['registroVbgDatos'], 'obtenerPorId').and.returnValues(primera, segunda);
    component.iniciarAtencion({ citaId: 1, solicitudId: 1, idEstadoCita: EstadoCitaEnum.PROGRAMADA });
    component.iniciarAtencion({ citaId: 2, solicitudId: 2, idEstadoCita: EstadoCitaEnum.PROGRAMADA });
    const respuesta = { discapacidades: [{ idSubTipoDiscapacidad: 1, descripcion: '' }] } as SolicitudAcompanamientoResponse;
    segunda.next({ ...respuesta, discapacidades: [] });
    primera.next(respuesta);
    expect(component.discapacidadesRegistradas).toEqual([]);
  });

  it('mantiene el orden solicitado y el destino de guardado con y sin VBG', () => {
    component.iniciarAtencion({ citaId: 1, idEstadoCita: EstadoCitaEnum.PROGRAMADA });
    const comprobar = (conVbg: boolean, indices: number[]) => {
      component.casoForm.get('violenciaGenero')?.setValue(conVbg ? 'SI' : 'NO');
      fixture.detectChanges();
      const etiquetas = Array.from(fixture.nativeElement.querySelectorAll('.mat-mdc-tab .mdc-tab__text-label'))
        .map((element) => (element as HTMLElement).textContent?.trim().replace(/\s+/g, ' '));
      expect(etiquetas.slice(0, 6)).toEqual([
        'Datos de la persona', 'Datos complementarios', 'Registro de atención',
        'Documentación del caso', 'Presunto agresor (opcional)', 'Apreciaciones psicojurídicas'
      ]);
      expect(indices.map((_, i) => component.getLogicalTabIndex(i))).toEqual(indices);
      expect(etiquetas.includes('VBG')).toBe(conVbg);
    };
    comprobar(false, [0, 1, 5, 2, 4, 6, 7, 8, 9, 10]);
    comprobar(true, [0, 1, 5, 2, 4, 6, 3, 7, 8, 9, 10]);
  });

  it('guarda las pestañas reordenadas en sus destinos originales', fakeAsync(() => {
    component.iniciarAtencion({ citaId: 1, idEstadoCita: EstadoCitaEnum.ATENDIDA });
    component.casoId = 11;
    component.atencionId = 22;
    component.catalogoTiposServicio = [{ id: 1, nombre: 'Psicología' }];
    component.casoForm.patchValue({ tipoServicio: 'Psicología' });
    component.casoForm.get('violenciaGenero')?.setValue('SI');
    const guardar = spyOn(component['registroVbgDatos'], 'registrarPestana').and.returnValue(of({}));
    spyOn(component['dialog'], 'open');

    [5, 2, 4, 6, 3, 7, 8, 9, 10].forEach((indiceLogico, i) => {
      component.guardarAtencion(i + 2);
      flushMicrotasks();
      expect(guardar.calls.mostRecent().args[0]).toBe(indiceLogico);
    });
  }));

  it('no crea el caso desde las primeras pestañas ni sin consentimiento', () => {
    component.casoForm.patchValue({
      consentimientoArchivo: new File(['anterior'], 'anterior.pdf', { type: 'application/pdf' })
    });
    component.iniciarAtencion({ citaId: 1, idEstadoCita: EstadoCitaEnum.PROGRAMADA });
    expect(component.casoForm.get('consentimientoArchivo')?.value).toBeNull();
    const crear = spyOn(component['registroVbgDatos'], 'registrarPrimeraAtencion');
    const guardar = spyOn(component['registroVbgDatos'], 'registrarPestana');
    const error = spyOn(component['notificacion'], 'error');
    component.guardarAtencion(0);
    component.guardarAtencion(1);
    component.guardarAtencion(2);
    expect(crear).not.toHaveBeenCalled();
    expect(guardar).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Cargue el consentimiento de atención antes de crear el caso.');
  });

  it('crea el caso y la atención al guardar el consentimiento y los datos del formulario', fakeAsync(() => {
    component.iniciarAtencion({ citaId: 1, idEstadoCita: EstadoCitaEnum.PROGRAMADA });
    component.catalogoTiposServicio = [{ id: 2, nombre: 'Psicología' }];
    component.casoForm.patchValue({
      tipoServicio: 'Psicología',
      consentimientoArchivo: new File(['pdf'], 'consentimiento.pdf', { type: 'application/pdf' })
    });
    spyOn(component['solicitudService'], 'convertirArchivoABase64').and.resolveTo('cGRm');
    const crear = spyOn(component['registroVbgDatos'], 'registrarPrimeraAtencion')
      .and.returnValue(of({ id: 22, casoId: 11, codigoCaso: 'CAS-11' }));
    spyOn(component['dialog'], 'open');

    component.guardarAtencion(2);
    flushMicrotasks();
    expect(crear).toHaveBeenCalled();
    expect(crear.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
      citaId: 1,
      idTipoServicio: 2,
      archivoConsentimientoContenido: 'cGRm',
      datosPersona: jasmine.any(Object),
      datosComplementarios: jasmine.any(Object)
    }));
    expect(component.casoId).toBe(11);
    expect(component.atencionId).toBe(22);
  }));

  it('muestra la fecha y hora de la cita seleccionada', () => {
    const cita = {
      id: 1, solicitudId: 0, codigoSolicitud: 'SOL-1', nombreSolicitante: 'Persona',
      documento: '123', fechaCita: '2026-11-21T14:30:00',
      idEstadoCita: EstadoCitaEnum.PROGRAMADA, estadoCita: 'Programada',
      tipoSolicitud: 'Directa', unidadAdministrativa: '', profesional: ''
    };
    component.iniciarAtencion(component['mapearCitaATabla'](cita));
    component.activeTabIndex = 2;
    fixture.detectChanges();
    fixture.detectChanges();
    const campos = Array.from(fixture.nativeElement.querySelectorAll('mat-form-field')) as HTMLElement[];
    const campo = campos.find(element => element.textContent?.includes('Fecha y hora de la cita'));
    expect(campo?.querySelector('input')?.value).toContain('21/11/2026');
    expect(campo?.querySelector('input')?.value).toContain('14:30');
  });

  it('muestra la fecha y hora de la cita en el formato del backend', () => {
    const cita = {
      id: 1, solicitudId: 0, codigoSolicitud: 'SOL-1', nombreSolicitante: 'Persona',
      documento: '123', fechaCita: '25/11/2026 16:30',
      idEstadoCita: EstadoCitaEnum.PROGRAMADA, estadoCita: 'Programada',
      tipoSolicitud: 'Directa', unidadAdministrativa: '', profesional: ''
    };
    component.iniciarAtencion(component['mapearCitaATabla'](cita));
    component.activeTabIndex = 2;
    fixture.detectChanges();
    fixture.detectChanges();
    const campos = Array.from(fixture.nativeElement.querySelectorAll('mat-form-field')) as HTMLElement[];
    const campo = campos.find(element => element.textContent?.includes('Fecha y hora de la cita'));
    expect(campo?.querySelector('input')?.value).toBe('25/11/2026 16:30');
  });

  it('envía las rutas con el contrato de acuerdos', async () => {
    component.rutasInternasSel = [5];
    component.rutasExternasSel = [8];
    const request = await component['construirRegistroAtencionRequest'](7);
    expect(request.rutas).toEqual([
      { idTipoRutaActivacion: 1, idRutaActivacion: 5 },
      { idTipoRutaActivacion: 2, idRutaActivacion: 8 }
    ]);
  });

  it('envía el detalle de otra ruta y el ámbito de ocurrencia', async () => {
    component.catalogoRutasExternas = [{ id: 8, nombre: 'Otra', codigo: 'otras-rutas-externas' }];
    component.rutasExternasSel = [8];
    component.casoForm.patchValue({
      rutaExternaOtraCual: 'Entidad externa',
      ambitoOcurrencia: 'Otro',
      ambitoOcurrenciaOtro: 'Comunidad'
    });
    const acuerdos = await component['construirRegistroAtencionRequest'](7);
    expect(acuerdos.rutas).toEqual([
      { idTipoRutaActivacion: 2, idRutaActivacion: 8, cual: 'Entidad externa' }
    ]);
    const documentacion = await component['construirRegistroAtencionRequest'](2);
    expect(documentacion).toEqual(jasmine.objectContaining({
      ambitoOcurrencia: 'Otro',
      ambitoOcurrenciaOtro: 'Comunidad'
    }));
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

  it('abre el formulario para una cita inicial programada o atendida, pero no para un caso existente', () => {
    const notificacion = (component as unknown as {
      notificacion: { error: jasmine.Spy };
    }).notificacion;
    const errorSpy = spyOn(notificacion, 'error');

    component.iniciarAtencion({
      citaId: 9004,
      idEstadoCita: EstadoCitaEnum.PROGRAMADA,
      tipoAtencion: 'INICIAL'
    });
    expect(component.modoAtencion).toBeTrue();
    component.modoAtencion = false;

    component.iniciarAtencion({ idEstadoCita: EstadoCitaEnum.ATENDIDA, casoId: 9001 });
    expect(component.modoAtencion).toBeFalse();
    expect(errorSpy).toHaveBeenCalledTimes(1);

    component.iniciarAtencion({
      citaId: 9004,
      idEstadoCita: EstadoCitaEnum.ATENDIDA,
      tipoAtencion: 'INICIAL'
    });
    expect(component.modoAtencion).toBeTrue();
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

  describe('Relación misional / institucional', () => {
    it('envía el identificador real y distingue No aplica', async () => {
      expect(component.catalogoActividadesMisionales.length).toBe(7);
      const docencia = component.catalogoActividadesMisionales.find(c => c.nombre === 'Misionales: Docencia')!;
      component.casoForm.patchValue({ actividadMisional: docencia.id });
      expect(await component['construirRegistroAtencionRequest'](2)).toEqual(jasmine.objectContaining({
        idactivadmisional: docencia.id,
        hechoviolenciaocurrioactividadesmisionales: true
      }));
      const noAplica = component.catalogoActividadesMisionales.find(c => c.nombre === 'No aplica')!;
      component.casoForm.patchValue({ actividadMisional: noAplica.id });
      expect(await component['construirRegistroAtencionRequest'](2)).toEqual(jasmine.objectContaining({
        idactivadmisional: noAplica.id,
        hechoviolenciaocurrioactividadesmisionales: false
      }));
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
