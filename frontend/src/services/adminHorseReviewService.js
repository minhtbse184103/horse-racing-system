import { httpRequest } from '../api/httpClient';

export function getPendingHorses() {
  return httpRequest('/api/admin/horses/pending', {
    fallbackError: 'Unable to load pending horse profiles.'
  });
}

export function approveHorse(horseId) {
  return httpRequest(`/api/admin/horses/${horseId}/approve`, {
    method: 'PUT',
    fallbackError: 'Unable to approve the horse profile.'
  });
}

export function rejectHorse(horseId, feedback) {
  return httpRequest(`/api/admin/horses/${horseId}/reject`, {
    method: 'PUT',
    body: { feedback },
    fallbackError: 'Unable to reject the horse profile.'
  });
}
