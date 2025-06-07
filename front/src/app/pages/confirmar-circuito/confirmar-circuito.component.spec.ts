import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmarCircuitoComponent } from './confirmar-circuito.component';

describe('ConfirmarCircuitoComponent', () => {
  let component: ConfirmarCircuitoComponent;
  let fixture: ComponentFixture<ConfirmarCircuitoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmarCircuitoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmarCircuitoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
