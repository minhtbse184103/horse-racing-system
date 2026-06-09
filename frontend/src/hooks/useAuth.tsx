import { useState } from 'react';
import { getCurrentUser, getToken, logout } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState(() => (getToken() ? getCurrentUser() : null));

  function clearAuth() {
    logout();
    setUser(null);
  }

  return { user, setUser, clearAuth };
}
