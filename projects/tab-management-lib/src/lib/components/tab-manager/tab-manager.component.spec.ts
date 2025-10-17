import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabManagerComponent } from './tab-manager.component';

describe('TabManagerComponent', () => {
  let component: TabManagerComponent;
  let fixture: ComponentFixture<TabManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
