import { TestBed } from '@angular/core/testing';

import { MixesService } from './mixes.service';

describe('MixesService', () => {
  let service: MixesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MixesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
