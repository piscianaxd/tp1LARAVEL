import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MixesCapsuleComponent } from './mixes-capsule.component';

describe('MixesCapsuleComponent', () => {
  let component: MixesCapsuleComponent;
  let fixture: ComponentFixture<MixesCapsuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MixesCapsuleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MixesCapsuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
