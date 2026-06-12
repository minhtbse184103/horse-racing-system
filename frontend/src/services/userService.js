import { httpRequest } from '../api/httpClient';
export function getAllUsers() {
    return httpRequest('/api/user/all', {
        fallbackError: 'Không thể tải danh sách người dùng.'
    });
}
export function getUsers() {
    return httpRequest('/api/admin/users', {
        fallbackError: 'Không thể tải danh sách người dùng.'
    });
}
export function createUser(payload) {
    return httpRequest('/api/admin/users', {
        method: 'POST',
        body: payload,
        fallbackError: 'Không thể tạo người dùng.'
    });
}
export function updateUser(userId, payload) {
    return httpRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: payload,
        fallbackError: 'Không thể cập nhật người dùng.'
    });
}
export function deleteUser(userId) {
    return httpRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        fallbackError: 'Không thể xóa người dùng.'
    });
}
