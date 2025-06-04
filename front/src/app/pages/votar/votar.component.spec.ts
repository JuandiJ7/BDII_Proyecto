import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VotarComponent } from './votar.component';

describe('VotarComponent', () => {
  let component: VotarComponent;
  let fixture: ComponentFixture<VotarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VotarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
