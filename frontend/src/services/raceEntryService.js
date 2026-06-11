import { httpRequest } from '../api/httpClient';

export function createRaceEntry(payload) {
  return httpRequest('/api/admin/race-entries', {
    method: 'POST',
    body: payload
  });
}

export function getRaceEntriesByRace(raceId) {
  return httpRequest(`/api/admin/race-entries/by-race/${raceId}`);
}

export function getRaceEntryAssignmentQueue() {
  return httpRequest('/api/admin/race-entries/assignment-queue');
}

export function getUnassignedRaceEntriesByRound(roundId) {
  return httpRequest(`/api/admin/race-entries/unassigned/by-round/${roundId}`);
}
