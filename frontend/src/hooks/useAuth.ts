import { useState } from 'react';
import { getCurrentUser, getToken, logout } from '../services/authService';
import type { AuthUser } from '../types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => (getToken() ? getCurrentUser() : null));

  function clearAuth(): void {
    logout();
    setUser(null);
  }

  return { user, setUser, clearAuth };
}
