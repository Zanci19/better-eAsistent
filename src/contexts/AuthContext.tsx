import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { type LoginResponse, login as apiLogin, refreshToken } from '../services/api';

interface AuthState {
  accessToken: string | null;
  refreshTokenValue: string | null;
  sessionToken: string | null;
  tokenExpiry: string | null;
  user: LoginResponse['user'] | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'easistent_auth';
const TOKEN_REFRESH_BUFFER_MS = 60_000;

const AuthContext = createContext<AuthContextValue | null>(null);

function loadFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AuthState;
    }
  } catch {
    // ignore
  }
  return {
    accessToken: null,
    refreshTokenValue: null,
    sessionToken: null,
    tokenExpiry: null,
    user: null,
  };
}

function saveToStorage(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(loadFromStorage);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiLogin(username, password);
      const newState: AuthState = {
        accessToken: response.access_token.token,
        refreshTokenValue: response.refresh_token,
        sessionToken: null,
        tokenExpiry: response.access_token.expiration_date,
        user: response.user,
      };
      setState(newState);
      saveToStorage(newState);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setState({
      accessToken: null,
      refreshTokenValue: null,
      sessionToken: null,
      tokenExpiry: null,
      user: null,
    });
    clearStorage();
  }, []);

  useEffect(() => {
    if (!state.accessToken || !state.tokenExpiry) return;

    const expiry = new Date(state.tokenExpiry).getTime();
    const now = Date.now();
    const msUntilExpiry = expiry - now - TOKEN_REFRESH_BUFFER_MS;

    if (msUntilExpiry <= 0) {
      if (state.refreshTokenValue) {
        refreshToken(state.refreshTokenValue, state.sessionToken ?? '').then((res) => {
          const updated: AuthState = {
            ...state,
            accessToken: res.access_token.token,
            tokenExpiry: res.access_token.expiration_date,
            refreshTokenValue: res.refresh_token,
          };
          setState(updated);
          saveToStorage(updated);
        }).catch(() => logout());
      } else {
        logout();
      }
      return;
    }

    const timer = setTimeout(() => {
      if (state.refreshTokenValue) {
        refreshToken(state.refreshTokenValue, state.sessionToken ?? '').then((res) => {
          const updated: AuthState = {
            ...state,
            accessToken: res.access_token.token,
            tokenExpiry: res.access_token.expiration_date,
            refreshTokenValue: res.refresh_token,
          };
          setState(updated);
          saveToStorage(updated);
        }).catch(() => logout());
      } else {
        logout();
      }
    }, msUntilExpiry);

    return () => clearTimeout(timer);
  }, [state, logout]);

  const value: AuthContextValue = {
    ...state,
    isAuthenticated: !!state.accessToken,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
