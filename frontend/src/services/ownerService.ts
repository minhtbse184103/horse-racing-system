import { httpRequest } from '../api/httpClient';
import type { Horse, HorsePayload, Id, OwnerDashboardData } from '../types';

export function getOwnerDashboard(): Promise<OwnerDashboardData> {
  return httpRequest<OwnerDashboardData>('/api/owner/dashboard', {
    fallbackError: 'Không thể tải dashboard chủ ngựa.'
  });
}

export function getOwnerHorses(): Promise<Horse[]> {
  return httpRequest<Horse[]>('/api/owner/horses', {
    fallbackError: 'Không thể tải danh sách ngựa.'
  });
}

export function getOwnerHorseById(horseId: Id): Promise<Horse> {
  return httpRequest<Horse>(`/api/owner/horses/${horseId}`, {
    fallbackError: 'Không thể tải thông tin ngựa.'
  });
}

export function createHorse(payload: HorsePayload): Promise<Horse> {
  return httpRequest<Horse, HorsePayload>('/api/owner/horses', {
    method: 'POST',
    body: payload,
    fallbackError: 'Thêm ngựa thất bại.'
  });
}

export function updateHorse(horseId: Id, payload: HorsePayload): Promise<Horse> {
  return httpRequest<Horse, HorsePayload>(`/api/owner/horses/${horseId}`, {
    method: 'PUT',
    body: payload,
    fallbackError: 'Cập nhật ngựa thất bại.'
  });
}

export function deleteHorse(horseId: Id): Promise<unknown> {
  return httpRequest<unknown>(`/api/owner/horses/${horseId}`, {
    method: 'DELETE',
    fallbackError: 'Xóa ngựa thất bại.'
  });
}
