import { useState } from 'react';
import { loginApi, signupApi } from '../api/authApi';
import {
  saveAuthSession,
  getToken,
  getCurrentUser,
  logout as clearSession,
} from '../services/authService';

/**
 * useAuth hook
 * Quản lý trạng thái đăng nhập và các action: login, signup, logout
 */
export function useAuth() {
  const [user, setUser] = useState(() => (getToken() ? getCurrentUser() : null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAuthenticated = Boolean(user);

  async function login({ email, password }, rememberMe = true) {
    setLoading(true);
    setError('');
    try {
      const data = await loginApi({ email, password });
      saveAuthSession(data, rememberMe);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signup(payload) {
    setLoading(true);
    setError('');
    try {
      const data = await signupApi(payload);
      return data;
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại.');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearSession();
    setUser(null);
    setError('');
  }

  function clearError() {
    setError('');
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    signup,
    logout,
    clearError,
  };
}
