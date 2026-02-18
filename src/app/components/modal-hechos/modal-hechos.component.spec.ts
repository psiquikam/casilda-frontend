import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalHechosComponent } from './modal-hechos.component';

describe('ModalHechosComponent', () => {
  let component: ModalHechosComponent;
  let fixture: ComponentFixture<ModalHechosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalHechosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalHechosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
