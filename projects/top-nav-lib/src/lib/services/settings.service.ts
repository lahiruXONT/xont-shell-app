import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  UserSettings,
  PasswordChangeRequest,
  ProfileImageUpload,
  SettingsValidation,
} from '../models/settings.model';
import { Inject, Optional } from '@angular/core';
import { TOP_NAV_API_URL as API_URL } from '../tokens/api-url.token';

/**
 * Settings Service
 * Legacy: User settings from settings modal
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  // Settings state using signals
  private settingsSignal = signal<UserSettings | null>(null);
  private isSavingSignal = signal<boolean>(false);
  private lastSavedSignal = signal<Date | null>(null);

  // Public readonly signals
  readonly settings = this.settingsSignal.asReadonly();
  readonly isSaving = this.isSavingSignal.asReadonly();
  readonly lastSaved = this.lastSavedSignal.asReadonly();

  // Computed values
  readonly hasUnsavedChanges = computed(() => {
    // Compare with last saved
    return false; // Implement comparison logic
  });

  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiBaseUrl: string
  ) {
    this.loadSettings();
  }

  /**
   * Load user settings from server
   * Legacy: Load from User object
   */
  async loadSettings(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<UserSettings>(`${this.apiBaseUrl}/api/user/settings`)
      );

      this.settingsSignal.set(response);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Save settings to server
   * Legacy: PageMethods.saveSettings()
   */
  async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    this.isSavingSignal.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<UserSettings>(
          `${this.apiBaseUrl}/api/user/settings`,
          settings
        )
      );

      this.settingsSignal.set(response);
      this.lastSavedSignal.set(new Date());
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    } finally {
      this.isSavingSignal.set(false);
    }
  }

  /**
   * Change password
   * Legacy: Change password functionality in settings
   */
  async changePassword(request: PasswordChangeRequest): Promise<void> {
    // Validate passwords
    const validation = this.validatePasswordChange(request);
    if (!validation.isValid) {
      throw new Error(validation.errors[0].message);
    }

    try {
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/api/user/change-password`, request)
      );
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Validate password change
   */
  private validatePasswordChange(
    request: PasswordChangeRequest
  ): SettingsValidation {
    const errors = [];

    if (!request.currentPassword) {
      errors.push({
        field: 'currentPassword',
        message: 'Current password is required',
      });
    }

    if (!request.newPassword) {
      errors.push({
        field: 'newPassword',
        message: 'New password is required',
      });
    }

    if (request.newPassword !== request.confirmNewPassword) {
      errors.push({
        field: 'confirmNewPassword',
        message: 'Passwords do not match',
      });
    }

    if (request.newPassword && request.newPassword.length < 6) {
      errors.push({
        field: 'newPassword',
        message: 'Password must be at least 6 characters',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Upload profile image
   * Legacy: imgProUpload file upload
   */
  async uploadProfileImage(upload: ProfileImageUpload): Promise<string> {
    // Validate file
    const validation = this.validateProfileImage(upload);
    if (!validation.isValid) {
      throw new Error(validation.errors[0].message);
    }

    try {
      const formData = new FormData();
      formData.append('file', upload.file);

      const response = await firstValueFrom(
        this.http.post<{ url: string }>(
          `${this.apiBaseUrl}/api/user/profile-image`,
          formData
        )
      );

      // Update settings with new image URL
      const settings = this.settingsSignal();
      if (settings) {
        this.settingsSignal.set({
          ...settings,
          profileImage: response.url,
        });
      }

      return response.url;
    } catch (error) {
      console.error('Failed to upload profile image:', error);
      throw error;
    }
  }

  /**
   * Validate profile image upload
   */
  private validateProfileImage(upload: ProfileImageUpload): SettingsValidation {
    const errors = [];

    // Check file type
    const fileType = upload.file.type.toLowerCase();
    if (!upload.allowedTypes.some((type) => fileType.includes(type))) {
      errors.push({
        field: 'file',
        message: `File type not allowed. Allowed types: ${upload.allowedTypes.join(
          ', '
        )}`,
      });
    }

    // Check file size (convert to KB)
    const fileSizeKB = upload.file.size / 1024;
    if (fileSizeKB > upload.maxSizeKB) {
      errors.push({
        field: 'file',
        message: `File size exceeds ${upload.maxSizeKB}KB`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Update specific setting
   */
  async updateSetting(key: keyof UserSettings, value: any): Promise<void> {
    const settings = this.settingsSignal();
    if (!settings) return;

    const updated = {
      ...settings,
      [key]: value,
    };

    await this.saveSettings(updated);
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/api/user/settings/reset`, {})
      );

      await this.loadSettings();
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }
}
