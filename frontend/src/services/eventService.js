import { httpRequest } from '../api/httpClient';

export function getTournamentConditions() {
  return httpRequest('/api/tournament-conditions');
}

export function getTournaments() {
  return httpRequest('/api/tournaments');
}

export function getPublicTournaments() {
  return httpRequest('/api/tournaments', { auth: false });
}

export function getPublicTournamentConditions() {
  return httpRequest('/api/tournament-conditions', { auth: false });
}

export function createTournament(payload) {
  return httpRequest('/api/tournaments', {
    method: 'POST',
    body: payload
  });
}

export function updateTournament(tournamentId, payload) {
  return httpRequest(`/api/tournaments/${tournamentId}`, {
    method: 'PUT',
    body: payload
  });
}

export function openTournamentRegistration(tournamentId) {
  return httpRequest(`/api/tournaments/${tournamentId}/open-registration`, {
    method: 'PUT'
  });
}

export function cancelTournament(tournamentId) {
  return httpRequest(`/api/tournaments/${tournamentId}`, {
    method: 'DELETE'
  });
}

export function getTournamentRounds(tournamentId) {
  return httpRequest(`/api/tournament-rounds/by-tournament/${tournamentId}`);
}

export function getRacesByRound(roundId) {
  return httpRequest(`/api/races/by-round/${roundId}`);
}

export function createRace(payload) {
  return httpRequest('/api/races', {
    method: 'POST',
    body: payload
  });
}

export function updateRace(raceId, payload) {
  return httpRequest(`/api/races/${raceId}`, {
    method: 'PUT',
    body: payload
  });
}

export function cancelRace(raceId) {
  return httpRequest(`/api/races/${raceId}`, {
    method: 'DELETE'
  });
}
