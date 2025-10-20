import { TestBed } from '@angular/core/testing';

import { ActiveTaskService } from './active-task.service';

describe('ActiveTaskService', () => {
  let service: ActiveTaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActiveTaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
