export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSoundNotifications: boolean;
  categories: NotificationCategorySettings[];
}

export interface NotificationCategorySettings {
  category: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  soundEnabled: boolean;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    info: number;
    warning: number;
    error: number;
    success: number;
  };
}
