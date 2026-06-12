import { httpRequest } from '../api/httpClient';

export function getJockeyProfilesUnderReview() {
  return httpRequest('/api/admin/jockey-profiles/under-review', {
    fallbackError: 'Không thể tải hồ sơ jockey đang chờ duyệt.'
  });
}

export function approveJockeyProfile(jockeyId) {
  return httpRequest(`/api/admin/jockey-profiles/${jockeyId}/approve`, {
    method: 'PUT',
    fallbackError: 'Không thể phê duyệt hồ sơ jockey.'
  });
}

export function rejectJockeyProfile(jockeyId, feedback) {
  return httpRequest(`/api/admin/jockey-profiles/${jockeyId}/reject`, {
    method: 'PUT',
    body: { feedback },
    fallbackError: 'Không thể từ chối hồ sơ jockey.'
  });
}