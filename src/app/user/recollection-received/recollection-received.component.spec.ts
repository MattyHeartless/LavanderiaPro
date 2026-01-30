import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecollectionReceivedComponent } from './recollection-received.component';

describe('RecollectionReceivedComponent', () => {
  let component: RecollectionReceivedComponent;
  let fixture: ComponentFixture<RecollectionReceivedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecollectionReceivedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecollectionReceivedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
