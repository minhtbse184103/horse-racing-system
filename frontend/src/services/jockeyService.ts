import { httpRequest } from '../api/httpClient';
import type { Id } from './authService';

export interface JockeyProfile {
  jockeyId?: Id;
  fullName?: string;
  email?: string;
  licenseNo?: string;
  weight?: number | string;
  ranking?: string;
  status?: string;
  rejectionReason?: string | null;
  imgUrl?: string;
}

export interface JockeyProfilePayload {
  licenseNo: string;
  weight: number;
  ranking: string;
  imgUrl: string;
}

export interface JockeyInvitation {
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

export function getJockeyProfile(): Promise<JockeyProfile> {
  return httpRequest<JockeyProfile>('/api/jockey/profile', {
    fallbackError: 'Không thể tải hồ sơ jockey.'
  });
}

export function createJockeyProfile(payload: JockeyProfilePayload): Promise<JockeyProfile> {
  return httpRequest<JockeyProfile, JockeyProfilePayload>('/api/jockey/profile', {
    method: 'POST',
    body: payload,
    fallbackError: 'Không thể tạo hồ sơ jockey.'
  });
}

export function updateJockeyProfile(payload: JockeyProfilePayload): Promise<JockeyProfile> {
  return httpRequest<JockeyProfile, JockeyProfilePayload>('/api/jockey/profile', {
    method: 'PUT',
    body: payload,
    fallbackError: 'Không thể cập nhật hồ sơ jockey.'
  });
}

export function deactivateJockeyProfile(): Promise<JockeyProfile> {
  return httpRequest<JockeyProfile>('/api/jockey/profile/inactive', {
    method: 'PUT',
    fallbackError: 'Không thể vô hiệu hóa hồ sơ jockey.'
  });
}

export function getJockeyInvitations(): Promise<JockeyInvitation[]> {
  return httpRequest<JockeyInvitation[]>('/api/jockey/invitations', {
    fallbackError: 'Không thể tải lời mời jockey.'
  });
}

export function acceptJockeyInvitation(invitationId: Id): Promise<JockeyInvitation> {
  return httpRequest<JockeyInvitation>(`/api/jockey/invitations/${invitationId}/accept`, {
    method: 'PUT',
    fallbackError: 'Không thể chấp nhận lời mời.'
  });
}

export function rejectJockeyInvitation(invitationId: Id): Promise<JockeyInvitation> {
  return httpRequest<JockeyInvitation>(`/api/jockey/invitations/${invitationId}/reject`, {
    method: 'PUT',
    fallbackError: 'Không thể từ chối lời mời.'
  });
}
