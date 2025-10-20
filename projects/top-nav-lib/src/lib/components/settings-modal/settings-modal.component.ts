import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { SettingsService } from '../../services/settings.service';
import {
  ThemeName,
  FontFamily,
  FontSize,
  FontOptions,
  Theme,
} from '../../models/theme.model';
import {
  PasswordChangeRequest,
  ProfileImageUpload,
} from '../../models/settings.model';

/**
 * Settings Modal Component
 * Legacy: Settings modal from Main.aspx
 */
@Component({
  selector: 'lib-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-modal.component.html',
  styleUrl: './settings-modal.component.scss',
})
export class SettingsModalComponent implements OnInit {
  // Modal state
  isOpen = signal<boolean>(false);
  activeTab = signal<string>('theme'); // theme, account, profile

  // Theme settings
  selectedTheme = signal<ThemeName>(ThemeName.BLUE);
  selectedFont = signal<string>('arial');
  selectedFontSize = signal<string>('14px');
  selectedFontColor = signal<string>('#000000');

  // Password change
  passwordChange = signal<PasswordChangeRequest>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Profile image
  selectedImage = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  // Loading states
  isSaving = signal<boolean>(false);
  saveMessage = signal<string>('');
  availableThemes: Theme[] = [];
  fontOptions: FontOptions = { availableFonts: [], availableSizes: [] };

  constructor(
    private themeService: ThemeService,
    private settingsService: SettingsService
  ) {
    // Get available options
    this.availableThemes = this.themeService.getAvailableThemes();
    this.fontOptions = this.themeService.getFontOptions();
  }

  ngOnInit(): void {
    this.loadCurrentSettings();
  }

  /**
   * Load current user settings
   */
  private loadCurrentSettings(): void {
    const currentTheme = this.themeService.currentTheme();
    this.selectedTheme.set(currentTheme.name);

    const settings = this.settingsService.settings();
    if (settings) {
      this.selectedFont.set(settings.fontFamily);
      this.selectedFontSize.set(settings.fontSize);
      this.selectedFontColor.set(settings.fontColor);
    }
  }

  /**
   * Open modal
   */
  open(): void {
    this.isOpen.set(true);
    this.loadCurrentSettings();
  }

  /**
   * Close modal
   */
  close(): void {
    this.isOpen.set(false);
    this.resetForm();
  }

  /**
   * Switch tab
   */
  switchTab(tab: string): void {
    this.activeTab.set(tab);
  }

  /**
   * Apply theme
   */
  onThemeChange(): void {
    const theme = this.themeService.getThemeByName(this.selectedTheme());
    if (theme) {
      this.themeService.applyTheme(theme);
    }
  }

  /**
   * Save all settings
   */
  async saveSettings(): Promise<void> {
    this.isSaving.set(true);
    this.saveMessage.set('');

    try {
      // Save theme and font settings
      await this.settingsService.saveSettings({
        theme: this.selectedTheme(),
        fontFamily: this.selectedFont(),
        fontSize: this.selectedFontSize(),
        fontColor: this.selectedFontColor(),
      });

      // Apply custom theme
      await this.themeService.saveCustomTheme({
        name: this.selectedTheme(),
        fontFamily: this.selectedFont(),
        fontSize: this.selectedFontSize(),
        fontColor: this.selectedFontColor(),
      } as any);

      this.saveMessage.set('Settings saved successfully!');
      setTimeout(() => this.saveMessage.set(''), 3000);
    } catch (error) {
      this.saveMessage.set('Failed to save settings');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Change password
   */
  async changePassword(): Promise<void> {
    this.isSaving.set(true);
    this.saveMessage.set('');

    try {
      await this.settingsService.changePassword(this.passwordChange());
      this.saveMessage.set('Password changed successfully!');

      // Reset password fields
      this.passwordChange.set({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });

      setTimeout(() => this.saveMessage.set(''), 3000);
    } catch (error: any) {
      this.saveMessage.set(error.message || 'Failed to change password');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Handle image selection
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedImage.set(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Upload profile image
   */
  async uploadImage(): Promise<void> {
    const file = this.selectedImage();
    if (!file) return;

    this.isSaving.set(true);
    this.saveMessage.set('');

    try {
      const upload: ProfileImageUpload = {
        file,
        maxSizeKB: 300,
        allowedTypes: ['jpg', 'jpeg', 'png'],
      };

      await this.settingsService.uploadProfileImage(upload);
      this.saveMessage.set('Profile image updated successfully!');
      this.selectedImage.set(null);
      this.imagePreview.set(null);

      setTimeout(() => this.saveMessage.set(''), 3000);
    } catch (error: any) {
      this.saveMessage.set(error.message || 'Failed to upload image');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Reset form
   */
  private resetForm(): void {
    this.activeTab.set('theme');
    this.passwordChange.set({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    this.selectedImage.set(null);
    this.imagePreview.set(null);
    this.saveMessage.set('');
  }

  /**
   * Get font family display name
   */
  getFontDisplayName(font: string): string {
    const fontObj = this.fontOptions.availableFonts.find(
      (f: FontFamily) => f.name === font
    );
    return fontObj?.displayName || font;
  }
}
