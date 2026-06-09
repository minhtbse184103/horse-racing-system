import { httpRequest } from '../api/httpClient';
import type { AdminCreateUserRequest, AdminUpdateUserRequest, AuthUser, Id } from '../types';

export function getUsers(): Promise<AuthUser[]> {
  return httpRequest<AuthUser[]>('/api/admin/users', {
    fallbackError: 'Không thể tải danh sách user.'
  });
}

export function createUser(payload: AdminCreateUserRequest): Promise<AuthUser> {
  return httpRequest<AuthUser, AdminCreateUserRequest>('/api/admin/users', {
    method: 'POST',
    body: payload,
    fallbackError: 'Tạo user thất bại.'
  });
}

export function updateUser(userId: Id, payload: AdminUpdateUserRequest): Promise<AuthUser> {
  return httpRequest<AuthUser, AdminUpdateUserRequest>(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: payload,
    fallbackError: 'Cập nhật user thất bại.'
  });
}

export function deleteUser(userId: Id): Promise<unknown> {
  return httpRequest<unknown>(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    fallbackError: 'Xóa user thất bại.'
  });
}
