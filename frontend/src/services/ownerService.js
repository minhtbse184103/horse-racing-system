import { httpRequest } from '../api/httpClient';
export function getOwnerDashboard() {
    return httpRequest('/api/owner/dashboard', {
        fallbackError: 'Không thể tải bảng điều khiển chủ ngựa.'
    });
}
export function getOwnerHorses() {
    return httpRequest('/api/owner/horses', {
        fallbackError: 'Không thể tải danh sách ngựa.'
    });
}
export function getOwnerHorseById(horseId) {
    return httpRequest(`/api/owner/horses/${horseId}`, {
        fallbackError: 'Không thể tải chi tiết ngựa.'
    });
}
export function createHorse(payload) {
    return httpRequest('/api/owner/horses', {
        method: 'POST',
        body: payload,
        fallbackError: 'Không thể thêm ngựa.'
    });
}
export function updateHorse(horseId, payload) {
    return httpRequest(`/api/owner/horses/${horseId}`, {
        method: 'PUT',
        body: payload,
        fallbackError: 'Không thể cập nhật ngựa.'
    });
}
export function deleteHorse(horseId) {
    return httpRequest(`/api/owner/horses/${horseId}`, {
        method: 'DELETE',
        fallbackError: 'Không thể xóa ngựa.'
    });
}
export function getTournaments() {
    return httpRequest('/api/tournaments', {
        fallbackError: 'Không thể tải danh sách giải đấu.'
    });
}
export function getOwnerInvitations() {
    return httpRequest('/api/owner/invitations', {
        fallbackError: 'Không thể tải lời mời nài ngựa.'
    });
}
export function inviteJockey(payload) {
    return httpRequest('/api/owner/invitations', {
        method: 'POST',
        body: payload,
        fallbackError: 'Không thể gửi lời mời nài ngựa.'
    });
}
export function cancelOwnerInvitation(invitationId) {
    return httpRequest(`/api/owner/invitations/${invitationId}/cancel`, {
        method: 'PUT',
        fallbackError: 'Không thể hủy lời mời nài ngựa.'
    });
}
