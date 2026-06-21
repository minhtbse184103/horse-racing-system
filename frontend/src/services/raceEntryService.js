import { httpRequest } from '../api/httpClient';

export function createRaceEntry({ raceId, registrationId }) {
  return httpRequest('/api/admin/race-entries', {
    method: 'POST',
    body: {
      raceId: Number(raceId),
      registrationId: Number(registrationId)
    }
  });
}

export function getRaceEntriesByRace(raceId) {
  return httpRequest(`/api/admin/race-entries/by-race/${raceId}`);
}

export function getAssignmentQueue() {
  return httpRequest('/api/admin/race-entries/assignment-queue');
}

export function getAssignmentQueueByTournament(tournamentId) {
  return httpRequest(`/api/admin/race-entries/assignment-queue/by-tournament/${tournamentId}`);
}

export function cancelRaceEntry(raceEntryId, cancellationReason) {
  return httpRequest(`/api/admin/race-entries/${raceEntryId}/cancel`, {
    method: 'PUT',
    body: { cancellationReason }
  });
}
