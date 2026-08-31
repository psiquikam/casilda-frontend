import { TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CasildaIconRegistryService } from './casilda-icon-registry.service';

describe('CasildaIconRegistryService', () => {
  const safeUrl = {} as SafeResourceUrl;
  const iconRegistry = jasmine.createSpyObj<MatIconRegistry>('MatIconRegistry', ['addSvgIcon']);
  const sanitizer = jasmine.createSpyObj<DomSanitizer>('DomSanitizer', ['bypassSecurityTrustResourceUrl']);

  beforeEach(() => {
    iconRegistry.addSvgIcon.calls.reset();
    sanitizer.bypassSecurityTrustResourceUrl.calls.reset();
    sanitizer.bypassSecurityTrustResourceUrl.and.returnValue(safeUrl);

    TestBed.configureTestingModule({
      providers: [
        CasildaIconRegistryService,
        { provide: MatIconRegistry, useValue: iconRegistry },
        { provide: DomSanitizer, useValue: sanitizer }
      ]
    });
  });

  it('registra únicamente los iconos existentes una sola vez', () => {
    const service = TestBed.inject(CasildaIconRegistryService);

    service.register();
    service.register();

    expect(iconRegistry.addSvgIcon).toHaveBeenCalledTimes(12);
    expect(iconRegistry.addSvgIcon).toHaveBeenCalledWith('logo-custom', safeUrl);
    expect(iconRegistry.addSvgIcon).not.toHaveBeenCalledWith('logo-AdminPara', safeUrl);
    expect(iconRegistry.addSvgIcon).not.toHaveBeenCalledWith('logo-Reportes', safeUrl);
  });
});
