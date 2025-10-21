import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, interval, Subscription } from 'rxjs';
import {
  Reminder,
  ReminderConfig,
  ReminderPanelState,
  ReminderTriggerEvent,
  ExpiredReminders,
} from '../models/reminder.model';
import { Inject, Optional } from '@angular/core';
import { TOP_NAV_API_URL as API_URL } from '../tokens/api-url.token';

/**
 * Reminder Service
 * Legacy: Reminder system from Main.aspx (right sidebar)
 */
@Injectable({
  providedIn: 'root',
})
export class ReminderService {
  // Default configuration
  private readonly DEFAULT_CONFIG: ReminderConfig = {
    maxReminders: 10,
    defaultRemindLaterInterval: 10, // 10 minutes
    checkInterval: 60000, // Check every minute
    showExpiredOnLogin: true,
    enableSound: true,
    autoCloseAfter: undefined,
  };

  // Reminder state using signals
  private remindersSignal = signal<Reminder[]>([]);
  private expiredRemindersSignal = signal<Reminder[]>([]);
  private panelStateSignal = signal<ReminderPanelState>({
    reminders: [],
    selectedReminder: null,
    isCreatingNew: false,
    isEditMode: false,
    showCalendar: false,
    isOpen: false,
  });
  private configSignal = signal<ReminderConfig>(this.DEFAULT_CONFIG);

  // Polling subscription
  private pollingSubscription: Subscription | null = null;

  // Public readonly signals
  readonly reminders = this.remindersSignal.asReadonly();
  readonly expiredReminders = this.expiredRemindersSignal.asReadonly();
  readonly panelState = this.panelStateSignal.asReadonly();

  // Computed values
  readonly activeReminders = computed(() =>
    this.remindersSignal().filter((r) => r.isActive && !r.isExpired)
  );

  readonly triggeredReminders = computed(() =>
    this.remindersSignal().filter((r) => r.isTriggered)
  );

  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiBaseUrl: string
  ) {}

  /**
   * Start reminder polling
   * Legacy: Timer control in Main.aspx
   */
  startPolling(): void {
    if (this.pollingSubscription) {
      this.stopPolling();
    }

    const intervalMs = this.configSignal().checkInterval;
    this.pollingSubscription = interval(intervalMs).subscribe(() => {
      this.checkReminders();
    });
  }

  /**
   * Stop reminder polling
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Load user reminders
   * Legacy: Load reminders from database
   */
  async loadReminders(userName: string, businessUnit: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<Reminder[]>(`${this.apiBaseUrl}/api/reminders`, {
          params: { userName, businessUnit },
        })
      );

      this.remindersSignal.set(response);
      this.updatePanelState();

      // Check for expired reminders on login
      if (this.configSignal().showExpiredOnLogin) {
        await this.checkExpiredReminders(userName, businessUnit);
      }
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  }

  /**
   * Create new reminder
   * Legacy: Create reminder functionality
   */
  async createReminder(
    reminder: Omit<
      Reminder,
      'reminderId' | 'createdAt' | 'isTriggered' | 'isExpired'
    >
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<Reminder>(`${this.apiBaseUrl}/api/reminders`, reminder)
      );

      const updated = [...this.remindersSignal(), response];
      this.remindersSignal.set(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw error;
    }
  }

  /**
   * Update reminder
   */
  async updateReminder(
    reminderId: string,
    updates: Partial<Reminder>
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.put<Reminder>(
          `${this.apiBaseUrl}/api/reminders/${reminderId}`,
          updates
        )
      );

      const updated = this.remindersSignal().map((r) =>
        r.reminderId === reminderId ? response : r
      );

      this.remindersSignal.set(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  }

  /**
   * Delete reminder
   */
  async deleteReminder(reminderId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiBaseUrl}/api/reminders/${reminderId}`)
      );

      const updated = this.remindersSignal().filter(
        (r) => r.reminderId !== reminderId
      );

      this.remindersSignal.set(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  }

  /**
   * Check for triggered reminders
   * Legacy: Timer tick handler
   */
  private async checkReminders(): Promise<void> {
    const now = new Date();
    const reminders = this.remindersSignal();

    for (const reminder of reminders) {
      if (
        reminder.isActive &&
        !reminder.isTriggered &&
        reminder.triggerTime <= now
      ) {
        await this.triggerReminder(reminder);
      }
    }
  }

  /**
   * Trigger a reminder
   * Legacy: Show reminder popup
   */
  private async triggerReminder(reminder: Reminder): Promise<void> {
    try {
      // Mark as triggered
      await this.updateReminder(reminder.reminderId, {
        isTriggered: true,
        triggeredAt: new Date(),
      });

      // Play sound if enabled
      if (this.configSignal().enableSound) {
        this.playReminderSound();
      }

      // Emit trigger event (shell app should show popup)
      const event: ReminderTriggerEvent = {
        reminder,
        canRemindLater: true,
        remindLaterInterval: this.configSignal().defaultRemindLaterInterval,
      };

      console.log('Reminder triggered:', event);
    } catch (error) {
      console.error('Failed to trigger reminder:', error);
    }
  }

  /**
   * Remind me later
   * Legacy: "Remind me later" button
   */
  async remindLater(
    reminderId: string,
    intervalMinutes?: number
  ): Promise<void> {
    const interval =
      intervalMinutes || this.configSignal().defaultRemindLaterInterval;
    const newTriggerTime = new Date(Date.now() + interval * 60 * 1000);

    await this.updateReminder(reminderId, {
      triggerTime: newTriggerTime,
      isTriggered: false,
    });
  }

  /**
   * Dismiss reminder
   */
  async dismissReminder(reminderId: string): Promise<void> {
    await this.updateReminder(reminderId, {
      isActive: false,
      dismissedAt: new Date(),
    });
  }

  /**
   * Check expired reminders
   * Legacy: uplExpiredReminders
   */
  async checkExpiredReminders(
    userName: string,
    businessUnit: string
  ): Promise<ExpiredReminders | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<ExpiredReminders>(
          `${this.apiBaseUrl}/api/reminders/expired`,
          {
            params: { userName, businessUnit },
          }
        )
      );

      if (response.count > 0) {
        this.expiredRemindersSignal.set(response.reminders);
        return response;
      }

      return null;
    } catch (error) {
      console.error('Failed to check expired reminders:', error);
      return null;
    }
  }

  /**
   * Play reminder sound
   */
  private playReminderSound(): void {
    const audio = new Audio('assets/sounds/reminder.mp3');
    audio.play().catch((error) => {
      console.warn('Failed to play reminder sound:', error);
    });
  }

  /**
   * Toggle reminder panel
   */
  togglePanel(): void {
    this.panelStateSignal.update((state) => ({
      ...state,
      isOpen: !state.isOpen,
    }));
  }

  /**
   * Select reminder for editing
   */
  selectReminder(reminder: Reminder): void {
    this.panelStateSignal.update((state) => ({
      ...state,
      selectedReminder: reminder,
      isEditMode: true,
    }));
  }

  /**
   * Update panel state
   */
  private updatePanelState(): void {
    this.panelStateSignal.update((state) => ({
      ...state,
      reminders: this.remindersSignal(),
    }));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReminderConfig>): void {
    this.configSignal.update((current) => ({ ...current, ...config }));

    // Restart polling with new interval
    if (config.checkInterval) {
      this.startPolling();
    }
  }
}
