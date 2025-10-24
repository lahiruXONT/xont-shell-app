import { User } from './user.model';

export interface LoginRequest {
  userName: string;
  password: string;
  businessUnit: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
  message?: string;
}
