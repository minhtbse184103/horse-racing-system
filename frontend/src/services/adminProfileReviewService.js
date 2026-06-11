import { httpRequest } from '../api/httpClient';

export function getJockeyProfilesUnderReview() {
  return httpRequest('/api/admin/jockey-profiles/under-review', {
    fallbackError: 'Unable to load jockey profiles under review.'
  });
}

export function approveJockeyProfile(jockeyId) {
  return httpRequest(`/api/admin/jockey-profiles/${jockeyId}/approve`, {
    method: 'PUT',
    fallbackError: 'Unable to approve jockey profile.'
  });
}

export function rejectJockeyProfile(jockeyId, feedback) {
  return httpRequest(`/api/admin/jockey-profiles/${jockeyId}/reject`, {
    method: 'PUT',
    body: { feedback },
    fallbackError: 'Unable to reject jockey profile.'
  });
}