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
    fallbackError: 'Không thể tải thông tin ngựa.'
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
