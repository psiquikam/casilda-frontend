import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicFooterComponent } from './public-footer.component';

describe('PublicFooterComponent', () => {
  let component: PublicFooterComponent;
  let fixture: ComponentFixture<PublicFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicFooterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PublicFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // DSH-05-01 (extensión al pie público): ningún número de relleno visible.
  describe('teléfono de contacto', () => {
    function configurarTelefono(valor: string): void {
      (component as unknown as { telefonoContacto: string }).telefonoContacto = valor;
      fixture.detectChanges();
    }

    it('no muestra teléfono mientras no haya un dato real configurado', () => {
      const pie = fixture.nativeElement as HTMLElement;
      expect(component.hayTelefonoContacto).toBeFalse();
      expect(pie.querySelector('a[href^="tel:"]')).toBeNull();
    });

    it('rechaza un número de relleno aunque esté configurado', () => {
      configurarTelefono('1234567890');

      const pie = fixture.nativeElement as HTMLElement;
      expect(pie.querySelector('a[href^="tel:"]')).toBeNull();
      expect(pie.textContent).not.toContain('1234567890');
    });

    it('muestra el teléfono como enlace tel: cuando hay un número real', () => {
      configurarTelefono('6042196000');

      const enlace = (fixture.nativeElement as HTMLElement).querySelector('a[href^="tel:"]');
      expect(enlace).not.toBeNull();
      expect(enlace?.getAttribute('href')).toBe('tel:6042196000');
      expect(enlace?.textContent?.trim()).toBe('6042196000');
    });

    it('conserva los demás canales de contacto sin teléfono', () => {
      const pie = fixture.nativeElement as HTMLElement;
      expect(pie.querySelector('a[href^="mailto:"]')).not.toBeNull();
      expect(pie.textContent).toContain('www.udea.edu.co');
    });
  });
});
