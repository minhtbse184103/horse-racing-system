import { httpRequest } from '../api/httpClient';

export function getTournamentConditions() {
  return httpRequest('/api/tournament-conditions');
}

export function getTournaments() {
  return httpRequest('/api/tournaments');
}

export function getTournamentById(tournamentId) {
  return httpRequest(`/api/tournaments/${tournamentId}`);
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

export function uploadTournamentVenueImage(tournamentId, file) {
  const formData = new FormData();
  formData.append('file', file);

  return httpRequest(`/api/tournaments/${tournamentId}/venue-image`, {
    method: 'POST',
    body: formData
  });
}

export function removeTournamentVenueImage(tournamentId) {
  return httpRequest(`/api/tournaments/${tournamentId}/venue-image`, {
    method: 'DELETE'
  });
}

export function closeTournamentRegistration(tournamentId) {
  return httpRequest(`/api/tournaments/${tournamentId}/close-registration`, {
    method: 'PUT'
  });
}

export function completeTournament(tournamentId) {
  return httpRequest(`/api/tournaments/${tournamentId}/complete`, {
    method: 'PUT'
  });
}

export function cancelTournament(tournamentId) {
  return httpRequest(`/api/tournaments/${tournamentId}`, {
    method: 'DELETE'
  });
}

export function getRacesByTournament(tournamentId) {
  return httpRequest(`/api/races/by-tournament/${tournamentId}`);
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
