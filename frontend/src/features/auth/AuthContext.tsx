/**
 * Authentication Context
 * Location: frontend/src/features/auth/AuthContext.tsx
 *
 * Provides authentication state and functions to the app.
 * Handles login, logout, token refresh, and persistence.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthState } from '../../types/auth';
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  getStoredTokens,
  storeTokens,
  clearTokens,
  storeUser,
  getStoredUser,
  setupAuthInterceptor,
} from '../../services/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      const { accessToken, refreshToken } = getStoredTokens();
      const storedUser = getStoredUser();

      if (accessToken && refreshToken && storedUser) {
        // Verify token is still valid by getting current user
        try {
          const user = await getCurrentUser(accessToken);
          storeUser(user);
          setState({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token invalid or expired - clear storage
          clearTokens();
          setState({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  // Setup axios interceptor
  useEffect(() => {
    const getAccessToken = () => state.accessToken;

    const onTokenRefresh = (newToken: string) => {
      setState((prev) => ({ ...prev, accessToken: newToken }));
    };

    const onAuthError = () => {
      clearTokens();
      setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    };

    setupAuthInterceptor(getAccessToken, onTokenRefresh, onAuthError);
  }, [state.accessToken]);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await apiLogin({ email, password });

      storeTokens(response.access_token, response.refresh_token);
      storeUser(response.user as any);

      setState({
        user: response.user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    if (state.accessToken && state.refreshToken) {
      await apiLogout(state.accessToken, state.refreshToken);
    }

    clearTokens();
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, [state.accessToken, state.refreshToken]);

  const refreshUser = useCallback(async () => {
    if (!state.accessToken) return;

    try {
      const user = await getCurrentUser(state.accessToken);
      storeUser(user);
      setState((prev) => ({ ...prev, user }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [state.accessToken]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
