/**
 * Authentication TypeScript types
 * Location: frontend/src/types/auth.ts
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'parent' | 'child';
  color: string;
  avatar_url: string | null;
  tenant_id: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface CurrentUserResponse extends User {
  tenant_name: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// PIN Authentication Types
export interface FamilyMember {
  id: string;
  name: string;
  color: string;
  avatar_url: string | null;
  has_pin: boolean;
}

export interface PinLoginRequest {
  user_id: string;
  pin: string;
}

export interface PinSetupRequest {
  pin: string;
  confirm_pin: string;
}

export interface PinChangeRequest {
  current_pin: string;
  new_pin: string;
  confirm_pin: string;
}

export interface MessageResponse {
  message: string;
}
