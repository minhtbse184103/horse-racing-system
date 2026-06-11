import { httpRequest } from '../api/httpClient';
export function getOwnerDashboard() {
    return httpRequest('/api/owner/dashboard', {
        fallbackError: 'Không thể tải dashboard chủ ngựa.'
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
        fallbackError: 'Thêm ngựa thất bại.'
    });
}
export function updateHorse(horseId, payload) {
    return httpRequest(`/api/owner/horses/${horseId}`, {
        method: 'PUT',
        body: payload,
        fallbackError: 'Cập nhật ngựa thất bại.'
    });
}
export function deleteHorse(horseId) {
    return httpRequest(`/api/owner/horses/${horseId}`, {
        method: 'DELETE',
        fallbackError: 'Xóa ngựa thất bại.'
    });
}
export function getTournaments() {
    return httpRequest('/api/tournaments', {
        fallbackError: 'Không thể tải danh sách giải đấu.'
    });
}
export function getOwnerInvitations() {
    return httpRequest('/api/owner/invitations', {
        fallbackError: 'Không thể tải danh sách lời mời jockey.'
    });
}
export function inviteJockey(payload) {
    return httpRequest('/api/owner/invitations', {
        method: 'POST',
        body: payload,
        fallbackError: 'Gửi lời mời jockey thất bại.'
    });
}
export function cancelOwnerInvitation(invitationId) {
    return httpRequest(`/api/owner/invitations/${invitationId}/cancel`, {
        method: 'PUT',
        fallbackError: 'Hủy lời mời jockey thất bại.'
    });
}
