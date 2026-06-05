const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function getErrorMessage(data, fallbackMessage) {
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return data;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((error) => error.defaultMessage || error.message || String(error)).join('\n');
  }
  return fallbackMessage;
}

export async function login({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Backend may return empty body in some errors.
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Đăng nhập thất bại. Vui lòng thử lại.'));
  }

  if (!data?.token || !data?.user) {
    throw new Error('Response login không hợp lệ: thiếu token hoặc user.');
  }

  return data;
}

export async function signup({ email, fullName, phone, password, roleName }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      fullName,
      phone,
      password,
      roleName
    })
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Backend may return empty body in some errors.
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Đăng ký thất bại. Vui lòng thử lại.'));
  }

  return data;
}

export function startGoogleLogin() {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
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