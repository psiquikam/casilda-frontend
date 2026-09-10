import { TestBed } from '@angular/core/testing';
import { NavigationLayoutService } from './navigation-layout.service';

describe('NavigationLayoutService', () => {
  let service: NavigationLayoutService;

  beforeEach(() => {
    localStorage.removeItem('casilda_menu_layout');
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationLayoutService);
  });

  afterEach(() => {
    localStorage.removeItem('casilda_menu_layout');
  });

  it('should be created with sidebar as default layout', () => {
    expect(service).toBeTruthy();
    expect(service.layoutMode()).toBe('sidebar');
    expect(service.isSidebar()).toBeTrue();
    expect(service.isHorizontal()).toBeFalse();
  });

  it('should switch to horizontal layout and persist in localStorage', () => {
    service.setLayout('horizontal');
    expect(service.layoutMode()).toBe('horizontal');
    expect(service.isHorizontal()).toBeTrue();
    expect(localStorage.getItem('casilda_menu_layout')).toBe('horizontal');
  });

  it('should toggle layout between sidebar and horizontal', () => {
    service.setLayout('sidebar');
    service.toggleLayout();
    expect(service.isHorizontal()).toBeTrue();
    service.toggleLayout();
    expect(service.isSidebar()).toBeTrue();
  });
});
