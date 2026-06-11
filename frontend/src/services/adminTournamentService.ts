import { httpRequest } from '../api/httpClient';
import type { Id } from './authService';

export interface TournamentCondition {
  conditionId?: Id;
  conditionID?: Id;
  id?: Id;
  conditionName?: string;
  name?: string;
  maxHorseWeight?: number | string;
  maxJockeyWeight?: number | string;
  description?: string;
}

export interface Tournament {
  tournamentId?: Id;
  tournamentID?: Id;
  id?: Id;
  tournamentName?: string;
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
}

export interface AcceptedRegistration {
  registrationId?: Id;
  registrationID?: Id;
  id?: Id;
  tournamentName?: string;
  tournamentId?: Id;
  horseName?: string;
  horseId?: Id;
  ownerName?: string;
  ownerId?: Id;
  jockeyName?: string;
  jockeyId?: Id;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Race {
  raceId?: Id;
  raceID?: Id;
  id?: Id;
  roundId?: Id;
  roundID?: Id;
  round?: { roundId?: Id };
  raceName?: string;
  startTime?: string;
  endTime?: string;
  raceOrder?: number | string;
  distance?: number | string;
  status?: string;
}

export interface TournamentRound {
  roundId?: Id;
  roundID?: Id;
  id?: Id;
  tournamentId?: Id;
  tournamentID?: Id;
  roundName?: string;
  roundOrder?: number | string;
  status?: string;
}

export interface RaceEntry {
  raceEntryId?: Id;
  raceEntryID?: Id;
  id?: Id;
  raceId?: Id;
  raceID?: Id;
  registrationId?: Id;
  registrationID?: Id;
  laneNumber?: number | string;
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

export type UpdateTournamentPayload = CreateTournamentPayload;

export interface CreateRacePayload {
  roundId: number;
  startTime: string;
  endTime: string;
  distance: number;
}

export interface UpdateRacePayload {
  startTime: string;
  endTime: string;
  distance: number;
}

export interface CreateRaceEntryPayload {
  raceId: number;
  registrationId: number;
}

export function getTournamentConditions() {
  return httpRequest<TournamentCondition[]>('/api/tournament-conditions', { fallbackError: 'Không thể tải danh sách điều kiện giải đấu.' });
}
export function getTournamentConditionById(conditionId: Id) {
  return httpRequest<TournamentCondition>(`/api/tournament-conditions/${conditionId}`, { fallbackError: 'Không thể tải điều kiện giải đấu.' });
}
export function getTournaments() {
  return httpRequest<Tournament[]>('/api/tournaments', { fallbackError: 'Không thể tải danh sách giải đấu.' });
}
export function getTournamentById(tournamentId: Id) {
  return httpRequest<Tournament>(`/api/tournaments/${tournamentId}`, { fallbackError: 'Không thể tải thông tin giải đấu.' });
}
export function createTournament(payload: CreateTournamentPayload) {
  return httpRequest<Tournament, CreateTournamentPayload>('/api/tournaments', { method: 'POST', body: payload, fallbackError: 'Tạo giải đấu thất bại.' });
}
export function updateTournament(tournamentId: Id, payload: UpdateTournamentPayload) {
  return httpRequest<Tournament, UpdateTournamentPayload>(`/api/tournaments/${tournamentId}`, { method: 'PUT', body: payload, fallbackError: 'Cập nhật giải đấu thất bại.' });
}
export function openTournamentRegistration(tournamentId: Id) {
  return httpRequest<Tournament>(`/api/tournaments/${tournamentId}/open-registration`, { method: 'PUT', fallbackError: 'Không thể mở đăng ký giải đấu.' });
}
export function cancelTournament(tournamentId: Id) {
  return httpRequest<Tournament>(`/api/tournaments/${tournamentId}`, { method: 'DELETE', fallbackError: 'Không thể hủy giải đấu.' });
}
export function getTournamentRounds(tournamentId: Id) {
  return httpRequest<TournamentRound[]>(`/api/tournament-rounds/by-tournament/${tournamentId}`, { fallbackError: 'Không thể tải danh sách round.' });
}
export function getTournamentRoundById(roundId: Id) {
  return httpRequest<TournamentRound>(`/api/tournament-rounds/${roundId}`, { fallbackError: 'Không thể tải round.' });
}
export function getAcceptedRegistrations() {
  return httpRequest<AcceptedRegistration[]>('/api/admin/registrations/accepted', { fallbackError: 'Không thể tải danh sách đăng ký ACCEPTED.' });
}
export function getRegistrationHistory() {
  return httpRequest<AcceptedRegistration[]>('/api/admin/registrations/history', { fallbackError: 'Không thể tải lịch sử đăng ký.' });
}
export function confirmRegistration(registrationId: Id) {
  return httpRequest<AcceptedRegistration>(`/api/admin/registrations/${registrationId}/confirm`, { method: 'PUT', fallbackError: 'Duyệt đơn đăng ký thất bại.' });
}
export function rejectRegistration(registrationId: Id) {
  return httpRequest<AcceptedRegistration>(`/api/admin/registrations/${registrationId}/reject`, { method: 'PUT', fallbackError: 'Từ chối đơn đăng ký thất bại.' });
}
export function getRaces() {
  return httpRequest<Race[]>('/api/races', { fallbackError: 'Không thể tải danh sách race.' });
}
export function getRaceById(raceId: Id) {
  return httpRequest<Race>(`/api/races/${raceId}`, { fallbackError: 'Không thể tải race.' });
}
export function getRacesByTournament(tournamentId: Id) {
  return httpRequest<Race[]>(`/api/races/by-tournament/${tournamentId}`, { fallbackError: 'Không thể tải race theo tournament.' });
}
export function getRacesByRound(roundId: Id) {
  return httpRequest<Race[]>(`/api/races/by-round/${roundId}`, { fallbackError: 'Không thể tải race theo round.' });
}
export function createRace(payload: CreateRacePayload) {
  return httpRequest<Race, CreateRacePayload>('/api/races', { method: 'POST', body: payload, fallbackError: 'Tạo race thất bại.' });
}
export function updateRace(raceId: Id, payload: UpdateRacePayload) {
  return httpRequest<Race, UpdateRacePayload>(`/api/races/${raceId}`, { method: 'PUT', body: payload, fallbackError: 'Cập nhật race thất bại.' });
}
export function cancelRace(raceId: Id) {
  return httpRequest<Race>(`/api/races/${raceId}`, { method: 'DELETE', fallbackError: 'Hủy race thất bại.' });
}
export function getRaceEntriesByRace(raceId: Id) {
  return httpRequest<RaceEntry[]>(`/api/admin/race-entries/by-race/${raceId}`, { fallbackError: 'Không thể tải race entry.' });
}
export function createRaceEntry(payload: CreateRaceEntryPayload) {
  return httpRequest<RaceEntry, CreateRaceEntryPayload>('/api/admin/race-entries', { method: 'POST', body: payload, fallbackError: 'Tạo race entry thất bại.' });
}
