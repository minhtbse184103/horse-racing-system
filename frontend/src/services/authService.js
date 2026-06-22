import API_BASE_URL from '../configs/apiConfig';
import { httpRequest } from '../api/httpClient';

export async function login({ email, password }) {
  return httpRequest('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
    fallbackError: 'Dang nhap that bai. Vui long thu lai.'
  }).then((data) => {
    if (!data?.token || !data?.user) {
      throw new Error('Dang nhap that bai. He thong khong tra ve day du thong tin dang nhap.');
    }
    return data;
  });
}

export async function signup({ username, email, phone, password }) {
  return httpRequest('/api/auth/signup', {
    method: 'POST',
    auth: false,
    body: { username, email, phone, password },
    fallbackError: 'Dang ky that bai. Vui long thu lai.'
  });
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

export async function getMe() {
  return httpRequest('/api/user/me', {
    fallbackError: 'Khong the lay thong tin nguoi dung hien tai.'
  });
}

export async function updateMyAccount({ email, phone }) {
  return httpRequest('/api/user/me/account', {
    method: 'PUT',
    body: { email, phone },
    fallbackError: 'Khong the cap nhat thong tin tai khoan.'
  });
}

export function updateStoredUser(user) {
  const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
  storage.setItem('user', JSON.stringify(user));
}
