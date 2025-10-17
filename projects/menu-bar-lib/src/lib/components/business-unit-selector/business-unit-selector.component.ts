import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessUnit } from '../../models/business-unit.model';
@Component({
  selector: 'lib-business-unit-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-unit-selector.component.html',
  styleUrl: './business-unit-selector.component.scss',
})
export class BusinessUnitSelectorComponent {
  @Input() businessUnits: BusinessUnit[] = [];
  @Input() selectedBusinessUnit: BusinessUnit | null = null;
  @Input() showBusinessUnitList = true;

  @Output() businessUnitSelected = new EventEmitter<BusinessUnit>();

  public selectedBusinessUnitCodeSignal: WritableSignal<string> = signal('');
  public selectedBusinessUnitSignal: WritableSignal<BusinessUnit | null> =
    signal(null);

  readonly availableBusinessUnits = computed(() =>
    this.businessUnits.filter((bu) => bu.isActive)
  );

  constructor() {
    // Initialize signals
    effect(() => {
      if (this.selectedBusinessUnit) {
        this.selectedBusinessUnitSignal.set(this.selectedBusinessUnit);
        this.selectedBusinessUnitCodeSignal.set(
          this.selectedBusinessUnit.businessUnitCode
        );
      } else {
        this.selectedBusinessUnitSignal.set(null);
        this.selectedBusinessUnitCodeSignal.set('');
      }
    });
  }

  ngOnChanges(): void {
    if (this.selectedBusinessUnit) {
      this.selectedBusinessUnitCodeSignal.set(
        this.selectedBusinessUnit.businessUnitCode
      );
    } else {
      this.selectedBusinessUnitCodeSignal.set('');
    }
  }

  onBusinessUnitChange(): void {
    const selectedCode = this.selectedBusinessUnitCodeSignal();
    const businessUnit = this.businessUnits.find(
      (bu) => bu.businessUnitCode === selectedCode
    );
    if (businessUnit) {
      this.businessUnitSelected.emit(businessUnit);
    }
  }

  selectBusinessUnit(businessUnit: BusinessUnit): void {
    if (businessUnit.isActive) {
      this.selectedBusinessUnitCodeSignal.set(businessUnit.businessUnitCode);
      this.businessUnitSelected.emit(businessUnit);
    }
  }

  trackByBusinessUnit(index: number, bu: BusinessUnit): string {
    return bu.businessUnitCode;
  }
}
