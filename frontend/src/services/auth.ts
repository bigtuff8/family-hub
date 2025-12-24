/**
 * Authentication API service
 * Location: frontend/src/services/auth.ts
 */

import axios from 'axios';
import type { LoginRequest, TokenResponse, RefreshResponse, CurrentUserResponse } from '../types/auth';

const API_URL = '';

// Create axios instance for auth
const authApi = axios.create({
  baseURL: `/api/v1/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for authenticated requests
export const api = axios.create({
  baseURL: `/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'familyhub_access_token';
const REFRESH_TOKEN_KEY = 'familyhub_refresh_token';
const USER_KEY = 'familyhub_user';

// Token storage functions
export const getStoredTokens = () => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
});

export const storeTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const storeUser = (user: CurrentUserResponse) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// API functions
export const login = async (credentials: LoginRequest): Promise<TokenResponse> => {
  const response = await authApi.post<TokenResponse>('/login', credentials);
  return response.data;
};

export const refreshAccessToken = async (refreshToken: string): Promise<RefreshResponse> => {
  const response = await authApi.post<RefreshResponse>('/refresh', {
    refresh_token: refreshToken,
  });
  return response.data;
};

export const logout = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    await authApi.post(
      '/logout',
      { refresh_token: refreshToken },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch (error) {
    // Even if logout fails on server, we'll clear local tokens
    console.error('Logout API error:', error);
  }
};

export const getCurrentUser = async (accessToken: string): Promise<CurrentUserResponse> => {
  const response = await authApi.get<CurrentUserResponse>('/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
};

// Setup axios interceptor for authenticated requests
export const setupAuthInterceptor = (
  getAccessToken: () => string | null,
  onTokenRefresh: (newToken: string) => void,
  onAuthError: () => void
) => {
  // Request interceptor - add token to requests
  api.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle 401 errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If 401 and we haven't tried refreshing yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const { refreshToken } = getStoredTokens();
        if (refreshToken) {
          try {
            const response = await refreshAccessToken(refreshToken);
            const newAccessToken = response.access_token;

            // Update stored token
            localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
            onTokenRefresh(newAccessToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout
            onAuthError();
            return Promise.reject(refreshError);
          }
        } else {
          onAuthError();
        }
      }

      return Promise.reject(error);
    }
  );
};
