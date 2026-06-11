import { httpRequest } from '../api/httpClient';
export function getJockeyProfile() {
    return httpRequest('/api/jockey/profile', {
        fallbackError: 'Không thể tải hồ sơ jockey.'
    });
}
export function createJockeyProfile(payload) {
    return httpRequest('/api/jockey/profile', {
        method: 'POST',
        body: payload,
        fallbackError: 'Tạo hồ sơ jockey thất bại.'
    });
}
export function updateJockeyProfile(payload) {
    return httpRequest('/api/jockey/profile', {
        method: 'PUT',
        body: payload,
        fallbackError: 'Cập nhật hồ sơ jockey thất bại.'
    });
}
// BE hiện tại có DELETE /api/jockey/profile. FE hiển thị như thao tác deactivate/xóa profile để không cần sửa BE.
export function deactivateJockeyProfile() {
    return httpRequest('/api/jockey/profile', {
        method: 'DELETE',
        fallbackError: 'Không thể deactivate hồ sơ jockey.'
    });
}
export function getJockeyInvitations() {
    return httpRequest('/api/jockey/invitations', {
        fallbackError: 'Không thể tải lời mời jockey.'
    });
}
export function acceptJockeyInvitation(invitationId) {
    return httpRequest(`/api/jockey/invitations/${invitationId}/accept`, {
        method: 'PUT',
        fallbackError: 'Chấp nhận lời mời thất bại.'
    });
}
export function rejectJockeyInvitation(invitationId) {
    return httpRequest(`/api/jockey/invitations/${invitationId}/reject`, {
        method: 'PUT',
        fallbackError: 'Từ chối lời mời thất bại.'
    });
}
