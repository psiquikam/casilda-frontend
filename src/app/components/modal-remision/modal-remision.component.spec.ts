import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRemisionComponent } from './modal-remision.component';

describe('ModalRemisionComponent', () => {
  let component: ModalRemisionComponent;
  let fixture: ComponentFixture<ModalRemisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalRemisionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalRemisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
