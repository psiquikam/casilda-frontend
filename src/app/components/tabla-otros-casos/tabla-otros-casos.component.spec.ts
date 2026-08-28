import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatTableDataSource } from '@angular/material/table';

import { TablaOtrosCasosComponent } from './tabla-otros-casos.component';

describe('TablaOtrosCasosComponent', () => {
  let component: TablaOtrosCasosComponent;
  let fixture: ComponentFixture<TablaOtrosCasosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaOtrosCasosComponent],
      providers: [
        provideNoopAnimations()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablaOtrosCasosComponent);
    component = fixture.componentInstance;
    component.dataSource = new MatTableDataSource<any>([]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
