export interface User {
  userId: string;
  userName: string;
  fullName: string;
  email?: string;
  profilePicture?: string;
  isActive: boolean;
  lastLogin?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'blue' | 'green' | 'purple' | 'gray';
  language: 'English' | 'Sinhala' | 'Tamil';
  fontName: string;
  fontSize: number;
  fontColor: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export interface UserSession {
  sessionId: string;
  user: User;
  loginTime: Date;
  lastActivity: Date;
  businessUnit: string;
  currentRole: string;
  permissions: string[];
}
