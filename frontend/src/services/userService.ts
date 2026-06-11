import { httpRequest } from '../api/httpClient';
import type { AuthUser, Id } from './authService';

export function getAllUsers(): Promise<AuthUser[]> {
  return httpRequest<AuthUser[]>('/api/user/all', {
    fallbackError: 'Không thể tải danh sách user.'
  });
}

export function getUsers(): Promise<AuthUser[]> {
  return httpRequest<AuthUser[]>('/api/admin/users', {
    fallbackError: 'Không thể tải danh sách user.'
  });
}

export function createUser(payload: unknown): Promise<unknown> {
  return httpRequest('/api/admin/users', {
    method: 'POST',
    body: payload,
    fallbackError: 'Tạo user thất bại.'
  });
}

export function updateUser(userId: Id, payload: unknown): Promise<unknown> {
  return httpRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: payload,
    fallbackError: 'Cập nhật user thất bại.'
  });
}

export function deleteUser(userId: Id): Promise<unknown> {
  return httpRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    fallbackError: 'Xóa user thất bại.'
  });
}
