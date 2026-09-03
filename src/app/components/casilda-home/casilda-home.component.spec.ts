import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of, throwError } from 'rxjs';

import { CasildaHomeComponent } from './casilda-home.component';
import { ContenidoDestacadoDto, ContenidoHomeService } from '../../services/contenido-home.service';

describe('CasildaHomeComponent', () => {
  let fixture: ComponentFixture<CasildaHomeComponent>;
  let component: CasildaHomeComponent;
  let contenidoHome: jasmine.SpyObj<ContenidoHomeService>;

  const contenidos: ContenidoDestacadoDto[] = [
    {
      id: 1,
      imagen: 'assets/uad_equipo_3_y_4.svg',
      titulo: 'Registrar queja',
      contenido: 'Texto administrable',
      vigenciaInicio: '2026-01-01T00:00:00Z',
      vigenciaFin: null,
      enlace: '/formulario-anonimo',
      seccion: 'acciones'
    },
    {
      id: 2,
      imagen: 'assets/estadisticas-vbg.svg',
      titulo: 'Estadísticas en VBG',
      contenido: 'Informes institucionales',
      vigenciaInicio: '2026-01-01T00:00:00Z',
      vigenciaFin: null,
      enlace: null,
      seccion: 'informacion'
    }
  ];

  const crearComponente = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [CasildaHomeComponent, MatIconTestingModule],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ContenidoHomeService, useValue: contenidoHome }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CasildaHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    contenidoHome = jasmine.createSpyObj<ContenidoHomeService>('ContenidoHomeService', ['listarContenidoVigente']);
    contenidoHome.listarContenidoVigente.and.returnValue(of(contenidos));
  });

  it('debe distribuir el contenido recibido en sus dos secciones', async () => {
    await crearComponente();

    expect(component.acciones().length).toBe(1);
    expect(component.informacion().length).toBe(1);
    expect(component.cargando()).toBeFalse();
  });

  it('debe exponer un único encabezado de nivel 1 con la promesa de acompañamiento', async () => {
    await crearComponente();

    const titulos = fixture.nativeElement.querySelectorAll('h1');
    expect(titulos.length).toBe(1);
    expect(titulos[0].textContent).toContain('espacio seguro');
  });

  it('no debe ofrecer acceso público a la consulta de casos', async () => {
    await crearComponente();

    const enlaces: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));
    expect(enlaces.some((a) => a.getAttribute('href')?.includes('seguimiento'))).toBeFalse();
  });

  it('debe informar el fallo sin romper la página cuando el contenido no carga', async () => {
    contenidoHome.listarContenidoVigente.and.returnValue(throwError(() => new Error('sin backend')));

    await crearComponente();

    expect(component.errorCarga()).toBeTrue();
    expect(component.cargando()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.home__estado-error')).toBeTruthy();
  });
});
