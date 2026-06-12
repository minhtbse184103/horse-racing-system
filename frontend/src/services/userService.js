import { httpRequest } from '../api/httpClient';
export function getAllUsers() {
    return httpRequest('/api/user/all', {
        fallbackError: 'Unable to load users.'
    });
}
export function getUsers() {
    return httpRequest('/api/admin/users', {
        fallbackError: 'Unable to load users.'
    });
}
export function createUser(payload) {
    return httpRequest('/api/admin/users', {
        method: 'POST',
        body: payload,
        fallbackError: 'Unable to create the user.'
    });
}
export function updateUser(userId, payload) {
    return httpRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: payload,
        fallbackError: 'Unable to update the user.'
    });
}
export function deleteUser(userId) {
    return httpRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        fallbackError: 'Unable to delete the user.'
    });
}
