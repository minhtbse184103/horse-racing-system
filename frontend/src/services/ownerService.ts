import { httpRequest } from '../api/httpClient';
import type { Id } from './authService';

export type HorseStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED' | string;
export type HorseGender = 'MALE' | 'FEMALE' | string;

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
  rejectionReason?: string | null;
  imgUrl?: string | null;
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
  imgUrl: string;
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
  imgUrl: string;
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

export interface Tournament {
  tournamentId?: Id;
  tournamentID?: Id;
  id?: Id;
  tournamentName?: string;
  name?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  minParticipants?: number | string;
  maxParticipants?: number | string;
  conditionId?: Id;
  status?: string;
  createdBy?: Id;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface OwnerInvitation {
  invitationId?: Id;
  registrationId?: Id;
  tournamentId?: Id;
  tournamentName?: string;
  horseId?: Id;
  horseName?: string;
  ownerId?: Id;
  ownerName?: string;
  jockeyId?: Id;
  jockeyName?: string;
  message?: string;
  createdAt?: string;
  respondedAt?: string;
  expiredAt?: string;
  status?: string;
  registrationStatus?: string;
}

export interface InviteJockeyPayload {
  tournamentId: number;
  horseId: number;
  jockeyId: number;
  expiredAt?: string | null;
  message?: string | null;
}

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
    fallbackError: 'Không thể tải chi tiết ngựa.'
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

export function getTournaments(): Promise<Tournament[]> {
  return httpRequest<Tournament[]>('/api/tournaments', {
    fallbackError: 'Không thể tải danh sách giải đấu.'
  });
}

export function getOwnerInvitations(): Promise<OwnerInvitation[]> {
  return httpRequest<OwnerInvitation[]>('/api/owner/invitations', {
    fallbackError: 'Không thể tải danh sách lời mời jockey.'
  });
}

export function inviteJockey(payload: InviteJockeyPayload): Promise<OwnerInvitation> {
  return httpRequest<OwnerInvitation, InviteJockeyPayload>('/api/owner/invitations', {
    method: 'POST',
    body: payload,
    fallbackError: 'Gửi lời mời jockey thất bại.'
  });
}

export function cancelOwnerInvitation(invitationId: Id): Promise<OwnerInvitation> {
  return httpRequest<OwnerInvitation>(`/api/owner/invitations/${invitationId}/cancel`, {
    method: 'PUT',
    fallbackError: 'Hủy lời mời jockey thất bại.'
  });
}
