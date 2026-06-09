import { httpRequest } from '../api/httpClient';

export interface TournamentCondition {
  conditionId?: number | string;
  conditionID?: number | string;
  id?: number | string;
  conditionName?: string;
  name?: string;
}

export interface Tournament {
  tournamentId?: number | string;
  tournamentID?: number | string;
  id?: number | string;
  tournamentName?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface AcceptedRegistration {
  registrationId?: number | string;
  registrationID?: number | string;
  id?: number | string;
  tournamentName?: string;
  tournamentId?: number | string;
  horseName?: string;
  horseId?: number | string;
  ownerName?: string;
  ownerId?: number | string;
  jockeyName?: string;
  jockeyId?: number | string;
  status?: string;
}

export interface Race {
  raceId?: number | string;
  raceID?: number | string;
  id?: number | string;
  raceName?: string;
  roundId?: number | string;
  roundID?: number | string;
  round?: { roundId?: number | string };
  startTime?: string;
  endTime?: string;
  distance?: number | string;
  status?: string;
}

export interface TournamentRound {
  roundId?: number | string;
  roundID?: number | string;
  id?: number | string;
  tournamentId?: number | string;
  tournamentID?: number | string;
  roundName?: string;
  roundOrder?: number;
  status?: string;
}

export interface CreateTournamentPayload {
  tournamentName: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  minParticipants: number;
  maxParticipants: number;
  conditionId: number | null;
}

export interface CreateRacePayload {
  roundId: number;
  startTime: string;
  endTime: string;
  distance: number;
}

export function getTournamentConditions() {
  return httpRequest<TournamentCondition[]>('/api/tournament-conditions', {
    fallbackError: 'Khong the tai danh sach dieu kien giai dau.'
  });
}

export function getTournaments() {
  return httpRequest<Tournament[]>('/api/tournaments', {
    fallbackError: 'Khong the tai danh sach giai dau.'
  });
}

export function getTournamentRounds(tournamentId: number | string) {
  return httpRequest<TournamentRound[]>(`/api/tournament-rounds/by-tournament/${tournamentId}`, {
    fallbackError: 'Khong the tai danh sach round.'
  });
}

export function getAcceptedRegistrations() {
  return httpRequest<AcceptedRegistration[]>('/api/admin/registrations/accepted', {
    fallbackError: 'Khong the tai danh sach dang ky.'
  });
}

export function getRaces() {
  return httpRequest<Race[]>('/api/races', {
    fallbackError: 'Khong the tai danh sach race.'
  });
}

export function createTournament(payload: CreateTournamentPayload) {
  return httpRequest('/api/tournaments', {
    method: 'POST',
    body: payload,
    fallbackError: 'Tao giai dau that bai.'
  });
}

export function openTournamentRegistration(tournamentId: number | string) {
  return httpRequest<Tournament>(`/api/tournaments/${tournamentId}/open-registration`, {
    method: 'PUT',
    fallbackError: 'Khong the mo dang ky giai dau.'
  });
}

export function confirmRegistration(registrationId: number | string) {
  return httpRequest<AcceptedRegistration>(`/api/admin/registrations/${registrationId}/confirm`, {
    method: 'PUT',
    fallbackError: 'Duyet don dang ky that bai.'
  });
}

export function rejectRegistration(registrationId: number | string) {
  return httpRequest<AcceptedRegistration>(`/api/admin/registrations/${registrationId}/reject`, {
    method: 'PUT',
    fallbackError: 'Tu choi don dang ky that bai.'
  });
}

export function createRace(payload: CreateRacePayload) {
  return httpRequest('/api/races', {
    method: 'POST',
    body: payload,
    fallbackError: 'Tao race that bai.'
  });
}
