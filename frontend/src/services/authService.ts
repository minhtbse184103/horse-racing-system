import API_BASE_URL from '../configs/apiConfig';
import { httpRequest } from '../api/httpClient';

export type Id = number | string;
export type UserRole = 'ADMIN' | 'OWNER' | 'JOCKEY' | 'REFEREE' | 'SPECTATOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'BANNED' | string;

export interface AuthUser {
  id?: Id;
  Id?: Id;
  userID?: Id;
  userId?: Id;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: UserRole | string;
  roleName?: UserRole | string;
  userRole?: UserRole | string;
  status?: UserStatus;
  authorities?: Array<{ authority?: string }>;
  roles?: Array<{ name?: string } | string>;
  [key: string]: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface SignupRequest {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  roleName: 'OWNER' | 'JOCKEY' | 'SPECTATOR';
}

// MERGED FROM ZIP FRONTEND:
// Auth service now uses shared request/response types with the typed HTTP helper.
export function login({ email, password }: LoginRequest): Promise<LoginResponse> {
  return httpRequest<LoginResponse, LoginRequest>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
    fallbackError: 'Đăng nhập thất bại. Vui lòng thử lại.'
  }).then((data) => {
    if (!data?.token || !data?.user) {
      throw new Error('Đăng nhập thất bại. Hệ thống chưa trả đủ thông tin đăng nhập.');
    }
    return data;
  });
}

export function signup({ email, fullName, phone, password, roleName }: SignupRequest): Promise<unknown> {
  return httpRequest<unknown, SignupRequest>('/api/auth/signup', {
    method: 'POST',
    auth: false,
    body: { email, fullName, phone, password, roleName },
    fallbackError: 'Đăng ký thất bại. Vui lòng thử lại.'
  });
}

export function startGoogleLogin(): void {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
}

export function saveAuthSession(loginResponse: LoginResponse, rememberMe: boolean): void {
  const storage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  otherStorage.removeItem('token');
  otherStorage.removeItem('user');

  storage.setItem('token', loginResponse.token);
  storage.setItem('user', JSON.stringify(loginResponse.user));
}

export function getCurrentUser(): AuthUser | null {
  const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson) as AuthUser;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}
