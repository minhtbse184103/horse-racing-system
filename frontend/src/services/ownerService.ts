import { httpRequest } from '../api/httpClient';
import type { Id } from './authService';

export type HorseStatus = 'ACTIVE' | 'INJURED' | 'RETIRED' | 'SUSPENDED' | 'INACTIVE' | string;
export type HorseGender = 'MALE' | 'FEMALE' | 'UNKNOWN' | string;

export interface Horse {
  horseId?: Id;
  horseID?: Id;
  id?: Id;
  horseName?: string;
  name?: string;
  breed?: string | null;
  gender?: HorseGender | null;
  color?: string | null;
  dayOfBirth?: string | null;
  weight?: number | string | null;
  healthCertExpiry?: string | null;
  status?: HorseStatus | null;
  registrationCount?: number | string | null;
  participated?: boolean;
  [key: string]: unknown;
}

export interface HorseFormValues {
  horseName: string;
  breed: string;
  gender: HorseGender;
  color: string;
  dayOfBirth: string;
  weight: number | string;
  healthCertExpiry: string;
  status: HorseStatus;
}

export interface HorsePayload {
  horseName: string;
  breed: string | null;
  gender: HorseGender | null;
  color: string | null;
  dayOfBirth: string | null;
  weight: number;
  healthCertExpiry: string | null;
  status: HorseStatus | null;
}

export interface OwnerDashboardData {
  ownerId?: Id;
  ownerName?: string;
  totalHorses?: number;
  totalRegistrations?: number;
  registeredHorses?: number;
  participatedHorses?: number;
  [key: string]: unknown;
}

// MERGED FROM ZIP FRONTEND:
// Owner horse APIs now send the backend DTO fields: horseName, color, dayOfBirth, weight.
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
