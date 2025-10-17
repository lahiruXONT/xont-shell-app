import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { ThemeColor } from '../../models/theme.model';

@Component({
  selector: 'lib-user-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-dropdown.component.html',
  styleUrls: ['./user-dropdown.component.scss'],
})
export class UserDropdownComponent implements OnInit {
  @Input() user: User | null = null;
  @Output() profileClick = new EventEmitter<void>();
  @Output() settingsClick = new EventEmitter<void>();
  @Output() themeChange = new EventEmitter<ThemeColor>();
  @Output() logout = new EventEmitter<void>();

  themes: ThemeColor[] = ['blue', 'green', 'purple', 'gray'];
  currentTheme: ThemeColor = 'blue';

  constructor() {}

  ngOnInit(): void {
    if (this.user?.preferences?.theme) {
      this.currentTheme = this.user.preferences.theme;
    }
  }

  onProfileClick(): void {
    this.profileClick.emit();
  }

  onSettingsClick(): void {
    this.settingsClick.emit();
  }

  onThemeChange(theme: ThemeColor): void {
    this.currentTheme = theme;
    this.themeChange.emit(theme);
  }

  onLogout(): void {
    this.logout.emit();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const names = name.split(' ');
    return names
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  getThemeClass(theme: ThemeColor): string {
    return `theme-${theme}`;
  }
  setDefaultImage(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/avatars/default.png';
  }
}
