import { httpRequest } from '../api/httpClient';

export function getJockeyProfile() {
  return httpRequest('/api/jockey/profile', {
    fallbackError: 'Không thể tải hồ sơ nài ngựa.'
  });
}

export function createJockeyProfile(payload) {
  return httpRequest('/api/jockey/profile', {
    method: 'POST',
    body: payload,
    fallbackError: 'Không thể tạo hồ sơ nài ngựa.'
  });
}

export function updateJockeyProfile(payload) {
  return httpRequest('/api/jockey/profile', {
    method: 'PUT',
    body: payload,
    fallbackError: 'Không thể cập nhật hồ sơ nài ngựa.'
  });
}

// Backend dùng PUT /api/jockey/profile/inactive để vô hiệu hóa hồ sơ nài ngựa.
export function deactivateJockeyProfile() {
  return httpRequest('/api/jockey/profile/inactive', {
    method: 'PUT',
    fallbackError: 'Không thể vô hiệu hóa hồ sơ nài ngựa.'
  });
}

export function getJockeyInvitations() {
  return httpRequest('/api/jockey/invitations', {
    fallbackError: 'Không thể tải lời mời nài ngựa.'
  });
}

export function acceptJockeyInvitation(invitationId) {
  return httpRequest(`/api/jockey/invitations/${invitationId}/accept`, {
    method: 'PUT',
    fallbackError: 'Không thể chấp nhận lời mời.'
  });
}

export function rejectJockeyInvitation(invitationId) {
  return httpRequest(`/api/jockey/invitations/${invitationId}/reject`, {
    method: 'PUT',
    fallbackError: 'Không thể từ chối lời mời.'
  });
}
