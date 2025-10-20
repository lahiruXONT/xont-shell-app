import { TestBed } from '@angular/core/testing';

import { MenuCacheService } from './menu-cache.service';

describe('MenuCacheService', () => {
  let service: MenuCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
