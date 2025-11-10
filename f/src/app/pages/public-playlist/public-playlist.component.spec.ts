import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicPlaylistComponent } from './public-playlist.component';

describe('PublicPlaylistComponent', () => {
  let component: PublicPlaylistComponent;
  let fixture: ComponentFixture<PublicPlaylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicPlaylistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicPlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
