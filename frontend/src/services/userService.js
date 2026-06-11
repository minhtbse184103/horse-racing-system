import { httpRequest } from '../api/httpClient';

export function getUsers() {
  return httpRequest('/api/admin/users', {
    fallbackError: 'Không thể tải danh sách user.'
  });
}

export function createUser(payload) {
  return httpRequest('/api/admin/users', {
    method: 'POST',
    body: payload,
    fallbackError: 'Tạo user thất bại.'
  });
}

export function updateUser(userId, payload) {
  return httpRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: payload,
    fallbackError: 'Cập nhật user thất bại.'
  });
}

export function deleteUser(userId) {
  return httpRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    fallbackError: 'Xóa user thất bại.'
  });
}
