import { Injectable, signal, computed } from '@angular/core';
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
import { API_URL } from '../../public-api';

/**
 * Reminder Service
 * Legacy: Reminder system from Main.aspx right sidebar
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

  readonly upcomingReminders = computed(() => {
    const now = new Date();
    return this.remindersSignal().filter(
      (r) => r.isActive && r.triggerTime > now && !r.isTriggered
    );
  });

  readonly expiredCount = computed(() => this.expiredRemindersSignal().length);

  constructor(
    private http: HttpClient,
    @Inject(API_URL) @Optional() private apiUrl?: string
  ) {
    this.startPolling();
  }

  private getApiBase(): string {
    if (this.apiUrl) return this.apiUrl;
    if (typeof window !== 'undefined' && (window as any).__XONT_API_URL__) {
      return (window as any).__XONT_API_URL__;
    }
    return '';
  }

  /**
   * Start polling for reminders
   * Legacy: Periodic check for reminder triggers
   */
  private startPolling(): void {
    const checkInterval = this.configSignal().checkInterval;

    this.pollingSubscription = interval(checkInterval).subscribe(() => {
      this.checkReminders();
    });
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Load reminders from server
   * Legacy: Load reminders on page load
   */
  async loadReminders(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<Reminder[]>(`${this.getApiBase()}/api/reminders`)
      );

      this.remindersSignal.set(response);
      this.updatePanelState();

      // Check for expired reminders
      if (this.configSignal().showExpiredOnLogin) {
        this.checkForExpiredReminders();
      }

      // Check for immediate triggers
      this.checkReminders();
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  }

  /**
   * Check reminders for triggers
   * Legacy: Periodic reminder check
   */
  private checkReminders(): void {
    const now = new Date();
    const reminders = this.remindersSignal();

    reminders.forEach((reminder) => {
      if (
        reminder.isActive &&
        !reminder.isTriggered &&
        reminder.triggerTime <= now
      ) {
        this.triggerReminder(reminder);
      }
    });
  }

  /**
   * Trigger a reminder
   * Legacy: Show reminder popup
   */
  private triggerReminder(reminder: Reminder): void {
    // Update reminder as triggered
    const updated = {
      ...reminder,
      isTriggered: true,
      triggeredAt: new Date(),
    };

    this.updateReminder(updated);

    // Create trigger event
    const event: ReminderTriggerEvent = {
      reminder: updated,
      canRemindLater: true,
      remindLaterInterval: this.configSignal().defaultRemindLaterInterval,
    };

    // Emit event (component will show modal)
    console.log('Reminder triggered:', event);

    // Play sound if enabled
    if (this.configSignal().enableSound) {
      this.playReminderSound();
    }
  }

  /**
   * Check for expired reminders on login
   * Legacy: Show expired reminders modal
   */
  private checkForExpiredReminders(): void {
    const now = new Date();
    const expired = this.remindersSignal().filter(
      (r) => r.isActive && r.triggerTime < now && !r.isTriggered
    );

    if (expired.length > 0) {
      this.expiredRemindersSignal.set(expired);
      console.log('Expired reminders found:', expired.length);
    }
  }

  /**
   * Create new reminder
   * Legacy: Add new reminder
   */
  async createReminder(reminder: Partial<Reminder>): Promise<Reminder> {
    try {
      const response = await firstValueFrom(
        this.http.post<Reminder>(`${this.getApiBase()}/api/reminders`, reminder)
      );

      const reminders = this.remindersSignal();
      this.remindersSignal.set([...reminders, response]);
      this.updatePanelState();

      return response;
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw error;
    }
  }

  /**
   * Update reminder
   */
  async updateReminder(reminder: Reminder): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(
          `${this.getApiBase()}/api/reminders/${reminder.reminderId}`,
          reminder
        )
      );

      const reminders = this.remindersSignal();
      const updated = reminders.map((r) =>
        r.reminderId === reminder.reminderId ? reminder : r
      );

      this.remindersSignal.set(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  }

  /**
   * Delete reminder(s)
   * Legacy: PageMethods.deleteReminders(arrReminderID)
   */
  async deleteReminders(reminderIds: string[]): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.getApiBase()}/api/reminders/delete`, {
          ids: reminderIds,
        })
      );

      const reminders = this.remindersSignal();
      const updated = reminders.filter(
        (r) => !reminderIds.includes(r.reminderId)
      );

      this.remindersSignal.set(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to delete reminders:', error);
      throw error;
    }
  }

  /**
   * Snooze reminder (remind me later)
   * Legacy: Remind later functionality
   */
  async snoozeReminder(
    reminderId: string,
    minutes: number = 10
  ): Promise<void> {
    const reminder = this.findReminderById(reminderId);
    if (!reminder) return;

    const newTriggerTime = new Date();
    newTriggerTime.setMinutes(newTriggerTime.getMinutes() + minutes);

    const updated = {
      ...reminder,
      triggerTime: newTriggerTime,
      isTriggered: false,
    };

    await this.updateReminder(updated);
  }

  /**
   * Dismiss reminder
   */
  async dismissReminder(reminderId: string): Promise<void> {
    const reminder = this.findReminderById(reminderId);
    if (!reminder) return;

    const updated = {
      ...reminder,
      isActive: false,
      dismissedAt: new Date(),
    };

    await this.updateReminder(updated);
  }

  /**
   * Dispatch nearest reminder
   * Legacy: Show nearest upcoming reminder
   */
  dispatchNearestReminder(): Reminder | null {
    const upcoming = this.upcomingReminders();
    if (upcoming.length === 0) return null;

    // Sort by trigger time
    const sorted = [...upcoming].sort(
      (a, b) => a.triggerTime.getTime() - b.triggerTime.getTime()
    );

    return sorted[0];
  }

  /**
   * Get reminder by ID
   */
  findReminderById(reminderId: string): Reminder | undefined {
    return this.remindersSignal().find((r) => r.reminderId === reminderId);
  }

  /**
   * Select reminder for editing
   */
  selectReminder(reminder: Reminder): void {
    const state = this.panelStateSignal();
    this.panelStateSignal.set({
      ...state,
      selectedReminder: reminder,
      isEditMode: true,
      isCreatingNew: false,
    });
  }

  /**
   * Start creating new reminder
   */
  startCreatingNew(): void {
    const state = this.panelStateSignal();
    this.panelStateSignal.set({
      ...state,
      selectedReminder: null,
      isEditMode: false,
      isCreatingNew: true,
      showCalendar: true,
    });
  }

  /**
   * Cancel editing/creating
   */
  cancelEditing(): void {
    const state = this.panelStateSignal();
    this.panelStateSignal.set({
      ...state,
      selectedReminder: null,
      isEditMode: false,
      isCreatingNew: false,
      showCalendar: false,
    });
  }

  /**
   * Toggle calendar display
   */
  toggleCalendar(): void {
    const state = this.panelStateSignal();
    this.panelStateSignal.set({
      ...state,
      showCalendar: !state.showCalendar,
    });
  }

  /**
   * Update panel state
   */
  private updatePanelState(): void {
    const state = this.panelStateSignal();
    this.panelStateSignal.set({
      ...state,
      reminders: this.remindersSignal(),
    });
  }

  /**
   * Play reminder sound
   */
  private playReminderSound(): void {
    const audio = new Audio('assets/audio/reminder.mp3');
    audio.play().catch((error) => {
      console.error('Failed to play reminder sound:', error);
    });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReminderConfig>): void {
    this.configSignal.update((current) => ({ ...current, ...config }));

    // Restart polling if interval changed
    if (config.checkInterval) {
      this.stopPolling();
      this.startPolling();
    }
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this.stopPolling();
  }
}
