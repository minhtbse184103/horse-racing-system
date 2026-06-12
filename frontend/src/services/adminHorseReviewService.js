import { httpRequest } from '../api/httpClient';

export function getPendingHorses() {
  return httpRequest('/api/admin/horses/pending', {
    fallbackError: 'Không thể tải hồ sơ ngựa đang chờ duyệt.'
  });
}

export function approveHorse(horseId) {
  return httpRequest(`/api/admin/horses/${horseId}/approve`, {
    method: 'PUT',
    fallbackError: 'Không thể phê duyệt hồ sơ ngựa.'
  });
}

export function rejectHorse(horseId, feedback) {
  return httpRequest(`/api/admin/horses/${horseId}/reject`, {
    method: 'PUT',
    body: { feedback },
    fallbackError: 'Không thể từ chối hồ sơ ngựa.'
  });
}
