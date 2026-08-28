import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatTableDataSource } from '@angular/material/table';

import { TablaCasosComponent } from './tabla-casos.component';

describe('TablaCasosComponent', () => {
  let component: TablaCasosComponent;
  let fixture: ComponentFixture<TablaCasosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaCasosComponent],
      providers: [
        provideNoopAnimations()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TablaCasosComponent);
    component = fixture.componentInstance;
    component.dataSource = new MatTableDataSource<any>([]);
    component.displayedColumns = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
