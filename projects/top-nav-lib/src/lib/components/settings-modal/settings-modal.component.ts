import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { UserPreferences } from '../../models/user.model';
import { ThemeColor } from '../../models/theme.model';

@Component({
  selector: 'lib-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss'],
})
export class SettingsModalComponent implements OnInit {
  @Input() user: User | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<UserPreferences>>();

  settings: Partial<UserPreferences> = {};
  languages: string[] = ['English', 'Sinhala', 'Tamil'];
  timeFormats: string[] = ['12h', '24h'];
  themes: ThemeColor[] = ['blue', 'green', 'purple', 'gray'];

  constructor() {}

  ngOnInit(): void {
    if (this.user?.preferences) {
      this.settings = { ...this.user.preferences };
    } else {
      this.settings = {
        theme: 'blue',
        language: 'English',
        fontName: 'Arial',
        fontSize: 14,
        fontColor: '#333333',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      };
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    this.save.emit(this.settings);
  }

  onCancel(): void {
    this.close.emit();
  }

  onReset(): void {
    this.settings = {
      theme: 'blue',
      language: 'English',
      fontName: 'Arial',
      fontSize: 14,
      fontColor: '#333333',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    };
  }
}
