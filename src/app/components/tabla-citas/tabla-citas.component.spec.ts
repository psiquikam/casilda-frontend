import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatTableDataSource } from '@angular/material/table';

import { TablaCitasComponent } from './tabla-citas.component';

describe('TablaCitasComponent', () => {
  let component: TablaCitasComponent;
  let fixture: ComponentFixture<TablaCitasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaCitasComponent],
      providers: [
        provideNoopAnimations()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TablaCitasComponent);
    component = fixture.componentInstance;
    component.dataSource = new MatTableDataSource<any>([]);
    component.displayedColumns = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
