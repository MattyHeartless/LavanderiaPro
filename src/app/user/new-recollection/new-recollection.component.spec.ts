import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewRecollectionComponent } from './new-recollection.component';

describe('NewRecollectionComponent', () => {
  let component: NewRecollectionComponent;
  let fixture: ComponentFixture<NewRecollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewRecollectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewRecollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
