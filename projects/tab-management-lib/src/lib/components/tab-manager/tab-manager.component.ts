import { Component, input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabHeaderComponent } from '../tab-header/tab-header.component';
import { TabContentComponent } from '../tab-content/tab-content.component';
import { TabManagerService } from '../../services/tab-manager.service';

@Component({
  selector: 'lib-tab-manager',
  imports: [CommonModule, TabHeaderComponent, TabContentComponent],
  templateUrl: './tab-manager.component.html',
  styleUrl: './tab-manager.component.scss',
})
export class TabManagerComponent implements OnInit, OnDestroy {
  maxTabs = input<number>(5);

  tabManager = inject(TabManagerService);

  ngOnInit(): void {
    // Update max tabs config
    this.tabManager.config().maxTabs = this.maxTabs();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
