import { Injectable } from '@angular/core';
import { UserSession, SessionStorage } from './models/session.model';

@Injectable({
  providedIn: 'root',
})
export class SessionService implements SessionStorage {
  private readonly SESSION_KEY = 'tab-manager-session';

  save(session: UserSession): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const sessionData = {
          ...session,
          loginTime: session.loginTime.toISOString(),
          lastActivity: session.lastActivity.toISOString(),
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          tabs: session.tabs.map((tab) => ({
            ...tab,
            createdAt: tab.createdAt.toISOString(),
            lastAccessedAt: tab.lastAccessedAt.toISOString(),
          })),
        };

        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  load(sessionId: string): Promise<UserSession | null> {
    return new Promise((resolve) => {
      try {
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        if (!sessionData) {
          resolve(null);
          return;
        }

        const parsed = JSON.parse(sessionData) as any;
        resolve({
          ...parsed,
          loginTime: new Date(parsed.loginTime),
          lastActivity: new Date(parsed.lastActivity),
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt),
          tabs: parsed.tabs.map((tab: any) => ({
            ...tab,
            createdAt: new Date(tab.createdAt),
            lastAccessedAt: new Date(tab.lastAccessedAt),
          })),
        });
      } catch (error) {
        resolve(null);
      }
    });
  }

  remove(sessionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        localStorage.removeItem(this.SESSION_KEY);
        resolve(true);
      } catch (error) {
        resolve(false);
      }
    });
  }

  cleanup(olderThanDays: number): Promise<number> {
    return new Promise((resolve) => {
      try {
        // For now, just return 0 as we're not implementing cleanup
        resolve(0);
      } catch (error) {
        resolve(0);
      }
    });
  }

  saveTabSession(tab: any): void {
    try {
      const tabs = JSON.parse(localStorage.getItem('tab-sessions') || '[]');
      const existingIndex = tabs.findIndex((t: any) => t.id === tab.id);

      if (existingIndex >= 0) {
        tabs[existingIndex] = tab;
      } else {
        tabs.push(tab);
      }

      localStorage.setItem('tab-sessions', JSON.stringify(tabs));
    } catch (error) {
      console.error('Failed to save tab session:', error);
    }
  }

  removeTabSession(tabId: string): void {
    try {
      const tabs = JSON.parse(localStorage.getItem('tab-sessions') || '[]');
      const filteredTabs = tabs.filter((tab: any) => tab.id !== tabId);
      localStorage.setItem('tab-sessions', JSON.stringify(filteredTabs));
    } catch (error) {
      console.error('Failed to remove tab session:', error);
    }
  }

  updateActiveTab(tabId: string): void {
    try {
      localStorage.setItem('active-tab-id', tabId);
    } catch (error) {
      console.error('Failed to update active tab:', error);
    }
  }
}
