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
    fallbackError: 'Unable to load the jockey profile.'
  });
}

export function createJockeyProfile(payload: JockeyProfilePayload): Promise<JockeyProfile> {
  return httpRequest<JockeyProfile, JockeyProfilePayload>('/api/jockey/profile', {
    method: 'POST',
    body: payload,
    fallbackError: 'Unable to create the jockey profile.'
  });
}

export function updateJockeyProfile(payload: JockeyProfilePayload): Promise<JockeyProfile> {
  return httpRequest<JockeyProfile, JockeyProfilePayload>('/api/jockey/profile', {
    method: 'PUT',
    body: payload,
    fallbackError: 'Unable to update the jockey profile.'
  });
}

export function deactivateJockeyProfile(): Promise<JockeyProfile> {
  return httpRequest<JockeyProfile>('/api/jockey/profile/inactive', {
    method: 'PUT',
    fallbackError: 'Unable to deactivate the jockey profile.'
  });
}

export function getJockeyInvitations(): Promise<JockeyInvitation[]> {
  return httpRequest<JockeyInvitation[]>('/api/jockey/invitations', {
    fallbackError: 'Unable to load jockey invitations.'
  });
}

export function acceptJockeyInvitation(invitationId: Id): Promise<JockeyInvitation> {
  return httpRequest<JockeyInvitation>(`/api/jockey/invitations/${invitationId}/accept`, {
    method: 'PUT',
    fallbackError: 'Unable to accept the invitation.'
  });
}

export function rejectJockeyInvitation(invitationId: Id): Promise<JockeyInvitation> {
  return httpRequest<JockeyInvitation>(`/api/jockey/invitations/${invitationId}/reject`, {
    method: 'PUT',
    fallbackError: 'Unable to reject the invitation.'
  });
}
