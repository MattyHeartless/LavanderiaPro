import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecollectionOrdersComponent } from './recollection-orders.component';

describe('RecollectionOrdersComponent', () => {
  let component: RecollectionOrdersComponent;
  let fixture: ComponentFixture<RecollectionOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecollectionOrdersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecollectionOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
