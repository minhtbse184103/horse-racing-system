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
    fallbackError: 'Không thể tạo hồ sơ jockey.'
  });
}

export function updateJockeyProfile(payload) {
  return httpRequest('/api/jockey/profile', {
    method: 'PUT',
    body: payload,
    fallbackError: 'Không thể cập nhật hồ sơ jockey.'
  });
}

// Backend dùng PUT /api/jockey/profile/inactive để vô hiệu hóa hồ sơ jockey.
export function deactivateJockeyProfile() {
  return httpRequest('/api/jockey/profile/inactive', {
    method: 'PUT',
    fallbackError: 'Không thể vô hiệu hóa hồ sơ jockey.'
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
    fallbackError: 'Không thể chấp nhận lời mời.'
  });
}

export function rejectJockeyInvitation(invitationId) {
  return httpRequest(`/api/jockey/invitations/${invitationId}/reject`, {
    method: 'PUT',
    fallbackError: 'Không thể từ chối lời mời.'
  });
}

export function toJockeyProfilePayload(form) {
  return {
    applicantFullName: String(form.applicantFullName || '').trim(),
    applicantEmail: String(form.applicantEmail || '').trim(),
    phoneNumber: String(form.phoneNumber || '').trim(),
    trainerName: String(form.trainerName || '').trim(),
    trainerEmail: String(form.trainerEmail || '').trim(),
    stableAddress: String(form.stableAddress || '').trim(),
    issuingAuthority: String(form.issuingAuthority || '').trim(),
    verificationLink: String(form.verificationLink || '').trim(),
    licenseFileName: String(form.licenseFileName || '').trim(),

    weight: Number(form.weight || 55),
    ranking: form.ranking || 'BEGINNER',
    biography: String(form.biography || '').trim()
  };
}

