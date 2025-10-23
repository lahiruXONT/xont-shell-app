import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  UserSettings,
  PasswordChangeRequest,
  ProfileImageUpload,
  SettingsModalState,
  SettingsSaveResponse,
  SettingsValidation,
  SettingsError,
} from '../models/settings.model';
import { Inject, Optional } from '@angular/core';
import { TOP_NAV_API_URL as API_URL } from '../tokens/api-url.token';
import { ThemeService } from './theme.service';

/**
 * Settings Service
 * Legacy: Settings modal functionality from Main.aspx
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  // Settings state using signals
  private settingsSignal = signal<UserSettings | null>(null);
  private modalStateSignal = signal<SettingsModalState>({
    isOpen: false,
    activeTab: 'theme',
    isSaving: false,
    hasUnsavedChanges: false,
  });

  // Temporary settings (for unsaved changes)
  private tempSettingsSignal = signal<Partial<UserSettings> | null>(null);

  // Public readonly signals
  readonly settings = this.settingsSignal.asReadonly();
  readonly modalState = this.modalStateSignal.asReadonly();
  readonly hasUnsavedChanges = computed(
    () => this.modalStateSignal().hasUnsavedChanges
  );

  constructor(
    private http: HttpClient,
    private themeService: ThemeService,
    @Inject(API_URL) private apiBaseUrl: string
  ) {}

  /**
   * Load user settings
   * Legacy: Load user settings from database
   */
  async loadSettings(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<UserSettings>(`${this.apiBaseUrl}/api/settings`)
      );

      this.settingsSignal.set(response);

      // Apply theme
      await this.themeService.applyTheme(
        this.themeService.getThemeByName(response.theme)
      );
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Save user settings
   * Legacy: saveSetting button handler
   */
  async saveSettings(
    settings: Partial<UserSettings>
  ): Promise<SettingsSaveResponse> {
    this.modalStateSignal.update((state) => ({
      ...state,
      isSaving: true,
    }));

    try {
      // Validate settings
      const validation = this.validateSettings(settings);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        };
      }

      const response = await firstValueFrom(
        this.http.put<SettingsSaveResponse>(
          `${this.apiBaseUrl}/api/settings`,
          settings
        )
      );

      if (response.success) {
        // Update local settings
        const currentSettings = this.settingsSignal();
        this.settingsSignal.set({ ...currentSettings!, ...settings });

        // Clear temp settings
        this.tempSettingsSignal.set(null);

        // Update modal state
        this.modalStateSignal.update((state) => ({
          ...state,
          hasUnsavedChanges: false,
        }));

        // Apply theme if changed
        if (settings.theme) {
          const theme = this.themeService.getThemeByName(settings.theme);
          await this.themeService.applyTheme(theme);
        }
      }

      return response;
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      return {
        success: false,
        message: error.message || 'Failed to save settings',
      };
    } finally {
      this.modalStateSignal.update((state) => ({
        ...state,
        isSaving: false,
      }));
    }
  }

  /**
   * Change user password
   * Legacy: Change password functionality
   */
  async changePassword(
    request: PasswordChangeRequest
  ): Promise<SettingsSaveResponse> {
    // Validate passwords
    const validation = this.validatePasswordChange(request);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Password validation failed',
        errors: validation.errors,
      };
    }

    try {
      const response = await firstValueFrom(
        this.http.post<SettingsSaveResponse>(
          `${this.apiBaseUrl}/api/auth/change-password`,
          {
            currentPassword: request.currentPassword,
            newPassword: request.newPassword,
          }
        )
      );

      return response;
    } catch (error: any) {
      console.error('Failed to change password:', error);
      return {
        success: false,
        message: error.message || 'Failed to change password',
      };
    }
  }

  /**
   * Upload profile image
   * Legacy: imgProUpload control
   */
  async uploadProfileImage(
    upload: ProfileImageUpload
  ): Promise<SettingsSaveResponse> {
    // Validate file
    const validation = this.validateProfileImage(upload);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Image validation failed',
        errors: validation.errors,
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', upload.file);

      const response = await firstValueFrom(
        this.http.post<{ imageUrl: string }>(
          `${this.apiBaseUrl}/api/settings/upload-profile-image`,
          formData
        )
      );

      // Update settings
      const currentSettings = this.settingsSignal();
      this.settingsSignal.set({
        ...currentSettings!,
        profileImage: response.imageUrl,
      });

      return {
        success: true,
        message: 'Profile image uploaded successfully',
      };
    } catch (error: any) {
      console.error('Failed to upload profile image:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload profile image',
      };
    }
  }

  /**
   * Reset settings to default
   * Legacy: setDefault button
   */
  async resetToDefault(): Promise<SettingsSaveResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<SettingsSaveResponse>(
          `${this.apiBaseUrl}/api/settings/reset`,
          {}
        )
      );

      if (response.success) {
        await this.loadSettings();
      }

      return response;
    } catch (error: any) {
      console.error('Failed to reset settings:', error);
      return {
        success: false,
        message: error.message || 'Failed to reset settings',
      };
    }
  }

  /**
   * Update temporary settings (unsaved changes)
   */
  updateTempSettings(settings: Partial<UserSettings>): void {
    this.tempSettingsSignal.update((current) => ({
      ...current,
      ...settings,
    }));

    this.modalStateSignal.update((state) => ({
      ...state,
      hasUnsavedChanges: true,
    }));
  }

  /**
   * Discard unsaved changes
   */
  discardChanges(): void {
    this.tempSettingsSignal.set(null);
    this.modalStateSignal.update((state) => ({
      ...state,
      hasUnsavedChanges: false,
    }));
  }

  /**
   * Open settings modal
   */
  openModal(tab: 'theme' | 'account' | 'profile' = 'theme'): void {
    this.modalStateSignal.update((state) => ({
      ...state,
      isOpen: true,
      activeTab: tab,
    }));
  }

  /**
   * Close settings modal
   */
  closeModal(): void {
    // Check for unsaved changes
    if (this.modalStateSignal().hasUnsavedChanges) {
      const confirmed = confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) {
        return;
      }
      this.discardChanges();
    }

    this.modalStateSignal.update((state) => ({
      ...state,
      isOpen: false,
    }));
  }

  /**
   * Switch active tab
   */
  switchTab(tab: 'theme' | 'account' | 'profile'): void {
    this.modalStateSignal.update((state) => ({
      ...state,
      activeTab: tab,
    }));
  }

  /**
   * Validate settings
   */
  private validateSettings(
    settings: Partial<UserSettings>
  ): SettingsValidation {
    const errors: SettingsError[] = [];

    // Validate theme
    if (settings.theme) {
      const validThemes = ['green', 'blue', 'red', 'gray', 'purple'];
      if (!validThemes.includes(settings.theme)) {
        errors.push({
          field: 'theme',
          message: 'Invalid theme selection',
        });
      }
    }

    // Validate font size
    if (settings.fontSize) {
      const size = parseInt(settings.fontSize);
      if (isNaN(size) || size < 10 || size > 24) {
        errors.push({
          field: 'fontSize',
          message: 'Font size must be between 10 and 24',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate password change
   */
  private validatePasswordChange(
    request: PasswordChangeRequest
  ): SettingsValidation {
    const errors: SettingsError[] = [];

    // Check if passwords match
    if (request.newPassword !== request.confirmNewPassword) {
      errors.push({
        field: 'confirmNewPassword',
        message: 'Passwords do not match',
      });
    }

    // Check password strength
    if (request.newPassword.length < 8) {
      errors.push({
        field: 'newPassword',
        message: 'Password must be at least 8 characters long',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate profile image
   * Legacy: RegularExpressionValidator + CustomValidator
   */
  private validateProfileImage(upload: ProfileImageUpload): SettingsValidation {
    const errors: SettingsError[] = [];

    // Check file type
    const fileExtension = upload.file.name.split('.').pop()?.toLowerCase();
    if (!upload.allowedTypes.includes(fileExtension!)) {
      errors.push({
        field: 'file',
        message: `Only ${upload.allowedTypes.join(', ')} file types allowed`,
      });
    }

    // Check file size (convert to KB)
    const fileSizeKB = upload.file.size / 1024;
    if (fileSizeKB > upload.maxSizeKB) {
      errors.push({
        field: 'file',
        message: `File size must be less than ${upload.maxSizeKB}KB`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
