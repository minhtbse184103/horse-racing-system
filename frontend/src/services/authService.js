import { httpRequest } from '../api/httpClient';

export function login({ email, password }) {
  return httpRequest('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
    fallbackError: 'Sign in failed. Please try again.'
  }).then((data) => {
    if (!data?.token || !data?.user) {
      throw new Error('Sign in failed because the server response was incomplete.');
    }
    return data;
  });
}

export function signup({ email, fullName, phone, password, roleName }) {
  return httpRequest('/api/auth/signup', {
    method: 'POST',
    auth: false,
    body: { email, fullName, phone, password, roleName },
    fallbackError: 'Registration failed. Please try again.'
  });
}

export function saveAuthSession(loginResponse, rememberMe) {
  const storage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  otherStorage.removeItem('token');
  otherStorage.removeItem('user');

  storage.setItem('token', loginResponse.token);
  storage.setItem('user', JSON.stringify(loginResponse.user));
}

export function getCurrentUser() {
  const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}
