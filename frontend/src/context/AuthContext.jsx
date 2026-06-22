import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService.js';
import { getState } from '../services/mockStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.getMe();
    setUser(currentUser);
    return currentUser;
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setBooting(false));

    const handler = () => {
      refreshUser();
    };

    window.addEventListener('horse-racing-auth-updated', handler);
    window.addEventListener('horse-racing-store-updated', handler);
    return () => {
      window.removeEventListener('horse-racing-auth-updated', handler);
      window.removeEventListener('horse-racing-store-updated', handler);
    };
  }, [refreshUser]);

  const login = useCallback(async (payload) => {
    const loggedInUser = await authService.login(payload);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => authService.register(payload), []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const notifications = useMemo(() => {
    if (!user) return [];
    const state = getState();
    return state.notifications
      .filter((notification) => notification.userID === user.userID)
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [user]);

  const value = useMemo(
    () => ({ user, booting, login, register, logout, refreshUser, notifications }),
    [user, booting, login, register, logout, refreshUser, notifications]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
