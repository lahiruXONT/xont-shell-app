import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Services
import { SettingsService } from '../../services/settings.service';
import { ThemeService } from '../../services/theme.service';

// Models
import {
  UserSettings,
  PasswordChangeRequest,
  ProfileImageUpload,
} from '../../models/settings.model';
import { Theme, FontFamily, FontSize } from '../../models/theme.model';

/**
 * Settings Modal Component
 * Legacy: settingsModal from Main.aspx
 *
 * Features:
 * - Theme selection (Blue, Green, Red, Gray, Purple)
 * - Font customization (family, size, color)
 * - Language selection
 * - Profile picture upload
 * - Password change
 * - Reset to default
 */
@Component({
  selector: 'lib-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss'],
})
export class SettingsModalComponent implements OnInit, OnDestroy {
  // Services
  private settingsService = inject(SettingsService);
  private themeService = inject(ThemeService);
  private fb = inject(FormBuilder);

  // Inputs
  @Input() userName!: string;

  // Outputs
  @Output() settingsSaved = new EventEmitter<UserSettings>();
  @Output() passwordChanged = new EventEmitter<void>();

  // Component state
  private destroy$ = new Subject<void>();

  // Service state
  modalState = this.settingsService.modalState;
  settings = this.settingsService.settings;
  availableThemes = this.themeService.themeState().availableThemes;
  fontOptions = this.themeService.fontOptions();

  // Forms
  passwordForm!: FormGroup;

  // Local state
  selectedTheme = signal<Theme | null>(null);
  selectedFile = signal<File | null>(null);
  profileImagePreview = signal<string | null>(null);
  uploadError = signal<string>('');
  passwordError = signal<string>('');
  isSaving = signal<boolean>(false);

  // Available languages
  languages = [
    { code: 'en', name: 'English' },
    { code: 'si', name: 'Sinhala' },
    { code: 'ta', name: 'Tamil' },
  ];

  // Temp settings for preview
  tempSettings = signal<Partial<UserSettings>>({});

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize forms
   */
  private initializeForms(): void {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmNewPassword: ['', Validators.required],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  /**
   * Load user settings
   */
  private async loadUserSettings(): Promise<void> {
    if (this.userName) {
      await this.settingsService.loadSettings();

      const currentSettings = this.settings();
      if (currentSettings) {
        this.selectedTheme.set(
          this.themeService.getThemeByName(currentSettings.theme)
        );
        this.tempSettings.set({ ...currentSettings });
      }
    }
  }

  /**
   * Password match validator
   */
  private passwordMatchValidator(
    group: FormGroup
  ): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmNewPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  /**
   * Switch active tab
   */
  switchTab(tab: 'theme' | 'account' | 'profile'): void {
    this.settingsService.switchTab(tab);
  }

  /**
   * Close modal
   */
  closeModal(): void {
    this.settingsService.closeModal();
    this.resetForms();
  }

  /**
   * Reset forms
   */
  private resetForms(): void {
    this.passwordForm.reset();
    this.selectedFile.set(null);
    this.profileImagePreview.set(null);
    this.uploadError.set('');
    this.passwordError.set('');
  }

  /**
   * Handle theme selection
   */
  onThemeSelect(theme: Theme): void {
    this.selectedTheme.set(theme);
    this.tempSettings.update((settings) => ({
      ...settings,
      theme: theme.name,
    }));
    this.settingsService.updateTempSettings({ theme: theme.name });

    // Preview theme
    this.themeService.applyTheme(theme);
  }

  /**
   * Handle font family change
   */
  onFontFamilyChange(fontName: string): void {
    this.tempSettings.update((settings) => ({
      ...settings,
      fontFamily: fontName,
    }));
    this.settingsService.updateTempSettings({ fontFamily: fontName });
  }

  /**
   * Handle font size change
   */
  onFontSizeChange(fontSize: string): void {
    this.tempSettings.update((settings) => ({
      ...settings,
      fontSize,
    }));
    this.settingsService.updateTempSettings({ fontSize });
  }

  /**
   * Handle font color change
   */
  onFontColorChange(fontColor: string): void {
    this.tempSettings.update((settings) => ({
      ...settings,
      fontColor,
    }));
    this.settingsService.updateTempSettings({ fontColor });
  }

  /**
   * Handle language change
   */
  onLanguageChange(language: string): void {
    this.tempSettings.update((settings) => ({
      ...settings,
      language,
    }));
    this.settingsService.updateTempSettings({ language });
  }

  /**
   * Handle file selection
   */
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file
    const allowedTypes = ['jpg', 'jpeg', 'png'];
    const maxSizeKB = 300;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      this.uploadError.set('Only JPG, JPEG, and PNG files are allowed');
      return;
    }

    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > maxSizeKB) {
      this.uploadError.set(`File size must be less than ${maxSizeKB}KB`);
      return;
    }

    // Clear error and set file
    this.uploadError.set('');
    this.selectedFile.set(file);

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      this.profileImagePreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.isSaving.set(true);

    try {
      const upload: ProfileImageUpload = {
        file,
        maxSizeKB: 300,
        allowedTypes: ['jpg', 'jpeg', 'png'],
      };

      const result = await this.settingsService.uploadProfileImage(upload);

      if (result.success) {
        alert('Profile image uploaded successfully');
        this.selectedFile.set(null);
        this.profileImagePreview.set(null);
      } else {
        this.uploadError.set(result.message);
      }
    } catch (error) {
      this.uploadError.set('Failed to upload profile image');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Change password
   */
  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordError.set('Please fill in all fields correctly');
      return;
    }

    this.isSaving.set(true);
    this.passwordError.set('');

    try {
      const request: PasswordChangeRequest = {
        currentPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword,
        confirmNewPassword: this.passwordForm.value.confirmNewPassword,
      };

      const result = await this.settingsService.changePassword(request);

      if (result.success) {
        alert('Password changed successfully');
        this.passwordForm.reset();
        this.passwordChanged.emit();
      } else {
        this.passwordError.set(result.message);
      }
    } catch (error) {
      this.passwordError.set('Failed to change password');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Save settings
   */
  async saveSettings(): Promise<void> {
    this.isSaving.set(true);

    try {
      const result = await this.settingsService.saveSettings(
        this.tempSettings()
      );

      if (result.success) {
        alert('Settings saved successfully');
        this.settingsSaved.emit(this.settings()!);
        this.closeModal();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Reset to default
   */
  async resetToDefault(): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to reset all settings to default?'
    );

    if (!confirmed) return;

    this.isSaving.set(true);

    try {
      const result = await this.settingsService.resetToDefault();

      if (result.success) {
        alert('Settings reset to default');
        await this.loadUserSettings();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to reset settings');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Get theme icon
   */
  getThemeIcon(themeName: string): string {
    const icons: Record<string, string> = {
      blue: 'fa-circle',
      green: 'fa-circle',
      red: 'fa-circle',
      gray: 'fa-circle',
      purple: 'fa-circle',
    };
    return icons[themeName] || 'fa-circle';
  }

  /**
   * Get theme color
   */
  getThemeColor(theme: Theme): string {
    return theme.primaryColor;
  }

  /**
   * Check if theme is selected
   */
  isThemeSelected(theme: Theme): boolean {
    return this.selectedTheme()?.name === theme.name;
  }
}
